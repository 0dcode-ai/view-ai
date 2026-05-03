import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { serializeReviewCard, serializeSprintTask } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["todo", "doing", "done"]).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  dueAt: z.string().nullable().optional(),
  createTask: z.boolean().optional(),
});

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseDate(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  const parsed = bodySchema.safeParse(await request.json());

  if (!id || !parsed.success) {
    return NextResponse.json({ error: "复盘卡更新参数无效。" }, { status: 400 });
  }

  const input = parsed.data;
  const dueAt = parseDate(input.dueAt);
  if (input.dueAt !== undefined && dueAt === undefined) {
    return NextResponse.json({ error: "复盘卡日期无效。" }, { status: 400 });
  }

  const current = await prisma.reviewCard.findUnique({
    where: { id },
    include: {
      knowledgeCard: { include: { company: true, topic: true } },
      session: true,
    },
  });

  if (!current) {
    return NextResponse.json({ error: "复盘卡不存在。" }, { status: 404 });
  }

  let sprintTask = null;
  if (input.createTask) {
    const companyId = current.session?.targetCompanyId ?? current.knowledgeCard?.companyId ?? null;
    const marker = `复盘卡 #${current.id}`;
    const plan = await prisma.sprintPlan.findFirst({
      where: {
        title: "复盘行动清单",
        ...(companyId ? { companyId } : {}),
        status: "active",
      },
      include: { tasks: true },
      orderBy: { updatedAt: "desc" },
    });

    const sprintPlan =
      plan ??
      (await prisma.sprintPlan.create({
        data: {
          title: "复盘行动清单",
          companyId,
          jobTargetId: current.session?.jobTargetId ?? null,
          resumeProfileId: current.session?.resumeProfileId ?? null,
          targetRole: current.session?.targetRole ?? current.knowledgeCard?.roleDirection ?? null,
          days: 7,
          summary: "把面试复盘卡拆成可以每天推进的行动任务。",
        },
        include: { tasks: true },
      }));

    const existingTask = sprintPlan.tasks.find(
      (task) => task.type === "review" && task.description.includes(marker),
    );

    sprintTask =
      existingTask ??
      (await prisma.sprintTask.create({
        data: {
          planId: sprintPlan.id,
          dayIndex: 0,
          type: "review",
          title: current.title,
          description: `${current.suggestion}\n${marker}`,
          status: "todo",
          dueDate: dueAt === undefined ? current.dueAt ?? new Date() : dueAt,
        },
      }));
  }

  const reviewCard = await prisma.reviewCard.update({
    where: { id },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(dueAt !== undefined ? { dueAt } : {}),
    },
    include: {
      knowledgeCard: { include: { company: true, topic: true } },
      session: true,
    },
  });

  return NextResponse.json({
    reviewCard: serializeReviewCard(reviewCard),
    sprintTask: sprintTask ? serializeSprintTask(sprintTask) : null,
  });
}
