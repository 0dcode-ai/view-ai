import { useMemo } from "react";
import type { ReviewCard } from "@/app/types";
import { Pill } from "@/app/components/shared/pill";

interface WeaknessListProps {
  reviewCards: ReviewCard[];
}

export function WeaknessList({ reviewCards }: WeaknessListProps) {
  const weaknesses = useMemo(() => {
    const tagCounts: Record<string, { count: number; weaknesses: string[] }> = {};
    for (const card of reviewCards) {
      for (const tag of card.tags) {
        if (!tagCounts[tag]) tagCounts[tag] = { count: 0, weaknesses: [] };
        tagCounts[tag].count += 1;
        if (card.weakness) tagCounts[tag].weaknesses.push(card.weakness);
      }
    }
    return Object.entries(tagCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
  }, [reviewCards]);

  if (weaknesses.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无薄弱主题数据</div>;
  }

  const maxCount = weaknesses[0][1].count;

  return (
    <div className="grid gap-3">
      {weaknesses.map(([tag, data]) => (
        <div key={tag} className="rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h5 className="text-sm font-semibold">{tag}</h5>
            <Pill variant="warn">{data.count} 条</Pill>
          </div>
          <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-warning to-destructive transition-all"
              style={{ width: `${Math.round((data.count / maxCount) * 100)}%` }}
            />
          </div>
          {data.weaknesses.length > 0 && (
            <p className="mt-2 text-xs text-muted line-clamp-2">
              {data.weaknesses[0]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
