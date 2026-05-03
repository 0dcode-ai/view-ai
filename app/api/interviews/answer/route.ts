import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeExpression } from "@/lib/analytics";
import { generateInterviewQuestion, reviewAnswer } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { isInterviewMode, isRoundType } from "@/lib/interview-modes";
import { serializeInterviewSession, serializeTurn } from "@/lib/serializers";
import { safeJsonParse, tagsFromJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sessionId: z.number().int().positive(),
  turnId: z.number().int().positive().optional(),
  answer: z.string().min(1),
  transcriptSource: z.enum(["text", "voice"]).default("text"),
  answerDurationSec: z.number().int().positive().optional(),
  audioMeta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "回答不能为空。" }, { status: 400 });
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

  const openTurn =
    session.turns.find((turn) => turn.id === parsed.data.turnId) ??
    [...session.turns].reverse().find((turn) => !turn.answer);

  if (!openTurn) {
    return NextResponse.json({ error: "没有待回答的问题。" }, { status: 409 });
  }

  const expression = analyzeExpression(parsed.data.answer, parsed.data.answerDurationSec);
  const updatedTurns = session.turns.map((turn) =>
    turn.id === openTurn.id
      ? {
          ...turn,
          answer: parsed.data.answer.trim(),
          transcriptSource: parsed.data.transcriptSource,
          answerDurationSec: parsed.data.answerDurationSec ?? null,
          expressionJson: JSON.stringify(expression),
        }
      : turn,
  );
  const knowledgeCards = await prisma.knowledgeCard.findMany({
    where: session.targetCompanyId ? { OR: [{ companyId: session.targetCompanyId }, { companyId: null }] } : {},
    include: { company: true, topic: true },
    orderBy: [{ priorityScore: "desc" }, { mastery: "asc" }, { updatedAt: "desc" }],
    take: 12,
  });

  const context = {
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
    candidatePrep: session.resumeProfile ? safeJsonParse(session.resumeProfile.candidatePrepJson, null) : null,
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
    turns: updatedTurns.map((turn) => ({
      order: turn.order,
      question: turn.question,
      answer: turn.answer,
      source: turn.questionSource,
      score: safeJsonParse(turn.scoreJson, {}),
    })),
  };

  const review = await reviewAnswer(context);
  const answeredTurn = await prisma.interviewTurn.update({
    where: { id: openTurn.id },
    data: {
      answer: parsed.data.answer.trim(),
      feedback: review.feedback,
      betterAnswer: review.betterAnswer,
      transcriptSource: parsed.data.transcriptSource,
      answerDurationSec: parsed.data.answerDurationSec,
      audioMetaJson: JSON.stringify(parsed.data.audioMeta ?? {}),
      expressionJson: JSON.stringify(expression),
      scoreJson: JSON.stringify(review.score),
    },
  });

  const answeredCount = updatedTurns.filter((turn) => turn.answer).length;
  const shouldFinish = answeredCount >= 5;
  let nextTurn = null;

  if (!shouldFinish) {
    const nextQuestion = await generateInterviewQuestion(context);
    nextTurn = await prisma.interviewTurn.create({
      data: {
        sessionId: session.id,
        order: Math.max(...session.turns.map((turn) => turn.order)) + 1,
        question: nextQuestion.question,
        questionSource: nextQuestion.source,
      },
    });
  }

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
    answeredTurn: serializeTurn(answeredTurn),
    nextTurn: nextTurn ? serializeTurn(nextTurn) : null,
    shouldFinish,
    session: serializeInterviewSession(refreshed),
  });
}
