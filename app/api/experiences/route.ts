import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrCreateCompany } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { serializeExperienceReport } from "@/lib/serializers";
import { normalizeTags, tagsToJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const roundSchema = z.object({
  order: z.number().int().positive(),
  roundType: z.string().min(1),
  durationMinutes: z.number().int().positive().nullable().optional(),
  interviewerStyle: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
  questions: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const createSchema = z.object({
  companyName: z.string().optional(),
  roleName: z.string().min(1),
  level: z.string().optional(),
  location: z.string().optional(),
  interviewDate: z.string().optional(),
  result: z.string().default("unknown"),
  difficulty: z.string().default("medium"),
  sourceType: z.string().default("self"),
  confidence: z.string().default("medium"),
  verified: z.boolean().default(false),
  durationMinutes: z.number().int().positive().nullable().optional(),
  rawText: z.string().min(20),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rounds: z.array(roundSchema).default([]),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const company = searchParams.get("company")?.trim();
  const role = searchParams.get("role")?.trim();
  const roundType = searchParams.get("roundType")?.trim();
  const confidence = searchParams.get("confidence")?.trim();

  const reports = await prisma.experienceReport.findMany({
    where: {
      AND: [
        company ? { company: { is: { name: { contains: company } } } } : {},
        role ? { roleName: { contains: role } } : {},
        confidence ? { confidence } : {},
        q ? { OR: [{ rawText: { contains: q } }, { summary: { contains: q } }, { tagsJson: { contains: q } }] } : {},
        roundType ? { rounds: { some: { roundType: { contains: roundType } } } } : {},
      ],
    },
    include: { company: true, rounds: true },
    orderBy: [{ interviewDate: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ experiences: reports.map(serializeExperienceReport) });
}

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "面经保存参数无效。" }, { status: 400 });
  }

  const input = parsed.data;
  const company = await findOrCreateCompany(input.companyName);
  const interviewDate = input.interviewDate ? new Date(input.interviewDate) : null;
  const report = await prisma.experienceReport.create({
    data: {
      companyId: company?.id,
      roleName: input.roleName.trim(),
      level: input.level?.trim() || null,
      location: input.location?.trim() || null,
      interviewDate: interviewDate && !Number.isNaN(interviewDate.getTime()) ? interviewDate : null,
      result: input.result,
      difficulty: input.difficulty,
      sourceType: input.sourceType,
      confidence: input.confidence,
      verified: input.verified,
      durationMinutes: input.durationMinutes ?? null,
      rawText: input.rawText.trim(),
      summary: input.summary?.trim() || null,
      tagsJson: tagsToJson(normalizeTags(input.tags)),
      rounds: {
        create: input.rounds.map((round, index) => ({
          order: round.order || index + 1,
          roundType: round.roundType.trim(),
          durationMinutes: round.durationMinutes ?? null,
          interviewerStyle: round.interviewerStyle?.trim() || null,
          focusAreasJson: tagsToJson(normalizeTags(round.focusAreas)),
          questionsJson: JSON.stringify((round.questions ?? []).filter(Boolean)),
          notes: round.notes?.trim() || null,
        })),
      },
    },
    include: { company: true, rounds: true },
  });

  return NextResponse.json({ experience: serializeExperienceReport(report) }, { status: 201 });
}
