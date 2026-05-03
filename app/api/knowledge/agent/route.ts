import { NextResponse } from "next/server";
import { z } from "zod";
import { runKnowledgeRecordAgent } from "@/lib/knowledge-record-agent";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  rawText: z.string().trim().min(12),
  extraContext: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "先贴一段完整一点的八股文或技术摘录。" }, { status: 400 });
  }

  const payload = await runKnowledgeRecordAgent(parsed.data);
  return NextResponse.json(payload);
}
