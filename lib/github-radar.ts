import type { GithubRadarBrief, GithubRadarTheme, GithubTrendRepo } from "@/app/types";

type RadarFilters = {
  q?: string;
  topic?: string;
  language?: string;
  window?: string;
};

type ThemeDefinition = {
  key: string;
  label: string;
  keywords: string[];
};

type RepoTheme = {
  key: string;
  label: string;
  hits: number;
};

type DedupCluster = {
  theme: RepoTheme;
  signature: string[];
  repositories: GithubTrendRepo[];
};

const THEME_DEFINITIONS: ThemeDefinition[] = [
  { key: "coding-agents", label: "Coding Agents", keywords: ["coding agent", "code agent", "agentic coding", "developer tool", "devtool", "cli"] },
  { key: "mcp-tooling", label: "MCP & Tooling", keywords: ["mcp", "model context protocol", "tool calling", "tool use", "tools"] },
  { key: "agent-frameworks", label: "Agent Frameworks", keywords: ["agent framework", "multi agent", "workflow", "orchestrator", "langgraph", "crew"] },
  { key: "rag-memory", label: "RAG & Memory", keywords: ["rag", "retrieval", "knowledge", "memory", "embedding", "vector"] },
  { key: "inference-infra", label: "Inference Infra", keywords: ["inference", "serving", "runtime", "deployment", "gpu", "vllm"] },
  { key: "apps-ui", label: "Apps & UI", keywords: ["desktop", "frontend", "ui", "browser", "copilot", "workspace"] },
];

const STOPWORDS = new Set([
  "agent",
  "agents",
  "ai",
  "app",
  "build",
  "building",
  "cli",
  "code",
  "coding",
  "copilot",
  "demo",
  "developer",
  "development",
  "framework",
  "frameworks",
  "github",
  "language",
  "library",
  "llm",
  "mcp",
  "open",
  "project",
  "projects",
  "repo",
  "repository",
  "sdk",
  "source",
  "system",
  "tool",
  "tools",
  "using",
  "with",
]);

export function buildGithubRadarBrief(repositories: GithubTrendRepo[], filters: RadarFilters = {}): GithubRadarBrief {
  if (repositories.length === 0) {
    return {
      headline: "还没有可分析的 GitHub 雷达数据",
      summary: "先刷新一次趋势榜，系统会基于仓库热度、增速和主题聚合生成一版优先级简报。",
      keySignals: [],
      watchlist: [],
      selectedRepoCount: 0,
      dedupedRepoCount: 0,
      uniqueThemeCount: 0,
      topRepositories: [],
      themeClusters: [],
    };
  }

  const ranked = [...repositories].sort((left, right) => right.score - left.score || right.starDelta7d - left.starDelta7d || right.stars - left.stars);
  const themeClusters = buildThemeClusters(ranked);
  const dedupClusters = buildDedupClusters(ranked);
  const topRepositories = dedupClusters
    .map((cluster) => {
      const lead = cluster.repositories[0];
      return {
        id: lead.id,
        fullName: lead.fullName,
        score: lead.score,
        rank: lead.rank,
        theme: cluster.theme.label,
        starDelta24h: lead.starDelta24h,
        starDelta7d: lead.starDelta7d,
        tags: Array.from(new Set([...(lead.topics || []), lead.language, ...(lead.analysis?.tags || [])].filter((value): value is string => Boolean(value)))).slice(0, 5),
        dedupedCount: cluster.repositories.length,
        reason: describePriorityReason(lead, cluster),
      };
    })
    .slice(0, 6);

  const focus = [filters.topic, filters.language, filters.q].filter(Boolean).join(" / ");
  const topThemes = themeClusters.slice(0, 3).map((cluster) => cluster.label);
  const fastestRepo = ranked
    .slice()
    .sort((left, right) => right.starDelta7d - left.starDelta7d || right.starDelta24h - left.starDelta24h || right.score - left.score)[0];
  const strongestRepo = ranked[0];

  const headline = focus
    ? `${focus} 方向今天优先跟进这 ${topRepositories.length} 个仓库`
    : `今天值得优先跟进的 ${topRepositories.length} 个 GitHub 仓库`;
  const summary = [
    `当前榜单共 ${repositories.length} 个仓库，经主题与相似项目去重后，保留 ${topRepositories.length} 个优先研究对象。`,
    topThemes.length ? `热度主要集中在 ${topThemes.join("、")}。` : "",
    strongestRepo ? `综合信号最强的是 ${strongestRepo.fullName}。` : "",
  ]
    .filter(Boolean)
    .join("");

  const keySignals = [
    themeClusters[0]
      ? `${themeClusters[0].label} 是当前最集中的方向，共 ${themeClusters[0].repoCount} 个仓库，平均潜力分 ${themeClusters[0].averageScore}。`
      : "",
    fastestRepo
      ? `${fastestRepo.fullName} 的增长最明显，7d +${fastestRepo.starDelta7d}，24h +${fastestRepo.starDelta24h}。`
      : "",
    topRepositories.some((repo) => repo.dedupedCount > 1)
      ? `已合并 ${repositories.length - topRepositories.length} 个相近项目，避免榜单被同质方向重复占满。`
      : `当前榜单方向分布较分散，主题去重后仍保留了 ${topRepositories.length} 个独立观察对象。`,
  ].filter(Boolean);

  const watchlist = topRepositories.slice(0, 4).map((repo) => `先看 ${repo.fullName}：${repo.reason}`);

  return {
    headline,
    summary,
    keySignals,
    watchlist,
    selectedRepoCount: topRepositories.length,
    dedupedRepoCount: Math.max(0, repositories.length - topRepositories.length),
    uniqueThemeCount: themeClusters.length,
    topRepositories,
    themeClusters,
  };
}

