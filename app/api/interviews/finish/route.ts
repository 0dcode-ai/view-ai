import { NextResponse } from "next/server";
import { z } from "zod";
import { averageScore } from "@/lib/analytics";
import { finishInterview } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { isInterviewMode, isRoundType } from "@/lib/interview-modes";
import { serializeInterviewSession, serializeReviewCard } from "@/lib/serializers";
import { safeJsonParse, tagsFromJson, tagsToJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sessionId: z.number().int().positive(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "缺少面试记录。" }, { status: 400 });
  }

  const session = await prisma.interviewSession.findUnique({
    where: { id: parsed.data.sessionId },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: { orderBy: { order: "asc" } },
    },
  });

  if (!session || !isInterviewMode(session.mode) || !isRoundType(session.roundType)) {
    return NextResponse.json({ error: "面试不存在。" }, { status: 404 });
  }

  const knowledgeCards = await prisma.knowledgeCard.findMany({
    where: session.targetCompanyId ? { OR: [{ companyId: session.targetCompanyId }, { companyId: null }] } : {},
    include: { company: true, topic: true },
    orderBy: [{ priorityScore: "desc" }, { mastery: "asc" }, { updatedAt: "desc" }],
    take: 12,
  });

  const review = await finishInterview({
    mode: session.mode,
    roundType: session.roundType,
    targetCompany: session.company?.name,
    targetRole: session.targetRole,
    jobTarget: session.jobTarget
      ? {
          ...safeJsonParse(session.jobTarget.parsedJson, {
            responsibilities: [],
            requiredSkills: [],
            bonusSkills: [],
            riskPoints: [],
            interviewFocus: [],
          }),
          match: safeJsonParse(session.jobTarget.matchJson, {
            matchScore: 0,
            strengths: [],
            gaps: [],
            projectTalkTracks: [],
          }),
        }
      : null,
    resume: session.resumeProfile ? safeJsonParse(session.resumeProfile.parsedJson, null) : null,
    knowledgeCards: knowledgeCards.map((card) => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
      company: card.company?.name,
      topic: card.topic?.name,
      tags: tagsFromJson(card.tagsJson),
      mastery: card.mastery,
      priorityScore: card.priorityScore,
      abilityDimension: card.abilityDimension,
    })),
    turns: session.turns.map((turn) => ({
      order: turn.order,
      question: turn.question,
      answer: turn.answer,
      source: turn.questionSource,
      score: safeJsonParse(turn.scoreJson, {}),
    })),
  });

  await prisma.reviewCard.deleteMany({ where: { sessionId: session.id } });
  const lowTurnBackflow = await buildBackflow(session, knowledgeCards);

  const transactionResult = await prisma.$transaction([
    prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        status: "finished",
        summary: review.summary,
        scoreJson: JSON.stringify(review.score),
        expressionJson: JSON.stringify({ advice: review.expressionAdvice, topicWeaknesses: review.topicWeaknesses }),
      },
    }),
    ...review.reviewCards.map((card) =>
      prisma.reviewCard.create({
        data: {
          sessionId: session.id,
          title: card.title,
          weakness: card.weakness,
          suggestion: card.suggestion,
          priority: card.priority,
          tagsJson: tagsToJson(card.tags),
        },
      }),
    ),
    ...lowTurnBackflow.reviewCards.map((card) =>
      prisma.reviewCard.create({
        data: card,
      }),
    ),
    ...lowTurnBackflow.cardUpdates.map((update) =>
      prisma.knowledgeCard.update({
        where: { id: update.id },
        data: update.data,
      }),
    ),
    ...lowTurnBackflow.missingCards.map((card) =>
      prisma.knowledgeCard.create({
        data: card,
      }),
    ),
  ]);
  const reviewCreateCount = review.reviewCards.length + lowTurnBackflow.reviewCards.length;
  const createdCardIds = transactionResult
    .slice(1, 1 + reviewCreateCount)
    .map((item) => (typeof item === "object" && item !== null && "id" in item ? Number(item.id) : null))
    .filter((id): id is number => Number.isInteger(id));

  const refreshed = await prisma.interviewSession.findUniqueOrThrow({
    where: { id: session.id },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: { orderBy: { order: "asc" } },
    },
  });
  const reviewCards = await prisma.reviewCard.findMany({
    where: { id: { in: createdCardIds } },
    include: {
      knowledgeCard: { include: { company: true, topic: true } },
      session: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    session: serializeInterviewSession(refreshed),
    reviewCards: reviewCards.map(serializeReviewCard),
  });
}

