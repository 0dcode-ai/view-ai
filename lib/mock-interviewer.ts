type Seniority = "junior" | "mid" | "senior" | "staff";
type TopicSource = "resume" | "jd" | "general";
type TopicKind = "project" | "skill" | "behavior" | "system" | "jd";
type ParsedResume = {
  summary: string;
  skills: string[];
  experiences: string[];
  projects: string[];
  followUpQuestions: string[];
};
type ResumeProfileLike = {
  parsed: ParsedResume;
};
export type MockInterviewTurn = {
  id: number;
  order: number;
  question: string;
  questionSource: string | null;
  turnType?: "primary" | "followup" | "discussion" | null;
  parentTurnId?: number | null;
  intent?: string | null;
  answer: string | null;
  feedback: string | null;
  betterAnswer: string | null;
  idealAnswer?: string | null;
  transcriptSource: string;
  answerDurationSec: number | null;
  expression: Record<string, number | string>;
  score: Record<string, number>;
  review?: Record<string, unknown> | null;
};
export type InterviewerSessionContext = {
  resumeText: string;
  parsedResume: ParsedResume;
  jdText: string | null;
  jdKeywords: string[];
  targetRole: string | null;
  seniority: Seniority;
  durationMinutes: 10 | 20 | 30 | 45;
};
export type InterviewerPlanTopic = TopicSeed;
export type InterviewerSessionPlan = {
  durationMinutes: 10 | 20 | 30 | 45;
  turnBudget: number;
  primaryQuestionBudget: number;
  followUpBudget: number;
  askedPrimaryCount: number;
  askedFollowUpCount: number;
  requiredProjectDeepDive: boolean;
  projectDeepDiveCovered: boolean;
  jdRequiredQuestionTarget: number;
  jdRequiredQuestionCount: number;
  currentTopicId: string | null;
  topics: InterviewerPlanTopic[];
};
export type InterviewerTurnReview = {
  dimensions: Record<(typeof dimensionKeys)[number], number>;
  overallScore: number;
  feedback: string;
  betterAnswer: string;
  missedPoints: string[];
};
export type InterviewerSessionSummary = {
  overallScore: number;
  dimensionAverages: Record<(typeof dimensionKeys)[number], number>;
  summary: string;
  strengths: string[];
  nextActions: string[];
  turns: Array<{
    turnId: number;
    order: number;
    question: string;
    answer: string | null;
    score: number;
    feedback: string;
    idealAnswer: string;
    missedPoints: string[];
  }>;
  questionReviews: Array<{
    turnId: number;
    order: number;
    question: string;
    score: number;
    feedback: string;
    idealAnswer: string;
    missedPoints: string[];
    answers: string[];
    followUps: string[];
  }>;
  discussionReviews: Array<{
    turnId: number;
    order: number;
    question: string;
    score: number;
    feedback: string;
    idealAnswer: string;
    missedPoints: string[];
    answers: string[];
  }>;
};

type TopicSeed = {
  id: string;
  title: string;
  source: TopicSource;
  kind: TopicKind;
  intent: string;
  question: string;
  idealAnswer: string;
  asked: boolean;
  required: boolean;
};

const durationTurnBudget: Record<10 | 20 | 30 | 45, number> = {
  10: 4,
  20: 7,
  30: 10,
  45: 15,
};

const seniorityLabels: Record<Seniority, string> = {
  junior: "初级",
  mid: "中级",
  senior: "高级",
  staff: "专家",
};

const followUpTriggers = [
  { pattern: /负责|主导|ownership/i, code: "ownership_unclear", question: "你当时具体负责哪一部分？最终决策是你拍板的吗？" },
  { pattern: /提升|优化|增长|降低|节省/i, code: "missing_metrics", question: "这件事最后的数据结果是什么？有没有具体指标或前后对比？" },
  { pattern: /方案|设计|架构|实现/i, code: "shallow_solution", question: "为什么选这个方案？当时有没有考虑替代方案，最后为什么没选？" },
  { pattern: /问题|故障|排查|修复/i, code: "tradeoff_unclear", question: "当时最大的取舍是什么？你是怎么平衡速度、风险和长期维护成本的？" },
  { pattern: /我参与|一起|团队/i, code: "ownership_weak", question: "在团队合作里你个人最关键的贡献是什么？如果没有你，这件事最可能卡在哪？" },
];

const dimensionKeys = ["accuracy", "depth", "structure", "resumeGrounding", "roleRelevance", "clarity"] as const;