function buildThemeClusters(repositories: GithubTrendRepo[]): GithubRadarTheme[] {
  const grouped = new Map<string, { theme: RepoTheme; repositories: GithubTrendRepo[] }>();

  repositories.forEach((repo) => {
    const theme = detectTheme(repo);
    const current = grouped.get(theme.key);
    if (current) {
      current.repositories.push(repo);
      return;
    }
    grouped.set(theme.key, { theme, repositories: [repo] });
  });

  return [...grouped.values()]
    .map(({ theme, repositories }) => {
      const averageScore = Math.round(repositories.reduce((sum, repo) => sum + repo.score, 0) / repositories.length);
      const average24hDelta = Math.round(repositories.reduce((sum, repo) => sum + repo.starDelta24h, 0) / repositories.length);
      const average7dDelta = Math.round(repositories.reduce((sum, repo) => sum + repo.starDelta7d, 0) / repositories.length);
      const languages = Array.from(new Set(repositories.map((repo) => repo.language).filter((value): value is string => Boolean(value)))).slice(0, 4);
      const leadRepos = repositories
        .slice()
        .sort((left, right) => right.score - left.score || right.starDelta7d - left.starDelta7d)
        .slice(0, 3)
        .map((repo) => ({ id: repo.id, fullName: repo.fullName, score: repo.score }));

      const signals = [
        `平均潜力分 ${averageScore}`,
        `平均 7d 增长 +${average7dDelta}`,
        languages.length ? `主要语言 ${languages.join("、")}` : "",
      ].filter(Boolean);

      return {
        key: theme.key,
        label: theme.label,
        repoCount: repositories.length,
        averageScore,
        average24hDelta,
        average7dDelta,
        languages,
        leadRepos,
        signals,
      };
    })
    .sort((left, right) => right.repoCount - left.repoCount || right.averageScore - left.averageScore)
    .slice(0, 6);
}

function buildDedupClusters(repositories: GithubTrendRepo[]) {
  return repositories.reduce<DedupCluster[]>((clusters, repo) => {
    const theme = detectTheme(repo);
    const signature = buildSignature(repo);
    const match = clusters.find((cluster) => shouldMergeIntoCluster(cluster, theme, signature, repo));

    if (!match) {
      clusters.push({ theme, signature, repositories: [repo] });
      return clusters;
    }

    match.repositories.push(repo);
    match.repositories.sort((left, right) => right.score - left.score || right.starDelta7d - left.starDelta7d);
    match.signature = Array.from(new Set([...match.signature, ...signature])).slice(0, 8);
    return clusters;
  }, []);
}

