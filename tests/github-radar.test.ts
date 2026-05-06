import { describe, expect, it } from "vitest";
import type { GithubTrendRepo } from "@/app/types";
import { buildGithubRadarBrief } from "@/lib/github-radar";

function makeRepo(overrides: Partial<GithubTrendRepo>): GithubTrendRepo {
  return {
    id: overrides.id ?? 1,
    githubId: overrides.githubId ?? (overrides.id ?? 1) * 100,
    fullName: overrides.fullName ?? "demo/repo",
    owner: overrides.owner ?? "demo",
    name: overrides.name ?? "repo",
    description: overrides.description ?? "Coding agent framework for MCP workflows",
    htmlUrl: overrides.htmlUrl ?? "https://github.com/demo/repo",
    cloneUrl: overrides.cloneUrl ?? null,
    homepage: overrides.homepage ?? null,
    language: overrides.language ?? "TypeScript",
    topics: overrides.topics ?? ["agent", "mcp", "automation"],
    license: overrides.license ?? "MIT",
    stars: overrides.stars ?? 200,
    forks: overrides.forks ?? 30,
    watchers: overrides.watchers ?? 24,
    openIssues: overrides.openIssues ?? 8,
    defaultBranch: overrides.defaultBranch ?? "main",
    pushedAt: overrides.pushedAt ?? "2026-05-04T02:00:00.000Z",
    createdAtGithub: overrides.createdAtGithub ?? "2026-03-01T02:00:00.000Z",
    updatedAtGithub: overrides.updatedAtGithub ?? "2026-05-04T02:00:00.000Z",
    archived: overrides.archived ?? false,
    disabled: overrides.disabled ?? false,
    isFork: overrides.isFork ?? false,
    isFavorite: overrides.isFavorite ?? false,
    note: overrides.note ?? "",
    analysis: overrides.analysis ?? null,
    lastAnalyzedAt: overrides.lastAnalyzedAt ?? null,
    firstSeenAt: overrides.firstSeenAt ?? "2026-05-01T02:00:00.000Z",
    createdAt: overrides.createdAt ?? "2026-05-01T02:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-04T02:00:00.000Z",
    latestSnapshot: overrides.latestSnapshot ?? null,
    starDelta24h: overrides.starDelta24h ?? 12,
    starDelta7d: overrides.starDelta7d ?? 65,
    score: overrides.score ?? 88,
    rank: overrides.rank ?? 1,
  };
}

describe("buildGithubRadarBrief", () => {
  it("groups repositories into themes and returns a concise watchlist", () => {
    const repositories = [
      makeRepo({
        id: 1,
        fullName: "acme/coding-agent",
        topics: ["agent", "coding-agent", "typescript", "mcp"],
        description: "Agentic coding CLI for MCP and developer workflows",
        score: 92,
        rank: 1,
        starDelta24h: 18,
        starDelta7d: 120,
      }),
      makeRepo({
        id: 2,
        fullName: "acme/coding-agent-starter",
        topics: ["agent", "coding-agent", "typescript", "mcp"],
        description: "Starter template for coding agent and MCP workflow automation",
        score: 80,
        rank: 2,
        starDelta24h: 9,
        starDelta7d: 54,
      }),
      makeRepo({
        id: 3,
        fullName: "demo/rag-memory",
        topics: ["rag", "retrieval", "memory", "python"],
        language: "Python",
        description: "RAG memory layer for multi-agent apps",
        score: 86,
        rank: 3,
        starDelta24h: 10,
        starDelta7d: 73,
      }),
    ];

    const radar = buildGithubRadarBrief(repositories, { topic: "AI Agent", window: "daily" });

    expect(radar.headline).toContain("AI Agent");
    expect(radar.topRepositories.length).toBe(2);
    expect(radar.dedupedRepoCount).toBe(1);
    expect(radar.themeClusters.length).toBeGreaterThan(0);
    expect(radar.watchlist[0]).toContain("先看");
  });

  it("returns an empty-state radar when no repositories exist", () => {
    const radar = buildGithubRadarBrief([]);

    expect(radar.topRepositories).toEqual([]);
    expect(radar.themeClusters).toEqual([]);
    expect(radar.selectedRepoCount).toBe(0);
  });
});
