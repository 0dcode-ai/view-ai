import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/tags";
import type { GithubRepoAnalysis, GithubTrendRepo, GithubTrendSnapshot } from "@/app/types";
import { buildGithubRadarBrief } from "@/lib/github-radar";

type GithubSearchRepo = {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  clone_url?: string | null;
  homepage?: string | null;
  language: string | null;
  topics?: string[];
  license?: { spdx_id?: string | null; name?: string | null } | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  default_branch?: string | null;
  pushed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived: boolean;
  disabled?: boolean;
  fork: boolean;
};

type SearchResponse = {
  items?: GithubSearchRepo[];
  message?: string;
};

type TrendFilters = {
  q?: string;
  topic?: string;
  language?: string;
  window?: string;
  sort?: string;
  favorite?: string;
};

type GithubRepoRecord = Prisma.GithubRepositoryGetPayload<{
  include: { snapshots: true };
}>;

const baseQueries = ["agent", "ai agent", "coding agent", "mcp", "llm tool", "developer tool"];
const topicKeywords: Record<string, string[]> = {
  "AI Agent": ["agent", "ai agent", "coding agent", "mcp"],
  MCP: ["mcp", "model context protocol", "agent"],
  LLM: ["llm", "rag", "prompt", "inference"],
  DevTools: ["developer tool", "coding agent", "cli", "automation"],
};

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function listGithubTrends(filters: TrendFilters = {}) {
  const snapshotDate = todayKey();
  const where = buildRepositoryWhere(filters);
  const repositories = await prisma.githubRepository.findMany({
    where,
    include: { snapshots: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 120,
  });

  const ranked = rankRepositoryRecords(repositories, filters, snapshotDate);
  return {
    repositories: ranked,
    languages: collectLanguages(repositories),
    topics: collectTopics(repositories),
    radar: buildGithubRadarBrief(ranked, filters),
    meta: {
      snapshotDate,
      total: ranked.length,
      cacheHit: repositories.length > 0,
    },
  };
}

export async function refreshGithubTrends(filters: TrendFilters = {}) {
  const snapshotDate = todayKey();
  const items = await fetchGithubCandidates(filters);
  const seen = new Map<number, GithubSearchRepo>();
  items.forEach((item) => {
    if (!item.fork && !item.archived && !item.disabled) {
      seen.set(item.id, item);
    }
  });

  const saved = [];
  for (const item of seen.values()) {
    const repository = await upsertGithubRepository(item);
    saved.push(repository);
  }

  const loaded = await prisma.githubRepository.findMany({
    where: { id: { in: saved.map((repo) => repo.id) } },
    include: { snapshots: true },
  });
  const ranked = rankRepositoryRecords(loaded, filters, snapshotDate);

  for (const repo of ranked) {
    await prisma.githubRepositorySnapshot.upsert({
      where: {
        repositoryId_snapshotDate: {
          repositoryId: repo.id,
          snapshotDate,
        },
      },
      create: {
        repositoryId: repo.id,
        snapshotDate,
        rank: repo.rank,
        score: repo.score,
        stars: repo.stars,
        forks: repo.forks,
        openIssues: repo.openIssues,
        pushedAt: repo.pushedAt ? new Date(repo.pushedAt) : null,
        query: filters.q || null,
        topic: filters.topic || null,
        window: filters.window || "daily",
      },
      update: {
        rank: repo.rank,
        score: repo.score,
        stars: repo.stars,
        forks: repo.forks,
        openIssues: repo.openIssues,
        pushedAt: repo.pushedAt ? new Date(repo.pushedAt) : null,
        query: filters.q || null,
        topic: filters.topic || null,
        window: filters.window || "daily",
      },
    });
  }

  return listGithubTrends(filters);
}

export async function getGithubTrendRepository(id: number) {
  const repository = await prisma.githubRepository.findUnique({
    where: { id },
    include: { snapshots: true },
  });
  return repository ? serializeGithubRepository(repository, todayKey(), 1) : null;
}

export async function updateGithubTrendRepository(id: number, input: { isFavorite?: boolean; note?: string }) {
  const repository = await prisma.githubRepository.update({
    where: { id },
    data: {
      ...(typeof input.isFavorite === "boolean" ? { isFavorite: input.isFavorite } : {}),
      ...(typeof input.note === "string" ? { note: input.note } : {}),
    },
    include: { snapshots: true },
  });
  return serializeGithubRepository(repository, todayKey(), 1);
}

export async function saveGithubRepoAnalysis(id: number, analysis: GithubRepoAnalysis) {
  const repository = await prisma.githubRepository.update({
    where: { id },
    data: {
      analysisJson: JSON.stringify(analysis),
      lastAnalyzedAt: new Date(),
    },
    include: { snapshots: true },
  });
  return serializeGithubRepository(repository, todayKey(), 1);
}

export function fallbackGithubRepoAnalysis(repo: Pick<GithubTrendRepo, "fullName" | "description" | "language" | "topics" | "stars" | "forks" | "openIssues" | "starDelta24h" | "starDelta7d">): GithubRepoAnalysis {
  const topicText = repo.topics.slice(0, 4).join("、") || repo.language || "开源工具";
  return {
    summary: repo.description || `${repo.fullName} 是一个值得继续观察的 ${topicText} 项目。`,
    whyTrending: [
      `当前已有 ${repo.stars} stars，最近快照增量为 ${repo.starDelta24h || repo.starDelta7d || 0}。`,
      repo.language ? `主要语言是 ${repo.language}，便于快速判断技术栈匹配度。` : "项目主题与 AI/Agent/开发工具方向存在匹配。",
    ],
    potentialReasons: ["主题踩中 AI Agent 或开发效率趋势", "近期活跃度和 star 密度具备继续观察价值"],
    learningValue: ["可以拆解 README、架构和 issue，观察它如何包装开发者工作流", "适合作为技术文章、八股项目案例或创业想法素材"],
    useCases: ["开源项目选题", "Agent 产品竞品观察", "工程实践学习"],
    riskSignals: repo.openIssues > repo.forks * 4 ? ["issue 相对 fork 偏多，需要确认维护质量"] : ["暂未发现明显风险，建议继续看 commit 和 issue 响应速度"],
    tags: Array.from(new Set([...(repo.topics || []), repo.language, "GitHub"].filter((value): value is string => Boolean(value)))).slice(0, 8),
    usedFallback: true,
    model: "rule-fallback",
  };
}

async function fetchGithubCandidates(filters: TrendFilters) {
  const queries = buildQueries(filters);
  const items: GithubSearchRepo[] = [];

  for (const query of queries) {
    const params = new URLSearchParams({
      q: query,
      sort: filters.sort === "stars" ? "stars" : "updated",
      order: "desc",
      per_page: "20",
    });
    const response = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
      headers: githubHeaders(),
      next: { revalidate: 0 },
    });
    const payload = (await response.json().catch(() => ({}))) as SearchResponse;

    if (!response.ok) {
      throw new Error(payload.message || `GitHub API 请求失败：${response.status}`);
    }
    items.push(...(payload.items ?? []));
  }

  return items;
}

