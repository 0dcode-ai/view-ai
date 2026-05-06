import { z } from "zod";
import type { GithubRadarBrief, GithubRadarDigest, GithubTrendRepo } from "@/app/types";

type TrendFilters = {
  q?: string;
  topic?: string;
  language?: string;
  window?: string;
  sort?: string;
  favorite?: string;
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

const digestSchema = z.object({
  title: z.string(),
  summary: z.string(),
  themeTakeaways: z.array(z.string()),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  watchItems: z.array(
    z.object({
      repoFullName: z.string(),
      action: z.string(),
      reason: z.string(),
    }),
  ),
});

const schemaHint = {
  title: "今天这轮 GitHub 雷达的一句话标题",
  summary: "用 2 到 3 句话总结今天榜单最值得关注的变化",
  themeTakeaways: ["主题判断 1", "主题判断 2"],
  opportunities: ["最值得研究或借鉴的机会 1", "机会 2"],
  risks: ["风险或噪音来源 1", "风险 2"],
  recommendedActions: ["建议接下来怎么做 1", "动作 2"],
  watchItems: [
    {
      repoFullName: "owner/repo",
      action: "先看 README / issue / demo / code",
      reason: "一句话说明为什么先看它",
    },
  ],
};

export type GithubRadarAgentResult = {
  digest: GithubRadarDigest;
  execution: {
    model: string;
    usedFallback: boolean;
    steps: string[];
  };
};

export async function analyzeGithubRadar(input: {
  radar: GithubRadarBrief;
  repositories: GithubTrendRepo[];
  filters?: TrendFilters;
}): Promise<GithubRadarAgentResult> {
  const fallback = fallbackGithubRadarDigest(input.radar, input.repositories, input.filters);
  if (shouldUseFallback()) {
    return {
      digest: fallback,
      execution: {
        model: "rule-fallback",
        usedFallback: true,
        steps: ["未配置模型或当前为 mock 模式，已生成规则兜底雷达简报。"],
      },
    };
  }

  const diagnostics: string[] = [];
  for (const preferJsonMode of [true, false]) {
    try {
      const response = await requestCompletion(input, preferJsonMode);
      const candidate = extractJsonValue(response.content);
      const parsed = digestSchema.safeParse(unwrapCandidate(candidate));
      if (parsed.success) {
        const digest = {
          ...parsed.data,
          themeTakeaways: parsed.data.themeTakeaways.filter(Boolean).slice(0, 5),
          opportunities: parsed.data.opportunities.filter(Boolean).slice(0, 5),
          risks: parsed.data.risks.filter(Boolean).slice(0, 5),
          recommendedActions: parsed.data.recommendedActions.filter(Boolean).slice(0, 5),
          watchItems: parsed.data.watchItems.filter((item) => item.repoFullName && item.action).slice(0, 5),
          usedFallback: false,
          model: resolveModelName(),
        } satisfies GithubRadarDigest;
        return {
          digest,
          execution: {
            model: resolveModelLabel(),
            usedFallback: false,
            steps: [
              "读取主题聚合、去重后的优先仓库和近期增速信号。",
              "判断今天更值得投入时间研究的方向、机会和噪音来源。",
              "输出一版可直接沉淀为来源材料的中文行动简报。",
            ],
          },
        };
      }
      diagnostics.push("模型返回内容无法匹配雷达简报结构。");
    } catch (error) {
      diagnostics.push(error instanceof Error ? error.message : "模型请求失败。");
    }
  }

  return {
    digest: fallback,
    execution: {
      model: "rule-fallback",
      usedFallback: true,
      steps: diagnostics.length ? diagnostics : ["未拿到可解析的模型输出，已使用规则兜底雷达简报。"],
    },
  };
}

export function fallbackGithubRadarDigest(
  radar: GithubRadarBrief,
  repositories: GithubTrendRepo[],
  filters?: TrendFilters,
): GithubRadarDigest {
  const focus = [filters?.topic, filters?.language, filters?.q].filter(Boolean).join(" / ");
  const topThemes = radar.themeClusters.slice(0, 3);
  const noisyRepoCount = repositories.filter((repo) => repo.openIssues > Math.max(12, repo.forks * 4)).length;
  const concentrated = topThemes[0] && topThemes[0].repoCount >= Math.max(3, Math.ceil(repositories.length * 0.45));

  return {
    title: focus ? `${focus} 方向今日 GitHub 雷达简报` : "今日 GitHub 开源趋势简报",
    summary: radar.summary || "当前榜单已经完成主题聚合和相似项目去重，可以直接围绕优先仓库做研究。",
    themeTakeaways: topThemes.map((theme) => `${theme.label} 方向最集中，共 ${theme.repoCount} 个仓库，平均潜力分 ${theme.averageScore}。`),
    opportunities: radar.topRepositories.slice(0, 4).map((repo) => `${repo.fullName}：${repo.reason}`),
    risks: [
      concentrated ? `当前热度高度集中在 ${topThemes[0]?.label}，容易被同质项目稀释判断。` : "当前榜单主题相对分散，需要防止视线过早发散。",
      noisyRepoCount > 0 ? `有 ${noisyRepoCount} 个仓库 open issues 偏高，建议先确认维护质量。` : "暂未看到特别突出的维护风险，但仍建议抽查 issue 响应速度。",
    ].filter(Boolean),
    recommendedActions: [
      radar.topRepositories[0] ? `先研究 ${radar.topRepositories[0].fullName}，确认它的 README、demo 和 issue 是否支撑当前热度。` : "",
      topThemes[0] ? `围绕 ${topThemes[0].label} 做一轮竞品对比，拆出 2 到 3 个可直接借鉴的功能点。` : "",
      "把值得继续追踪的仓库沉淀为 Source，后续可直接喂给准备类 Agent 和产品分析流程。",
    ].filter(Boolean),
    watchItems: radar.topRepositories.slice(0, 4).map((repo) => ({
      repoFullName: repo.fullName,
      action: repo.dedupedCount > 1 ? "先看 README、对比同类项目，再抽样看 issue 和最近 commit" : "先看 README、demo 和最近 commit",
      reason: repo.reason,
    })),
    usedFallback: true,
    model: "rule-fallback",
  };
}

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

function buildMessages(input: { radar: GithubRadarBrief; repositories: GithubTrendRepo[]; filters?: TrendFilters }) {
  const focus = {
    topic: input.filters?.topic || null,
    language: input.filters?.language || null,
    q: input.filters?.q || null,
    window: input.filters?.window || "daily",
  };

  return [
    {
      role: "system",
      content: "你是一个中文开源情报分析 Agent，负责把 GitHub 趋势榜整理成适合产品、工程和研究决策的行动简报。只输出 JSON。",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "根据当前 GitHub 雷达结果，输出一版能指导后续研究优先级的中文行动简报。",
          rules: [
            "只输出一个 JSON 对象，不要 Markdown，不要代码块。",
            "键名必须与 outputSchema 完全一致。",
            "不要编造 README 或社区讨论细节，只能根据给定指标、主题聚合和仓库元数据推断。",
            "结论要具体、短句、可执行，避免泛泛而谈。",
            "watchItems 必须点名具体仓库，并说明下一步先做什么。",
          ],
          outputSchema: schemaHint,
          filters: focus,
          radar: input.radar,
          repositories: input.repositories.slice(0, 12).map((repo) => ({
            fullName: repo.fullName,
            description: repo.description,
            language: repo.language,
            topics: repo.topics,
            stars: repo.stars,
            forks: repo.forks,
            watchers: repo.watchers,
            openIssues: repo.openIssues,
            pushedAt: repo.pushedAt,
            createdAtGithub: repo.createdAtGithub,
            starDelta24h: repo.starDelta24h,
            starDelta7d: repo.starDelta7d,
            score: repo.score,
            rank: repo.rank,
            analysis: repo.analysis,
          })),
        },
        null,
        2,
      ),
    },
  ];
}

function buildRequestBody(input: { radar: GithubRadarBrief; repositories: GithubTrendRepo[]; filters?: TrendFilters }, preferJsonMode: boolean) {
  return {
    model: resolveModelName(),
    temperature: 0.2,
    max_tokens: 2800,
    thinking: { type: "disabled" },
    messages: buildMessages(input),
    ...(preferJsonMode ? { response_format: { type: "json_object" } } : {}),
  };
}

async function requestCompletion(
  input: { radar: GithubRadarBrief; repositories: GithubTrendRepo[]; filters?: TrendFilters },
  preferJsonMode: boolean,
) {
  const response = await fetch(`${resolveBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
    },
    body: JSON.stringify(buildRequestBody(input, preferJsonMode)),
  });

  const payload = (await response.json().catch(() => ({}))) as CompletionPayload;
  if (!response.ok) {
    throw new Error(payload.error?.message || `模型请求失败 (${response.status})`);
  }

  return {
    content: readMessageContent(payload.choices?.[0]?.message?.content),
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
  for (const key of ["answer", "data", "result", "analysis", "output", "digest"]) {
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested;
    }
  }

  return candidate;
}
