import { describe, expect, it } from "vitest";
import {
  appendFollowUp,
  buildFirstTurn,
  buildPrimaryTurns,
  buildInterviewerContext,
  buildInterviewerPlan,
  finishInterviewerSession,
  markPrimaryAsked,
  shouldAskFollowUp,
  type MockInterviewTurn,
} from "@/lib/mock-interviewer";

const resumeText = `
张三，前端工程师。
技能：React、TypeScript、Node.js、性能优化。
项目：面试工作台系统，负责 Agent 面试流程、追问策略和复盘评分。
项目：数据看板平台，主导性能优化和监控治理。
工作经历：在 AI 工具团队负责前端架构和跨端协作。
`;

function makeTurn(overrides: Partial<MockInterviewTurn> = {}): MockInterviewTurn {
  return {
    id: overrides.id ?? 1,
    order: overrides.order ?? 1,
    question: overrides.question ?? "请讲一个项目。",
    questionSource: overrides.questionSource ?? "resume",
    turnType: overrides.turnType ?? "primary",
    parentTurnId: overrides.parentTurnId ?? null,
    intent: overrides.intent ?? "项目深挖",
    answer: overrides.answer ?? null,
    feedback: overrides.feedback ?? null,
    betterAnswer: overrides.betterAnswer ?? null,
    idealAnswer: overrides.idealAnswer ?? "按背景、动作、结果、复盘回答。",
    transcriptSource: overrides.transcriptSource ?? "text",
    answerDurationSec: overrides.answerDurationSec ?? null,
    expression: overrides.expression ?? {},
    score: overrides.score ?? {},
    review: overrides.review ?? null,
  };
}

describe("mock interviewer rules", () => {
  it("maps duration minutes to fixed turn budgets", () => {
    const budgets = [10, 20, 30, 45].map((durationMinutes) => {
      const context = buildInterviewerContext({
        resumeText,
        seniority: "mid",
        durationMinutes: durationMinutes as 10 | 20 | 30 | 45,
      });
      return buildInterviewerPlan(context).turnBudget;
    });

    expect(budgets).toEqual([4, 7, 10, 15]);
  });

  it("prioritizes JD questions after the required project deep dive", () => {
    const context = buildInterviewerContext({
      resumeText,
      jdText: "岗位要求 React TypeScript 性能优化 监控 Agent 协作",
      targetRole: "前端工程师",
      seniority: "senior",
      durationMinutes: 20,
    });
    let plan = buildInterviewerPlan(context);
    const firstTurn = buildFirstTurn(plan);

    expect(firstTurn?.questionSource).toBe("resume");
    plan = markPrimaryAsked(plan, firstTurn!.topicId);

    const secondTurn = buildFirstTurn(plan);
    expect(plan.jdRequiredQuestionTarget).toBeGreaterThanOrEqual(1);
    expect(secondTurn?.questionSource).toBe("jd");
  });

  it("asks follow-ups only within the configured per-topic cap", () => {
    let plan = buildInterviewerPlan(buildInterviewerContext({ resumeText, seniority: "mid", durationMinutes: 20 }));
    const currentTurn = makeTurn({ id: 1 });
    const turns = [
      currentTurn,
      makeTurn({ id: 2, turnType: "followup", parentTurnId: 1 }),
      makeTurn({ id: 3, turnType: "followup", parentTurnId: 1 }),
    ];

    expect(shouldAskFollowUp({ answer: "我参与了方案设计。", plan, turns, currentTurn })).toBeNull();

    plan = appendFollowUp(plan);
    expect(plan.askedFollowUpCount).toBe(1);
  });

  it("scores each answer by averaging six dimensions and scaling to 100", () => {
    const context = buildInterviewerContext({
      resumeText,
      targetRole: "前端工程师",
      seniority: "senior",
      durationMinutes: 20,
    });
    const turn = makeTurn({
      answer: "背景是性能问题影响业务目标，我负责设计方案并推进落地。首先定位瓶颈，其次权衡缓存成本和复杂度，最后优化 30% 首屏耗时并复盘监控策略，符合岗位要求。",
    });

    const summary = finishInterviewerSession([turn], context);
    const dimensionAverage = Object.values(summary.dimensionAverages).reduce((sum, value) => sum + value, 0) / 6;

    expect(summary.turns[0].score).toBe(Math.round(dimensionAverage * 20));
    expect(summary.overallScore).toBe(summary.turns[0].score);
  });

  it("creates all primary outline turns upfront in stable order", () => {
    const context = buildInterviewerContext({
      resumeText,
      jdText: "岗位要求 React TypeScript 性能优化 Agent 协作",
      targetRole: "前端工程师",
      seniority: "senior",
      durationMinutes: 20,
    });
    const plan = buildInterviewerPlan(context);
    const primaryTurns = buildPrimaryTurns(plan);

    expect(primaryTurns.length).toBe(plan.primaryQuestionBudget);
    expect(primaryTurns.map((turn) => turn.order)).toEqual(primaryTurns.map((_, index) => index + 1));
    expect(primaryTurns.every((turn) => turn.turnType === "primary")).toBe(true);
  });

  it("aggregates a primary answer together with its followups when scoring", () => {
    const context = buildInterviewerContext({
      resumeText,
      targetRole: "前端工程师",
      seniority: "senior",
      durationMinutes: 20,
    });
    const primary = makeTurn({
      id: 11,
      order: 1,
      question: "请讲一下你的核心项目。",
      answer: "背景是首屏很慢，我负责推进一次性能优化。",
    });
    const followup = makeTurn({
      id: 12,
      order: 4,
      turnType: "followup",
      parentTurnId: 11,
      question: "结果数据是什么？",
      answer: "我主导拆包和缓存策略，最终把首屏耗时降低了 30%，并补齐监控和复盘。",
    });

    const summary = finishInterviewerSession([primary, followup], context);

    expect(summary.questionReviews).toHaveLength(1);
    expect(summary.questionReviews[0].followUps).toEqual(["结果数据是什么？"]);
    expect(summary.questionReviews[0].answers).toEqual([
      "背景是首屏很慢，我负责推进一次性能优化。",
      "我主导拆包和缓存策略，最终把首屏耗时降低了 30%，并补齐监控和复盘。",
    ]);
  });

  it("keeps discussion cards separate from primary question reviews", () => {
    const context = buildInterviewerContext({
      resumeText,
      targetRole: "前端工程师",
      seniority: "mid",
      durationMinutes: 20,
    });
    const primary = makeTurn({
      id: 21,
      order: 1,
      question: "请讲一个项目。",
      answer: "我负责项目架构设计和推进落地。",
    });
    const discussion = makeTurn({
      id: 22,
      order: 5,
      turnType: "discussion",
      question: "顺带聊聊团队协作",
      answer: "这段讨论主要补充了跨团队协作、判断依据和复盘结论。",
    });

    const summary = finishInterviewerSession([primary, discussion], context);

    expect(summary.questionReviews).toHaveLength(1);
    expect(summary.questionReviews[0].turnId).toBe(21);
    expect(summary.discussionReviews).toHaveLength(1);
    expect(summary.discussionReviews[0].turnId).toBe(22);
  });
});
