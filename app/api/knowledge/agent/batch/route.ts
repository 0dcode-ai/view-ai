import { NextResponse } from "next/server";
import { z } from "zod";
import { runKnowledgeRecordBatchAgent } from "@/lib/knowledge-record-agent";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  rawText: z.string().optional(),
  articleId: z.number().int().positive().optional(),
  extraContext: z.string().optional().nullable(),
  maxCards: z.number().int().min(3).max(12).default(8),
}).refine((input) => Boolean(input.articleId || input.rawText?.trim()), {
  message: "必须提供文章正文或选择一篇技术文章。",
  path: ["rawText"],
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请粘贴文章正文，或选择一篇技术文章。" }, { status: 400 });
  }

  const article = parsed.data.articleId
    ? await prisma.technicalArticle.findUnique({ where: { id: parsed.data.articleId } })
    : null;
  if (parsed.data.articleId && !article) {
    return NextResponse.json({ error: "技术文章不存在。" }, { status: 404 });
  }

  const articleText = article
    ? [article.title, article.summary, article.contentText].filter(Boolean).join("\n\n")
    : "";
  const rawText = [articleText, parsed.data.rawText].filter(Boolean).join("\n\n").trim();

  const payload = await runKnowledgeRecordBatchAgent({
    rawText,
    extraContext: parsed.data.extraContext,
    maxCards: parsed.data.maxCards,
  });

  return NextResponse.json(payload);
}
