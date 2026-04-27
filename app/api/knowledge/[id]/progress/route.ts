import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { serializeKnowledgeCard } from "@/lib/serializers";
import { nextReviewDate, priorityFromReview } from "@/lib/srs";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mastery: z.number().int().min(0).max(4).optional(),
  reviewDelta: z.number().int().optional(),
  mistakeDelta: z.number().int().optional(),
  priorityScore: z.number().int().min(0).max(100).optional(),
  nextReviewAt: z.string().datetime().nullable().optional(),
  markReviewed: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const cardId = Number(id);
  const parsed = bodySchema.safeParse(await request.json());

  if (!Number.isInteger(cardId) || !parsed.success) {
    return NextResponse.json({ error: "学习卡更新参数无效。" }, { status: 400 });
  }

  const current = await prisma.knowledgeCard.findUnique({ where: { id: cardId } });
  if (!current) {
    return NextResponse.json({ error: "学习卡不存在。" }, { status: 404 });
  }

  const input = parsed.data;
  const nextMastery = input.mastery ?? current.mastery;
  const nextReviewCount = current.reviewCount + (input.reviewDelta ?? (input.markReviewed ? 1 : 0));
  const nextMistakeCount = Math.max(0, current.mistakeCount + (input.mistakeDelta ?? 0));
  const card = await prisma.knowledgeCard.update({
    where: { id: cardId },
    data: {
      mastery: nextMastery,
      reviewCount: nextReviewCount,
      mistakeCount: nextMistakeCount,
      priorityScore:
        input.priorityScore ??
        priorityFromReview({
          priorityScore: current.priorityScore,
          mastery: nextMastery,
          markReviewed: input.markReviewed,
          mistakeDelta: input.mistakeDelta,
        }),
      lastReviewedAt: input.markReviewed ? new Date() : current.lastReviewedAt,
      nextReviewAt:
        input.nextReviewAt === null
          ? null
          : input.nextReviewAt
            ? new Date(input.nextReviewAt)
            : input.markReviewed
              ? nextReviewDate({ mastery: nextMastery, reviewCount: nextReviewCount, mistakeCount: nextMistakeCount })
              : current.nextReviewAt,
    },
    include: { company: true, topic: true },
  });

  return NextResponse.json({ card: serializeKnowledgeCard(card) });
}
