import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PillVariant = "default" | "warn" | "brand" | "accent";

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
}

const variantCls: Record<PillVariant, string> = {
  default: "bg-stone-100 text-stone-700",
  warn: "bg-amber-50 text-amber-700",
  brand: "bg-zinc-900 text-white",
  accent: "bg-zinc-100 text-zinc-700",
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
