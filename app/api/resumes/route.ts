import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeResumeProfile } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const resumes = await prisma.resumeProfile.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ resumes: resumes.map(serializeResumeProfile) });
}
