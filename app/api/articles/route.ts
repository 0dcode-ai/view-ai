import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { articleDataFromInput, serializeTechnicalArticle } from "@/lib/technical-articles";
import { normalizeTags, tagsFromJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1),
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const topic = searchParams.get("topic")?.trim();
  const tag = searchParams.get("tag")?.trim();

  const articles = await prisma.technicalArticle.findMany({
    where: {
      AND: [
        topic ? { topic } : {},
        tag ? { tagsJson: { contains: tag } } : {},
        q
          ? {
              OR: [
                { title: { contains: q } },
                { topic: { contains: q } },
                { tagsJson: { contains: q } },
                { summary: { contains: q } },
                { contentText: { contains: q } },
              ],
            }
          : {},
      ],
    },
    include: { assets: true },
    orderBy: { updatedAt: "desc" },
    take: 120,
  });

  const allArticles = await prisma.technicalArticle.findMany({
    select: { topic: true, tagsJson: true },
    orderBy: { updatedAt: "desc" },
  });
  const topics = [...new Set(allArticles.map((article) => article.topic).filter((value): value is string => Boolean(value)))];
  const tags = [...new Set(allArticles.flatMap((article) => tagsFromJson(article.tagsJson)))];

  return NextResponse.json({
    articles: articles.map(serializeTechnicalArticle),
    topics,
    tags,
  });
}

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "文章标题不能为空。" }, { status: 400 });
  }

  const input = parsed.data;
  const article = await prisma.technicalArticle.create({
    data: {
      ...articleDataFromInput({ ...input, tags: normalizeTags(input.tags) }),
      assets: input.assetIds?.length
        ? {
            connect: input.assetIds.map((id) => ({ id })),
          }
        : undefined,
    },
    include: { assets: true },
  });

  return NextResponse.json({ article: serializeTechnicalArticle(article) }, { status: 201 });
}
