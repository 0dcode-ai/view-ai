import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { articleDataFromInput, serializeTechnicalArticle } from "@/lib/technical-articles";
import { normalizeTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  topic: z.string().optional().nullable(),
  tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  contentMarkdown: z.string().optional().nullable(),
  contentHtml: z.string().optional().nullable(),
  contentText: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  assetIds: z.array(z.number().int().positive()).optional(),
});

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "文章 ID 无效。" }, { status: 400 });
  }

  const article = await prisma.technicalArticle.findUnique({
    where: { id },
    include: { assets: true },
  });
  if (!article) {
    return NextResponse.json({ error: "文章不存在。" }, { status: 404 });
  }

  return NextResponse.json({ article: serializeTechnicalArticle(article) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  const parsed = updateSchema.safeParse(await request.json());

  if (!id || !parsed.success) {
    return NextResponse.json({ error: "文章更新参数无效。" }, { status: 400 });
  }

  const current = await prisma.technicalArticle.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "文章不存在。" }, { status: 404 });
  }

  const input = parsed.data;
  const data = articleDataFromInput({
    title: input.title ?? current.title,
    topic: input.topic === undefined ? current.topic : input.topic,
    tags: input.tags === undefined ? undefined : normalizeTags(input.tags),
    contentMarkdown: input.contentMarkdown,
    contentHtml: input.contentHtml === undefined ? current.contentHtml : input.contentHtml,
    contentText: input.contentText === undefined ? current.contentText : input.contentText,
    sourceUrl: input.sourceUrl === undefined ? current.sourceUrl : input.sourceUrl,
    summary: input.summary === undefined ? current.summary : input.summary,
    status: input.status === undefined ? current.status : input.status,
  });

  const article = await prisma.technicalArticle.update({
    where: { id },
    data: {
      ...data,
      ...(input.tags === undefined ? { tagsJson: current.tagsJson } : {}),
      ...(input.assetIds
        ? {
            assets: {
              connect: input.assetIds.map((assetId) => ({ id: assetId })),
            },
          }
        : {}),
    },
    include: { assets: true },
  });

  return NextResponse.json({ article: serializeTechnicalArticle(article) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "文章 ID 无效。" }, { status: 400 });
  }

  await prisma.technicalArticle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
