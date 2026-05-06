import type { Prisma } from "./generated/prisma";
import { safeJsonParse, tagsFromJson } from "./utils/json";

type KnowledgeCardWithRelations = Prisma.KnowledgeCardGetPayload<{
  include: {
    company: true;
    topic: true;
  };
}>;

type QuestionTemplateWithRelations = Prisma.QuestionTemplateGetPayload<{
  include: {
    company: true;
    topic: true;
  };
}>;

type ResumeProfileRecord = Prisma.ResumeProfileGetPayload<Record<string, never>>;
type InterviewTurnRecord = Prisma.InterviewTurnGetPayload<Record<string, never>>;
type InterviewSessionWithRelations = Prisma.InterviewSessionGetPayload<{
  include: {
    application: true;
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
type AgentConfigRecord = Prisma.AgentConfigGetPayload<Record<string, never>>;
type AgentRunLogRecord = Prisma.AgentRunLogGetPayload<Record<string, never>>;
type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: {
    company: true;
    resumeProfile: true;
    jobTarget: {
      include: {
        company: true;
        resumeProfile: true;
      };
    };
    interviewSessions: true;
    reviewCards: true;
    sprintPlans: {
      include: {
        tasks: true;
      };
    };
    sourceDocuments: true;
    activities: true;
    resumeVersions: true;
  };
}>;
type ApplicationActivityRecord = Prisma.ApplicationActivityGetPayload<Record<string, never>>;
type ResumeVersionRecord = Prisma.ResumeVersionGetPayload<Record<string, never>>;
type SourceChunkRecord = Prisma.SourceChunkGetPayload<Record<string, never>>;
type SourceDocumentWithRelations = Prisma.SourceDocumentGetPayload<{
  include: {
    application: true;
    chunks: true;
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

export function serializeQuestionTemplate(template: QuestionTemplateWithRelations) {
  return {
    templateId: template.id,
    id: template.id,
    question: template.question,
    answer: template.answer,
    roleDirection: template.roleDirection,
    questionType: template.questionType,
    abilityDimension: template.abilityDimension,
    priorityScore: template.priorityScore,
    tags: tagsFromJson(template.tagsJson),
    difficulty: template.difficulty,
    source: template.source,
    note: template.note,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    company: template.company ? { id: template.company.id, name: template.company.name } : null,
    topic: template.topic ? { id: template.topic.id, name: template.topic.name } : null,
  };
}

export function serializeResumeProfile(resume: ResumeProfileRecord) {
  return {
    id: resume.id,
    title: resume.title,
    rawText: resume.rawText,
    parsed: safeJsonParse(resume.parsedJson, {
      summary: "",
      skills: [],
      experiences: [],
      projects: [],
      followUpQuestions: [],
    }),
    followUpQuestions: safeJsonParse<string[]>(resume.followUpQuestionsJson, []),
    candidatePrep: safeJsonParse<unknown | null>(resume.candidatePrepJson, null),
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
    turnType: turn.turnType,
    parentTurnId: turn.parentTurnId,
    intent: turn.intent,
    answer: turn.answer,
    feedback: turn.feedback,
    betterAnswer: turn.betterAnswer,
    idealAnswer: turn.idealAnswer,
    transcriptSource: turn.transcriptSource,
    answerDurationSec: turn.answerDurationSec,
    audioMeta: safeJsonParse<Record<string, unknown>>(turn.audioMetaJson, {}),
    expression: safeJsonParse<Record<string, number | string>>(turn.expressionJson, {}),
    score: safeJsonParse<Record<string, number>>(turn.scoreJson, {}),
    review: safeJsonParse<Record<string, unknown> | null>(turn.reviewJson, null),
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
    expression: safeJsonParse<Record<string, unknown>>(session.expressionJson, {}),
    context: safeJsonParse<Record<string, unknown> | null>(session.contextJson, null),
    config: safeJsonParse<Record<string, unknown> | null>(session.configJson, null),
    plan: safeJsonParse<Record<string, unknown> | null>(session.planJson, null),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    application: session.application
      ? {
          id: session.application.id,
          title: session.application.title,
          roleName: session.application.roleName,
        }
      : null,
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
    feedback: safeJsonParse(session.feedbackJson, {}),
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export function serializeExperienceRound(round: ExperienceRoundRecord) {
  return {
    id: round.id,
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

export function serializeAgentConfig(config: AgentConfigRecord) {
  return {
    id: config.id,
    agentName: config.agentName,
    displayName: config.displayName,
    enabled: config.enabled,
    model: config.model,
    config: safeJsonParse<Record<string, unknown>>(config.configJson, {}),
    prompt: safeJsonParse<Record<string, unknown>>(config.promptJson, {}),
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export function serializeAgentRunLog(log: AgentRunLogRecord) {
  return {
    id: log.id,
    agentName: log.agentName,
    status: log.status,
    model: log.model,
    usedFallback: log.usedFallback,
    latencyMs: log.latencyMs,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    input: safeJsonParse<Record<string, unknown>>(log.inputJson, {}),
    output: safeJsonParse<Record<string, unknown>>(log.outputJson, {}),
    error: safeJsonParse<Record<string, unknown>>(log.errorJson, {}),
    tokenUsage: safeJsonParse<Record<string, unknown>>(log.tokenUsageJson, {}),
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeApplication(application: ApplicationWithRelations) {
  const matchReport = safeJsonParse<unknown | null>(application.matchReportJson, null);
  return {
    id: application.id,
    title: application.title,
    roleName: application.roleName,
    level: application.level,
    salaryK: application.salaryK,
    salaryMinK: application.salaryMinK,
    salaryMaxK: application.salaryMaxK,
    status: application.status,
    stage: application.stage,
    jobUrl: application.jobUrl,
    location: application.location,
    source: application.source,
    priority: application.priority,
    archived: application.archived,
    appliedAt: application.appliedAt?.toISOString() ?? null,
    followUpAt: application.followUpAt?.toISOString() ?? null,
    deadlineAt: application.deadlineAt?.toISOString() ?? null,
    contactName: application.contactName,
    contactEmail: application.contactEmail,
    jdSnapshot: application.jdSnapshot,
    matchReport: matchReport && typeof matchReport === "object" && Object.keys(matchReport as Record<string, unknown>).length ? matchReport : null,
    interviewDate: application.interviewDate?.toISOString() ?? null,
    progress: buildApplicationProgress(application),
    nextAction: application.nextAction,
    note: application.note,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    company: application.company ? { id: application.company.id, name: application.company.name } : null,
    resumeProfile: application.resumeProfile ? serializeResumeProfile(application.resumeProfile) : null,
    jobTarget: application.jobTarget ? serializeJobTarget(application.jobTarget) : null,
    activities: application.activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20)
      .map(serializeApplicationActivity),
    resumeVersions: application.resumeVersions
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(serializeResumeVersion),
  };
}

export function serializeApplicationActivity(activity: ApplicationActivityRecord) {
  return {
    id: activity.id,
    applicationId: activity.applicationId,
    type: activity.type,
    title: activity.title,
    detail: activity.detail,
    metadata: safeJsonParse<Record<string, unknown>>(activity.metadataJson, {}),
    createdAt: activity.createdAt.toISOString(),
  };
}

export function serializeResumeVersion(version: ResumeVersionRecord) {
  const matchReport = safeJsonParse<unknown | null>(version.matchReportJson, null);
  return {
    id: version.id,
    applicationId: version.applicationId,
    resumeProfileId: version.resumeProfileId,
    title: version.title,
    content: version.content,
    blocks: safeJsonParse<unknown[]>(version.blocksJson, []),
    matchReport: matchReport && typeof matchReport === "object" && Object.keys(matchReport as Record<string, unknown>).length ? matchReport : null,
    suggestions: safeJsonParse<Record<string, unknown>>(version.suggestionJson, {}),
    isPrimary: version.isPrimary,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
  };
}

export function serializeSourceChunk(chunk: SourceChunkRecord) {
  return {
    id: chunk.id,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    tokenCount: chunk.tokenCount,
    metadata: safeJsonParse<Record<string, unknown>>(chunk.metadataJson, {}),
    createdAt: chunk.createdAt.toISOString(),
  };
}

export function serializeSourceDocument(document: SourceDocumentWithRelations) {
  return {
    id: document.id,
    title: document.title,
    sourceType: document.sourceType,
    content: document.content,
    metadata: safeJsonParse<Record<string, unknown>>(document.metadataJson, {}),
    application: document.application
      ? {
          id: document.application.id,
          title: document.application.title,
          roleName: document.application.roleName,
        }
      : null,
    chunks: document.chunks.sort((a, b) => a.chunkIndex - b.chunkIndex).map(serializeSourceChunk),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function buildApplicationProgress(application: ApplicationWithRelations) {
  const savedProgress = safeJsonParse<Partial<{
    resumeReady: number;
    jdReady: number;
    mockReady: number;
    reviewReady: number;
    sourceReady: number;
    overall: number;
    nextActions: string[];
  }>>(application.progressJson, {});
  const finishedSessions = application.interviewSessions.filter((session) => session.status === "finished").length;
  const todoReviews = application.reviewCards.filter((card) => card.status !== "done").length;
  const totalTasks = application.sprintPlans.flatMap((plan) => plan.tasks ?? []).length;
  const doneTasks = application.sprintPlans.flatMap((plan) => plan.tasks ?? []).filter((task) => task.status === "done").length;
  const resumeReady = savedProgress.resumeReady ?? (application.resumeProfileId ? 100 : 0);
  const jdReady = savedProgress.jdReady ?? (application.jobTargetId ? 100 : 0);
  const mockReady = savedProgress.mockReady ?? Math.min(100, finishedSessions * 30);
  const reviewReady = savedProgress.reviewReady ?? (application.reviewCards.length ? Math.round(((application.reviewCards.length - todoReviews) / application.reviewCards.length) * 100) : 0);
  const sourceReady = savedProgress.sourceReady ?? Math.min(100, application.sourceDocuments.length * 25 + (totalTasks ? Math.round((doneTasks / totalTasks) * 20) : 0));
  const matchScore = safeJsonParse<{ matchScore?: number }>(application.matchReportJson, {}).matchScore ?? 0;
  const matchReady = matchScore ? Math.min(100, matchScore) : 0;
  const overall = savedProgress.overall ?? Math.round(resumeReady * 0.18 + jdReady * 0.2 + matchReady * 0.2 + mockReady * 0.22 + reviewReady * 0.1 + sourceReady * 0.1);
  const nextActions =
    savedProgress.nextActions ??
    [
      application.resumeProfileId ? "" : "先关联一份简历。",
      application.jobTargetId ? "" : "补充或解析目标 JD。",
      matchScore ? "" : "生成一次 JD/简历匹配报告。",
      finishedSessions ? "" : "完成一次候选人视角模拟面试。",
      todoReviews ? "清理本机会下的复盘卡。" : "",
    ].filter(Boolean);

  return {
    resumeReady,
    jdReady,
    mockReady,
    reviewReady,
    sourceReady,
    overall,
    nextActions,
  };
}