function buildQueries(filters: TrendFilters) {
  const keywords = filters.q?.trim()
    ? [filters.q.trim(), ...baseQueries.slice(0, 3)]
    : topicKeywords[filters.topic || ""] ?? baseQueries;
  const createdAfter = dateDaysAgo(filters.window === "weekly" ? 60 : 30);
  const pushedAfter = dateDaysAgo(filters.window === "weekly" ? 14 : 7);
  const language = filters.language ? ` language:${filters.language}` : "";

  return keywords.slice(0, 6).map((keyword) =>
    `${keyword}${language} fork:false archived:false pushed:>=${pushedAfter} created:>=${createdAfter}`,
  );
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

async function upsertGithubRepository(item: GithubSearchRepo) {
  const data = {
    githubId: item.id,
    fullName: item.full_name,
    owner: item.owner.login,
    name: item.name,
    description: item.description,
    htmlUrl: item.html_url,
    cloneUrl: item.clone_url ?? null,
    homepage: item.homepage || null,
    language: item.language,
    topicsJson: JSON.stringify(item.topics ?? []),
    license: item.license?.spdx_id || item.license?.name || null,
    stars: item.stargazers_count,
    forks: item.forks_count,
    watchers: item.watchers_count,
    openIssues: item.open_issues_count,
    defaultBranch: item.default_branch ?? null,
    pushedAt: item.pushed_at ? new Date(item.pushed_at) : null,
    createdAtGithub: item.created_at ? new Date(item.created_at) : null,
    updatedAtGithub: item.updated_at ? new Date(item.updated_at) : null,
    archived: item.archived,
    disabled: Boolean(item.disabled),
    isFork: item.fork,
  };

  return prisma.githubRepository.upsert({
    where: { githubId: item.id },
    create: data,
    update: data,
  });
}

function buildRepositoryWhere(filters: TrendFilters): Prisma.GithubRepositoryWhereInput {
  const q = filters.q?.trim();
  return {
    archived: false,
    disabled: false,
    isFork: false,
    ...(filters.favorite === "true" ? { isFavorite: true } : {}),
    ...(filters.language ? { language: filters.language } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q } },
            { description: { contains: q } },
            { topicsJson: { contains: q } },
          ],
        }
      : {}),
  };
}

