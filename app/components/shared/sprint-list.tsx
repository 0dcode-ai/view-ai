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
}

export function SprintList({ plans, onTaskStatus }: SprintListProps) {
  if (plans.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无冲刺计划</div>;
  }
  return (
    <div className="grid gap-4">
      {plans.map((plan) => {
        const doneCount = plan.tasks.filter((t) => t.status === "done").length;
        return (
          <article key={plan.id} className="rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h4 className="text-sm font-semibold">{plan.title}</h4>
                <p className="mt-0.5 text-xs text-muted">
                  {plan.company?.name ?? "未命名公司"} · {plan.days} 天
                </p>
              </div>
              <Pill variant="brand">{doneCount}/{plan.tasks.length}</Pill>
            </div>
            <div className="p-5 grid gap-2">
              {plan.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
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
                      <p className="mt-0.5 text-xs text-muted">{task.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted">Day {task.dayIndex + 1}</span>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
