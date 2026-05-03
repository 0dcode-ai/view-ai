import type { Prisma } from "@prisma/client";
import type { CandidatePrepResult, ResumeParseResult } from "@/lib/ai";
import { safeJsonParse, tagsFromJson } from "@/lib/tags";

type KnowledgeCardWithRelations = Prisma.KnowledgeCardGetPayload<{
  include: {
    company: true;
    topic: true;
  };
}>;

type ResumeProfileRecord = Prisma.ResumeProfileGetPayload<Record<string, never>>;

type InterviewTurnRecord = Prisma.InterviewTurnGetPayload<Record<string, never>>;

type InterviewSessionWithRelations = Prisma.InterviewSessionGetPayload<{
  include: {
    company: true;
    jobTarget: {
      include: {
        company: true;
        resumeProfile: true;
      };
    };
    resumeProfile: true;
    turns: true;
  };
}>;

type ReviewCardWithRelations = Prisma.ReviewCardGetPayload<{
  include: {
    knowledgeCard: {
      include: {
        company: true;
        topic: true;
      };
    };
    session: true;
  };
}>;

type JobTargetWithRelations = Prisma.JobTargetGetPayload<{
  include: {
    company: true;
    resumeProfile: true;
  };
}>;

type SprintPlanWithRelations = Prisma.SprintPlanGetPayload<{
  include: {
    company: true;
    jobTarget: {
      include: {
        company: true;
        resumeProfile: true;
      };
    };
    resumeProfile: true;
    tasks: true;
  };
}>;

type SprintTaskRecord = Prisma.SprintTaskGetPayload<Record<string, never>>;
type LabSessionRecord = Prisma.LabSessionGetPayload<Record<string, never>>;
type ExperienceRoundRecord = Prisma.ExperienceRoundGetPayload<Record<string, never>>;
type ExperienceReportWithRelations = Prisma.ExperienceReportGetPayload<{
  include: {
    company: true;
    rounds: true;
  };
}>;

export function serializeKnowledgeCard(card: KnowledgeCardWithRelations) {
  return {
    id: card.id,
    question: card.question,
    answer: card.answer,
    roleDirection: card.roleDirection,
    questionType: card.questionType,
    abilityDimension: card.abilityDimension,
    mastery: card.mastery,
    reviewCount: card.reviewCount,
    mistakeCount: card.mistakeCount,
    lastReviewedAt: card.lastReviewedAt?.toISOString() ?? null,
    nextReviewAt: card.nextReviewAt?.toISOString() ?? null,
    priorityScore: card.priorityScore,
    tags: tagsFromJson(card.tagsJson),
    difficulty: card.difficulty,
    source: card.source,
    note: card.note,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    company: card.company ? { id: card.company.id, name: card.company.name } : null,
    topic: card.topic ? { id: card.topic.id, name: card.topic.name } : null,
  };
}

export function serializeResumeProfile(resume: ResumeProfileRecord) {
  return {
    id: resume.id,
    title: resume.title,
    rawText: resume.rawText,
    parsed: safeJsonParse<ResumeParseResult>(resume.parsedJson, {
      summary: "",
      skills: [],
      experiences: [],
      projects: [],
      followUpQuestions: [],
    }),
    followUpQuestions: safeJsonParse<string[]>(resume.followUpQuestionsJson, []),
    candidatePrep: safeJsonParse<CandidatePrepResult | null>(resume.candidatePrepJson, null),
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
  };
}

export function serializeJobTarget(target: JobTargetWithRelations) {
  return {
    id: target.id,
    roleName: target.roleName,
    rawJd: target.rawJd,
    parsed: safeJsonParse(target.parsedJson, {
      responsibilities: [],
      requiredSkills: [],
      bonusSkills: [],
      riskPoints: [],
      interviewFocus: [],
    }),
    match: safeJsonParse(target.matchJson, {
      matchScore: 0,
      strengths: [],
      gaps: [],
      projectTalkTracks: [],
    }),
    createdAt: target.createdAt.toISOString(),
    updatedAt: target.updatedAt.toISOString(),
    company: target.company ? { id: target.company.id, name: target.company.name } : null,
    resumeProfile: target.resumeProfile ? serializeResumeProfile(target.resumeProfile) : null,
  };
}

