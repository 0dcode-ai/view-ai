import { analyzeExpression } from "@/lib/analytics";
import type { InterviewMode, RoundType } from "@/lib/interview-modes";
import { questionMix, roundFocus } from "@/lib/interview-modes";
import { normalizeTags } from "@/lib/tags";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type KnowledgeSuggestion = {
  companyName: string;
  topicName: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  questionType: string;
  abilityDimension: string;
  masterySuggestion: number;
  priorityScore: number;
  improvedAnswer: string;
  note: string;
};

export type ResumeParseResult = {
  summary: string;
  skills: string[];
  experiences: string[];
  projects: string[];
  followUpQuestions: string[];
};

export type JobTargetParseResult = {
  responsibilities: string[];
  requiredSkills: string[];
  bonusSkills: string[];
  riskPoints: string[];
  interviewFocus: string[];
};

export type ResumeJobMatch = {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  projectTalkTracks: string[];
};

export type QuestionResult = {
  question: string;
  source: "jd" | "resume" | "company" | "general";
};

export type DetailedScore = {
  accuracy: number;
  structure: number;
  depth: number;
  jobRelevance: number;
  projectConnection: number;
  expressionClarity: number;
};

export type AnswerReview = {
  feedback: string;
  diagnosis: string;
  betterAnswer: string;
  reviewTags: string[];
  score: DetailedScore;
};

export type FinishReview = {
  summary: string;
  score: {
    overall: number;
    resume: number;
    knowledge: number;
    expression: number;
    jdMatch: number;
  };
  expressionAdvice: string[];
  topicWeaknesses: string[];
  reviewCards: Array<{
    title: string;
    weakness: string;
    suggestion: string;
    tags: string[];
    priority: number;
  }>;
};

export type SprintPlanResult = {
  title: string;
  summary: string;
  tasks: Array<{
    dayIndex: number;
    type: "knowledge" | "resume" | "mock" | "review" | "jd_gap";
    title: string;
    description: string;
  }>;
};

export type ExperienceParseResult = {
  companyName: string;
  roleName: string;
  level: string;
  location: string;
  interviewDate: string;
  result: "offer" | "reject" | "pending" | "unknown";
  difficulty: "easy" | "medium" | "hard";
  sourceType: "self" | "friend" | "public" | "manual";
  confidence: "low" | "medium" | "high";
  verified: boolean;
  durationMinutes: number | null;
  summary: string;
  tags: string[];
  rounds: Array<{
    order: number;
    roundType: string;
    durationMinutes: number | null;
    interviewerStyle: string;
    focusAreas: string[];
    questions: string[];
    notes: string;
  }>;
};

type KnowledgeInput = {
  question: string;
  answer: string;
  companyName?: string | null;
  topicName?: string | null;
  tags?: string[] | string | null;
};

export type JobTargetInput = {
  companyName?: string | null;
  roleName: string;
  rawJd: string;
};

export type ExperienceInput = {
  rawText: string;
  companyName?: string | null;
  roleName?: string | null;
};

type InterviewContext = {
  mode: InterviewMode;
  roundType?: RoundType;
  targetCompany?: string | null;
  targetRole?: string | null;
  jobTarget?: (JobTargetParseResult & { match?: ResumeJobMatch }) | null;
  resume?: ResumeParseResult | null;
  knowledgeCards?: Array<{
    id: number;
    question: string;
    answer: string;
    topic?: string | null;
    company?: string | null;
    tags?: string[];
    mastery?: number;
    priorityScore?: number;
    abilityDimension?: string;
  }>;
  turns?: Array<{
    order: number;
    question: string;
    answer?: string | null;
    source?: string | null;
    score?: Record<string, number>;
  }>;
};

type SprintContext = {
  companyName?: string | null;
  roleName?: string | null;
  days: number;
  interviewDate?: string | null;
  jobTarget?: JobTargetParseResult | null;
  match?: ResumeJobMatch | null;
  weakTags?: string[];
  knowledgeCards?: Array<{ question: string; abilityDimension?: string; mastery?: number; priorityScore?: number }>;
};

