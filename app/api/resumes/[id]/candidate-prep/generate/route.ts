import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/tags";
import { runCandidatePrepAgent } from "@/lib/candidate-prep-agent";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  jobTargetId: z.number().int().positive().optional(),
});

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const resumeId = parseId(rawId);
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));

  if (!resumeId || !parsed.success) {
    return NextResponse.json({ error: "候选人准备参数无效。" }, { status: 400 });
  }

  const resume = await prisma.resumeProfile.findUnique({ where: { id: resumeId } });
  if (!resume) {
    return NextResponse.json({ error: "简历不存在。" }, { status: 404 });
  }

  const jobTarget = parsed.data.jobTargetId
    ? await prisma.jobTarget.findUnique({ where: { id: parsed.data.jobTargetId } })
    : null;

  const payload = await runCandidatePrepAgent({
    resume: {
      rawText: resume.rawText,
      parsed: safeJsonParse(resume.parsedJson, {
        summary: "",
        skills: [],
        experiences: [],
        projects: [],
        followUpQuestions: [],
      }),
    },
    jobTarget: jobTarget
      ? {
          roleName: jobTarget.roleName,
          parsed: safeJsonParse(jobTarget.parsedJson, {
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
  });

  await prisma.resumeProfile.update({
    where: { id: resume.id },
    data: {
      candidatePrepJson: JSON.stringify(payload.prep),
    },
  });

  return NextResponse.json(payload);
}
