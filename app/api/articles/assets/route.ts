import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const maxSize = 10 * 1024 * 1024;

const extensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const altText = formData.get("altText");
  const rawArticleId = formData.get("articleId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传图片文件。" }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "只支持 png、jpeg、webp、gif 图片。" }, { status: 400 });
  }
  if (file.size > maxSize) {
    return NextResponse.json({ error: "单张图片不能超过 10MB。" }, { status: 400 });
  }

  const articleId = typeof rawArticleId === "string" && rawArticleId ? Number(rawArticleId) : null;
  if (articleId && !Number.isInteger(articleId)) {
    return NextResponse.json({ error: "文章 ID 无效。" }, { status: 400 });
  }

  const now = new Date();
  const datePath = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "articles", datePath);
  await mkdir(uploadDir, { recursive: true });

  const extension = extensions[file.type] ?? "bin";
  const fileName = `${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const url = `/uploads/articles/${datePath}/${fileName}`;
  const asset = await prisma.technicalArticleAsset.create({
    data: {
      articleId,
      url,
      filePath,
      mimeType: file.type,
      size: file.size,
      altText: typeof altText === "string" ? altText : null,
    },
  });

  return NextResponse.json({
    asset: {
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
    },
  }, { status: 201 });
}
