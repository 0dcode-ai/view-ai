import { NextResponse } from "next/server";
import { z } from "zod";
import { suggestKnowledge } from "@/lib/ai";
import { buildKnowledgeWhere, findOrCreateCompany, findOrCreateTopic } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { serializeKnowledgeCard } from "@/lib/serializers";
import { normalizeTags, tagsFromJson, tagsToJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const createSchema = z.object({
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
  useAi: z.boolean().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const where = buildKnowledgeWhere({
    company: searchParams.get("company"),
    topic: searchParams.get("topic"),
    tag: searchParams.get("tag"),
    q: searchParams.get("q"),
    difficulty: searchParams.get("difficulty"),
    mastery: searchParams.get("mastery"),
    questionType: searchParams.get("questionType"),
    abilityDimension: searchParams.get("abilityDimension"),
    roleDirection: searchParams.get("roleDirection"),
  });

  const [cards, companies, topics] = await Promise.all([
    prisma.knowledgeCard.findMany({
      where,
      include: { company: true, topic: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.topic.findMany({ orderBy: { name: "asc" } }),
  ]);

  const tags = Array.from(
    new Set(
      cards.flatMap((card) => tagsFromJson(card.tagsJson)),
    ),
  ).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));

  return NextResponse.json({
    cards: cards.map(serializeKnowledgeCard),
    companies: companies.map((company) => ({ id: company.id, name: company.name })),
    topics: topics.map((topic) => ({ id: topic.id, name: topic.name })),
    tags,
  });
}

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "题目和答案不能为空。" }, { status: 400 });
  }

  const input = parsed.data;
  const aiSuggestion = input.useAi
    ? await suggestKnowledge({
        question: input.question,
        answer: input.answer,
        companyName: input.companyName,
        topicName: input.topicName,
        tags: input.tags,
      })
    : null;

  const company = await findOrCreateCompany(input.companyName || aiSuggestion?.companyName);
  const topic = await findOrCreateTopic(input.topicName || aiSuggestion?.topicName);
  const tags = normalizeTags(input.tags).length ? normalizeTags(input.tags) : normalizeTags(aiSuggestion?.tags);

  const card = await prisma.knowledgeCard.create({
    data: {
      question: input.question.trim(),
      answer: input.answer.trim(),
      companyId: company?.id,
      topicId: topic?.id,
      roleDirection: input.roleDirection?.trim() || null,
      questionType: input.questionType?.trim() || aiSuggestion?.questionType || "technical",
      abilityDimension: input.abilityDimension?.trim() || aiSuggestion?.abilityDimension || "基础知识",
      mastery: input.mastery ?? aiSuggestion?.masterySuggestion ?? 0,
      priorityScore: input.priorityScore ?? aiSuggestion?.priorityScore ?? 50,
      tagsJson: tagsToJson(tags),
      difficulty: input.difficulty,
      source: input.source?.trim() || null,
      note: input.note?.trim() || aiSuggestion?.note || null,
    },
    include: { company: true, topic: true },
  });

  return NextResponse.json({ card: serializeKnowledgeCard(card), aiSuggestion }, { status: 201 });
}