const systemPrompt =
  "你是一个中文技术面试训练助手。只返回合法 JSON，不要输出 Markdown。回答要具体、简洁、可执行。";

async function generateJson<T>(messages: ChatMessage[], fallback: T): Promise<T> {
  if (process.env.AI_PROVIDER === "mock" || !process.env.OPENAI_API_KEY) {
    return fallback;
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const requestBody = {
    model: process.env.OPENAI_MODEL || "GLM-5.1",
    temperature: 0.35,
    messages,
  };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        ...requestBody,
        response_format: { type: "json_object" },
      }),
    });

    const jsonResponse = response.ok
      ? response
      : await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        });

    if (!jsonResponse.ok) {
      return fallback;
    }

    const payload = (await jsonResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    return content ? extractJson(content, fallback) : fallback;
  } catch {
    return fallback;
  }
}

function extractJson<T>(content: string, fallback: T): T {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export async function suggestKnowledge(input: KnowledgeInput): Promise<KnowledgeSuggestion> {
  const fallback = mockKnowledgeSuggestion(input);

  return generateJson<KnowledgeSuggestion>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "根据八股题和答案给出分类建议，不覆盖用户原文。",
          schema: {
            companyName: "公司名，无法判断时为空字符串",
            topicName: "技术主题",
            tags: ["短标签"],
            difficulty: "easy | medium | hard",
            questionType: "题型，如八股/项目追问/系统设计/行为面试",
            abilityDimension: "能力维度，如基础知识/项目深度/架构设计/沟通表达",
            masterySuggestion: "0-4",
            priorityScore: "0-100",
            improvedAnswer: "更结构化的参考答案，保持中文",
            note: "一句录入备注",
          },
          input,
        }),
      },
    ],
    fallback,
  );
}

export async function parseResume(rawText: string): Promise<ResumeParseResult> {
  const fallback = mockResumeParse(rawText);

  return generateJson<ResumeParseResult>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "解析候选人简历，提取面试训练需要的信息。",
          schema: {
            summary: "候选人概述",
            skills: ["技能关键词"],
            experiences: ["工作或实习经历摘要"],
            projects: ["项目经历摘要"],
            followUpQuestions: ["需要候选人补充的信息问题"],
          },
          rawText,
        }),
      },
    ],
    fallback,
  );
}

export async function parseJobTarget(input: JobTargetInput): Promise<JobTargetParseResult> {
  const fallback = mockJobTargetParse(input.rawJd);

  return generateJson<JobTargetParseResult>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "解析目标岗位 JD，提取备考重点。",
          schema: {
            responsibilities: ["主要职责"],
            requiredSkills: ["硬性技能要求"],
            bonusSkills: ["加分项"],
            riskPoints: ["候选人需要警惕的缺口"],
            interviewFocus: ["可能被追问的面试重点"],
          },
          input,
        }),
      },
    ],
    fallback,
  );
}

export async function parseExperienceReport(input: ExperienceInput): Promise<ExperienceParseResult> {
  const fallback = mockExperienceParse(input);

  return generateJson<ExperienceParseResult>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "把用户粘贴的面试经历结构化。不要把不确定内容伪装成 verified。只输出 JSON。",
          schema: {
            companyName: "公司名，无法判断时用输入或空字符串",
            roleName: "岗位名，无法判断时用输入或目标岗位",
            level: "级别，如实习/校招/社招/L4/P6，无法判断为空字符串",
            location: "地点或远程形式，无法判断为空字符串",
            interviewDate: "YYYY-MM-DD 或空字符串",
            result: "offer | reject | pending | unknown",
            difficulty: "easy | medium | hard",
            sourceType: "self | friend | public | manual",
            confidence: "low | medium | high",
            verified: "只有用户明确说明真实验证时才为 true，否则 false",
            durationMinutes: "总时长分钟，无法判断为 null",
            summary: "100 字以内中文摘要",
            tags: ["公司/岗位/技术/轮次标签"],
            rounds: [
              {
                order: "轮次序号，从 1 开始",
                roundType: "HR/一面/二面/系统设计/coding/主管面/交叉面/综合",
                durationMinutes: "本轮时长，无法判断为 null",
                interviewerStyle: "面试官风格或空字符串",
                focusAreas: ["关注点"],
                questions: ["本轮问题"],
                notes: "本轮备注",
              },
            ],
          },
          input,
        }),
      },
    ],
    fallback,
  );
}

