import { Eye, ExternalLink, GitBranch, Layers3, RefreshCcw, Save, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Field } from "@/app/components/shared/field";
import { Panel } from "@/app/components/shared/panel";
import { Pill } from "@/app/components/shared/pill";
import { TextList } from "@/app/components/shared/text-list";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  compactSelectCls,
  inputCls,
  softGradientCls,
  textareaCls,
} from "@/app/components/shared/styles";
import { formatDate } from "@/app/helpers";
import { cn } from "@/lib/utils";
import type {
  GithubRadarBrief,
  GithubRadarDigest,
  GithubRadarDigestResponse,
  GithubRepoAnalyzeResponse,
  GithubTrendFilters,
  GithubTrendListResponse,
  GithubTrendRepo,
} from "@/app/features/github-trends/types";

type GithubTrendsTabProps = {
  busy: string | null;
  filters: GithubTrendFilters;
  repositories: GithubTrendRepo[];
  languages: string[];
  topics: string[];
  meta: GithubTrendListResponse["meta"] | null;
  radar: GithubRadarBrief;
  radarDigest: GithubRadarDigest;
  radarExecution: GithubRadarDigestResponse["execution"] | null;
  selectedRepository: GithubTrendRepo | null;
  noteDraft: string;
  analyzeExecution: GithubRepoAnalyzeResponse["execution"] | null;
  onSetFilters: (filters: GithubTrendFilters) => void;
  onUpdateFilters: (filters: GithubTrendFilters) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onSelectRepository: (repositoryId: number) => void;
  onToggleFavorite: (repository: GithubTrendRepo) => void;
  onAnalyzeRepository: () => void;
  onAnalyzeRadar: () => void;
  onSaveRadarAsSource: () => void;
  onSaveRepositoryAsSource: (repository: GithubTrendRepo) => void;
  onNoteDraftChange: (value: string) => void;
  onSaveNote: () => void;
};

