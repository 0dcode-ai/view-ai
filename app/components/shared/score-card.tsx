interface ScoreCardProps {
  label: string;
  value: number;
}

export function ScoreCard({ label, value }: ScoreCardProps) {
  return (
    <div className="rounded-lg border border-sky-100/90 bg-white/90 p-3.5 text-center shadow-[0_12px_30px_rgba(30,78,121,0.06)]">
      <div className="text-[1.65rem] font-bold leading-none text-sky-700">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
