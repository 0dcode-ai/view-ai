import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSprintPlan } from "@/lib/ai";
import { findOrCreateCompany } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { serializeSprintPlan } from "@/lib/serializers";
import { safeJsonParse, tagsFromJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  companyName: z.string().optional(),
  roleName: z.string().optional(),
  jobTargetId: z.number().int().positive().optional(),
  resumeProfileId: z.number().int().positive().optional(),
  interviewDate: z.string().optional(),
  days: z.number().int().min(1).max(30).default(7),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "冲刺计划参数无效。" }, { status: 400 });
  }

  const input = parsed.data;
  const [target, resume] = await Promise.all([
    input.jobTargetId
      ? prisma.jobTarget.findUnique({ where: { id: input.jobTargetId }, include: { company: true, resumeProfile: true } })
      : null,
    input.resumeProfileId ? prisma.resumeProfile.findUnique({ where: { id: input.resumeProfileId } }) : null,
  ]);
  const company = await findOrCreateCompany(input.companyName || target?.company?.name);
  const reviewCards = await prisma.reviewCard.findMany({
    where: { status: "todo" },
    orderBy: { priority: "desc" },
    take: 12,
  });
  const knowledgeCards = await prisma.knowledgeCard.findMany({
    where: company ? { OR: [{ companyId: company.id }, { companyId: null }] } : {},
    orderBy: [{ priorityScore: "desc" }, { mastery: "asc" }],
    take: 12,
  });

  const planResult = await generateSprintPlan({
    companyName: company?.name ?? target?.company?.name ?? input.companyName,
    roleName: target?.roleName ?? input.roleName,
    days: input.days,
    interviewDate: input.interviewDate,
    jobTarget: target ? safeJsonParse(target.parsedJson, null) : null,
    match: target ? safeJsonParse(target.matchJson, null) : null,
    weakTags: reviewCards.flatMap((card) => tagsFromJson(card.tagsJson)).slice(0, 8),
    knowledgeCards: knowledgeCards.map((card) => ({
      question: card.question,
      abilityDimension: card.abilityDimension,
      mastery: card.mastery,
      priorityScore: card.priorityScore,
    })),
  });

  const plan = await prisma.sprintPlan.create({
    data: {
      companyId: company?.id ?? target?.companyId,
      jobTargetId: target?.id,
      resumeProfileId: resume?.id ?? target?.resumeProfileId,
      title: planResult.title,
      targetRole: target?.roleName ?? input.roleName ?? null,
      interviewDate: input.interviewDate ? new Date(input.interviewDate) : null,
      days: input.days,
      summary: planResult.summary,
      tasks: {
        create: planResult.tasks.map((task) => ({
          dayIndex: task.dayIndex,
          type: task.type,
          title: task.title,
          description: task.description,
          dueDate: input.interviewDate ? dueDateForTask(input.interviewDate, input.days, task.dayIndex) : null,
        })),
      },
    },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      tasks: true,
    },
  });

  return NextResponse.json({ sprintPlan: serializeSprintPlan(plan) }, { status: 201 });
}

function dueDateForTask(interviewDate: string, days: number, dayIndex: number) {
  const end = new Date(interviewDate);
  const date = new Date(end);
  date.setDate(end.getDate() - Math.max(days - dayIndex, 0));
  return date;
}
