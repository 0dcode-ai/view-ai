import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";

type LegacyExport = {
  companies?: Array<Record<string, any>>;
  topics?: Array<Record<string, any>>;
  knowledgeCards?: Array<Record<string, any>>;
  resumeProfiles?: Array<Record<string, any>>;
  jobTargets?: Array<Record<string, any>>;
  interviewSessions?: Array<Record<string, any>>;
  interviewTurns?: Array<Record<string, any>>;
  reviewCards?: Array<Record<string, any>>;
  sprintPlans?: Array<Record<string, any>>;
  sprintTasks?: Array<Record<string, any>>;
  labSessions?: Array<Record<string, any>>;
  experienceReports?: Array<Record<string, any>>;
  experienceRounds?: Array<Record<string, any>>;
};

type TemplateInput = {
  question: string;
  answer: string;
  companyName?: string;
  topicName?: string;
  roleDirection?: string;
  questionType?: string;
  abilityDimension?: string;
  tags?: string[];
  difficulty?: string;
  priorityScore?: number;
  source?: string;
  note?: string;
};

const prisma = new PrismaClient();

async function main() {
  const email = mustGet("BOOTSTRAP_USER_EMAIL");
  const userId = process.env.BOOTSTRAP_USER_ID || email;
  const user = await prisma.userProfile.upsert({
    where: { id: userId },
    update: { email },
    create: { id: userId, email },
  });

  const templateImport = await importQuestionTemplates();
  const legacyPath = process.env.LEGACY_EXPORT_PATH || path.resolve(process.cwd(), "../../data/legacy-export.json");
  const legacy = await readOptionalJson<LegacyExport>(legacyPath);
  const legacyImport = legacy ? await importLegacy(legacy, user.id) : null;

  console.log(
    JSON.stringify(
      {
        user: { id: user.id, email: user.email },
        templates: templateImport,
        legacy: legacyImport,
      },
      null,
      2,
    ),
  );
}

async function importQuestionTemplates() {
  const filePath =
    process.env.QUESTION_TEMPLATE_JSON_PATH ||
    path.resolve(process.cwd(), "../../data/interview-internal-reference.json");
  const templates = await readJson<TemplateInput[]>(filePath);
  let created = 0;
  let skipped = 0;

  for (const item of templates) {
    const sourceKey = makeSourceKey(item);
    const existing = await prisma.questionTemplate.findUnique({ where: { sourceKey } });
    if (existing) {
      skipped += 1;
      continue;
    }

    const [company, topic] = await Promise.all([
      findOrCreateCompany(item.companyName),
      findOrCreateTopic(item.topicName),
    ]);
    await prisma.questionTemplate.create({
      data: {
        sourceKey,
        question: item.question,
        answer: item.answer,
        companyId: company?.id,
        topicId: topic?.id,
        roleDirection: item.roleDirection,
        questionType: item.questionType ?? "technical",
        abilityDimension: item.abilityDimension ?? "基础知识",
        priorityScore: item.priorityScore ?? 50,
        tagsJson: JSON.stringify(item.tags ?? []),
        difficulty: item.difficulty ?? "medium",
        source: item.source ?? "0voice/interview_internal_reference",
        note: item.note,
      },
    });
    created += 1;
  }

  return { created, skipped, total: await prisma.questionTemplate.count() };
}

