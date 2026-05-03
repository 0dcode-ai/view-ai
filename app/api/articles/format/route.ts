import { NextResponse } from "next/server";
import { z } from "zod";
import { formatTechnicalArticle } from "@/lib/ai";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  rawText: z.string().min(20),
  sourceUrl: z.string().optional().nullable(),
  topicHint: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "先粘贴一段完整一点的技术内容。" }, { status: 400 });
  }

  const article = await formatTechnicalArticle(parsed.data);
  return NextResponse.json({ article });
}
