import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const reviewStatusSchema = z.enum(["todo", "doing", "done"]);
export const labTypeSchema = z.enum(["coding", "system_design", "peer_mock"]);
export const deliveryModeSchema = z.enum(["text", "voice"]);
export const interviewModeSchema = z.enum(["technical", "project", "behavior", "system_design", "mixed"]);
export const roundTypeSchema = z.enum(["first_round", "second_round", "final_round", "hr_round"]);

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
  mastery: z.number().int().min(0).max(4),
  markReviewed: z.boolean().optional(),
  mistakeDelta: z.number().int().min(0).max(10).optional(),
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
  updatedAt: z.string(),
});

export const parseResumeSchema = z.object({
  title: z.string().default("我的简历"),
  rawText: z.string().min(20),
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

export const interviewTurnSchema = z.object({
  id: z.number(),
  order: z.number(),
  question: z.string(),
  questionSource: z.string().nullable(),
  answer: z.string().nullable(),
  feedback: z.string().nullable(),
  betterAnswer: z.string().nullable(),
  transcriptSource: z.string(),
  answerDurationSec: z.number().nullable(),
  expression: z.record(z.string(), z.union([z.number(), z.string()])),
  score: z.record(z.string(), z.number()),
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
  company: companyOptionSchema.nullable(),
  jobTarget: jobTargetSchema.nullable(),
  resumeProfile: resumeProfileSchema.nullable(),
  turns: z.array(interviewTurnSchema),
  updatedAt: z.string(),
});

export const startInterviewSchema = z.object({
  mode: interviewModeSchema.default("mixed"),
  roundType: roundTypeSchema.default("first_round"),
  deliveryMode: deliveryModeSchema.default("text"),
  targetCompanyName: z.string().optional(),
  targetRole: z.string().optional(),
  resumeProfileId: z.number().int().optional(),
  jobTargetId: z.number().int().optional(),
});

export const answerInterviewSchema = z.object({
  answer: z.string().min(1),
  transcriptSource: z.string().default("text"),
  answerDurationSec: z.number().int().positive().optional(),
  expression: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
});

export const reviewCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  weakness: z.string(),
  suggestion: z.string(),
  status: z.string(),
  priority: z.number(),
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

export const sprintTaskSchema = z.object({
  id: z.number(),
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

export const generateSprintSchema = z.object({
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

export const startLabSchema = z.object({
  type: labTypeSchema,
  roleDirection: z.string().optional(),
});

export const submitLabSchema = z.object({
  content: z.string().min(1),
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
  level: z.string().optional(),
  location: z.string().optional(),
  interviewDate: z.string().optional(),
  result: z.string().default("unknown"),
  difficulty: difficultySchema.default("medium"),
  sourceType: z.string().default("manual"),
  confidence: z.string().default("medium"),
  verified: z.boolean().default(false),
  durationMinutes: z.number().int().nullable().optional(),
  rawText: z.string().min(1),
  summary: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  rounds: z.array(experienceRoundSchema).default([]),
});

export const parseExperienceSchema = z.object({
  rawText: z.string().min(20),
  companyName: z.string().optional(),
  roleName: z.string().optional(),
});

