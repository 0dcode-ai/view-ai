import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeSprintPlan } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const plans = await prisma.sprintPlan.findMany({
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      tasks: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ sprintPlans: plans.map(serializeSprintPlan) });
}
