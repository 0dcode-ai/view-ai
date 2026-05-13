import { requestJson } from "@/app/helpers";
import type {
  GithubRadarDigestResponse,
  GithubRepoAnalyzeResponse,
  GithubSourceDraftResponse,
  GithubTrendFilters,
  GithubTrendListResponse,
  GithubTrendRepo,
} from "@/app/features/github-trends/types";

function buildTrendQuery(filters: GithubTrendFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export async function loadGithubTrendList(filters: GithubTrendFilters) {
  const query = buildTrendQuery(filters);
  return requestJson<GithubTrendListResponse>(`/api/github-trends${query ? `?${query}` : ""}`);
}

export async function refreshGithubTrendList(filters: GithubTrendFilters) {
  return requestJson<GithubTrendListResponse>("/api/github-trends/refresh", {
    method: "POST",
    body: JSON.stringify(filters),
  });
}

export async function updateGithubRepository(repoId: number, patch: Partial<Pick<GithubTrendRepo, "isFavorite" | "note">>) {
  return requestJson<{ repository: GithubTrendRepo }>(`/api/github-trends/${repoId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function analyzeGithubRepository(repoId: number) {
  return requestJson<GithubRepoAnalyzeResponse>(`/api/github-trends/${repoId}/analyze`, {
    method: "POST",
  });
}

export async function analyzeGithubRadar(filters: GithubTrendFilters) {
  return requestJson<GithubRadarDigestResponse>("/api/github-trends/radar", {
    method: "POST",
    body: JSON.stringify(filters),
  });
}

export async function createGithubRadarSourceDraft(filters: GithubTrendFilters) {
  return requestJson<GithubSourceDraftResponse>("/api/github-trends/source-draft", {
    method: "POST",
    body: JSON.stringify({
      type: "radar",
      ...filters,
    }),
  });
}

export async function createGithubRepoSourceDraft(repoId: number, filters: GithubTrendFilters) {
  return requestJson<GithubSourceDraftResponse>("/api/github-trends/source-draft", {
    method: "POST",
    body: JSON.stringify({
      type: "repo",
      repoId,
      ...filters,
    }),
  });
}
