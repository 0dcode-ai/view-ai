import {
  Home,
  BookOpen,
  BarChart3,
  BookMarked,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Code2,
  FileText,
  GitBranch,
  MessageSquareText,
  Newspaper,
  Rocket,
  UserRound,
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
  candidatePrep: CandidatePrep | null;
  updatedAt: string;
};

export type CandidatePrep = {
  headline: string;
  resumeHighlights: string[];
  selfIntro90s: string;
  projectTalkTracks: Array<{
    project: string;
    whyItMatters: string;
    deepDivePoints: string[];
    proofPoints: string[];
  }>;
  riskPoints: string[];
  followUpQuestions: string[];
  jobAlignment: string[];
};

export type CandidatePrepExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
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

export type EvidenceRef = {
  sourceId?: number | null;
  chunkId?: number | null;
  quote: string;
  reason: string;
};

export type AgentExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
  latencyMs: number;
};

export type ApplicationProgress = {
  resumeReady: number;
  jdReady: number;
  mockReady: number;
  reviewReady: number;
  sourceReady: number;
  overall: number;
  nextActions: string[];
};

export type ApplicationStage = "saved" | "preparing" | "applied" | "interviewing" | "offer" | "closed";

export type KeywordMatchItem = {
  keyword: string;
  category: string;
  required: boolean;
  found: boolean;
  evidence: EvidenceRef[];
  suggestion: string;
};

export type ResumeJobMatchReport = {
  matchScore: number;
  includedKeywords: KeywordMatchItem[];
  missingKeywords: KeywordMatchItem[];
  requiredKeywords: KeywordMatchItem[];
  suggestedBullets: Array<{ keyword: string; bullet: string; reason: string }>;
  summary: string;
  usedFallback: boolean;
};

export type ResumeContentBlock = {
  id: string;
  type: string;
  title: string;
  content: string;
  enabled: boolean;
  keywords: string[];
};

