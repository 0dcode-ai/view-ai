import type { InterviewSession } from "@/app/types";
import { interviewModeLabels, roundTypeLabels } from "@/lib/interview-modes";
import { Pill } from "@/app/components/shared/pill";
import { formatDate, scoreOrDash } from "@/app/helpers";

interface SessionListProps {
  sessions: InterviewSession[];
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无面试记录</div>;
  }
  return (
    <div className="grid gap-3">
      {sessions.map((session) => (
        <article key={session.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h5 className="text-sm font-semibold">
              {interviewModeLabels[session.mode]} / {roundTypeLabels[session.roundType]}
            </h5>
            <Pill variant={session.status === "finished" ? "brand" : "accent"}>
              {session.status === "finished" ? "已完成" : session.status}
            </Pill>
          </div>
          <div className="mt-1 text-sm text-muted">
            {session.company?.name ?? "未命名公司"}
            {session.targetRole ? ` / ${session.targetRole}` : ""}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill>总分 {scoreOrDash(session.score.overall)}</Pill>
            <Pill>八股 {scoreOrDash(session.score.knowledge)}</Pill>
            <Pill>表达 {scoreOrDash(session.score.expression)}</Pill>
          </div>
          <div className="mt-2 text-xs text-muted">{formatDate(session.updatedAt)}</div>
        </article>
      ))}
    </div>
  );
}
