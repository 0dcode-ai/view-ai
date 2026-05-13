import { z } from "zod";
import { formatKnowledgeStudyGuide, type KnowledgeStudyGuide } from "@/lib/knowledge-study-guide";
import { normalizeTags } from "@/lib/tags";

const knowledgeStudyGuideSchema = z.object({
  headline: z.string().min(1),
  coreAnswer: z.string().min(1),
  interviewAnswer: z.string().min(1),
  problemContext: z.array(z.string()),
  thinkingPath: z.array(z.string()),
  keySteps: z.array(z.string()),
  exampleOrCode: z.string(),
  tradeoffs: z.array(z.string()),
  pitfalls: z.array(z.string()),
  followUps: z.array(z.string()),
  projectHooks: z.array(z.string()),
  reviewChecklist: z.array(z.string()),
});

const knowledgeRecordSchema = z.object({
  question: z.string().min(4),
  answer: z.string().min(12),
  topicName: z.string().min(1),
  tags: z.array(z.string()),
  questionType: z.string().min(1),
  abilityDimension: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  masterySuggestion: z.number().int().min(0).max(4),
  priorityScore: z.number().int().min(0).max(100),
  note: z.string().min(1),
  studyGuide: knowledgeStudyGuideSchema.optional(),
});

const knowledgeRecordBatchSchema = z.object({
  cardDrafts: z.array(knowledgeRecordSchema).min(1),
});

type KnowledgeRecordCompletionPayload = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: unknown;
      reasoning_content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

type KnowledgeRecordChoice = NonNullable<KnowledgeRecordCompletionPayload["choices"]>[number];

export type KnowledgeRecordAgentInput = {
  rawText: string;
  extraContext?: string | null;
};

export type KnowledgeRecordBatchAgentInput = KnowledgeRecordAgentInput & {
  maxCards?: number;
};

export type KnowledgeRecordAgentDraft = z.infer<typeof knowledgeRecordSchema>;

export type KnowledgeRecordAgentExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
};

const knowledgeRecordSystemPrompt =
  "你是一个中文技术面试八股整理 Agent。" +
  "你的任务是参考代码随想录式文章，把用户粘贴的一整段八股文、技术摘录或知识点，改写成一张适合学习、复述和追问的结构化学习卡。" +
  "question 必须是自然的中文面试题；answer 必须是候选人可以直接说出来的精简回答；" +
  "studyGuide 必须包含问题背景、思路、步骤、示例、取舍、易错点、追问、项目连接和复习清单；" +
  "note 必须是把 studyGuide 渲染成 Markdown 后的内容；只输出 JSON，不要 Markdown 代码块。";

const knowledgeRecordSchemaHint = {
  question: "自然的中文面试题",
  answer: "候选人可直接回答的中文版本，先结论，再原理，再场景/取舍",
  topicName: "主题，如 Redis / React / MySQL / 系统设计",
  tags: ["标签 1", "标签 2"],
  questionType: "题型，如 八股 / 项目追问 / 系统设计",
  abilityDimension: "能力维度，如 基础知识 / 性能优化 / 架构设计",
  difficulty: "easy",
  masterySuggestion: 1,
  priorityScore: 70,
  note: "## 一句话结论\n...\n\n## 面试回答\n...\n\n## 考点定位\n- ...",
  studyGuide: {
    headline: "学习标题",
    coreAnswer: "一句话结论",
    interviewAnswer: "90 秒内可复述的面试回答",
    problemContext: ["为什么会问这个问题", "它解决什么场景"],
    thinkingPath: ["先从什么角度切入", "关键机制是什么"],
    keySteps: ["步骤 1", "步骤 2"],
    exampleOrCode: "代码、伪代码或项目例子；没有代码就写工程场景。",
    tradeoffs: ["复杂度、成本或优缺点"],
    pitfalls: ["常见误区或边界条件"],
    followUps: ["常见追问 1", "常见追问 2"],
    projectHooks: ["如何连接到自己的项目"],
    reviewChecklist: ["复习自测项"],
  },
};

