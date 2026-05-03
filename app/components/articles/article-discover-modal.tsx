"use client";

import { ExternalLink, Save, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ArticleRecommendation } from "@/app/types";
import { cn } from "@/lib/utils";

interface ArticleDiscoverModalProps {
  open: boolean;
  topic: string;
  sourceMode: string;
  articles: ArticleRecommendation[];
  busy: string | null;
  onTopicChange: (value: string) => void;
  onSourceModeChange: (value: string) => void;
  onSearch: () => void;
  onSave: (article: ArticleRecommendation) => void;
  onClose: () => void;
}

const levelVariant = (level: string) => {
  switch (level) {
    case "深入": return "destructive" as const;
    case "进阶": return "default" as const;
    default: return "secondary" as const;
  }
};

export function ArticleDiscoverModal({
  open,
  topic,
  sourceMode,
  articles,
  busy,
  onTopicChange,
  onSourceModeChange,
  onSearch,
  onSave,
  onClose,
}: ArticleDiscoverModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="flex flex-col w-full max-w-6xl max-h-[calc(100vh-2rem)] rounded-2xl bg-card shadow-2xl ring-1 ring-foreground/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
          <div>
            <h3 className="text-base font-semibold">发现文章</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              从官方文档和社区文章里找素材，保存后会进入本地文章库草稿
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Search bar */}
        <div className="grid gap-3 border-b px-5 py-3 md:grid-cols-[minmax(280px,1fr)_180px_auto] md:items-center">
          <Input
            className="w-full"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="如 React 性能优化 / Redis 缓存"
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <select
            className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={sourceMode}
            onChange={(e) => onSourceModeChange(e.target.value)}
          >
            <option value="all">官方 + 社区</option>
            <option value="official">偏官方文档</option>
            <option value="community">偏社区文章</option>
          </select>
          <Button onClick={onSearch} disabled={busy === "article-discover"}>
            <Search className="size-3.5" /> 查找
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-5">
          {articles.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                  <Search className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">输入选题后加载文章推荐</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="flex min-h-[220px] flex-col rounded-xl border bg-card p-4 ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={levelVariant(article.level)} className="text-[10px]">
                      {article.level}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{article.source}</span>
                  </div>
                  <h4 className="mt-3 text-sm font-semibold leading-snug line-clamp-2">{article.title}</h4>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                    {article.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 4).map((tag) => (
                      <Badge variant="outline" className="text-[10px] h-4.5" key={tag}>{tag}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      <ExternalLink className="size-3.5" /> 打开
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSave(article)}
                      disabled={busy === `discover-save-${article.id}`}
                    >
                      <Save className="size-3.5" /> 存草稿
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
