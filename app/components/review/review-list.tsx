import { CheckCircle2, ListChecks, Play } from "lucide-react";
import type { ReviewCard } from "@/app/types";
import { Pill } from "@/app/components/shared/pill";
import { formatDate } from "@/app/helpers";

const btnGhost = "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft disabled:opacity-60";
const btnSecondary = "flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-60";

const statusLabels: Record<string, string> = {
  todo: "待处理",
  doing: "处理中",
  done: "已完成",
};

interface ReviewListProps {
  cards: ReviewCard[];
  onStatus?: (cardId: number, status: "todo" | "doing" | "done") => void;
  onCreateTask?: (cardId: number) => void;
}

export function ReviewList({ cards, onStatus, onCreateTask }: ReviewListProps) {
  if (cards.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">暂无复盘卡</div>;
  }
  return (
    <div className="grid gap-3">
      {cards.map((card) => (
        <article key={card.id} className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h5 className="text-sm font-semibold">{card.title}</h5>
            <Pill variant={card.status === "done" ? "brand" : card.status === "doing" ? "accent" : "warn"}>
              {statusLabels[card.status] ?? card.status}
            </Pill>
          </div>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            <strong>薄弱点：</strong>{card.weakness}
          </p>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            <strong>建议：</strong>{card.suggestion}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {card.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
          </div>
          {card.session && (
            <p className="mt-2 text-xs text-muted-foreground">
              来源：{card.session.mode} / {card.session.roundType}
              {card.session.targetRole ? ` — ${card.session.targetRole}` : ""}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">到期：{formatDate(card.dueAt ?? null)}</span>
            <div className="flex flex-wrap gap-2">
              {onStatus && card.status !== "doing" && (
                <button className={btnGhost} type="button" onClick={() => onStatus(card.id, "doing")}>
                  <Play size={14} /> 开始处理
                </button>
              )}
              {onStatus && card.status !== "done" && (
                <button className={btnGhost} type="button" onClick={() => onStatus(card.id, "done")}>
                  <CheckCircle2 size={14} /> 标记完成
                </button>
              )}
              {onStatus && card.status === "done" && (
                <button className={btnGhost} type="button" onClick={() => onStatus(card.id, "todo")}>
                  重新打开
                </button>
              )}
              {onCreateTask && (
                <button className={btnSecondary} type="button" onClick={() => onCreateTask(card.id)}>
                  <ListChecks size={14} /> 转任务
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
