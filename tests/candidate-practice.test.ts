import { describe, expect, it } from "vitest";
import {
  buildCandidateAnswerTemplate,
  buildCandidateFollowUpDrills,
  buildCandidateNextAnswerDraft,
  buildCandidateProofBank,
  buildCandidateRiskDrills,
  buildCandidateReadinessChecklist,
  buildCandidateWeaknessQueue,
  reviewCandidatePracticeAnswer,
  type CandidatePracticePrep,
} from "@/lib/candidate-practice";

const prep: CandidatePracticePrep = {
  headline: "重点讲 AI 面试工作台",
  resumeHighlights: ["主导 Agent 面试流程，提升练习闭环效率 30%"],
  selfIntro90s: "我是一个前端工程师...",
  projectTalkTracks: [
    {
      project: "AI 面试工作台",
      whyItMatters: "覆盖面试前准备、模拟和复盘。",
      deepDivePoints: ["Agent 追问策略", "评分规则设计"],
      proofPoints: ["把复盘生成时间从 20 分钟降到 3 分钟"],
    },
  ],
  riskPoints: ["项目指标需要讲清楚", "个人贡献边界要明确"],
  followUpQuestions: ["你为什么这样设计 Agent？"],
  jobAlignment: ["匹配前端工程师对复杂交互和工程落地的要求"],
};

describe("candidate practice helpers", () => {
  it("builds a structured answer template from prep context", () => {
    const template = buildCandidateAnswerTemplate(
      { question: "讲一个你最有代表性的项目。", intent: "项目深挖" },
      prep,
    );

    expect(template).toContain("背景 -> 任务 -> 动作 -> 结果 -> 复盘");
    expect(template).toContain("AI 面试工作台");
    expect(template).toContain("项目深挖");
  });

  it("scores stronger answers higher than thin answers", () => {
    const thin = reviewCandidatePracticeAnswer("团队做了一个系统。", { question: "讲项目" }, prep);
    const strong = reviewCandidatePracticeAnswer(
      "背景是面试练习链路割裂影响业务目标，我负责设计 Agent 流程并推进落地。首先拆解准备、模拟、复盘，其次权衡实时评分风险和最终评分成本，最后让复盘生成时间降低 30%，这能证明我匹配岗位要求。",
      { question: "讲项目" },
      prep,
    );

    expect(strong.score).toBeGreaterThan(thin.score);
    expect(strong.strengths.join(" ")).toContain("个人贡献");
    expect(thin.fixes.join(" ")).toContain("回答偏短");
  });

  it("turns prep risks and proof points into reusable practice modules", () => {
    expect(buildCandidateRiskDrills(prep)[0].drill).toContain("30 秒回答");
    expect(buildCandidateProofBank(prep)).toContain("把复盘生成时间从 20 分钟降到 3 分钟");
  });

  it("builds follow-up drills from prep and current question signals", () => {
    const drills = buildCandidateFollowUpDrills(
      {
        question: "讲一个项目。",
        strongSignals: ["能讲清楚 Agent 设计取舍"],
        redFlags: ["只说团队贡献"],
      },
      prep,
    );

    expect(drills[0].question).toContain("为什么这样设计 Agent");
    expect(drills.some((item) => item.question.includes("只说团队贡献"))).toBe(true);
    expect(drills[0].answerFrame).toContain("事实或指标");
  });

  it("summarizes candidate readiness into ready, missing, and next actions", () => {
    const weak = buildCandidateReadinessChecklist({
      prep: null,
      answeredCount: 0,
      totalQuestionCount: 6,
      latestReview: null,
      proofBank: [],
    });
    const strong = buildCandidateReadinessChecklist({
      prep,
      answeredCount: 3,
      totalQuestionCount: 6,
      latestReview: {
        score: 86,
        strengths: [],
        fixes: [],
        rewrittenAnswer: "",
        missingSignals: [],
      },
      proofBank: buildCandidateProofBank(prep),
    });

    expect(weak.missing.length).toBeGreaterThan(0);
    expect(weak.nextActions.join(" ")).toContain("候选人准备面板");
    expect(strong.ready.join(" ")).toContain("可上场");
    expect(strong.missing).toEqual([]);
  });

  it("creates a next answer draft from review fixes", () => {
    const review = reviewCandidatePracticeAnswer("团队做了一个系统。", { question: "讲项目" }, prep);
    const draft = buildCandidateNextAnswerDraft("团队做了一个系统。", review);

    expect(draft).toContain("下一版回答草稿");
    expect(draft).toContain("这版必须修掉");
    expect(draft).toContain("原回答可保留素材");
  });

  it("builds a prioritized weakness queue across practice questions", () => {
    const strongReview = reviewCandidatePracticeAnswer(
      "背景是面试练习链路割裂影响业务目标，我负责设计 Agent 流程并推进落地。首先拆解准备、模拟、复盘，其次权衡实时评分风险和最终评分成本，最后让复盘生成时间降低 30%，这能证明我匹配岗位要求。",
      { question: "讲项目" },
      prep,
    );
    const weakReview = reviewCandidatePracticeAnswer("团队做了一个系统。", { question: "讲项目" }, prep);
    const queue = buildCandidateWeaknessQueue({
      questions: [
        { order: 1, question: "讲项目" },
        { order: 2, question: "讲取舍" },
        { order: 3, question: "讲岗位匹配" },
      ],
      answers: {
        1: "团队做了一个系统。",
        3: "背景是面试练习链路割裂影响业务目标，我负责设计 Agent 流程并推进落地。首先拆解准备、模拟、复盘，其次权衡实时评分风险和最终评分成本，最后让复盘生成时间降低 30%，这能证明我匹配岗位要求。",
      },
      reviews: {
        1: weakReview,
        3: strongReview,
      },
    });

    expect(queue[0].priority).toBe("high");
    expect(queue.some((item) => item.reason.includes("还没有练过"))).toBe(true);
    expect(queue.at(-1)?.priority).toBe("low");
  });
});
