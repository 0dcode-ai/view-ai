import type { z } from "zod";
import type {
  answerInterviewSchema,
  answerInterviewBySessionSchema,
  agentRunResponseSchema,
  agentRunSchema,
  applicationListResponseSchema,
  applicationMatchResponseSchema,
  applicationActivitySchema,
  applicationStageSchema,
  applicationSchema,
  agentConfigSchema,
  agentNameSchema,
  agentRunLogSchema,
  companyOptionSchema,
  companyIntelSchema,
  companyPrepSchema,
  createApplicationSchema,
  createResumeVersionSchema,
  createAgentRunLogSchema,
  createExperienceSchema,
  createKnowledgeSchema,
  createSourceDocumentSchema,
  evidenceRefSchema,
  experienceReportSchema,
  experienceListResponseSchema,
  generateSprintSchema,
  finishInterviewSchema,
  interviewerSessionAnswerResponseSchema,
  interviewerSessionFinishResponseSchema,
  interviewerSessionListResponseSchema,
  interviewerSessionStartResponseSchema,
  interviewerSessionConfigSchema,
  interviewerSessionContextSchema,
  interviewerSessionPlanSchema,
  interviewerSessionSummarySchema,
  interviewerTurnReviewSchema,
  interviewSessionSchema,
  labListResponseSchema,
  jobTargetSchema,
  keywordMatchItemSchema,
  knowledgeCardSchema,
  knowledgeListResponseSchema,
  labSessionSchema,
  learningPathListResponseSchema,
  learningPathSchema,
  parseExperienceSchema,
  parseJobTargetSchema,
  parseResumeSchema,
  questionTemplateSchema,
  jobTargetListResponseSchema,
  resumeListResponseSchema,
  resumeContentBlockSchema,
  resumeProfileSchema,
  resumeJobMatchReportSchema,
  resumeVersionListResponseSchema,
  resumeVersionSchema,
  reviewCardSchema,
  reviewListResponseSchema,
  sprintListResponseSchema,
  sprintPlanSchema,
  sprintTaskSchema,
  startInterviewSchema,
  startLabSchema,
  sourceDocumentSchema,
  sourceListResponseSchema,
  startInterviewerSessionSchema,
  answerInterviewerSessionSchema,
  submitLabBySessionSchema,
  submitLabSchema,
  topicOptionSchema,
  updateAgentConfigSchema,
  updateApplicationSchema,
  updateResumeVersionSchema,
  updateReviewSchema,
  updateResumeSchema,
  updateKnowledgeProgressSchema,
  updateKnowledgeSchema,
} from "./schemas.js";

