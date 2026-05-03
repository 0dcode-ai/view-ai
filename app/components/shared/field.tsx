import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="grid gap-1">
      <label className="text-xs font-medium text-foreground/85">{label}</label>
      {children}
    </div>
  );
}
