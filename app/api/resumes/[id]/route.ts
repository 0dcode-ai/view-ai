import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { serializeResumeProfile } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
});

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  const parsed = updateSchema.safeParse(await request.json());

  if (!id || !parsed.success) {
    return NextResponse.json({ error: "简历更新参数无效。" }, { status: 400 });
  }

  const resume = await prisma.resumeProfile.update({
    where: { id },
    data: { title: parsed.data.title?.trim() },
  });

  return NextResponse.json({ resume: serializeResumeProfile(resume) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "简历 ID 无效。" }, { status: 400 });
  }

  await prisma.resumeProfile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
