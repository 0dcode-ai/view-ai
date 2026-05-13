import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, icon, children, className }: PanelProps) {
  return (
    <section className={`overflow-hidden rounded-lg border border-sky-100/80 bg-white/88 shadow-[0_14px_38px_rgba(30,78,121,0.07)] backdrop-blur ${className ?? ""}`}>
      <div className="flex items-center gap-2 border-b border-sky-100/80 bg-white/72 px-4 py-3">
        {icon && <span className="text-sky-600">{icon}</span>}
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