const knowledgeRecordBatchSystemPrompt =
  "你是一个中文技术面试八股拆卡 Agent。" +
  "你的任务是参考代码随想录式文章，把用户粘贴的一整篇技术文章、Q&A 文本或面试资料，拆成多张适合学习、复述和追问的结构化学习卡。" +
  "每张卡都必须对应一个独立面试问题；answer 必须是候选人可以直接说出来的精简回答；" +
  "studyGuide 必须包含问题背景、思路、步骤、示例、取舍、易错点、追问、项目连接和复习清单；" +
  "note 必须是把 studyGuide 渲染成 Markdown 后的内容；只输出 JSON，不要 Markdown 代码块。";

const knowledgeRecordBatchSchemaHint = {
  cardDrafts: [knowledgeRecordSchemaHint],
};

function resolveModelName() {
  return process.env.OPENAI_MODEL || "deepseek-v4-pro";
}

function resolveModelLabel() {
  return `${resolveModelName()} · direct HTTP`;
}

function resolveBaseUrl() {
  return (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
}

function shouldUseFallback() {
  return process.env.AI_PROVIDER === "mock" || !process.env.OPENAI_API_KEY;
}

function buildMessages(input: KnowledgeRecordAgentInput) {
  return [
    { role: "system", content: knowledgeRecordSystemPrompt },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "把原始八股文改造成面试可直接使用的一张学习卡。",
          rules: [
            "只输出一个 JSON 对象，不要解释，不要代码块。",
            "键名必须与 outputSchema 完全一致，不要额外包装 answer、data、result、card。",
            "answer 需要口语化、结构化，适合候选人面试时复述，不要只是原文摘抄。",
            "note 必须明确写出 必说点、常见追问、项目连接 三部分。",
            "如果原始内容很散，优先提炼出最常被问到的主问题。",
          ],
          outputSchema: knowledgeRecordSchemaHint,
          input,
        },
        null,
        2,
      ),
    },
  ];
}

function buildBatchMessages(input: KnowledgeRecordBatchAgentInput) {
  return [
    { role: "system", content: knowledgeRecordBatchSystemPrompt },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "把原始技术文章拆成多张面试八股学习卡。",
          rules: [
            `最多输出 ${input.maxCards ?? 8} 张卡，优先保留最像面试题的 Q&A 段落。`,
            "只输出一个 JSON 对象，不要解释，不要代码块。",
            "顶层必须是 cardDrafts 数组，不要额外包装 answer、data、result、cards。",
            "每张卡的 question 必须是自然的中文面试题。",
            "每张卡的 answer 需要口语化、结构化，适合候选人面试时复述，不要只是原文摘抄。",
            "每张卡的 note 必须明确写出 必说点、常见追问、项目连接 三部分。",
          ],
          outputSchema: knowledgeRecordBatchSchemaHint,
          input,
        },
        null,
        2,
      ),
    },
  ];
}

function buildRequestBody(messages: Array<{ role: string; content: string }>, preferJsonMode: boolean) {
  return {
    model: resolveModelName(),
    temperature: 0.2,
    max_tokens: 3200,
    thinking: { type: "disabled" as const },
    messages,
    ...(preferJsonMode
      ? {
          response_format: { type: "json_object" as const },
        }
      : {}),
  };
}