export type ResumeVersion = {
  id: number;
  applicationId: number;
  resumeProfileId: number | null;
  title: string;
  content: string;
  blocks: ResumeContentBlock[];
  matchReport: ResumeJobMatchReport | null;
  suggestions: Record<string, unknown>;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationActivity = {
  id: number;
  applicationId: number;
  type: string;
  title: string;
  detail: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ApplicationDashboardMetrics = {
  total: number;
  active: number;
  archived: number;
  byStage: Record<string, number>;
  averageMatchScore: number;
};

export type Application = {
  id: number;
  title: string;
  roleName: string;
  level: string;
  salaryK: number | null;
  salaryMinK: number | null;
  salaryMaxK: number | null;
  status: string;
  stage: ApplicationStage;
  jobUrl: string | null;
  location: string | null;
  source: string | null;
  priority: number;
  archived: boolean;
  appliedAt: string | null;
  followUpAt: string | null;
  deadlineAt: string | null;
  contactName: string | null;
  contactEmail: string | null;
  jdSnapshot: string | null;
  matchReport: ResumeJobMatchReport | null;
  interviewDate: string | null;
  progress: ApplicationProgress;
  nextAction: string | null;
  note: string | null;
  company: CompanyOption | null;
  resumeProfile: ResumeProfile | null;
  jobTarget: JobTarget | null;
  activities?: ApplicationActivity[];
  resumeVersions?: ResumeVersion[];
  updatedAt: string;
};

export type SourceDocument = {
  id: number;
  title: string;
  sourceType: string;
  content: string;
  metadata: Record<string, unknown>;
  application: { id: number; title: string; roleName: string } | null;
  chunks?: Array<{
    id: number;
    chunkIndex: number;
    content: string;
    tokenCount: number;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type AgentRunResponse = {
  output: Record<string, unknown>;
  execution: AgentExecution;
  evidence: EvidenceRef[];
};

export type AgentConfig = {
  id: number;
  agentName: string;
  displayName: string | null;
  enabled: boolean;
  model: string | null;
  config: Record<string, unknown>;
  prompt: Record<string, unknown>;
  updatedAt: string;
};

export type InterviewTurn = {
  id: number;
  order: number;
  question: string;
  questionSource: string | null;
  turnType?: "primary" | "followup" | "discussion" | null;
  parentTurnId?: number | null;
  intent?: string | null;
  answer: string | null;
  feedback: string | null;
  betterAnswer: string | null;
  idealAnswer?: string | null;
  transcriptSource: string;
  answerDurationSec: number | null;
  expression: Record<string, number | string>;
  score: Record<string, number>;
  review?: Record<string, unknown> | null;
};

export type InterviewerSessionConfig = {
  sessionKind: "mock_interviewer";
  answerVisibility: "toggle";
  scoringTiming: "final_only";
  inputMode: "text";
};

export type InterviewerSessionContext = {
  resumeText: string;
  parsedResume: {
    summary: string;
    skills: string[];
    experiences: string[];
    projects: string[];
    followUpQuestions: string[];
  };
  jdText: string | null;
  jdKeywords: string[];
  targetRole: string | null;
  seniority: "junior" | "mid" | "senior" | "staff";
  durationMinutes: 10 | 20 | 30 | 45;
};

export type InterviewerPlanTopic = {
  id: string;
  title: string;
  source: "resume" | "jd" | "general";
  kind: "project" | "skill" | "behavior" | "system" | "jd";
  intent: string;
  question: string;
  idealAnswer: string;
  asked: boolean;
  required: boolean;
};

export type InterviewerSessionPlan = {
  durationMinutes: 10 | 20 | 30 | 45;
  turnBudget: number;
  primaryQuestionBudget: number;
  followUpBudget: number;
  askedPrimaryCount: number;
  askedFollowUpCount: number;
  requiredProjectDeepDive: boolean;
  projectDeepDiveCovered: boolean;
  jdRequiredQuestionTarget: number;
  jdRequiredQuestionCount: number;
  currentTopicId: string | null;
  topics: InterviewerPlanTopic[];
};

export type InterviewerTurnReview = {
  dimensions: {
    accuracy: number;
    depth: number;
    structure: number;
    resumeGrounding: number;
    roleRelevance: number;
    clarity: number;
  };
  overallScore: number;
  feedback: string;
  betterAnswer: string;
  missedPoints: string[];
};

export type InterviewerSessionSummary = {
  overallScore: number;
  dimensionAverages: {
    accuracy: number;
    depth: number;
    structure: number;
    resumeGrounding: number;
    roleRelevance: number;
    clarity: number;
  };
  summary: string;
  strengths: string[];
  nextActions: string[];
  turns: Array<{
    turnId: number;
    order: number;
    question: string;
    answer: string | null;
    score: number;
    feedback: string;
    idealAnswer: string;
    missedPoints: string[];
  }>;
  questionReviews: Array<{
    turnId: number;
    order: number;
    question: string;
    score: number;
    feedback: string;
    idealAnswer: string;
    missedPoints: string[];
    answers: string[];
    followUps: string[];
  }>;
  discussionReviews: Array<{
    turnId: number;
    order: number;
    question: string;
    score: number;
    feedback: string;
    idealAnswer: string;
    missedPoints: string[];
    answers: string[];
  }>;
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
  application: { id: number; title: string; roleName: string } | null;
  company: CompanyOption | null;
  jobTarget: JobTarget | null;
  resumeProfile: ResumeProfile | null;
  context?: InterviewerSessionContext | null;
  config?: InterviewerSessionConfig | null;
  plan?: InterviewerSessionPlan | null;
  turns: InterviewTurn[];
  createdAt?: string;
  updatedAt: string;
};

export type ReviewCard = {
  id: number;
  title: string;
  weakness: string;
  suggestion: string;
  status: string;
  priority: number;
  dueAt: string | null;
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
  planId: number;
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

export type ArticleRecommendation = {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string;
  topic: string;
  level: "入门" | "进阶" | "深入";
  tags: string[];
  publishedAt: string | null;
};

export type ArticleSearchResponse = {
  query: string;
  sourceMode: string;
  articles: ArticleRecommendation[];
};

export type TechnicalArticleAsset = {
  id: number;
  articleId: number | null;
  url: string;
  filePath: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
};

export type TechnicalArticle = {
  id: number;
  title: string;
  topic: string | null;
  tags: string[];
  contentHtml: string;
  contentText: string;
  sourceUrl: string | null;
  summary: string | null;
  status: string;
  assets: TechnicalArticleAsset[];
  createdAt: string;
  updatedAt: string;
};

export type TechnicalArticleListResponse = {
  articles: TechnicalArticle[];
  topics: string[];
  tags: string[];
};

export type StartupIdea = {
  id: number;
  title: string;
  oneLiner: string;
  problem: string;
  targetUsers: string;
  solution: string;
  aiAgentFlow: string;
  dataSignals: string;
  monetization: string;
  validationPlan: string;
  risks: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type StartupIdeaListResponse = {
  ideas: StartupIdea[];
  tags: string[];
  statuses: string[];
};

export type GithubRepoAnalysis = {
  summary: string;
  whyTrending: string[];
  potentialReasons: string[];
  learningValue: string[];
  useCases: string[];
  riskSignals: string[];
  tags: string[];
  usedFallback?: boolean;
  model?: string;
};

export type GithubTrendSnapshot = {
  id: number;
  snapshotDate: string;
  rank: number;
  score: number;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string | null;
  query: string | null;
  topic: string | null;
  window: string | null;
  createdAt: string;
};

export type GithubTrendRepo = {
  id: number;
  githubId: number;
  fullName: string;
  owner: string;
  name: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string | null;
  homepage: string | null;
  language: string | null;
  topics: string[];
  license: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  defaultBranch: string | null;
  pushedAt: string | null;
  createdAtGithub: string | null;
  updatedAtGithub: string | null;
  archived: boolean;
  disabled: boolean;
  isFork: boolean;
  isFavorite: boolean;
  note: string;
  analysis: GithubRepoAnalysis | null;
  lastAnalyzedAt: string | null;
  firstSeenAt: string;
  createdAt: string;
  updatedAt: string;
  latestSnapshot: GithubTrendSnapshot | null;
  starDelta24h: number;
  starDelta7d: number;
  score: number;
  rank: number;
};

export type GithubRadarTopRepository = {
  id: number;
  fullName: string;
  score: number;
  rank: number;
  theme: string;
  starDelta24h: number;
  starDelta7d: number;
  tags: string[];
  dedupedCount: number;
  reason: string;
};

export type GithubRadarTheme = {
  key: string;
  label: string;
  repoCount: number;
  averageScore: number;
  average24hDelta: number;
  average7dDelta: number;
  languages: string[];
  leadRepos: Array<{
    id: number;
    fullName: string;
    score: number;
  }>;
  signals: string[];
};

export type GithubRadarBrief = {
  headline: string;
  summary: string;
  keySignals: string[];
  watchlist: string[];
  selectedRepoCount: number;
  dedupedRepoCount: number;
  uniqueThemeCount: number;
  topRepositories: GithubRadarTopRepository[];
  themeClusters: GithubRadarTheme[];
};

export type GithubRadarDigest = {
  title: string;
  summary: string;
  themeTakeaways: string[];
  opportunities: string[];
  risks: string[];
  recommendedActions: string[];
  watchItems: Array<{
    repoFullName: string;
    action: string;
    reason: string;
  }>;
  usedFallback?: boolean;
  model?: string;
};

export type GithubTrendListResponse = {
  repositories: GithubTrendRepo[];
  languages: string[];
  topics: string[];
  radar: GithubRadarBrief;
  meta: {
    snapshotDate: string;
    total: number;
    cacheHit: boolean;
  };
};

export type GithubRadarDigestResponse = {
  digest: GithubRadarDigest;
  execution: {
    model: string;
    usedFallback: boolean;
    steps: string[];
  };
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

export type TabKey = "home" | "applications" | "interviewer" | "interview" | "records" | "github" | "agents" | "articles" | "ideas" | "targets" | "prep" | "knowledge" | "resume" | "sprint" | "review" | "trends" | "lab";

export const pageLabels: Record<TabKey, string> = {
  applications: "求职机会",
  agents: "Agent 设置",
  records: "记录",
  articles: "技术文章",
  ideas: "创业想法",
  github: "开源趋势",
  home: "首页",
  targets: "准备",
  prep: "公司",
  knowledge: "八股",
  resume: "简历",
  interviewer: "面试官 Agent",
  interview: "模拟练习",
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

export const navItems: Array<{ key: TabKey; label: string; icon: typeof BookOpen; group: "core" | "hidden" }> = [
  { key: "home", label: "今日", icon: Home, group: "core" },
  { key: "applications", label: pageLabels.applications, icon: BriefcaseBusiness, group: "core" },
  { key: "interviewer", label: pageLabels.interviewer, icon: UserRound, group: "core" },
  { key: "interview", label: pageLabels.interview, icon: MessageSquareText, group: "core" },
  { key: "records", label: "知识库", icon: BookMarked, group: "core" },
  { key: "github", label: pageLabels.github, icon: GitBranch, group: "core" },
  { key: "ideas", label: pageLabels.ideas, icon: Rocket, group: "core" },
  { key: "agents", label: pageLabels.agents, icon: Rocket, group: "core" },
];

export const difficultyLabels: Record<string, string> = {
  easy: "基础",
  medium: "中等",
  hard: "困难",
};

export const masteryLabels = ["未学", "见过", "会背", "能结合项目", "能追问展开"];

export const navGroups = [
  { key: "core" as const, label: "核心" },
];
