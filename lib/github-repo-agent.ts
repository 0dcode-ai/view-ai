import { z } from "zod";
import type { GithubRepoAnalysis, GithubTrendRepo } from "@/app/types";
import { fallbackGithubRepoAnalysis } from "@/lib/github-trends";

const analysisSchema = z.object({
  summary: z.string(),
  whyTrending: z.array(z.string()),
  potentialReasons: z.array(z.string()),
  learningValue: z.array(z.string()),
  useCases: z.array(z.string()),
  riskSignals: z.array(z.string()),
  tags: z.array(z.string()),
});

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

const schemaHint = {
  summary: "一句话说明这个仓库做什么，以及为什么值得看",
  whyTrending: ["它最近可能被关注的信号 1", "它最近可能被关注的信号 2"],
  potentialReasons: ["潜力原因 1", "潜力原因 2"],
  learningValue: ["对工程/产品/面试学习的价值 1", "价值 2"],
  useCases: ["适用场景 1", "适用场景 2"],
  riskSignals: ["风险或需要进一步验证的点 1", "风险 2"],
  tags: ["AI Agent", "DevTools"],
};

export type GithubRepoAgentResult = {
  analysis: GithubRepoAnalysis;
  execution: {
    model: string;
    usedFallback: boolean;
    steps: string[];
  };
};

export async function analyzeGithubRepository(repo: GithubTrendRepo): Promise<GithubRepoAgentResult> {
  const fallback = fallbackGithubRepoAnalysis(repo);
  if (shouldUseFallback()) {
    return {
      analysis: fallback,
      execution: {
        model: "rule-fallback",
        usedFallback: true,
        steps: ["未配置模型或当前为 mock 模式，已生成规则兜底分析。"],
      },
    };
  }

  const diagnostics: string[] = [];
  for (const preferJsonMode of [true, false]) {
    try {
      const response = await requestCompletion(repo, preferJsonMode);
      const candidate = extractJsonValue(response.content);
      const parsed = analysisSchema.safeParse(unwrapCandidate(candidate));
      if (parsed.success) {
        const analysis = {
          ...parsed.data,
          tags: Array.from(new Set(parsed.data.tags.filter(Boolean))).slice(0, 8),
          usedFallback: false,
          model: resolveModelName(),
        };
        return {
          analysis,
          execution: {
            model: resolveModelLabel(),
            usedFallback: false,
            steps: [
              "读取仓库元数据、star/fork/issue 和快照增量。",
              "结合 AI Agent、开发工具和近期活跃信号生成分析。",
              "已缓存仓库分析，后续打开详情会直接复用。",
            ],
          },
        };
      }
      diagnostics.push("模型返回内容无法匹配仓库分析结构。");
    } catch (error) {
      diagnostics.push(error instanceof Error ? error.message : "模型请求失败。");
    }
  }

  return {
    analysis: fallback,
    execution: {
      model: "rule-fallback",
      usedFallback: true,
      steps: diagnostics.length ? diagnostics : ["未拿到可解析的模型输出，已使用规则兜底分析。"],
    },
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

function buildMessages(repo: GithubTrendRepo) {
  return [
    {
      role: "system",
      content: "你是一个中文开源趋势分析 Agent，擅长判断 GitHub 仓库的技术潜力、学习价值和风险。只输出 JSON。",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "分析这个 GitHub 仓库为什么值得关注，输出适合产品/工程/面试学习的结构化结论。",
          rules: [
            "只输出一个 JSON 对象，不要 Markdown，不要代码块。",
            "键名必须与 outputSchema 完全一致。",
            "不要虚构 README 细节，只能根据仓库名、描述、topics、指标和时间信号推断。",
            "中文表达，具体、短句、可行动。",
          ],
          outputSchema: schemaHint,
          repository: {
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
          },
        },
        null,
        2,
      ),
    },
  ];
}

function buildRequestBody(repo: GithubTrendRepo, preferJsonMode: boolean) {
  return {
    model: resolveModelName(),
    temperature: 0.2,
    max_tokens: 2048,
    thinking: { type: "disabled" },
    messages: buildMessages(repo),
    ...(preferJsonMode ? { response_format: { type: "json_object" } } : {}),
  };
}

async function requestCompletion(repo: GithubTrendRepo, preferJsonMode: boolean) {
  const response = await fetch(`${resolveBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
    },
    body: JSON.stringify(buildRequestBody(repo, preferJsonMode)),
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
  for (const key of ["answer", "data", "result", "analysis", "output"]) {
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested;
    }
  }

  return candidate;
}
