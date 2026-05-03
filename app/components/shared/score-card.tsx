interface ScoreCardProps {
  label: string;
  value: number;
}

export function ScoreCard({ label, value }: ScoreCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5 text-center shadow-sm">
      <div className="text-[1.65rem] font-bold leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
