import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function findOrCreateCompany(name: string | null | undefined) {
  const cleanName = name?.trim();
  if (!cleanName) {
    return null;
  }

  return prisma.company.upsert({
    where: { name: cleanName },
    update: {},
    create: { name: cleanName },
  });
}

export async function findOrCreateTopic(name: string | null | undefined) {
  const cleanName = name?.trim();
  if (!cleanName) {
    return null;
  }

  return prisma.topic.upsert({
    where: { name: cleanName },
    update: {},
    create: { name: cleanName },
  });
}

export function buildKnowledgeWhere(filters: {
  company?: string | null;
  topic?: string | null;
  tag?: string | null;
  q?: string | null;
  difficulty?: string | null;
  mastery?: string | null;
  questionType?: string | null;
  abilityDimension?: string | null;
  roleDirection?: string | null;
}): Prisma.KnowledgeCardWhereInput {
  const AND: Prisma.KnowledgeCardWhereInput[] = [];

  if (filters.company?.trim()) {
    AND.push({
      company: {
        is: {
          name: { contains: filters.company.trim() },
        },
      },
    });
  }

  if (filters.topic?.trim()) {
    AND.push({
      topic: {
        is: {
          name: { contains: filters.topic.trim() },
        },
      },
    });
  }

  if (filters.tag?.trim()) {
    AND.push({
      tagsJson: { contains: filters.tag.trim() },
    });
  }

  if (filters.difficulty?.trim()) {
    AND.push({
      difficulty: filters.difficulty.trim(),
    });
  }

  if (filters.mastery?.trim()) {
    const mastery = Number(filters.mastery.trim());
    if (Number.isInteger(mastery)) {
      AND.push({ mastery });
    }
  }

  if (filters.questionType?.trim()) {
    AND.push({
      questionType: { contains: filters.questionType.trim() },
    });
  }

  if (filters.abilityDimension?.trim()) {
    AND.push({
      abilityDimension: { contains: filters.abilityDimension.trim() },
    });
  }

  if (filters.roleDirection?.trim()) {
    AND.push({
      roleDirection: { contains: filters.roleDirection.trim() },
    });
  }

  if (filters.q?.trim()) {
    const keyword = filters.q.trim();
    AND.push({
      OR: [{ question: { contains: keyword } }, { answer: { contains: keyword } }, { note: { contains: keyword } }],
    });
  }

  return AND.length ? { AND } : {};
}