export function serializeTurn(turn: InterviewTurnRecord) {
  return {
    id: turn.id,
    sessionId: turn.sessionId,
    order: turn.order,
    question: turn.question,
    questionSource: turn.questionSource,
    answer: turn.answer,
    feedback: turn.feedback,
    betterAnswer: turn.betterAnswer,
    transcriptSource: turn.transcriptSource,
    answerDurationSec: turn.answerDurationSec,
    audioMeta: safeJsonParse<Record<string, unknown>>(turn.audioMetaJson, {}),
    expression: safeJsonParse<Record<string, number | string>>(turn.expressionJson, {}),
    score: safeJsonParse<Record<string, number>>(turn.scoreJson, {}),
    createdAt: turn.createdAt.toISOString(),
    updatedAt: turn.updatedAt.toISOString(),
  };
}

export function serializeInterviewSession(session: InterviewSessionWithRelations) {
  return {
    id: session.id,
    mode: session.mode,
    roundType: session.roundType,
    deliveryMode: session.deliveryMode,
    targetRole: session.targetRole,
    status: session.status,
    summary: session.summary,
    score: safeJsonParse<Record<string, number>>(session.scoreJson, {}),
    expression: safeJsonParse<Record<string, number | string>>(session.expressionJson, {}),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    company: session.company ? { id: session.company.id, name: session.company.name } : null,
    jobTarget: session.jobTarget ? serializeJobTarget(session.jobTarget) : null,
    resumeProfile: session.resumeProfile ? serializeResumeProfile(session.resumeProfile) : null,
    turns: session.turns.sort((a, b) => a.order - b.order).map(serializeTurn),
  };
}

export function serializeReviewCard(card: ReviewCardWithRelations) {
  return {
    id: card.id,
    title: card.title,
    weakness: card.weakness,
    suggestion: card.suggestion,
    status: card.status,
    priority: card.priority,
    dueAt: card.dueAt?.toISOString() ?? null,
    tags: tagsFromJson(card.tagsJson),
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    session: card.session
      ? {
          id: card.session.id,
          mode: card.session.mode,
          roundType: card.session.roundType,
          targetRole: card.session.targetRole,
        }
      : null,
    knowledgeCard: card.knowledgeCard ? serializeKnowledgeCard(card.knowledgeCard) : null,
  };
}

export function serializeSprintTask(task: SprintTaskRecord) {
  return {
    id: task.id,
    planId: task.planId,
    dayIndex: task.dayIndex,
    type: task.type,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function serializeSprintPlan(plan: SprintPlanWithRelations) {
  return {
    id: plan.id,
    title: plan.title,
    targetRole: plan.targetRole,
    interviewDate: plan.interviewDate?.toISOString() ?? null,
    days: plan.days,
    status: plan.status,
    summary: plan.summary,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    company: plan.company ? { id: plan.company.id, name: plan.company.name } : null,
    jobTarget: plan.jobTarget ? serializeJobTarget(plan.jobTarget) : null,
    resumeProfile: plan.resumeProfile ? serializeResumeProfile(plan.resumeProfile) : null,
    tasks: plan.tasks.sort((a, b) => a.dayIndex - b.dayIndex || a.id - b.id).map(serializeSprintTask),
  };
}

export function serializeLabSession(session: LabSessionRecord) {
  return {
    id: session.id,
    type: session.type,
    roleDirection: session.roleDirection,
    title: session.title,
    prompt: session.prompt,
    starterCode: session.starterCode,
    content: session.content,
    feedback: safeJsonParse<Record<string, unknown>>(session.feedbackJson, {}),
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export function serializeExperienceRound(round: ExperienceRoundRecord) {
  return {
    id: round.id,
    reportId: round.reportId,
    order: round.order,
    roundType: round.roundType,
    durationMinutes: round.durationMinutes,
    interviewerStyle: round.interviewerStyle,
    focusAreas: safeJsonParse<string[]>(round.focusAreasJson, []),
    questions: safeJsonParse<string[]>(round.questionsJson, []),
    notes: round.notes,
  };
}

export function serializeExperienceReport(report: ExperienceReportWithRelations) {
  return {
    id: report.id,
    roleName: report.roleName,
    level: report.level,
    location: report.location,
    interviewDate: report.interviewDate?.toISOString() ?? null,
    result: report.result,
    difficulty: report.difficulty,
    sourceType: report.sourceType,
    confidence: report.confidence,
    verified: report.verified,
    durationMinutes: report.durationMinutes,
    rawText: report.rawText,
    summary: report.summary,
    tags: tagsFromJson(report.tagsJson),
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    company: report.company ? { id: report.company.id, name: report.company.name } : null,
    rounds: report.rounds.sort((a, b) => a.order - b.order).map(serializeExperienceRound),
  };
}
