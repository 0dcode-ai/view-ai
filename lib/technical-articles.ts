import type { Prisma } from "@prisma/client";
import { htmlToMarkdown, markdownToHtml, markdownToText } from "@/lib/article-markdown";
import { normalizeTags, tagsFromJson, tagsToJson } from "@/lib/tags";

export type TechnicalArticleInput = {
  title: string;
  topic?: string | null;
  tags?: string[] | string | null;
  contentMarkdown?: string | null;
  contentHtml?: string | null;
  contentText?: string | null;
  sourceUrl?: string | null;
  summary?: string | null;
  status?: string | null;
  assetIds?: number[];
};

export type TechnicalArticleWithAssets = Prisma.TechnicalArticleGetPayload<{
  include: { assets: true };
}>;

export function articleDataFromInput(input: TechnicalArticleInput) {
  const markdown = input.contentMarkdown?.trim() ?? "";
  const contentHtml = markdown ? markdownToHtml(markdown) : input.contentHtml?.trim() ?? "";
  const contentText = markdown ? markdownToText(markdown) : input.contentText?.trim() || htmlToText(contentHtml);

  return {
    title: input.title.trim(),
    topic: input.topic?.trim() || null,
    tagsJson: tagsToJson(normalizeTags(input.tags)),
    contentHtml,
    contentText,
    sourceUrl: input.sourceUrl?.trim() || null,
    summary: input.summary?.trim() || null,
    status: input.status?.trim() || "published",
  };
}

export function serializeTechnicalArticle(article: TechnicalArticleWithAssets) {
  return {
    id: article.id,
    title: article.title,
    topic: article.topic,
    tags: tagsFromJson(article.tagsJson),
    contentHtml: article.contentHtml,
    contentText: article.contentText,
    sourceUrl: article.sourceUrl,
    summary: article.summary,
    status: article.status,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    assets: article.assets.map((asset) => ({
      id: asset.id,
      articleId: asset.articleId,
      url: asset.url,
      filePath: asset.filePath,
      mimeType: asset.mimeType,
      size: asset.size,
      width: asset.width,
      height: asset.height,
      altText: asset.altText,
      createdAt: asset.createdAt.toISOString(),
    })),
  };
}

export function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export { htmlToMarkdown, markdownToHtml, markdownToText };