function normalizeLines(text: string) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function extractJdKeywords(jdText: string) {
  const pool = [
    "React", "TypeScript", "JavaScript", "Node.js", "Vue", "性能优化", "系统设计", "高并发", "微服务",
    "数据库", "Redis", "Kafka", "监控", "稳定性", "测试", "CI/CD", "云原生", "LLM", "Agent", "RAG", "协作", "沟通",
  ];
  return uniqueStrings(pool.filter((item) => jdText.toLowerCase().includes(item.toLowerCase()))).slice(0, 8);
}

function projectQuestions(projects: string[], role: string | null, seniority: Seniority): TopicSeed[] {
  return projects.slice(0, 3).map((project, index) => ({
    id: `project-${index + 1}`,
    title: project,
    source: "resume",
    kind: "project",
    intent: "考察项目背景、个人贡献、技术方案与量化结果。",
    question: `请你完整讲一下 ${project}，重点说背景、目标、你的职责、核心方案、最难的问题和最后结果。`,
    idealAnswer: `先说明 ${project} 的业务背景和目标，再讲你负责的核心模块、为什么这么设计、如何解决难点，最后用结果指标和复盘收尾。`,
    asked: false,
    required: index === 0 || seniority !== "junior",
  }));
}

function skillQuestions(skills: string[], role: string | null): TopicSeed[] {
  return skills.slice(0, 3).map((skill, index) => ({
    id: `skill-${index + 1}`,
    title: skill,
    source: "resume",
    kind: "skill",
    intent: "考察技术原理是否能和真实项目场景绑定。",
    question: `你在真实项目里是怎么用 ${skill} 的？请讲一个场景、为什么需要它、怎么落地、踩过什么坑。`,
    idealAnswer: `不要只解释定义，要结合真实项目说明 ${skill} 的使用场景、选型原因、实际收益和限制。`,
    asked: false,
    required: index === 0,
  }));
}

function jdQuestions(jdKeywords: string[], role: string | null): TopicSeed[] {
  return jdKeywords.slice(0, 3).map((keyword, index) => ({
    id: `jd-${index + 1}`,
    title: keyword,
    source: "jd",
    kind: "jd",
    intent: "考察岗位必备项和候选人经历是否对齐。",
    question: `这个岗位强调 ${keyword}，你过往最能证明自己具备这项能力的经历是什么？`,
    idealAnswer: `先承接岗位要求，再给出一段真实经历，说明场景、动作、结果，并解释为什么这能证明你胜任 ${keyword}。`,
    asked: false,
    required: true,
  }));
}

function generalQuestions(role: string | null, seniority: Seniority): TopicSeed[] {
  const roleLabel = role || "目标岗位";
  return [
    {
      id: "general-role-fit",
      title: "岗位匹配",
      source: "general",
      kind: "behavior",
      intent: "考察岗位动机和上手策略。",
      question: `为什么你适合这个 ${roleLabel} 岗位？如果你入职，前 30 天会优先解决什么问题？`,
      idealAnswer: "回答要同时包含岗位匹配证据、过往可迁移经历、短期上手路径和优先级判断。",
      asked: false,
      required: true,
    },
    {
      id: "general-reflection",
      title: "复盘能力",
      source: "general",
      kind: seniority === "staff" ? "system" : "behavior",
      intent: "考察复盘和成长能力。",
      question: seniority === "staff"
        ? "讲一次你做技术决策时判断失误的经历，你如何发现问题、纠偏并沉淀方法论？"
        : "讲一次你做得不够好的项目经历，你后来怎么复盘和改进？",
      idealAnswer: "要具体承认问题，解释当时判断依据，说明如何修复，并给出之后如何避免同类问题。",
      asked: false,
      required: false,
    },
  ];
}

function computePrimaryBudget(turnBudget: number) {
  return Math.max(3, Math.ceil(turnBudget * 0.6));
}

function computeFollowUpBudget(turnBudget: number, primaryBudget: number) {
  return Math.max(1, turnBudget - primaryBudget);
}

export function parseResumeText(rawText: string): InterviewerSessionContext["parsedResume"] {
  const lines = normalizeLines(rawText);
  return {
    summary: lines.slice(0, 2).join(" ") || "待完善简历摘要",
    skills: uniqueStrings(lines.filter((line) => /skill|技能|技术|熟悉|掌握/i.test(line)).slice(0, 8)),
    experiences: uniqueStrings(lines.filter((line) => /公司|负责|经历|工作|实习/i.test(line)).slice(0, 8)),
    projects: uniqueStrings(lines.filter((line) => /项目|系统|平台|服务/i.test(line)).slice(0, 8)),
    followUpQuestions: ["你负责的项目最大技术难点是什么？", "如何量化你的项目结果？", "如果重做这个项目会怎么优化？"],
  };
}