function rankRepositoryRecords(records: GithubRepoRecord[], filters: TrendFilters, snapshotDate: string) {
  const ranked = records
    .map((record) => {
      const deltas = getStarDeltas(record, snapshotDate);
      const score = calculatePotentialScore(record, deltas.starDelta24h, deltas.starDelta7d);
      return serializeGithubRepository(record, snapshotDate, 0, score, deltas.starDelta24h, deltas.starDelta7d);
    })
    .sort((a, b) => {
      if (filters.sort === "stars") return b.stars - a.stars;
      if (filters.sort === "updated") return new Date(b.pushedAt ?? 0).getTime() - new Date(a.pushedAt ?? 0).getTime();
      if (filters.sort === "delta") return b.starDelta7d - a.starDelta7d || b.starDelta24h - a.starDelta24h;
      return b.score - a.score || b.starDelta7d - a.starDelta7d || b.stars - a.stars;
    });

  return ranked.map((repo, index) => ({ ...repo, rank: index + 1 }));
}

function serializeGithubRepository(
  record: GithubRepoRecord,
  snapshotDate: string,
  rank: number,
  score?: number,
  starDelta24h?: number,
  starDelta7d?: number,
): GithubTrendRepo {
  const sortedSnapshots = [...record.snapshots].sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate));
  const latestSnapshot = sortedSnapshots[0] ? serializeSnapshot(sortedSnapshots[0]) : null;
  const deltas = starDelta24h === undefined || starDelta7d === undefined ? getStarDeltas(record, snapshotDate) : { starDelta24h, starDelta7d };
  const resolvedScore = score ?? latestSnapshot?.score ?? calculatePotentialScore(record, deltas.starDelta24h, deltas.starDelta7d);

  return {
    id: record.id,
    githubId: record.githubId,
    fullName: record.fullName,
    owner: record.owner,
    name: record.name,
    description: record.description,
    htmlUrl: record.htmlUrl,
    cloneUrl: record.cloneUrl,
    homepage: record.homepage,
    language: record.language,
    topics: safeJsonParse<string[]>(record.topicsJson, []),
    license: record.license,
    stars: record.stars,
    forks: record.forks,
    watchers: record.watchers,
    openIssues: record.openIssues,
    defaultBranch: record.defaultBranch,
    pushedAt: record.pushedAt?.toISOString() ?? null,
    createdAtGithub: record.createdAtGithub?.toISOString() ?? null,
    updatedAtGithub: record.updatedAtGithub?.toISOString() ?? null,
    archived: record.archived,
    disabled: record.disabled,
    isFork: record.isFork,
    isFavorite: record.isFavorite,
    note: record.note,
    analysis: parseStoredAnalysis(record.analysisJson),
    lastAnalyzedAt: record.lastAnalyzedAt?.toISOString() ?? null,
    firstSeenAt: record.firstSeenAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    latestSnapshot,
    starDelta24h: deltas.starDelta24h,
    starDelta7d: deltas.starDelta7d,
    score: resolvedScore,
    rank,
  };
}