export async function matchResumeToJob(
  resume: ResumeParseResult | null,
  jobTarget: JobTargetParseResult,
): Promise<ResumeJobMatch> {
  const fallback = mockResumeJobMatch(resume, jobTarget);

  return generateJson<ResumeJobMatch>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "判断简历与岗位 JD 的匹配度，并给出面试准备建议。",
          schema: {
            matchScore: "0-100",
            strengths: ["匹配优势"],
            gaps: ["缺口技能或经历"],
            projectTalkTracks: ["需要准备的项目话术"],
          },
          resume,
          jobTarget,
        }),
      },
    ],
    fallback,
  );
}

export async function generateInterviewQuestion(context: InterviewContext): Promise<QuestionResult> {
  const fallback = mockQuestion(context);

  return generateJson<QuestionResult>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "生成下一道文本模拟面试问题。不要给答案，不要评分。",
          priority: "JD 目标 > 简历 > 公司八股 > 通用题库 > 历史复盘",
          rules: {
            mode: context.mode,
            roundType: context.roundType,
            roundFocus: context.roundType ? roundFocus(context.roundType) : undefined,
            mix: questionMix(context.mode),
            targetCompany: context.targetCompany,
            targetRole: context.targetRole,
            avoidAskedQuestions: true,
          },
          schema: {
            question: "自然的中文面试问题，可追问 JD、项目、八股或通用技术",
            source: "jd | resume | company | general",
          },
          context,
        }),
      },
    ],
    fallback,
  );
}

export async function reviewAnswer(context: InterviewContext): Promise<AnswerReview> {
  const fallback = mockAnswerReview(context);

  return generateJson<AnswerReview>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "评价刚刚的回答，只用于内部记录。不要输出长篇报告。",
          schema: {
            feedback: "一句中文反馈",
            diagnosis: "回答的主要问题",
            betterAnswer: "更好的示范回答，保持简洁",
            reviewTags: ["复习标签"],
            score: {
              accuracy: "1-5",
              structure: "1-5",
              depth: "1-5",
              jobRelevance: "1-5",
              projectConnection: "1-5",
              expressionClarity: "1-5",
            },
          },
          context,
        }),
      },
    ],
    fallback,
  );
}

export async function finishInterview(context: InterviewContext): Promise<FinishReview> {
  const fallback = mockFinishReview(context);

  return generateJson<FinishReview>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "生成模拟面试复盘，提炼薄弱点并创建复习卡。",
          schema: {
            summary: "整体表现总结",
            score: {
              overall: "1-100",
              resume: "1-100",
              knowledge: "1-100",
              expression: "1-100",
              jdMatch: "1-100",
            },
            expressionAdvice: ["表达建议"],
            topicWeaknesses: ["薄弱主题"],
            reviewCards: [
              {
                title: "复习卡标题",
                weakness: "薄弱点",
                suggestion: "改进建议或参考表达",
                tags: ["标签"],
                priority: "0-100",
              },
            ],
          },
          context,
        }),
      },
    ],
    fallback,
  );
}

export async function generateSprintPlan(context: SprintContext): Promise<SprintPlanResult> {
  const fallback = mockSprintPlan(context);

  return generateJson<SprintPlanResult>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "生成个人面试冲刺计划。每天任务要具体、可完成。",
          schema: {
            title: "计划标题",
            summary: "计划策略摘要",
            tasks: [
              {
                dayIndex: "从 1 开始",
                type: "knowledge | resume | mock | review | jd_gap",
                title: "任务标题",
                description: "任务说明",
              },
            ],
          },
          context,
        }),
      },
    ],
    fallback,
  );
}

