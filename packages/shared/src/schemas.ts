import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const reviewStatusSchema = z.enum(["todo", "doing", "done"]);
export const labTypeSchema = z.enum(["coding", "system_design", "peer_mock"]);
export const deliveryModeSchema = z.enum(["text", "voice"]);
export const interviewModeSchema = z.enum(["technical", "project", "behavior", "system_design", "mixed"]);
export const roundTypeSchema = z.enum(["first_round", "second_round", "final_round", "hr_round"]);
export const applicationStatusSchema = z.enum(["tracking", "preparing", "applied", "interviewing", "offer", "rejected", "paused", "archived"]);
export const applicationStageSchema = z.enum(["saved", "preparing", "applied", "interviewing", "offer", "closed"]);
export const sourceTypeSchema = z.enum(["resume", "jd", "article", "experience", "github", "note"]);

export const companyOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const topicOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const knowledgeCardSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
  roleDirection: z.string().nullable(),
  questionType: z.string(),
  abilityDimension: z.string(),
  mastery: z.number(),
  reviewCount: z.number(),
  mistakeCount: z.number(),
  priorityScore: z.number(),
  nextReviewAt: z.string().nullable(),
  tags: z.array(z.string()),
  difficulty: z.string(),
  source: z.string().nullable(),
  note: z.string().nullable(),
  company: companyOptionSchema.nullable(),
  topic: topicOptionSchema.nullable(),
  updatedAt: z.string(),
});

export const knowledgeListResponseSchema = z.object({
  cards: z.array(knowledgeCardSchema),
  companies: z.array(companyOptionSchema),
  topics: z.array(topicOptionSchema),
  tags: z.array(z.string()),
});

export const questionTemplateSchema = knowledgeCardSchema
  .omit({
    mastery: true,
    reviewCount: true,
    mistakeCount: true,
    nextReviewAt: true,
  })
  .extend({
    templateId: z.number(),
  });

export const createKnowledgeSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  companyName: z.string().optional(),
  topicName: z.string().optional(),
  roleDirection: z.string().optional(),
  questionType: z.string().optional(),
  abilityDimension: z.string().optional(),
  mastery: z.number().int().min(0).max(4).optional(),
  priorityScore: z.number().int().min(0).max(100).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: difficultySchema.default("medium"),
  source: z.string().optional(),
  note: z.string().optional(),
  useAi: z.boolean().optional(),
});

export const updateKnowledgeProgressSchema = z.object({
  mastery: z.number().int().min(0).max(4).optional(),
  markReviewed: z.boolean().optional(),
  reviewDelta: z.number().int().optional(),
  mistakeDelta: z.number().int().min(0).max(10).optional(),
  priorityScore: z.number().int().min(0).max(100).optional(),
  nextReviewAt: z.string().datetime().nullable().optional(),
});

export const updateKnowledgeSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  companyName: z.string().nullable().optional(),
  topicName: z.string().nullable().optional(),
  roleDirection: z.string().nullable().optional(),
  questionType: z.string().optional(),
  abilityDimension: z.string().optional(),
  mastery: z.number().int().min(0).max(4).optional(),
  priorityScore: z.number().int().min(0).max(100).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: difficultySchema.optional(),
  source: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const agentNameSchema = z.enum(["knowledge-record", "startup-idea", "candidate-prep", "github-repo", "knowledge-ingest", "application-match", "resume-tailor", "mock-interviewer"]);

export const evidenceRefSchema = z.object({
  sourceId: z.number().nullable().optional(),
  chunkId: z.number().nullable().optional(),
  quote: z.string(),
  reason: z.string(),
});

export const agentConfigSchema = z.object({
  id: z.number(),
  agentName: agentNameSchema,
  displayName: z.string().nullable(),
  enabled: z.boolean(),
  model: z.string().nullable(),
  config: z.record(z.string(), z.unknown()),
  prompt: z.record(z.string(), z.unknown()),
  updatedAt: z.string(),
});

