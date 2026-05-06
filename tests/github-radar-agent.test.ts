import { describe, expect, it } from "vitest";
import type { GithubRadarBrief, GithubTrendRepo } from "@/app/types";
import { fallbackGithubRadarDigest } from "@/lib/github-radar-agent";

function makeRepo(overrides: Partial<GithubTrendRepo>): GithubTrendRepo {
  return {
    id: overrides.id ?? 1,
    githubId: overrides.githubId ?? (overrides.id ?? 1) * 100,
    fullName: overrides.fullName ?? "demo/repo",
    owner: overrides.owner ?? "demo",
    name: overrides.name ?? "repo",
    description: overrides.description ?? "Open source coding agent tool",
    htmlUrl: overrides.htmlUrl ?? "https://github.com/demo/repo",
    cloneUrl: overrides.cloneUrl ?? null,
    homepage: overrides.homepage ?? null,
    language: overrides.language ?? "TypeScript",
    topics: overrides.topics ?? ["agent", "automation"],
    license: overrides.license ?? "MIT",
    stars: overrides.stars ?? 220,
    forks: overrides.forks ?? 32,
    watchers: overrides.watchers ?? 19,
    openIssues: overrides.openIssues ?? 7,
    defaultBranch: overrides.defaultBranch ?? "main",
    pushedAt: overrides.pushedAt ?? "2026-05-05T01:00:00.000Z",
    createdAtGithub: overrides.createdAtGithub ?? "2026-04-01T01:00:00.000Z",
    updatedAtGithub: overrides.updatedAtGithub ?? "2026-05-05T01:00:00.000Z",
    archived: overrides.archived ?? false,
    disabled: overrides.disabled ?? false,
    isFork: overrides.isFork ?? false,
    isFavorite: overrides.isFavorite ?? false,
    note: overrides.note ?? "",
    analysis: overrides.analysis ?? null,
    lastAnalyzedAt: overrides.lastAnalyzedAt ?? null,
    firstSeenAt: overrides.firstSeenAt ?? "2026-05-01T01:00:00.000Z",
    createdAt: overrides.createdAt ?? "2026-05-01T01:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-05T01:00:00.000Z",
    latestSnapshot: overrides.latestSnapshot ?? null,
    starDelta24h: overrides.starDelta24h ?? 10,
    starDelta7d: overrides.starDelta7d ?? 60,
    score: overrides.score ?? 85,
    rank: overrides.rank ?? 1,
  };
}

describe("fallbackGithubRadarDigest", () => {
  it("builds a digest from radar and repositories", () => {
    const radar: GithubRadarBrief = {
      headline: "AI Agent 方向今天优先跟进这 2 个仓库",
      summary: "当前榜单已经做过去重，热点集中在 Coding Agents。",
      keySignals: ["Coding Agents 最集中。"],
      watchlist: ["先看 acme/coder：同类方向里综合信号最强。"],
      selectedRepoCount: 2,
      dedupedRepoCount: 1,
      uniqueThemeCount: 2,
      topRepositories: [
        {
          id: 1,
          fullName: "acme/coder",
          score: 92,
          rank: 1,
          theme: "Coding Agents",
          starDelta24h: 20,
          starDelta7d: 120,
          tags: ["agent", "mcp"],
          dedupedCount: 2,
          reason: "同类方向里综合信号最强。",
        },
      ],
      themeClusters: [
        {
          key: "coding-agents",
          label: "Coding Agents",
          repoCount: 4,
          averageScore: 88,
          average24hDelta: 12,
          average7dDelta: 72,
          languages: ["TypeScript"],
          leadRepos: [{ id: 1, fullName: "acme/coder", score: 92 }],
          signals: ["平均潜力分 88"],
        },
      ],
    };

    const digest = fallbackGithubRadarDigest(radar, [makeRepo({ id: 1, fullName: "acme/coder", score: 92, rank: 1, starDelta7d: 120 })], {
      topic: "AI Agent",
      window: "daily",
    });

    expect(digest.title).toContain("AI Agent");
    expect(digest.summary).toContain("去重");
    expect(digest.watchItems[0]?.repoFullName).toBe("acme/coder");
    expect(digest.recommendedActions.length).toBeGreaterThan(0);
  });
});
