import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import type { JobTargetParseResult, ResumeJobMatch, ResumeParseResult } from "@/lib/ai";

const candidatePrepSchema = z.object({
  headline: z.string(),
  resumeHighlights: z.array(z.string()),
  selfIntro90s: z.string(),
  projectTalkTracks: z.array(
    z.object({
      project: z.string(),
      whyItMatters: z.string(),
      deepDivePoints: z.array(z.string()),
      proofPoints: z.array(z.string()),
    }),
  ),
  riskPoints: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  jobAlignment: z.array(z.string()),
});

const resumeBriefSchema = z.object({
  headline: z.string(),
  coreSkills: z.array(z.string()),
  strongestProjects: z.array(z.string()),
  resumeHighlights: z.array(z.string()),
  riskPoints: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  jobAlignment: z.array(z.string()),
});

const candidateStorySchema = z.object({
  selfIntro90s: z.string(),
  projectTalkTracks: z.array(
    z.object({
      project: z.string(),
      whyItMatters: z.string(),
      deepDivePoints: z.array(z.string()),
      proofPoints: z.array(z.string()),
    }),
  ),
});

export type CandidatePrepResult = z.infer<typeof candidatePrepSchema>;

export type CandidatePrepExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
};

export type CandidatePrepInput = {
  resume: {
    rawText: string;
    parsed: ResumeParseResult;
  };
  jobTarget?: {
    roleName: string;
    parsed: JobTargetParseResult;
    match: ResumeJobMatch;
  } | null;
  githubContext?: {
    summaries: string[];
    topSignals: string[];
    suggestedReferences: string[];
  } | null;
};

type ResumeBrief = z.infer<typeof resumeBriefSchema>;
type CandidateStory = z.infer<typeof candidateStorySchema>;

type CandidateRole = "system" | "user";
type CandidateMessage = {
  role: CandidateRole;
  content: string;
};

