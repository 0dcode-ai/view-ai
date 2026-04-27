import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeInterviewSession } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = await prisma.interviewSession.findMany({
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: { orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ sessions: sessions.map(serializeInterviewSession) });
}