export function buildInterviewerContext(input: {
  resumeText: string;
  resumeProfile?: ResumeProfileLike | null;
  jdText?: string | null;
  targetRole?: string | null;
  seniority: Seniority;
  durationMinutes: 10 | 20 | 30 | 45;
}): InterviewerSessionContext {
  const parsedResume = input.resumeProfile?.parsed ?? parseResumeText(input.resumeText);
  return {
    resumeText: input.resumeText,
    parsedResume,
    jdText: input.jdText?.trim() ? input.jdText.trim() : null,
    jdKeywords: input.jdText?.trim() ? extractJdKeywords(input.jdText) : [],
    targetRole: input.targetRole?.trim() || null,
    seniority: input.seniority,
    durationMinutes: input.durationMinutes,
  };
}

export function buildInterviewerPlan(context: InterviewerSessionContext): InterviewerSessionPlan {
  const turnBudget = durationTurnBudget[context.durationMinutes];
  const primaryQuestionBudget = computePrimaryBudget(turnBudget);
  const followUpBudget = computeFollowUpBudget(turnBudget, primaryQuestionBudget);
  const topics = [
    ...projectQuestions(context.parsedResume.projects, context.targetRole, context.seniority),
    ...skillQuestions(context.parsedResume.skills, context.targetRole),
    ...jdQuestions(context.jdKeywords, context.targetRole),
    ...generalQuestions(context.targetRole, context.seniority),
  ].slice(0, Math.max(primaryQuestionBudget + 1, 6));
  const jdRequiredQuestionTarget = context.jdKeywords.length ? Math.max(1, Math.ceil(primaryQuestionBudget * 0.3)) : 0;

  return {
    durationMinutes: context.durationMinutes,
    turnBudget,
    primaryQuestionBudget,
    followUpBudget,
    askedPrimaryCount: 0,
    askedFollowUpCount: 0,
    requiredProjectDeepDive: true,
    projectDeepDiveCovered: false,
    jdRequiredQuestionTarget,
    jdRequiredQuestionCount: 0,
    currentTopicId: topics[0]?.id ?? null,
    topics,
  };
}

export function pickNextPrimaryTopic(plan: InterviewerSessionPlan) {
  const unasked = plan.topics.filter((topic) => !topic.asked);
  if (!unasked.length) return null;
  if (plan.requiredProjectDeepDive && !plan.projectDeepDiveCovered) {
    const project = unasked.find((topic) => topic.kind === "project");
    if (project) return project;
  }
  if (plan.jdRequiredQuestionTarget > plan.jdRequiredQuestionCount) {
    const jdTopic = unasked.find((topic) => topic.source === "jd");
    if (jdTopic) return jdTopic;
  }
  return unasked.find((topic) => topic.required) ?? unasked[0] ?? null;
}

export function buildFirstTurn(plan: InterviewerSessionPlan) {
  const topic = pickNextPrimaryTopic(plan);
  if (!topic) return null;
  return {
    topicId: topic.id,
    question: topic.question,
    questionSource: topic.source,
    turnType: "primary" as const,
    intent: topic.intent,
    idealAnswer: topic.idealAnswer,
  };
}

export function buildPrimaryTurns(plan: InterviewerSessionPlan) {
  return plan.topics
    .slice(0, plan.primaryQuestionBudget)
    .map((topic, index) => ({
      topicId: topic.id,
      order: index + 1,
      question: topic.question,
      questionSource: topic.source,
      turnType: "primary" as const,
      intent: topic.intent,
      idealAnswer: topic.idealAnswer,
    }));
}

export function markPrimaryAsked(plan: InterviewerSessionPlan, topicId: string) {
  const topics = plan.topics.map((topic) => topic.id === topicId ? { ...topic, asked: true } : topic);
  const askedTopic = topics.find((topic) => topic.id === topicId) ?? null;
  return {
    ...plan,
    topics,
    currentTopicId: topicId,
    askedPrimaryCount: plan.askedPrimaryCount + 1,
    projectDeepDiveCovered: plan.projectDeepDiveCovered || askedTopic?.kind === "project",
    jdRequiredQuestionCount: plan.jdRequiredQuestionCount + (askedTopic?.source === "jd" ? 1 : 0),
  };
}