export function GithubTrendsTab({
  busy,
  filters,
  repositories,
  languages,
  topics,
  meta,
  radar,
  radarDigest,
  radarExecution,
  selectedRepository,
  noteDraft,
  analyzeExecution,
  onSetFilters,
  onUpdateFilters,
  onSearch,
  onRefresh,
  onSelectRepository,
  onToggleFavorite,
  onAnalyzeRepository,
  onAnalyzeRadar,
  onSaveRadarAsSource,
  onSaveRepositoryAsSource,
  onNoteDraftChange,
  onSaveNote,
}: GithubTrendsTabProps) {
  return (
    <div className="grid gap-4">
      <Panel title="开源趋势雷达" icon={<GitBranch size={16} />}>
        <div className="grid gap-3 xl:grid-cols-[minmax(240px,1.2fr)_170px_150px_140px_150px_auto] xl:items-center">
          <input
            className={cn(inputCls, "xl:min-w-0")}
            placeholder="搜索 agent、mcp、hermes agent、coding agent"
            value={filters.q}
            onChange={(event) => onSetFilters({ ...filters, q: event.target.value })}
          />
          <select
            className={compactSelectCls}
            value={filters.topic}
            onChange={(event) => onUpdateFilters({ ...filters, topic: event.target.value })}
          >
            <option value="">全部方向</option>
            <option value="AI Agent">AI Agent</option>
            <option value="MCP">MCP</option>
            <option value="LLM">LLM</option>
            <option value="DevTools">DevTools</option>
          </select>
          <select
            className={compactSelectCls}
            value={filters.language}
            onChange={(event) => onUpdateFilters({ ...filters, language: event.target.value })}
          >
            <option value="">全部语言</option>
            {languages.map((language) => <option key={language} value={language}>{language}</option>)}
          </select>
          <select
            className={compactSelectCls}
            value={filters.window}
            onChange={(event) => onUpdateFilters({ ...filters, window: event.target.value })}
          >
            <option value="daily">日榜</option>
            <option value="weekly">周榜</option>
          </select>
          <select
            className={compactSelectCls}
            value={filters.sort}
            onChange={(event) => onUpdateFilters({ ...filters, sort: event.target.value })}
          >
            <option value="score">潜力分</option>
            <option value="delta">Star 增速</option>
            <option value="stars">Star 总数</option>
            <option value="updated">最近活跃</option>
          </select>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button className={btnSecondary} type="button" onClick={onSearch}>
              <Search size={15} /> 搜索
            </button>
            <button className={btnPrimary} type="button" onClick={onRefresh} disabled={busy === "github-refresh"}>
              <RefreshCcw size={15} /> {busy === "github-refresh" ? "刷新中" : "刷新日榜"}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Pill variant="brand">{meta?.total ?? repositories.length} 个仓库</Pill>
          <Pill>{meta?.snapshotDate ?? "未刷新"}</Pill>
          <button
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              filters.favorite === "true" ? "bg-zinc-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
            type="button"
            onClick={() => onUpdateFilters({ ...filters, favorite: filters.favorite === "true" ? "" : "true" })}
          >
            只看收藏
          </button>
          {topics.slice(0, 10).map((topic) => (
            <button
              key={topic}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              type="button"
              onClick={() => onSetFilters({ ...filters, q: topic })}
            >
              {topic}
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Panel title="今日雷达简报" icon={<Sparkles size={16} />}>
          <div className="grid gap-3">
            <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Radar Brief</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{radar.headline}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{radar.summary}</p>
                </div>
                <div className="grid min-w-[220px] grid-cols-3 gap-2 text-xs">
                  <RepoMiniStat label="候选" value={meta?.total ?? repositories.length} />
                  <RepoMiniStat label="去重后" value={radar.selectedRepoCount} />
                  <RepoMiniStat label="主题数" value={radar.uniqueThemeCount} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={btnPrimary} type="button" onClick={onAnalyzeRadar} disabled={busy === "github-radar-analyze"}>
                  <Sparkles size={15} /> {busy === "github-radar-analyze" ? "生成中" : "生成 AI 简报"}
                </button>
                <button className={btnSecondary} type="button" onClick={onSaveRadarAsSource} disabled={busy === "github-radar-source"}>
                  <Save size={15} /> {busy === "github-radar-source" ? "保存中" : "保存到来源"}
                </button>
              </div>
            </article>

            <div className="grid gap-3 xl:grid-cols-2">
              <GithubInfoCard title="关键信号">
                <TextListOrEmpty values={radar.keySignals} emptyText="刷新榜单后会生成趋势信号摘要。" />
              </GithubInfoCard>
              <GithubInfoCard title="这轮先看什么">
                <TextListOrEmpty values={radar.watchlist} emptyText="还没有优先级建议。" />
              </GithubInfoCard>
            </div>

            {(radarDigest.summary || radarExecution) && (
              <div className="grid gap-3 xl:grid-cols-2">
                <GithubInfoCard title={radarDigest.title || "AI 雷达简报"} value={radarDigest.summary || "点击生成 AI 简报后，系统会给出一版更适合行动的中文总结。"} />
                <GithubInfoCard title="建议动作">
                  <TextListOrEmpty values={radarDigest.recommendedActions ?? []} emptyText="还没有建议动作。" />
                </GithubInfoCard>
                <GithubInfoCard title="主题判断">
                  <TextListOrEmpty values={radarDigest.themeTakeaways ?? []} emptyText="还没有主题判断。" />
                </GithubInfoCard>
                <GithubInfoCard title="机会与风险">
                  <TextListOrEmpty values={[...(radarDigest.opportunities ?? []), ...(radarDigest.risks ?? []).map((item) => `风险：${item}`)]} emptyText="还没有机会与风险判断。" />
                </GithubInfoCard>
              </div>
            )}

            {radarExecution && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>模型：{radarExecution.model}</span>
                  <span>·</span>
                  <span>{radarExecution.usedFallback ? "当前是 fallback 简报" : "已使用真实模型简报"}</span>
                </div>
                <TextList values={radarExecution.steps} />
              </div>
            )}

            <div className="grid gap-2.5">
              {radar.topRepositories.map((repo) => (
                <article
                  key={repo.id}
                  className="rounded-xl border border-border bg-surface p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white">#{repo.rank}</span>
                        <button
                          className="truncate text-left text-sm font-semibold text-slate-900 hover:text-primary"
                          type="button"
                          onClick={() => onSelectRepository(repo.id)}
                        >
                          {repo.fullName}
                        </button>
                        <Pill variant="accent">{repo.theme}</Pill>
                        {repo.dedupedCount > 1 && <Pill>{repo.dedupedCount} 个同类</Pill>}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{repo.reason}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <RepoMiniStat label="Score" value={repo.score} />
                      <RepoMiniStat label="24h" value={repo.starDelta24h} />
                      <RepoMiniStat label="7d" value={repo.starDelta7d} />
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {repo.tags.map((tag) => <Pill key={`${repo.id}-${tag}`}>{tag}</Pill>)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className={btnSecondary} type="button" onClick={() => onSelectRepository(repo.id)}>
                      <Eye size={15} /> 查看详情
                    </button>
                    <button
                      className={btnSecondary}
                      type="button"
                      onClick={() => {
                        const full = repositories.find((item) => item.id === repo.id);
                        if (full) onSaveRepositoryAsSource(full);
                      }}
                      disabled={busy === `github-source-${repo.id}`}
                    >
                      <Save size={15} /> {busy === `github-source-${repo.id}` ? "保存中" : "存为来源"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="主题簇" icon={<Layers3 size={16} />}>
          {radar.themeClusters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              暂无主题聚合结果，刷新榜单后会把相近方向聚成可读的观察簇。
            </div>
          ) : (
            <div className="grid gap-2.5">
              {radar.themeClusters.map((theme) => (
                <article key={theme.key} className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{theme.label}</h4>
                      <p className="mt-1 text-xs text-slate-500">{theme.repoCount} 个仓库 · 平均分 {theme.averageScore}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {theme.languages.map((language) => <Pill key={`${theme.key}-${language}`} variant="accent">{language}</Pill>)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <TextListOrEmpty values={theme.signals} emptyText="暂无主题信号。" />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {theme.leadRepos.map((repo) => (
                      <button
                        key={repo.id}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                        type="button"
                        onClick={() => onSelectRepository(repo.id)}
                      >
                        {repo.fullName}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
        <Panel title="潜力仓库榜" icon={<GitBranch size={16} />}>
          {repositories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">还没有缓存的 GitHub 榜单，先刷新一次日榜。</p>
              <button className={btnPrimary + " mx-auto mt-4"} type="button" onClick={onRefresh} disabled={busy === "github-refresh"}>
                <RefreshCcw size={15} /> 刷新 GitHub 日榜
              </button>
            </div>
          ) : (
            <div className="grid max-h-[720px] gap-2.5 overflow-auto pr-1">
              {repositories.map((repo) => (
                <article
                  key={repo.id}
                  onClick={() => onSelectRepository(repo.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectRepository(repo.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "cursor-pointer rounded-xl border bg-surface p-3.5 text-left shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                    selectedRepository?.id === repo.id ? "border-primary ring-2 ring-primary/15" : "border-border hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                          {repo.rank || "-"}
                        </span>
                        <h4 className="truncate text-sm font-semibold">{repo.fullName}</h4>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {repo.description || "暂无仓库描述。"}
                      </p>
                    </div>
                    <button
                      className={cn(
                        "shrink-0 rounded-lg px-2 py-1 text-xs font-medium",
                        repo.isFavorite ? "bg-zinc-900 text-white" : "bg-slate-100 text-slate-600",
                      )}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavorite(repo);
                      }}
                      disabled={busy === `github-favorite-${repo.id}`}
                    >
                      {repo.isFavorite ? "已收藏" : "收藏"}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                    <RepoMiniStat label="Score" value={repo.score} />
                    <RepoMiniStat label="Stars" value={repo.stars} />
                    <RepoMiniStat label="24h" value={repo.starDelta24h} />
                    <RepoMiniStat label="7d" value={repo.starDelta7d} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {repo.language && <Pill variant="accent">{repo.language}</Pill>}
                    {repo.topics.slice(0, 4).map((topic) => <Pill key={topic}>{topic}</Pill>)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="仓库详情" icon={<GitBranch size={16} />}>
          {!selectedRepository ? (
            <div className="py-12 text-center text-sm text-muted-foreground">选择一个仓库查看详情。</div>
          ) : (
            <div className="grid gap-3">
              <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill variant="brand">Score {selectedRepository.score}</Pill>
                      {selectedRepository.language && <Pill variant="accent">{selectedRepository.language}</Pill>}
                      {selectedRepository.license && <Pill>{selectedRepository.license}</Pill>}
                    </div>
                    <h3 className="mt-2.5 text-xl font-semibold leading-snug">{selectedRepository.fullName}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{selectedRepository.description || "暂无仓库描述。"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a className={btnSecondary} href={selectedRepository.htmlUrl} target="_blank" rel="noreferrer">
                        <ExternalLink size={15} /> GitHub
                      </a>
                      {selectedRepository.homepage && (
                        <a className={btnGhost} href={selectedRepository.homepage} target="_blank" rel="noreferrer">
                          <ExternalLink size={15} /> 官网
                        </a>
                      )}
                      <button className={btnSecondary} type="button" onClick={() => onToggleFavorite(selectedRepository)}>
                        {selectedRepository.isFavorite ? "取消收藏" : "收藏"}
                      </button>
                      <button className={btnPrimary} type="button" onClick={onAnalyzeRepository} disabled={busy === "github-analyze"}>
                        <Sparkles size={15} /> {busy === "github-analyze" ? "分析中" : "AI 分析"}
                      </button>
                      <button className={btnSecondary} type="button" onClick={() => onSaveRepositoryAsSource(selectedRepository)} disabled={busy === `github-source-${selectedRepository.id}`}>
                        <Save size={15} /> {busy === `github-source-${selectedRepository.id}` ? "保存中" : "存为来源"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>

              <div className="grid gap-3 md:grid-cols-4">
                <RepoSignalCard label="Stars" value={selectedRepository.stars} caption={`24h +${selectedRepository.starDelta24h}`} />
                <RepoSignalCard label="Forks" value={selectedRepository.forks} caption={`${selectedRepository.watchers} watchers`} />
                <RepoSignalCard label="Issues" value={selectedRepository.openIssues} caption="open issues" />
                <RepoSignalCard label="最近 Push" value={formatDate(selectedRepository.pushedAt)} caption={formatDate(selectedRepository.createdAtGithub)} />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedRepository.topics.map((topic) => <Pill key={topic}>{topic}</Pill>)}
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <GithubInfoCard title="AI 总结" value={selectedRepository.analysis?.summary || "点击 AI 分析后生成仓库总结。"} />
                <GithubInfoCard title="为什么在涨">
                  <TextListOrEmpty values={selectedRepository.analysis?.whyTrending ?? []} />
                </GithubInfoCard>
                <GithubInfoCard title="潜力理由">
                  <TextListOrEmpty values={selectedRepository.analysis?.potentialReasons ?? []} />
                </GithubInfoCard>
                <GithubInfoCard title="学习价值">
                  <TextListOrEmpty values={selectedRepository.analysis?.learningValue ?? []} />
                </GithubInfoCard>
                <GithubInfoCard title="适用场景">
                  <TextListOrEmpty values={selectedRepository.analysis?.useCases ?? []} />
                </GithubInfoCard>
                <GithubInfoCard title="风险信号">
                  <TextListOrEmpty values={selectedRepository.analysis?.riskSignals ?? []} />
                </GithubInfoCard>
              </div>

              {analyzeExecution && (
                <div className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>模型：{analyzeExecution.model}</span>
                    <span>·</span>
                    <span>{analyzeExecution.usedFallback ? "当前是 fallback 分析" : "已使用真实模型分析"}</span>
                  </div>
                  <TextList values={analyzeExecution.steps} />
                </div>
              )}

              <Field label="研究备注">
                <textarea
                  className={textareaCls + " min-h-[120px]"}
                  placeholder="记录你想研究它的原因、可借鉴功能、后续文章选题或产品灵感。"
                  value={noteDraft}
                  onChange={(event) => onNoteDraftChange(event.target.value)}
                />
              </Field>
              <div className="flex justify-end">
                <button className={btnSecondary} type="button" onClick={onSaveNote} disabled={busy === "github-note"}>
                  <Save size={15} /> 保存备注
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

type GithubInfoCardProps = {
  title: string;
  value?: string | null;
  children?: ReactNode;
};

function GithubInfoCard({ title, value, children }: GithubInfoCardProps) {
  return (
    <article className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
      <h4 className="text-[13px] font-semibold text-foreground">{title}</h4>
      <div className="mt-2">
        {children ?? (
          <div className="max-h-[172px] overflow-auto pr-1">
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-600">{value?.trim() || "待补充"}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function RepoMiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RepoSignalCard({ label, value, caption }: { label: string; value: number | string; caption: string }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{caption}</p>
    </article>
  );
}

function TextListOrEmpty({ values, emptyText = "暂无分析。" }: { values: string[]; emptyText?: string }) {
  if (values.length === 0) {
    return <p className="text-[13px] leading-6 text-slate-600">{emptyText}</p>;
  }

  return <TextList values={values} />;
}
