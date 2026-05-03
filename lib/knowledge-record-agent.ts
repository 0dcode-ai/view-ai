import { z } from "zod";
import { normalizeTags } from "@/lib/tags";

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

export type KnowledgeRecordAgentDraft = z.infer<typeof knowledgeRecordSchema>;

export type KnowledgeRecordAgentExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
};

const knowledgeRecordSystemPrompt =
  "你是一个中文技术面试八股整理 Agent。" +
  "你的任务是把用户粘贴的一整段八股文、技术摘录或知识点，改写成一张适合面试复述的学习卡。" +
  "question 必须是自然的中文面试题；answer 必须是候选人可以直接说出来的回答；" +
  "note 必须包含“必说点 / 常见追问 / 项目连接”三部分；只输出 JSON，不要 Markdown 代码块。";

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
  note: "必说点：...\n常见追问：...\n项目连接：...",
};

function resolveModelName() {
  return process.env.OPENAI_MODEL || "GLM-5.1";
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

  return {
    question: deriveQuestion(input.rawText, topicName),
    answer:
      `先给结论：${topicName} 这块面试时不要背原文，要按“定义/作用 -> 核心原理 -> 使用场景 -> 优缺点或取舍”去讲。` +
      `\n\n如果按你贴的内容先说一版，可以概括为：${answerExcerpt.slice(0, 320)}${answerExcerpt.length > 320 ? "..." : ""}`,
    topicName,
    tags: tags.length ? tags : ["八股", topicName],
    questionType: "八股",
    abilityDimension: topicName === "系统设计" ? "架构设计" : "基础知识",
    difficulty: "medium",
    masterySuggestion: 1,
    priorityScore: 72,
    note:
      `必说点：先交代 ${topicName} 的定义、解决什么问题，再讲核心原理和使用边界。` +
      `\n常见追问：为什么这样设计、和替代方案有什么区别、会有什么风险或坑。` +
      `\n项目连接：准备一个你在真实项目里用到 ${topicName} 的场景，补一句效果或踩坑复盘。` +
      `\n原始摘录：${answerExcerpt.slice(0, 220)}${answerExcerpt.length > 220 ? "..." : ""}`,
  };
}

function normalizeDraft(draft: KnowledgeRecordAgentDraft): KnowledgeRecordAgentDraft {
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
    note: draft.note.trim(),
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
          cardDraft: normalizeDraft(parsed.data),
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