function shouldMergeIntoCluster(cluster: DedupCluster, theme: RepoTheme, signature: string[], repo: GithubTrendRepo) {
  if (cluster.theme.key !== theme.key) {
    return false;
  }

  const lead = cluster.repositories[0];
  const overlap = countOverlap(cluster.signature, signature);
  const similarity = jaccard(cluster.signature, signature);

  return (
    similarity >= 0.45 ||
    overlap >= 3 ||
    (overlap >= 2 && Math.abs(lead.starDelta7d - repo.starDelta7d) <= 40) ||
    shareStrongTopic(lead, repo)
  );
}

function detectTheme(repo: GithubTrendRepo): RepoTheme {
  const text = repoText(repo);
  const matches = THEME_DEFINITIONS
    .map((theme) => ({
      key: theme.key,
      label: theme.label,
      hits: theme.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0),
    }))
    .sort((left, right) => right.hits - left.hits);

  const best = matches[0];
  if (best && best.hits > 0) {
    return best;
  }

  const firstTopic = repo.topics.find((topic) => topic.length >= 3);
  if (firstTopic) {
    return {
      key: slugify(firstTopic),
      label: firstTopic,
      hits: 0,
    };
  }

  return {
    key: repo.language ? slugify(repo.language) : "general",
    label: repo.language || "General",
    hits: 0,
  };
}

function buildSignature(repo: GithubTrendRepo) {
  const weighted = [
    ...repo.topics,
    ...(repo.analysis?.tags || []),
    ...extractTokens(repo.fullName),
    ...extractTokens(repo.description || ""),
  ].filter((token): token is string => typeof token === "string");

  const normalized = weighted
    .map((token) => normalizeToken(token))
    .filter((token): token is string => token !== null)
    .filter((token) => !STOPWORDS.has(token));

  return Array.from(new Set(normalized)).slice(0, 6);
}

function extractTokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9#+-]+/g)
    .map((token) => normalizeToken(token))
    .filter((token): token is string => token !== null)
    .filter((token) => !STOPWORDS.has(token));
}

function normalizeToken(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9#+-]/g, "").trim();
  if (!normalized || normalized.length < 3) {
    return null;
  }
  return normalized;
}

function repoText(repo: GithubTrendRepo) {
  return `${repo.fullName} ${repo.description || ""} ${repo.language || ""} ${repo.topics.join(" ")} ${(repo.analysis?.tags || []).join(" ")}`.toLowerCase();
}

function countOverlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((token) => rightSet.has(token)).length;
}

function jaccard(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);
  if (union.size === 0) {
    return 0;
  }
  let intersection = 0;
  leftSet.forEach((token) => {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  });
  return intersection / union.size;
}

function shareStrongTopic(left: GithubTrendRepo, right: GithubTrendRepo) {
  const shared = left.topics.filter((topic) => right.topics.includes(topic) && topic.length >= 4);
  return shared.length >= 2;
}

function describePriorityReason(repo: GithubTrendRepo, cluster: DedupCluster) {
  if (cluster.repositories.length > 1) {
    return `同类方向里综合信号最强，已合并 ${cluster.repositories.length} 个近似项目。`;
  }
  if (repo.starDelta7d >= 80 || repo.starDelta24h >= 20) {
    return `近期增速很快，7d +${repo.starDelta7d}，24h +${repo.starDelta24h}。`;
  }
  if (repo.analysis?.learningValue?.length) {
    return `已有结构化学习价值分析，适合直接展开调研。`;
  }
  if (repo.language && repo.topics.length) {
    return `${repo.language} + ${repo.topics.slice(0, 2).join(" / ")} 组合清晰，适合快速判断可借鉴点。`;
  }
  return `综合潜力分 ${repo.score}，可以优先纳入本轮观察。`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general";
}