export function transcribeInterviewAnswer(input: {
  transcriptHint?: string | null;
  fileName?: string | null;
  durationSec?: number | null;
}) {
  const transcript =
    input.transcriptHint?.trim() ||
    `已收到${input.fileName ? `「${input.fileName}」` : "语音"}，当前本地 MVP 使用模拟转写。请在文本框校对后提交。`;

  return {
    transcript,
    expression: analyzeExpression(transcript, input.durationSec),
  };
}

function mockKnowledgeSuggestion(input: KnowledgeInput): KnowledgeSuggestion {
  const text = `${input.question} ${input.answer}`.toLowerCase();
  const topicName =
    input.topicName?.trim() ||
    (text.includes("redis")
      ? "Redis"
      : text.includes("mysql") || text.includes("索引") || text.includes("事务")
        ? "MySQL"
        : text.includes("react")
          ? "React"
          : text.includes("java") || text.includes("jvm")
            ? "Java"
            : text.includes("系统设计") || text.includes("架构")
              ? "系统设计"
              : text.includes("网络") || text.includes("http")
                ? "计算机网络"
                : "通用技术");
  const companyName = input.companyName?.trim() || "";
  const tags = normalizeTags(input.tags).length
    ? normalizeTags(input.tags)
    : normalizeTags([topicName, "八股", text.includes("项目") ? "项目追问" : "基础"]);
  const questionType = text.includes("项目")
    ? "项目追问"
    : text.includes("架构") || text.includes("设计")
      ? "系统设计"
      : "八股";

  return {
    companyName,
    topicName,
    tags,
    difficulty: text.length > 700 ? "hard" : "medium",
    questionType,
    abilityDimension: questionType === "系统设计" ? "架构设计" : questionType === "项目追问" ? "项目深度" : "基础知识",
    masterySuggestion: 0,
    priorityScore: text.includes("高频") || companyName ? 80 : 60,
    improvedAnswer: input.answer
      ? `可以按「定义 -> 原理 -> 场景 -> 风险/优化」组织：\n${input.answer}`
      : "建议补充：核心概念、底层机制、真实项目场景、常见坑和权衡。",
    note: "AI 已给出分类建议，请按你的真实面经确认后保存。",
  };
}

function mockResumeParse(rawText: string): ResumeParseResult {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const text = rawText.toLowerCase();
  const skills = extractSkills(text);
  const projects = lines.filter((line) => /项目|系统|平台|应用|app|服务|架构/i.test(line)).slice(0, 5);
  const experiences = lines.filter((line) => /公司|实习|工作|负责|参与|主导/i.test(line)).slice(0, 5);

  return {
    summary: lines[0] ? `${lines[0]}，当前简历已提取 ${skills.length} 个技能关键词。` : "已解析简历文本。",
    skills: skills.length ? skills : ["待补充技术栈"],
    experiences: experiences.length ? experiences : ["待补充工作/实习经历"],
    projects: projects.length ? projects : ["待补充项目背景、职责和结果"],
    followUpQuestions: [
      "你最有把握的项目是哪一个？请补充业务目标、技术难点和最终结果。",
      "简历里的核心技术栈分别用到了什么场景？",
      "有没有可以量化的性能、稳定性或业务收益？",
    ],
  };
}

function mockJobTargetParse(rawJd: string): JobTargetParseResult {
  const text = rawJd.toLowerCase();
  const skills = extractSkills(text);

  return {
    responsibilities: [
      rawJd.includes("负责") ? "承担岗位核心模块设计、开发和交付。" : "理解业务目标并完成技术方案落地。",
      rawJd.includes("协作") ? "跨团队协作推进需求上线。" : "与产品、测试或后端协同解决问题。",
    ],
    requiredSkills: skills.length ? skills : ["待从 JD 中补充硬技能"],
    bonusSkills: ["性能优化经验", "复杂问题排查", "业务结果量化"],
    riskPoints: ["需要准备与 JD 技术栈直接相关的项目案例。", "需要把个人贡献和业务结果讲清楚。"],
    interviewFocus: ["项目深挖", "技术原理", "岗位匹配度", "复杂问题处理"],
  };
}

