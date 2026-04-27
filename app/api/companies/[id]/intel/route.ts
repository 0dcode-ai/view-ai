import { NextResponse } from "next/server";
import { readinessScore } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { serializeExperienceReport, serializeKnowledgeCard } from "@/lib/serializers";
import { safeJsonParse } from "@/lib/tags";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const companyId = Number(id);

  if (!Number.isInteger(companyId)) {
    return NextResponse.json({ error: "公司 ID 无效。" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: "公司不存在。" }, { status: 404 });
  }

  const [reports, knowledgeCards, sessions, reviewCards, jobTargets] = await Promise.all([
    prisma.experienceReport.findMany({
      where: { companyId },
      include: { company: true, rounds: true },
      orderBy: [{ interviewDate: "desc" }, { updatedAt: "desc" }],
      take: 20,
    }),
    prisma.knowledgeCard.findMany({
      where: { companyId },
      include: { company: true, topic: true },
      orderBy: [{ priorityScore: "desc" }, { mastery: "asc" }],
      take: 20,
    }),
    prisma.interviewSession.findMany({ where: { targetCompanyId: companyId } }),
    prisma.reviewCard.findMany({ where: { session: { targetCompanyId: companyId } } }),
    prisma.jobTarget.findMany({ where: { companyId }, orderBy: { updatedAt: "desc" }, take: 8 }),
  ]);

  const roundDistribution = new Map<string, number>();
  const questionFrequency = new Map<string, { count: number; roundType: string }>();

  reports.forEach((report) => {
    report.rounds.forEach((round) => {
      roundDistribution.set(round.roundType, (roundDistribution.get(round.roundType) ?? 0) + 1);
      safeJsonParse<string[]>(round.questionsJson, []).forEach((question) => {
        const clean = question.trim();
        if (!clean) {
          return;
        }
        const current = questionFrequency.get(clean);
        questionFrequency.set(clean, { count: (current?.count ?? 0) + 1, roundType: current?.roundType ?? round.roundType });
      });
    });
  });

  const latestTarget = jobTargets[0];
  const latestMatch = latestTarget
    ? safeJsonParse<{ matchScore?: number }>(latestTarget.matchJson, {})
    : {};
  const readiness = readinessScore({
    jdMatchScore: latestMatch.matchScore,
    knowledgeTotal: knowledgeCards.length,
    masteredKnowledge: knowledgeCards.filter((card) => card.mastery >= 3).length,
    finishedSessions: sessions.filter((session) => session.status === "finished").length,
    todoReviews: reviewCards.filter((card) => card.status === "todo").length,
    totalReviews: reviewCards.length,
  });

  const experienceCoverage = Math.min(100, reports.length * 20);
  const overall = Math.round(readiness.overall * 0.82 + experienceCoverage * 0.18);

  return NextResponse.json({
    company: { id: company.id, name: company.name },
    readiness: { ...readiness, experience: experienceCoverage, overall },
    reports: reports.map(serializeExperienceReport),
    knowledgeCards: knowledgeCards.map(serializeKnowledgeCard),
    roundDistribution: [...roundDistribution.entries()].map(([roundType, count]) => ({ roundType, count })),
    highFrequencyQuestions: [...questionFrequency.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([question, meta]) => ({ question, count: meta.count, roundType: meta.roundType })),
    roleNames: [...new Set(reports.map((report) => report.roleName).filter(Boolean))],
    nextActions: [
      reports.length ? "从最近面经生成一次混合模拟。" : "先录入一条该公司的面经。",
      knowledgeCards.length ? "优先复习低掌握高优先级八股卡。" : "从面经生成公司题库。",
      reviewCards.some((card) => card.status === "todo") ? "清理待复盘卡。" : "完成一次公司定向模拟。",
    ],
  });
}