export function shouldAskFollowUp(input: {
  answer: string;
  plan: InterviewerSessionPlan;
  turns: MockInterviewTurn[];
  currentTurn: MockInterviewTurn;
}) {
  if (input.plan.askedFollowUpCount >= input.plan.followUpBudget) return null;
  const followupsOnParent = input.turns.filter((turn) => turn.parentTurnId === (input.currentTurn.parentTurnId ?? input.currentTurn.id)).length;
  if (followupsOnParent >= 2) return null;
  const answer = input.answer.trim();
  if (answer.length < 90) {
    return "回答偏短，细节还不够。请你把背景、你的动作、结果和数据指标补充完整。";
  }
  for (const trigger of followUpTriggers) {
    if (trigger.pattern.test(answer)) {
      if (trigger.code === "ownership_unclear" && /我负责|我主导|我设计|我推进/.test(answer)) continue;
      if (trigger.code === "missing_metrics" && /\d+%|\d+ms|\d+倍|\d+个/.test(answer)) continue;
      return trigger.question;
    }
  }
  if (input.currentTurn.questionSource === "jd" && !/岗位|业务|目标|要求/.test(answer)) {
    return "这道题和岗位要求的连接还不够，请你明确讲一下这段经历为什么能证明你匹配这个岗位。";
  }
  return null;
}

export function appendFollowUp(plan: InterviewerSessionPlan) {
  return {
    ...plan,
    askedFollowUpCount: plan.askedFollowUpCount + 1,
  };
}

export function summarizeDiscussionTitle(answer: string) {
  const compact = answer
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? "自由讨论";
  return compact.length > 28 ? `${compact.slice(0, 28)}...` : compact;
}

export function buildNextPrimaryTurn(plan: InterviewerSessionPlan) {
  const topic = pickNextPrimaryTopic(plan);
  if (!topic) return null;
  return {
    topicId: topic.id,
    question: topic.question,
    questionSource: topic.source,
    turnType: "primary" as const,
    intent: topic.intent,
    idealAnswer: topic.idealAnswer,
  };
}

function computeDimensionScores(answer: string, turn: MockInterviewTurn, context: InterviewerSessionContext): InterviewerTurnReview["dimensions"] {
  const length = answer.trim().length;
  const hasStructure = /背景|目标|方案|结果|复盘|首先|其次|最后|STAR/i.test(answer);
  const hasMetrics = /\d+%|\d+ms|\d+倍|\d+个/.test(answer);
  const hasOwnership = /我负责|我主导|我设计|我推进|我排查|我优化/.test(answer);
  const hasTradeoff = /取舍|权衡|风险|成本|复杂度/.test(answer);
  const hasRoleLink = context.targetRole ? answer.includes(context.targetRole.replace(/\s+/g, "")) || /岗位|业务|要求/.test(answer) : true;
  const clarity = length > 60 ? 4 : 2;

  return {
    accuracy: Math.min(5, hasOwnership ? 4 : 3),
    depth: Math.min(5, 2 + (hasMetrics ? 1 : 0) + (hasTradeoff ? 1 : 0) + (length > 180 ? 1 : 0)),
    structure: hasStructure ? 4 : 2,
    resumeGrounding: Math.min(5, hasOwnership ? 4 : 2),
    roleRelevance: hasRoleLink ? 4 : 2,
    clarity: Math.min(5, clarity + (hasStructure ? 1 : 0)),
  };
}

function scoreDimensions(dimensions: InterviewerTurnReview["dimensions"]) {
  const values = dimensionKeys.map((key) => dimensions[key]);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 20);
}

function buildMissedPoints(answer: string, turn: MockInterviewTurn, context: InterviewerSessionContext) {
  const missed: string[] = [];
  if (!/\d+%|\d+ms|\d+倍|\d+个/.test(answer)) missed.push("缺少可验证的结果指标。");
  if (!/我负责|我主导|我设计|我推进|我排查|我优化/.test(answer)) missed.push("个人贡献不够清晰。");
  if (!/取舍|风险|成本|复杂度/.test(answer)) missed.push("方案取舍还没有展开。");
  if (context.targetRole && !/岗位|业务|要求/.test(answer)) missed.push("和目标岗位的关联表达还不够。");
  if (!/背景|目标|方案|结果|复盘|首先|其次|最后|STAR/i.test(answer)) missed.push("表达结构可以更清晰。");
  return missed;
}

