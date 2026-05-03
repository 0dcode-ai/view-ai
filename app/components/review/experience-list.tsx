import { BookOpen, MessageSquareText, ListChecks } from "lucide-react";
import type { ExperienceReport } from "@/app/types";
import { Pill } from "@/app/components/shared/pill";
import { formatDate } from "@/app/helpers";

const btnGhost = "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft disabled:opacity-60";

const resultLabels: Record<string, string> = {
  offer: "Offer",
  reject: "未过",
  pending: "等待中",
  unknown: "未知",
};

interface ExperienceListProps {
  experiences: ExperienceReport[];
  onGenerateCards: (reportId: number) => void;
  onStartInterview: (reportId: number) => void;
  onCreateTasks: (reportId: number) => void;
}

export function ExperienceList({ experiences, onGenerateCards, onStartInterview, onCreateTasks }: ExperienceListProps) {
  if (experiences.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">暂无面经</div>;
  }
  return (
    <div className="grid gap-3">
      {experiences.map((exp) => (
        <article key={exp.id} className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h5 className="text-sm font-semibold">
              {exp.company?.name ?? "未知公司"} / {exp.roleName}
            </h5>
            <div className="flex items-center gap-2">
              <Pill variant={exp.result === "offer" ? "brand" : exp.result === "reject" ? "warn" : "default"}>
                {resultLabels[exp.result] ?? exp.result}
              </Pill>
              <Pill variant="accent">{exp.difficulty}</Pill>
            </div>
          </div>
          {exp.summary && (
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{exp.summary}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {exp.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatDate(exp.updatedAt)}</span>
            <div className="flex gap-2">
              <button className={btnGhost} type="button" onClick={() => onGenerateCards(exp.id)}>
                <BookOpen size={14} /> 生成八股卡
              </button>
              <button className={btnGhost} type="button" onClick={() => onStartInterview(exp.id)}>
                <MessageSquareText size={14} /> 模拟
              </button>
              <button className={btnGhost} type="button" onClick={() => onCreateTasks(exp.id)}>
                <ListChecks size={14} /> 任务
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