function mockExperienceParse(input: ExperienceInput): ExperienceParseResult {
  const rawText = input.rawText.trim();
  const text = rawText.toLowerCase();
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const companyName =
    input.companyName?.trim() ||
    (text.includes("google")
      ? "Google"
      : text.includes("字节") || text.includes("bytedance")
        ? "字节跳动"
        : text.includes("阿里")
          ? "阿里"
          : "");
  const roleName =
    input.roleName?.trim() ||
    (text.includes("前端")
      ? "前端工程师"
      : text.includes("后端")
        ? "后端工程师"
        : text.includes("product manager") || text.includes("产品")
          ? "产品经理"
          : text.includes("swe") || text.includes("software engineer")
            ? "Software Engineer"
            : "目标岗位");
  const skills = extractSkills(text);
  const questionLines = lines.filter((line) => /问|题|设计|实现|解释|介绍|项目|算法|系统|why|how|\?/.test(line));
  const questions = normalizeExperienceQuestions(questionLines.length ? questionLines : lines);
  const roundHints = lines.filter((line) => /一面|二面|三面|hr|coding|system|系统设计|主管|交叉/i.test(line));
  const roundCount = Math.max(1, Math.min(4, roundHints.length || Math.ceil(Math.max(questions.length, 1) / 3)));
  const rounds = Array.from({ length: roundCount }, (_, index) => {
    const sliced = questions.slice(index * 3, index * 3 + 3);
    const hint = roundHints[index] ?? "";
    const roundType = /hr/i.test(hint)
      ? "HR"
      : /系统|system/i.test(hint)
        ? "系统设计"
        : /coding|算法|代码/i.test(hint)
          ? "coding"
          : index === 0
            ? "一面"
            : index === 1
              ? "二面"
              : "综合";

    return {
      order: index + 1,
      roundType,
      durationMinutes: null,
      interviewerStyle: "",
      focusAreas: normalizeTags([
        roundType,
        ...skills.slice(0, 3),
        sliced.some((question) => question.includes("项目")) ? "项目深挖" : "",
      ]),
      questions: sliced.length ? sliced : ["请补充本轮具体问题。"],
      notes: hint || "AI 根据面经原文拆分，请确认轮次和问题。",
    };
  });

  return {
    companyName,
    roleName,
    level: text.includes("intern") || rawText.includes("实习") ? "实习" : "",
    location: text.includes("remote") || rawText.includes("远程") ? "remote" : "",
    interviewDate: "",
    result: rawText.includes("offer") || rawText.includes("通过") ? "offer" : rawText.includes("挂") || rawText.includes("拒") ? "reject" : "unknown",
    difficulty: questions.length >= 6 || text.includes("hard") || rawText.includes("难") ? "hard" : "medium",
    sourceType: "manual",
    confidence: companyName && questions.length >= 2 ? "medium" : "low",
    verified: false,
    durationMinutes: null,
    summary: `${companyName || "目标公司"} ${roleName} 面经，已提取 ${rounds.length} 个轮次、${questions.length} 个问题，建议确认后生成训练任务。`,
    tags: normalizeTags([companyName, roleName, ...skills.slice(0, 4), "面经"]),
    rounds,
  };
}

function mockResumeJobMatch(resume: ResumeParseResult | null, jobTarget: JobTargetParseResult): ResumeJobMatch {
  const resumeSkills = new Set((resume?.skills ?? []).map((skill) => skill.toLowerCase()));
  const requiredSkills = jobTarget.requiredSkills;
  const matched = requiredSkills.filter((skill) => resumeSkills.has(skill.toLowerCase()));
  const gaps = requiredSkills.filter((skill) => !resumeSkills.has(skill.toLowerCase())).slice(0, 5);
  const matchScore = requiredSkills.length ? Math.round((matched.length / requiredSkills.length) * 70 + 20) : 55;

  return {
    matchScore: Math.min(95, Math.max(35, matchScore)),
    strengths: matched.length ? matched.map((skill) => `简历中已有 ${skill} 相关线索。`) : ["简历项目经历可作为岗位匹配的主要支撑。"],
    gaps: gaps.length ? gaps.map((skill) => `补充 ${skill} 的使用场景和追问答案。`) : ["继续补充量化结果和技术取舍。"],
    projectTalkTracks: [
      "准备一个最匹配 JD 的项目，按背景、目标、方案、难点、结果复盘。",
      "为每个核心技能准备一个真实场景和一个踩坑案例。",
    ],
  };
}

