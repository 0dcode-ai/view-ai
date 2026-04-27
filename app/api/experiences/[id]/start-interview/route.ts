import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeInterviewSession } from "@/lib/serializers";
import { safeJsonParse } from "@/lib/tags";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const reportId = Number(id);

  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ error: "面经 ID 无效。" }, { status: 400 });
  }

  const report = await prisma.experienceReport.findUnique({
    where: { id: reportId },
    include: { company: true, rounds: true },
  });

  if (!report) {
    return NextResponse.json({ error: "面经不存在。" }, { status: 404 });
  }

  const sortedRounds = report.rounds.sort((a, b) => a.order - b.order);
  const firstRound = sortedRounds[0];
  const firstQuestion =
    safeJsonParse<string[]>(firstRound?.questionsJson ?? "[]", [])[0] ??
    `请按 ${report.company?.name ?? "目标公司"} ${report.roleName} 的面经，讲一个最匹配的项目案例。`;

  const session = await prisma.interviewSession.create({
    data: {
      mode: "mixed",
      roundType: mapRoundType(firstRound?.roundType),
      deliveryMode: "text",
      targetRole: report.roleName,
      targetCompanyId: report.companyId,
      turns: {
        create: {
          order: 1,
          question: firstQuestion,
          questionSource: "company",
        },
      },
    },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: true,
    },
  });

  return NextResponse.json({ session: serializeInterviewSession(session) }, { status: 201 });
}

function mapRoundType(roundType?: string | null) {
  const lower = (roundType ?? "").toLowerCase();
  if (lower.includes("hr")) {
    return "hr_round";
  }
  if (lower.includes("主管")) {
    return "manager_round";
  }
  if (lower.includes("系统") || lower.includes("system")) {
    return "system_design";
  }
  if (lower.includes("二") || lower.includes("2")) {
    return "second_round";
  }
  return "first_round";
}
