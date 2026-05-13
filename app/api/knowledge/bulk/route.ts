import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrCreateCompany, findOrCreateTopic } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { serializeKnowledgeCard } from "@/lib/serializers";
import { normalizeTags, tagsToJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const cardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  companyName: z.string().optional(),
  topicName: z.string().optional(),
  roleDirection: z.string().optional(),
  questionType: z.string().optional(),
  abilityDimension: z.string().optional(),
  mastery: z.number().int().min(0).max(4).optional(),
  priorityScore: z.number().int().min(0).max(100).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  source: z.string().optional(),
  note: z.string().optional(),
});

const bodySchema = z.object({
  cards: z.array(cardSchema).min(1).max(50),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请选择至少一张可保存的八股卡。" }, { status: 400 });
  }

  const created = [];
  for (const input of parsed.data.cards) {
    const [company, topic] = await Promise.all([
      findOrCreateCompany(input.companyName),
      findOrCreateTopic(input.topicName),
    ]);
    const card = await prisma.knowledgeCard.create({
      data: {
        question: input.question.trim(),
        answer: input.answer.trim(),
        companyId: company?.id,
        topicId: topic?.id,
        roleDirection: input.roleDirection?.trim() || null,
        questionType: input.questionType?.trim() || "八股",
        abilityDimension: input.abilityDimension?.trim() || "基础知识",
        mastery: input.mastery ?? 0,
        priorityScore: input.priorityScore ?? 60,
        tagsJson: tagsToJson(normalizeTags(input.tags)),
        difficulty: input.difficulty,
        source: input.source?.trim() || null,
        note: input.note?.trim() || null,
      },
      include: { company: true, topic: true },
    });
    created.push(card);
  }

  return NextResponse.json({ created: created.map(serializeKnowledgeCard) }, { status: 201 });
}
