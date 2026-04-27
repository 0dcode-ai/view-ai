import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Code2,
  FileText,
  MessageSquareText,
} from "lucide-react";
import type { InterviewMode, RoundType } from "@/lib/interview-modes";

export type CompanyOption = { id: number; name: string };
export type TopicOption = { id: number; name: string };

export type KnowledgeCard = {
  id: number;
  question: string;
  answer: string;
  roleDirection: string | null;
  questionType: string;
  abilityDimension: string;
  mastery: number;
  reviewCount: number;
  mistakeCount: number;
  priorityScore: number;
  nextReviewAt: string | null;
  tags: string[];
  difficulty: string;
  source: string | null;
  note: string | null;
  company: CompanyOption | null;
  topic: TopicOption | null;
  updatedAt: string;
};

export type ResumeProfile = {
  id: number;
  title: string;
  rawText: string;
  parsed: {
    summary: string;
    skills: string[];
    experiences: string[];
    projects: string[];
    followUpQuestions: string[];
  };
  followUpQuestions: string[];
  updatedAt: string;
};

export type JobTarget = {
  id: number;
  roleName: string;
  rawJd: string;
  parsed: {
    responsibilities: string[];
    requiredSkills: string[];
    bonusSkills: string[];
    riskPoints: string[];
    interviewFocus: string[];
  };
  match: {
    matchScore: number;
    strengths: string[];
    gaps: string[];
    projectTalkTracks: string[];
  };
  company: CompanyOption | null;
  resumeProfile: ResumeProfile | null;
  updatedAt: string;
};

export type InterviewTurn = {
  id: number;
  order: number;
  question: string;
  questionSource: string | null;
  answer: string | null;
  feedback: string | null;
  betterAnswer: string | null;
  transcriptSource: string;
  answerDurationSec: number | null;
  expression: Record<string, number | string>;
  score: Record<string, number>;
};

export type InterviewSession = {
  id: number;
  mode: InterviewMode;
  roundType: RoundType;
  deliveryMode: "text" | "voice";
  targetRole: string | null;
  status: string;
  summary: string | null;
  score: Record<string, number>;
  expression: Record<string, unknown>;
  company: CompanyOption | null;
  jobTarget: JobTarget | null;
  resumeProfile: ResumeProfile | null;
  turns: InterviewTurn[];
  updatedAt: string;
};

export type ReviewCard = {
  id: number;
  title: string;
  weakness: string;
  suggestion: string;
  status: string;
  priority: number;
  tags: string[];
  session: {
    id: number;
    mode: string;
    roundType: string;
    targetRole: string | null;
  } | null;
  knowledgeCard: KnowledgeCard | null;
};

export type SprintTask = {
  id: number;
  dayIndex: number;
  type: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  dueDate: string | null;
};

export type SprintPlan = {
  id: number;
  title: string;
  targetRole: string | null;
  interviewDate: string | null;
  days: number;
  status: string;
  summary: string | null;
  company: CompanyOption | null;
  jobTarget: JobTarget | null;
  resumeProfile: ResumeProfile | null;
  tasks: SprintTask[];
};

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

export type LabType = "coding" | "system_design" | "peer_mock";

export type LabSession = {
  id: number;
  type: LabType;
  roleDirection: string | null;
  title: string;
  prompt: string;
  starterCode: string | null;
  content: string | null;
  feedback: {
    score?: number;
    strengths?: string[];
    gaps?: string[];
    nextAction?: string;
  };
  status: string;
  updatedAt: string;
};

export type ExperienceRound = {
  id?: number;
  order: number;
  roundType: string;
  durationMinutes: number | null;
  interviewerStyle: string | null;
  focusAreas: string[];
  questions: string[];
  notes: string | null;
};

export type ExperienceReport = {
  id: number;
  roleName: string;
  level: string | null;
  location: string | null;
  interviewDate: string | null;
  result: string;
  difficulty: string;
  sourceType: string;
  confidence: string;
  verified: boolean;
  durationMinutes: number | null;
  rawText: string;
  summary: string | null;
  tags: string[];
  company: CompanyOption | null;
  rounds: ExperienceRound[];
  updatedAt: string;
};

export type ExperienceDraft = Omit<ExperienceReport, "id" | "company" | "updatedAt"> & {
  companyName: string;
};

export type CompanyIntel = {
  company: CompanyOption;
  readiness: {
    jd: number;
    coverage: number;
    mock: number;
    review: number;
    experience: number;
    overall: number;
  };
  reports: ExperienceReport[];
  knowledgeCards: KnowledgeCard[];
  roundDistribution: Array<{ roundType: string; count: number }>;
  highFrequencyQuestions: Array<{ question: string; count: number; roundType: string }>;
  roleNames: string[];
  nextActions: string[];
};

export type CompanyPrep = {
  company: CompanyOption;
  readiness: {
    jd: number;
    coverage: number;
    mock: number;
    review: number;
    overall: number;
  };
  jobTargets: JobTarget[];
  knowledgeCards: KnowledgeCard[];
  sessions: InterviewSession[];
  reviewCards: ReviewCard[];
  sprintPlans: SprintPlan[];
};

export type KnowledgeSuggestion = {
  companyName: string;
  topicName: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  questionType: string;
  abilityDimension: string;
  masterySuggestion: number;
  priorityScore: number;
  improvedAnswer: string;
  note: string;
};

export type KnowledgeForm = {
  question: string;
  answer: string;
  companyName: string;
  topicName: string;
  roleDirection: string;
  questionType: string;
  abilityDimension: string;
  mastery: number;
  priorityScore: number;
  tags: string;
  difficulty: "easy" | "medium" | "hard";
  source: string;
  note: string;
};

export type TabKey = "targets" | "prep" | "knowledge" | "resume" | "interview" | "sprint" | "review" | "trends" | "lab";

export const pageLabels: Record<TabKey, string> = {
  targets: "准备",
  prep: "公司",
  knowledge: "八股",
  resume: "简历",
  interview: "模拟",
  sprint: "计划",
  review: "复盘",
  trends: "趋势",
  lab: "实验室",
};

export const emptyKnowledgeForm: KnowledgeForm = {
  question: "",
  answer: "",
  companyName: "",
  topicName: "",
  roleDirection: "",
  questionType: "八股",
  abilityDimension: "基础知识",
  mastery: 0,
  priorityScore: 60,
  tags: "",
  difficulty: "medium",
  source: "",
  note: "",
};

export const navItems: Array<{ key: TabKey; label: string; icon: typeof BookOpen; group: "learn" | "practice" | "analyze" }> = [
  { key: "targets", label: pageLabels.targets, icon: BriefcaseBusiness, group: "learn" },
  { key: "knowledge", label: pageLabels.knowledge, icon: BookOpen, group: "learn" },
  { key: "resume", label: pageLabels.resume, icon: FileText, group: "learn" },
  { key: "interview", label: pageLabels.interview, icon: MessageSquareText, group: "practice" },
  { key: "lab", label: pageLabels.lab, icon: Code2, group: "practice" },
  { key: "prep", label: pageLabels.prep, icon: Building2, group: "analyze" },
  { key: "review", label: pageLabels.review, icon: ClipboardList, group: "analyze" },
];

export const difficultyLabels: Record<string, string> = {
  easy: "基础",
  medium: "中等",
  hard: "困难",
};

export const masteryLabels = ["未学", "见过", "会背", "能结合项目", "能追问展开"];

export const navGroups = [
  { key: "learn" as const, label: "学习" },
  { key: "practice" as const, label: "练习" },
  { key: "analyze" as const, label: "分析" },
];
