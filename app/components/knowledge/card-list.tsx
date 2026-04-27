import { BookOpen, ChevronUp } from "lucide-react";
import type { KnowledgeCard } from "@/app/types";
import { difficultyLabels, masteryLabels } from "@/app/types";
import { Pill } from "@/app/components/shared/pill";

const btnSecondary = "flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-60";

interface CardListProps {
  cards: KnowledgeCard[];
  onProgress: (cardId: number, mastery: number, markReviewed: boolean) => void;
}

export function CardList({ cards, onProgress }: CardListProps) {
  if (cards.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无学习卡</div>;
  }
  return (
    <div className="mt-4 grid gap-3">
      {cards.map((card) => (
        <article key={card.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h5 className="text-sm font-semibold leading-snug">{card.question}</h5>
            <Pill variant="brand">掌握 {masteryLabels[card.mastery] ?? card.mastery}</Pill>
          </div>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-3">{card.answer}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {card.company && <Pill>{card.company.name}</Pill>}
            {card.topic && <Pill>{card.topic.name}</Pill>}
            <Pill variant="accent">{difficultyLabels[card.difficulty] ?? card.difficulty}</Pill>
            {card.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
          </div>
          <div className="mt-3 flex gap-2">
            <button className={btnSecondary} type="button"
              onClick={() => onProgress(card.id, Math.min(card.mastery + 1, 4), true)}>
              <BookOpen size={14} /> 复习
            </button>
            {card.mastery < 4 && (
              <button className={btnSecondary} type="button"
                onClick={() => onProgress(card.id, Math.min(card.mastery + 1, 4), false)}>
                <ChevronUp size={14} /> 掌握+1
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
