interface ScoreCardProps {
  label: string;
  value: number;
}

export function ScoreCard({ label, value }: ScoreCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center shadow-sm">
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-sm text-muted">{label}</div>
    </div>
  );
}