export const updateAgentConfigSchema = z.object({
  displayName: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  model: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  prompt: z.record(z.string(), z.unknown()).optional(),
});

export const createAgentRunLogSchema = z.object({
  agentName: agentNameSchema,
  status: z.enum(["success", "fallback", "error"]).default("success"),
  model: z.string().nullable().optional(),
  usedFallback: z.boolean().default(false),
  latencyMs: z.number().int().min(0).nullable().optional(),
  resourceType: z.string().nullable().optional(),
  resourceId: z.string().nullable().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  output: z.record(z.string(), z.unknown()).optional(),
  error: z.record(z.string(), z.unknown()).optional(),
  tokenUsage: z.record(z.string(), z.unknown()).optional(),
});

export const agentRunLogSchema = z.object({
  id: z.number(),
  agentName: agentNameSchema,
  status: z.string(),
  model: z.string().nullable(),
  usedFallback: z.boolean(),
  latencyMs: z.number().nullable(),
  resourceType: z.string().nullable(),
  resourceId: z.string().nullable(),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()),
  error: z.record(z.string(), z.unknown()),
  tokenUsage: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const agentRunSchema = z.object({
  input: z.record(z.string(), z.unknown()).default({}),
  applicationId: z.number().int().optional(),
  sourceIds: z.array(z.number().int()).optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
});

export const agentRunResponseSchema = z.object({
  output: z.record(z.string(), z.unknown()),
  execution: z.object({
    steps: z.array(z.string()),
    model: z.string(),
    usedFallback: z.boolean(),
    latencyMs: z.number(),
  }),
  evidence: z.array(evidenceRefSchema),
  log: agentRunLogSchema,
});

export const resumeProfileSchema = z.object({
  id: z.number(),
  title: z.string(),
  rawText: z.string(),
  parsed: z.object({
    summary: z.string(),
    skills: z.array(z.string()),
    experiences: z.array(z.string()),
    projects: z.array(z.string()),
    followUpQuestions: z.array(z.string()),
  }),
  followUpQuestions: z.array(z.string()),
  candidatePrep: z.unknown().nullable().optional(),
  updatedAt: z.string(),
});

export const parseResumeSchema = z.object({
  title: z.string().default("我的简历"),
  rawText: z.string().min(20),
});

export const updateResumeSchema = z.object({
  title: z.string().min(1).optional(),
  candidatePrep: z.unknown().nullable().optional(),
});

export const resumeListResponseSchema = z.object({
  resumes: z.array(resumeProfileSchema),
});

export const jobTargetSchema = z.object({
  id: z.number(),
  roleName: z.string(),
  rawJd: z.string(),
  parsed: z.object({
    responsibilities: z.array(z.string()),
    requiredSkills: z.array(z.string()),
    bonusSkills: z.array(z.string()),
    riskPoints: z.array(z.string()),
    interviewFocus: z.array(z.string()),
  }),
  match: z.object({
    matchScore: z.number(),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    projectTalkTracks: z.array(z.string()),
  }),
  company: companyOptionSchema.nullable(),
  resumeProfile: resumeProfileSchema.nullable(),
  updatedAt: z.string(),
});

export const parseJobTargetSchema = z.object({
  companyName: z.string().optional(),
  roleName: z.string().min(1),
  rawJd: z.string().min(20),
  resumeProfileId: z.number().int().optional(),
});

export const jobTargetListResponseSchema = z.object({
  jobTargets: z.array(jobTargetSchema),
});

export const keywordMatchItemSchema = z.object({
  keyword: z.string(),
  category: z.string(),
  required: z.boolean(),
  found: z.boolean(),
  evidence: z.array(evidenceRefSchema),
  suggestion: z.string(),
});

export const resumeJobMatchReportSchema = z.object({
  matchScore: z.number(),
  includedKeywords: z.array(keywordMatchItemSchema),
  missingKeywords: z.array(keywordMatchItemSchema),
  requiredKeywords: z.array(keywordMatchItemSchema),
  suggestedBullets: z.array(z.object({
    keyword: z.string(),
    bullet: z.string(),
    reason: z.string(),
  })),
  summary: z.string(),
  usedFallback: z.boolean().optional(),
});

export const resumeContentBlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  content: z.string(),
  enabled: z.boolean(),
  keywords: z.array(z.string()),
});

