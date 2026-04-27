import { NextResponse } from "next/server";
import { z } from "zod";
import { parseResume } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { serializeResumeProfile } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  title: z.string().optional(),
  rawText: z.string().min(20),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请粘贴完整一点的简历文本。" }, { status: 400 });
  }

  const result = await parseResume(parsed.data.rawText);
  const resume = await prisma.resumeProfile.create({
    data: {
      title: parsed.data.title?.trim() || "我的简历",
      rawText: parsed.data.rawText.trim(),
      parsedJson: JSON.stringify(result),
      followUpQuestionsJson: JSON.stringify(result.followUpQuestions),
    },
  });

  return NextResponse.json({ resume: serializeResumeProfile(resume) }, { status: 201 });
}
