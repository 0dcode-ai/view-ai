import { cn } from "@/lib/utils";
import type { SprintPlan, SprintTask } from "@/app/types";
import { Pill } from "@/app/components/shared/pill";

const taskStatusLabels: Record<SprintTask["status"], string> = {
  todo: "待做",
  doing: "进行中",
  done: "已完成",
};

const taskStatusCls: Record<SprintTask["status"], string> = {
  todo: "bg-slate-100 text-slate-600",
  doing: "bg-amber-50 text-amber-700",
  done: "bg-green-50 text-green-700",
};

const nextStatus: Record<SprintTask["status"], SprintTask["status"]> = {
  todo: "doing",
  doing: "done",
  done: "todo",
};

interface SprintListProps {
  plans: SprintPlan[];
  onTaskStatus: (taskId: number, status: SprintTask["status"]) => void;
  activePlanId?: number | null;
  onSelect?: (planId: number) => void;
}

export function SprintList({ plans, onTaskStatus, activePlanId, onSelect }: SprintListProps) {
  if (plans.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">暂无冲刺计划</div>;
  }
  return (
    <div className="grid gap-4">
      {plans.map((plan) => {
        const doneCount = plan.tasks.filter((t) => t.status === "done").length;
        return (
          <article
            key={plan.id}
            className={cn(
              "rounded-2xl border bg-surface shadow-sm transition-colors",
              activePlanId === plan.id ? "border-primary ring-2 ring-primary/15" : "border-border",
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <button className="min-w-0 text-left" type="button" onClick={() => onSelect?.(plan.id)}>
                <h4 className="text-sm font-semibold">{plan.title}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {plan.company?.name ?? "未命名公司"} · {plan.days} 天
                </p>
              </button>
              <Pill variant="brand">{doneCount}/{plan.tasks.length}</Pill>
            </div>
            <div className="grid gap-2 p-4">
              {plan.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <button
                    type="button"
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                      taskStatusCls[task.status],
                    )}
                    onClick={() => onTaskStatus(task.id, nextStatus[task.status])}
                  >
                    {taskStatusLabels[task.status]}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Day {task.dayIndex + 1}</span>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
