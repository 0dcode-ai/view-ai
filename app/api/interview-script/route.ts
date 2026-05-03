import { NextResponse } from "next/server";
import { z } from "zod";
import { generateInterviewScript } from "@/lib/ai";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  resumeText: z.string().min(20),
  direction: z.string().min(1),
  roleName: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questionCount: z.number().int().min(3).max(12).default(6),
  focus: z.string().optional(),
  seniority: z.enum(["junior", "mid", "senior", "staff"]).optional(),
  salaryK: z.number().int().min(0).max(200).optional(),
  difficultySource: z.string().optional(),
  candidatePrep: z.any().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请贴入简历，并选择面试方向。" }, { status: 400 });
  }

  const script = await generateInterviewScript(parsed.data);
  return NextResponse.json({ script });
}
