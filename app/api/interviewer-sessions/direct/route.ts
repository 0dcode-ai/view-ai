import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildDirectInterviewerTurnDrafts,
  buildInterviewerContext,
  buildInterviewerPlan,
  finishInterviewerSession,
  markPrimaryAsked,
  reviewTurnAnswer,
  type MockInterviewTurn,
} from "@/lib/mock-interviewer";
import { findOrCreateCompany } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { serializeInterviewSession } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  input: z.string().trim().min(20),
  resumeProfileId: z.number().int().positive().optional(),
  jdText: z.string().optional(),
  targetRole: z.string().optional(),
  targetCompanyName: z.string().optional(),
  seniority: z.enum(["junior", "mid", "senior", "staff"]).default("mid"),
  durationMinutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(45)]).default(20),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请至少输入一段 20 字以上的简历、回答纪要或候选人材料。" }, { status: 400 });
  }

  const resume = parsed.data.resumeProfileId
    ? await prisma.resumeProfile.findUnique({ where: { id: parsed.data.resumeProfileId } })
    : null;
  if (parsed.data.resumeProfileId && !resume) {
    return NextResponse.json({ error: "简历不存在。" }, { status: 404 });
  }

  const rawInput = parsed.data.input.trim();
  const resumeText = resume?.rawText || rawInput;
  const company = await findOrCreateCompany(parsed.data.targetCompanyName);
  const context = buildInterviewerContext({
    resumeText,
    resumeProfile: resume
      ? {
          parsed: JSON.parse(resume.parsedJson || "{}"),
        }
      : null,
    jdText: parsed.data.jdText,
    targetRole: parsed.data.targetRole,
    seniority: parsed.data.seniority,
    durationMinutes: parsed.data.durationMinutes,
  });
  let plan = buildInterviewerPlan(context);
  const directTurns = buildDirectInterviewerTurnDrafts({ plan, context, rawInput });
  if (!directTurns.length) {
    return NextResponse.json({ error: "输入信息不足，无法生成面试官直出结果。" }, { status: 400 });
  }
  for (const turn of directTurns) {
    plan = markPrimaryAsked(plan, turn.topicId);
  }

  const previewTurns = directTurns.map((turn) => ({
    id: turn.order,
    order: turn.order,
    question: turn.question,
    questionSource: turn.questionSource,
    turnType: turn.turnType,
    parentTurnId: null,
    intent: turn.intent,
    answer: turn.answer,
    feedback: null,
    betterAnswer: null,
    idealAnswer: turn.idealAnswer,
    transcriptSource: "text",
    answerDurationSec: null,
    expression: {},
    score: {},
    review: null,
  })) satisfies MockInterviewTurn[];
  const summary = finishInterviewerSession(previewTurns, context);

  const session = await prisma.interviewSession.create({
    data: {
      mode: "mixed",
      roundType: "first_round",
      deliveryMode: "text",
      targetRole: context.targetRole,
      targetCompanyId: company?.id,
      resumeProfileId: resume?.id,
      status: "finished",
      summary: summary.summary,
      scoreJson: JSON.stringify({
        overall: summary.overallScore,
        ...summary.dimensionAverages,
      }),
      contextJson: JSON.stringify(context),
      configJson: JSON.stringify({
        sessionKind: "mock_interviewer",
        answerVisibility: "toggle",
        scoringTiming: "final_only",
        inputMode: "text",
      }),
      planJson: JSON.stringify(plan),
      expressionJson: JSON.stringify({
        agentName: "mock-interviewer",
        directMode: true,
        strengths: summary.strengths,
        nextActions: summary.nextActions,
        interviewerSummary: summary,
      }),
      turns: {
        create: directTurns.map((turn) => {
          const persistedLikeTurn: MockInterviewTurn = {
            id: turn.order,
            order: turn.order,
            question: turn.question,
            questionSource: turn.questionSource,
            turnType: turn.turnType,
            parentTurnId: null,
            intent: turn.intent,
            answer: turn.answer,
            feedback: null,
            betterAnswer: null,
            idealAnswer: turn.idealAnswer,
            transcriptSource: "text",
            answerDurationSec: null,
            expression: {},
            score: {},
            review: null,
          };
          const review = reviewTurnAnswer(persistedLikeTurn, context);
          return {
            order: turn.order,
            question: turn.question,
            questionSource: turn.questionSource,
            turnType: turn.turnType,
            intent: turn.intent,
            idealAnswer: turn.idealAnswer,
            answer: turn.answer,
            transcriptSource: "text",
            feedback: review.feedback,
            betterAnswer: review.betterAnswer,
            scoreJson: JSON.stringify(review.dimensions),
            reviewJson: JSON.stringify(review),
          };
        }),
      },
    },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: { orderBy: { order: "asc" } },
    },
  });

  const persistedSummary = {
    ...summary,
    turns: session.turns.map((turn) => {
      const source = summary.turns.find((item) => item.order === turn.order);
      return {
        turnId: turn.id,
        order: turn.order,
        question: turn.question,
        answer: turn.answer,
        score: source?.score ?? 0,
        feedback: source?.feedback ?? turn.feedback ?? "",
        idealAnswer: source?.idealAnswer ?? turn.idealAnswer ?? "",
        missedPoints: source?.missedPoints ?? [],
      };
    }),
    questionReviews: summary.questionReviews.map((review) => {
      const persistedTurn = session.turns.find((turn) => turn.order === review.order);
      return {
        ...review,
        turnId: persistedTurn?.id ?? review.turnId,
      };
    }),
  };

  await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      expressionJson: JSON.stringify({
        agentName: "mock-interviewer",
        directMode: true,
        strengths: persistedSummary.strengths,
        nextActions: persistedSummary.nextActions,
        interviewerSummary: persistedSummary,
      }),
    },
  });
  const refreshed = await prisma.interviewSession.findUniqueOrThrow({
    where: { id: session.id },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({
    session: serializeInterviewSession(refreshed),
    summary: persistedSummary,
  }, { status: 201 });
}
