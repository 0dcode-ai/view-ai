import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PillVariant = "default" | "warn" | "brand" | "accent";

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
}

const variantCls: Record<PillVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  warn: "bg-amber-50 text-amber-700",
  brand: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
};

export function Pill({ children, variant = "default" }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantCls[variant],
      )}
    >
      {children}
    </span>
  );
}
