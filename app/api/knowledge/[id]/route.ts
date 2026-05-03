import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrCreateCompany, findOrCreateTopic } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { serializeKnowledgeCard } from "@/lib/serializers";
import { normalizeTags, tagsToJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  companyName: z.string().nullable().optional(),
  topicName: z.string().nullable().optional(),
  roleDirection: z.string().nullable().optional(),
  questionType: z.string().optional(),
  abilityDimension: z.string().optional(),
  mastery: z.number().int().min(0).max(4).optional(),
  priorityScore: z.number().int().min(0).max(100).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  source: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  const parsed = updateSchema.safeParse(await request.json());

  if (!id || !parsed.success) {
    return NextResponse.json({ error: "学习卡更新参数无效。" }, { status: 400 });
  }

  const input = parsed.data;
  const [company, topic] = await Promise.all([
    input.companyName === undefined ? undefined : findOrCreateCompany(input.companyName ?? undefined),
    input.topicName === undefined ? undefined : findOrCreateTopic(input.topicName ?? undefined),
  ]);

  const card = await prisma.knowledgeCard.update({
    where: { id },
    data: {
      ...(input.question !== undefined ? { question: input.question.trim() } : {}),
      ...(input.answer !== undefined ? { answer: input.answer.trim() } : {}),
      ...(input.companyName !== undefined ? { companyId: company?.id ?? null } : {}),
      ...(input.topicName !== undefined ? { topicId: topic?.id ?? null } : {}),
      ...(input.roleDirection !== undefined ? { roleDirection: input.roleDirection?.trim() || null } : {}),
      ...(input.questionType !== undefined ? { questionType: input.questionType.trim() || "technical" } : {}),
      ...(input.abilityDimension !== undefined ? { abilityDimension: input.abilityDimension.trim() || "基础知识" } : {}),
      ...(input.mastery !== undefined ? { mastery: input.mastery } : {}),
      ...(input.priorityScore !== undefined ? { priorityScore: input.priorityScore } : {}),
      ...(input.tags !== undefined ? { tagsJson: tagsToJson(normalizeTags(input.tags)) } : {}),
      ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
      ...(input.source !== undefined ? { source: input.source?.trim() || null } : {}),
      ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
    },
    include: { company: true, topic: true },
  });

  return NextResponse.json({ card: serializeKnowledgeCard(card) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "学习卡 ID 无效。" }, { status: 400 });
  }

  await prisma.knowledgeCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