export const resumeVersionSchema = z.object({
  id: z.number(),
  applicationId: z.number(),
  resumeProfileId: z.number().nullable(),
  title: z.string(),
  content: z.string(),
  blocks: z.array(resumeContentBlockSchema),
  matchReport: resumeJobMatchReportSchema.nullable(),
  suggestions: z.record(z.string(), z.unknown()),
  isPrimary: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const applicationActivitySchema = z.object({
  id: z.number(),
  applicationId: z.number(),
  type: z.string(),
  title: z.string(),
  detail: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const applicationProgressSchema = z.object({
  resumeReady: z.number(),
  jdReady: z.number(),
  mockReady: z.number(),
  reviewReady: z.number(),
  sourceReady: z.number(),
  overall: z.number(),
  nextActions: z.array(z.string()),
});

export const applicationSchema = z.object({
  id: z.number(),
  title: z.string(),
  roleName: z.string(),
  level: z.string(),
  salaryK: z.number().nullable(),
  salaryMinK: z.number().nullable(),
  salaryMaxK: z.number().nullable(),
  status: z.string(),
  stage: z.string(),
  jobUrl: z.string().nullable(),
  location: z.string().nullable(),
  source: z.string().nullable(),
  priority: z.number(),
  archived: z.boolean(),
  appliedAt: z.string().nullable(),
  followUpAt: z.string().nullable(),
  deadlineAt: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  jdSnapshot: z.string().nullable(),
  matchReport: resumeJobMatchReportSchema.nullable(),
  interviewDate: z.string().nullable(),
  progress: applicationProgressSchema,
  nextAction: z.string().nullable(),
  note: z.string().nullable(),
  company: companyOptionSchema.nullable(),
  resumeProfile: resumeProfileSchema.nullable(),
  jobTarget: jobTargetSchema.nullable(),
  activities: z.array(applicationActivitySchema).optional(),
  resumeVersions: z.array(resumeVersionSchema).optional(),
  updatedAt: z.string(),
});

export const applicationListResponseSchema = z.object({
  applications: z.array(applicationSchema),
  metrics: z.object({
    total: z.number(),
    active: z.number(),
    archived: z.number(),
    byStage: z.record(z.string(), z.number()),
    averageMatchScore: z.number(),
  }),
});

export const createApplicationSchema = z.object({
  companyName: z.string().optional(),
  companyId: z.number().int().optional(),
  resumeProfileId: z.number().int().optional(),
  jobTargetId: z.number().int().optional(),
  title: z.string().optional(),
  roleName: z.string().min(1),
  level: z.enum(["junior", "mid", "senior", "staff"]).default("mid"),
  salaryK: z.number().int().min(0).max(200).nullable().optional(),
  salaryMinK: z.number().int().min(0).max(200).nullable().optional(),
  salaryMaxK: z.number().int().min(0).max(300).nullable().optional(),
  status: applicationStatusSchema.default("tracking"),
  stage: applicationStageSchema.default("saved"),
  jobUrl: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(100).default(50),
  archived: z.boolean().optional(),
  appliedAt: z.string().nullable().optional(),
  followUpAt: z.string().nullable().optional(),
  deadlineAt: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  jdSnapshot: z.string().nullable().optional(),
  interviewDate: z.string().nullable().optional(),
  nextAction: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  progress: z.record(z.string(), z.unknown()).optional(),
  matchReport: resumeJobMatchReportSchema.nullable().optional(),
});

export const createResumeVersionSchema = z.object({
  resumeProfileId: z.number().int().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
});

export const updateResumeVersionSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  blocks: z.array(resumeContentBlockSchema).optional(),
  matchReport: resumeJobMatchReportSchema.nullable().optional(),
  suggestions: z.record(z.string(), z.unknown()).optional(),
  isPrimary: z.boolean().optional(),
});

export const generateBulletSchema = z.object({
  keyword: z.string().min(1),
});

export const applicationMatchResponseSchema = z.object({
  application: applicationSchema,
  matchReport: resumeJobMatchReportSchema,
  execution: z.object({
    model: z.string(),
    usedFallback: z.boolean(),
    steps: z.array(z.string()),
  }),
});

export const resumeVersionListResponseSchema = z.object({
  resumeVersions: z.array(resumeVersionSchema),
});

export const sourceChunkSchema = z.object({
  id: z.number(),
  chunkIndex: z.number(),
  content: z.string(),
  tokenCount: z.number(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const sourceDocumentSchema = z.object({
  id: z.number(),
  title: z.string(),
  sourceType: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  application: z.object({ id: z.number(), title: z.string(), roleName: z.string() }).nullable(),
  chunks: z.array(sourceChunkSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const sourceListResponseSchema = z.object({
  sources: z.array(sourceDocumentSchema),
});

export const createSourceDocumentSchema = z.object({
  title: z.string().min(1),
  sourceType: sourceTypeSchema.default("note"),
  content: z.string().min(1),
  applicationId: z.number().int().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const interviewTurnSchema = z.object({
  id: z.number(),
  order: z.number(),
  question: z.string(),
  questionSource: z.string().nullable(),
  turnType: z.enum(["primary", "followup", "discussion"]).nullable().optional(),
  parentTurnId: z.number().nullable().optional(),
  intent: z.string().nullable().optional(),
  answer: z.string().nullable(),
  feedback: z.string().nullable(),
  betterAnswer: z.string().nullable(),
  idealAnswer: z.string().nullable().optional(),
  transcriptSource: z.string(),
  answerDurationSec: z.number().nullable(),
  expression: z.record(z.string(), z.union([z.number(), z.string()])),
  score: z.record(z.string(), z.number()),
  review: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const interviewerSessionConfigSchema = z.object({
  sessionKind: z.literal("mock_interviewer"),
  answerVisibility: z.literal("toggle"),
  scoringTiming: z.literal("final_only"),
  inputMode: z.literal("text"),
});

export const interviewerSessionContextSchema = z.object({
  resumeText: z.string(),
  parsedResume: z.object({
    summary: z.string(),
    skills: z.array(z.string()),
    experiences: z.array(z.string()),
    projects: z.array(z.string()),
    followUpQuestions: z.array(z.string()),
  }),
  jdText: z.string().nullable(),
  jdKeywords: z.array(z.string()),
  targetRole: z.string().nullable(),
  seniority: z.enum(["junior", "mid", "senior", "staff"]),
  durationMinutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(45)]),
});

export const interviewerPlanTopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.enum(["resume", "jd", "general"]),
  kind: z.enum(["project", "skill", "behavior", "system", "jd"]),
  intent: z.string(),
  question: z.string(),
  idealAnswer: z.string(),
  asked: z.boolean(),
  required: z.boolean(),
});

export const interviewerSessionPlanSchema = z.object({
  durationMinutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(45)]),
  turnBudget: z.number(),
  primaryQuestionBudget: z.number(),
  followUpBudget: z.number(),
  askedPrimaryCount: z.number(),
  askedFollowUpCount: z.number(),
  requiredProjectDeepDive: z.boolean(),
  projectDeepDiveCovered: z.boolean(),
  jdRequiredQuestionTarget: z.number(),
  jdRequiredQuestionCount: z.number(),
  currentTopicId: z.string().nullable(),
  topics: z.array(interviewerPlanTopicSchema),
});

export const interviewerTurnReviewSchema = z.object({
  dimensions: z.object({
    accuracy: z.number().int().min(1).max(5),
    depth: z.number().int().min(1).max(5),
    structure: z.number().int().min(1).max(5),
    resumeGrounding: z.number().int().min(1).max(5),
    roleRelevance: z.number().int().min(1).max(5),
    clarity: z.number().int().min(1).max(5),
  }),
  overallScore: z.number().int().min(0).max(100),
  feedback: z.string(),
  betterAnswer: z.string(),
  missedPoints: z.array(z.string()),
});

export const interviewerSessionSummarySchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  dimensionAverages: z.object({
    accuracy: z.number(),
    depth: z.number(),
    structure: z.number(),
    resumeGrounding: z.number(),
    roleRelevance: z.number(),
    clarity: z.number(),
  }),
  summary: z.string(),
  strengths: z.array(z.string()),
  nextActions: z.array(z.string()),
  turns: z.array(
    z.object({
      turnId: z.number(),
      order: z.number(),
      question: z.string(),
      answer: z.string().nullable(),
      score: z.number().int().min(0).max(100),
      feedback: z.string(),
      idealAnswer: z.string(),
      missedPoints: z.array(z.string()),
    }),
  ),
  questionReviews: z.array(
    z.object({
      turnId: z.number(),
      order: z.number(),
      question: z.string(),
      score: z.number().int().min(0).max(100),
      feedback: z.string(),
      idealAnswer: z.string(),
      missedPoints: z.array(z.string()),
      answers: z.array(z.string()),
      followUps: z.array(z.string()),
    }),
  ),
  discussionReviews: z.array(
    z.object({
      turnId: z.number(),
      order: z.number(),
      question: z.string(),
      score: z.number().int().min(0).max(100),
      feedback: z.string(),
      idealAnswer: z.string(),
      missedPoints: z.array(z.string()),
      answers: z.array(z.string()),
    }),
  ),
});

export const interviewSessionSchema = z.object({
  id: z.number(),
  mode: interviewModeSchema,
  roundType: roundTypeSchema,
  deliveryMode: deliveryModeSchema,
  targetRole: z.string().nullable(),
  status: z.string(),
  summary: z.string().nullable(),
  score: z.record(z.string(), z.number()),
  expression: z.record(z.string(), z.unknown()),
  application: z.object({ id: z.number(), title: z.string(), roleName: z.string() }).nullable().optional(),
  company: companyOptionSchema.nullable(),
  jobTarget: jobTargetSchema.nullable(),
  resumeProfile: resumeProfileSchema.nullable(),
  context: interviewerSessionContextSchema.nullable().optional(),
  config: interviewerSessionConfigSchema.nullable().optional(),
  plan: interviewerSessionPlanSchema.nullable().optional(),
  turns: z.array(interviewTurnSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string(),
});

export const startInterviewSchema = z.object({
  mode: interviewModeSchema.default("mixed"),
  roundType: roundTypeSchema.default("first_round"),
  deliveryMode: deliveryModeSchema.default("text"),
  targetCompanyName: z.string().optional(),
  targetRole: z.string().optional(),
  applicationId: z.number().int().optional(),
  resumeProfileId: z.number().int().optional(),
  jobTargetId: z.number().int().optional(),
  seniority: z.enum(["junior", "mid", "senior", "staff"]).optional(),
  salaryK: z.number().int().min(0).max(200).optional(),
  difficulty: difficultySchema.optional(),
});

export const answerInterviewSchema = z.object({
  answer: z.string().min(1),
  transcriptSource: z.string().default("text"),
  answerDurationSec: z.number().int().positive().optional(),
  expression: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
});

export const answerInterviewBySessionSchema = answerInterviewSchema.extend({
  sessionId: z.number().int().positive(),
  turnId: z.number().int().positive().optional(),
  audioMeta: z.record(z.string(), z.unknown()).optional(),
});

export const finishInterviewSchema = z.object({
  sessionId: z.number().int().positive(),
});

export const startInterviewerSessionSchema = z.object({
  resumeProfileId: z.number().int().positive().optional(),
  resumeText: z.string().min(20).optional(),
  jdText: z.string().min(20).optional().or(z.literal("")).optional(),
  targetRole: z.string().optional(),
  targetCompanyName: z.string().optional(),
  seniority: z.enum(["junior", "mid", "senior", "staff"]).default("mid"),
  durationMinutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(45)]).default(20),
}).refine((input) => Boolean(input.resumeProfileId || input.resumeText?.trim()), {
  message: "必须提供简历文本或选择一份简历。",
  path: ["resumeText"],
});

export const answerInterviewerSessionSchema = z.object({
  answer: z.string().min(1),
  turnId: z.number().int().positive().optional(),
  mode: z.enum(["turn", "discussion"]).default("turn"),
  title: z.string().optional(),
  sourceTurnId: z.number().int().positive().optional(),
  transcriptSource: z.literal("text").default("text"),
  answerDurationSec: z.number().int().positive().optional(),
});

export const interviewerSessionListResponseSchema = z.object({
  sessions: z.array(interviewSessionSchema),
});

export const interviewerSessionStartResponseSchema = z.object({
  session: interviewSessionSchema,
});

export const interviewerSessionAnswerResponseSchema = z.object({
  session: interviewSessionSchema,
  answeredTurn: interviewTurnSchema,
  nextTurn: interviewTurnSchema.nullable(),
  shouldFinish: z.boolean(),
});

export const interviewerSessionFinishResponseSchema = z.object({
  session: interviewSessionSchema,
  summary: interviewerSessionSummarySchema,
});

export const reviewCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  weakness: z.string(),
  suggestion: z.string(),
  status: z.string(),
  priority: z.number(),
  dueAt: z.string().nullable().optional(),
  tags: z.array(z.string()),
  session: z
    .object({
      id: z.number(),
      mode: z.string(),
      roundType: z.string(),
      targetRole: z.string().nullable(),
    })
    .nullable(),
  knowledgeCard: knowledgeCardSchema.nullable(),
});

export const reviewListResponseSchema = z.object({
  reviewCards: z.array(reviewCardSchema),
});

export const updateReviewSchema = z.object({
  status: reviewStatusSchema.optional(),
  priority: z.number().int().min(0).max(100).optional(),
  dueAt: z.string().nullable().optional(),
  createTask: z.boolean().optional(),
});

export const sprintTaskSchema = z.object({
  id: z.number(),
  planId: z.number().optional(),
  dayIndex: z.number(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  status: reviewStatusSchema,
  dueDate: z.string().nullable(),
});

export const sprintPlanSchema = z.object({
  id: z.number(),
  title: z.string(),
  targetRole: z.string().nullable(),
  interviewDate: z.string().nullable(),
  days: z.number(),
  status: z.string(),
  summary: z.string().nullable(),
  company: companyOptionSchema.nullable(),
  jobTarget: jobTargetSchema.nullable(),
  resumeProfile: resumeProfileSchema.nullable(),
  tasks: z.array(sprintTaskSchema),
});

export const sprintListResponseSchema = z.object({
  sprintPlans: z.array(sprintPlanSchema),
});

export const generateSprintSchema = z.object({
  applicationId: z.number().int().optional(),
  companyId: z.number().int().optional(),
  jobTargetId: z.number().int().optional(),
  resumeProfileId: z.number().int().optional(),
  roleName: z.string().optional(),
  interviewDate: z.string().optional(),
  days: z.number().int().min(1).max(30).default(7),
});

export const labSessionSchema = z.object({
  id: z.number(),
  type: labTypeSchema,
  roleDirection: z.string().nullable(),
  title: z.string(),
  prompt: z.string(),
  starterCode: z.string().nullable(),
  content: z.string().nullable(),
  feedback: z.object({
    score: z.number().optional(),
    strengths: z.array(z.string()).optional(),
    gaps: z.array(z.string()).optional(),
    nextAction: z.string().optional(),
  }),
  status: z.string(),
  updatedAt: z.string(),
});

export const labListResponseSchema = z.object({
  labSessions: z.array(labSessionSchema),
});

export const startLabSchema = z.object({
  type: labTypeSchema,
  roleDirection: z.string().optional(),
});

export const submitLabSchema = z.object({
  content: z.string().min(1),
});

export const submitLabBySessionSchema = submitLabSchema.extend({
  sessionId: z.number().int().positive(),
});

export const learningPathSchema = z.object({
  role: z.string(),
  headline: z.string(),
  stages: z.array(
    z.object({
      title: z.string(),
      goal: z.string(),
      topics: z.array(z.string()),
      drill: z.string(),
    }),
  ),
});

export const learningPathListResponseSchema = z.object({
  activePath: learningPathSchema,
  paths: z.array(learningPathSchema),
});

export const experienceRoundSchema = z.object({
  id: z.number().optional(),
  order: z.number(),
  roundType: z.string(),
  durationMinutes: z.number().nullable(),
  interviewerStyle: z.string().nullable(),
  focusAreas: z.array(z.string()),
  questions: z.array(z.string()),
  notes: z.string().nullable(),
});

export const experienceReportSchema = z.object({
  id: z.number(),
  roleName: z.string(),
  level: z.string().nullable(),
  location: z.string().nullable(),
  interviewDate: z.string().nullable(),
  result: z.string(),
  difficulty: z.string(),
  sourceType: z.string(),
  confidence: z.string(),
  verified: z.boolean(),
  durationMinutes: z.number().nullable(),
  rawText: z.string(),
  summary: z.string().nullable(),
  tags: z.array(z.string()),
  company: companyOptionSchema.nullable(),
  rounds: z.array(experienceRoundSchema),
  updatedAt: z.string(),
});

export const createExperienceSchema = z.object({
  companyName: z.string().optional(),
  roleName: z.string().min(1),
  level: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  interviewDate: z.string().nullable().optional(),
  result: z.string().default("unknown"),
  difficulty: difficultySchema.default("medium"),
  sourceType: z.string().default("manual"),
  confidence: z.string().default("medium"),
  verified: z.boolean().default(false),
  durationMinutes: z.number().int().nullable().optional(),
  rawText: z.string().min(1),
  summary: z.string().nullable().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  rounds: z.array(experienceRoundSchema).default([]),
});

export const parseExperienceSchema = z.object({
  rawText: z.string().min(20),
  companyName: z.string().optional(),
  roleName: z.string().optional(),
});

export const experienceListResponseSchema = z.object({
  experiences: z.array(experienceReportSchema),
});

export const readinessSchema = z.object({
  jd: z.number(),
  coverage: z.number(),
  mock: z.number(),
  review: z.number(),
  experience: z.number().optional(),
  overall: z.number(),
});

export const companyIntelSchema = z.object({
  company: companyOptionSchema,
  readiness: readinessSchema.extend({
    experience: z.number(),
  }),
  reports: z.array(experienceReportSchema),
  knowledgeCards: z.array(knowledgeCardSchema),
  hotTopics: z.array(z.object({ name: z.string(), count: z.number() })),
  roundDistribution: z.array(z.object({ roundType: z.string(), count: z.number() })),
  highFrequencyQuestions: z.array(z.object({ question: z.string(), count: z.number(), roundType: z.string() })),
  roleNames: z.array(z.string()),
  nextActions: z.array(z.string()),
});

export const companyPrepSchema = z.object({
  company: companyOptionSchema,
  readiness: readinessSchema,
  jobTargets: z.array(jobTargetSchema),
  knowledgeCards: z.array(knowledgeCardSchema),
  sessions: z.array(interviewSessionSchema),
  reviewCards: z.array(reviewCardSchema),
  sprintPlans: z.array(sprintPlanSchema),
});
