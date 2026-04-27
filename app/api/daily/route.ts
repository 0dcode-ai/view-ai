import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeKnowledgeCard, serializeReviewCard, serializeSprintTask } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [dueCards, reviewCards, sprintTasks] = await Promise.all([
    prisma.knowledgeCard.findMany({
      where: {
        OR: [{ nextReviewAt: { lte: endOfToday } }, { nextReviewAt: null, mastery: { lt: 3 } }],
      },
      include: { company: true, topic: true },
      orderBy: [{ nextReviewAt: "asc" }, { priorityScore: "desc" }, { mastery: "asc" }],
      take: 6,
    }),
    prisma.reviewCard.findMany({
      where: { status: "todo" },
      include: {
        knowledgeCard: { include: { company: true, topic: true } },
        session: true,
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 6,
    }),
    prisma.sprintTask.findMany({
      where: {
        status: { not: "done" },
        OR: [{ dueDate: { lte: endOfToday } }, { dueDate: null }],
      },
      orderBy: [{ dueDate: "asc" }, { dayIndex: "asc" }, { updatedAt: "desc" }],
      take: 6,
    }),
  ]);

  return NextResponse.json({
    summary: {
      dueKnowledge: dueCards.length,
      todoReview: reviewCards.length,
      sprintTasks: sprintTasks.length,
      total: dueCards.length + reviewCards.length + sprintTasks.length,
    },
    dueCards: dueCards.map(serializeKnowledgeCard),
    reviewCards: reviewCards.map(serializeReviewCard),
    sprintTasks: sprintTasks.map(serializeSprintTask),
  });
}
