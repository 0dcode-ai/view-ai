export type InterviewBenchmarkStatus = "strong" | "partial" | "missing";

export type InterviewBenchmarkInput = {
  knowledgeCount: number;
  hasResume: boolean;
  hasJobTarget: boolean;
  hasCandidatePrep: boolean;
  hasInterviewerSession: boolean;
  hasFinishedInterview: boolean;
  hasInterviewScript: boolean;
  practiceAnswerCount: number;
  reviewTodoCount: number;
  labSessionCount: number;
};

export type InterviewPlatformBenchmark = {
  id: string;
  title: string;
  platforms: string[];
  marketPattern: string;
  ourStatus: InterviewBenchmarkStatus;
  evidence: string;
  recommendedAction: string;
  ctaLabel: string;
  target: "interviewer" | "candidate" | "records" | "lab" | "review" | "articles";
};

function statusFromScore(score: number): InterviewBenchmarkStatus {
  if (score >= 2) return "strong";
  if (score === 1) return "partial";
  return "missing";
}

export function buildInterviewPlatformBenchmarks(input: InterviewBenchmarkInput): InterviewPlatformBenchmark[] {
  return [
    {
      id: "adaptive-jd-resume-mock",
      title: "JD/简历自适应模拟",
      platforms: ["Big Interview PracticeAI", "interviewing.io"],
      marketPattern: "热门平台会基于 JD、简历和回答过程动态追问，不只是固定题单。",
      ourStatus: statusFromScore(Number(input.hasResume && input.hasJobTarget) + Number(input.hasInterviewerSession)),
      evidence: input.hasInterviewerSession
        ? "面试官 Agent 已能按简历、可选 JD、时长和级别生成题纲，并动态追问。"
        : input.hasResume || input.hasJobTarget
          ? "已经有简历或 JD 数据，但还没有启动面试官 Agent 会话。"
          : "还缺少简历/JD 上下文，模拟会偏通用。",
      recommendedAction: "优先用当前简历和 JD 启动一场面试官 Agent，会立刻补齐个性化追问链路。",
      ctaLabel: "启动面试官",
      target: "interviewer",
    },
    {
      id: "structured-scorecards",
      title: "结构化评分卡",
      platforms: ["CodeSignal", "HackerRank", "Big Interview"],
      marketPattern: "企业面试平台强调模板化题纲、统一评分维度和可复盘的反馈口径，减少主观偏差。",
      ourStatus: statusFromScore(Number(input.hasInterviewerSession) + Number(input.hasFinishedInterview || input.reviewTodoCount > 0)),
      evidence: input.hasFinishedInterview
        ? "已有完成态复盘，能看到总分、维度分、逐题反馈和参考好答案。"
        : input.hasInterviewerSession
          ? "已有题纲和纪要工作台，但还需要结束生成结构化复盘。"
          : "还没有面试官 Agent 会话，评分卡尚未形成。",
      recommendedAction: "完成一次面试官 Agent 复盘，把评分口径沉淀为后续训练任务。",
      ctaLabel: "看复盘",
      target: "review",
    },
    {
      id: "company-question-bank",
      title: "公司/主题题库沉淀",
      platforms: ["LeetCode", "HackerRank"],
      marketPattern: "高频题、公司标签、主题标签和难度筛选是备考平台的基础设施。",
      ourStatus: statusFromScore(Number(input.knowledgeCount >= 20) + Number(input.knowledgeCount >= 5)),
      evidence: input.knowledgeCount > 0
        ? `当前已有 ${input.knowledgeCount} 张题库记录，可继续按文章拆卡或面经回流扩充。`
        : "题库还没有沉淀，练习和复盘缺少可复用素材。",
      recommendedAction: "从技术文章或面经继续拆卡，优先补公司、主题、难度和标签。",
      ctaLabel: "去记录",
      target: "records",
    },
    {
      id: "optimized-answer-review",
      title: "答案对照与下一版",
      platforms: ["Big Interview", "interviewing.io"],
      marketPattern: "优秀平台会把用户原回答、评分反馈和优化答案放在一起，让用户知道下一版怎么说。",
      ourStatus: statusFromScore(Number(input.practiceAnswerCount > 0) + Number(input.hasCandidatePrep || input.hasFinishedInterview)),
      evidence: input.practiceAnswerCount > 0
        ? `已暂存 ${input.practiceAnswerCount} 道面试者练习回答，可继续生成下一版和弱点复练。`
        : input.hasCandidatePrep
          ? "候选人准备面板已生成，但还没有逐题练习回答。"
          : "还没有候选人准备面板或练习回答。",
      recommendedAction: "在面试者练习里完成至少 3 道题的回答、诊断和下一版生成。",
      ctaLabel: "去练习",
      target: "candidate",
    },
    {
      id: "live-coding-environment",
      title: "真实 Coding / 系统设计环境",
      platforms: ["CoderPad", "CodeSignal", "HackerRank"],
      marketPattern: "技术面试平台会提供可运行代码环境、协作编辑、数据库/前端任务和系统设计白板。",
      ourStatus: statusFromScore(Number(input.labSessionCount > 0)),
      evidence: input.labSessionCount > 0
        ? `已有 ${input.labSessionCount} 个实验室会话，可作为 coding/system design 练习底座。`
        : "目前面试链路以文本为主，coding round 还没有明显接入。",
      recommendedAction: "把实验室作为 coding round 的练习入口，后续再接入面试官题纲。",
      ctaLabel: "去实验室",
      target: "lab",
    },
    {
      id: "peer-and-realistic-pressure",
      title: "真人/同伴压力模拟",
      platforms: ["Pramp", "interviewing.io"],
      marketPattern: "同伴互面、匿名真人 mock 和面后反馈能补足 AI 模拟缺少的临场压力。",
      ourStatus: "missing",
      evidence: "当前还没有同伴匹配、外部面试官或旁听反馈入口。",
      recommendedAction: "短期先用面试官 Agent 的自由讨论卡记录真人 mock 反馈，后续再做 peer invite。",
      ctaLabel: "先用面试官记录",
      target: "interviewer",
    },
  ];
}

export function summarizeBenchmarkCoverage(items: InterviewPlatformBenchmark[]) {
  const total = items.length;
  const strong = items.filter((item) => item.ourStatus === "strong").length;
  const partial = items.filter((item) => item.ourStatus === "partial").length;
  const missing = items.filter((item) => item.ourStatus === "missing").length;
  const score = total ? Math.round(((strong * 1 + partial * 0.55) / total) * 100) : 0;

  return {
    score,
    strong,
    partial,
    missing,
    next: items.find((item) => item.ourStatus === "missing") ?? items.find((item) => item.ourStatus === "partial") ?? items[0] ?? null,
  };
}
