import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findOrCreateCompany, findOrCreateTopic } from "@/lib/db-helpers";
import { loadInterviewInternalReferenceQuestions } from "@/lib/interview-internal-reference";
import { seedQuestions } from "@/lib/question-bank";
import { tagsToJson } from "@/lib/tags";

export const dynamic = "force-dynamic";

export async function POST() {
  let created = 0;
  let skipped = 0;
  const questions = [...seedQuestions, ...(await loadInterviewInternalReferenceQuestions())];

  for (const item of questions) {
    const existing = await prisma.knowledgeCard.findFirst({
      where: { question: item.question },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    const company = await findOrCreateCompany(item.companyName);
    const topic = await findOrCreateTopic(item.topicName);
    await prisma.knowledgeCard.create({
      data: {
        question: item.question,
        answer: item.answer,
        companyId: company?.id,
        topicId: topic?.id,
        roleDirection: item.roleDirection,
        questionType: item.questionType,
        abilityDimension: item.abilityDimension,
        tagsJson: tagsToJson(item.tags),
        difficulty: item.difficulty,
        priorityScore: item.priorityScore,
        source: item.source ?? "内置冷启动题库",
        note: item.note ?? "可按自己的面经继续补充答案。",
      },
    });
    created += 1;
  }

  const total = await prisma.knowledgeCard.count();
  return NextResponse.json({ created, skipped, total, sourceCount: questions.length });
}
