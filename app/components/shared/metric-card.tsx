import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
}

export function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-1.5 text-[1.65rem] font-bold leading-none">{value}</div>
    </div>
  );
}