async function importLegacy(legacy: LegacyExport, userId: string) {
  const companyId = new Map<number, number>();
  const topicId = new Map<number, number>();
  const resumeId = new Map<number, number>();
  const jobTargetId = new Map<number, number>();
  const sessionId = new Map<number, number>();
  const knowledgeId = new Map<number, number>();
  const sprintPlanId = new Map<number, number>();
  const experienceId = new Map<number, number>();

  for (const company of legacy.companies ?? []) {
    const created = await findOrCreateCompany(company.name);
    if (created && company.id) companyId.set(company.id, created.id);
  }
  for (const topic of legacy.topics ?? []) {
    const created = await findOrCreateTopic(topic.name);
    if (created && topic.id) topicId.set(topic.id, created.id);
  }
  for (const card of legacy.knowledgeCards ?? []) {
    const existing = await prisma.knowledgeCard.findFirst({ where: { userId, legacyId: card.id } });
    if (existing) {
      knowledgeId.set(card.id, existing.id);
      continue;
    }
    const created = await prisma.knowledgeCard.create({
      data: {
        legacyId: card.id,
        userId,
        question: card.question,
        answer: card.answer,
        companyId: mapNullable(companyId, card.companyId),
        topicId: mapNullable(topicId, card.topicId),
        roleDirection: card.roleDirection,
        questionType: card.questionType,
        abilityDimension: card.abilityDimension,
        mastery: card.mastery,
        reviewCount: card.reviewCount,
        mistakeCount: card.mistakeCount,
        lastReviewedAt: parseDate(card.lastReviewedAt),
        nextReviewAt: parseDate(card.nextReviewAt),
        priorityScore: card.priorityScore,
        tagsJson: card.tagsJson,
        difficulty: card.difficulty,
        source: card.source,
        note: card.note,
      },
    });
    knowledgeId.set(card.id, created.id);
  }
  for (const resume of legacy.resumeProfiles ?? []) {
    const existing = await prisma.resumeProfile.findFirst({ where: { userId, legacyId: resume.id } });
    if (existing) {
      resumeId.set(resume.id, existing.id);
      continue;
    }
    const created = await prisma.resumeProfile.create({
      data: {
        legacyId: resume.id,
        userId,
        title: resume.title,
        rawText: resume.rawText,
        parsedJson: resume.parsedJson,
        followUpQuestionsJson: resume.followUpQuestionsJson,
      },
    });
    resumeId.set(resume.id, created.id);
  }
  for (const target of legacy.jobTargets ?? []) {
    const existing = await prisma.jobTarget.findFirst({ where: { userId, legacyId: target.id } });
    if (existing) {
      jobTargetId.set(target.id, existing.id);
      continue;
    }
    const created = await prisma.jobTarget.create({
      data: {
        legacyId: target.id,
        userId,
        companyId: mapNullable(companyId, target.companyId),
        resumeProfileId: mapNullable(resumeId, target.resumeProfileId),
        roleName: target.roleName,
        rawJd: target.rawJd,
        parsedJson: target.parsedJson,
        matchJson: target.matchJson,
      },
    });
    jobTargetId.set(target.id, created.id);
  }
  for (const session of legacy.interviewSessions ?? []) {
    const existing = await prisma.interviewSession.findFirst({ where: { userId, legacyId: session.id } });
    if (existing) {
      sessionId.set(session.id, existing.id);
      continue;
    }
    const created = await prisma.interviewSession.create({
      data: {
        legacyId: session.id,
        userId,
        mode: session.mode,
        roundType: session.roundType,
        deliveryMode: session.deliveryMode,
        targetRole: session.targetRole,
        targetCompanyId: mapNullable(companyId, session.targetCompanyId),
        resumeProfileId: mapNullable(resumeId, session.resumeProfileId),
        jobTargetId: mapNullable(jobTargetId, session.jobTargetId),
        status: session.status,
        summary: session.summary,
        scoreJson: session.scoreJson,
        expressionJson: session.expressionJson,
      },
    });
    sessionId.set(session.id, created.id);
  }
  for (const turn of legacy.interviewTurns ?? []) {
    const mappedSessionId = sessionId.get(turn.sessionId);
    if (!mappedSessionId) continue;
    await prisma.interviewTurn.upsert({
      where: { sessionId_order: { sessionId: mappedSessionId, order: turn.order } },
      update: {},
      create: {
        legacyId: turn.id,
        sessionId: mappedSessionId,
        order: turn.order,
        question: turn.question,
        questionSource: turn.questionSource,
        answer: turn.answer,
        feedback: turn.feedback,
        betterAnswer: turn.betterAnswer,
        transcriptSource: turn.transcriptSource,
        answerDurationSec: turn.answerDurationSec,
        audioMetaJson: turn.audioMetaJson,
        expressionJson: turn.expressionJson,
        scoreJson: turn.scoreJson,
      },
    });
  }
  for (const review of legacy.reviewCards ?? []) {
    const existing = await prisma.reviewCard.findFirst({ where: { userId, legacyId: review.id } });
    if (existing) continue;
    await prisma.reviewCard.create({
      data: {
        legacyId: review.id,
        userId,
        sessionId: mapNullable(sessionId, review.sessionId),
        knowledgeCardId: mapNullable(knowledgeId, review.knowledgeCardId),
        title: review.title,
        weakness: review.weakness,
        suggestion: review.suggestion,
        status: review.status,
        priority: review.priority,
        dueAt: parseDate(review.dueAt),
        tagsJson: review.tagsJson,
      },
    });
  }
  for (const plan of legacy.sprintPlans ?? []) {
    const existing = await prisma.sprintPlan.findFirst({ where: { userId, legacyId: plan.id } });
    if (existing) {
      sprintPlanId.set(plan.id, existing.id);
      continue;
    }
    const created = await prisma.sprintPlan.create({
      data: {
        legacyId: plan.id,
        userId,
        companyId: mapNullable(companyId, plan.companyId),
        jobTargetId: mapNullable(jobTargetId, plan.jobTargetId),
        resumeProfileId: mapNullable(resumeId, plan.resumeProfileId),
        title: plan.title,
        targetRole: plan.targetRole,
        interviewDate: parseDate(plan.interviewDate),
        days: plan.days,
        status: plan.status,
        summary: plan.summary,
      },
    });
    sprintPlanId.set(plan.id, created.id);
  }
  for (const task of legacy.sprintTasks ?? []) {
    const planId = sprintPlanId.get(task.planId);
    if (!planId) continue;
    const existing = await prisma.sprintTask.findFirst({ where: { legacyId: task.id } });
    if (existing) continue;
    await prisma.sprintTask.create({
      data: {
        legacyId: task.id,
        planId,
        dayIndex: task.dayIndex,
        type: task.type,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: parseDate(task.dueDate),
      },
    });
  }
  for (const lab of legacy.labSessions ?? []) {
    const existing = await prisma.labSession.findFirst({ where: { userId, legacyId: lab.id } });
    if (existing) continue;
    await prisma.labSession.create({
      data: {
        legacyId: lab.id,
        userId,
        type: lab.type,
        roleDirection: lab.roleDirection,
        title: lab.title,
        prompt: lab.prompt,
        starterCode: lab.starterCode,
        content: lab.content,
        feedbackJson: lab.feedbackJson,
        status: lab.status,
      },
    });
  }
  for (const report of legacy.experienceReports ?? []) {
    const existing = await prisma.experienceReport.findFirst({ where: { userId, legacyId: report.id } });
    if (existing) {
      experienceId.set(report.id, existing.id);
      continue;
    }
    const created = await prisma.experienceReport.create({
      data: {
        legacyId: report.id,
        userId,
        companyId: mapNullable(companyId, report.companyId),
        roleName: report.roleName,
        level: report.level,
        location: report.location,
        interviewDate: parseDate(report.interviewDate),
        result: report.result,
        difficulty: report.difficulty,
        sourceType: report.sourceType,
        confidence: report.confidence,
        verified: report.verified,
        durationMinutes: report.durationMinutes,
        rawText: report.rawText,
        summary: report.summary,
        tagsJson: report.tagsJson,
      },
    });
    experienceId.set(report.id, created.id);
  }
  for (const round of legacy.experienceRounds ?? []) {
    const reportId = experienceId.get(round.reportId);
    if (!reportId) continue;
    const existing = await prisma.experienceRound.findFirst({ where: { legacyId: round.id } });
    if (existing) continue;
    await prisma.experienceRound.create({
      data: {
        legacyId: round.id,
        reportId,
        order: round.order,
        roundType: round.roundType,
        durationMinutes: round.durationMinutes,
        interviewerStyle: round.interviewerStyle,
        focusAreasJson: round.focusAreasJson,
        questionsJson: round.questionsJson,
        notes: round.notes,
      },
    });
  }

  return {
    knowledgeCards: await prisma.knowledgeCard.count({ where: { userId } }),
    resumes: await prisma.resumeProfile.count({ where: { userId } }),
    jobTargets: await prisma.jobTarget.count({ where: { userId } }),
    sessions: await prisma.interviewSession.count({ where: { userId } }),
    reviews: await prisma.reviewCard.count({ where: { userId } }),
    sprints: await prisma.sprintPlan.count({ where: { userId } }),
    labs: await prisma.labSession.count({ where: { userId } }),
    experiences: await prisma.experienceReport.count({ where: { userId } }),
  };
}

async function findOrCreateCompany(name: string | null | undefined) {
  const cleanName = name?.trim();
  if (!cleanName) return null;
  return prisma.company.upsert({ where: { name: cleanName }, update: {}, create: { name: cleanName } });
}

async function findOrCreateTopic(name: string | null | undefined) {
  const cleanName = name?.trim();
  if (!cleanName) return null;
  return prisma.topic.upsert({ where: { name: cleanName }, update: {}, create: { name: cleanName } });
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function readOptionalJson<T>(filePath: string): Promise<T | null> {
  try {
    return await readJson<T>(filePath);
  } catch {
    return null;
  }
}

function mustGet(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function makeSourceKey(item: TemplateInput) {
  const source = item.source ?? "0voice/interview_internal_reference";
  const digest = createHash("sha1").update(`${source}:${item.note ?? ""}:${item.question}`).digest("hex");
  return `${source}:${digest}`;
}

function mapNullable(map: Map<number, number>, value: number | null | undefined) {
  return value == null ? null : map.get(value) ?? null;
}

function parseDate(value: string | Date | null | undefined) {
  return value ? new Date(value) : null;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
