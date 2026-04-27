import { NextResponse } from "next/server";
import { z } from "zod";
import { matchResumeToJob, parseJobTarget } from "@/lib/ai";
import { findOrCreateCompany } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { serializeJobTarget } from "@/lib/serializers";
import { safeJsonParse } from "@/lib/tags";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  companyName: z.string().optional(),
  roleName: z.string().min(1),
  rawJd: z.string().min(20),
  resumeProfileId: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请填写岗位名称和完整 JD。" }, { status: 400 });
  }

  const input = parsed.data;
  const [company, resume] = await Promise.all([
    findOrCreateCompany(input.companyName),
    input.resumeProfileId ? prisma.resumeProfile.findUnique({ where: { id: input.resumeProfileId } }) : null,
  ]);
  const jdParsed = await parseJobTarget(input);
  const resumeParsed = resume ? safeJsonParse(resume.parsedJson, null) : null;
  const match = await matchResumeToJob(resumeParsed, jdParsed);

  const target = await prisma.jobTarget.create({
    data: {
      companyId: company?.id,
      resumeProfileId: resume?.id,
      roleName: input.roleName.trim(),
      rawJd: input.rawJd.trim(),
      parsedJson: JSON.stringify(jdParsed),
      matchJson: JSON.stringify(match),
    },
    include: { company: true, resumeProfile: true },
  });

  return NextResponse.json({ jobTarget: serializeJobTarget(target) }, { status: 201 });
}
