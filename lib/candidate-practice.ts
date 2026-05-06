export type CandidatePracticeQuestion = {
  order?: number;
  question: string;
  intent?: string | null;
  strongSignals?: string[];
  redFlags?: string[];
};

export type CandidatePracticePrep = {
  headline: string;
  resumeHighlights: string[];
  selfIntro90s: string;
  projectTalkTracks: Array<{
    project: string;
    whyItMatters: string;
    deepDivePoints: string[];
    proofPoints: string[];
  }>;
  riskPoints: string[];
  followUpQuestions: string[];
  jobAlignment: string[];
};

export type CandidatePracticeReview = {
  score: number;
  strengths: string[];
  fixes: string[];
  rewrittenAnswer: string;
  missingSignals: string[];
};

export type CandidateFollowUpDrill = {
  title: string;
  question: string;
  strategy: string;
  answerFrame: string;
};

export type CandidateReadinessChecklist = {
  ready: string[];
  missing: string[];
  nextActions: string[];
};

export type CandidateWeaknessItem = {
  questionOrder: number;
  question: string;
  score: number | null;
  reason: string;
  action: string;
  priority: "high" | "medium" | "low";
};

const metricPattern = /\d+%|\d+ms|\d+倍|\d+个|\d+人|\d+天|\d+周|\d+万|\d+k/i;
const ownershipPattern = /我负责|我主导|我设计|我推进|我排查|我优化|我落地|我拆解/;
const structurePattern = /背景|目标|方案|结果|复盘|首先|其次|最后|STAR|场景|动作/i;
const tradeoffPattern = /取舍|权衡|风险|成本|复杂度|收益|代价/;

export function buildCandidateAnswerTemplate(question: CandidatePracticeQuestion, prep?: CandidatePracticePrep | null) {
  const project = prep?.projectTalkTracks[0];
  const proof = project?.proofPoints[0] ?? prep?.resumeHighlights[0] ?? "这里放一个可验证的结果指标";
  const roleFit = prep?.jobAlignment[0] ?? "最后扣回岗位要求和我的匹配证据";

  return [
    `我会按“背景 -> 任务 -> 动作 -> 结果 -> 复盘”来回答这题。`,
    `背景：这个问题对应的是 ${project?.project ?? "我简历里最核心的项目/经历"}，当时的目标是解决一个明确的业务或技术问题。`,
    "任务：我个人负责的部分是 ...，关键约束是 ...。",
    "动作：我做了 1）... 2）... 3）...，其中最重要的取舍是 ...。",
    `结果：最后带来的结果是 ${proof}。`,
    `复盘：如果重做，我会 ...。这也能证明 ${roleFit}。`,
    question.intent ? `这题考察点：${question.intent}` : "",
  ].filter(Boolean).join("\n");
}

export function reviewCandidatePracticeAnswer(
  answer: string,
  question: CandidatePracticeQuestion,
  prep?: CandidatePracticePrep | null,
): CandidatePracticeReview {
  const trimmed = answer.trim();
  const strengths: string[] = [];
  const fixes: string[] = [];

  const hasStructure = structurePattern.test(trimmed);
  const hasMetrics = metricPattern.test(trimmed);
  const hasOwnership = ownershipPattern.test(trimmed);
  const hasTradeoff = tradeoffPattern.test(trimmed);
  const hasRoleFit = /岗位|业务|要求|匹配|胜任|目标/.test(trimmed);
  const hasEnoughLength = trimmed.length >= 120;

  if (hasStructure) strengths.push("回答已经有基本结构。");
  if (hasMetrics) strengths.push("包含可验证的量化结果。");
  if (hasOwnership) strengths.push("能看出个人贡献。");
  if (hasTradeoff) strengths.push("开始讲技术取舍和风险。");
  if (hasRoleFit) strengths.push("有意识地扣回岗位匹配。");

  if (!hasEnoughLength) fixes.push("回答偏短，建议至少补到 90-120 秒的信息量。");
  if (!hasStructure) fixes.push("按“背景、任务、动作、结果、复盘”重排一次。");
  if (!hasOwnership) fixes.push("把“团队做了”改成“我负责/我推进/我决策”的个人动作。");
  if (!hasMetrics) fixes.push("补一个前后对比指标，比如性能、转化、成本、稳定性或交付周期。");
  if (!hasTradeoff) fixes.push("补充当时为什么选这个方案，以及没选其他方案的原因。");
  if (!hasRoleFit) fixes.push("最后加一句这段经历为什么匹配目标岗位。");

  const missingSignals = (question.strongSignals ?? [])
    .filter((signal) => !trimmed.includes(signal.slice(0, Math.min(signal.length, 8))))
    .slice(0, 3);

  const score = Math.min(
    100,
    35 +
      (hasEnoughLength ? 10 : 0) +
      (hasStructure ? 15 : 0) +
      (hasOwnership ? 15 : 0) +
      (hasMetrics ? 10 : 0) +
      (hasTradeoff ? 10 : 0) +
      (hasRoleFit ? 5 : 0),
  );

  return {
    score,
    strengths: strengths.length ? strengths : ["已经完成一次主动作答，可以开始打磨结构。"],
    fixes,
    missingSignals,
    rewrittenAnswer: buildCandidateAnswerTemplate(question, prep),
  };
}

export function buildCandidateRiskDrills(prep?: CandidatePracticePrep | null) {
  const risks = prep?.riskPoints.length ? prep.riskPoints : ["项目贡献边界不够清晰", "结果指标不够具体", "岗位匹配表达不足"];
  return risks.slice(0, 4).map((risk, index) => ({
    title: `风险防守 ${index + 1}`,
    risk,
    drill: `如果面试官质疑“${risk}”，请用 30 秒回答：事实是什么、你做了什么、结果如何、下次怎么避免。`,
  }));
}

