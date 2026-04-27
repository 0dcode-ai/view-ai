import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, icon, children, className }: PanelProps) {
  return (
    <section className={`rounded-2xl border border-border bg-surface shadow-sm ${className ?? ""}`}>
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        {icon}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
