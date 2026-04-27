import { NextResponse } from "next/server";
import { z } from "zod";
import { suggestKnowledge } from "@/lib/ai";
import { normalizeTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  question: z.string().min(1),
  answer: z.string().default(""),
  companyName: z.string().optional(),
  topicName: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请至少填写题目。" }, { status: 400 });
  }

  const suggestion = await suggestKnowledge({
    ...parsed.data,
    tags: normalizeTags(parsed.data.tags),
  });

  return NextResponse.json({ suggestion });
}
