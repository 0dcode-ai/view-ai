import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeSprintPlan } from "@/lib/serializers";
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

  const questions = report.rounds
    .sort((a, b) => a.order - b.order)
    .flatMap((round) =>
      safeJsonParse<string[]>(round.questionsJson, []).map((question) => ({
        question,
        roundType: round.roundType,
      })),
    )
    .filter((item) => item.question.trim())
    .slice(0, 7);
  const now = new Date();

  const plan = await prisma.sprintPlan.create({
    data: {
      companyId: report.companyId,
      title: `${report.company?.name ?? "目标公司"} ${report.roleName} 面经训练`,
      targetRole: report.roleName,
      days: Math.max(1, questions.length || 3),
      status: "active",
      summary: "根据面经自动生成的每日训练任务，优先复述高风险题并补充项目场景。",
      tasks: {
        create: (questions.length ? questions : [{ question: report.summary ?? report.rawText.slice(0, 80), roundType: "综合" }]).map(
          (item, index) => ({
            dayIndex: index + 1,
            type: "experience",
            title: `面经复盘：${item.roundType}`,
            description: item.question,
            status: "todo",
            dueDate: new Date(now.getTime() + index * 24 * 60 * 60 * 1000),
          }),
        ),
      },
    },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      tasks: true,
    },
  });

  return NextResponse.json({ sprintPlan: serializeSprintPlan(plan) }, { status: 201 });
}
