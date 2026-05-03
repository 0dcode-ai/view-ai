"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { TechnicalArticle } from "@/app/types";
import { cn } from "@/lib/utils";

const contentStyles =
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-primary/80 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono " +
  "[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold " +
  "[&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2 " +
  "[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold " +
  "[&_img]:my-4 [&_img]:max-h-[520px] [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_img]:shadow-sm " +
  "[&_li]:ml-5 [&_li]:my-1 [&_ol]:list-decimal [&_ol]:my-2 [&_ul]:list-disc [&_ul]:my-2 " +
  "[&_p]:my-2.5 [&_p]:leading-7 " +
  "[&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:my-4 [&_pre]:text-slate-50 [&_pre]:text-[13px] [&_pre]:leading-6 " +
  "[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted [&_th]:text-left [&_th]:text-sm " +
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm " +
  "[&_hr]:my-6 [&_hr]:border-border";

interface ArticleDetailProps {
  article: TechnicalArticle | null;
  onEdit: (article: TechnicalArticle) => void;
  onDelete: (id: number) => void;
}

export function ArticleDetail({ article, onEdit, onDelete }: ArticleDetailProps) {
  if (!article) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border">
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <FileTextIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">选择一篇文章查看详情</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Hero */}
      <div className="rounded-2xl bg-[linear-gradient(120deg,#18181b_0%,#3f3f46_55%,#f5f5f4_100%)] p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {article.topic && (
              <Badge className="mb-3 border border-white/12 bg-white/10 text-white hover:bg-white/15">
                {article.topic}
              </Badge>
            )}
            <h3 className="text-xl font-bold leading-snug tracking-tight">
              {article.title}
            </h3>
            {article.summary && (
              <p className="mt-2 text-sm leading-relaxed text-white/78">
                {article.summary}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/15 bg-white/10 text-white hover:bg-white/16 hover:text-white",
                )}
              >
                <ExternalLink className="size-3.5" /> 来源
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-white/15 bg-white/10 text-white hover:bg-white/16 hover:text-white"
              onClick={() => onEdit(article)}
            >
              <Pencil className="size-3.5" /> 编辑
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="border border-white/12 bg-white/10 text-white hover:bg-red-500/18 hover:text-white"
              onClick={() => onDelete(article.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        {article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <Badge
                variant="outline"
                className="border-white/12 bg-black/10 text-white/88 hover:bg-black/15"
                key={tag}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={`rounded-xl bg-card p-5 ring-1 ring-foreground/5 text-sm leading-7 text-foreground/90 ${contentStyles}`}
        dangerouslySetInnerHTML={{ __html: article.contentHtml || "<p>暂无正文。</p>" }}
      />
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
