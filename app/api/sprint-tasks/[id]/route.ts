import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { serializeSprintTask } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["todo", "doing", "done"]),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const taskId = Number(id);
  const parsed = bodySchema.safeParse(await request.json());

  if (!Number.isInteger(taskId) || !parsed.success) {
    return NextResponse.json({ error: "任务更新参数无效。" }, { status: 400 });
  }

  const task = await prisma.sprintTask.update({
    where: { id: taskId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ task: serializeSprintTask(task) });
}
