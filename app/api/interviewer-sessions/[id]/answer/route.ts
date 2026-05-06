import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appendFollowUp,
  summarizeDiscussionTitle,
  shouldAskFollowUp,
  type InterviewerSessionContext,
  type InterviewerSessionPlan,
  type MockInterviewTurn,
} from "@/lib/mock-interviewer";
import { prisma } from "@/lib/db";
import { serializeInterviewSession, serializeTurn } from "@/lib/serializers";
import { safeJsonParse } from "@/lib/tags";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  answer: z.string().min(1),
  turnId: z.number().int().positive().optional(),
  mode: z.enum(["turn", "discussion"]).default("turn"),
  title: z.string().optional(),
  sourceTurnId: z.number().int().positive().optional(),
  transcriptSource: z.literal("text").default("text"),
  answerDurationSec: z.number().int().positive().optional(),
});

function normalizeTurnType(value: string | null): MockInterviewTurn["turnType"] {
  return value === "primary" || value === "followup" || value === "discussion" ? value : null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const [{ id: rawId }, parsed] = await Promise.all([context.params, bodySchema.safeParseAsync(await request.json())]);
  const sessionId = Number(rawId);

  if (!Number.isInteger(sessionId) || !parsed.success) {
    return NextResponse.json({ error: "回答参数无效。" }, { status: 400 });
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

  const focusTurn = parsed.data.turnId
    ? session.turns.find((turn) => turn.id === parsed.data.turnId) ?? null
    : null;

  if (parsed.data.mode === "discussion") {
    const discussionTurn = await prisma.interviewTurn.create({
      data: {
        sessionId,
        order: Math.max(...session.turns.map((turn) => turn.order), 0) + 1,
        question: parsed.data.title?.trim() || summarizeDiscussionTitle(parsed.data.answer),
        questionSource: "discussion",
        turnType: "discussion",
        parentTurnId: null,
        intent: "自由讨论",
        idealAnswer: "围绕自由讨论中的关键判断、事实依据、结果和复盘补足上下文。",
        answer: parsed.data.answer.trim(),
        transcriptSource: parsed.data.transcriptSource,
        answerDurationSec: parsed.data.answerDurationSec,
      },
    });

    const refreshedDiscussion = await prisma.interviewSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        company: true,
        jobTarget: { include: { company: true, resumeProfile: true } },
        resumeProfile: true,
        turns: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({
      session: serializeInterviewSession(refreshedDiscussion),
      answeredTurn: serializeTurn(discussionTurn),
      nextTurn: null,
      shouldFinish: false,
    });
  }

  if (!focusTurn) {
    return NextResponse.json({ error: "请先选择一个主问题或追问卡片。" }, { status: 409 });
  }

  const answeredTurn = await prisma.interviewTurn.update({
    where: { id: focusTurn.id },
    data: {
      answer: parsed.data.answer.trim(),
      transcriptSource: parsed.data.transcriptSource,
      answerDurationSec: parsed.data.answerDurationSec,
    },
  });

  const interviewerContext = safeJsonParse<InterviewerSessionContext>(session.contextJson, {
    resumeText: "",
    parsedResume: { summary: "", skills: [], experiences: [], projects: [], followUpQuestions: [] },
    jdText: null,
    jdKeywords: [],
    targetRole: session.targetRole,
    seniority: "mid",
    durationMinutes: 20,
  });
  const fallbackPlan = {
    durationMinutes: 20,
    turnBudget: 7,
    primaryQuestionBudget: 5,
    followUpBudget: 2,
    askedPrimaryCount: 0,
    askedFollowUpCount: 0,
    requiredProjectDeepDive: true,
    projectDeepDiveCovered: true,
    jdRequiredQuestionTarget: 0,
    jdRequiredQuestionCount: 0,
    currentTopicId: null,
    topics: [] as InterviewerSessionPlan["topics"],
  } satisfies InterviewerSessionPlan;
  let plan: InterviewerSessionPlan = safeJsonParse(session.planJson, fallbackPlan);
  const turns = session.turns.map((turn) => ({
    ...turn,
    turnType: normalizeTurnType(turn.turnType),
    answer: turn.id === answeredTurn.id ? parsed.data.answer.trim() : turn.answer,
    expression: {},
    score: {},
    review: null,
  })) as MockInterviewTurn[];
  const primaryCoveredCount = turns.filter((turn) => turn.turnType === "primary" && turn.answer?.trim()).length;
  const shouldFinish = primaryCoveredCount >= plan.primaryQuestionBudget;
  let nextTurn = null;

  if (!shouldFinish && (focusTurn.turnType === "primary" || focusTurn.turnType === "followup")) {
    const followUpQuestion = shouldAskFollowUp({
      answer: parsed.data.answer,
      plan,
      turns,
      currentTurn: {
        ...focusTurn,
        turnType: normalizeTurnType(focusTurn.turnType),
        answer: parsed.data.answer.trim(),
        expression: {},
        score: {},
        review: null,
      },
    });

    if (followUpQuestion) {
      plan = appendFollowUp(plan);
      nextTurn = await prisma.interviewTurn.create({
        data: {
          sessionId,
          order: Math.max(...session.turns.map((turn) => turn.order)) + 1,
          question: followUpQuestion,
          questionSource: focusTurn.questionSource,
          turnType: "followup",
          parentTurnId: focusTurn.turnType === "followup" ? (focusTurn.parentTurnId ?? focusTurn.id) : focusTurn.id,
          intent: "根据候选人上一轮回答继续追问细节、指标和个人贡献。",
          idealAnswer: "补充具体背景、个人动作、关键取舍、结果指标，以及这段经历和岗位要求的连接。",
        },
      });
    }
  }

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { planJson: JSON.stringify(plan) },
  });

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
    answeredTurn: serializeTurn(answeredTurn),
    nextTurn: nextTurn ? serializeTurn(nextTurn) : null,
    shouldFinish,
  });
}
