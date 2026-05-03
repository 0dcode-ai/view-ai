import { Code2, GitBranch, Users } from "lucide-react";
import type { LabSession, LabType } from "@/app/types";
import { Pill } from "@/app/components/shared/pill";
import { formatDate } from "@/app/helpers";
import { cn } from "@/lib/utils";

const btnSecondary = "flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-60";

function labIcon(type: LabType) {
  if (type === "peer_mock") return <Users size={16} />;
  if (type === "system_design") return <GitBranch size={16} />;
  return <Code2 size={16} />;
}

const typeLabels: Record<LabType, string> = {
  coding: "代码",
  system_design: "白板",
  peer_mock: "同伴",
};

interface LabListProps {
  sessions: LabSession[];
  activeId: number | null;
  onSelect: (id: number) => void;
}

export function LabList({ sessions, activeId, onSelect }: LabListProps) {
  if (sessions.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">暂无练习记录</div>;
  }
  return (
    <div className="grid gap-3">
      {sessions.map((session) => (
        <article
          key={session.id}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-3.5 shadow-sm transition-colors cursor-pointer",
            session.id === activeId
              ? "border-primary bg-primary-soft"
              : "border-border bg-surface hover:bg-slate-50",
          )}
          onClick={() => onSelect(session.id)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-muted-foreground">
            {labIcon(session.type)}
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-sm font-semibold">{session.title}</h5>
            <p className="text-xs text-muted-foreground">
              {typeLabels[session.type]} · {formatDate(session.updatedAt)}
            </p>
          </div>
          {typeof session.feedback.score === "number" && (
            <Pill variant="accent">得分 {session.feedback.score}</Pill>
          )}
          <Pill variant={session.status === "reviewed" ? "brand" : "default"}>
            {session.status === "reviewed" ? "已评" : session.status}
          </Pill>
        </article>
      ))}
    </div>
  );
}