function normalizeExperienceQuestions(lines: string[]) {
  const questions = lines
    .flatMap((line) => line.split(/[；;。]/))
    .map((line) => line.replace(/^[-*\d.、\s]+/, "").trim())
    .filter((line) => line.length >= 4)
    .slice(0, 16);

  return [...new Set(questions)];
}

function mockQuestion(context: InterviewContext): QuestionResult {
  const asked = new Set(context.turns?.map((turn) => turn.question));
  const mode = context.mode;
  const cards = [...(context.knowledgeCards ?? [])].sort(
    (a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0) || (a.mastery ?? 0) - (b.mastery ?? 0),
  );
  const resumeProjects = context.resume?.projects ?? [];
  const jdFocus = context.jobTarget?.interviewFocus ?? [];
  const focus = context.roundType ? roundFocus(context.roundType) : "综合能力";

  const candidates: QuestionResult[] = [];

  if (context.jobTarget && jdFocus[0]) {
    candidates.push({
      source: "jd",
      question: `这轮重点看${focus}。结合目标岗位的「${jdFocus[0]}」，请说一个你最匹配的项目案例。`,
    });
  }

  if (mode !== "company") {
    candidates.push({
      source: "resume",
      question: resumeProjects[0]
        ? `请展开讲讲「${resumeProjects[0]}」：你负责了哪部分，最难的技术点是什么？`
        : "请选择简历中最能代表你能力的一个项目，讲清楚背景、职责、难点和结果。",
    });
  }

  if (mode !== "resume" && cards[0]) {
    candidates.push({
      source: "company",
      question: `目标公司可能关注这类问题：${cards[0].question}`,
    });
  }

  candidates.push({
    source: "general",
    question: `如果面试官要求你证明自己适合${context.targetRole || "这个岗位"}，你会用哪段经历支撑？`,
  });

  return candidates.find((candidate) => !asked.has(candidate.question)) ?? {
    source: "general",
    question: "请补充一个你做过的技术取舍：为什么这样选，代价是什么，结果如何？",
  };
}

function mockAnswerReview(context: InterviewContext): AnswerReview {
  const last = [...(context.turns ?? [])].reverse().find((turn) => turn.answer);
  const answer = last?.answer ?? "";
  const lengthScore = answer.length > 160 ? 4 : answer.length > 70 ? 3 : 2;
  const hasProject = /项目|负责|系统|方案|结果|优化/.test(answer);
  const hasStructure = /背景|目标|方案|难点|结果|首先|其次|最后/.test(answer);

  return {
    feedback: "已记录。后续可以继续补充背景、取舍、结果和复盘。",
    diagnosis: hasStructure ? "结构基本清楚，下一步加强技术细节和量化结果。" : "回答需要更清晰的结构，避免只罗列做过什么。",
    betterAnswer: "建议按「背景 -> 目标 -> 我的职责 -> 技术方案 -> 难点取舍 -> 结果数据 -> 复盘」重述。",
    reviewTags: normalizeTags([last?.source || "面试回答", hasProject ? "项目表达" : "表达结构"]),
    score: {
      accuracy: lengthScore,
      structure: hasStructure ? 4 : 2,
      depth: answer.includes("为什么") || answer.includes("原理") || answer.includes("取舍") ? 4 : 3,
      jobRelevance: context.jobTarget ? 3 : 2,
      projectConnection: hasProject ? 4 : 2,
      expressionClarity: analyzeExpression(answer).structureCompleteness > 60 ? 4 : 3,
    },
  };
}

