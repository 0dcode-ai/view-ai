import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeReviewCard } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company");
  const topic = searchParams.get("topic");
  const roundType = searchParams.get("roundType");
  const status = searchParams.get("status");
  const reviewCards = await prisma.reviewCard.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(company
        ? {
            OR: [
              { knowledgeCard: { company: { name: { contains: company } } } },
              { session: { company: { name: { contains: company } } } },
            ],
          }
        : {}),
      ...(topic ? { knowledgeCard: { topic: { name: { contains: topic } } } } : {}),
      ...(roundType ? { session: { roundType } } : {}),
    },
    include: {
      knowledgeCard: { include: { company: true, topic: true } },
      session: true,
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
    take: 80,
  });

  return NextResponse.json({ reviewCards: reviewCards.map(serializeReviewCard) });
}