function buildStudyGuide(input: {
  question: string;
  answer: string;
  topicName: string;
  rawText: string;
  tags: string[];
}): KnowledgeStudyGuide {
  const excerpt = input.rawText.trim().replace(/\s+/g, " ");
  const topicName = input.topicName || "技术八股";

  return {
    headline: input.question,
    coreAnswer:
      input.answer
        .split(/\n+/)
        .map((line) => line.trim())
        .find(Boolean) || `先讲清楚 ${topicName} 解决的问题，再讲核心机制、边界和项目落地。`,
    interviewAnswer: input.answer,
    problemContext: [
      `这题通常用来判断你是否真正理解 ${topicName} 的使用场景和底层机制。`,
      excerpt ? `原始材料里的关键上下文：${excerpt.slice(0, 160)}${excerpt.length > 160 ? "..." : ""}` : `需要把 ${topicName} 放到真实工程场景里说明。`,
    ],
    thinkingPath: [
      "先给一句话结论，避免一上来堆概念。",
      "再解释核心原理或关键流程，让面试官看到你不是死背。",
      "最后补使用场景、取舍风险和项目例子。",
    ],
    keySteps: ["定义它解决什么问题", "拆核心机制或流程", "说明适用场景", "讲清边界和坑", "连接项目中的一次使用或优化"],
    exampleOrCode:
      excerpt.length > 0
        ? `可以用这段材料抽一个例子：${excerpt.slice(0, 260)}${excerpt.length > 260 ? "..." : ""}`
        : `准备一段 ${topicName} 在项目中的伪代码、配置片段或排障过程。`,
    tradeoffs: ["回答时要同时讲收益和成本，例如性能、复杂度、一致性、可维护性或团队协作成本。"],
    pitfalls: ["不要只背定义；不要忽略边界条件；不要把所有场景都说成必须使用同一种方案。"],
    followUps: ["为什么这个方案适合这个场景？", "如果规模扩大或约束变化，你会怎么调整？", "你在项目里怎么验证它确实有效？"],
    projectHooks: [`准备一个你在真实项目里用到 ${topicName} 的场景，按“背景 -> 动作 -> 结果 -> 复盘”讲。`],
    reviewChecklist: ["30 秒说出结论", "90 秒讲完机制和场景", "能回答 2 个追问", "能连到项目经历", "能说出一个风险或替代方案"],
  };
}

function normalizeStudyGuide(candidate: KnowledgeRecordAgentDraft, rawText = "") {
  const guide = candidate.studyGuide ?? buildStudyGuide({
    question: candidate.question,
    answer: candidate.answer,
    topicName: candidate.topicName,
    rawText,
    tags: candidate.tags,
  });

  const normalizedGuide: KnowledgeStudyGuide = {
    headline: guide.headline.trim() || candidate.question.trim(),
    coreAnswer: guide.coreAnswer.trim() || candidate.answer.trim(),
    interviewAnswer: guide.interviewAnswer.trim() || candidate.answer.trim(),
    problemContext: normalizeStringList(guide.problemContext),
    thinkingPath: normalizeStringList(guide.thinkingPath),
    keySteps: normalizeStringList(guide.keySteps),
    exampleOrCode: guide.exampleOrCode.trim() || "准备一个真实项目示例或伪代码片段。",
    tradeoffs: normalizeStringList(guide.tradeoffs),
    pitfalls: normalizeStringList(guide.pitfalls),
    followUps: normalizeStringList(guide.followUps),
    projectHooks: normalizeStringList(guide.projectHooks),
    reviewChecklist: normalizeStringList(guide.reviewChecklist),
  };

  return normalizedGuide;
}

function normalizeStringList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function readMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
          return part.text;
        }

        return JSON.stringify(part);
      })
      .join("\n");
  }

  return JSON.stringify(content ?? "");
}

function extractJsonValue(content: string): unknown | null {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as unknown;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function unwrapCandidate(candidate: unknown) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return candidate;
  }

  const record = candidate as Record<string, unknown>;
  for (const key of ["answer", "data", "result", "card", "cardDraft", "output"]) {
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested;
    }
  }

  return candidate;
}

function unwrapBatchCandidate(candidate: unknown) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return candidate;
  }

  const record = candidate as Record<string, unknown>;
  if (Array.isArray(record.cardDrafts)) {
    return candidate;
  }

  for (const key of ["answer", "data", "result", "cards", "output"]) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return { cardDrafts: nested };
    }
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return unwrapBatchCandidate(nested);
    }
  }

  return candidate;
}

