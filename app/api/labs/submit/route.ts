import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { reviewLabAnswer } from "@/lib/labs";
import { serializeLabSession } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sessionId: z.number().int().positive(),
  content: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请先提交练习内容。" }, { status: 400 });
  }

  const current = await prisma.labSession.findUnique({ where: { id: parsed.data.sessionId } });
  if (!current) {
    return NextResponse.json({ error: "练习不存在。" }, { status: 404 });
  }

  const feedback = reviewLabAnswer({
    type: current.type,
    prompt: current.prompt,
    content: parsed.data.content,
  });
  const session = await prisma.labSession.update({
    where: { id: current.id },
    data: {
      content: parsed.data.content,
      feedbackJson: JSON.stringify(feedback),
      status: "reviewed",
    },
  });

  return NextResponse.json({ labSession: serializeLabSession(session) });
}
