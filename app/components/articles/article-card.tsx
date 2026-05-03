"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/app/helpers";
import type { TechnicalArticle } from "@/app/types";

interface ArticleCardProps {
  article: TechnicalArticle;
  isSelected: boolean;
  onClick: () => void;
}

export function ArticleCard({ article, isSelected, onClick }: ArticleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl border p-4 text-left transition-all duration-200",
        isSelected
          ? "border-primary/30 bg-primary/[0.04] ring-2 ring-primary/10 shadow-sm"
          : "border-border bg-card hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-1 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
          {article.title}
        </h4>
        <Badge
          variant={article.status === "draft" ? "outline" : "default"}
          className="shrink-0 text-[10px] h-5"
        >
          {article.status === "draft" ? "草稿" : "已发布"}
        </Badge>
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {article.summary || article.contentText || "暂无摘要"}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {article.topic && (
          <Badge variant="secondary" className="text-[10px] h-4.5">{article.topic}</Badge>
        )}
        {article.tags.slice(0, 3).map((tag) => (
          <Badge variant="outline" className="text-[10px] h-4.5" key={tag}>{tag}</Badge>
        ))}
        {article.assets.length > 0 && (
          <Badge variant="outline" className="text-[10px] h-4.5">{article.assets.length} 图</Badge>
        )}
      </div>

      <p className="mt-2.5 text-[11px] text-muted-foreground/60">{formatDate(article.updatedAt)}</p>
    </button>
  );
}
