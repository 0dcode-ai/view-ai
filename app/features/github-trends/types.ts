import type {
  GithubRadarBrief,
  GithubRadarDigest,
  GithubRadarDigestResponse,
  GithubRepoAnalysis,
  GithubTrendListResponse,
  GithubTrendRepo,
} from "@/app/types";

export type GithubTrendFilters = {
  q: string;
  topic: string;
  language: string;
  window: string;
  sort: string;
  favorite: string;
};

export type GithubRepoAnalyzeResponse = {
  repository: GithubTrendRepo;
  analysis: GithubRepoAnalysis;
  execution: {
    model: string;
    usedFallback: boolean;
    steps: string[];
  };
};

export type GithubSourceDraftResponse = {
  sourceDraft: {
    title: string;
    sourceType: "github";
    content: string;
    metadata?: Record<string, unknown>;
  };
};

export const emptyGithubRadar: GithubRadarBrief = {
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

export const emptyGithubRadarDigest: GithubRadarDigest = {
  title: "",
  summary: "",
  themeTakeaways: [],
  opportunities: [],
  risks: [],
  recommendedActions: [],
  watchItems: [],
};

export type {
  GithubRadarBrief,
  GithubRadarDigest,
  GithubRadarDigestResponse,
  GithubRepoAnalysis,
  GithubTrendListResponse,
  GithubTrendRepo,
};
