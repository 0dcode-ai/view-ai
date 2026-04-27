import { NextResponse } from "next/server";
import { readinessScore } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import {
  serializeInterviewSession,
  serializeJobTarget,
  serializeKnowledgeCard,
  serializeReviewCard,
  serializeSprintPlan,
} from "@/lib/serializers";
import { safeJsonParse } from "@/lib/tags";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const companyId = Number(id);
  if (!Number.isInteger(companyId)) {
    return NextResponse.json({ error: "公司不存在。" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: "公司不存在。" }, { status: 404 });
  }

  const [jobTargets, knowledgeCards, sessions, reviewCards, sprintPlans] = await Promise.all([
    prisma.jobTarget.findMany({
      where: { companyId },
      include: { company: true, resumeProfile: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.knowledgeCard.findMany({
      where: { companyId },
      include: { company: true, topic: true },
      orderBy: [{ priorityScore: "desc" }, { mastery: "asc" }],
      take: 30,
    }),
    prisma.interviewSession.findMany({
      where: { targetCompanyId: companyId },
      include: {
        company: true,
        jobTarget: { include: { company: true, resumeProfile: true } },
        resumeProfile: true,
        turns: { orderBy: { order: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.reviewCard.findMany({
      where: {
        OR: [
          { knowledgeCard: { companyId } },
          { session: { targetCompanyId: companyId } },
        ],
      },
      include: {
        knowledgeCard: { include: { company: true, topic: true } },
        session: true,
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }],
      take: 20,
    }),
    prisma.sprintPlan.findMany({
      where: { companyId },
      include: {
        company: true,
        jobTarget: { include: { company: true, resumeProfile: true } },
        resumeProfile: true,
        tasks: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const bestMatch = Math.max(
    0,
    ...jobTargets.map((target) => safeJsonParse<{ matchScore?: number }>(target.matchJson, {}).matchScore ?? 0),
  );
  const readiness = readinessScore({
    jdMatchScore: bestMatch || undefined,
    knowledgeTotal: knowledgeCards.length,
    masteredKnowledge: knowledgeCards.filter((card) => card.mastery >= 3).length,
    finishedSessions: sessions.filter((session) => session.status === "finished").length,
    todoReviews: reviewCards.filter((card) => card.status === "todo").length,
    totalReviews: reviewCards.length,
  });

  return NextResponse.json({
    company: { id: company.id, name: company.name },
    readiness,
    jobTargets: jobTargets.map(serializeJobTarget),
    knowledgeCards: knowledgeCards.map(serializeKnowledgeCard),
    sessions: sessions.map(serializeInterviewSession),
    reviewCards: reviewCards.map(serializeReviewCard),
    sprintPlans: sprintPlans.map(serializeSprintPlan),
  });
}
