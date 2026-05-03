import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { normalizeTags } from "@/lib/tags";

const startupIdeaStatuses = ["idea", "research", "testing", "validated", "paused"] as const;

const briefSchema = z.object({
  title: z.string(),
  oneLiner: z.string(),
  problemSummary: z.string(),
  targetUsers: z.array(z.string()),
  productAngle: z.string(),
  tags: z.array(z.string()),
  watchouts: z.array(z.string()),
});

const expansionSchema = z.object({
  problem: z.string(),
  targetUsers: z.string(),
  solution: z.string(),
  aiAgentFlow: z.string(),
  dataSignals: z.string(),
  monetization: z.string(),
  validationPlan: z.string(),
  risks: z.string(),
});

const finalIdeaSchema = z.object({
  title: z.string(),
  oneLiner: z.string(),
  problem: z.string(),
  targetUsers: z.string(),
  solution: z.string(),
  aiAgentFlow: z.string(),
  dataSignals: z.string(),
  monetization: z.string(),
  validationPlan: z.string(),
  risks: z.string(),
  tags: z.array(z.string()),
  status: z.enum(startupIdeaStatuses),
});

export type StartupIdeaAgentInput = {
  rawIdea: string;
  extraContext?: string | null;
};

export type StartupIdeaAgentIdea = z.infer<typeof finalIdeaSchema>;

export type StartupIdeaAgentExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
};

type IdeaBrief = z.infer<typeof briefSchema>;
type IdeaExpansion = z.infer<typeof expansionSchema>;
type IdeaRole = "system" | "user";
type IdeaChatMessage = {
  role: IdeaRole;
  content: string;
};

