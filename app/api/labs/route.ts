import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeLabSession } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = await prisma.labSession.findMany({
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ labSessions: sessions.map(serializeLabSession) });
}