async function requestCompletion(messages: Array<{ role: string; content: string }>, preferJsonMode: boolean) {
  const response = await fetch(`${resolveBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(buildRequestBody(messages, preferJsonMode)),
    signal: AbortSignal.timeout(180000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `GLM request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as KnowledgeRecordCompletionPayload;
  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  return payload;
}

function summarizeResponse(choice: KnowledgeRecordChoice | undefined, preferJsonMode: boolean) {
  const content = readMessageContent(choice?.message?.content).trim();
  const reasoning =
    typeof choice?.message?.reasoning_content === "string" ? choice.message.reasoning_content.trim() : "";
  const finishReason = choice?.finish_reason || "unknown";
  const modeLabel = preferJsonMode ? "json_object" : "plain_json_prompt";

  if (content) {
    return {
      content,
      diagnostic: `${modeLabel} 已返回正文（finish_reason=${finishReason}）。`,
    };
  }

  if (reasoning) {
    return {
      content,
      diagnostic: `${modeLabel} 仅返回推理内容，正文为空（finish_reason=${finishReason}）。`,
    };
  }

  return {
    content,
    diagnostic: `${modeLabel} 未返回可用正文（finish_reason=${finishReason}）。`,
  };
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function detectTopic(rawText: string) {
  const source = rawText.toLowerCase();
  const topicMatchers: Array<{ topic: string; patterns: RegExp[] }> = [
    { topic: "Redis", patterns: [/redis/] },
    { topic: "MySQL", patterns: [/mysql/, /索引/, /事务/, /mvcc/] },
    { topic: "React", patterns: [/react/, /useeffect/, /hooks?/] },
    { topic: "JavaScript", patterns: [/javascript/, /\bjs\b/, /事件循环/, /闭包/, /原型/] },
    { topic: "Node.js", patterns: [/node/, /event loop/, /中间件/] },
    { topic: "网络", patterns: [/http/, /https/, /tcp/, /udp/, /cdn/] },
    { topic: "系统设计", patterns: [/限流/, /熔断/, /消息队列/, /分布式/, /一致性/] },
  ];

  return topicMatchers.find((item) => item.patterns.some((pattern) => pattern.test(source)))?.topic || "技术八股";
}

function buildTags(rawText: string, extraContext: string) {
  const source = `${rawText} ${extraContext}`.toLowerCase();
  const tags = [
    /redis/.test(source) && "Redis",
    (/react/.test(source) || /hooks?/.test(source)) && "React",
    (/javascript/.test(source) || /\bjs\b/.test(source) || /事件循环/.test(source)) && "JavaScript",
    (/mysql/.test(source) || /索引/.test(source) || /事务/.test(source)) && "MySQL",
    (/http/.test(source) || /tcp/.test(source) || /网络/.test(source)) && "网络",
    (/系统设计/.test(source) || /分布式/.test(source) || /消息队列/.test(source)) && "系统设计",
    "八股",
    /项目/.test(source) && "项目追问",
  ].filter((tag): tag is string => typeof tag === "string");

  return normalizeTags(tags);
}

function deriveQuestion(rawText: string, topicName: string) {
  const firstSentence = rawText
    .split(/[\n。！？]/)
    .map((line) => line.trim())
    .find(Boolean);

  if (firstSentence && /[？?]|是什么|为什么|怎么|如何|区别|原理/.test(firstSentence)) {
    return firstSentence.endsWith("？") || firstSentence.endsWith("?") ? firstSentence : `${firstSentence}？`;
  }

  return `面试里怎么讲清楚 ${topicName} 的核心原理和使用取舍？`;
}

function buildFallback(input: KnowledgeRecordAgentInput): KnowledgeRecordAgentDraft {
  const topicName = detectTopic(input.rawText);
  const tags = buildTags(input.rawText, input.extraContext ?? "");
  const answerExcerpt = input.rawText.trim().replace(/\s+/g, " ");

  const answer =
    `先给结论：${topicName} 这块面试时不要背原文，要按“定义/作用 -> 核心原理 -> 使用场景 -> 优缺点或取舍”去讲。` +
    `\n\n如果按你贴的内容先说一版，可以概括为：${answerExcerpt.slice(0, 320)}${answerExcerpt.length > 320 ? "..." : ""}`;
  const guide = buildStudyGuide({
    question: deriveQuestion(input.rawText, topicName),
    answer,
    topicName,
    rawText: input.rawText,
    tags,
  });

  return {
    question: deriveQuestion(input.rawText, topicName),
    answer,
    topicName,
    tags: tags.length ? tags : ["八股", topicName],
    questionType: "八股",
    abilityDimension: topicName === "系统设计" ? "架构设计" : "基础知识",
    difficulty: "medium",
    masterySuggestion: 1,
    priorityScore: 72,
    note: formatKnowledgeStudyGuide(guide),
    studyGuide: guide,
  };
}

function looksLikeQuestion(line: string) {
  return /[？?]$/.test(line) || /^(什么是|如何|怎么|为什么|哪些|你有哪些|谈谈|说说)/.test(line);
}

function splitQuestionSections(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections: Array<{ question: string; body: string }> = [];

  for (const line of lines) {
    if (looksLikeQuestion(line)) {
      sections.push({ question: line.endsWith("？") || line.endsWith("?") ? line : `${line}？`, body: "" });
      continue;
    }

    const current = sections[sections.length - 1];
    if (current) {
      current.body = [current.body, line].filter(Boolean).join("\n");
    }
  }

  if (sections.length > 0) {
    return sections.filter((section) => section.body.trim().length > 0);
  }

  return rawText
    .split(/\n{2,}|(?<=。)\s*(?=什么是|如何|怎么|为什么|哪些|你有哪些|谈谈|说说)/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 20)
    .map((chunk) => ({
      question: deriveQuestion(chunk, detectTopic(chunk)),
      body: chunk,
    }));
}

function buildFallbackBatch(input: KnowledgeRecordBatchAgentInput): KnowledgeRecordAgentDraft[] {
  const maxCards = Math.max(1, Math.min(12, input.maxCards ?? 8));
  const sections = splitQuestionSections(input.rawText).slice(0, maxCards);
  const sourceSections = sections.length
    ? sections
    : [{ question: deriveQuestion(input.rawText, detectTopic(input.rawText)), body: input.rawText }];

  return sourceSections.map((section) => {
    const topicName = detectTopic(`${section.question}\n${section.body}`);
    const tags = buildTags(`${section.question}\n${section.body}`, input.extraContext ?? "");
    const answerExcerpt = section.body.trim().replace(/\s+/g, " ");
    const answer =
      `先给结论：${answerExcerpt.slice(0, 140)}${answerExcerpt.length > 140 ? "..." : ""}` +
      `\n\n面试时可以按“定义/原因 -> 解决思路 -> 工程落地 -> 取舍风险”展开。` +
      `\n\n结合原文，这题重点是：${answerExcerpt.slice(0, 420)}${answerExcerpt.length > 420 ? "..." : ""}`;
    const guide = buildStudyGuide({
      question: section.question,
      answer,
      topicName,
      rawText: section.body,
      tags,
    });

    return normalizeDraft({
      question: section.question,
      answer,
      topicName,
      tags: tags.length ? tags : ["八股", topicName],
      questionType: "八股",
      abilityDimension: topicName === "系统设计" ? "架构设计" : "基础知识",
      difficulty: "medium",
      masterySuggestion: 1,
      priorityScore: 74,
      note: formatKnowledgeStudyGuide(guide),
      studyGuide: guide,
    });
  });
}

function normalizeDraft(draft: KnowledgeRecordAgentDraft, rawText = ""): KnowledgeRecordAgentDraft {
  const guide = normalizeStudyGuide(draft, rawText);
  return {
    ...draft,
    question: draft.question.trim(),
    answer: draft.answer.trim(),
    topicName: draft.topicName.trim() || "技术八股",
    tags: normalizeTags(draft.tags),
    questionType: draft.questionType.trim() || "八股",
    abilityDimension: draft.abilityDimension.trim() || "基础知识",
    priorityScore: Math.max(0, Math.min(100, Math.round(draft.priorityScore))),
    masterySuggestion: Math.max(0, Math.min(4, Math.round(draft.masterySuggestion))),
    note: formatKnowledgeStudyGuide(guide),
    studyGuide: guide,
  };
}

export async function runKnowledgeRecordAgent(input: KnowledgeRecordAgentInput): Promise<{
  cardDraft: KnowledgeRecordAgentDraft;
  execution: KnowledgeRecordAgentExecution;
}> {
  const fallback = buildFallback(input);

  if (shouldUseFallback()) {
    return {
      cardDraft: fallback,
      execution: {
        steps: ["当前未启用可用的 GLM 凭据，已直接使用本地 fallback 草稿。"],
        model: resolveModelLabel(),
        usedFallback: true,
      },
    };
  }

  const messages = buildMessages(input);
  const diagnostics: string[] = [];

  for (const preferJsonMode of [false, true]) {
    try {
      const payload = await requestCompletion(messages, preferJsonMode);
      const choice = payload.choices?.[0];

      if (!choice) {
        diagnostics.push(`${preferJsonMode ? "json_object" : "plain_json_prompt"} 没有返回 choices。`);
        continue;
      }

      const responseSummary = summarizeResponse(choice, preferJsonMode);
      diagnostics.push(responseSummary.diagnostic);

      const candidate = unwrapCandidate(extractJsonValue(responseSummary.content));
      const parsed = knowledgeRecordSchema.safeParse(candidate);
      if (parsed.success) {
        return {
          cardDraft: normalizeDraft(parsed.data, input.rawText),
          execution: {
            steps: [
              "已把原始八股文改写成可直接复述的面试卡。",
              ...diagnostics,
            ],
            model: resolveModelLabel(),
            usedFallback: false,
          },
        };
      }

      diagnostics.push(`${preferJsonMode ? "json_object" : "plain_json_prompt"} 返回的正文没能通过学习卡 schema 校验。`);
    } catch (error) {
      diagnostics.push(`${preferJsonMode ? "json_object" : "plain_json_prompt"} 直连 GLM 调用失败：${readErrorMessage(error)}.`);
    }
  }

  return {
    cardDraft: fallback,
    execution: {
      steps: [
        "模型没有稳定产出合格的学习卡结构，已先给你一版可编辑草稿。",
        ...diagnostics,
      ],
      model: resolveModelLabel(),
      usedFallback: true,
    },
  };
}

export async function runKnowledgeRecordBatchAgent(input: KnowledgeRecordBatchAgentInput): Promise<{
  cardDrafts: KnowledgeRecordAgentDraft[];
  execution: KnowledgeRecordAgentExecution;
}> {
  const fallback = buildFallbackBatch(input);

  if (shouldUseFallback()) {
    return {
      cardDrafts: fallback,
      execution: {
        steps: [`当前未启用可用的 GLM 凭据，已用本地规则拆出 ${fallback.length} 张八股卡草稿。`],
        model: resolveModelLabel(),
        usedFallback: true,
      },
    };
  }

  const messages = buildBatchMessages(input);
  const diagnostics: string[] = [];

  for (const preferJsonMode of [false, true]) {
    try {
      const payload = await requestCompletion(messages, preferJsonMode);
      const choice = payload.choices?.[0];

      if (!choice) {
        diagnostics.push(`${preferJsonMode ? "json_object" : "plain_json_prompt"} 没有返回 choices。`);
        continue;
      }

      const responseSummary = summarizeResponse(choice, preferJsonMode);
      diagnostics.push(responseSummary.diagnostic);

      const candidate = unwrapBatchCandidate(extractJsonValue(responseSummary.content));
      const parsed = knowledgeRecordBatchSchema.safeParse(candidate);
      if (parsed.success) {
        const maxCards = Math.max(1, Math.min(12, input.maxCards ?? 8));
        return {
          cardDrafts: parsed.data.cardDrafts.slice(0, maxCards).map((draft) => normalizeDraft(draft, input.rawText)),
          execution: {
            steps: [
              "已把技术文章拆成多张可复述的面试八股卡。",
              ...diagnostics,
            ],
            model: resolveModelLabel(),
            usedFallback: false,
          },
        };
      }

      diagnostics.push(`${preferJsonMode ? "json_object" : "plain_json_prompt"} 返回的正文没能通过批量学习卡 schema 校验。`);
    } catch (error) {
      diagnostics.push(`${preferJsonMode ? "json_object" : "plain_json_prompt"} 直连 GLM 调用失败：${readErrorMessage(error)}.`);
    }
  }

  return {
    cardDrafts: fallback,
    execution: {
      steps: [
        `模型没有稳定产出合格的批量学习卡结构，已用本地规则拆出 ${fallback.length} 张草稿。`,
        ...diagnostics,
      ],
      model: resolveModelLabel(),
      usedFallback: true,
    },
  };
}