type SessionForBackflow = {
  id: number;
  targetCompanyId: number | null;
  targetRole: string | null;
  turns: Array<{
    order: number;
    question: string;
    answer: string | null;
    feedback: string | null;
    betterAnswer: string | null;
    questionSource: string | null;
    scoreJson: string;
  }>;
};

type KnowledgeForBackflow = Array<{
    id: number;
    question: string;
    companyId: number | null;
    mastery: number;
    mistakeCount: number;
    priorityScore: number;
  }>;

async function buildBackflow(session: SessionForBackflow, knowledgeCards: KnowledgeForBackflow) {
  const reviewCards: Array<{
    sessionId: number;
    knowledgeCardId?: number;
    title: string;
    weakness: string;
    suggestion: string;
    priority: number;
    tagsJson: string;
  }> = [];
  const cardUpdates: Array<{
    id: number;
    data: { mistakeCount: number; mastery: number; priorityScore: number; nextReviewAt: Date };
  }> = [];
  const missingCards: Array<{
    question: string;
    answer: string;
    companyId: number | null;
    roleDirection: string | null;
    questionType: string;
    abilityDimension: string;
    mastery: number;
    mistakeCount: number;
    priorityScore: number;
    tagsJson: string;
    difficulty: string;
    source: string;
    note: string;
  }> = [];

  for (const turn of session.turns ?? []) {
    if (!turn.answer) {
      continue;
    }
    const score = averageScore(safeJsonParse<Record<string, number>>(turn.scoreJson, {}));
    const isLow = score > 0 ? score <= 3 : turn.answer.length < 80;
    if (!isLow) {
      continue;
    }

    const related = knowledgeCards.find((card) => turn.question.includes(card.question));
    const tags = tagsToJson([turn.questionSource || "模拟面试", "错题回流"]);
    reviewCards.push({
      sessionId: session.id,
      knowledgeCardId: related?.id,
      title: `错题回流：第 ${turn.order} 题`,
      weakness: turn.feedback || "本题回答偏弱，需要重新组织答案。",
      suggestion: turn.betterAnswer || "补充定义、原理、项目场景、风险和量化结果。",
      priority: 90,
      tagsJson: tags,
    });

    if (related) {
      cardUpdates.push({
        id: related.id,
        data: {
          mistakeCount: related.mistakeCount + 1,
          mastery: Math.max(0, related.mastery - 1),
          priorityScore: Math.min(100, related.priorityScore + 10),
          nextReviewAt: new Date(),
        },
      });
    } else {
      missingCards.push({
        question: turn.question,
        answer: "待补充：根据本次模拟面试回流，请补完整参考答案。",
        companyId: session.targetCompanyId,
        roleDirection: session.targetRole,
        questionType: turn.questionSource === "resume" ? "项目追问" : turn.questionSource === "jd" ? "JD 追问" : "八股",
        abilityDimension: turn.questionSource === "resume" ? "项目深度" : "待补齐",
        mastery: 0,
        mistakeCount: 1,
        priorityScore: 85,
        tagsJson: tags,
        difficulty: "medium",
        source: "模拟面试错题回流",
        note: "系统根据低分回答自动生成，请补充参考答案。",
      });
    }
  }

  return { reviewCards, cardUpdates, missingCards };
}