type CompletionPayload = {
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

type InvokeJsonStepResult<T> = {
  value: T;
  usedFallback: boolean;
  diagnostics: string[];
};

const candidateSystemPrompt =
  "你是一个中文面试候选人准备 Agent，负责把简历和可选岗位目标，转成候选人真正能拿去面试准备的材料。" +
  "输出必须具体、贴近真实面试表达，不要空话，不要输出 Markdown，只输出 JSON。";

const briefSchemaHint = {
  headline: "一句准备建议标题",
  coreSkills: ["核心技能 1", "核心技能 2"],
  strongestProjects: ["最重要项目 1", "最重要项目 2"],
  resumeHighlights: ["亮点 1", "亮点 2"],
  riskPoints: ["风险点 1", "风险点 2"],
  followUpQuestions: ["常见追问 1", "常见追问 2"],
  jobAlignment: ["和岗位的匹配点 1", "和岗位的匹配点 2"],
};

const storySchemaHint = {
  selfIntro90s: "90 秒自我介绍",
  projectTalkTracks: [
    {
      project: "项目名",
      whyItMatters: "为什么这个项目值得讲",
      deepDivePoints: ["可深挖点 1", "可深挖点 2"],
      proofPoints: ["可证明成果 1", "可证明成果 2"],
    },
  ],
};

const finalSchemaHint = {
  headline: "一句准备建议标题",
  resumeHighlights: ["亮点 1", "亮点 2"],
  selfIntro90s: "90 秒自我介绍",
  projectTalkTracks: [
    {
      project: "项目名",
      whyItMatters: "为什么这个项目值得讲",
      deepDivePoints: ["可深挖点 1", "可深挖点 2"],
      proofPoints: ["可证明成果 1", "可证明成果 2"],
    },
  ],
  riskPoints: ["风险点 1", "风险点 2"],
  followUpQuestions: ["常见追问 1", "常见追问 2"],
  jobAlignment: ["和岗位的匹配点 1", "和岗位的匹配点 2"],
};

function resolveModelName() {
  return process.env.OPENAI_MODEL || "GLM-5.1";
}

function resolveModelLabel() {
  return `${resolveModelName()} · direct HTTP`;
}

function shouldUseFallback() {
  return process.env.AI_PROVIDER === "mock" || !process.env.OPENAI_API_KEY;
}

function resolveBaseUrl() {
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

function buildMessages(task: string, input: Record<string, unknown>, schemaHint: Record<string, unknown>): CandidateMessage[] {
  return [
    { role: "system", content: candidateSystemPrompt },
    {
      role: "user",
      content: JSON.stringify(
        {
          task,
          rules: [
            "只输出一个 JSON 对象，不要解释，不要代码块。",
            "键名必须与 outputSchema 完全一致，不要额外包装 answer、data、result、prep。",
            "字符串字段输出 string，数组字段输出 array。",
            "内容要适合候选人直接拿去准备面试，而不是抽象评价。",
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

function buildRequestBody(messages: CandidateMessage[], preferJsonMode: boolean) {
  return {
    model: resolveModelName(),
    temperature: 0.2,
    max_tokens: 4096,
    thinking: { type: "disabled" },
    messages,
    ...(preferJsonMode ? { response_format: { type: "json_object" } } : {}),
  };
}

function extractJsonValue(content: string): unknown | null {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
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
  for (const key of ["answer", "data", "result", "prep", "output"]) {
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested;
    }
  }

  return candidate;
}

async function requestCompletion(messages: CandidateMessage[], preferJsonMode: boolean) {
  const response = await fetch(`${resolveBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
    },
    body: JSON.stringify(buildRequestBody(messages, preferJsonMode)),
  });

  const payload = (await response.json().catch(() => ({}))) as CompletionPayload;

  if (!response.ok) {
    throw new Error(payload.error?.message || `模型请求失败 (${response.status})`);
  }

  const choice = payload.choices?.[0];
  const content = readMessageContent(choice?.message?.content);
  const reasoning = choice?.message?.reasoning_content?.trim();

  return {
    content,
    finishReason: choice?.finish_reason || null,
    reasoning,
  };
}

async function invokeJsonStep<T>(
  schema: z.ZodType<T>,
  task: string,
  input: Record<string, unknown>,
  schemaHint: Record<string, unknown>,
  fallback: T,
): Promise<InvokeJsonStepResult<T>> {
  if (shouldUseFallback()) {
    return {
      value: fallback,
      usedFallback: true,
      diagnostics: ["当前未配置可用模型，已返回 fallback 结果。"],
    };
  }

  const messages = buildMessages(task, input, schemaHint);
  const diagnostics: string[] = [];

  for (const preferJsonMode of [true, false]) {
    try {
      const response = await requestCompletion(messages, preferJsonMode);
      if (response.finishReason === "length") {
        diagnostics.push("模型返回被 length 截断，已尝试继续兼容解析。");
      }
      if (response.reasoning && !response.content.trim()) {
        diagnostics.push("模型返回了 reasoning_content，但正文为空。");
      }

      const candidate = extractJsonValue(response.content);
      const parsed = schema.safeParse(unwrapCandidate(candidate));
      if (parsed.success) {
        return {
          value: parsed.data,
          usedFallback: false,
          diagnostics,
        };
      }
    } catch (error) {
      diagnostics.push(error instanceof Error ? error.message : "模型请求失败。");
    }
  }

  return {
    value: fallback,
    usedFallback: true,
    diagnostics: diagnostics.length ? diagnostics : ["未拿到可解析的结构化结果，已使用 fallback。"],
  };
}

function summarizeSkills(parsed: ResumeParseResult) {
  return parsed.skills.filter(Boolean).slice(0, 6);
}

function summarizeProjects(parsed: ResumeParseResult) {
  return parsed.projects.filter(Boolean).slice(0, 3);
}

function buildFallbackBrief(input: CandidatePrepInput): ResumeBrief {
  const coreSkills = summarizeSkills(input.resume.parsed);
  const strongestProjects = summarizeProjects(input.resume.parsed);
  const jobAlignment = input.jobTarget
    ? [
        `目标岗位是 ${input.jobTarget.roleName}，当前简历匹配分约 ${input.jobTarget.match.matchScore}。`,
        ...input.jobTarget.match.strengths.slice(0, 2),
      ]
    : ["先围绕简历本身把代表项目和核心技术讲扎实。"];
  const githubSignals = input.githubContext?.topSignals ?? [];
  const githubReferences = input.githubContext?.suggestedReferences ?? [];

  return {
    headline: input.jobTarget
      ? `先把最匹配 ${input.jobTarget.roleName} 的项目讲顺，再补齐技术细节和量化结果。`
      : "先把简历里最能证明能力的项目讲顺，再把技术细节和量化结果补齐。",
    coreSkills,
    strongestProjects,
    resumeHighlights: [
      input.resume.parsed.summary || "简历已有清晰的技术背景摘要。",
      ...input.resume.parsed.experiences.slice(0, 2),
    ].filter(Boolean).slice(0, 4),
    riskPoints: input.jobTarget
      ? [...input.jobTarget.match.gaps.slice(0, 3), "注意把项目里的个人贡献和结果讲具体。"]
      : ["注意把个人贡献、技术取舍和结果数据讲具体。", "避免只背技术名词，不绑定真实项目。"],
    followUpQuestions: [...input.resume.parsed.followUpQuestions.slice(0, 4), ...githubReferences.slice(0, 2)].slice(0, 6),
    jobAlignment: [...jobAlignment, ...githubSignals.map((signal) => `开源参考：${signal}`)].slice(0, 5),
  };
}

function buildFallbackStory(input: CandidatePrepInput, brief: ResumeBrief): CandidateStory {
  const topProject = brief.strongestProjects[0] || input.resume.parsed.projects[0] || "代表项目";

  return {
    selfIntro90s:
      `大家好，我最近主要在做 ${brief.coreSkills.slice(0, 3).join("、") || "后端开发"} 相关工作。` +
      `简历里我最想重点展开的是 ${topProject}，因为这个项目最能体现我在技术方案、问题推进和结果落地上的能力。` +
      "如果这轮重点看项目和岗位匹配度，我会重点讲背景、目标、我的职责、关键技术方案、最难的问题，以及最后拿到的结果和复盘。",
    projectTalkTracks: brief.strongestProjects.map((project) => ({
      project,
      whyItMatters: input.jobTarget
        ? `这个项目和 ${input.jobTarget.roleName} 关注的能力最接近，适合作为主讲项目。`
        : "这个项目最能证明你的技术能力和落地能力，适合作为主讲项目。",
      deepDivePoints: [
        "项目背景和业务目标是什么",
        "你具体负责了哪一段，和别人怎么分工",
        "最难的技术问题是什么，你为什么这样设计",
      ],
      proofPoints: [
        "给出一项量化结果，如性能、稳定性或效率提升",
        input.githubContext?.summaries?.[0]
          ? `可以顺带对比一个开源实现视角：${input.githubContext.summaries[0]}`
          : "讲一个真实踩坑点和你是怎么解决的",
      ],
    })).slice(0, 3),
  };
}

function buildFallbackFinal(input: CandidatePrepInput): CandidatePrepResult {
  const brief = buildFallbackBrief(input);
  const story = buildFallbackStory(input, brief);

  return {
    headline: brief.headline,
    resumeHighlights: brief.resumeHighlights,
    selfIntro90s: story.selfIntro90s,
    projectTalkTracks: story.projectTalkTracks,
    riskPoints: brief.riskPoints,
    followUpQuestions: brief.followUpQuestions,
    jobAlignment: brief.jobAlignment,
  };
}

function lastValueWithDefault<T>(defaultValue: () => T) {
  return Annotation<T>({
    reducer: (_left, right) => right,
    default: defaultValue,
  });
}

const AgentState = Annotation.Root({
  input: lastValueWithDefault<CandidatePrepInput | null>(() => null),
  brief: lastValueWithDefault<ResumeBrief | null>(() => null),
  story: lastValueWithDefault<CandidateStory | null>(() => null),
  finalPrep: lastValueWithDefault<CandidatePrepResult | null>(() => null),
  steps: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  usedFallback: lastValueWithDefault(() => false),
  modelLabel: lastValueWithDefault(() => resolveModelLabel()),
});

async function analyzeResumeNode(state: typeof AgentState.State) {
  const input = state.input;
  if (!input) {
    throw new Error("Missing candidate prep input.");
  }

  const fallback = buildFallbackBrief(input);
  const result = await invokeJsonStep(
    resumeBriefSchema,
    "拆解简历与可选岗位目标，提取最值得准备的亮点、项目、风险点和追问。",
    {
      resume: input.resume,
      jobTarget: input.jobTarget ?? null,
      githubContext: input.githubContext ?? null,
    },
    briefSchemaHint,
    fallback,
  );

  return {
    brief: {
      ...result.value,
      coreSkills: result.value.coreSkills.filter(Boolean).slice(0, 6),
      strongestProjects: result.value.strongestProjects.filter(Boolean).slice(0, 3),
      resumeHighlights: result.value.resumeHighlights.filter(Boolean).slice(0, 5),
      riskPoints: result.value.riskPoints.filter(Boolean).slice(0, 5),
      followUpQuestions: result.value.followUpQuestions.filter(Boolean).slice(0, 6),
      jobAlignment: result.value.jobAlignment.filter(Boolean).slice(0, 5),
    },
    usedFallback: state.usedFallback || result.usedFallback,
    steps: [
      result.usedFallback
        ? "简历拆解阶段未拿到稳定结构化结果，已先生成一版准备摘要。"
        : "已从简历和岗位目标里提炼出亮点、代表项目、风险点和常见追问。",
      ...result.diagnostics,
    ],
  };
}

async function shapeCandidateStoryNode(state: typeof AgentState.State) {
  const input = state.input;
  const brief = state.brief;
  if (!input || !brief) {
    throw new Error("Missing candidate prep brief.");
  }

  const fallback = buildFallbackStory(input, brief);
  const result = await invokeJsonStep(
    candidateStorySchema,
    "把简历分析结果改写成候选人真正能在面试里说出来的材料，重点产出 90 秒自我介绍和项目讲述主线。",
    {
      resume: input.resume,
      jobTarget: input.jobTarget ?? null,
      githubContext: input.githubContext ?? null,
      brief,
    },
    storySchemaHint,
    fallback,
  );

  return {
    story: {
      ...result.value,
      projectTalkTracks: result.value.projectTalkTracks.filter((item) => item.project.trim()).slice(0, 3),
    },
    usedFallback: state.usedFallback || result.usedFallback,
    steps: [
      result.usedFallback
        ? "面试表达塑形阶段走了 fallback，已先整理一版自我介绍和项目主线。"
        : "已把分析结果整理成 90 秒自我介绍和可直接练习的项目讲述主线。",
      ...result.diagnostics,
    ],
  };
}

async function finalizePrepPanelNode(state: typeof AgentState.State) {
  const input = state.input;
  const brief = state.brief;
  const story = state.story;
  if (!input || !brief || !story) {
    throw new Error("Missing candidate prep story.");
  }

  const fallback = buildFallbackFinal(input);
  const result = await invokeJsonStep(
    candidatePrepSchema,
    "把候选人分析和表达材料合并成最终准备面板。输出字段要适合直接回填前端工作台。",
    {
      resume: input.resume,
      jobTarget: input.jobTarget ?? null,
      githubContext: input.githubContext ?? null,
      brief,
      story,
    },
    finalSchemaHint,
    fallback,
  );

  return {
    finalPrep: {
      ...result.value,
      resumeHighlights: result.value.resumeHighlights.filter(Boolean).slice(0, 5),
      riskPoints: result.value.riskPoints.filter(Boolean).slice(0, 5),
      followUpQuestions: result.value.followUpQuestions.filter(Boolean).slice(0, 6),
      jobAlignment: result.value.jobAlignment.filter(Boolean).slice(0, 5),
      projectTalkTracks: result.value.projectTalkTracks.filter((item) => item.project.trim()).slice(0, 3),
    },
    usedFallback: state.usedFallback || result.usedFallback,
    steps: [
      result.usedFallback
        ? "已按候选人准备面板输出一版可直接使用的草稿，你可以继续手动微调。"
        : "已生成候选人准备面板，适合直接带入文稿和 AI 模拟。",
      ...result.diagnostics,
    ],
  };
}

const candidatePrepGraph = new StateGraph(AgentState)
  .addNode("analyze_resume", analyzeResumeNode)
  .addNode("shape_candidate_story", shapeCandidateStoryNode)
  .addNode("finalize_prep_panel", finalizePrepPanelNode)
  .addEdge(START, "analyze_resume")
  .addEdge("analyze_resume", "shape_candidate_story")
  .addEdge("shape_candidate_story", "finalize_prep_panel")
  .addEdge("finalize_prep_panel", END)
  .compile();

export async function runCandidatePrepAgent(input: CandidatePrepInput): Promise<{
  prep: CandidatePrepResult;
  execution: CandidatePrepExecution;
}> {
  const graphState = await candidatePrepGraph.invoke({ input });
  const prep = graphState.finalPrep ?? buildFallbackFinal(input);

  return {
    prep,
    execution: {
      steps: graphState.steps,
      model: graphState.modelLabel || resolveModelLabel(),
      usedFallback: graphState.usedFallback,
    },
  };
}