export function buildCandidateProofBank(prep?: CandidatePracticePrep | null) {
  return [
    ...(prep?.resumeHighlights ?? []),
    ...(prep?.jobAlignment ?? []),
    ...(prep?.projectTalkTracks.flatMap((item) => item.proofPoints) ?? []),
  ].filter(Boolean).slice(0, 8);
}

export function buildCandidateFollowUpDrills(
  question?: CandidatePracticeQuestion | null,
  prep?: CandidatePracticePrep | null,
): CandidateFollowUpDrill[] {
  const prepQuestions = prep?.followUpQuestions ?? [];
  const scriptQuestions = [
    ...(question?.redFlags ?? []).map((flag) => `如果面试官追问“${flag}”，你怎么解释？`),
    ...(question?.strongSignals ?? []).map((signal) => `请补充一个能证明“${signal}”的具体例子。`),
  ];
  const fallbackQuestions = [
    "这个项目里你个人最关键的贡献是什么？",
    "如果让你重做一次，你会怎么改？",
    "这个经历为什么能证明你匹配目标岗位？",
  ];

  return [...prepQuestions, ...scriptQuestions, ...fallbackQuestions]
    .filter(Boolean)
    .slice(0, 6)
    .map((item, index) => ({
      title: `追问 ${index + 1}`,
      question: item,
      strategy: "先正面回答，再给事实证据，最后补一句复盘或岗位连接。",
      answerFrame: `我的回答会分三步：1）直接回答这个追问；2）补一个来自项目的事实或指标；3）说明这件事带来的复盘，以及它和岗位要求的关系。`,
    }));
}

export function buildCandidateReadinessChecklist(input: {
  prep?: CandidatePracticePrep | null;
  answeredCount: number;
  totalQuestionCount: number;
  latestReview?: CandidatePracticeReview | null;
  proofBank: string[];
}): CandidateReadinessChecklist {
  const ready: string[] = [];
  const missing: string[] = [];

  if (input.prep?.selfIntro90s) ready.push("90 秒自我介绍已准备。");
  else missing.push("还缺一版 90 秒自我介绍。");

  if ((input.prep?.projectTalkTracks.length ?? 0) >= 1) ready.push("至少 1 个主讲项目已沉淀。");
  else missing.push("还缺主讲项目 talk track。");

  if (input.proofBank.length >= 3) ready.push("已有 3 个以上可复用证明点。");
  else missing.push("证明点不足，建议补指标、贡献和岗位匹配证据。");

  if (input.answeredCount > 0) ready.push(`已暂存 ${input.answeredCount}/${input.totalQuestionCount} 道练习回答。`);
  else missing.push("还没有暂存任何文稿练习回答。");

  if ((input.latestReview?.score ?? 0) >= 80) ready.push("最近一次回答诊断达到可上场水平。");
  else missing.push("最近一次回答还没达到 80 分，建议继续打磨结构和指标。");

  const nextActions = [
    !input.prep?.selfIntro90s ? "先生成候选人准备面板，拿到 90 秒自我介绍。" : "",
    input.proofBank.length < 3 ? "从简历里补 3 个“我做了什么 + 指标结果”的证明点。" : "",
    input.answeredCount < Math.min(input.totalQuestionCount, 3) ? "至少完成 3 道文稿题的结构作答。" : "",
    (input.latestReview?.score ?? 0) < 80 ? "选最低分回答，按推荐骨架重答一版。" : "",
  ].filter(Boolean);

  return { ready, missing, nextActions };
}

export function buildCandidateNextAnswerDraft(answer: string, review?: CandidatePracticeReview | null) {
  if (!review) {
    return answer;
  }

  const fixes = review.fixes.length
    ? review.fixes.map((fix, index) => `${index + 1}. ${fix}`).join("\n")
    : "1. 保留当前结构，继续补充更具体的事实和指标。";

  return [
    "下一版回答草稿：",
    review.rewrittenAnswer,
    "",
    "这版必须修掉：",
    fixes,
    "",
    answer.trim() ? `原回答可保留素材：${answer.trim()}` : "",
  ].filter(Boolean).join("\n");
}

export function buildCandidateWeaknessQueue(input: {
  questions: CandidatePracticeQuestion[];
  answers: Record<number, string>;
  reviews: Record<number, CandidatePracticeReview>;
}): CandidateWeaknessItem[] {
  return input.questions
    .map((question, index) => {
      const order = question.order ?? index + 1;
      const answer = input.answers[order]?.trim() ?? "";
      const review = input.reviews[order];

      if (!answer) {
        return {
          questionOrder: order,
          question: question.question,
          score: null,
          reason: "这题还没有练过。",
          action: "先用答题骨架完成一版 90 秒回答。",
          priority: "medium" as const,
        };
      }

      if (!review) {
        return {
          questionOrder: order,
          question: question.question,
          score: null,
          reason: "这题已作答但还没有诊断。",
          action: "先跑一次本地诊断，拿到下一版修改点。",
          priority: "medium" as const,
        };
      }

      if (review.score >= 80) {
        return {
          questionOrder: order,
          question: question.question,
          score: review.score,
          reason: "这题已经达到可上场水平。",
          action: "面试前快速复述即可。",
          priority: "low" as const,
        };
      }

      return {
        questionOrder: order,
        question: question.question,
        score: review.score,
        reason: review.fixes[0] ?? "回答还需要补强。",
        action: "按推荐重答骨架写下一版，再做一次诊断。",
        priority: review.score < 65 ? "high" as const : "medium" as const,
      };
    })
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority] || (a.score ?? -1) - (b.score ?? -1);
    });
}
