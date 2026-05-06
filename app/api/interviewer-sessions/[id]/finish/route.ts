import { NextResponse } from "next/server";
import {
  finishInterviewerSession,
  reviewTurnAnswer,
  type InterviewerSessionContext,
  type MockInterviewTurn,
} from "@/lib/mock-interviewer";
import { prisma } from "@/lib/db";
import { serializeInterviewSession } from "@/lib/serializers";
import { safeJsonParse } from "@/lib/tags";

export const dynamic = "force-dynamic";

function normalizeTurnType(value: string | null): MockInterviewTurn["turnType"] {
  return value === "primary" || value === "followup" || value === "discussion" ? value : null;
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const sessionId = Number(rawId);

  if (!Number.isInteger(sessionId)) {
    return NextResponse.json({ error: "面试 ID 无效。" }, { status: 400 });
  }

  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: { orderBy: { order: "asc" } },
    },
  });
  if (!session) {
    return NextResponse.json({ error: "面试不存在。" }, { status: 404 });
  }
  const config = safeJsonParse<{ sessionKind?: string }>(session.configJson, {});
  if (config.sessionKind !== "mock_interviewer") {
    return NextResponse.json({ error: "这不是面试官 Agent 会话。" }, { status: 409 });
  }

  const interviewerContext = safeJsonParse<InterviewerSessionContext>(session.contextJson, {
    resumeText: "",
    parsedResume: { summary: "", skills: [], experiences: [], projects: [], followUpQuestions: [] },
    jdText: null,
    jdKeywords: [],
    targetRole: session.targetRole,
    seniority: "mid",
    durationMinutes: 20,
  });
  const turns = session.turns.map((turn) => ({
    ...turn,
    turnType: normalizeTurnType(turn.turnType),
    expression: {},
    score: {},
    review: null,
  })) as MockInterviewTurn[];
  const summary = finishInterviewerSession(turns, interviewerContext);

  await prisma.$transaction([
    ...session.turns.filter((turn) => turn.answer).map((turn) => {
      const review = reviewTurnAnswer({
        ...turn,
        turnType: normalizeTurnType(turn.turnType),
        expression: {},
        score: {},
        review: null,
      }, interviewerContext);
      return prisma.interviewTurn.update({
        where: { id: turn.id },
        data: {
          feedback: review.feedback,
          betterAnswer: review.betterAnswer,
          scoreJson: JSON.stringify(review.dimensions),
          reviewJson: JSON.stringify(review),
        },
      });
    }),
    prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "finished",
        summary: summary.summary,
        scoreJson: JSON.stringify({
          overall: summary.overallScore,
          ...summary.dimensionAverages,
        }),
        expressionJson: JSON.stringify({
          agentName: "mock-interviewer",
          strengths: summary.strengths,
          nextActions: summary.nextActions,
        }),
      },
    }),
  ]);

  const refreshed = await prisma.interviewSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({
    session: serializeInterviewSession(refreshed),
    summary,
  });
}
