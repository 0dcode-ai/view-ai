import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeJobTarget } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const targets = await prisma.jobTarget.findMany({
    include: { company: true, resumeProfile: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ jobTargets: targets.map(serializeJobTarget) });
}