function mockFinishReview(context: InterviewContext): FinishReview {
  const turns = context.turns ?? [];
  const answered = turns.filter((turn) => turn.answer).length;
  const hasKnowledge = (context.knowledgeCards?.length ?? 0) > 0;
  const expressions = turns.filter((turn) => turn.answer).map((turn) => analyzeExpression(turn.answer ?? ""));
  const avgExpression = expressions.length
    ? Math.round(expressions.reduce((sum, item) => sum + item.structureCompleteness, 0) / expressions.length)
    : 60;

  return {
    summary: `本次共完成 ${answered} 轮回答。整体表达已成型，后续重点是把 JD 匹配、项目细节、技术原理和结果量化连接起来。`,
    score: {
      overall: answered >= 4 ? 80 : 70,
      resume: context.resume ? 76 : 60,
      knowledge: hasKnowledge ? 74 : 58,
      expression: avgExpression,
      jdMatch: context.jobTarget?.match?.matchScore ?? (context.jobTarget ? 72 : 50),
    },
    expressionAdvice: [
      "回答开头先给结论，再展开背景和方案。",
      "每个项目回答至少补一个量化结果。",
      "遇到八股题时绑定一个真实项目场景。",
    ],
    topicWeaknesses: ["项目表达", "八股场景化", "量化结果"],
    reviewCards: [
      {
        title: "项目回答结构",
        weakness: "项目描述容易停留在做了什么，缺少背景、取舍和结果。",
        suggestion: "按「背景 -> 目标 -> 方案 -> 难点 -> 结果 -> 复盘」重写核心项目回答。",
        tags: ["简历深挖", "表达结构"],
        priority: 85,
      },
      {
        title: "八股与场景连接",
        weakness: "技术概念需要绑定到真实项目场景，避免像背答案。",
        suggestion: "每个高频八股准备一个项目中的使用场景、一个踩坑点和一个优化方案。",
        tags: ["八股", "项目追问"],
        priority: 80,
      },
      {
        title: "JD 缺口补齐",
        weakness: "岗位要求和简历项目之间的对应关系还可以更明确。",
        suggestion: "把 JD 的核心技能逐项映射到简历项目，补充可验证证据。",
        tags: ["JD", "岗位匹配"],
        priority: context.jobTarget ? 88 : 60,
      },
    ],
  };
}

function mockSprintPlan(context: SprintContext): SprintPlanResult {
  const days = Math.max(1, Math.min(context.days || 7, 30));
  const tasks: SprintPlanResult["tasks"] = [];
  const weakTags = context.weakTags?.length ? context.weakTags : ["项目表达", "八股", "JD 缺口"];

  for (let day = 1; day <= days; day += 1) {
    const tag = weakTags[(day - 1) % weakTags.length];
    tasks.push({
      dayIndex: day,
      type: day % 3 === 0 ? "mock" : day % 3 === 1 ? "knowledge" : "resume",
      title: day % 3 === 0 ? `第 ${day} 天混合模拟` : `第 ${day} 天复习 ${tag}`,
      description:
        day % 3 === 0
          ? "完成一次 5 题模拟面试，并把低分题回流到复习卡。"
          : `围绕 ${tag} 准备 3 个可复述答案，补充项目场景和量化结果。`,
    });
  }

  tasks.push({
    dayIndex: days,
    type: "review",
    title: "考前错题清理",
    description: "清理所有待复习卡，重点复述掌握度低于 3 的八股和 JD 缺口。",
  });

  return {
    title: `${context.companyName || "目标公司"} ${context.roleName || "目标岗位"} ${days} 天冲刺`,
    summary: "先补 JD 缺口和高频八股，再用模拟面试检验，最后集中清理错题。",
    tasks,
  };
}

function extractSkills(text: string) {
  return [
    "Java",
    "TypeScript",
    "JavaScript",
    "React",
    "Vue",
    "Next.js",
    "Node.js",
    "MySQL",
    "Redis",
    "Spring",
    "Docker",
    "Kubernetes",
    "HTTP",
    "TCP",
    "系统设计",
  ].filter((skill) => text.includes(skill.toLowerCase()));
}