type IdeaCompletionPayload = {
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

type IdeaCompletionChoice = NonNullable<IdeaCompletionPayload["choices"]>[number];

type InvokeJsonStepResult<T> = {
  value: T;
  usedFallback: boolean;
  diagnostics: string[];
};

const briefSchemaHint = {
  title: "创业想法标题",
  oneLiner: "一句话描述",
  problemSummary: "核心问题摘要",
  targetUsers: ["目标用户 1", "目标用户 2"],
  productAngle: "产品切入角度",
  tags: ["标签 1", "标签 2"],
  watchouts: ["风险点 1", "风险点 2"],
};

const expansionSchemaHint = {
  problem: "问题详情",
  targetUsers: "目标用户详情",
  solution: "解决方案详情",
  aiAgentFlow: "Agent 工作流",
  dataSignals: "数据输入与反馈信号",
  monetization: "商业化路径",
  validationPlan: "验证计划",
  risks: "风险与注意事项",
};

const finalIdeaSchemaHint = {
  title: "创业想法标题",
  oneLiner: "一句话描述",
  problem: "问题详情",
  targetUsers: "目标用户详情",
  solution: "解决方案详情",
  aiAgentFlow: "Agent 工作流",
  dataSignals: "数据输入与反馈信号",
  monetization: "商业化路径",
  validationPlan: "验证计划",
  risks: "风险与注意事项",
  tags: ["标签 1", "标签 2"],
  status: "idea",
};

function lastValueWithDefault<T>(defaultValue: () => T) {
  return Annotation<T>({
    reducer: (_left, right) => right,
    default: defaultValue,
  });
}

const AgentState = Annotation.Root({
  rawIdea: Annotation<string>,
  extraContext: lastValueWithDefault(() => ""),
  brief: lastValueWithDefault<IdeaBrief | null>(() => null),
  expansion: lastValueWithDefault<IdeaExpansion | null>(() => null),
  finalIdea: lastValueWithDefault<StartupIdeaAgentIdea | null>(() => null),
  steps: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  usedFallback: lastValueWithDefault(() => false),
  modelLabel: lastValueWithDefault(() => resolveIdeaModelLabel()),
});

const ideaSystemPrompt =
  "你是一个中文创业想法 Agent，负责把用户的一句话产品想法扩写成可执行的一页产品卡。" +
  "输出必须具体、像真实创始人在拆解方案，不要空话，不要讲大道理，不要输出 Markdown，只输出 JSON。";

function resolveIdeaModelName() {
  return process.env.OPENAI_MODEL || "GLM-5.1";
}

function resolveIdeaModelLabel() {
  return `${resolveIdeaModelName()} · direct HTTP`;
}

function shouldUseFallback() {
  return process.env.AI_PROVIDER === "mock" || !process.env.OPENAI_API_KEY;
}

function resolveIdeaBaseUrl() {
  return (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
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

function buildIdeaMessages(task: string, input: Record<string, unknown>, schemaHint: Record<string, unknown>): IdeaChatMessage[] {
  return [
    { role: "system", content: ideaSystemPrompt },
    {
      role: "user",
      content: JSON.stringify(
        {
          task,
          rules: [
            "只输出一个 JSON 对象，不要解释，不要代码块。",
            "键名必须与 outputSchema 完全一致，不要额外包装 answer、data、result、idea。",
            "数组字段必须输出 JSON array，字符串字段必须输出 string。",
            "如果某个字段信息不足，也要保留该字段并给出当前最合理的具体草稿。",
          ],
          outputSchema: schemaHint,
          input,
        },
        null,
        2,
      ),
    },
  ];
}

function buildIdeaRequestBody(messages: IdeaChatMessage[], preferJsonMode: boolean) {
  return {
    model: resolveIdeaModelName(),
    temperature: 0.25,
    max_tokens: 4096,
    thinking: { type: "disabled" as const },
    messages,
    ...(preferJsonMode
      ? {
          response_format: { type: "json_object" as const },
        }
      : {}),
  };
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

function unwrapIdeaCandidate(candidate: unknown) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return candidate;
  }

  const record = candidate as Record<string, unknown>;
  for (const key of ["answer", "data", "result", "idea", "output"]) {
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested;
    }
  }

  return candidate;
}

async function requestIdeaCompletion(messages: IdeaChatMessage[], preferJsonMode: boolean) {
  const response = await fetch(`${resolveIdeaBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(buildIdeaRequestBody(messages, preferJsonMode)),
    signal: AbortSignal.timeout(180000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `GLM request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as IdeaCompletionPayload;
  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  return payload;
}

function readIdeaReasoning(choice: IdeaCompletionChoice | undefined) {
  return typeof choice?.message?.reasoning_content === "string" ? choice.message.reasoning_content.trim() : "";
}

function summarizeIdeaResponse(choice: IdeaCompletionChoice | undefined, preferJsonMode: boolean) {
  const content = readMessageContent(choice?.message?.content).trim();
  const reasoning = readIdeaReasoning(choice);
  const finishReason = choice?.finish_reason || "unknown";
  const modeLabel = preferJsonMode ? "json_object" : "plain_json_prompt";

  if (content) {
    return {
      content,
      finishReason,
      diagnostic: `${modeLabel} 已返回正文（finish_reason=${finishReason}）。`,
    };
  }

  if (reasoning) {
    return {
      content,
      finishReason,
      diagnostic: `${modeLabel} 仅返回推理内容，正文为空（finish_reason=${finishReason}）。`,
    };
  }

  return {
    content,
    finishReason,
    diagnostic: `${modeLabel} 未返回可用正文（finish_reason=${finishReason}）。`,
  };
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function invokeJsonStep<T>(
  schema: z.ZodSchema<T>,
  task: string,
  input: Record<string, unknown>,
  schemaHint: Record<string, unknown>,
  fallback: T,
): Promise<InvokeJsonStepResult<T>> {
  if (shouldUseFallback()) {
    return {
      value: fallback,
      usedFallback: true,
      diagnostics: ["当前未启用可用的 GLM 凭据，已直接使用本地 fallback。"],
    };
  }

  const messages = buildIdeaMessages(task, input, schemaHint);
  const diagnostics: string[] = [];

  for (const preferJsonMode of [false, true]) {
    try {
      const payload = await requestIdeaCompletion(messages, preferJsonMode);
      const choice = payload.choices?.[0];

      if (!choice) {
        diagnostics.push(`${preferJsonMode ? "json_object" : "plain_json_prompt"} 没有返回 choices。`);
        continue;
      }

      const responseSummary = summarizeIdeaResponse(choice, preferJsonMode);
      diagnostics.push(responseSummary.diagnostic);

      const candidate = unwrapIdeaCandidate(extractJsonValue(responseSummary.content));
      const parsed = schema.safeParse(candidate);
      if (parsed.success) {
        return { value: parsed.data, usedFallback: false, diagnostics };
      }

      diagnostics.push(`${preferJsonMode ? "json_object" : "plain_json_prompt"} 返回的正文没能通过当前节点 schema 校验。`);
    } catch (error) {
      diagnostics.push(`${preferJsonMode ? "json_object" : "plain_json_prompt"} 直连 GLM 调用失败：${readErrorMessage(error)}.`);
    }
  }

  return { value: fallback, usedFallback: true, diagnostics };
}

function compactIdeaText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildIdeaTags(rawIdea: string, extraContext: string) {
  const source = `${rawIdea} ${extraContext}`.toLowerCase();
  const candidates: Array<{ tag: string; patterns: RegExp[] }> = [
    { tag: "AI Agent", patterns: [/agent/i, /智能体/, /工作流/, /自动化/] },
    { tag: "SaaS", patterns: [/saas/i, /订阅/, /协作/, /后台/] },
    { tag: "B2B", patterns: [/b2b/i, /企业/, /团队/, /公司客户/] },
    { tag: "消费应用", patterns: [/消费者/, /个人用户/, /社区/, /内容平台/] },
    { tag: "内容", patterns: [/内容/, /播客/, /文章/, /创作/, /媒体/] },
    { tag: "效率工具", patterns: [/效率/, /管理/, /协作/, /工作台/, /助手/] },
    { tag: "数据产品", patterns: [/数据/, /分析/, /画像/, /看板/, /指标/] },
    { tag: "招聘", patterns: [/招聘/, /简历/, /面试/, /候选人/] },
  ];

  return normalizeTags(
    candidates.filter((item) => item.patterns.some((pattern) => pattern.test(source))).map((item) => item.tag),
  );
}

function deriveIdeaTitle(rawIdea: string) {
  const firstLine = rawIdea.split(/\n+/).find(Boolean)?.trim() || rawIdea.trim();
  const normalized = firstLine
    .replace(/^我想做(一个)?/, "")
    .replace(/^做(一个)?/, "")
    .replace(/^想做(一个)?/, "")
    .replace(/^一个/, "")
    .trim();

  const title = normalized.split(/[，。；：]/)[0]?.trim() || "AI 创业想法";
  return title.length > 24 ? title.slice(0, 24) : title;
}

function buildFallbackBrief(input: StartupIdeaAgentInput): IdeaBrief {
  const title = deriveIdeaTitle(input.rawIdea);
  const tags = buildIdeaTags(input.rawIdea, input.extraContext ?? "");
  const raw = compactIdeaText(input.rawIdea);
  const context = compactIdeaText(input.extraContext ?? "");

  return {
    title,
    oneLiner: raw,
    problemSummary: `当前市场里还没有把“${title}”这件事做得足够顺手，用户要么流程太碎，要么需要自己拼很多工具，导致需求存在但完成成本偏高。`,
    targetUsers: [
      "有明确场景痛点、愿意尝试新工具的早期用户",
      "在高频任务里反复遇到同类问题的人群",
      context ? `特别适合强调“${context}”这一使用条件的人群` : "希望用更少时间完成更多事情的用户",
    ],
    productAngle: `先把“${title}”打磨成一个单点价值非常明确的产品，再逐步扩展成可复用的 Agent 能力。`,
    tags: tags.length ? tags : ["AI Agent", "创业", "效率工具"],
    watchouts: [
      "要先验证用户是不是愿意持续使用，而不是只觉得概念有趣。",
      "需要尽量缩小 MVP 范围，避免一开始功能太大。",
      "如果依赖第三方数据或平台，需要尽早评估接入和合规成本。",
    ],
  };
}

function buildFallbackExpansion(input: StartupIdeaAgentInput, brief: IdeaBrief): IdeaExpansion {
  const context = compactIdeaText(input.extraContext ?? "");

  return {
    problem: `${brief.problemSummary} 现在常见替代方案通常是人工整理、多个工具来回切换，或者只能拿到一部分结果，导致体验不稳定，也不容易形成持续留存。`,
    targetUsers: `${brief.targetUsers.join("；")}。早期种子用户最好是已经有明确预算、时间压力或者内容产出需求的人群。`,
    solution: `产品核心是把“${brief.title}”做成一个能直接交付结果的工作台。用户输入目标后，系统自动拆解任务、给出建议、产出结果，并保留可编辑空间。先把最关键的一次完成体验做顺，再叠加协作、沉淀和复用能力。`,
    aiAgentFlow: `1. 接收用户目标与上下文：用户描述想法、场景、限制条件${context ? `，重点考虑“${context}”` : ""}。\n2. Agent 拆解任务：识别核心问题、关键对象、成功标准和约束。\n3. 规划执行链路：决定先调研、再生成、再校验的步骤顺序。\n4. 生成可执行结果：输出方案草稿、结构化内容或下一步动作。\n5. 允许用户微调：用户保留人工判断，系统根据修改继续迭代。\n6. 沉淀反馈闭环：记录哪些建议被采纳、哪些步骤最有价值，用于后续优化。`,
    dataSignals: `第一阶段优先使用用户主动输入的数据，比如目标、偏好、已有素材、限制条件和历史案例。第二阶段再接入行为数据、点击路径、任务完成率、编辑频次和转化结果，帮助 Agent 逐步学会什么样的输出最容易被接受。`,
    monetization: `可以先从订阅制切入，按个人版和团队版收费；如果面向企业，也可以做按席位收费或按成功结果收费。后续还可以提供定制模板、专属工作流和咨询型服务作为增值项。`,
    validationPlan: `第一步做一个最小可用 Demo，只解决一个最痛的子问题；第二步找 5 到 10 个高意愿用户连续试用一周；第三步重点看复用率、留存和用户是否愿意把自己的真实任务迁移进来；第四步根据留存最高的场景收窄产品边界。`,
    risks: `${brief.watchouts.join(" ")} 同时还要防止输出结果看起来很完整，但实际上没有真正帮用户节省时间；如果 AI 成本过高或响应过慢，也会直接影响付费意愿。`,
  };
}

function buildFallbackFinalIdea(input: StartupIdeaAgentInput): StartupIdeaAgentIdea {
  const brief = buildFallbackBrief(input);
  const expansion = buildFallbackExpansion(input, brief);

  return {
    title: brief.title,
    oneLiner: brief.oneLiner,
    problem: expansion.problem,
    targetUsers: expansion.targetUsers,
    solution: expansion.solution,
    aiAgentFlow: expansion.aiAgentFlow,
    dataSignals: expansion.dataSignals,
    monetization: expansion.monetization,
    validationPlan: expansion.validationPlan,
    risks: expansion.risks,
    tags: normalizeTags(brief.tags),
    status: "idea",
  };
}

async function analyzeIdeaNode(state: typeof AgentState.State) {
  const fallback = buildFallbackBrief({ rawIdea: state.rawIdea, extraContext: state.extraContext });
  const result = await invokeJsonStep(
    briefSchema,
    "把用户的一句话创业想法拆成一个结构化 brief。字段必须具体，像早期产品负责人在写立项摘要。",
    {
      rawIdea: state.rawIdea,
      extraContext: state.extraContext,
    },
    briefSchemaHint,
    fallback,
  );

  return {
    brief: {
      ...result.value,
      tags: normalizeTags(result.value.tags),
      targetUsers: result.value.targetUsers.filter(Boolean).slice(0, 5),
      watchouts: result.value.watchouts.filter(Boolean).slice(0, 5),
    },
    usedFallback: state.usedFallback || result.usedFallback,
    modelLabel: resolveIdeaModelLabel(),
    steps: [
      result.usedFallback
        ? "拆解想法时未拿到模型结构化结果，已先用本地规则生成一版 brief。"
        : "已完成想法拆解，提炼出标题、核心痛点、目标用户和风险提示。",
      ...result.diagnostics,
    ],
  };
}

async function expandIdeaNode(state: typeof AgentState.State) {
  const brief = state.brief ?? buildFallbackBrief({ rawIdea: state.rawIdea, extraContext: state.extraContext });
  const fallback = buildFallbackExpansion({ rawIdea: state.rawIdea, extraContext: state.extraContext }, brief);
  const result = await invokeJsonStep(
    expansionSchema,
    "基于已经拆好的创业想法 brief，补全问题、用户、方案、AI Agent 工作流、数据输入、商业化、验证计划和风险。内容要能直接放进产品详情页。",
    {
      rawIdea: state.rawIdea,
      extraContext: state.extraContext,
      brief,
    },
    expansionSchemaHint,
    fallback,
  );

  return {
    expansion: result.value,
    usedFallback: state.usedFallback || result.usedFallback,
    steps: [
      result.usedFallback
        ? "补全详情时走了 fallback 模式，先产出一版可编辑的结构化草稿。"
        : "已补全方案骨架，生成了 Agent 工作流、数据输入和商业化路径。",
      ...result.diagnostics,
    ],
  };
}

async function finalizeIdeaNode(state: typeof AgentState.State) {
  const fallback = buildFallbackFinalIdea({ rawIdea: state.rawIdea, extraContext: state.extraContext });
  const result = await invokeJsonStep(
    finalIdeaSchema,
    "把 brief 和扩展内容合并成最终创业想法详情。输出字段必须适合直接回填到产品表单里。status 默认用 idea。",
    {
      rawIdea: state.rawIdea,
      extraContext: state.extraContext,
      brief: state.brief,
      expansion: state.expansion,
    },
    finalIdeaSchemaHint,
    fallback,
  );

  return {
    finalIdea: {
      ...result.value,
      tags: normalizeTags(result.value.tags),
      status: startupIdeaStatuses.includes(result.value.status) ? result.value.status : "idea",
    },
    usedFallback: state.usedFallback || result.usedFallback,
    steps: [
      result.usedFallback
        ? "已按创业想法模板输出最终草稿，你可以直接在表单里继续改。"
        : "已产出可直接保存的创业想法详情草稿，适合继续手动微调。",
      ...result.diagnostics,
    ],
  };
}

const startupIdeaAgentGraph = new StateGraph(AgentState)
  .addNode("analyze_idea", analyzeIdeaNode)
  .addNode("expand_idea", expandIdeaNode)
  .addNode("finalize_idea", finalizeIdeaNode)
  .addEdge(START, "analyze_idea")
  .addEdge("analyze_idea", "expand_idea")
  .addEdge("expand_idea", "finalize_idea")
  .addEdge("finalize_idea", END)
  .compile();

export async function runStartupIdeaAgent(input: StartupIdeaAgentInput): Promise<{
  idea: StartupIdeaAgentIdea;
  execution: StartupIdeaAgentExecution;
}> {
  const graphState = await startupIdeaAgentGraph.invoke({
    rawIdea: input.rawIdea.trim(),
    extraContext: input.extraContext?.trim() ?? "",
  });

  const idea = graphState.finalIdea ?? buildFallbackFinalIdea(input);
  return {
    idea,
    execution: {
      steps: graphState.steps,
      model: graphState.modelLabel || resolveIdeaModelName(),
      usedFallback: graphState.usedFallback,
    },
  };
}
