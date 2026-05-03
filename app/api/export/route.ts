import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  serializeExperienceReport,
  serializeInterviewSession,
  serializeJobTarget,
  serializeKnowledgeCard,
  serializeLabSession,
  serializeResumeProfile,
  serializeReviewCard,
  serializeSprintPlan,
} from "@/lib/serializers";
import { serializeTechnicalArticle } from "@/lib/technical-articles";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    companies,
    topics,
    knowledgeCards,
    resumes,
    jobTargets,
    interviews,
    reviewCards,
    sprintPlans,
    labs,
    experiences,
    technicalArticles,
  ] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.topic.findMany({ orderBy: { name: "asc" } }),
    prisma.knowledgeCard.findMany({
      include: { company: true, topic: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.resumeProfile.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.jobTarget.findMany({
      include: { company: true, resumeProfile: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.interviewSession.findMany({
      include: {
        company: true,
        jobTarget: { include: { company: true, resumeProfile: true } },
        resumeProfile: true,
        turns: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.reviewCard.findMany({
      include: {
        knowledgeCard: { include: { company: true, topic: true } },
        session: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.sprintPlan.findMany({
      include: {
        company: true,
        jobTarget: { include: { company: true, resumeProfile: true } },
        resumeProfile: true,
        tasks: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.labSession.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.experienceReport.findMany({
      include: { company: true, rounds: true },
      orderBy: [{ interviewDate: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.technicalArticle.findMany({
      include: { assets: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    version: 1,
    counts: {
      companies: companies.length,
      topics: topics.length,
      knowledgeCards: knowledgeCards.length,
      resumes: resumes.length,
      jobTargets: jobTargets.length,
      interviews: interviews.length,
      reviewCards: reviewCards.length,
      sprintPlans: sprintPlans.length,
      labs: labs.length,
      experiences: experiences.length,
      technicalArticles: technicalArticles.length,
    },
    companies: companies.map((company) => ({
      id: company.id,
      name: company.name,
      note: company.note,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    })),
    topics: topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
    })),
    knowledgeCards: knowledgeCards.map(serializeKnowledgeCard),
    resumes: resumes.map(serializeResumeProfile),
    jobTargets: jobTargets.map(serializeJobTarget),
    interviews: interviews.map(serializeInterviewSession),
    reviewCards: reviewCards.map(serializeReviewCard),
    sprintPlans: sprintPlans.map(serializeSprintPlan),
    labs: labs.map(serializeLabSession),
    experiences: experiences.map(serializeExperienceReport),
    technicalArticles: technicalArticles.map(serializeTechnicalArticle),
  });
}