export type AgentName = z.infer<typeof agentNameSchema>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type AgentRunLog = z.infer<typeof agentRunLogSchema>;
export type UpdateAgentConfigInput = z.infer<typeof updateAgentConfigSchema>;
export type CreateAgentRunLogInput = z.infer<typeof createAgentRunLogSchema>;
export type AgentRunInput = z.infer<typeof agentRunSchema>;
export type AgentRunResponse = z.infer<typeof agentRunResponseSchema>;
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;
export type CompanyOption = z.infer<typeof companyOptionSchema>;
export type TopicOption = z.infer<typeof topicOptionSchema>;
export type KnowledgeCard = z.infer<typeof knowledgeCardSchema>;
export type KnowledgeListResponse = z.infer<typeof knowledgeListResponseSchema>;
export type QuestionTemplate = z.infer<typeof questionTemplateSchema>;
export type ResumeProfile = z.infer<typeof resumeProfileSchema>;
export type ResumeListResponse = z.infer<typeof resumeListResponseSchema>;
export type JobTarget = z.infer<typeof jobTargetSchema>;
export type JobTargetListResponse = z.infer<typeof jobTargetListResponseSchema>;
export type Application = z.infer<typeof applicationSchema>;
export type ApplicationListResponse = z.infer<typeof applicationListResponseSchema>;
export type ApplicationStage = z.infer<typeof applicationStageSchema>;
export type ApplicationActivity = z.infer<typeof applicationActivitySchema>;
export type ApplicationMatchResponse = z.infer<typeof applicationMatchResponseSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ResumeContentBlock = z.infer<typeof resumeContentBlockSchema>;
export type KeywordMatchItem = z.infer<typeof keywordMatchItemSchema>;
export type ResumeJobMatchReport = z.infer<typeof resumeJobMatchReportSchema>;
export type ResumeVersion = z.infer<typeof resumeVersionSchema>;
export type ResumeVersionListResponse = z.infer<typeof resumeVersionListResponseSchema>;
export type CreateResumeVersionInput = z.infer<typeof createResumeVersionSchema>;
export type UpdateResumeVersionInput = z.infer<typeof updateResumeVersionSchema>;
export type SourceDocument = z.infer<typeof sourceDocumentSchema>;
export type SourceListResponse = z.infer<typeof sourceListResponseSchema>;
export type CreateSourceDocumentInput = z.infer<typeof createSourceDocumentSchema>;
export type InterviewSession = z.infer<typeof interviewSessionSchema>;
export type InterviewerSession = z.infer<typeof interviewSessionSchema>;
export type InterviewerSessionConfig = z.infer<typeof interviewerSessionConfigSchema>;
export type InterviewerSessionContext = z.infer<typeof interviewerSessionContextSchema>;
export type InterviewerSessionPlan = z.infer<typeof interviewerSessionPlanSchema>;
export type InterviewerTurnReview = z.infer<typeof interviewerTurnReviewSchema>;
export type InterviewerSessionSummary = z.infer<typeof interviewerSessionSummarySchema>;
export type ReviewCard = z.infer<typeof reviewCardSchema>;
export type SprintTask = z.infer<typeof sprintTaskSchema>;
export type SprintPlan = z.infer<typeof sprintPlanSchema>;
export type LabSession = z.infer<typeof labSessionSchema>;
export type LabListResponse = z.infer<typeof labListResponseSchema>;
export type ExperienceReport = z.infer<typeof experienceReportSchema>;
export type ExperienceListResponse = z.infer<typeof experienceListResponseSchema>;

export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;
export type UpdateKnowledgeProgressInput = z.infer<typeof updateKnowledgeProgressSchema>;
export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeSchema>;
export type ParseResumeInput = z.infer<typeof parseResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
export type ParseJobTargetInput = z.infer<typeof parseJobTargetSchema>;
export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
export type AnswerInterviewInput = z.infer<typeof answerInterviewSchema>;
export type AnswerInterviewBySessionInput = z.infer<typeof answerInterviewBySessionSchema>;
export type FinishInterviewInput = z.infer<typeof finishInterviewSchema>;
export type StartInterviewerSessionInput = z.infer<typeof startInterviewerSessionSchema>;
export type AnswerInterviewerSessionInput = z.infer<typeof answerInterviewerSessionSchema>;
export type InterviewerSessionListResponse = z.infer<typeof interviewerSessionListResponseSchema>;
export type InterviewerSessionStartResponse = z.infer<typeof interviewerSessionStartResponseSchema>;
export type InterviewerSessionAnswerResponse = z.infer<typeof interviewerSessionAnswerResponseSchema>;
export type InterviewerSessionFinishResponse = z.infer<typeof interviewerSessionFinishResponseSchema>;
export type ReviewListResponse = z.infer<typeof reviewListResponseSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type SprintListResponse = z.infer<typeof sprintListResponseSchema>;
export type GenerateSprintInput = z.infer<typeof generateSprintSchema>;
export type StartLabInput = z.infer<typeof startLabSchema>;
export type SubmitLabInput = z.infer<typeof submitLabSchema>;
export type SubmitLabBySessionInput = z.infer<typeof submitLabBySessionSchema>;
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

export type LearningPath = z.infer<typeof learningPathSchema>;
export type LearningPathListResponse = z.infer<typeof learningPathListResponseSchema>;

export type CompanyIntel = z.infer<typeof companyIntelSchema>;
export type CompanyPrep = z.infer<typeof companyPrepSchema>;
