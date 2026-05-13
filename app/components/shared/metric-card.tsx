import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
}

export function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-sky-100/90 bg-white/90 p-3.5 shadow-[0_12px_30px_rgba(30,78,121,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon && <span className="text-sky-600">{icon}</span>}
      </div>
      <div className="mt-1.5 text-[1.65rem] font-bold leading-none text-slate-950">{value}</div>
    </div>
  );
}
