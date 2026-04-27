import { NextResponse } from "next/server";
import { z } from "zod";
import { generateInterviewQuestion } from "@/lib/ai";
import { findOrCreateCompany } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { isInterviewMode, isRoundType } from "@/lib/interview-modes";
import { serializeInterviewSession } from "@/lib/serializers";
import { safeJsonParse, tagsFromJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.string(),
  targetCompanyName: z.string().optional(),
  targetRole: z.string().optional(),
  resumeProfileId: z.number().int().positive().optional(),
  jobTargetId: z.number().int().positive().optional(),
  roundType: z.string().default("first_round"),
  deliveryMode: z.enum(["text", "voice"]).default("text"),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success || !isInterviewMode(parsed.data.mode) || !isRoundType(parsed.data.roundType)) {
    return NextResponse.json({ error: "请选择有效的面试模式。" }, { status: 400 });
  }

  const jobTarget = parsed.data.jobTargetId
    ? await prisma.jobTarget.findUnique({
        where: { id: parsed.data.jobTargetId },
        include: { company: true, resumeProfile: true },
      })
    : null;
  const company = jobTarget?.company ?? (await findOrCreateCompany(parsed.data.targetCompanyName));
  const resumeId = parsed.data.resumeProfileId ?? jobTarget?.resumeProfileId ?? undefined;
  const resume = resumeId ? await prisma.resumeProfile.findUnique({ where: { id: resumeId } }) : null;
  const knowledgeCards = await prisma.knowledgeCard.findMany({
    where: company ? { OR: [{ companyId: company.id }, { companyId: null }] } : {},
    include: { company: true, topic: true },
    orderBy: [{ priorityScore: "desc" }, { mastery: "asc" }, { updatedAt: "desc" }],
    take: 12,
  });

  const question = await generateInterviewQuestion({
    mode: parsed.data.mode,
    roundType: parsed.data.roundType,
    targetCompany: company?.name,
    targetRole: parsed.data.targetRole || jobTarget?.roleName,
    jobTarget: jobTarget
      ? {
          ...safeJsonParse(jobTarget.parsedJson, {
            responsibilities: [],
            requiredSkills: [],
            bonusSkills: [],
            riskPoints: [],
            interviewFocus: [],
          }),
          match: safeJsonParse(jobTarget.matchJson, {
            matchScore: 0,
            strengths: [],
            gaps: [],
            projectTalkTracks: [],
          }),
        }
      : null,
    resume: resume ? safeJsonParse(resume.parsedJson, null) : null,
    knowledgeCards: knowledgeCards.map((card) => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
      company: card.company?.name,
      topic: card.topic?.name,
      tags: tagsFromJson(card.tagsJson),
      mastery: card.mastery,
      priorityScore: card.priorityScore,
      abilityDimension: card.abilityDimension,
    })),
    turns: [],
  });

  const session = await prisma.interviewSession.create({
    data: {
      mode: parsed.data.mode,
      roundType: parsed.data.roundType,
      deliveryMode: parsed.data.deliveryMode,
      targetRole: parsed.data.targetRole?.trim() || jobTarget?.roleName || null,
      targetCompanyId: company?.id,
      resumeProfileId: resume?.id,
      jobTargetId: jobTarget?.id,
      turns: {
        create: {
          order: 1,
          question: question.question,
          questionSource: question.source,
        },
      },
    },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: true,
    },
  });

  return NextResponse.json({ session: serializeInterviewSession(session) }, { status: 201 });
}
