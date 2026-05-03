import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { serializeStartupIdea, startupIdeaDataFromInput } from "@/lib/startup-ideas";
import { tagsFromJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

const ideaSchema = z.object({
  title: z.string().trim().min(1),
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const tag = searchParams.get("tag")?.trim();

  const ideas = await prisma.startupIdea.findMany({
    where: {
      AND: [
        status ? { status } : {},
        tag ? { tagsJson: { contains: tag } } : {},
        q
          ? {
              OR: [
                { title: { contains: q } },
                { oneLiner: { contains: q } },
                { problem: { contains: q } },
                { targetUsers: { contains: q } },
                { solution: { contains: q } },
                { aiAgentFlow: { contains: q } },
                { dataSignals: { contains: q } },
                { validationPlan: { contains: q } },
                { tagsJson: { contains: q } },
              ],
            }
          : {},
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 120,
  });

  const allIdeas = await prisma.startupIdea.findMany({
    select: { tagsJson: true, status: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    ideas: ideas.map(serializeStartupIdea),
    tags: [...new Set(allIdeas.flatMap((idea) => tagsFromJson(idea.tagsJson)))],
    statuses: [...new Set(allIdeas.map((idea) => idea.status).filter(Boolean))],
  });
}

export async function POST(request: Request) {
  const parsed = ideaSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "创业想法标题不能为空。" }, { status: 400 });
  }

  const idea = await prisma.startupIdea.create({
    data: startupIdeaDataFromInput(parsed.data),
  });

  return NextResponse.json({ idea: serializeStartupIdea(idea) }, { status: 201 });
}
