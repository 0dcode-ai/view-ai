import { NextResponse } from "next/server";
import { z } from "zod";
import { runStartupIdeaAgent } from "@/lib/startup-idea-agent";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  rawIdea: z.string().trim().min(8),
  extraContext: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "先输入一句完整一点的创业想法。" }, { status: 400 });
  }

  const payload = await runStartupIdeaAgent(parsed.data);
  return NextResponse.json(payload);
}
