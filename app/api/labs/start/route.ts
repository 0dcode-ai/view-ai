import { NextResponse } from "next/server";
import { z } from "zod";
import { createLabTemplate, type LabType } from "@/lib/labs";
import { prisma } from "@/lib/db";
import { serializeLabSession } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  type: z.enum(["coding", "system_design", "peer_mock"]),
  roleDirection: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请选择有效的实验室类型。" }, { status: 400 });
  }

  const template = createLabTemplate(parsed.data.type as LabType, parsed.data.roleDirection);
  const session = await prisma.labSession.create({
    data: {
      type: template.type,
      roleDirection: parsed.data.roleDirection?.trim() || null,
      title: template.title,
      prompt: template.prompt,
      starterCode: template.starterCode,
      content: template.starterCode ?? "",
    },
  });

  return NextResponse.json({ labSession: serializeLabSession(session) }, { status: 201 });
}
