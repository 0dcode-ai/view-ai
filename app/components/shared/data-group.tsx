import type { ReactNode } from "react";

interface DataGroupProps {
  title: string;
  children: ReactNode;
}

export function DataGroup({ title, children }: DataGroupProps) {
  return (
    <div className="mt-2.5">
      <h6 className="text-sm font-semibold">{title}</h6>
      <div className="mt-1">{children}</div>
    </div>
  );
}
