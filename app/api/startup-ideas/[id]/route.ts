import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { serializeStartupIdea, startupIdeaDataFromInput } from "@/lib/startup-ideas";
import { tagsFromJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const ideaSchema = z.object({
  title: z.string().trim().min(1).optional(),
  oneLiner: z.string().optional().nullable(),
  problem: z.string().optional().nullable(),
  targetUsers: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  aiAgentFlow: z.string().optional().nullable(),
  dataSignals: z.string().optional().nullable(),
  monetization: z.string().optional().nullable(),
  validationPlan: z.string().optional().nullable(),
  risks: z.string().optional().nullable(),
  tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  status: z.string().optional().nullable(),
});

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "创业想法 ID 无效。" }, { status: 400 });
  }

  const idea = await prisma.startupIdea.findUnique({ where: { id } });
  if (!idea) {
    return NextResponse.json({ error: "创业想法不存在。" }, { status: 404 });
  }

  return NextResponse.json({ idea: serializeStartupIdea(idea) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  const parsed = ideaSchema.safeParse(await request.json());

  if (!id || !parsed.success) {
    return NextResponse.json({ error: "创业想法更新参数无效。" }, { status: 400 });
  }

  const current = await prisma.startupIdea.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "创业想法不存在。" }, { status: 404 });
  }

  const input = parsed.data;
  const idea = await prisma.startupIdea.update({
    where: { id },
    data: {
      ...startupIdeaDataFromInput({
        title: input.title ?? current.title,
        oneLiner: input.oneLiner === undefined ? current.oneLiner : input.oneLiner,
        problem: input.problem === undefined ? current.problem : input.problem,
        targetUsers: input.targetUsers === undefined ? current.targetUsers : input.targetUsers,
        solution: input.solution === undefined ? current.solution : input.solution,
        aiAgentFlow: input.aiAgentFlow === undefined ? current.aiAgentFlow : input.aiAgentFlow,
        dataSignals: input.dataSignals === undefined ? current.dataSignals : input.dataSignals,
        monetization: input.monetization === undefined ? current.monetization : input.monetization,
        validationPlan: input.validationPlan === undefined ? current.validationPlan : input.validationPlan,
        risks: input.risks === undefined ? current.risks : input.risks,
        tags: input.tags === undefined ? tagsFromJson(current.tagsJson) : input.tags,
        status: input.status === undefined ? current.status : input.status,
      }),
    },
  });

  return NextResponse.json({ idea: serializeStartupIdea(idea) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "创业想法 ID 无效。" }, { status: 400 });
  }

  const current = await prisma.startupIdea.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "创业想法不存在。" }, { status: 404 });
  }

  await prisma.startupIdea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