function serializeSnapshot(snapshot: GithubRepoRecord["snapshots"][number]): GithubTrendSnapshot {
  return {
    id: snapshot.id,
    snapshotDate: snapshot.snapshotDate,
    rank: snapshot.rank,
    score: snapshot.score,
    stars: snapshot.stars,
    forks: snapshot.forks,
    openIssues: snapshot.openIssues,
    pushedAt: snapshot.pushedAt?.toISOString() ?? null,
    query: snapshot.query,
    topic: snapshot.topic,
    window: snapshot.window,
    createdAt: snapshot.createdAt.toISOString(),
  };
}

function parseStoredAnalysis(json: string | null | undefined) {
  const parsed = safeJsonParse<Partial<GithubRepoAnalysis> | null>(json, null);
  if (!parsed || !parsed.summary) {
    return null;
  }
  return parsed as GithubRepoAnalysis;
}

function getStarDeltas(record: GithubRepoRecord, snapshotDate: string) {
  const snapshots = [...record.snapshots].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));
  const today = snapshots.find((snapshot) => snapshot.snapshotDate === snapshotDate);
  const previous = snapshots.filter((snapshot) => snapshot.snapshotDate < snapshotDate).at(-1);
  const weekAgo = snapshots.find((snapshot) => snapshot.snapshotDate <= dateKeyDaysAgo(7)) ?? snapshots[0];

  return {
    starDelta24h: previous ? record.stars - previous.stars : proxyVelocity(record),
    starDelta7d: weekAgo ? record.stars - weekAgo.stars : proxyVelocity(record) * 7,
    todayStars: today?.stars ?? record.stars,
  };
}

function calculatePotentialScore(record: GithubRepoRecord, starDelta24h: number, starDelta7d: number) {
  const ageDays = Math.max(1, daysBetween(record.createdAtGithub ?? record.createdAt, new Date()));
  const pushDays = record.pushedAt ? daysBetween(record.pushedAt, new Date()) : 365;
  const topics = safeJsonParse<string[]>(record.topicsJson, []).join(" ").toLowerCase();
  const text = `${record.fullName} ${record.description ?? ""} ${topics}`.toLowerCase();
  const relevance = ["agent", "llm", "mcp", "ai", "copilot", "rag", "automation", "developer", "coding"].reduce(
    (sum, keyword) => sum + (text.includes(keyword) ? 1 : 0),
    0,
  );
  const issueRatio = record.openIssues > 0 ? record.openIssues / Math.max(1, record.forks) : 0;

  const starDensity = Math.min(35, (record.stars / ageDays) * 4);
  const deltaScore = Math.min(30, starDelta24h * 3 + starDelta7d * 0.8);
  const activityScore = Math.max(0, 18 - pushDays * 2);
  const relevanceScore = Math.min(15, relevance * 3);
  const healthScore = Math.max(0, 12 - Math.min(12, issueRatio));

  return Math.max(1, Math.min(100, Math.round(starDensity + deltaScore + activityScore + relevanceScore + healthScore)));
}

function proxyVelocity(record: GithubRepoRecord) {
  const ageDays = Math.max(1, daysBetween(record.createdAtGithub ?? record.createdAt, new Date()));
  return Math.max(0, Math.round(record.stars / ageDays));
}

function collectLanguages(records: GithubRepoRecord[]) {
  return Array.from(new Set(records.map((repo) => repo.language).filter((value): value is string => Boolean(value)))).sort();
}

function collectTopics(records: GithubRepoRecord[]) {
  return Array.from(new Set(records.flatMap((repo) => safeJsonParse<string[]>(repo.topicsJson, [])))).sort().slice(0, 60);
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return todayKey(date);
}

function dateKeyDaysAgo(days: number) {
  return dateDaysAgo(days);
}

function daysBetween(left: Date, right: Date) {
  return Math.max(0, Math.ceil((right.getTime() - left.getTime()) / 86_400_000));
}