export function reviewTurnAnswer(turn: MockInterviewTurn, context: InterviewerSessionContext): InterviewerTurnReview {
  const answer = turn.answer ?? "";
  const dimensions = computeDimensionScores(answer, turn, context);
  return {
    dimensions,
    overallScore: scoreDimensions(dimensions),
    feedback: answer.length > 120 ? "回答已经有一定信息量，下一步重点是把量化指标、个人贡献和方案取舍再讲实。" : "回答偏短，建议补全背景、动作、结果和复盘。",
    betterAnswer: turn.idealAnswer || "建议按 背景 -> 目标 -> 我的职责 -> 方案 -> 难点取舍 -> 结果 -> 复盘 的顺序重答。",
    missedPoints: buildMissedPoints(answer, turn, context),
  };
}

export function finishInterviewerSession(turns: MockInterviewTurn[], context: InterviewerSessionContext): InterviewerSessionSummary {
  const answeredTurns = turns.filter((turn) => turn.answer);
  const reviewed = answeredTurns.map((turn) => ({
    turn,
    review: reviewTurnAnswer(turn, context),
  }));
  const primaryTurns = turns.filter((turn) => turn.turnType === "primary");
  const discussionTurns = turns.filter((turn) => turn.turnType === "discussion" && turn.answer);
  const dimensionAverages = dimensionKeys.reduce<Record<(typeof dimensionKeys)[number], number>>((acc, key) => {
    const values = reviewed.map((item) => item.review.dimensions[key]);
    acc[key] = values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : 0;
    return acc;
  }, {
    accuracy: 0,
    depth: 0,
    structure: 0,
    resumeGrounding: 0,
    roleRelevance: 0,
    clarity: 0,
  });
  const overallScore = reviewed.length
    ? Math.round(reviewed.reduce((sum, item) => sum + item.review.overallScore, 0) / reviewed.length)
    : 0;

  return {
    overallScore,
    dimensionAverages,
    summary: overallScore >= 80
      ? `这轮 ${seniorityLabels[context.seniority]} 面试表现整体扎实，已经有不错的项目表达和岗位匹配度。`
      : `这轮 ${seniorityLabels[context.seniority]} 面试暴露出一些表达和深挖薄弱点，建议围绕低分题再练一轮。`,
    strengths: uniqueStrings([
      dimensionAverages.resumeGrounding >= 4 ? "项目经历和个人贡献连接较好。" : "",
      dimensionAverages.structure >= 4 ? "表达结构比较清晰。" : "",
      dimensionAverages.depth >= 4 ? "能展开技术细节和取舍。" : "",
    ]).filter(Boolean),
    nextActions: uniqueStrings([
      dimensionAverages.depth < 3.5 ? "补 3 道项目深挖题，把方案取舍和技术风险讲清楚。" : "",
      dimensionAverages.roleRelevance < 3.5 ? "把每个核心项目补一段“为什么这能证明我适合岗位”的表达。" : "",
      dimensionAverages.clarity < 3.5 ? "按统一结构重写 2 道核心题，练到 2 分钟内讲清楚。" : "",
      "把最低分的 2 道题整理成复盘卡，下次面试前先复述。",
    ]).filter(Boolean),
    turns: reviewed.map(({ turn, review }) => ({
      turnId: turn.id,
      order: turn.order,
      question: turn.question,
      answer: turn.answer,
      score: review.overallScore,
      feedback: review.feedback,
      idealAnswer: turn.idealAnswer || review.betterAnswer,
      missedPoints: review.missedPoints,
    })),
    questionReviews: primaryTurns
      .map((turn) => {
        const relatedFollowUps = turns.filter((item) => item.parentTurnId === turn.id && item.turnType === "followup");
        const mergedAnswer = [turn.answer, ...relatedFollowUps.map((item) => item.answer)].filter(Boolean).join("\n");
        if (!mergedAnswer.trim()) return null;
        const review = reviewTurnAnswer({ ...turn, answer: mergedAnswer }, context);
        return {
          turnId: turn.id,
          order: turn.order,
          question: turn.question,
          score: review.overallScore,
          feedback: review.feedback,
          idealAnswer: turn.idealAnswer || review.betterAnswer,
          missedPoints: review.missedPoints,
          answers: [turn.answer, ...relatedFollowUps.map((item) => item.answer)].filter((value): value is string => Boolean(value)),
          followUps: relatedFollowUps.map((item) => item.question),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    discussionReviews: discussionTurns.map((turn) => {
      const review = reviewTurnAnswer(turn, context);
      return {
        turnId: turn.id,
        order: turn.order,
        question: turn.question,
        score: review.overallScore,
        feedback: review.feedback,
        idealAnswer: turn.idealAnswer || review.betterAnswer,
        missedPoints: review.missedPoints,
        answers: turn.answer ? [turn.answer] : [],
      };
    }),
  };
}
