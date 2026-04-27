import { NextResponse } from "next/server";
import { findOrCreateTopic } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { serializeKnowledgeCard } from "@/lib/serializers";
import { safeJsonParse, tagsFromJson, tagsToJson } from "@/lib/tags";

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

  const topic = await findOrCreateTopic(report.company?.name ? `${report.company.name} 面经` : "公司面经");
  const created = [];

  for (const round of report.rounds.sort((a, b) => a.order - b.order)) {
    const questions = safeJsonParse<string[]>(round.questionsJson, []);
    const focusAreas = tagsFromJson(round.focusAreasJson);

    for (const question of questions.slice(0, 5)) {
      const cleanQuestion = question.trim();
      if (!cleanQuestion) {
        continue;
      }

      const existing = await prisma.knowledgeCard.findFirst({
        where: {
          question: cleanQuestion,
          companyId: report.companyId,
        },
        include: { company: true, topic: true },
      });

      if (existing) {
        continue;
      }

      const card = await prisma.knowledgeCard.create({
        data: {
          question: cleanQuestion,
          answer: "待补充：根据面经回流的问题，请补充参考答案、项目场景和追问展开。",
          companyId: report.companyId,
          topicId: topic?.id,
          roleDirection: report.roleName,
          questionType: round.roundType.includes("系统") ? "系统设计" : round.roundType.toLowerCase().includes("coding") ? "代码题" : "面经题",
          abilityDimension: round.roundType.includes("HR") ? "动机匹配" : round.roundType.includes("系统") ? "架构设计" : "面试准备",
          mastery: 0,
          priorityScore: report.verified || report.confidence === "high" ? 88 : 78,
          tagsJson: tagsToJson([report.company?.name ?? "", report.roleName, round.roundType, ...focusAreas, "面经回流"]),
          difficulty: report.difficulty,
          source: "面经生成",
          note: `来自面经：${report.summary ?? report.roleName}`,
        },
        include: { company: true, topic: true },
      });
      created.push(card);
    }
  }

  return NextResponse.json({ created: created.map(serializeKnowledgeCard) }, { status: 201 });
}
