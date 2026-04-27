import type { ReviewCard } from "@/app/types";
import { Pill } from "@/app/components/shared/pill";

interface ReviewListProps {
  cards: ReviewCard[];
}

export function ReviewList({ cards }: ReviewListProps) {
  if (cards.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无复盘卡</div>;
  }
  return (
    <div className="grid gap-3">
      {cards.map((card) => (
        <article key={card.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h5 className="text-sm font-semibold">{card.title}</h5>
            <Pill variant={card.status === "done" ? "brand" : "warn"}>
              {card.status === "done" ? "已处理" : "待处理"}
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
            <p className="mt-2 text-xs text-muted">
              来源：{card.session.mode} / {card.session.roundType}
              {card.session.targetRole ? ` — ${card.session.targetRole}` : ""}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
