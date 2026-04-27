import type { z } from "zod";
import type {
  answerInterviewSchema,
  companyOptionSchema,
  createExperienceSchema,
  createKnowledgeSchema,
  experienceReportSchema,
  generateSprintSchema,
  interviewSessionSchema,
  jobTargetSchema,
  knowledgeCardSchema,
  labSessionSchema,
  parseExperienceSchema,
  parseJobTargetSchema,
  parseResumeSchema,
  questionTemplateSchema,
  resumeProfileSchema,
  reviewCardSchema,
  sprintPlanSchema,
  sprintTaskSchema,
  startInterviewSchema,
  startLabSchema,
  submitLabSchema,
  topicOptionSchema,
  updateKnowledgeProgressSchema,
} from "./schemas.js";

export type CompanyOption = z.infer<typeof companyOptionSchema>;
export type TopicOption = z.infer<typeof topicOptionSchema>;
export type KnowledgeCard = z.infer<typeof knowledgeCardSchema>;
export type QuestionTemplate = z.infer<typeof questionTemplateSchema>;
export type ResumeProfile = z.infer<typeof resumeProfileSchema>;
export type JobTarget = z.infer<typeof jobTargetSchema>;
export type InterviewSession = z.infer<typeof interviewSessionSchema>;
export type ReviewCard = z.infer<typeof reviewCardSchema>;
export type SprintTask = z.infer<typeof sprintTaskSchema>;
export type SprintPlan = z.infer<typeof sprintPlanSchema>;
export type LabSession = z.infer<typeof labSessionSchema>;
export type ExperienceReport = z.infer<typeof experienceReportSchema>;

export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;
export type UpdateKnowledgeProgressInput = z.infer<typeof updateKnowledgeProgressSchema>;
export type ParseResumeInput = z.infer<typeof parseResumeSchema>;
export type ParseJobTargetInput = z.infer<typeof parseJobTargetSchema>;
export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
export type AnswerInterviewInput = z.infer<typeof answerInterviewSchema>;
export type GenerateSprintInput = z.infer<typeof generateSprintSchema>;
export type StartLabInput = z.infer<typeof startLabSchema>;
export type SubmitLabInput = z.infer<typeof submitLabSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type ParseExperienceInput = z.infer<typeof parseExperienceSchema>;

export type DailyData = {
  summary: {
    dueKnowledge: number;
    todoReview: number;
    sprintTasks: number;
    total: number;
  };
  dueCards: KnowledgeCard[];
  reviewCards: ReviewCard[];
  sprintTasks: SprintTask[];
};

export type LearningPath = {
  role: string;
  headline: string;
  stages: Array<{
    title: string;
    goal: string;
    topics: string[];
    drill: string;
  }>;
};

export type CompanyIntel = {
  company: CompanyOption;
  hotTopics: Array<{ name: string; count: number }>;
  reports: ExperienceReport[];
  knowledgeCards: KnowledgeCard[];
};

export type CompanyPrep = {
  company: CompanyOption;
  jobTargets: JobTarget[];
  knowledgeCards: KnowledgeCard[];
  sessions: InterviewSession[];
  reviewCards: ReviewCard[];
  sprintPlans: SprintPlan[];
};

