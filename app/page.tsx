"use client";

import {
  BarChart3,
  BookMarked,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Code2,
  Copy,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  ListChecks,
  MessageSquareText,
  Mic,
  Newspaper,
  Pencil,
  Plus,
  Play,
  RefreshCcw,
  Rocket,
  Save,
  Search,
  Send,
  Sparkles,
  Tags,
  Target,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  interviewModeLabels,
  roundTypeLabels,
  type InterviewMode,
  type RoundType,
} from "@/lib/interview-modes";
import {
  type CompanyOption,
  type AgentConfig,
  type AgentRunResponse,
  type Application,
  type ApplicationDashboardMetrics,
  type ApplicationStage,
  type CompanyIntel,
  type CompanyPrep,
  type CandidatePrep,
  type CandidatePrepExecution,
  type InterviewerSessionSummary,
  type StartupIdea,
  type StartupIdeaListResponse,
  type DailyData,
  type ExperienceDraft,
  type ExperienceReport,
  type GithubRadarBrief,
  type GithubRadarDigest,
  type GithubRadarDigestResponse,
  type GithubRepoAnalysis,
  type GithubTrendListResponse,
  type GithubTrendRepo,
  type InterviewSession,
  type JobTarget,
  type KnowledgeCard,
  type KnowledgeForm,
  type KnowledgeSuggestion,
  type LabSession,
  type LabType,
  type LearningPath,
  type ResumeProfile,
  type ResumeVersion,
  type ReviewCard,
  type SourceDocument,
  type SprintPlan,
  type SprintTask,
  type TabKey,
  type TopicOption,
  difficultyLabels,
  emptyKnowledgeForm,
  masteryLabels,
  pageLabels,
} from "@/app/types";
import {
  buildCandidateAnswerTemplate,
  buildCandidateFollowUpDrills,
  buildCandidateNextAnswerDraft,
  buildCandidateProofBank,
  buildCandidateRiskDrills,
  buildCandidateReadinessChecklist,
  buildCandidateWeaknessQueue,
  reviewCandidatePracticeAnswer,
  type CandidatePracticeReview,
} from "@/lib/candidate-practice";
import {
  requestJson,
  joinTags,
  formatDate,
  scoreOrDash,
} from "@/app/helpers";

import { cn } from "@/lib/utils";

import { Topbar } from "@/app/components/layout/topbar";
import { Panel } from "@/app/components/shared/panel";
import { MetricCard } from "@/app/components/shared/metric-card";
import { ScoreCard } from "@/app/components/shared/score-card";
import { Pill } from "@/app/components/shared/pill";
import { Field } from "@/app/components/shared/field";
import { DataGroup } from "@/app/components/shared/data-group";
import { TextList } from "@/app/components/shared/text-list";
import { LoadingSpinner } from "@/app/components/shared/loading-spinner";
import { ReviewList } from "@/app/components/review/review-list";
import { ExperienceList } from "@/app/components/review/experience-list";
import { SessionList } from "@/app/components/shared/session-list";
import { SprintList } from "@/app/components/shared/sprint-list";
import { LabList } from "@/app/components/lab/lab-list";
import { WeaknessList } from "@/app/components/trends/weakness-list";
import { ArticlesTab } from "@/app/components/articles/articles-tab";
import type { ArticlesTabRef } from "@/app/components/articles/articles-tab";

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[112px] resize-y leading-relaxed";
const btnPrimary = "flex items-center justify-center gap-2 rounded-lg bg-[linear-gradient(110deg,#18181b_0%,#3f3f46_62%,#a8a29e_100%)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-92 disabled:opacity-60";
const btnSecondary = "flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-60";
const btnGhost = "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft disabled:opacity-60";
const compactSelectCls = cn(inputCls, "!w-[170px] min-w-[170px]");
const heroGradientCls = "bg-[linear-gradient(110deg,#18181b_0%,#3f3f46_52%,#f5f5f4_100%)] shadow-[0_18px_40px_rgba(15,23,42,0.16)]";
const softGradientCls = "bg-[linear-gradient(135deg,#fafaf9_0%,#f5f5f4_50%,#e7e5e4_100%)]";
const progressGradientCls = "bg-[linear-gradient(90deg,#18181b_0%,#52525b_58%,#d6d3d1_100%)]";
const messageGradientCls = "bg-[linear-gradient(120deg,#18181b_0%,#3f3f46_62%,#71717a_100%)]";

type InterviewScript = {
  title: string;
  overview: string;
  interviewerBrief: string[];
  questions: Array<{
    order: number;
    question: string;
    intent: string;
    followUps: string[];
    strongSignals: string[];
    redFlags: string[];
  }>;
  rubric: Array<{
    dimension: string;
    good: string;
    average: string;
    weak: string;
  }>;
  closing: string;
  candidateTips: string[];
};

type StartupIdeaForm = {
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
  tags: string;
  status: string;
};

type StartupIdeaAgentIdea = Omit<StartupIdeaForm, "tags"> & {
  tags: string[];
};

type StartupIdeaAgentExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
};

type StartupIdeaAgentResponse = {
  idea: StartupIdeaAgentIdea;
  execution: StartupIdeaAgentExecution;
};

type CandidateSeniority = "junior" | "mid" | "senior" | "staff";
type InterviewDifficulty = "easy" | "medium" | "hard";

const seniorityOptions: Array<{ value: CandidateSeniority; label: string; hint: string }> = [
  { value: "junior", label: "初级工程师", hint: "0-2 年，重基础和项目参与度" },
  { value: "mid", label: "中级工程师", hint: "2-5 年，重独立交付和项目深度" },
  { value: "senior", label: "高级工程师", hint: "5 年+，重复杂问题、系统设计和带人" },
  { value: "staff", label: "资深/专家", hint: "技术负责人，重架构、影响力和业务判断" },
];

const difficultyCopy: Record<InterviewDifficulty, { label: string; tone: string; description: string }> = {
  easy: {
    label: "基础",
    tone: "校招/初级强度",
    description: "更关注基础概念、项目参与度、表达结构和常见场景。",
  },
  medium: {
    label: "中等",
    tone: "中级工程师强度",
    description: "会连续追问项目深度、技术取舍、线上问题和岗位匹配证据。",
  },
  hard: {
    label: "高难",
    tone: "高级/高薪强度",
    description: "会提高系统设计、复杂排障、架构取舍、业务影响力和反事实追问比例。",
  },
};

type RecordAgentCardDraft = {
  question: string;
  answer: string;
  topicName: string;
  tags: string[];
  questionType: string;
  abilityDimension: string;
  difficulty: "easy" | "medium" | "hard";
  masterySuggestion: number;
  priorityScore: number;
  note: string;
};

type RecordAgentExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
};

type RecordAgentResponse = {
  cardDraft: RecordAgentCardDraft;
  execution: RecordAgentExecution;
};

type CandidatePrepResponse = {
  prep: CandidatePrep;
  execution: CandidatePrepExecution;
};

type GithubTrendFilters = {
  q: string;
  topic: string;
  language: string;
  window: string;
  sort: string;
  favorite: string;
};

type GithubRepoAnalyzeResponse = {
  repository: GithubTrendRepo;
  analysis: GithubRepoAnalysis;
  execution: {
    model: string;
    usedFallback: boolean;
    steps: string[];
  };
};

const emptyGithubRadar: GithubRadarBrief = {
  headline: "还没有可分析的 GitHub 雷达数据",
  summary: "先刷新一次趋势榜，系统会基于仓库热度、增速和主题聚合生成一版优先级简报。",
  keySignals: [],
  watchlist: [],
  selectedRepoCount: 0,
  dedupedRepoCount: 0,
  uniqueThemeCount: 0,
  topRepositories: [],
  themeClusters: [],
};

const emptyGithubRadarDigest: GithubRadarDigest = {
  title: "",
  summary: "",
  themeTakeaways: [],
  opportunities: [],
  risks: [],
  recommendedActions: [],
  watchItems: [],
};

type ApplicationForm = {
  companyName: string;
  roleName: string;
  level: CandidateSeniority;
  salaryK: number;
  salaryMinK: number;
  salaryMaxK: number;
  status: string;
  stage: ApplicationStage;
  jobUrl: string;
  location: string;
  source: string;
  priority: number;
  appliedAt: string;
  followUpAt: string;
  deadlineAt: string;
  contactName: string;
  contactEmail: string;
  jdSnapshot: string;
  interviewDate: string;
  resumeProfileId: string;
  jobTargetId: string;
  note: string;
};

type ApplicationFilters = {
  q: string;
  stage: string;
  archived: string;
  sort: string;
};

type ApplicationDetailTab = "overview" | "jd" | "match" | "resume" | "prep" | "activity";

type SourceForm = {
  title: string;
  sourceType: "resume" | "jd" | "article" | "experience" | "github" | "note";
  content: string;
};

const emptyApplicationForm: ApplicationForm = {
  companyName: "",
  roleName: "",
  level: "mid",
  salaryK: 25,
  salaryMinK: 25,
  salaryMaxK: 35,
  status: "tracking",
  stage: "saved",
  jobUrl: "",
  location: "",
  source: "",
  priority: 70,
  appliedAt: "",
  followUpAt: "",
  deadlineAt: "",
  contactName: "",
  contactEmail: "",
  jdSnapshot: "",
  interviewDate: "",
  resumeProfileId: "",
  jobTargetId: "",
  note: "",
};

const emptySourceForm: SourceForm = {
  title: "",
  sourceType: "note",
  content: "",
};

const applicationStatusLabels: Record<string, string> = {
  tracking: "跟进中",
  preparing: "准备中",
  applied: "已投递",
  interviewing: "面试中",
  offer: "Offer",
  rejected: "已结束",
  paused: "暂停",
  archived: "已归档",
};

const applicationStageLabels: Record<ApplicationStage, string> = {
  saved: "已保存",
  preparing: "准备中",
  applied: "已投递",
  interviewing: "面试中",
  offer: "Offer",
  closed: "已结束",
};

const applicationStageOrder: ApplicationStage[] = ["saved", "preparing", "applied", "interviewing", "offer", "closed"];

type KnowledgeListResponse = {
  cards: KnowledgeCard[];
  companies: CompanyOption[];
  topics: TopicOption[];
  tags: string[];
};

const aiPodcastIdeaForm: StartupIdeaForm = {
  title: "AI 播客生成 Agent",
  oneLiner: "根据用户听歌习惯、播客收听历史和兴趣画像，自动生成一档专属 AI 播客。",
  problem: "用户想听更贴合自己状态和兴趣的内容，但通用播客推荐往往只解决“找节目”，没有解决“生成刚好适合此刻的内容”。音乐 App 知道用户情绪、节奏和偏好，播客平台知道用户知识兴趣，两者结合后可以做更个性化的音频内容。",
  targetUsers: "通勤、运动、睡前、学习时习惯听音频的人；喜欢播客但经常找不到合适内容的人；音乐和播客重度用户；希望被陪伴、被启发、被总结信息的人。",
  solution: "用户授权音乐和播客历史后，AI Agent 分析近期偏好、主题兴趣、情绪节奏和收听场景，自动生成一档定制播客。内容可以是资讯解读、知识陪伴、音乐故事、个人成长复盘，最终用 TTS 生成可播放节目。",
  aiAgentFlow: "1. 读取音乐偏好：曲风、节奏、歌手、情绪、收听时段。\n2. 读取播客历史：主题、节目长度、跳出点、收藏和完播内容。\n3. 构建用户音频画像：当下状态、兴趣领域、内容深度、语气偏好。\n4. 规划播客脚本：选题、结构、口播风格、背景音乐建议。\n5. 生成播客音频：TTS 多角色播报，可混入音乐片段说明或氛围声。\n6. 收听后学习反馈：根据跳过、重听、收藏继续优化 Agent。",
  dataSignals: "音乐收听历史、最近循环歌曲、收藏歌单、播客播放历史、完播率、跳过时间点、收藏/点赞、用户手动选择的主题、当前场景如通勤/运动/睡前/学习。",
  monetization: "订阅会员；按月生成专属节目；与音乐/播客平台合作；为创作者提供 AI 衍生节目工具；品牌赞助的定制音频内容。",
  validationPlan: "先做一个 Web Demo：用户手动输入最近爱听的歌、播客主题和想听场景，生成 3 分钟文字播客脚本。第二步接 TTS 生成音频。第三步做小范围用户测试，观察是否愿意反复听、收藏和分享。",
  risks: "音乐版权和平台数据授权；播客内容质量是否稳定；TTS 听感是否自然；用户是否真的需要“生成播客”而不是更好的推荐；隐私和个性化边界。",
  tags: "AI Agent，播客，音乐，个性化，TTS，消费应用",
  status: "idea",
};

const emptyStartupIdeaForm: StartupIdeaForm = {
  title: "",
  oneLiner: "",
  problem: "",
  targetUsers: "",
  solution: "",
  aiAgentFlow: "",
  dataSignals: "",
  monetization: "",
  validationPlan: "",
  risks: "",
  tags: "",
  status: "idea",
};

const emptyRecordAgentDraft: KnowledgeForm = {
  ...emptyKnowledgeForm,
  source: "快速记录 Agent",
  questionType: "八股",
  abilityDimension: "基础知识",
  mastery: 1,
  priorityScore: 72,
};

function startupIdeaToForm(idea: StartupIdea | StartupIdeaAgentIdea): StartupIdeaForm {
  return {
    title: idea.title,
    oneLiner: idea.oneLiner,
    problem: idea.problem,
    targetUsers: idea.targetUsers,
    solution: idea.solution,
    aiAgentFlow: idea.aiAgentFlow,
    dataSignals: idea.dataSignals,
    monetization: idea.monetization,
    validationPlan: idea.validationPlan,
    risks: idea.risks,
    tags: joinTags(idea.tags),
    status: idea.status,
  };
}

function recordAgentDraftToForm(draft: RecordAgentCardDraft): KnowledgeForm {
  return {
    question: draft.question,
    answer: draft.answer,
    companyName: "",
    topicName: draft.topicName,
    roleDirection: "",
    questionType: draft.questionType,
    abilityDimension: draft.abilityDimension,
    mastery: draft.masterySuggestion,
    priorityScore: draft.priorityScore,
    tags: joinTags(draft.tags),
    difficulty: draft.difficulty,
    source: "快速记录 Agent",
    note: draft.note,
  };
}

type CompactIdeaCardProps = {
  title: string;
  value?: string | null;
  className?: string;
  children?: ReactNode;
};

function splitIdeaWorkflow(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[\.\)、]|[-•])\s*/, "").trim())
    .filter(Boolean);
}

function CompactIdeaCard({ title, value, className, children }: CompactIdeaCardProps) {
  return (
    <article className={cn("rounded-xl border border-border bg-surface p-3.5 shadow-sm", className)}>
      <h4 className="text-[13px] font-semibold text-foreground">{title}</h4>
      <div className="mt-2">
        {children ?? (
          <div className="max-h-[172px] overflow-auto pr-1">
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-600">{value?.trim() || "待补充"}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function KeywordRow({ item }: { item: { keyword: string; category: string; required: boolean; suggestion?: string } }) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <strong className="text-sm text-slate-900">{item.keyword}</strong>
      <Pill>{item.category}</Pill>
      {item.required && <Pill variant="warn">必备</Pill>}
      {item.suggestion && <span className="min-w-[180px] flex-1 truncate text-xs text-muted-foreground">{item.suggestion}</span>}
    </div>
  );
}

function RepoMiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RepoSignalCard({ label, value, caption }: { label: string; value: number | string; caption: string }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{caption}</p>
    </article>
  );
}

function TextListOrEmpty({ values, emptyText = "暂无分析。" }: { values: string[]; emptyText?: string }) {
  if (values.length === 0) {
    return <p className="text-[13px] leading-6 text-slate-600">{emptyText}</p>;
  }

  return <TextList values={values} />;
}

function renderAgentSourceMix(sourceMix: unknown) {
  if (!sourceMix || typeof sourceMix !== "object") {
    return null;
  }

  const typed = sourceMix as { github?: number; other?: number };
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      来源结构：GitHub {String(typed.github ?? 0)} / 其他 {String(typed.other ?? 0)}
    </p>
  );
}

function labIcon(type: LabType) {
  if (type === "peer_mock") return <Users size={16} />;
  if (type === "system_design") return <GitBranch size={16} />;
  return <Code2 size={16} />;
}

function cardToKnowledgeForm(card: KnowledgeCard): KnowledgeForm {
  return {
    question: card.question,
    answer: card.answer,
    companyName: card.company?.name ?? "",
    topicName: card.topic?.name ?? "",
    roleDirection: card.roleDirection ?? "",
    questionType: card.questionType,
    abilityDimension: card.abilityDimension,
    mastery: card.mastery,
    priorityScore: card.priorityScore,
    tags: joinTags(card.tags),
    difficulty: card.difficulty === "easy" || card.difficulty === "hard" ? card.difficulty : "medium",
    source: card.source ?? "",
    note: card.note ?? "",
  };
}

function inferCandidateDifficulty(seniority: CandidateSeniority, salaryK: number): InterviewDifficulty {
  if (seniority === "staff" || salaryK >= 55) return "hard";
  if (seniority === "senior" || salaryK >= 35) return "hard";
  if (seniority === "mid" || salaryK >= 20) return "medium";
  return "easy";
}

function describeCandidateTarget(seniority: CandidateSeniority, salaryK: number) {
  const seniorityLabel = seniorityOptions.find((option) => option.value === seniority)?.label ?? "工程师";
  const difficulty = inferCandidateDifficulty(seniority, salaryK);
  const salaryLabel = salaryK > 0 ? `${salaryK}K/月` : "未填写薪资";
  return {
    seniorityLabel,
    salaryLabel,
    difficulty,
    difficultyLabel: difficultyCopy[difficulty].label,
    summary: `${seniorityLabel} · ${salaryLabel} · ${difficultyCopy[difficulty].label}难度`,
  };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("records");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [jobTargets, setJobTargets] = useState<JobTarget[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [sprintPlans, setSprintPlans] = useState<SprintPlan[]>([]);
  const [companyPrep, setCompanyPrep] = useState<CompanyPrep | null>(null);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [labSessions, setLabSessions] = useState<LabSession[]>([]);
  const [experiences, setExperiences] = useState<ExperienceReport[]>([]);
  const [companyIntel, setCompanyIntel] = useState<CompanyIntel | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [applicationForm, setApplicationForm] = useState<ApplicationForm>(emptyApplicationForm);
  const [applicationFilters, setApplicationFilters] = useState<ApplicationFilters>({ q: "", stage: "", archived: "false", sort: "priority" });
  const [applicationMetrics, setApplicationMetrics] = useState<ApplicationDashboardMetrics | null>(null);
  const [applicationDetailTab, setApplicationDetailTab] = useState<ApplicationDetailTab>("overview");
  const [applicationJdDraft, setApplicationJdDraft] = useState("");
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [sourceDocuments, setSourceDocuments] = useState<SourceDocument[]>([]);
  const [sourceForm, setSourceForm] = useState<SourceForm>(emptySourceForm);
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);
  const [agentRunResult, setAgentRunResult] = useState<AgentRunResponse | null>(null);

  const [filters, setFilters] = useState({ q: "", company: "", topic: "", mastery: "", questionType: "" });
  const [knowledgeForm, setKnowledgeForm] = useState<KnowledgeForm>(emptyKnowledgeForm);
  const [knowledgeEditForm, setKnowledgeEditForm] = useState<KnowledgeForm>(emptyKnowledgeForm);
  const [knowledgeSuggestion, setKnowledgeSuggestion] = useState<KnowledgeSuggestion | null>(null);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<number | null>(null);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<number | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [recordText, setRecordText] = useState("");
  const [recordContext, setRecordContext] = useState("");
  const [recordDraft, setRecordDraft] = useState<KnowledgeForm>(emptyRecordAgentDraft);
  const [recordAgentExecution, setRecordAgentExecution] = useState<RecordAgentExecution | null>(null);
  const [recordTagFilter, setRecordTagFilter] = useState("");
  const [knowledgeTags, setKnowledgeTags] = useState<string[]>([]);
  const [showRecordAgentEditor, setShowRecordAgentEditor] = useState(false);
  const [nowTs, setNowTs] = useState<number | null>(null);

  const [resumeTitle, setResumeTitle] = useState("我的简历");
  const [resumeRenameTitle, setResumeRenameTitle] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

  const [jdCompanyName, setJdCompanyName] = useState("");
  const [jdRoleName, setJdRoleName] = useState("");
  const [jdText, setJdText] = useState("");
  const [selectedJobTargetId, setSelectedJobTargetId] = useState<number | null>(null);
  const [prepCompanyId, setPrepCompanyId] = useState<number | null>(null);
  const [experienceCompanyName, setExperienceCompanyName] = useState("");
  const [experienceRoleName, setExperienceRoleName] = useState("");
  const [experienceText, setExperienceText] = useState("");
  const [experienceDraft, setExperienceDraft] = useState<ExperienceDraft | null>(null);
  const [experienceFilters, setExperienceFilters] = useState({ q: "", company: "", role: "", roundType: "", confidence: "" });

  const [interviewMode, setInterviewMode] = useState<InterviewMode>("mixed");
  const [roundType, setRoundType] = useState<RoundType>("first_round");
  const [deliveryMode, setDeliveryMode] = useState<"text" | "voice">("text");
  const [targetCompanyName, setTargetCompanyName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [voiceHint, setVoiceHint] = useState("");
  const [answerDurationSec, setAnswerDurationSec] = useState(90);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [interviewWorkspace, setInterviewWorkspace] = useState<"interviewer" | "candidate">("candidate");
  const [interviewerSession, setInterviewerSession] = useState<InterviewSession | null>(null);
  const [interviewerAnswerText, setInterviewerAnswerText] = useState("");
  const [interviewerResumeText, setInterviewerResumeText] = useState("");
  const [interviewerJdText, setInterviewerJdText] = useState("");
  const [interviewerRole, setInterviewerRole] = useState("");
  const [interviewerCompanyName, setInterviewerCompanyName] = useState("");
  const [interviewerDuration, setInterviewerDuration] = useState<10 | 20 | 30 | 45>(20);
  const [interviewerSeniority, setInterviewerSeniority] = useState<"junior" | "mid" | "senior" | "staff">("mid");
  const [interviewerSummary, setInterviewerSummary] = useState<InterviewerSessionSummary | null>(null);
  const [showInterviewerIdealAnswer, setShowInterviewerIdealAnswer] = useState(false);
  const [focusedInterviewerTurnId, setFocusedInterviewerTurnId] = useState<number | null>(null);
  const [interviewerDiscussionTitle, setInterviewerDiscussionTitle] = useState("");
  const [candidateSeniority, setCandidateSeniority] = useState<CandidateSeniority>("mid");
  const [candidateSalaryK, setCandidateSalaryK] = useState(25);
  const [scriptResumeText, setScriptResumeText] = useState("");
  const [scriptRoleName, setScriptRoleName] = useState("");
  const [scriptDirection, setScriptDirection] = useState("前端工程师");
  const [scriptDifficulty, setScriptDifficulty] = useState<InterviewDifficulty>("medium");
  const [scriptQuestionCount, setScriptQuestionCount] = useState(6);
  const [scriptFocus, setScriptFocus] = useState("");
  const [interviewScript, setInterviewScript] = useState<InterviewScript | null>(null);
  const [scriptPracticeIndex, setScriptPracticeIndex] = useState(0);
  const [scriptPracticeAnswer, setScriptPracticeAnswer] = useState("");
  const articlesRef = useRef<ArticlesTabRef>(null);
  const [scriptPracticeAnswers, setScriptPracticeAnswers] = useState<Record<number, string>>({});
  const [candidatePracticeReview, setCandidatePracticeReview] = useState<CandidatePracticeReview | null>(null);
  const [candidatePracticeReviews, setCandidatePracticeReviews] = useState<Record<number, CandidatePracticeReview>>({});
  const [candidatePracticeMode, setCandidatePracticeMode] = useState<"structure" | "followup" | "risk" | "proof" | "weakness" | "checklist">("structure");
  const [candidatePrepExecution, setCandidatePrepExecution] = useState<CandidatePrepExecution | null>(null);

  const [sprintDays, setSprintDays] = useState(7);
  const [interviewDate] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);

  const [reviewFilters, setReviewFilters] = useState({ company: "", topic: "", roundType: "", status: "" });
  const [labType, setLabType] = useState<LabType>("coding");
  const [labRole, setLabRole] = useState("");
  const [activeLabId, setActiveLabId] = useState<number | null>(null);
  const [labContent, setLabContent] = useState("");
  const [startupIdeas, setStartupIdeas] = useState<StartupIdea[]>([]);
  const [startupIdeaTags, setStartupIdeaTags] = useState<string[]>([]);
  const [startupIdeaStatuses, setStartupIdeaStatuses] = useState<string[]>([]);
  const [startupIdeaFilters, setStartupIdeaFilters] = useState({ q: "", status: "", tag: "" });
  const [selectedStartupIdeaId, setSelectedStartupIdeaId] = useState<number | null>(null);
  const [startupIdeaForm, setStartupIdeaForm] = useState<StartupIdeaForm>(aiPodcastIdeaForm);
  const [startupIdeaAgentInput, setStartupIdeaAgentInput] = useState("");
  const [startupIdeaAgentContext, setStartupIdeaAgentContext] = useState("");
  const [startupIdeaAgentExecution, setStartupIdeaAgentExecution] = useState<StartupIdeaAgentExecution | null>(null);
  const [editingStartupIdeaId, setEditingStartupIdeaId] = useState<number | null>(null);
  const [showStartupIdeaEditor, setShowStartupIdeaEditor] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GithubTrendRepo[]>([]);
  const [githubLanguages, setGithubLanguages] = useState<string[]>([]);
  const [githubTopics, setGithubTopics] = useState<string[]>([]);
  const [githubMeta, setGithubMeta] = useState<GithubTrendListResponse["meta"] | null>(null);
  const [githubRadar, setGithubRadar] = useState<GithubRadarBrief>(emptyGithubRadar);
  const [githubRadarDigest, setGithubRadarDigest] = useState<GithubRadarDigest>(emptyGithubRadarDigest);
  const [githubFilters, setGithubFilters] = useState<GithubTrendFilters>({
    q: "agent",
    topic: "AI Agent",
    language: "",
    window: "daily",
    sort: "score",
    favorite: "",
  });
  const [selectedGithubRepoId, setSelectedGithubRepoId] = useState<number | null>(null);
  const [githubNoteDraft, setGithubNoteDraft] = useState("");
  const [githubAnalyzeExecution, setGithubAnalyzeExecution] = useState<GithubRepoAnalyzeResponse["execution"] | null>(null);
  const [githubRadarExecution, setGithubRadarExecution] = useState<GithubRadarDigestResponse["execution"] | null>(null);

  const selectedResume = useMemo(() => {
    if (!selectedResumeId) return null;
    return resumes.find((r) => r.id === selectedResumeId) ?? null;
  }, [resumes, selectedResumeId]);

  const selectedJobTarget = useMemo(() => {
    if (!selectedJobTargetId) return null;
    return jobTargets.find((t) => t.id === selectedJobTargetId) ?? null;
  }, [jobTargets, selectedJobTargetId]);

  const selectedApplication = useMemo(() => {
    if (!selectedApplicationId) return applications[0] ?? null;
    return applications.find((application) => application.id === selectedApplicationId) ?? applications[0] ?? null;
  }, [applications, selectedApplicationId]);

  const primaryResumeVersion = useMemo(
    () => resumeVersions.find((version) => version.isPrimary) ?? resumeVersions[0] ?? null,
    [resumeVersions],
  );
  const selectedMatchReport = selectedApplication?.matchReport ?? primaryResumeVersion?.matchReport ?? null;

  const candidateTarget = useMemo(
    () => describeCandidateTarget(candidateSeniority, candidateSalaryK),
    [candidateSalaryK, candidateSeniority],
  );
  const currentScriptQuestion = interviewScript?.questions[scriptPracticeIndex] ?? null;
  const candidateProofBank = useMemo(
    () => buildCandidateProofBank(selectedResume?.candidatePrep ?? null),
    [selectedResume],
  );
  const candidateRiskDrills = useMemo(
    () => buildCandidateRiskDrills(selectedResume?.candidatePrep ?? null),
    [selectedResume],
  );
  const candidateFollowUpDrills = useMemo(
    () => buildCandidateFollowUpDrills(currentScriptQuestion, selectedResume?.candidatePrep ?? null),
    [currentScriptQuestion, selectedResume],
  );
  const candidateReadinessChecklist = useMemo(
    () => buildCandidateReadinessChecklist({
      prep: selectedResume?.candidatePrep ?? null,
      answeredCount: Object.keys(scriptPracticeAnswers).length,
      totalQuestionCount: interviewScript?.questions.length ?? 0,
      latestReview: candidatePracticeReview,
      proofBank: candidateProofBank,
    }),
    [candidatePracticeReview, candidateProofBank, interviewScript, scriptPracticeAnswers, selectedResume],
  );
  const candidateWeaknessQueue = useMemo(
    () => buildCandidateWeaknessQueue({
      questions: interviewScript?.questions ?? [],
      answers: scriptPracticeAnswers,
      reviews: candidatePracticeReviews,
    }),
    [candidatePracticeReviews, interviewScript, scriptPracticeAnswers],
  );

  const selectedKnowledgeCard = useMemo(() => {
    if (!selectedKnowledgeId) return cards[0] ?? null;
    return cards.find((card) => card.id === selectedKnowledgeId) ?? cards[0] ?? null;
  }, [cards, selectedKnowledgeId]);

  const recordCards = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const activeTag = recordTagFilter.trim().toLowerCase();
    return cards.filter((card) => {
      if (activeTag && !card.tags.some((tag) => tag.toLowerCase() === activeTag)) {
        return false;
      }
      if (!q) return true;
      const text = `${card.question} ${card.answer} ${card.tags.join(" ")} ${card.topic?.name ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [cards, filters.q, recordTagFilter]);

  const recordTagGroups = useMemo(() => {
    const preferredOrder = [
      "C",
      "C++",
      "Java",
      "Go",
      "Python",
      "JavaScript",
      "TypeScript",
      "React",
      "Vue",
      "Node.js",
      "MySQL",
      "Redis",
      "系统设计",
      "后端开发",
      "前端开发",
      "移动开发",
      "产品设计",
      "AI Agent",
      "八股",
    ];
    const tags = knowledgeTags.length ? knowledgeTags : Array.from(new Set(cards.flatMap((card) => card.tags)));
    const sorted = [...tags].sort((left, right) => {
      const leftIndex = preferredOrder.findIndex((tag) => tag.toLowerCase() === left.toLowerCase());
      const rightIndex = preferredOrder.findIndex((tag) => tag.toLowerCase() === right.toLowerCase());
      if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
      if (leftIndex >= 0) return -1;
      if (rightIndex >= 0) return 1;
      return left.localeCompare(right, "zh-Hans-CN");
    });

    const languageTags = sorted.filter((tag) => ["c", "c++", "java", "go", "python", "javascript", "typescript"].includes(tag.toLowerCase()));
    const stackTags = sorted.filter((tag) => ["react", "vue", "node.js", "mysql", "redis", "系统设计"].includes(tag.toLowerCase()));
    const roleTags = sorted.filter((tag) => ["后端开发", "前端开发", "移动开发", "产品设计", "ai agent", "八股"].includes(tag.toLowerCase()));
    const grouped = new Set([...languageTags, ...stackTags, ...roleTags].map((tag) => tag.toLowerCase()));
    const otherTags = sorted.filter((tag) => !grouped.has(tag.toLowerCase()));

    return [
      { title: "语言", tags: languageTags },
      { title: "技术栈", tags: stackTags },
      { title: "方向", tags: roleTags },
      { title: "其他", tags: otherTags.slice(0, 18) },
    ].filter((group) => group.tags.length > 0);
  }, [cards, knowledgeTags]);

  const reviewQueue = useMemo(
    () =>
      [...cards]
        .filter((card) => {
          if (card.mastery < 3 || !card.nextReviewAt) {
            return true;
          }

          if (nowTs === null) {
            return false;
          }

          return new Date(card.nextReviewAt).getTime() <= nowTs;
        })
        .sort((a, b) => b.priorityScore - a.priorityScore || a.mastery - b.mastery),
    [cards, nowTs],
  );

  const selectedSessionDetail = useMemo(() => {
    if (!selectedSessionId) return sessions[0] ?? activeSession;
    return sessions.find((session) => session.id === selectedSessionId) ?? activeSession;
  }, [activeSession, selectedSessionId, sessions]);

  const openTurn = activeSession?.turns.find((turn) => !turn.answer) ?? null;
  const answeredTurns = activeSession?.turns.filter((turn) => turn.answer).length ?? 0;
  const interviewerPrimaryTurns = useMemo(
    () => interviewerSession?.turns.filter((turn) => turn.turnType === "primary") ?? [],
    [interviewerSession],
  );
  const interviewerDiscussionTurns = useMemo(
    () => interviewerSession?.turns.filter((turn) => turn.turnType === "discussion") ?? [],
    [interviewerSession],
  );
  const interviewerFocusedTurn = useMemo(
    () => interviewerSession?.turns.find((turn) => turn.id === focusedInterviewerTurnId) ?? interviewerPrimaryTurns[0] ?? interviewerDiscussionTurns[0] ?? null,
    [focusedInterviewerTurnId, interviewerDiscussionTurns, interviewerPrimaryTurns, interviewerSession],
  );
  const interviewerPrimaryCoveredCount = interviewerPrimaryTurns.filter((turn) => turn.answer?.trim()).length;
  const interviewerTotalBudget = interviewerSession?.plan?.primaryQuestionBudget ?? interviewerPrimaryTurns.length ?? 0;
  const todoReviewCount = reviewCards.filter((c) => c.status === "todo").length;
  const lowMasteryCount = cards.filter((c) => c.mastery < 3).length;
  const sprintDoneRate = useMemo(() => {
    const tasks = sprintPlans.flatMap((p) => p.tasks);
    return tasks.length ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0;
  }, [sprintPlans]);
  const averageInterviewScore = useMemo(() => {
    const values = sessions.map((s) => s.score.overall).filter((v): v is number => typeof v === "number");
    return values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;
  }, [sessions]);
  const latestFinishedSession = useMemo(
    () => sessions.find((s) => s.status === "finished" && s.summary) ?? null,
    [sessions],
  );
  const activeLab = useMemo(() => {
    if (!activeLabId) return labSessions[0] ?? null;
    return labSessions.find((s) => s.id === activeLabId) ?? labSessions[0] ?? null;
  }, [activeLabId, labSessions]);
  const selectedSprintPlan = useMemo(() => {
    if (!selectedSprintId) return sprintPlans[0] ?? null;
    return sprintPlans.find((plan) => plan.id === selectedSprintId) ?? sprintPlans[0] ?? null;
  }, [selectedSprintId, sprintPlans]);
  const selectedStartupIdea = useMemo(() => {
    if (!selectedStartupIdeaId) return startupIdeas[0] ?? null;
    return startupIdeas.find((idea) => idea.id === selectedStartupIdeaId) ?? startupIdeas[0] ?? null;
  }, [selectedStartupIdeaId, startupIdeas]);
  const selectedGithubRepo = useMemo(() => {
    if (!selectedGithubRepoId) return githubRepos[0] ?? null;
    return githubRepos.find((repo) => repo.id === selectedGithubRepoId) ?? githubRepos[0] ?? null;
  }, [githubRepos, selectedGithubRepoId]);
  const selectedSprintStats = useMemo(() => {
    const tasks = selectedSprintPlan?.tasks ?? [];
    const done = tasks.filter((task) => task.status === "done").length;
    const doing = tasks.filter((task) => task.status === "doing").length;
    return {
      total: tasks.length,
      done,
      doing,
      todo: tasks.filter((task) => task.status === "todo").length,
      rate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [selectedSprintPlan]);
  const selectedSprintTasksByDay = useMemo(() => {
    const groups = new Map<number, SprintTask[]>();
    (selectedSprintPlan?.tasks ?? []).forEach((task) => {
      const tasks = groups.get(task.dayIndex) ?? [];
      tasks.push(task);
      groups.set(task.dayIndex, tasks);
    });
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [selectedSprintPlan]);
  const interviewTimeline = useMemo(
    () =>
      sessions
        .filter((session) => session.status === "finished" && typeof session.score.overall === "number")
        .slice(0, 8)
        .reverse(),
    [sessions],
  );
  const masteryRows = useMemo(
    () =>
      masteryLabels.map((label, mastery) => ({
        label,
        count: cards.filter((card) => card.mastery === mastery).length,
      })),
    [cards],
  );
  const sprintProgressRows = useMemo(
    () =>
      sprintPlans.slice(0, 6).map((plan) => {
        const total = plan.tasks.length;
        const done = plan.tasks.filter((task) => task.status === "done").length;
        return {
          id: plan.id,
          label: plan.title,
          value: total ? Math.round((done / total) * 100) : 0,
          caption: `${done}/${total}`,
        };
      }),
    [sprintPlans],
  );
  const readinessRows = useMemo(
    () => [
      { label: "JD 匹配", value: companyIntel?.readiness.jd ?? companyPrep?.readiness.jd ?? selectedJobTarget?.match.matchScore ?? 0 },
      { label: "题库覆盖", value: companyIntel?.readiness.coverage ?? companyPrep?.readiness.coverage ?? 0 },
      { label: "模拟训练", value: companyIntel?.readiness.mock ?? companyPrep?.readiness.mock ?? averageInterviewScore },
      { label: "复盘清理", value: companyIntel?.readiness.review ?? companyPrep?.readiness.review ?? (reviewCards.length ? Math.round(((reviewCards.length - todoReviewCount) / reviewCards.length) * 100) : 0) },
      { label: "冲刺进度", value: sprintDoneRate },
    ],
    [averageInterviewScore, companyIntel, companyPrep, reviewCards.length, selectedJobTarget, sprintDoneRate, todoReviewCount],
  );

  useEffect(() => {
    const savedTab = window.localStorage.getItem("interview-ai-active-tab");
    if (savedTab && pageLabels[savedTab as TabKey]) {
      setActiveTab(savedTab as TabKey);
    }

    const savedWorkspace = window.localStorage.getItem("interview-ai-interview-workspace");
    if (savedWorkspace === "candidate" || savedWorkspace === "interviewer") {
      setInterviewWorkspace(savedWorkspace);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "interview") {
      setInterviewWorkspace("candidate");
    }
  }, [activeTab]);

  useEffect(() => {
    window.localStorage.setItem("interview-ai-active-tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    window.localStorage.setItem("interview-ai-interview-workspace", interviewWorkspace);
  }, [interviewWorkspace]);

  useEffect(() => { void refreshAll(); }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!selectedJobTarget) return;
    setTargetCompanyName(selectedJobTarget.company?.name ?? "");
    setTargetRole(selectedJobTarget.roleName);
    setPrepCompanyId(selectedJobTarget.company?.id ?? prepCompanyId);
  }, [selectedJobTarget]);

  useEffect(() => {
    if (!selectedResume) {
      setResumeRenameTitle("");
      return;
    }
    setResumeRenameTitle(selectedResume.title);
  }, [selectedResume]);

  useEffect(() => {
    setNowTs(Date.now());
  }, []);

  useEffect(() => {
    if (!selectedKnowledgeId && cards[0]) {
      setSelectedKnowledgeId(cards[0].id);
    }
    if (selectedKnowledgeId && !cards.some((card) => card.id === selectedKnowledgeId)) {
      setSelectedKnowledgeId(cards[0]?.id ?? null);
    }
  }, [cards, selectedKnowledgeId]);

  useEffect(() => {
    if (!selectedSessionId && sessions[0]) {
      setSelectedSessionId(sessions[0].id);
    }
    if (selectedSessionId && !sessions.some((session) => session.id === selectedSessionId)) {
      setSelectedSessionId(sessions[0]?.id ?? null);
    }
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    if (!selectedSprintId && sprintPlans[0]) {
      setSelectedSprintId(sprintPlans[0].id);
    }
    if (selectedSprintId && !sprintPlans.some((plan) => plan.id === selectedSprintId)) {
      setSelectedSprintId(sprintPlans[0]?.id ?? null);
    }
  }, [selectedSprintId, sprintPlans]);

  useEffect(() => {
    if (!selectedStartupIdeaId && startupIdeas[0]) {
      setSelectedStartupIdeaId(startupIdeas[0].id);
    }
    if (selectedStartupIdeaId && !startupIdeas.some((idea) => idea.id === selectedStartupIdeaId)) {
      setSelectedStartupIdeaId(startupIdeas[0]?.id ?? null);
    }
  }, [selectedStartupIdeaId, startupIdeas]);

  useEffect(() => {
    if (!selectedGithubRepoId && githubRepos[0]) {
      setSelectedGithubRepoId(githubRepos[0].id);
    }
    if (selectedGithubRepoId && !githubRepos.some((repo) => repo.id === selectedGithubRepoId)) {
      setSelectedGithubRepoId(githubRepos[0]?.id ?? null);
    }
  }, [githubRepos, selectedGithubRepoId]);

  useEffect(() => {
    if (!selectedApplicationId && applications[0]) {
      setSelectedApplicationId(applications[0].id);
    }
    if (selectedApplicationId && !applications.some((application) => application.id === selectedApplicationId)) {
      setSelectedApplicationId(applications[0]?.id ?? null);
    }
  }, [applications, selectedApplicationId]);

  useEffect(() => {
    if (!selectedApplication) return;
    setSelectedResumeId((current) => selectedApplication.resumeProfile?.id ?? current);
    setSelectedJobTargetId((current) => selectedApplication.jobTarget?.id ?? current);
    setTargetCompanyName(selectedApplication.company?.name ?? targetCompanyName);
    setTargetRole(selectedApplication.roleName);
    setCandidateSeniority((selectedApplication.level as CandidateSeniority) || "mid");
    setCandidateSalaryK(selectedApplication.salaryK ?? candidateSalaryK);
    setApplicationJdDraft(selectedApplication.jdSnapshot ?? selectedApplication.jobTarget?.rawJd ?? "");
    void loadSources(selectedApplication.id);
    void loadResumeVersions(selectedApplication.id);
  }, [selectedApplication?.id]);

  useEffect(() => {
    setGithubNoteDraft(selectedGithubRepo?.note ?? "");
  }, [selectedGithubRepo?.id, selectedGithubRepo?.note]);

  useEffect(() => {
    if (activeLab) setLabContent(activeLab.content ?? activeLab.starterCode ?? "");
  }, [activeLab]);

  async function loadStartupIdeas(nextFilters = startupIdeaFilters) {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const payload = await requestJson<StartupIdeaListResponse>(`/api/startup-ideas${params.toString() ? `?${params.toString()}` : ""}`);
    setStartupIdeas(payload.ideas);
    setStartupIdeaTags(payload.tags);
    setStartupIdeaStatuses(payload.statuses);
  }

  async function loadGithubTrends(nextFilters = githubFilters) {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const payload = await requestJson<GithubTrendListResponse>(`/api/github-trends${params.toString() ? `?${params.toString()}` : ""}`);
    setGithubRepos(payload.repositories);
    setGithubLanguages(payload.languages);
    setGithubTopics(payload.topics);
    setGithubRadar(payload.radar);
    setGithubMeta(payload.meta);
  }

  async function refreshAll() {
    await Promise.allSettled([
      loadKnowledge(), loadResumes(), loadJobTargets(), loadReviews(),
      loadSprints(), loadSessions(), loadDaily(), loadLearningPath(),
      loadLabs(), loadExperiences(), loadApplications(), loadAgentConfigs(),
      articlesRef.current?.refresh(), loadStartupIdeas(), loadGithubTrends(),
    ]);
  }

  async function loadApplications(nextFilters = applicationFilters) {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const payload = await requestJson<{ applications: Application[]; metrics?: ApplicationDashboardMetrics }>(
      `/api/applications${params.toString() ? `?${params.toString()}` : ""}`,
    );
    setApplications(payload.applications);
    setApplicationMetrics(payload.metrics ?? null);
    setSelectedApplicationId((current) => current ?? payload.applications[0]?.id ?? null);
  }

  async function loadSources(applicationId = selectedApplication?.id) {
    const params = new URLSearchParams();
    if (applicationId) params.set("applicationId", String(applicationId));
    const payload = await requestJson<{ sources: SourceDocument[] }>(`/api/sources${params.toString() ? `?${params.toString()}` : ""}`);
    setSourceDocuments(payload.sources);
  }

  async function loadResumeVersions(applicationId = selectedApplication?.id) {
    if (!applicationId) {
      setResumeVersions([]);
      return;
    }
    const payload = await requestJson<{ resumeVersions: ResumeVersion[] }>(`/api/applications/${applicationId}/resume-versions`);
    setResumeVersions(payload.resumeVersions);
  }

  async function loadAgentConfigs() {
    const payload = await requestJson<{ agents: AgentConfig[] }>("/api/agents");
    setAgentConfigs(payload.agents);
  }

  async function loadKnowledge(nextFilters = filters) {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const payload = await requestJson<KnowledgeListResponse>(
      `/api/knowledge${params.toString() ? `?${params.toString()}` : ""}`,
    );
    setCards(payload.cards);
    setCompanies(payload.companies);
    setTopics(payload.topics);
    setKnowledgeTags(payload.tags);
    setPrepCompanyId((c) => c ?? payload.companies[0]?.id ?? null);
  }

  async function loadResumes() {
    const payload = await requestJson<{ resumes: ResumeProfile[] }>("/api/resumes");
    setResumes(payload.resumes);
    setSelectedResumeId((c) => c ?? payload.resumes[0]?.id ?? null);
  }

  async function loadJobTargets() {
    const payload = await requestJson<{ jobTargets: JobTarget[] }>("/api/job-targets");
    setJobTargets(payload.jobTargets);
    setSelectedJobTargetId((c) => c ?? payload.jobTargets[0]?.id ?? null);
  }

  async function loadSessions() {
    const payload = await requestJson<{ sessions: InterviewSession[] }>("/api/interviews");
    setSessions(payload.sessions);
    setSelectedSessionId((current) => current ?? payload.sessions[0]?.id ?? null);
  }

  async function loadReviews(nextFilters = reviewFilters) {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const payload = await requestJson<{ reviewCards: ReviewCard[] }>(
      `/api/reviews${params.toString() ? `?${params.toString()}` : ""}`,
    );
    setReviewCards(payload.reviewCards);
  }

  async function loadSprints() {
    const payload = await requestJson<{ sprintPlans: SprintPlan[] }>("/api/sprints");
    setSprintPlans(payload.sprintPlans);
  }

  async function loadDaily() {
    const payload = await requestJson<DailyData>("/api/daily");
    setDailyData(payload);
  }

  async function loadLearningPath(role = selectedJobTarget?.roleName ?? targetRole) {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    const payload = await requestJson<{ activePath: LearningPath }>(
      `/api/learning-paths${params.toString() ? `?${params.toString()}` : ""}`,
    );
    setLearningPath(payload.activePath);
  }

  async function loadLabs() {
    const payload = await requestJson<{ labSessions: LabSession[] }>("/api/labs");
    setLabSessions(payload.labSessions);
    setActiveLabId((c) => c ?? payload.labSessions[0]?.id ?? null);
  }

  async function loadExperiences(next: string | typeof experienceFilters = experienceFilters) {
    const params = new URLSearchParams();
    if (typeof next === "string") {
      if (next) params.set("company", next);
    } else {
      Object.entries(next).forEach(([key, value]) => { if (value) params.set(key, value); });
    }
    if (!params.has("company")) {
      const companyName = companies.find((c) => c.id === prepCompanyId)?.name;
      if (companyName) params.set("company", companyName);
    }
    const payload = await requestJson<{ experiences: ExperienceReport[] }>(
      `/api/experiences${params.toString() ? `?${params.toString()}` : ""}`,
    );
    setExperiences(payload.experiences);
  }

  async function loadCompanyIntel(companyId = prepCompanyId) {
    if (!companyId) { setCompanyIntel(null); return; }
    const payload = await requestJson<CompanyIntel>(`/api/companies/${companyId}/intel`);
    setCompanyIntel(payload);
    setExperiences(payload.reports);
  }

  async function loadCompanyPrep(companyId = prepCompanyId) {
    if (!companyId) { setToast("先选择公司。"); return; }
    setBusy("company-prep");
    try {
      const payload = await requestJson<CompanyPrep>(`/api/companies/${companyId}/prep`);
      setCompanyPrep(payload);
      await loadCompanyIntel(companyId);
      setToast("公司备考数据已刷新。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "公司备考加载失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleKnowledgeSuggest() {
    if (!knowledgeForm.question.trim()) { setToast("先填写题目。"); return; }
    setBusy("knowledge-suggest");
    try {
      const payload = await requestJson<{ suggestion: KnowledgeSuggestion }>("/api/knowledge/suggest", {
        method: "POST",
        body: JSON.stringify({
          question: knowledgeForm.question,
          answer: knowledgeForm.answer,
          companyName: knowledgeForm.companyName,
          topicName: knowledgeForm.topicName,
          tags: knowledgeForm.tags,
        }),
      });
      setKnowledgeSuggestion(payload.suggestion);
      setKnowledgeForm((c) => ({
        ...c,
        companyName: c.companyName || payload.suggestion.companyName,
        topicName: c.topicName || payload.suggestion.topicName,
        tags: c.tags || joinTags(payload.suggestion.tags),
        difficulty: payload.suggestion.difficulty,
        questionType: payload.suggestion.questionType || c.questionType,
        abilityDimension: payload.suggestion.abilityDimension || c.abilityDimension,
        mastery: payload.suggestion.masterySuggestion,
        priorityScore: payload.suggestion.priorityScore,
        note: c.note || payload.suggestion.note,
      }));
      setToast("已生成学习卡建议。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "AI 建议失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleKnowledgeSave() {
    if (!knowledgeForm.question.trim() || !knowledgeForm.answer.trim()) { setToast("题目和答案不能为空。"); return; }
    setBusy("knowledge-save");
    try {
      await requestJson("/api/knowledge", { method: "POST", body: JSON.stringify(knowledgeForm) });
      setKnowledgeForm(emptyKnowledgeForm);
      setKnowledgeSuggestion(null);
      await Promise.all([loadKnowledge(), loadDaily()]);
      setToast("学习卡已保存。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleRecordAgentGenerate() {
    if (recordText.trim().length < 12) {
      setToast("先贴一段完整一点的八股文或技术摘录。");
      return;
    }
    setBusy("record-agent");
    try {
      const payload = await requestJson<RecordAgentResponse>("/api/knowledge/agent", {
        method: "POST",
        body: JSON.stringify({
          rawText: recordText,
          extraContext: recordContext,
        }),
      });
      setRecordDraft(recordAgentDraftToForm(payload.cardDraft));
      setRecordAgentExecution(payload.execution);
      setToast(payload.execution.usedFallback ? "已生成一版可编辑草稿，当前是 fallback 结果。" : "已生成面试可直接使用的八股卡草稿。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "记录 Agent 生成失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleRecordSave() {
    if (!recordDraft.question.trim() || !recordDraft.answer.trim()) {
      setToast("先让 Agent 生成一版面试卡草稿，或补全题目和答案。");
      return;
    }
    setBusy("record-save");
    try {
      const payload = await requestJson<{ card: KnowledgeCard }>("/api/knowledge", {
        method: "POST",
        body: JSON.stringify(recordDraft),
      });
      setRecordText("");
      setRecordContext("");
      setRecordDraft(emptyRecordAgentDraft);
      setRecordAgentExecution(null);
      setShowRecordAgentEditor(false);
      await Promise.all([loadKnowledge(), loadDaily()]);
      setSelectedKnowledgeId(payload.card.id);
      setToast("已保存为面试八股卡，可以直接复习和继续编辑。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存记录失败");
    } finally {
      setBusy(null);
    }
  }

  function openRecordAgentEditor() {
    setRecordText("");
    setRecordContext("");
    setRecordDraft(emptyRecordAgentDraft);
    setRecordAgentExecution(null);
    setShowRecordAgentEditor(true);
  }

  function closeRecordAgentEditor() {
    setShowRecordAgentEditor(false);
  }

  async function handleCreateApplication() {
    if (!applicationForm.roleName.trim()) {
      setToast("先填写目标岗位。");
      return;
    }
    setBusy("application-create");
    try {
      const payload = await requestJson<{ application: Application }>("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          companyName: applicationForm.companyName,
          roleName: applicationForm.roleName,
          level: applicationForm.level,
          salaryK: applicationForm.salaryK,
          salaryMinK: applicationForm.salaryMinK,
          salaryMaxK: applicationForm.salaryMaxK,
          status: applicationForm.status,
          stage: applicationForm.stage,
          jobUrl: applicationForm.jobUrl || null,
          location: applicationForm.location || null,
          source: applicationForm.source || null,
          priority: applicationForm.priority,
          appliedAt: applicationForm.appliedAt || null,
          followUpAt: applicationForm.followUpAt || null,
          deadlineAt: applicationForm.deadlineAt || null,
          contactName: applicationForm.contactName || null,
          contactEmail: applicationForm.contactEmail || null,
          jdSnapshot: applicationForm.jdSnapshot || null,
          interviewDate: applicationForm.interviewDate || null,
          resumeProfileId: applicationForm.resumeProfileId ? Number(applicationForm.resumeProfileId) : undefined,
          jobTargetId: applicationForm.jobTargetId ? Number(applicationForm.jobTargetId) : undefined,
          note: applicationForm.note || null,
        }),
      });
      setApplicationForm(emptyApplicationForm);
      await loadApplications();
      setSelectedApplicationId(payload.application.id);
      setActiveTab("applications");
      setToast("求职机会已创建。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "创建求职机会失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleUpdateApplication(applicationId: number, patch: Partial<Application>) {
    setBusy(`application-update-${applicationId}`);
    try {
      const payload = await requestJson<{ application: Application }>(`/api/applications/${applicationId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      patchApplication(payload.application);
      setToast("求职机会已更新。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "更新求职机会失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveApplicationJd() {
    if (!selectedApplication) return;
    await handleUpdateApplication(selectedApplication.id, { jdSnapshot: applicationJdDraft });
    await loadApplications();
  }

  async function handleMatchApplication(applicationId = selectedApplication?.id) {
    if (!applicationId) {
      setToast("先选择一个求职机会。");
      return;
    }
    setBusy(`application-match-${applicationId}`);
    try {
      const payload = await requestJson<{ application: Application }>(`/api/applications/${applicationId}/match`, { method: "POST" });
      patchApplication(payload.application);
      setApplicationDetailTab("match");
      await loadResumeVersions(applicationId);
      setToast("JD / 简历匹配报告已刷新。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成匹配报告失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateResumeVersion(applicationId = selectedApplication?.id) {
    if (!applicationId) {
      setToast("先选择一个求职机会。");
      return;
    }
    setBusy(`resume-version-create-${applicationId}`);
    try {
      await requestJson<{ resumeVersion: ResumeVersion }>(`/api/applications/${applicationId}/resume-versions`, {
        method: "POST",
        body: JSON.stringify({
          resumeProfileId: selectedApplication?.resumeProfile?.id,
          title: `${selectedApplication?.company?.name ?? "目标岗位"} 定制版`,
        }),
      });
      await Promise.all([loadResumeVersions(applicationId), loadApplications()]);
      setApplicationDetailTab("resume");
      setToast("已创建应用内简历版本，不会覆盖原始简历。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "创建简历版本失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleAutoSelectResumeVersion(versionId: number) {
    setBusy(`resume-version-auto-${versionId}`);
    try {
      const payload = await requestJson<{ resumeVersion: ResumeVersion }>(`/api/resume-versions/${versionId}/auto-select`, { method: "POST" });
      patchResumeVersion(payload.resumeVersion);
      setToast("已按 JD 自动选择和重排内容块。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Auto-Select 失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerateResumeBullet(versionId: number, keyword: string) {
    if (!keyword.trim()) return;
    setBusy(`resume-bullet-${versionId}-${keyword}`);
    try {
      const payload = await requestJson<{ bullet: string; resumeVersion: ResumeVersion }>(`/api/resume-versions/${versionId}/generate-bullet`, {
        method: "POST",
        body: JSON.stringify({ keyword }),
      });
      patchResumeVersion(payload.resumeVersion);
      setToast(`已生成候选 bullet：${payload.bullet}`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成 bullet 失败");
    } finally {
      setBusy(null);
    }
  }

  function patchApplication(application: Application) {
    setApplications((current) => current.map((item) => (item.id === application.id ? application : item)));
  }

  function patchResumeVersion(version: ResumeVersion) {
    setResumeVersions((current) => current.map((item) => (item.id === version.id ? version : item)));
  }

  function toDateInputValue(value?: string | null) {
    if (!value) return "";
    return value.slice(0, 10);
  }

  async function handleCreateSource() {
    if (!sourceForm.title.trim() || !sourceForm.content.trim()) {
      setToast("来源标题和内容都不能为空。");
      return;
    }
    setBusy("source-create");
    try {
      await requestJson<{ source: SourceDocument }>("/api/sources", {
        method: "POST",
        body: JSON.stringify({
          title: sourceForm.title,
          sourceType: sourceForm.sourceType,
          content: sourceForm.content,
          applicationId: selectedApplication?.id,
        }),
      });
      setSourceForm(emptySourceForm);
      await loadSources(selectedApplication?.id);
      await loadApplications();
      setToast("来源已入库，Agent 后续会带引用生成。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "来源入库失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleRunUnifiedAgent(agentName: string) {
    setBusy(`agent-run-${agentName}`);
    try {
      const prioritizedSources = [
        ...sourceDocuments.filter((source) => source.sourceType === "github"),
        ...sourceDocuments.filter((source) => source.sourceType !== "github"),
      ].slice(0, 6);
      const payload = await requestJson<AgentRunResponse>(`/api/agents/${agentName}/run`, {
        method: "POST",
        body: JSON.stringify({
          applicationId: selectedApplication?.id,
          sourceIds: prioritizedSources.map((source) => source.id),
          input: {
            roleName: selectedApplication?.roleName ?? targetRole,
            companyName: selectedApplication?.company?.name ?? targetCompanyName,
            level: selectedApplication?.level ?? candidateSeniority,
            salaryK: selectedApplication?.salaryK ?? candidateSalaryK,
            goal: "生成下一步准备建议和可复用材料。",
          },
        }),
      });
      setAgentRunResult(payload);
      await loadAgentConfigs();
      setToast(payload.execution.usedFallback ? "Agent 已按统一协议生成 fallback 草稿。" : "Agent 运行完成。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Agent 运行失败");
    } finally {
      setBusy(null);
    }
  }

  function openStartupIdeaCreate(prefill: StartupIdeaForm = emptyStartupIdeaForm) {
    setEditingStartupIdeaId(null);
    setStartupIdeaForm(prefill);
    setStartupIdeaAgentInput("");
    setStartupIdeaAgentContext("");
    setStartupIdeaAgentExecution(null);
    setShowStartupIdeaEditor(true);
  }

  function openStartupIdeaEdit(idea: StartupIdea) {
    setEditingStartupIdeaId(idea.id);
    setStartupIdeaForm(startupIdeaToForm(idea));
    setStartupIdeaAgentInput(`${idea.title}\n${idea.oneLiner}`.trim());
    setStartupIdeaAgentContext("");
    setStartupIdeaAgentExecution(null);
    setShowStartupIdeaEditor(true);
  }

  async function generateStartupIdeaWithAgent() {
    if (startupIdeaAgentInput.trim().length < 8) {
      setToast("先输入一句完整一点的创业想法。");
      return;
    }

    setBusy("startup-idea-agent");
    try {
      const payload = await requestJson<StartupIdeaAgentResponse>("/api/startup-ideas/generate", {
        method: "POST",
        body: JSON.stringify({
          rawIdea: startupIdeaAgentInput,
          extraContext: startupIdeaAgentContext,
        }),
      });

      setStartupIdeaForm(startupIdeaToForm(payload.idea));
      setStartupIdeaAgentExecution(payload.execution);
      setToast(
        payload.execution.usedFallback
          ? "已生成一版创业想法草稿，当前使用的是 fallback 结果。"
          : "LangGraph Agent 已生成创业想法详情。",
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "创业想法 Agent 生成失败");
    } finally {
      setBusy(null);
    }
  }

  async function saveStartupIdea() {
    if (!startupIdeaForm.title.trim()) {
      setToast("创业想法标题不能为空。");
      return;
    }
    setBusy("startup-idea-save");
    try {
      const payload = await requestJson<{ idea: StartupIdea }>(
        editingStartupIdeaId ? `/api/startup-ideas/${editingStartupIdeaId}` : "/api/startup-ideas",
        {
          method: editingStartupIdeaId ? "PATCH" : "POST",
          body: JSON.stringify(startupIdeaForm),
        },
      );
      setShowStartupIdeaEditor(false);
      setEditingStartupIdeaId(null);
      setStartupIdeaAgentExecution(null);
      await loadStartupIdeas(startupIdeaFilters);
      setSelectedStartupIdeaId(payload.idea.id);
      setToast(editingStartupIdeaId ? "创业想法已更新。" : "创业想法已保存。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "创业想法保存失败");
    } finally {
      setBusy(null);
    }
  }

  async function deleteStartupIdea(ideaId: number) {
    if (!window.confirm("确认删除这个创业想法吗？")) return;
    setBusy("startup-idea-delete");
    try {
      await requestJson(`/api/startup-ideas/${ideaId}`, { method: "DELETE" });
      setSelectedStartupIdeaId(null);
      await loadStartupIdeas(startupIdeaFilters);
      setToast("创业想法已删除。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "创业想法删除失败");
    } finally {
      setBusy(null);
    }
  }

  async function refreshGithubTrends() {
    setBusy("github-refresh");
    try {
      const payload = await requestJson<GithubTrendListResponse>("/api/github-trends/refresh", {
        method: "POST",
        body: JSON.stringify(githubFilters),
      });
      setGithubRepos(payload.repositories);
      setGithubLanguages(payload.languages);
      setGithubTopics(payload.topics);
      setGithubRadar(payload.radar);
      setGithubMeta(payload.meta);
      setSelectedGithubRepoId(payload.repositories[0]?.id ?? null);
      setToast(`已刷新 ${payload.repositories.length} 个 GitHub 仓库。`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "刷新 GitHub 趋势失败");
    } finally {
      setBusy(null);
    }
  }

  async function updateGithubFilters(next: GithubTrendFilters) {
    setGithubFilters(next);
    await loadGithubTrends(next);
  }

  async function toggleGithubFavorite(repo: GithubTrendRepo) {
    setBusy(`github-favorite-${repo.id}`);
    try {
      const payload = await requestJson<{ repository: GithubTrendRepo }>(`/api/github-trends/${repo.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isFavorite: !repo.isFavorite }),
      });
      patchGithubRepo(payload.repository);
      setToast(payload.repository.isFavorite ? "已收藏仓库。" : "已取消收藏。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "更新收藏失败");
    } finally {
      setBusy(null);
    }
  }

  async function saveGithubNote() {
    if (!selectedGithubRepo) return;
    setBusy("github-note");
    try {
      const payload = await requestJson<{ repository: GithubTrendRepo }>(`/api/github-trends/${selectedGithubRepo.id}`, {
        method: "PATCH",
        body: JSON.stringify({ note: githubNoteDraft }),
      });
      patchGithubRepo(payload.repository);
      setToast("仓库备注已保存。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存备注失败");
    } finally {
      setBusy(null);
    }
  }

  async function analyzeGithubRepo() {
    if (!selectedGithubRepo) return;
    setBusy("github-analyze");
    try {
      const payload = await requestJson<GithubRepoAnalyzeResponse>(`/api/github-trends/${selectedGithubRepo.id}/analyze`, {
        method: "POST",
      });
      patchGithubRepo(payload.repository);
      setGithubAnalyzeExecution(payload.execution);
      setToast(payload.execution.usedFallback ? "已生成规则兜底分析。" : "GLM 已完成仓库分析。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "仓库分析失败");
    } finally {
      setBusy(null);
    }
  }

  async function analyzeGithubRadarDigest() {
    setBusy("github-radar-analyze");
    try {
      const payload = await requestJson<GithubRadarDigestResponse>("/api/github-trends/radar", {
        method: "POST",
        body: JSON.stringify(githubFilters),
      });
      setGithubRadarDigest(payload.digest);
      setGithubRadarExecution(payload.execution);
      setToast(payload.execution.usedFallback ? "已生成规则兜底雷达简报。" : "GLM 已完成 GitHub 雷达简报。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成 GitHub 雷达简报失败");
    } finally {
      setBusy(null);
    }
  }

  async function saveGithubRadarAsSource() {
    if (!selectedApplication) {
      setToast("先选择一个求职机会，再把 GitHub 雷达沉淀为来源材料。");
      return;
    }

    setBusy("github-radar-source");
    try {
      const payload = await requestJson<{
        sourceDraft: {
          title: string;
          sourceType: "github";
          content: string;
          metadata?: Record<string, unknown>;
        };
      }>("/api/github-trends/source-draft", {
        method: "POST",
        body: JSON.stringify({
          type: "radar",
          ...githubFilters,
        }),
      });

      await requestJson<{ source: SourceDocument }>("/api/sources", {
        method: "POST",
        body: JSON.stringify({
          ...payload.sourceDraft,
          applicationId: selectedApplication.id,
        }),
      });

      await loadSources(selectedApplication.id);
      setApplicationDetailTab("prep");
      setToast("GitHub 雷达已沉淀到来源材料。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存 GitHub 雷达到来源失败");
    } finally {
      setBusy(null);
    }
  }

  async function saveGithubRepoAsSource(repo: GithubTrendRepo) {
    if (!selectedApplication) {
      setToast("先选择一个求职机会，再把仓库研究摘要沉淀为来源材料。");
      return;
    }

    setBusy(`github-source-${repo.id}`);
    try {
      const payload = await requestJson<{
        sourceDraft: {
          title: string;
          sourceType: "github";
          content: string;
          metadata?: Record<string, unknown>;
        };
      }>("/api/github-trends/source-draft", {
        method: "POST",
        body: JSON.stringify({
          type: "repo",
          repoId: repo.id,
          ...githubFilters,
        }),
      });

      await requestJson<{ source: SourceDocument }>("/api/sources", {
        method: "POST",
        body: JSON.stringify({
          ...payload.sourceDraft,
          applicationId: selectedApplication.id,
        }),
      });

      await loadSources(selectedApplication.id);
      setApplicationDetailTab("prep");
      setToast(`已把 ${repo.fullName} 保存到来源材料。`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存仓库来源失败");
    } finally {
      setBusy(null);
    }
  }

  function patchGithubRepo(repo: GithubTrendRepo) {
    setGithubRepos((current) => current.map((item) => (item.id === repo.id ? repo : item)));
  }

  async function handleGenerateInterviewScript() {
    if (scriptResumeText.trim().length < 20) {
      setToast("先贴入一段简历内容。");
      return;
    }
    if (!scriptDirection.trim()) {
      setToast("请选择或填写面试方向。");
      return;
    }
    setBusy("script-generate");
    try {
      const payload = await requestJson<{ script: InterviewScript }>("/api/interview-script", {
        method: "POST",
        body: JSON.stringify({
          resumeText: scriptResumeText,
          roleName: scriptRoleName,
          direction: scriptDirection,
          difficulty: scriptDifficulty,
          questionCount: scriptQuestionCount,
          focus: [
            scriptFocus,
            `候选人目标：${candidateTarget.summary}`,
            `难度口径：${difficultyCopy[candidateTarget.difficulty].description}`,
          ].filter(Boolean).join("；"),
          seniority: candidateSeniority,
          salaryK: candidateSalaryK,
          difficultySource: "candidate-target",
          candidatePrep: selectedResume?.candidatePrep ?? null,
        }),
      });
      setInterviewScript(payload.script);
      setScriptPracticeIndex(0);
      setScriptPracticeAnswer("");
      setScriptPracticeAnswers({});
      setCandidatePracticeReview(null);
      setCandidatePracticeReviews({});
      setToast("面试文稿已生成。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成文稿失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerateCandidatePrep() {
    if (!selectedResume) {
      setToast("先选择一份简历。");
      return;
    }

    setBusy("candidate-prep");
    try {
      const payload = await requestJson<CandidatePrepResponse>(`/api/resumes/${selectedResume.id}/candidate-prep/generate`, {
        method: "POST",
        body: JSON.stringify({
          jobTargetId: selectedJobTarget?.id,
          applicationId: selectedApplication?.id,
          githubSources: sourceDocuments
            .filter((source) => source.sourceType === "github")
            .slice(0, 6)
            .map((source) => ({
              title: source.title,
              content: source.content,
            })),
        }),
      });
      setCandidatePrepExecution(payload.execution);
      setResumes((current) =>
        current.map((resume) =>
          resume.id === selectedResume.id
            ? { ...resume, candidatePrep: payload.prep }
            : resume,
        ),
      );
      await loadResumes();
      setToast(payload.execution.usedFallback ? "已生成候选人准备草稿，当前是 fallback 结果。" : "候选人准备面板已生成。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "候选人准备生成失败");
    } finally {
      setBusy(null);
    }
  }

  function applyCandidatePrepToInterviewer() {
    if (!selectedResume?.candidatePrep) {
      setToast("先生成候选人准备面板。");
      return;
    }

    const prep = selectedResume.candidatePrep;
    setScriptResumeText(selectedResume.rawText);
    setScriptRoleName(selectedJobTarget?.roleName ?? scriptRoleName);
    setScriptDirection(selectedJobTarget?.roleName ?? scriptDirection);
    setScriptDifficulty(candidateTarget.difficulty);
    setScriptFocus(
      [
        `候选人目标：${candidateTarget.summary}`,
        prep.headline,
        ...prep.jobAlignment.slice(0, 2),
        ...prep.riskPoints.slice(0, 2),
        ...prep.projectTalkTracks.flatMap((item) => item.deepDivePoints.slice(0, 2)),
      ].filter(Boolean).join("；"),
    );
    setInterviewWorkspace("interviewer");
    setToast("已把候选人准备重点带入面试官文稿。");
  }

  async function applyCandidatePrepToSimulation() {
    if (!selectedResume?.candidatePrep) {
      setToast("先生成候选人准备面板。");
      return;
    }

    setInterviewWorkspace("candidate");
    setDeliveryMode("text");
    await handleStartInterview();
  }

  function copyInterviewScript() {
    if (!interviewScript) return;
    const text = [
      interviewScript.title,
      interviewScript.overview,
      "",
      "面试官提示：",
      ...interviewScript.interviewerBrief.map((item) => `- ${item}`),
      "",
      "问题：",
      ...interviewScript.questions.flatMap((question) => [
        `${question.order}. ${question.question}`,
        `考察意图：${question.intent}`,
        `追问：${question.followUps.join("；")}`,
      ]),
      "",
      `收尾：${interviewScript.closing}`,
    ].join("\n");
    void navigator.clipboard?.writeText(text);
    setToast("文稿已复制。");
  }

  function startCandidatePracticeFromScript() {
    if (!interviewScript?.questions[0]) {
      setToast("先生成一份面试文稿。");
      return;
    }
    setInterviewWorkspace("candidate");
    setAnswerText("");
    setCandidatePracticeReview(null);
    setToast("已切到面试者练习，可以按文稿第一题开始答。");
  }

  function saveScriptPracticeAnswer(nextIndex?: number) {
    const question = interviewScript?.questions[scriptPracticeIndex];
    if (!question) return;
    const nextAnswers = { ...scriptPracticeAnswers, [question.order]: scriptPracticeAnswer };
    setScriptPracticeAnswers(nextAnswers);
    if (typeof nextIndex === "number") {
      const nextQuestion = interviewScript?.questions[nextIndex];
      setScriptPracticeIndex(nextIndex);
      setScriptPracticeAnswer(nextQuestion ? nextAnswers[nextQuestion.order] ?? "" : "");
      setCandidatePracticeReview(nextQuestion ? candidatePracticeReviews[nextQuestion.order] ?? null : null);
    } else {
      setToast("这题回答已暂存。");
    }
  }

  function fillCandidateAnswerTemplate() {
    if (!currentScriptQuestion) {
      setToast("先生成一份面试文稿。");
      return;
    }
    setScriptPracticeAnswer(buildCandidateAnswerTemplate(currentScriptQuestion, selectedResume?.candidatePrep ?? null));
    setCandidatePracticeReview(null);
    setToast("已填入 STAR 答题骨架，可以直接替换细节。");
  }

  function reviewScriptPracticeAnswer() {
    if (!currentScriptQuestion || !scriptPracticeAnswer.trim()) {
      setToast("先写一段回答，再做诊断。");
      return;
    }
    const review = reviewCandidatePracticeAnswer(
      scriptPracticeAnswer,
      currentScriptQuestion,
      selectedResume?.candidatePrep ?? null,
    );
    setCandidatePracticeReview(review);
    setCandidatePracticeReviews((current) => ({ ...current, [currentScriptQuestion.order]: review }));
    saveScriptPracticeAnswer();
    setToast(`本地诊断完成，当前 ${review.score} 分。`);
  }

  function applyCandidateNextAnswerDraft() {
    if (!currentScriptQuestion) {
      setToast("先选择一道练习题。");
      return;
    }
    const draft = buildCandidateNextAnswerDraft(scriptPracticeAnswer, candidatePracticeReview);
    setScriptPracticeAnswer(draft);
    setCandidatePracticeReview(null);
    setToast("已生成下一版回答草稿。");
  }

  function jumpToCandidatePracticeQuestion(order: number) {
    const index = interviewScript?.questions.findIndex((question) => question.order === order) ?? -1;
    if (index < 0) return;
    const currentQuestion = interviewScript?.questions[scriptPracticeIndex];
    const nextAnswers = currentQuestion
      ? { ...scriptPracticeAnswers, [currentQuestion.order]: scriptPracticeAnswer }
      : scriptPracticeAnswers;
    const nextQuestion = interviewScript?.questions[index];
    setScriptPracticeAnswers(nextAnswers);
    setScriptPracticeIndex(index);
    setScriptPracticeAnswer(nextQuestion ? nextAnswers[nextQuestion.order] ?? "" : "");
    setCandidatePracticeReview(nextQuestion ? candidatePracticeReviews[nextQuestion.order] ?? null : null);
    setCandidatePracticeMode("structure");
  }

  async function updateKnowledgeProgress(cardId: number, mastery: number, markReviewed = false) {
    setBusy(`knowledge-${cardId}`);
    try {
      await requestJson(`/api/knowledge/${cardId}/progress`, {
        method: "PATCH",
        body: JSON.stringify({ mastery, markReviewed }),
      });
      await Promise.all([loadKnowledge(), loadDaily()]);
      setToast(markReviewed ? "已记录复习。" : "掌握度已更新。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "更新失败");
    } finally {
      setBusy(null);
    }
  }

  function startKnowledgeEdit(card: KnowledgeCard) {
    setEditingKnowledgeId(card.id);
    setKnowledgeEditForm(cardToKnowledgeForm(card));
  }

  async function handleKnowledgeUpdate() {
    if (!editingKnowledgeId) return;
    if (!knowledgeEditForm.question.trim() || !knowledgeEditForm.answer.trim()) {
      setToast("题目和答案不能为空。");
      return;
    }
    setBusy("knowledge-update");
    try {
      await requestJson(`/api/knowledge/${editingKnowledgeId}`, {
        method: "PATCH",
        body: JSON.stringify(knowledgeEditForm),
      });
      setEditingKnowledgeId(null);
      await Promise.all([loadKnowledge(), loadDaily()]);
      setToast("学习卡已更新。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "更新失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleKnowledgeDelete(cardId: number) {
    if (!window.confirm("确认删除这张学习卡吗？关联复盘会保留，但不再关联该题。")) return;
    setBusy(`knowledge-delete-${cardId}`);
    try {
      await requestJson(`/api/knowledge/${cardId}`, { method: "DELETE" });
      setSelectedKnowledgeId((current) => (current === cardId ? null : current));
      await Promise.all([loadKnowledge(), loadDaily(), loadReviews()]);
      setToast("学习卡已删除。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "删除失败");
    } finally {
      setBusy(null);
    }
  }

  function handleStartReview() {
    const first = reviewQueue[0] ?? cards[0];
    if (!first) {
      setToast("暂无可复习题卡。");
      return;
    }
    setReviewMode(true);
    setSelectedKnowledgeId(first.id);
    setActiveTab("knowledge");
  }

  async function handleResumeParse() {
    if (resumeText.trim().length < 20) { setToast("简历文本再多贴一点。"); return; }
    setBusy("resume-parse");
    try {
      const payload = await requestJson<{ resume: ResumeProfile }>("/api/resume/parse", {
        method: "POST",
        body: JSON.stringify({ title: resumeTitle, rawText: resumeText }),
      });
      await loadResumes();
      setSelectedResumeId(payload.resume.id);
      setToast("简历已解析。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "解析失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleResumeRename() {
    if (!selectedResume || !resumeRenameTitle.trim()) return;
    setBusy("resume-rename");
    try {
      const payload = await requestJson<{ resume: ResumeProfile }>(`/api/resumes/${selectedResume.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: resumeRenameTitle }),
      });
      await loadResumes();
      setSelectedResumeId(payload.resume.id);
      setToast("简历标题已更新。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "简历更新失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleResumeDelete() {
    if (!selectedResume) return;
    if (!window.confirm("确认删除这份简历吗？相关岗位、面试、冲刺计划会解除关联。")) return;
    setBusy("resume-delete");
    try {
      await requestJson(`/api/resumes/${selectedResume.id}`, { method: "DELETE" });
      setSelectedResumeId(null);
      await Promise.all([loadResumes(), loadJobTargets(), loadSessions(), loadSprints()]);
      setToast("简历已删除。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "简历删除失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleJobTargetParse() {
    if (jdText.trim().length < 20) { setToast("请贴入完整 JD。"); return; }
    const roleName = jdRoleName.trim() || "岗位目标";
    setBusy("job-parse");
    try {
      const payload = await requestJson<{ jobTarget: JobTarget }>("/api/job-targets/parse", {
        method: "POST",
        body: JSON.stringify({
          companyName: jdCompanyName,
          roleName,
          rawJd: jdText,
          resumeProfileId: selectedResume?.id,
        }),
      });
      await Promise.all([loadJobTargets(), loadKnowledge()]);
      setSelectedJobTargetId(payload.jobTarget.id);
      setPrepCompanyId(payload.jobTarget.company?.id ?? null);
      await loadLearningPath(payload.jobTarget.roleName);
      setToast("岗位目标已解析。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "JD 解析失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleStartInterview() {
    if (!selectedResume && !selectedJobTarget) {
      setToast("先选择简历，至少让 AI 有一个候选人上下文。");
      return;
    }
    setBusy("interview-start");
    try {
      const payload = await requestJson<{ session: InterviewSession }>("/api/interviews/start", {
        method: "POST",
        body: JSON.stringify({
          mode: interviewMode, roundType, deliveryMode,
          targetCompanyName, targetRole,
          resumeProfileId: selectedResume?.id,
          jobTargetId: selectedJobTarget?.id,
          applicationId: selectedApplication?.id,
          seniority: candidateSeniority,
          salaryK: candidateSalaryK,
          difficulty: candidateTarget.difficulty,
        }),
      });
      setActiveSession(payload.session);
      setSelectedSessionId(payload.session.id);
      setAnswerText("");
      setToast("面试已开始。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "启动失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleTranscribe() {
    setBusy("transcribe");
    try {
      const payload = await requestJson<{ transcript: string; expression: Record<string, number | string> }>(
        "/api/interviews/transcribe", {
          method: "POST",
          body: JSON.stringify({
            transcriptHint: voiceHint,
            durationSec: answerDurationSec,
            fileName: "local-recording.webm",
          }),
        },
      );
      setAnswerText(payload.transcript);
      setToast(`转写完成，结构完整度 ${payload.expression.structureCompleteness ?? "-"}。`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "转写失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmitAnswer() {
    if (!activeSession || !openTurn || !answerText.trim()) { setToast("先填写回答。"); return; }
    setBusy("interview-answer");
    try {
      const payload = await requestJson<{ session: InterviewSession; shouldFinish: boolean }>("/api/interviews/answer", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSession.id,
          turnId: openTurn.id,
          answer: answerText,
          transcriptSource: deliveryMode,
          answerDurationSec: deliveryMode === "voice" ? answerDurationSec : undefined,
          audioMeta: deliveryMode === "voice" ? { mode: "mock-local" } : undefined,
        }),
      });
      setActiveSession(payload.session);
      setSelectedSessionId(payload.session.id);
      setAnswerText("");
      setVoiceHint("");
      setToast(payload.shouldFinish ? "可以结束并生成复盘。" : "回答已记录。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "提交失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleFinishInterview() {
    if (!activeSession) return;
    setBusy("interview-finish");
    try {
      const payload = await requestJson<{ session: InterviewSession; reviewCards: ReviewCard[] }>(
        "/api/interviews/finish", {
          method: "POST",
          body: JSON.stringify({ sessionId: activeSession.id }),
        },
      );
      setActiveSession(payload.session);
      setSelectedSessionId(payload.session.id);
      await Promise.all([loadReviews(), loadKnowledge(), loadSessions()]);
      await loadDaily();
      setActiveTab("review");
      setToast("复盘已生成，低分题已回流。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "复盘失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleStartInterviewerSession() {
    const pastedResume = interviewerResumeText.trim();
    if (!selectedResume && pastedResume.length < 20) {
      setToast("请贴入简历，或先在简历库选择一份简历。");
      return;
    }
    setBusy("interviewer-start");
    try {
      const payload = await requestJson<{ session: InterviewSession }>("/api/interviewer-sessions/start", {
        method: "POST",
        body: JSON.stringify({
          resumeProfileId: selectedResume?.id,
          resumeText: pastedResume || undefined,
          jdText: interviewerJdText.trim(),
          targetRole: interviewerRole.trim() || selectedJobTarget?.roleName,
          targetCompanyName: interviewerCompanyName.trim() || selectedJobTarget?.company?.name,
          seniority: interviewerSeniority,
          durationMinutes: interviewerDuration,
        }),
      });
      setInterviewerSession(payload.session);
      setFocusedInterviewerTurnId(payload.session.turns.find((turn) => turn.turnType === "primary")?.id ?? payload.session.turns[0]?.id ?? null);
      setInterviewerAnswerText("");
      setInterviewerDiscussionTitle("");
      setInterviewerSummary(null);
      setShowInterviewerIdealAnswer(false);
      setSelectedSessionId(payload.session.id);
      await loadSessions();
      setToast("面试官 Agent 已开场。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "启动面试官 Agent 失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmitInterviewerAnswer() {
    if (!interviewerSession || !interviewerFocusedTurn || !interviewerAnswerText.trim()) {
      setToast("先选择一个题卡并填写纪要。");
      return;
    }
    setBusy("interviewer-answer");
    try {
      const payload = await requestJson<{ session: InterviewSession; nextTurn: unknown; shouldFinish: boolean }>(
        `/api/interviewer-sessions/${interviewerSession.id}/answer`,
        {
          method: "POST",
          body: JSON.stringify({
            turnId: interviewerFocusedTurn.id,
            answer: interviewerAnswerText,
            transcriptSource: "text",
          }),
        },
      );
      setInterviewerSession(payload.session);
      setInterviewerAnswerText("");
      setFocusedInterviewerTurnId(typeof payload.nextTurn === "object" && payload.nextTurn && "id" in (payload.nextTurn as Record<string, unknown>)
        ? Number((payload.nextTurn as { id: number }).id)
        : interviewerFocusedTurn.id);
      setShowInterviewerIdealAnswer(false);
      await loadSessions();
      setToast(payload.shouldFinish ? "主问题覆盖已达预算，可以生成评分复盘。" : "纪要已保存。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "提交回答失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateInterviewerDiscussion() {
    if (!interviewerSession || !interviewerAnswerText.trim()) {
      setToast("先输入一段自由讨论纪要。");
      return;
    }
    setBusy("interviewer-answer");
    try {
      const payload = await requestJson<{ session: InterviewSession; answeredTurn: { id: number } }>(
        `/api/interviewer-sessions/${interviewerSession.id}/answer`,
        {
          method: "POST",
          body: JSON.stringify({
            mode: "discussion",
            title: interviewerDiscussionTitle.trim() || undefined,
            answer: interviewerAnswerText,
            transcriptSource: "text",
          }),
        },
      );
      setInterviewerSession(payload.session);
      setFocusedInterviewerTurnId(payload.answeredTurn.id);
      setInterviewerAnswerText("");
      setInterviewerDiscussionTitle("");
      await loadSessions();
      setToast("自由讨论卡已记录。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "自由讨论记录失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleFinishInterviewerSession() {
    if (!interviewerSession) return;
    setBusy("interviewer-finish");
    try {
      const payload = await requestJson<{ session: InterviewSession; summary: InterviewerSessionSummary }>(
        `/api/interviewer-sessions/${interviewerSession.id}/finish`,
        { method: "POST" },
      );
      setInterviewerSession(payload.session);
      setInterviewerSummary(payload.summary);
      await Promise.all([loadSessions(), loadReviews()]);
      setToast("面试官 Agent 已生成评分和复盘。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成面试官复盘失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerateSprint() {
    setBusy("sprint-generate");
    try {
      const payload = await requestJson<{ sprintPlan: SprintPlan }>("/api/sprints/generate", {
        method: "POST",
        body: JSON.stringify({
          companyName: selectedJobTarget?.company?.name ?? targetCompanyName,
          roleName: selectedJobTarget?.roleName ?? targetRole,
          jobTargetId: selectedJobTarget?.id,
          resumeProfileId: selectedResume?.id,
          applicationId: selectedApplication?.id,
          days: sprintDays,
          interviewDate: interviewDate || undefined,
        }),
      });
      setSelectedSprintId(payload.sprintPlan.id);
      await loadSprints();
      await loadDaily();
      setToast("冲刺计划已生成。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成失败");
    } finally {
      setBusy(null);
    }
  }

  async function updateTaskStatus(taskId: number, status: SprintTask["status"]) {
    setBusy(`task-${taskId}`);
    try {
      await requestJson(`/api/sprint-tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await Promise.all([loadSprints(), loadDaily()]);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "任务更新失败");
    } finally {
      setBusy(null);
    }
  }

  async function updateReviewStatus(cardId: number, status: "todo" | "doing" | "done") {
    setBusy(`review-${cardId}`);
    try {
      await requestJson(`/api/reviews/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await Promise.all([loadReviews(), loadDaily()]);
      setToast(status === "done" ? "复盘卡已完成。" : "复盘卡状态已更新。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "复盘卡更新失败");
    } finally {
      setBusy(null);
    }
  }

  async function createReviewTask(cardId: number) {
    setBusy(`review-task-${cardId}`);
    try {
      const payload = await requestJson<{ sprintTask: SprintTask | null }>(`/api/reviews/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({ createTask: true, status: "doing" }),
      });
      if (payload.sprintTask?.planId) {
        setSelectedSprintId(payload.sprintTask.planId);
      }
      await Promise.all([loadReviews(), loadSprints(), loadDaily()]);
      setActiveTab("sprint");
      setToast("已把复盘卡转成冲刺任务。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成复盘任务失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleExportData() {
    setBusy("export");
    try {
      const response = await fetch("/api/export");
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "导出失败");
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `interview-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setToast(`已导出 ${payload.counts?.knowledgeCards ?? 0} 张题卡和 ${payload.counts?.interviews ?? 0} 轮面试。`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "导出失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleSeedQuestionBank() {
    setBusy("seed-bank");
    try {
      const payload = await requestJson<{ created: number; skipped: number; total: number }>("/api/question-bank/seed", {
        method: "POST",
      });
      await Promise.all([loadKnowledge(), loadDaily()]);
      setToast(`已导入 ${payload.created} 题，跳过 ${payload.skipped} 题。`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "题库导入失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleStartLab() {
    setBusy("lab-start");
    try {
      const payload = await requestJson<{ labSession: LabSession }>("/api/labs/start", {
        method: "POST",
        body: JSON.stringify({ type: labType, roleDirection: labRole || selectedJobTarget?.roleName || targetRole }),
      });
      await loadLabs();
      setActiveLabId(payload.labSession.id);
      setLabContent(payload.labSession.content ?? payload.labSession.starterCode ?? "");
      setToast("练习已创建。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "创建练习失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmitLab() {
    if (!activeLab || !labContent.trim()) { setToast("先写一点练习内容。"); return; }
    setBusy("lab-submit");
    try {
      const payload = await requestJson<{ labSession: LabSession }>("/api/labs/submit", {
        method: "POST",
        body: JSON.stringify({ sessionId: activeLab.id, content: labContent }),
      });
      await loadLabs();
      setActiveLabId(payload.labSession.id);
      setToast("实验室反馈已生成。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "提交失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleExperienceParse() {
    if (experienceText.trim().length < 20) { setToast("请粘贴完整面经。"); return; }
    setBusy("experience-parse");
    try {
      const payload = await requestJson<{ draft: ExperienceDraft }>("/api/experiences/parse", {
        method: "POST",
        body: JSON.stringify({ rawText: experienceText, companyName: experienceCompanyName, roleName: experienceRoleName }),
      });
      setExperienceDraft(payload.draft);
      setExperienceCompanyName(payload.draft.companyName || experienceCompanyName);
      setExperienceRoleName(payload.draft.roleName || experienceRoleName);
      setToast("面经已结构化。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "面经解析失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleExperienceSave() {
    const draft = experienceDraft;
    if (!draft || experienceText.trim().length < 20) { setToast("请先解析面经。"); return; }
    setBusy("experience-save");
    try {
      const payload = await requestJson<{ experience: ExperienceReport }>("/api/experiences", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          companyName: experienceCompanyName || draft.companyName,
          roleName: experienceRoleName || draft.roleName,
          rawText: experienceText,
        }),
      });
      setExperienceDraft(null);
      setExperienceText("");
      setExperienceCompanyName("");
      setExperienceRoleName("");
      await Promise.all([loadKnowledge(), loadExperiences(payload.experience.company?.name ?? undefined)]);
      setPrepCompanyId(payload.experience.company?.id ?? prepCompanyId);
      if (payload.experience.company?.id) await loadCompanyIntel(payload.experience.company.id);
      setToast("面经已保存。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存面经失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleExperienceGenerateCards(reportId: number) {
    setBusy(`experience-cards-${reportId}`);
    try {
      const payload = await requestJson<{ created: KnowledgeCard[] }>(`/api/experiences/${reportId}/generate-cards`, { method: "POST" });
      await Promise.all([loadKnowledge(), loadDaily(), loadCompanyIntel()]);
      setToast(`已生成 ${payload.created.length} 张八股卡。`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成八股卡失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleExperienceStartInterview(reportId: number) {
    setBusy(`experience-interview-${reportId}`);
    try {
      const payload = await requestJson<{ session: InterviewSession }>(`/api/experiences/${reportId}/start-interview`, { method: "POST" });
      setActiveSession(payload.session);
      await loadSessions();
      setActiveTab("interview");
      setToast("已用面经启动模拟。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "启动面经模拟失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleExperienceCreateTasks(reportId: number) {
    setBusy(`experience-tasks-${reportId}`);
    try {
      await requestJson<{ sprintPlan: SprintPlan }>(`/api/experiences/${reportId}/create-daily-tasks`, { method: "POST" });
      await Promise.all([loadSprints(), loadDaily(), loadCompanyIntel()]);
      setToast("已生成面经训练任务。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成任务失败");
    } finally {
      setBusy(null);
    }
  }

  /* ─── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background">
      <Topbar activeTab={activeTab} onTabChange={setActiveTab} onRefresh={() => void refreshAll()} />

      <main className="mx-auto max-w-[1680px] px-4 py-5 lg:px-5 lg:py-6">
        {/* Hero Banner */}
        <div className={cn("mb-5 overflow-hidden rounded-2xl p-5 text-white shadow-lg", heroGradientCls)}>
          <div className="flex items-start">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-white/80">Interview AI</p>
              <h1 className="mt-1 text-2xl font-bold">{pageLabels[activeTab]}</h1>
            </div>
          </div>
        </div>

        {/* ─── Applications ─── */}
        {activeTab === "applications" && (
          <div className="grid gap-4">
            <Panel title="求职机会管道" icon={<BriefcaseBusiness size={16} />}>
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricCard label="活跃机会" value={applicationMetrics?.active ?? applications.filter((item) => !item.archived).length} icon={<BriefcaseBusiness size={16} />} />
                  <MetricCard label="平均匹配" value={`${applicationMetrics?.averageMatchScore ?? 0}%`} icon={<Gauge size={16} />} />
                  <MetricCard label="已归档" value={applicationMetrics?.archived ?? 0} icon={<ClipboardList size={16} />} />
                  <MetricCard label="今日下一步" value={applications.filter((item) => item.followUpAt && new Date(item.followUpAt).toDateString() === new Date().toDateString()).length} icon={<CalendarDays size={16} />} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="min-w-[260px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="搜索公司、岗位、地点、备注"
                    value={applicationFilters.q}
                    onChange={(e) => setApplicationFilters({ ...applicationFilters, q: e.target.value })}
                  />
                  <select
                    className={compactSelectCls}
                    value={applicationFilters.sort}
                    onChange={(e) => {
                      const next = { ...applicationFilters, sort: e.target.value };
                      setApplicationFilters(next);
                      void loadApplications(next);
                    }}
                  >
                    <option value="priority">按优先级</option>
                    <option value="followUp">按跟进日</option>
                    <option value="updated">按更新时间</option>
                  </select>
                  <select
                    className={compactSelectCls}
                    value={applicationFilters.archived}
                    onChange={(e) => {
                      const next = { ...applicationFilters, archived: e.target.value };
                      setApplicationFilters(next);
                      void loadApplications(next);
                    }}
                  >
                    <option value="false">只看活跃</option>
                    <option value="true">只看归档</option>
                    <option value="">全部机会</option>
                  </select>
                  <button className={btnSecondary} type="button" onClick={() => void loadApplications(applicationFilters)}>
                    <Search size={15} /> 搜索
                  </button>
                  <button className={btnPrimary} type="button" onClick={() => {
                    setApplicationDetailTab("overview");
                    setSelectedApplicationId(null);
                  }}>
                    <Plus size={15} /> 新增岗位
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn("rounded-full border px-3 py-1.5 text-sm", !applicationFilters.stage ? "border-zinc-900 bg-zinc-900 text-white" : "border-border bg-surface hover:bg-slate-50")}
                    onClick={() => {
                      const next = { ...applicationFilters, stage: "" };
                      setApplicationFilters(next);
                      void loadApplications(next);
                    }}
                  >
                    全部 {applicationMetrics?.active ?? applications.length}
                  </button>
                  {applicationStageOrder.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      className={cn("rounded-full border px-3 py-1.5 text-sm", applicationFilters.stage === stage ? "border-zinc-900 bg-zinc-900 text-white" : "border-border bg-surface hover:bg-slate-50")}
                      onClick={() => {
                        const next = { ...applicationFilters, stage };
                        setApplicationFilters(next);
                        void loadApplications(next);
                      }}
                    >
                      {applicationStageLabels[stage]} {applicationMetrics?.byStage?.[stage] ?? applications.filter((item) => item.stage === stage).length}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                  <div className="grid grid-cols-[1.35fr_130px_100px_120px_110px_110px_1.2fr] gap-3 border-b border-border bg-slate-50 px-4 py-2 text-xs font-semibold text-muted-foreground max-xl:hidden">
                    <span>公司 / 岗位</span><span>状态</span><span>匹配</span><span>薪资</span><span>地点</span><span>跟进</span><span>下一步</span>
                  </div>
                  <div className="max-h-[420px] overflow-auto">
                    {applications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">暂无求职机会，先保存一个岗位，管道就转起来了。</div>
                    ) : (
                      applications.map((application) => {
                        const score = application.matchReport?.matchScore ?? 0;
                        const salary = application.salaryMinK || application.salaryMaxK
                          ? `${application.salaryMinK ?? "-"}-${application.salaryMaxK ?? "-"}K`
                          : application.salaryK ? `${application.salaryK}K` : "-";
                        return (
                          <button
                            key={application.id}
                            type="button"
                            onClick={() => setSelectedApplicationId(application.id)}
                            className={cn(
                              "grid w-full gap-3 border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-b-0 xl:grid-cols-[1.35fr_130px_100px_120px_110px_110px_1.2fr]",
                              selectedApplication?.id === application.id ? "bg-zinc-50" : "bg-surface hover:bg-slate-50",
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <strong className="truncate text-slate-950">{application.company?.name ?? "未填写公司"}</strong>
                                {application.archived && <Pill variant="accent">归档</Pill>}
                                {application.priority >= 80 && <Pill variant="warn">高优先级</Pill>}
                              </div>
                              <p className="mt-1 truncate text-xs text-muted-foreground">{application.roleName} · {application.level} · {application.source || "手动录入"}</p>
                            </div>
                            <select
                              className={cn(inputCls, "h-9 py-1 text-xs")}
                              value={application.stage}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => void handleUpdateApplication(application.id, { stage: e.target.value as ApplicationStage })}
                            >
                              {applicationStageOrder.map((stage) => <option key={stage} value={stage}>{applicationStageLabels[stage]}</option>)}
                            </select>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{score || "-"}</span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-zinc-900" style={{ width: `${score}%` }} />
                              </div>
                            </div>
                            <span className="text-slate-600">{salary}</span>
                            <span className="truncate text-slate-600">{application.location || "-"}</span>
                            <input
                              className={cn(inputCls, "h-9 py-1 text-xs")}
                              type="date"
                              value={toDateInputValue(application.followUpAt)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => void handleUpdateApplication(application.id, { followUpAt: e.target.value || null })}
                            />
                            <span className="truncate text-xs text-muted-foreground">{application.nextAction || application.progress.nextActions[0] || "生成匹配报告"}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </Panel>

            <div className="grid gap-4 xl:grid-cols-[minmax(340px,440px)_1fr]">
              <Panel title="新增 / 保存岗位" icon={<Plus size={16} />}>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="公司"><input className={inputCls} placeholder="例如 字节跳动" value={applicationForm.companyName} onChange={(e) => setApplicationForm({ ...applicationForm, companyName: e.target.value })} /></Field>
                    <Field label="岗位"><input className={inputCls} placeholder="例如 AI 后端工程师" value={applicationForm.roleName} onChange={(e) => setApplicationForm({ ...applicationForm, roleName: e.target.value })} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="级别"><select className={inputCls} value={applicationForm.level} onChange={(e) => setApplicationForm({ ...applicationForm, level: e.target.value as CandidateSeniority })}>{seniorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
                    <Field label="阶段"><select className={inputCls} value={applicationForm.stage} onChange={(e) => setApplicationForm({ ...applicationForm, stage: e.target.value as ApplicationStage })}>{applicationStageOrder.map((stage) => <option key={stage} value={stage}>{applicationStageLabels[stage]}</option>)}</select></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="薪资下限 K"><input className={inputCls} type="number" min={0} max={300} value={applicationForm.salaryMinK} onChange={(e) => setApplicationForm({ ...applicationForm, salaryMinK: Number(e.target.value), salaryK: Number(e.target.value) })} /></Field>
                    <Field label="薪资上限 K"><input className={inputCls} type="number" min={0} max={300} value={applicationForm.salaryMaxK} onChange={(e) => setApplicationForm({ ...applicationForm, salaryMaxK: Number(e.target.value) })} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="地点"><input className={inputCls} placeholder="北京 / 远程" value={applicationForm.location} onChange={(e) => setApplicationForm({ ...applicationForm, location: e.target.value })} /></Field>
                    <Field label="来源"><input className={inputCls} placeholder="Boss / 内推 / 官网" value={applicationForm.source} onChange={(e) => setApplicationForm({ ...applicationForm, source: e.target.value })} /></Field>
                  </div>
                  <Field label="岗位链接"><input className={inputCls} placeholder="https://..." value={applicationForm.jobUrl} onChange={(e) => setApplicationForm({ ...applicationForm, jobUrl: e.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="关联简历"><select className={inputCls} value={applicationForm.resumeProfileId} onChange={(e) => setApplicationForm({ ...applicationForm, resumeProfileId: e.target.value })}><option value="">暂不关联</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}</select></Field>
                    <Field label="关联 JD"><select className={inputCls} value={applicationForm.jobTargetId} onChange={(e) => setApplicationForm({ ...applicationForm, jobTargetId: e.target.value })}><option value="">暂不关联</option>{jobTargets.map((target) => <option key={target.id} value={target.id}>{target.company?.name ? `${target.company.name} · ` : ""}{target.roleName}</option>)}</select></Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="投递日"><input className={inputCls} type="date" value={applicationForm.appliedAt} onChange={(e) => setApplicationForm({ ...applicationForm, appliedAt: e.target.value })} /></Field>
                    <Field label="跟进日"><input className={inputCls} type="date" value={applicationForm.followUpAt} onChange={(e) => setApplicationForm({ ...applicationForm, followUpAt: e.target.value })} /></Field>
                    <Field label="截止日"><input className={inputCls} type="date" value={applicationForm.deadlineAt} onChange={(e) => setApplicationForm({ ...applicationForm, deadlineAt: e.target.value })} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="联系人"><input className={inputCls} value={applicationForm.contactName} onChange={(e) => setApplicationForm({ ...applicationForm, contactName: e.target.value })} /></Field>
                    <Field label="邮箱"><input className={inputCls} value={applicationForm.contactEmail} onChange={(e) => setApplicationForm({ ...applicationForm, contactEmail: e.target.value })} /></Field>
                  </div>
                  <Field label="JD 原文快照"><textarea className={textareaCls + " min-h-[120px]"} placeholder="粘贴 JD，后续匹配和简历定制都从这里开始。" value={applicationForm.jdSnapshot} onChange={(e) => setApplicationForm({ ...applicationForm, jdSnapshot: e.target.value })} /></Field>
                  <Field label="备注"><textarea className={textareaCls + " min-h-[76px]"} placeholder="投递渠道、面试轮次、准备重点。" value={applicationForm.note} onChange={(e) => setApplicationForm({ ...applicationForm, note: e.target.value })} /></Field>
                  <button className={btnPrimary} type="button" onClick={() => void handleCreateApplication()} disabled={busy === "application-create"}><Plus size={15} /> 创建机会</button>
                </div>
              </Panel>

              <Panel title="岗位详情工作台" icon={<Target size={16} />}>
                {!selectedApplication ? (
                  <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">选择一个机会查看 Teal 式准备闭环。</div>
                ) : (
                  <div className="grid gap-4">
                    <div className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill variant="brand">{applicationStageLabels[selectedApplication.stage] ?? selectedApplication.stage}</Pill>
                            <Pill variant="accent">优先级 {selectedApplication.priority}</Pill>
                            {selectedApplication.jobUrl && <a className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:underline" href={selectedApplication.jobUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> 岗位链接</a>}
                          </div>
                          <h3 className="mt-3 text-xl font-semibold">{selectedApplication.company?.name ?? "未填写公司"} · {selectedApplication.roleName}</h3>
                          <p className="mt-1 text-sm text-slate-600">{selectedApplication.location || "未填写地点"} · {selectedApplication.source || "手动录入"} · {formatDate(selectedApplication.updatedAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className={btnSecondary} type="button" onClick={() => void handleMatchApplication(selectedApplication.id)} disabled={busy === `application-match-${selectedApplication.id}`}><Sparkles size={15} /> 刷新匹配</button>
                          <button className={btnSecondary} type="button" onClick={() => void handleCreateResumeVersion(selectedApplication.id)} disabled={busy === `resume-version-create-${selectedApplication.id}`}><Copy size={15} /> 创建简历版本</button>
                          <button className={btnPrimary} type="button" onClick={() => setActiveTab("interview")}><MessageSquareText size={15} /> 去模拟</button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-5">
                        <ScoreCard label="准备度" value={selectedApplication.progress.overall} />
                        <ScoreCard label="匹配分" value={selectedApplication.matchReport?.matchScore ?? 0} />
                        <ScoreCard label="简历" value={selectedApplication.progress.resumeReady} />
                        <ScoreCard label="JD" value={selectedApplication.progress.jdReady} />
                        <ScoreCard label="模拟" value={selectedApplication.progress.mockReady} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {([
                        ["overview", "概览"],
                        ["jd", "JD"],
                        ["match", "匹配"],
                        ["resume", "简历版本"],
                        ["prep", "面试准备"],
                        ["activity", "活动"],
                      ] as Array<[ApplicationDetailTab, string]>).map(([tab, label]) => (
                        <button key={tab} type="button" className={cn("rounded-full border px-3 py-1.5 text-sm", applicationDetailTab === tab ? "border-zinc-900 bg-zinc-900 text-white" : "border-border bg-surface hover:bg-slate-50")} onClick={() => setApplicationDetailTab(tab)}>{label}</button>
                      ))}
                    </div>

                    {applicationDetailTab === "overview" && (
                      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                        <div className="rounded-xl border border-border bg-surface p-4">
                          <h4 className="text-sm font-semibold">下一步动作</h4>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">{selectedApplication.nextAction || selectedApplication.progress.nextActions[0] || "先补齐 JD，再生成一次匹配报告。"}</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {selectedApplication.progress.nextActions.map((action) => <div key={action} className="rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-slate-600">{action}</div>)}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-surface p-4">
                          <h4 className="text-sm font-semibold">Inline 更新</h4>
                          <div className="mt-3 grid gap-3">
                            <Field label="阶段"><select className={inputCls} value={selectedApplication.stage} onChange={(e) => void handleUpdateApplication(selectedApplication.id, { stage: e.target.value as ApplicationStage })}>{applicationStageOrder.map((stage) => <option key={stage} value={stage}>{applicationStageLabels[stage]}</option>)}</select></Field>
                            <Field label="优先级"><input className={inputCls} type="number" min={0} max={100} value={selectedApplication.priority} onChange={(e) => void handleUpdateApplication(selectedApplication.id, { priority: Number(e.target.value) })} /></Field>
                            <Field label="备注"><textarea className={textareaCls + " min-h-[80px]"} defaultValue={selectedApplication.note ?? ""} onBlur={(e) => void handleUpdateApplication(selectedApplication.id, { note: e.target.value })} /></Field>
                            <button className={btnGhost} type="button" onClick={() => void handleUpdateApplication(selectedApplication.id, { archived: !selectedApplication.archived })}>{selectedApplication.archived ? "恢复活跃" : "归档机会"}</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {applicationDetailTab === "jd" && (
                      <div className="grid gap-3">
                        <textarea className={textareaCls + " min-h-[360px]"} placeholder="粘贴或编辑 JD 原文快照。" value={applicationJdDraft} onChange={(e) => setApplicationJdDraft(e.target.value)} />
                        <div className="flex flex-wrap gap-2">
                          <button className={btnPrimary} type="button" onClick={() => void handleSaveApplicationJd()}><Save size={15} /> 保存 JD</button>
                          <button className={btnSecondary} type="button" onClick={() => void handleMatchApplication(selectedApplication.id)}><Sparkles size={15} /> 保存后生成匹配</button>
                          <button className={btnGhost} type="button" onClick={() => setApplicationJdDraft(selectedApplication.jobTarget?.rawJd ?? "")}>使用关联 JD</button>
                        </div>
                      </div>
                    )}

                    {applicationDetailTab === "match" && (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-border bg-surface p-4">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold">Included Keywords</h4>
                            <Pill variant="brand">{selectedMatchReport?.includedKeywords.length ?? 0}</Pill>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {(selectedMatchReport?.includedKeywords ?? []).slice(0, 24).map((item) => <KeywordRow key={`${item.category}-${item.keyword}`} item={item} />)}
                            {!selectedMatchReport && <p className="text-sm text-muted-foreground">还没有匹配报告，先点击“刷新匹配”。</p>}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-surface p-4">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold">Missing Keywords</h4>
                            <Pill variant="warn">{selectedMatchReport?.missingKeywords.length ?? 0}</Pill>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {(selectedMatchReport?.missingKeywords ?? []).slice(0, 18).map((item) => (
                              <div key={`${item.category}-${item.keyword}`} className="rounded-lg border border-border bg-slate-50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <KeywordRow item={item} />
                                  {primaryResumeVersion && <button className={btnGhost} type="button" onClick={() => void handleGenerateResumeBullet(primaryResumeVersion.id, item.keyword)}>生成 bullet</button>}
                                </div>
                              </div>
                            ))}
                            {selectedMatchReport?.summary && <p className="rounded-lg border border-border bg-stone-50 p-3 text-sm leading-relaxed text-slate-600">{selectedMatchReport.summary}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {applicationDetailTab === "resume" && (
                      <div className="grid gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-muted-foreground">应用内版本不会覆盖原始简历；AI 生成内容先进入候选区。</p>
                          <button className={btnPrimary} type="button" onClick={() => void handleCreateResumeVersion(selectedApplication.id)}><Plus size={15} /> 创建定制版本</button>
                        </div>
                        {resumeVersions.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">还没有简历版本。创建一份后可以 Auto-Select 和生成 bullet。</div>
                        ) : (
                          resumeVersions.map((version) => (
                            <article key={version.id} className="rounded-xl border border-border bg-surface p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold">{version.title}</h4>{version.isPrimary && <Pill variant="brand">Primary</Pill>}<Pill variant="accent">{version.matchReport?.matchScore ?? 0} 分</Pill></div>
                                  <p className="mt-1 text-xs text-muted-foreground">{version.blocks.filter((block) => block.enabled).length}/{version.blocks.length} 个内容块启用 · {formatDate(version.updatedAt)}</p>
                                </div>
                                <button className={btnSecondary} type="button" onClick={() => void handleAutoSelectResumeVersion(version.id)} disabled={busy === `resume-version-auto-${version.id}`}><ListChecks size={15} /> Auto-Select</button>
                              </div>
                              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                                {version.blocks.slice(0, 8).map((block) => <div key={block.id} className={cn("rounded-lg border p-3", block.enabled ? "border-zinc-300 bg-zinc-50" : "border-border bg-surface opacity-60")}><div className="flex items-center justify-between gap-2"><strong className="text-xs">{block.title}</strong><Pill>{block.type}</Pill></div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{block.content}</p></div>)}
                              </div>
                              {Array.isArray(version.suggestions?.generatedBullets) && (
                                <TextList values={(version.suggestions.generatedBullets as Array<{ bullet?: string }>).map((item) => item.bullet ?? "").filter(Boolean).slice(-4)} />
                              )}
                            </article>
                          ))
                        )}
                      </div>
                    )}

                    {applicationDetailTab === "prep" && (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <Panel title="来源可信材料" icon={<FileText size={16} />}>
                          <div className="grid gap-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="来源类型"><select className={inputCls} value={sourceForm.sourceType} onChange={(e) => setSourceForm({ ...sourceForm, sourceType: e.target.value as SourceForm["sourceType"] })}><option value="note">备注</option><option value="resume">简历</option><option value="jd">JD</option><option value="article">技术文章</option><option value="experience">面经</option><option value="github">GitHub</option></select></Field>
                              <Field label="标题"><input className={inputCls} value={sourceForm.title} placeholder="例如 JD 原文 / README 摘要" onChange={(e) => setSourceForm({ ...sourceForm, title: e.target.value })} /></Field>
                            </div>
                            <textarea className={textareaCls + " min-h-[140px]"} placeholder="粘贴可引用的来源材料，Agent 输出会带 evidence。" value={sourceForm.content} onChange={(e) => setSourceForm({ ...sourceForm, content: e.target.value })} />
                            <button className={btnSecondary} type="button" onClick={() => void handleCreateSource()} disabled={busy === "source-create"}><Save size={15} /> 保存来源</button>
                            <div className="grid gap-2">{sourceDocuments.length === 0 ? <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">还没有来源材料。</div> : sourceDocuments.map((source) => <article key={source.id} className="rounded-xl border border-border bg-surface p-3"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{source.title}</strong><Pill>{source.sourceType}</Pill></div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{source.content}</p></article>)}</div>
                          </div>
                        </Panel>
                        <Panel title="Agent 运行结果" icon={<Sparkles size={16} />}>
                          {!agentRunResult ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">点击 Agent 后展示 output / execution / evidence。</div> : <div className="grid gap-4"><div className="rounded-xl border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-semibold">{String(agentRunResult.output.title ?? "Agent 输出")}</h4>{renderAgentSourceMix(agentRunResult.output.sourceMix)}</div><Pill variant={agentRunResult.execution.usedFallback ? "warn" : "brand"}>{agentRunResult.execution.usedFallback ? "fallback" : "success"}</Pill></div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{String(agentRunResult.output.summary ?? "")}</p></div>{Array.isArray(agentRunResult.output.highlights) && agentRunResult.output.highlights.length > 0 && <DataGroup title="关键亮点"><TextList values={(agentRunResult.output.highlights as string[]).filter(Boolean)} /></DataGroup>}{Array.isArray(agentRunResult.output.risks) && agentRunResult.output.risks.length > 0 && <DataGroup title="风险提醒"><TextList values={(agentRunResult.output.risks as string[]).filter(Boolean)} /></DataGroup>}{Array.isArray(agentRunResult.output.nextActions) && agentRunResult.output.nextActions.length > 0 && <DataGroup title="下一步动作"><TextList values={(agentRunResult.output.nextActions as string[]).filter(Boolean)} /></DataGroup>}{Array.isArray(agentRunResult.output.generatedArtifacts) && agentRunResult.output.generatedArtifacts.length > 0 && <DataGroup title="产物清单"><TextList values={(agentRunResult.output.generatedArtifacts as string[]).filter(Boolean)} /></DataGroup>}{Array.isArray(agentRunResult.output.githubSignals) && agentRunResult.output.githubSignals.length > 0 && <DataGroup title="GitHub 信号"><TextList values={(agentRunResult.output.githubSignals as string[]).filter(Boolean)} /></DataGroup>}<DataGroup title="执行步骤"><TextList values={agentRunResult.execution.steps} /></DataGroup><DataGroup title="引用证据">{agentRunResult.evidence.length === 0 ? <p className="text-sm text-muted-foreground">暂无 evidence，当前内容应视为 AI 推断。</p> : <div className="grid gap-2">{agentRunResult.evidence.map((item, index) => <article key={`${item.sourceId}-${item.chunkId}-${index}`} className="rounded-lg border border-border bg-slate-50 p-3"><p className="text-sm leading-relaxed text-slate-600">“{item.quote}”</p><p className="mt-1 text-xs text-muted-foreground">{item.reason}</p></article>)}</div>}</DataGroup></div>}
                        </Panel>
                      </div>
                    )}

                    {applicationDetailTab === "activity" && (
                      <div className="grid gap-2">
                        {(selectedApplication.activities ?? []).length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无活动记录。</div> : (selectedApplication.activities ?? []).map((activity) => <article key={activity.id} className="rounded-xl border border-border bg-surface p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{activity.title}</strong><span className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</span></div>{activity.detail && <p className="mt-1 text-sm text-slate-600">{activity.detail}</p>}</article>)}
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}

        {/* ─── Agents ─── */}
        {activeTab === "agents" && (
          <div className="grid gap-4 xl:grid-cols-[minmax(320px,460px)_1fr]">
            <Panel title="独立 Agent" icon={<Rocket size={16} />}>
              <div className="grid gap-3">
                {agentConfigs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无 Agent 配置。</div>
                ) : (
                  agentConfigs.map((agent) => (
                    <article key={agent.agentName} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold">{agent.displayName ?? agent.agentName}</h4>
                          <p className="mt-1 text-xs text-muted-foreground">{agent.agentName} · {agent.model ?? "GLM-5.1"}</p>
                        </div>
                        <Pill variant={agent.enabled ? "brand" : "warn"}>{agent.enabled ? "enabled" : "disabled"}</Pill>
                      </div>
                      <button className={btnSecondary + " mt-3"} type="button" onClick={() => void handleRunUnifiedAgent(agent.agentName)}
                        disabled={busy === `agent-run-${agent.agentName}`}>
                        <Sparkles size={15} /> 按统一协议运行
                      </button>
                    </article>
                  ))
                )}
              </div>
            </Panel>

            <Panel title="统一运行协议" icon={<Layers3 size={16} />}>
              <div className="grid gap-4">
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold">v1 协议</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    每个 Agent 独立配置、独立日志、独立 fallback。输入可以绑定当前求职机会和来源文档，输出统一包含 `output / execution / evidence`。
                  </p>
                </div>
                {agentRunResult && (
                  <div className="grid gap-3">
                    <DataGroup title="最近一次输出">
                      <pre className="max-h-[360px] overflow-auto rounded-xl border border-border bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
                        {JSON.stringify(agentRunResult, null, 2)}
                      </pre>
                    </DataGroup>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        )}

        {/* ─── Records ─── */}
        {activeTab === "records" && (
          <div className="grid gap-4">
            <Panel title="回顾记录" icon={<BookOpen size={16} />}>
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">记录库</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">平时直接浏览和筛选记录，需要新增时再进入 Agent 模块。</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className={btnPrimary} type="button" onClick={openRecordAgentEditor}>
                      <Plus size={15} /> 新增记录
                    </button>
                    <button className={btnSecondary} type="button" onClick={() => void handleSeedQuestionBank()} disabled={busy === "seed-bank"}>
                      <Sparkles size={15} /> 导入内置题库
                    </button>
                    <button className={btnGhost} type="button" onClick={() => void handleExportData()} disabled={busy === "export"}>
                      <Download size={15} /> 导出
                    </button>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input className={inputCls + " min-w-[220px] flex-1"} placeholder="搜索题目、答案、提示或标签" value={filters.q}
                        onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
                      <button className={btnSecondary} type="button" onClick={() => void loadKnowledge()}>
                        <Search size={15} /> 搜索
                      </button>
                      <button className={btnGhost} type="button" onClick={handleStartReview}>
                        <Play size={15} /> 复习
                      </button>
                    </div>
                    <div className="rounded-xl border border-border bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold">按标签筛选</h4>
                          <p className="mt-0.5 text-xs text-muted-foreground">支持按语言、技术栈和岗位方向快速切片，比如 `C++`、`后端开发`、`前端开发`、`产品设计`。</p>
                        </div>
                        {recordTagFilter && (
                          <button className={btnGhost} type="button" onClick={() => setRecordTagFilter("")}>
                            清空标签
                          </button>
                        )}
                      </div>
                      <div className="mt-3 grid gap-3">
                        {recordTagGroups.map((group) => (
                          <div key={group.title}>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.title}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {group.tags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    const nextTag = recordTagFilter.toLowerCase() === tag.toLowerCase() ? "" : tag;
                                    setRecordTagFilter(nextTag);
                                    void loadKnowledge({
                                      ...filters,
                                      q: filters.q,
                                    });
                                  }}
                                  className={cn(
                                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                                    recordTagFilter.toLowerCase() === tag.toLowerCase()
                                      ? "border-primary bg-primary-soft text-primary-hover"
                                      : "border-border bg-surface text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>当前结果：{recordCards.length} 条</span>
                      {recordTagFilter && <Pill variant="accent">标签：{recordTagFilter}</Pill>}
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_minmax(340px,460px)]">
                    <div className="grid max-h-[680px] gap-3 overflow-auto pr-1">
                      {recordCards.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无记录，先在左侧贴一段内容保存。</div>
                      ) : (
                        recordCards.map((card) => (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => { setSelectedKnowledgeId(card.id); setReviewMode(false); }}
                            className={cn(
                              "rounded-xl border bg-surface p-4 text-left shadow-sm transition-colors",
                              selectedKnowledgeCard?.id === card.id ? "border-primary ring-2 ring-primary/15" : "border-border hover:bg-slate-50",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-sm font-semibold leading-snug">{card.question}</h4>
                              <Pill variant={card.mastery >= 3 ? "brand" : "warn"}>{masteryLabels[card.mastery] ?? "未学"}</Pill>
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{card.answer}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {card.topic && <Pill>{card.topic.name}</Pill>}
                              {card.tags.slice(0, 3).map((tag) => <Pill key={tag}>{tag}</Pill>)}
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="rounded-xl border border-border bg-slate-50 p-4">
                      {!selectedKnowledgeCard ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">选择一条记录查看原文。</div>
                      ) : (
                        <div className="grid gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Pill variant="brand">记录详情</Pill>
                              <h4 className="mt-3 text-base font-semibold leading-snug">{selectedKnowledgeCard.question}</h4>
                            </div>
                            <button className={btnGhost} type="button" onClick={() => startKnowledgeEdit(selectedKnowledgeCard)}>
                              <Pencil size={14} /> 编辑
                            </button>
                          </div>
                          <div className="max-h-[420px] overflow-auto rounded-xl border border-border bg-surface p-4">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{selectedKnowledgeCard.answer}</p>
                          </div>
                          {selectedKnowledgeCard.note && (
                            <div className="rounded-xl border border-border bg-surface p-4">
                              <h5 className="text-sm font-semibold">面试提示</h5>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{selectedKnowledgeCard.note}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {selectedKnowledgeCard.topic && <Pill>{selectedKnowledgeCard.topic.name}</Pill>}
                            {selectedKnowledgeCard.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <ScoreCard label="掌握度" value={selectedKnowledgeCard.mastery} />
                            <ScoreCard label="复习次数" value={selectedKnowledgeCard.reviewCount} />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button className={btnPrimary} type="button" onClick={() => void updateKnowledgeProgress(selectedKnowledgeCard.id, Math.min(selectedKnowledgeCard.mastery + 1, 4), true)}>
                              <CheckCircle2 size={15} /> 已回顾
                            </button>
                            <button className={btnSecondary} type="button" onClick={() => void updateKnowledgeProgress(selectedKnowledgeCard.id, Math.max(selectedKnowledgeCard.mastery - 1, 0), true)}>
                              还不熟
                            </button>
                            <button className={btnGhost} type="button" onClick={() => setActiveTab("review")}>
                              <ClipboardList size={15} /> 复盘
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="辅助能力" icon={<Gauge size={16} />}>
              <div className="grid gap-3 md:grid-cols-3">
                <button className="rounded-xl border border-border p-4 text-left shadow-sm hover:bg-slate-50" type="button" onClick={() => setActiveTab("trends")}>
                  <h4 className="text-sm font-semibold">学习趋势</h4>
                  <p className="mt-1 text-sm text-muted-foreground">查看掌握度、复习和面试表现。</p>
                </button>
                <button className="rounded-xl border border-border p-4 text-left shadow-sm hover:bg-slate-50" type="button" onClick={() => setActiveTab("sprint")}>
                  <h4 className="text-sm font-semibold">冲刺任务</h4>
                  <p className="mt-1 text-sm text-muted-foreground">把记录和复盘拆成每日动作。</p>
                </button>
                <button className="rounded-xl border border-border p-4 text-left shadow-sm hover:bg-slate-50" type="button" onClick={() => setActiveTab("prep")}>
                  <h4 className="text-sm font-semibold">公司情报</h4>
                  <p className="mt-1 text-sm text-muted-foreground">面经、公司高频题作为补充入口。</p>
                </button>
              </div>
            </Panel>
          </div>
        )}

        {/* ─── Home ─── */}
        {activeTab === "home" && (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="今日任务" value={dailyData?.summary.total ?? 0} icon={<ListChecks size={16} />} />
              <MetricCard label="待复习题" value={dailyData?.summary.dueKnowledge ?? reviewQueue.length} icon={<BookOpen size={16} />} />
              <MetricCard label="复盘卡" value={todoReviewCount} icon={<ClipboardList size={16} />} />
              <MetricCard label="平均模拟分" value={averageInterviewScore || "-"} icon={<Gauge size={16} />} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(360px,460px)_1fr]">
              <Panel title="今日行动" icon={<ListChecks size={16} />}>
                <div className="grid gap-3">
                  {(dailyData?.dueCards ?? []).slice(0, 3).map((card) => (
                    <article key={`home-due-${card.id}`} className="rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold leading-snug">{card.question}</h4>
                        <Pill variant="brand">{card.topic?.name ?? "复习"}</Pill>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">{card.answer}</p>
                      <div className="mt-3 flex gap-2">
                        <button className={btnSecondary} type="button" onClick={() => { setSelectedKnowledgeId(card.id); setReviewMode(true); setActiveTab("knowledge"); }}>
                          <Eye size={14} /> 开始复习
                        </button>
                        <button className={btnGhost} type="button" onClick={() => void updateKnowledgeProgress(card.id, Math.min(card.mastery + 1, 4), true)}>
                          <CheckCircle2 size={14} /> 完成
                        </button>
                      </div>
                    </article>
                  ))}
                  {(dailyData?.reviewCards ?? []).slice(0, 2).map((card) => (
                    <article key={`home-review-${card.id}`} className="rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold leading-snug">{card.title}</h4>
                        <Pill variant="warn">复盘</Pill>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{card.suggestion}</p>
                      <button className={btnGhost + " mt-3"} type="button" onClick={() => setActiveTab("review")}>
                        <ClipboardList size={14} /> 去处理
                      </button>
                    </article>
                  ))}
                  {(dailyData?.sprintTasks ?? []).slice(0, 2).map((task) => (
                    <article key={`home-task-${task.id}`} className="rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold leading-snug">{task.title}</h4>
                        <Pill>Day {task.dayIndex + 1}</Pill>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{task.description}</p>
                      <button className={btnGhost + " mt-3"} type="button" onClick={() => setActiveTab("sprint")}>
                        <CalendarDays size={14} /> 看计划
                      </button>
                    </article>
                  ))}
                  {(!dailyData || dailyData.summary.total === 0) && (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center">
                      <p className="text-sm text-muted-foreground">今天还没有任务，先导入题库或创建岗位目标。</p>
                      <div className="mt-3 flex justify-center gap-2">
                        <button className={btnSecondary} type="button" onClick={() => setActiveTab("knowledge")}>去题库</button>
                        <button className={btnPrimary} type="button" onClick={() => setActiveTab("applications")}>建机会</button>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>

              <div className="grid gap-4">
                <Panel title="产品工作台" icon={<Gauge size={16} />}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button className="rounded-xl border border-border p-4 text-left shadow-sm transition-colors hover:bg-slate-50" type="button" onClick={handleStartReview}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">开始一轮复习</h4>
                        <Pill variant="brand">{reviewQueue.length} 题</Pill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">按优先级、掌握度和复习时间自动排序。</p>
                    </button>
                    <button className="rounded-xl border border-border p-4 text-left shadow-sm transition-colors hover:bg-slate-50" type="button" onClick={() => setActiveTab("interview")}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">继续模拟面试</h4>
                        <Pill variant="accent">{sessions.length} 轮</Pill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">基于简历、JD 和题库生成追问。</p>
                    </button>
                    <button className="rounded-xl border border-border p-4 text-left shadow-sm transition-colors hover:bg-slate-50" type="button" onClick={() => setActiveTab("resume")}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">完善简历</h4>
                        <Pill>{resumes.length} 份</Pill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">解析项目经历，生成追问题和 JD 匹配。</p>
                    </button>
                    <button className="rounded-xl border border-border p-4 text-left shadow-sm transition-colors hover:bg-slate-50" type="button" onClick={() => setActiveTab("applications")}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">推进求职机会</h4>
                        <Pill variant="warn">{applications.length} 个机会</Pill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">围绕一个公司岗位串起简历、JD、模拟和复盘。</p>
                    </button>
                    <button className="rounded-xl border border-border p-4 text-left shadow-sm transition-colors hover:bg-slate-50" type="button" onClick={() => void handleExportData()} disabled={busy === "export"}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">导出当前数据</h4>
                        <Download size={16} className="text-primary" />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">生成 JSON 备份，方便迁移和演示前留档。</p>
                    </button>
                  </div>
                </Panel>

                <Panel title="最近面试复盘" icon={<MessageSquareText size={16} />}>
                  {!latestFinishedSession ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">完成一轮模拟后会在这里出现复盘摘要</div>
                  ) : (
                    <article className="rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold">
                          {latestFinishedSession.company?.name ?? "未命名公司"} / {latestFinishedSession.targetRole ?? "目标岗位"}
                        </h4>
                        <Pill variant="accent">总分 {scoreOrDash(latestFinishedSession.score.overall)}</Pill>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{latestFinishedSession.summary}</p>
                      <div className="mt-3 flex gap-2">
                        <button className={btnSecondary} type="button" onClick={() => { setSelectedSessionId(latestFinishedSession.id); setActiveTab("interview"); }}>
                          <Eye size={14} /> 查看详情
                        </button>
                        <button className={btnGhost} type="button" onClick={() => setActiveTab("review")}>看复盘卡</button>
                      </div>
                    </article>
                  )}
                </Panel>
              </div>
            </div>
          </div>
        )}

        {/* ─── Targets ─── */}
        {activeTab === "targets" && (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(340px,440px)_1fr]">
              <Panel title="今日训练" icon={<ListChecks size={16} />}>
                {!dailyData ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">暂无今日任务</div>
                ) : (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-3">
                      <ScoreCard label="今日任务" value={dailyData.summary.total} />
                      <ScoreCard label="待复习题" value={dailyData.summary.dueKnowledge} />
                      <ScoreCard label="复盘卡" value={dailyData.summary.todoReview} />
                    </div>
                    <div className="grid gap-2">
                      {dailyData.dueCards.slice(0, 3).map((card) => (
                        <div key={`daily-card-${card.id}`} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center rounded-xl border border-border p-3">
                          <Pill>八股</Pill>
                          <div className="min-w-0">
                            <strong className="text-sm">{card.question}</strong>
                            <p className="mt-0.5 text-xs text-muted-foreground">{card.topic?.name ?? "通用"} / {masteryLabels[card.mastery] ?? "未学"}</p>
                          </div>
                          <button className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-slate-50" type="button"
                            onClick={() => void updateKnowledgeProgress(card.id, Math.min(card.mastery + 1, 4), true)}>完成</button>
                        </div>
                      ))}
                      {dailyData.reviewCards.slice(0, 2).map((card) => (
                        <div key={`daily-review-${card.id}`} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center rounded-xl border border-border p-3">
                          <Pill variant="warn">复盘</Pill>
                          <div className="min-w-0">
                            <strong className="text-sm">{card.title}</strong>
                            <p className="mt-0.5 text-xs text-muted-foreground">{card.weakness}</p>
                          </div>
                          <button className="rounded-lg px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary-soft" type="button"
                            onClick={() => setActiveTab("review")}>查看</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>

              <Panel title="岗位学习路径" icon={<GitBranch size={16} />}>
                {!learningPath ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">暂无路径</div>
                ) : (
                  <div className="grid gap-3">
                    <div>
                      <h4 className="text-sm font-semibold">{learningPath.role}</h4>
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">{learningPath.headline}</p>
                    </div>
                    {learningPath.stages.map((stage) => (
                      <article key={stage.title} className="rounded-xl border border-border p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="text-sm font-semibold">{stage.title}</h5>
                          <Pill variant="brand">{stage.topics.length} 个主题</Pill>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{stage.goal}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {stage.topics.map((topic) => <Pill key={topic}>{topic}</Pill>)}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(340px,440px)_1fr]">
              <Panel title="准备岗位" icon={<BriefcaseBusiness size={16} />}>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="公司">
                      <input className={inputCls} placeholder="可选" value={jdCompanyName} onChange={(e) => setJdCompanyName(e.target.value)} />
                    </Field>
                    <Field label="岗位">
                      <input className={inputCls} placeholder="可选" value={jdRoleName} onChange={(e) => setJdRoleName(e.target.value)} />
                    </Field>
                  </div>
                  {selectedResume && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                      <FileText size={14} />
                      <span>使用简历：{selectedResume.title}</span>
                    </div>
                  )}
                  <Field label="JD">
                    <textarea className={textareaCls + " min-h-[300px]"} placeholder="粘贴岗位描述" value={jdText} onChange={(e) => setJdText(e.target.value)} />
                  </Field>
                  <button className={btnPrimary} type="button" onClick={() => void handleJobTargetParse()} disabled={busy === "job-parse"}>
                    <Sparkles size={15} /> 生成目标
                  </button>
                </div>
              </Panel>

              <Panel title="岗位目标" icon={<Target size={16} />}>
                <div className="grid gap-3">
                  {jobTargets.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">暂无岗位目标</div>
                  ) : (
                    jobTargets.map((target) => (
                      <article key={target.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold">{target.company?.name ?? "未命名公司"} / {target.roleName}</h4>
                          <Pill variant="brand">匹配 {target.match.matchScore || 0}</Pill>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {target.parsed.requiredSkills.map((s) => <Pill key={s}>{s}</Pill>)}
                        </div>
                        <DataGroup title="面试重点"><TextList values={target.parsed.interviewFocus} /></DataGroup>
                        <DataGroup title="简历缺口"><TextList values={target.match.gaps} /></DataGroup>
                        <div className="mt-3 flex gap-2">
                          <button className={btnSecondary} type="button" onClick={() => setSelectedJobTargetId(target.id)}>
                            <Eye size={15} /> 看报告
                          </button>
                          <button className={btnSecondary} type="button" onClick={() => { setSelectedJobTargetId(target.id); setActiveTab("interview"); }}>
                            <Play size={15} /> 用它模拟
                          </button>
                          <button className={btnGhost} type="button" onClick={() => { setActiveTab("prep"); void loadCompanyPrep(target.company?.id ?? null); }}>
                            <Building2 size={15} /> 公司备考
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </Panel>
            </div>
            <Panel title="JD 匹配报告" icon={<Gauge size={16} />}>
              {!selectedJobTarget ? (
                <div className="py-8 text-center text-sm text-muted-foreground">选择一个岗位目标后查看匹配报告。</div>
              ) : (
                <div className="grid gap-5">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                    <div className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                      <p className="text-sm font-medium text-muted-foreground">匹配分</p>
                      <div className="mt-2 text-5xl font-bold text-foreground">{selectedJobTarget.match.matchScore || 0}</div>
                      <p className="mt-2 text-sm text-slate-600">
                        {selectedJobTarget.company?.name ?? "未命名公司"} / {selectedJobTarget.roleName}
                      </p>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                        <div className={cn("h-full rounded-full", progressGradientCls)} style={{ width: `${Math.min(selectedJobTarget.match.matchScore || 0, 100)}%` }} />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <DataGroup title="岗位职责"><TextList values={selectedJobTarget.parsed.responsibilities} /></DataGroup>
                      <DataGroup title="面试重点"><TextList values={selectedJobTarget.parsed.interviewFocus} /></DataGroup>
                      <DataGroup title="能力优势"><TextList values={selectedJobTarget.match.strengths} /></DataGroup>
                      <DataGroup title="待补缺口"><TextList values={selectedJobTarget.match.gaps} /></DataGroup>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <article className="rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold">项目讲述路线</h4>
                        <Pill variant="brand">简历对齐</Pill>
                      </div>
                      <TextList values={selectedJobTarget.match.projectTalkTracks} />
                    </article>
                    <article className="rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold">推荐下一步</h4>
                        <Pill variant="accent">闭环动作</Pill>
                      </div>
                      <div className="mt-3 grid gap-2">
                        <button className={btnSecondary} type="button" onClick={() => { setActiveTab("sprint"); void handleGenerateSprint(); }}>
                          <CalendarDays size={15} /> 生成冲刺计划
                        </button>
                        <button className={btnSecondary} type="button" onClick={() => { setActiveTab("interview"); void handleStartInterview(); }}>
                          <MessageSquareText size={15} /> 按 JD 启动模拟
                        </button>
                        <button className={btnGhost} type="button" onClick={() => { setActiveTab("knowledge"); setFilters((current) => ({ ...current, q: selectedJobTarget.parsed.requiredSkills[0] ?? "" })); }}>
                          <BookOpen size={15} /> 去题库补缺口
                        </button>
                      </div>
                    </article>
                  </div>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ─── Prep / 公司 ─── */}
        {activeTab === "prep" && (
          <div className="grid gap-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">公司情报</h3>
                <p className="mt-1 text-sm text-muted-foreground">录入真实面经，聚合高频题、轮次分布和公司定向训练。</p>
              </div>
              <div className="flex gap-2">
                <select className={compactSelectCls} value={prepCompanyId ?? ""} onChange={(e) => setPrepCompanyId(Number(e.target.value) || null)}>
                  <option value="">选择公司</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className={btnPrimary} type="button" onClick={() => void loadCompanyPrep()} disabled={!prepCompanyId || busy === "company-prep"}>
                  <Search size={15} /> 查看
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreCard label="整体准备度" value={companyIntel?.readiness.overall ?? companyPrep?.readiness.overall ?? 0} />
              <ScoreCard label="面经覆盖" value={companyIntel?.readiness.experience ?? 0} />
              <ScoreCard label="八股覆盖" value={companyIntel?.readiness.coverage ?? companyPrep?.readiness.coverage ?? 0} />
              <ScoreCard label="错题清理" value={companyIntel?.readiness.review ?? companyPrep?.readiness.review ?? 0} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="录入面经" icon={<Sparkles size={16} />}>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="公司">
                      <input className={inputCls} list="company-options" placeholder="如 Google" value={experienceCompanyName} onChange={(e) => setExperienceCompanyName(e.target.value)} />
                    </Field>
                    <Field label="岗位">
                      <input className={inputCls} placeholder="如 SWE / 后端工程师" value={experienceRoleName} onChange={(e) => setExperienceRoleName(e.target.value)} />
                    </Field>
                  </div>
                  <Field label="面经原文">
                    <textarea className={textareaCls + " min-h-[300px]"} placeholder="粘贴整段面经..." value={experienceText} onChange={(e) => setExperienceText(e.target.value)} />
                  </Field>
                  <div className="flex gap-2">
                    <button className={btnSecondary} type="button" onClick={() => void handleExperienceParse()} disabled={busy === "experience-parse"}>
                      <Sparkles size={15} /> AI 结构化
                    </button>
                    <button className={btnPrimary} type="button" onClick={() => void handleExperienceSave()} disabled={!experienceDraft || busy === "experience-save"}>
                      <Save size={15} /> 保存面经
                    </button>
                  </div>
                </div>
              </Panel>

              <Panel title="结构化预览" icon={<ClipboardList size={16} />}>
                {!experienceDraft ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">粘贴面经后生成结构化预览</div>
                ) : (
                  <div className="grid gap-3">
                    <article className="rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold">{experienceDraft.companyName || "目标公司"} / {experienceDraft.roleName}</h4>
                        <Pill variant="brand">{experienceDraft.confidence}</Pill>
                      </div>
                      <p className="mt-2 text-sm text-slate-500 leading-relaxed">{experienceDraft.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {experienceDraft.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
                      </div>
                    </article>
                    {experienceDraft.rounds.map((round) => (
                      <article key={`${round.order}-${round.roundType}`} className="rounded-xl border border-border p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="text-sm font-semibold">第 {round.order} 轮：{round.roundType}</h5>
                          <Pill variant="accent">{round.questions.length} 题</Pill>
                        </div>
                        <TextList values={round.questions} />
                      </article>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="公司高频题" icon={<BookOpen size={16} />}>
                {!companyIntel || companyIntel.highFrequencyQuestions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">选择公司或录入面经后查看高频题</div>
                ) : (
                  <div className="grid gap-3">
                    {companyIntel.highFrequencyQuestions.map((item) => (
                      <article key={item.question} className="rounded-xl border border-border p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="text-sm font-semibold">{item.question}</h5>
                          <Pill variant="accent">{item.count} 次</Pill>
                        </div>
                        <Pill>{item.roundType}</Pill>
                      </article>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="轮次情报" icon={<BarChart3 size={16} />}>
                {!companyIntel || companyIntel.roundDistribution.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">暂无轮次统计</div>
                ) : (
                  <div className="grid gap-3">
                    {companyIntel.roundDistribution.map((row) => (
                      <div key={row.roundType} className="rounded-xl border border-border p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="text-sm font-semibold">{row.roundType}</h5>
                          <Pill variant="brand">{row.count}</Pill>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", progressGradientCls)}
                            style={{ width: `${Math.min(row.count * 20, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                    <DataGroup title="下一步"><TextList values={companyIntel.nextActions} /></DataGroup>
                  </div>
                )}
              </Panel>
            </div>

            <Panel title="最近面经" icon={<MessageSquareText size={16} />}>
              <div className="mb-4 grid gap-3 rounded-xl border border-border bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_160px]">
                  <input className={inputCls} placeholder="关键词" value={experienceFilters.q}
                    onChange={(e) => setExperienceFilters({ ...experienceFilters, q: e.target.value })} />
                  <input className={inputCls} placeholder="公司" value={experienceFilters.company}
                    onChange={(e) => setExperienceFilters({ ...experienceFilters, company: e.target.value })} />
                  <input className={inputCls} placeholder="岗位" value={experienceFilters.role}
                    onChange={(e) => setExperienceFilters({ ...experienceFilters, role: e.target.value })} />
                  <input className={inputCls} placeholder="轮次" value={experienceFilters.roundType}
                    onChange={(e) => setExperienceFilters({ ...experienceFilters, roundType: e.target.value })} />
                  <select className={inputCls} value={experienceFilters.confidence}
                    onChange={(e) => setExperienceFilters({ ...experienceFilters, confidence: e.target.value })}>
                    <option value="">全部可信度</option>
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(companyIntel?.roleNames ?? []).map((role) => (
                      <button key={role} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground" type="button"
                        onClick={() => {
                          const next = { ...experienceFilters, role };
                          setExperienceFilters(next);
                          void loadExperiences(next);
                        }}>
                        {role}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className={btnPrimary} type="button" onClick={() => void loadExperiences(experienceFilters)}>
                      <Search size={15} /> 筛选面经
                    </button>
                    <button className={btnGhost} type="button" onClick={() => {
                      const next = { q: "", company: "", role: "", roundType: "", confidence: "" };
                      setExperienceFilters(next);
                      void loadExperiences(next);
                    }}>重置</button>
                  </div>
                </div>
              </div>
              <ExperienceList experiences={experiences}
                onGenerateCards={handleExperienceGenerateCards}
                onStartInterview={handleExperienceStartInterview}
                onCreateTasks={handleExperienceCreateTasks} />
            </Panel>
          </div>
        )}

        {/* ─── Knowledge ─── */}
        {activeTab === "knowledge" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(340px,440px)_1fr]">
            <Panel title="录入八股" icon={<Sparkles size={16} />}>
              <div className="grid gap-3">
                <Field label="题目">
                  <textarea className={textareaCls} placeholder="面试题" value={knowledgeForm.question}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, question: e.target.value })} />
                </Field>
                <Field label="答案">
                  <textarea className={textareaCls} placeholder="自己的答案或参考答案" value={knowledgeForm.answer}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, answer: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="公司">
                    <input className={inputCls} list="company-options" placeholder="可选" value={knowledgeForm.companyName}
                      onChange={(e) => setKnowledgeForm({ ...knowledgeForm, companyName: e.target.value })} />
                  </Field>
                  <Field label="主题">
                    <input className={inputCls} list="topic-options" placeholder="可选" value={knowledgeForm.topicName}
                      onChange={(e) => setKnowledgeForm({ ...knowledgeForm, topicName: e.target.value })} />
                  </Field>
                </div>
                {knowledgeSuggestion && (
                  <article className="rounded-xl border border-accent/30 bg-accent-soft p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold">AI 建议：{knowledgeSuggestion.questionType}</h4>
                      <Pill variant="accent">优先级 {knowledgeSuggestion.priorityScore}</Pill>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {knowledgeSuggestion.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
                    </div>
                  </article>
                )}
                <div className="flex gap-2">
                  <button className={btnSecondary} type="button" onClick={() => void handleKnowledgeSuggest()} disabled={busy === "knowledge-suggest"}>
                    <Sparkles size={15} /> AI 建议
                  </button>
                  <button className={btnPrimary} type="button" onClick={() => void handleKnowledgeSave()} disabled={busy === "knowledge-save"}>
                    <Save size={15} /> 保存
                  </button>
                </div>
              </div>
            </Panel>

            <Panel title="学习卡" icon={<BookOpen size={16} />}>
              <div className="flex flex-wrap items-center gap-2">
                <input className={inputCls + " flex-1 min-w-[180px]"} placeholder="搜索八股" value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
                <button className={btnSecondary} type="button" onClick={() => void loadKnowledge()}>
                  <Search size={15} /> 搜索
                </button>
                <button className={btnGhost} type="button" onClick={() => {
                  const next = { q: "", company: "", topic: "", mastery: "", questionType: "" };
                  setFilters(next);
                  void loadKnowledge(next);
                }}>全部</button>
                <button className={btnSecondary} type="button" onClick={() => void handleSeedQuestionBank()} disabled={busy === "seed-bank"}>
                  <Sparkles size={15} /> 导入题库
                </button>
                <button className={btnSecondary} type="button" onClick={handleStartReview}>
                  <Play size={15} /> 复习模式
                </button>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(280px,1fr)_minmax(340px,440px)]">
                <div className="grid max-h-[760px] gap-3 overflow-auto pr-1">
                  {cards.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">暂无学习卡</div>
                  ) : (
                    cards.map((card) => (
                      <article
                        key={card.id}
                        className={cn(
                          "rounded-xl border bg-surface p-4 shadow-sm transition-colors",
                          selectedKnowledgeCard?.id === card.id ? "border-primary ring-2 ring-primary/15" : "border-border",
                        )}
                      >
                        <button className="block w-full text-left" type="button" onClick={() => { setSelectedKnowledgeId(card.id); setReviewMode(false); }}>
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-sm font-semibold leading-snug">{card.question}</h5>
                            <Pill variant={card.mastery >= 3 ? "brand" : "warn"}>{masteryLabels[card.mastery] ?? card.mastery}</Pill>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{card.answer}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {card.company && <Pill>{card.company.name}</Pill>}
                            {card.topic && <Pill>{card.topic.name}</Pill>}
                            <Pill variant="accent">{difficultyLabels[card.difficulty] ?? card.difficulty}</Pill>
                          </div>
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button className={btnSecondary} type="button" onClick={() => void updateKnowledgeProgress(card.id, Math.min(card.mastery + 1, 4), true)}>
                            <BookOpen size={14} /> 复习
                          </button>
                          <button className={btnGhost} type="button" onClick={() => startKnowledgeEdit(card)}>
                            <Pencil size={14} /> 编辑
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  {!selectedKnowledgeCard ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">选择一张学习卡查看详情</div>
                  ) : editingKnowledgeId === selectedKnowledgeCard.id ? (
                    <div className="grid gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold">编辑学习卡</h4>
                        <button className={btnGhost} type="button" onClick={() => setEditingKnowledgeId(null)}>取消</button>
                      </div>
                      <Field label="题目">
                        <textarea className={textareaCls} value={knowledgeEditForm.question} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, question: e.target.value })} />
                      </Field>
                      <Field label="答案">
                        <textarea className={textareaCls + " min-h-[180px]"} value={knowledgeEditForm.answer} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, answer: e.target.value })} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="公司">
                          <input className={inputCls} value={knowledgeEditForm.companyName} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, companyName: e.target.value })} />
                        </Field>
                        <Field label="主题">
                          <input className={inputCls} value={knowledgeEditForm.topicName} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, topicName: e.target.value })} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="掌握度">
                          <input className={inputCls} type="number" min={0} max={4} value={knowledgeEditForm.mastery} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, mastery: Number(e.target.value) })} />
                        </Field>
                        <Field label="优先级">
                          <input className={inputCls} type="number" min={0} max={100} value={knowledgeEditForm.priorityScore} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, priorityScore: Number(e.target.value) })} />
                        </Field>
                      </div>
                      <Field label="标签">
                        <input className={inputCls} value={knowledgeEditForm.tags} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, tags: e.target.value })} />
                      </Field>
                      <div className="flex gap-2">
                        <button className={btnPrimary} type="button" onClick={() => void handleKnowledgeUpdate()} disabled={busy === "knowledge-update"}>
                          <Save size={15} /> 保存修改
                        </button>
                        <button className={btnSecondary} type="button" onClick={() => void handleKnowledgeDelete(selectedKnowledgeCard.id)}>
                          <Trash2 size={15} /> 删除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Pill variant={reviewMode ? "accent" : "brand"}>{reviewMode ? "复习模式" : "题卡详情"}</Pill>
                          <h4 className="mt-3 text-base font-semibold leading-snug">{selectedKnowledgeCard.question}</h4>
                        </div>
                        <button className={btnGhost} type="button" onClick={() => startKnowledgeEdit(selectedKnowledgeCard)}>
                          <Pencil size={14} /> 编辑
                        </button>
                      </div>
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <h5 className="text-sm font-semibold">参考答案</h5>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{selectedKnowledgeCard.answer}</p>
                      </div>
                      {selectedKnowledgeCard.note && (
                        <div className="rounded-xl border border-border bg-surface p-4">
                          <h5 className="text-sm font-semibold">面试提示</h5>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{selectedKnowledgeCard.note}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <ScoreCard label="掌握度" value={selectedKnowledgeCard.mastery} />
                        <ScoreCard label="优先级" value={selectedKnowledgeCard.priorityScore} />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedKnowledgeCard.company && <Pill>{selectedKnowledgeCard.company.name}</Pill>}
                        {selectedKnowledgeCard.topic && <Pill>{selectedKnowledgeCard.topic.name}</Pill>}
                        {selectedKnowledgeCard.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className={btnPrimary} type="button" onClick={() => void updateKnowledgeProgress(selectedKnowledgeCard.id, Math.min(selectedKnowledgeCard.mastery + 1, 4), true)}>
                          <CheckCircle2 size={15} /> 已掌握
                        </button>
                        <button className={btnSecondary} type="button" onClick={() => void updateKnowledgeProgress(selectedKnowledgeCard.id, Math.max(selectedKnowledgeCard.mastery - 1, 0), true)}>
                          还不熟
                        </button>
                        {reviewMode && (
                          <button className={btnGhost} type="button" onClick={() => {
                            const currentIndex = reviewQueue.findIndex((card) => card.id === selectedKnowledgeCard.id);
                            setSelectedKnowledgeId(reviewQueue[currentIndex + 1]?.id ?? reviewQueue[0]?.id ?? selectedKnowledgeCard.id);
                          }}>
                            下一题
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* ─── Resume ─── */}
        {activeTab === "resume" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="贴简历" icon={<FileText size={16} />}>
              <div className="grid gap-3">
                <Field label="标题">
                  <input className={inputCls} placeholder="如：后端实习版 / AI 平台版" value={resumeTitle} onChange={(e) => setResumeTitle(e.target.value)} />
                </Field>
                <Field label="简历">
                  <textarea className={textareaCls + " min-h-[300px]"} placeholder="粘贴简历文本" value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)} />
                </Field>
                <button className={btnPrimary} type="button" onClick={() => void handleResumeParse()} disabled={busy === "resume-parse"}>
                  <Sparkles size={15} /> 解析简历
                </button>
              </div>
            </Panel>

            <Panel title="结构化简历" icon={<Layers3 size={16} />}>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  {resumes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">暂无简历</div>
                  ) : (
                    resumes.map((resume) => (
                      <button
                        key={resume.id}
                        type="button"
                        onClick={() => setSelectedResumeId(resume.id)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors",
                          selectedResumeId === resume.id ? "border-primary bg-primary-soft/50" : "border-border hover:bg-slate-50",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-sm">{resume.title}</strong>
                          <Pill>{formatDate(resume.updatedAt)}</Pill>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{resume.parsed.summary || resume.rawText}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
              {!selectedResume ? (
                <div className="py-8 text-center text-sm text-muted-foreground">暂无简历</div>
              ) : (
                <div className="mt-3.5 grid gap-3">
                  <div className="grid gap-2 rounded-xl border border-border bg-slate-50 p-3">
                    <Field label="简历标题">
                      <input className={inputCls} value={resumeRenameTitle} onChange={(e) => setResumeRenameTitle(e.target.value)} />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <button className={btnSecondary} type="button" onClick={() => void handleResumeRename()} disabled={busy === "resume-rename"}>
                        <Pencil size={14} /> 保存标题
                      </button>
                      <button className={btnGhost} type="button" onClick={() => void handleResumeDelete()} disabled={busy === "resume-delete"}>
                        <Trash2 size={14} /> 删除简历
                      </button>
                      <button className={btnPrimary} type="button" onClick={() => setActiveTab("targets")}>
                        <Target size={14} /> 去匹配 JD
                      </button>
                    </div>
                  </div>
                  <DataGroup title="概述">
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedResume.parsed.summary}</p>
                  </DataGroup>
                  <DataGroup title="技能">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedResume.parsed.skills.map((s) => <Pill key={s}>{s}</Pill>)}
                    </div>
                  </DataGroup>
                  <DataGroup title="项目"><TextList values={selectedResume.parsed.projects} /></DataGroup>
                  <DataGroup title="补充问题"><TextList values={selectedResume.followUpQuestions} /></DataGroup>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ─── Mock Interviewer Agent ─── */}
        {activeTab === "interviewer" && (
          <div className="grid gap-4">
            <Panel title="面试官 Agent" icon={<UserRound size={16} />}>
              <div className="grid gap-4 lg:grid-cols-[minmax(340px,460px)_1fr]">
                <div className="grid gap-4">
                  <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Pill variant="brand">V1 · 文本面试</Pill>
                        <h3 className="mt-3 text-lg font-semibold">贴入简历，Agent 帮你控完整场面试</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">按时长和级别生成问题、动态追问，最后统一给总分、逐题评分和参考好答案。</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill>{interviewerDuration} 分钟</Pill>
                        <button
                          className={btnSecondary}
                          type="button"
                          onClick={() => {
                            setActiveTab("interview");
                            setInterviewWorkspace("candidate");
                          }}
                        >
                          <UserRound size={15} /> 去面试者练习
                        </button>
                      </div>
                    </div>
                  </article>

                  <Panel title="准备态" icon={<ClipboardList size={16} />}>
                    <div className="grid gap-3">
                      {selectedResume && (
                        <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">当前简历：{selectedResume.title}</span>
                            <button className={btnGhost} type="button" onClick={() => setInterviewerResumeText(selectedResume.rawText)}>
                              <FileText size={14} /> 填入文本
                            </button>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{selectedResume.parsed.summary || selectedResume.rawText}</p>
                        </div>
                      )}
                      <Field label="简历文本">
                        <textarea className={textareaCls + " min-h-[220px]"} placeholder="粘贴候选人简历。也可以直接使用当前选中的简历库简历。" value={interviewerResumeText} onChange={(e) => setInterviewerResumeText(e.target.value)} />
                      </Field>
                      <Field label="JD（可选）">
                        <textarea className={textareaCls} placeholder="可选：贴入岗位 JD，Agent 会把至少 30% 主问题对齐 JD 必备项。" value={interviewerJdText} onChange={(e) => setInterviewerJdText(e.target.value)} />
                      </Field>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="目标岗位">
                          <input className={inputCls} placeholder={selectedJobTarget?.roleName ?? "如 前端工程师"} value={interviewerRole} onChange={(e) => setInterviewerRole(e.target.value)} />
                        </Field>
                        <Field label="目标公司">
                          <input className={inputCls} placeholder={selectedJobTarget?.company?.name ?? "可选"} value={interviewerCompanyName} onChange={(e) => setInterviewerCompanyName(e.target.value)} />
                        </Field>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="面试时长">
                          <select className={inputCls} value={interviewerDuration} onChange={(e) => setInterviewerDuration(Number(e.target.value) as 10 | 20 | 30 | 45)}>
                            <option value={10}>10 分钟 · 最多 4 轮</option>
                            <option value={20}>20 分钟 · 最多 7 轮</option>
                            <option value={30}>30 分钟 · 最多 10 轮</option>
                            <option value={45}>45 分钟 · 最多 15 轮</option>
                          </select>
                        </Field>
                        <Field label="候选人级别">
                          <select className={inputCls} value={interviewerSeniority} onChange={(e) => setInterviewerSeniority(e.target.value as "junior" | "mid" | "senior" | "staff")}>
                            <option value="junior">初级</option>
                            <option value="mid">中级</option>
                            <option value="senior">高级</option>
                            <option value="staff">专家</option>
                          </select>
                        </Field>
                      </div>
                      <button className={btnPrimary} type="button" onClick={() => void handleStartInterviewerSession()} disabled={busy === "interviewer-start"}>
                        <Sparkles size={15} /> 生成 {interviewerDuration} 分钟面试
                      </button>
                    </div>
                  </Panel>
                </div>

                <div className="grid gap-4">
                  <Panel title="进行态" icon={<MessageSquareText size={16} />}>
                    {!interviewerSession ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">左侧贴入简历并开始后，这里会出现完整题纲和全局纪要区。</div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-[minmax(300px,0.95fr)_minmax(360px,1.05fr)]">
                        <div className="grid gap-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-2">
                              <Pill variant="brand">{interviewerSession.status === "finished" ? "已完成" : "进行中"}</Pill>
                              <Pill>{interviewerPrimaryCoveredCount}/{interviewerTotalBudget || interviewerPrimaryTurns.length} 个主问题已覆盖</Pill>
                              <Pill>{interviewerDiscussionTurns.length} 张自由讨论卡</Pill>
                            </div>
                            <button className={btnGhost} type="button" onClick={() => setShowInterviewerIdealAnswer((value) => !value)} disabled={!interviewerFocusedTurn}>
                              <Eye size={15} /> {showInterviewerIdealAnswer ? "隐藏参考答案" : "看参考答案"}
                            </button>
                          </div>

                          <div className="grid gap-3">
                            {interviewerPrimaryTurns.map((turn) => {
                              const followUps = interviewerSession.turns.filter((item) => item.parentTurnId === turn.id && item.turnType === "followup");
                              const covered = Boolean(turn.answer?.trim());
                              return (
                                <button
                                  key={turn.id}
                                  type="button"
                                  onClick={() => {
                                    setFocusedInterviewerTurnId(turn.id);
                                    setInterviewerAnswerText(turn.answer ?? "");
                                  }}
                                  className={cn(
                                    "rounded-2xl border p-4 text-left shadow-sm transition-colors",
                                    interviewerFocusedTurn?.id === turn.id ? "border-primary bg-primary-soft/40" : "border-border bg-surface hover:bg-slate-50",
                                  )}
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <div className="flex flex-wrap gap-2">
                                        <Pill variant="brand">主问题 {turn.order}</Pill>
                                        {turn.questionSource && <Pill>{turn.questionSource}</Pill>}
                                      </div>
                                      {turn.intent && <p className="mt-2 text-xs text-muted-foreground">考察点：{turn.intent}</p>}
                                    </div>
                                    <Pill variant={covered ? "brand" : "accent"}>{covered ? "已覆盖" : "待覆盖"}</Pill>
                                  </div>
                                  <p className="mt-3 text-sm font-medium leading-relaxed">{turn.question}</p>
                                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                    {turn.answer?.trim() || "还没有纪要。"}
                                  </p>
                                  {followUps.length > 0 && (
                                    <p className="mt-2 text-xs text-muted-foreground">追问 {followUps.length} 条</p>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <div className="grid gap-3 rounded-2xl border border-border bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold">自由讨论卡</p>
                                <p className="text-xs text-muted-foreground">不强挂原题的偏移内容统一放这里。</p>
                              </div>
                            </div>
                            {interviewerDiscussionTurns.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">还没有自由讨论卡。</div>
                            ) : (
                              <div className="grid gap-2">
                                {interviewerDiscussionTurns.map((turn) => (
                                  <button
                                    key={turn.id}
                                    type="button"
                                    onClick={() => {
                                      setFocusedInterviewerTurnId(turn.id);
                                      setInterviewerAnswerText(turn.answer ?? "");
                                    }}
                                    className={cn(
                                      "rounded-xl border p-3 text-left transition-colors",
                                      interviewerFocusedTurn?.id === turn.id ? "border-primary bg-primary-soft/40" : "border-border bg-surface hover:bg-white",
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <strong className="text-sm">{turn.question}</strong>
                                      <Pill variant="accent">讨论</Pill>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{turn.answer || "暂无纪要"}</p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{interviewerFocusedTurn?.turnType === "discussion" ? "自由讨论纪要" : "全局纪要区"}</p>
                            <p className="text-xs text-muted-foreground">
                              {interviewerFocusedTurn
                                ? `当前聚焦：${interviewerFocusedTurn.question}`
                                : "先从左侧题纲或自由讨论卡选择一个聚焦对象。"}
                            </p>
                          </div>
                          {interviewerFocusedTurn?.turnType && <Pill variant={interviewerFocusedTurn.turnType === "discussion" ? "accent" : interviewerFocusedTurn.turnType === "followup" ? "accent" : "brand"}>{interviewerFocusedTurn.turnType}</Pill>}
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-border bg-slate-50 p-4">
                          {interviewerFocusedTurn?.turnType === "discussion" ? null : (
                            <article className="rounded-xl border border-border bg-surface p-4">
                              <p className="text-xs text-muted-foreground">当前题卡</p>
                              <h4 className="mt-1 text-sm font-semibold">{interviewerFocusedTurn?.question || "未选择题卡"}</h4>
                              {interviewerFocusedTurn?.intent && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">考察点：{interviewerFocusedTurn.intent}</p>}
                              {showInterviewerIdealAnswer && interviewerFocusedTurn?.idealAnswer && (
                                <div className="mt-3 rounded-lg border border-dashed border-border bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                                  <strong className="text-foreground">参考好答案：</strong>{interviewerFocusedTurn.idealAnswer}
                                </div>
                              )}
                              {interviewerSession.turns.filter((turn) => turn.parentTurnId === interviewerFocusedTurn?.id && turn.turnType === "followup").length > 0 && (
                                <DataGroup title="已挂载追问">
                                  <TextList values={interviewerSession.turns.filter((turn) => turn.parentTurnId === interviewerFocusedTurn?.id && turn.turnType === "followup").map((turn) => turn.question)} />
                                </DataGroup>
                              )}
                            </article>
                          )}

                          <Field label="纪要">
                            <textarea
                              className={textareaCls + " min-h-[220px]"}
                              placeholder={interviewerFocusedTurn?.turnType === "discussion" ? "记录这段自由讨论的要点、判断和结论。" : "记录这个主问题下的回答摘要、追问要点和你的观察。"}
                              value={interviewerAnswerText}
                              onChange={(e) => setInterviewerAnswerText(e.target.value)}
                            />
                          </Field>

                          <Field label="新建自由讨论卡标题">
                            <input
                              className={inputCls}
                              placeholder="可选。不填会从纪要第一行自动生成。"
                              value={interviewerDiscussionTitle}
                              onChange={(e) => setInterviewerDiscussionTitle(e.target.value)}
                            />
                          </Field>

                          <div className="flex flex-wrap gap-2">
                            <button className={btnPrimary} type="button" onClick={() => void handleSubmitInterviewerAnswer()} disabled={!interviewerFocusedTurn || busy === "interviewer-answer"}>
                              <Send size={15} /> 保存到当前题卡
                            </button>
                            <button className={btnSecondary} type="button" onClick={() => void handleCreateInterviewerDiscussion()} disabled={busy === "interviewer-answer"}>
                              <ClipboardList size={15} /> 新建自由讨论卡
                            </button>
                            <button className={btnGhost} type="button" onClick={() => void handleFinishInterviewerSession()} disabled={!interviewerSession || interviewerPrimaryCoveredCount === 0 || busy === "interviewer-finish"}>
                              <CheckCircle2 size={15} /> 生成评分复盘
                            </button>
                          </div>

                          <div className="rounded-xl border border-dashed border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground">
                            原始 turn 时间线仍然保留在会话数据里，但这里不再按逐轮回放驱动工作台。
                          </div>
                        </div>
                      </div>
                    )}
                  </Panel>

                  <Panel title="完成态" icon={<Gauge size={16} />}>
                    {!interviewerSummary && !interviewerSession?.summary ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">结束面试后，会在这里显示总分、维度分、逐题评分和改进答案。</div>
                    ) : (
                      <div className="grid gap-4">
                        <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overall Score</p>
                              <h3 className="mt-1 text-3xl font-bold">{interviewerSummary?.overallScore ?? scoreOrDash(interviewerSession?.score.overall)}</h3>
                              <p className="mt-2 text-sm leading-relaxed text-slate-600">{interviewerSummary?.summary ?? interviewerSession?.summary}</p>
                            </div>
                            <Pill variant="accent">final only</Pill>
                          </div>
                        </article>

                        {interviewerSummary && (
                          <div className="grid gap-4 lg:grid-cols-[minmax(360px,1.05fr)_minmax(300px,0.95fr)]">
                            <div className="grid gap-3">
                              {interviewerSummary.questionReviews.map((turn) => (
                                <article key={turn.turnId} className="rounded-xl border border-border p-4 shadow-sm">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <h4 className="text-sm font-semibold">主问题 {turn.order} · {turn.score} 分</h4>
                                    <Pill variant={turn.score >= 80 ? "brand" : "warn"}>{turn.score >= 80 ? "稳定" : "待加强"}</Pill>
                                  </div>
                                  <p className="mt-2 text-sm font-medium leading-relaxed">{turn.question}</p>
                                  <p className="mt-2 text-sm leading-relaxed text-slate-600"><strong>聚合反馈：</strong>{turn.feedback}</p>
                                  <p className="mt-2 text-sm leading-relaxed text-slate-600"><strong>参考好答案：</strong>{turn.idealAnswer}</p>
                                  {turn.followUps.length > 0 && <DataGroup title="本题追问"><TextList values={turn.followUps} /></DataGroup>}
                                  <DataGroup title="扣分点"><TextList values={turn.missedPoints.length ? turn.missedPoints : ["这题没有明显扣分点。"]} /></DataGroup>
                                </article>
                              ))}
                              {interviewerSummary.discussionReviews.length > 0 && (
                                <div className="grid gap-3">
                                  {interviewerSummary.discussionReviews.map((turn) => (
                                    <article key={turn.turnId} className="rounded-xl border border-border bg-slate-50 p-4 shadow-sm">
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <h4 className="text-sm font-semibold">自由讨论 · {turn.score} 分</h4>
                                        <Pill variant="accent">discussion</Pill>
                                      </div>
                                      <p className="mt-2 text-sm font-medium leading-relaxed">{turn.question}</p>
                                      <p className="mt-2 text-sm leading-relaxed text-slate-600"><strong>反馈：</strong>{turn.feedback}</p>
                                      <DataGroup title="扣分点"><TextList values={turn.missedPoints.length ? turn.missedPoints : ["这段讨论没有明显扣分点。"]} /></DataGroup>
                                    </article>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="grid gap-3">
                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                {Object.entries(interviewerSummary.dimensionAverages).map(([key, value]) => (
                                  <ScoreCard key={key} label={key} value={value} />
                                ))}
                              </div>
                              <DataGroup title="优势"><TextList values={interviewerSummary.strengths.length ? interviewerSummary.strengths : ["暂无明显优势，建议先补充回答结构和量化结果。"]} /></DataGroup>
                              <DataGroup title="下一步"><TextList values={interviewerSummary.nextActions} /></DataGroup>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Panel>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* ─── Interview ─── */}
        {activeTab === "interview" && (
          <div className="grid gap-4">
            <Panel title="面试工作台" icon={<MessageSquareText size={16} />}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
                  <button
                    className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      interviewWorkspace === "interviewer" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    type="button"
                    onClick={() => setInterviewWorkspace("interviewer")}
                  >
                    <ClipboardList size={15} /> 面试官文稿
                  </button>
                  <button
                    className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      interviewWorkspace === "candidate" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    type="button"
                    onClick={() => setInterviewWorkspace("candidate")}
                  >
                    <UserRound size={15} /> 面试者练习
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={btnGhost} type="button" onClick={() => setActiveTab("resume")}>
                    <FileText size={15} /> 简历库
                  </button>
                  <button className={btnGhost} type="button" onClick={() => setActiveTab("review")}>
                    <ClipboardList size={15} /> 复盘
                  </button>
                </div>
              </div>
            </Panel>

            {interviewWorkspace === "interviewer" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(360px,460px)_1fr]">
                <Panel title="生成文字版面试文稿" icon={<Sparkles size={16} />}>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="岗位">
                        <input className={inputCls} placeholder="如 前端工程师 / 后端工程师" value={scriptRoleName}
                          onChange={(e) => setScriptRoleName(e.target.value)} />
                      </Field>
                      <Field label="方向">
                        <input className={inputCls} placeholder="如 React / Java / 系统设计" value={scriptDirection}
                          onChange={(e) => setScriptDirection(e.target.value)} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="难度">
                        <select className={inputCls} value={scriptDifficulty} onChange={(e) => setScriptDifficulty(e.target.value as "easy" | "medium" | "hard")}>
                          <option value="easy">基础</option>
                          <option value="medium">中等</option>
                          <option value="hard">高难</option>
                        </select>
                      </Field>
                      <Field label="题数">
                        <input className={inputCls} type="number" min={3} max={12} value={scriptQuestionCount}
                          onChange={(e) => setScriptQuestionCount(Number(e.target.value))} />
                      </Field>
                    </div>
                    <Field label="重点">
                      <input className={inputCls} placeholder="可选，如 项目深挖 / 性能优化 / 分布式" value={scriptFocus}
                        onChange={(e) => setScriptFocus(e.target.value)} />
                    </Field>
                    <Field label="简历">
                      <textarea className={textareaCls + " min-h-[320px]"} placeholder="把候选人简历贴进来，先做文字版面试文稿。" value={scriptResumeText}
                        onChange={(e) => setScriptResumeText(e.target.value)} />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <button className={btnPrimary} type="button" onClick={() => void handleGenerateInterviewScript()} disabled={busy === "script-generate"}>
                        <Sparkles size={15} /> 生成文稿
                      </button>
                      {selectedResume && (
                        <button className={btnSecondary} type="button" onClick={() => {
                          setScriptResumeText(selectedResume.rawText);
                          setScriptRoleName(selectedJobTarget?.roleName ?? scriptRoleName);
                        }}>
                          <FileText size={15} /> 使用当前简历
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>

                <Panel title="面试文稿" icon={<FileText size={16} />}>
                  {!interviewScript ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">生成后会出现开场提示、问题、追问和评分口径。</div>
                  ) : (
                    <div className="grid gap-4">
                      <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Pill variant="brand">文字版</Pill>
                            <h3 className="mt-3 text-lg font-semibold">{interviewScript.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{interviewScript.overview}</p>
                          </div>
                          <div className="flex gap-2">
                            <button className={btnSecondary} type="button" onClick={copyInterviewScript}>
                              <Copy size={15} /> 复制
                            </button>
                            <button className={btnPrimary} type="button" onClick={startCandidatePracticeFromScript}>
                              <Play size={15} /> 切到练习
                            </button>
                          </div>
                        </div>
                      </article>

                      <DataGroup title="面试官提示"><TextList values={interviewScript.interviewerBrief} /></DataGroup>

                      <div className="grid gap-3">
                        {interviewScript.questions.map((question) => (
                          <article key={question.order} className="rounded-xl border border-border p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-sm font-semibold">第 {question.order} 题</h4>
                              <Pill variant="accent">{question.intent}</Pill>
                            </div>
                            <p className="mt-2 text-sm font-medium leading-relaxed">{question.question}</p>
                            <DataGroup title="追问"><TextList values={question.followUps} /></DataGroup>
                            <div className="grid gap-3 md:grid-cols-2">
                              <DataGroup title="优秀信号"><TextList values={question.strongSignals} /></DataGroup>
                              <DataGroup title="风险信号"><TextList values={question.redFlags} /></DataGroup>
                            </div>
                          </article>
                        ))}
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {interviewScript.rubric.map((item) => (
                          <article key={item.dimension} className="rounded-xl border border-border p-4 shadow-sm">
                            <h4 className="text-sm font-semibold">{item.dimension}</h4>
                            <p className="mt-2 text-xs leading-relaxed text-slate-600"><strong>优秀：</strong>{item.good}</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600"><strong>一般：</strong>{item.average}</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600"><strong>薄弱：</strong>{item.weak}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </Panel>
              </div>
            )}

            {interviewWorkspace === "candidate" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(360px,460px)_1fr]">
                <div className="grid gap-4">
                  <Panel title="候选人准备 Agent" icon={<Sparkles size={16} />}>
                    {!selectedResume ? (
                      <div className="grid gap-3">
                        <p className="text-sm leading-relaxed text-muted-foreground">先在简历库里选一份简历，候选人 Agent 才能开始分析。</p>
                        <button className={btnPrimary} type="button" onClick={() => setActiveTab("resume")}>
                          <FileText size={15} /> 去选择简历
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap gap-2">
                                <Pill variant="brand">{selectedResume.title}</Pill>
                                {selectedJobTarget && <Pill variant="accent">已带入 {selectedJobTarget.roleName}</Pill>}
                                {sourceDocuments.some((source) => source.sourceType === "github") && <Pill>已吸收 GitHub 来源</Pill>}
                              </div>
                              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                {selectedResume.candidatePrep?.headline || "让 Agent 把简历亮点、自我介绍、项目深挖和风险点整理成面试者准备面板。"}
                              </p>
                            </div>
                            <button className={btnPrimary} type="button" onClick={() => void handleGenerateCandidatePrep()} disabled={busy === "candidate-prep"}>
                              <Sparkles size={15} /> {selectedResume.candidatePrep ? "重新分析" : "生成准备面板"}
                            </button>
                          </div>
                        </article>

                        {selectedResume.candidatePrep ? (
                          <>
                            <div className="flex flex-wrap gap-2">
                              <button className={btnSecondary} type="button" onClick={applyCandidatePrepToInterviewer}>
                                <ClipboardList size={15} /> 带入面试官文稿
                              </button>
                              <button className={btnPrimary} type="button" onClick={() => void applyCandidatePrepToSimulation()} disabled={busy === "interview-start"}>
                                <Play size={15} /> 带入 AI 模拟
                              </button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <DataGroup title="简历亮点"><TextList values={selectedResume.candidatePrep.resumeHighlights} /></DataGroup>
                              <DataGroup title="岗位匹配"><TextList values={selectedResume.candidatePrep.jobAlignment} /></DataGroup>
                            </div>

                            <div className="rounded-xl border border-border bg-slate-50 p-4">
                              <h4 className="text-sm font-semibold">90 秒自我介绍</h4>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{selectedResume.candidatePrep.selfIntro90s}</p>
                            </div>

                            <div className="grid gap-3">
                              {selectedResume.candidatePrep.projectTalkTracks.map((item) => (
                                <article key={item.project} className="rounded-xl border border-border p-4 shadow-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <h4 className="text-sm font-semibold">{item.project}</h4>
                                    <Pill variant="accent">主讲项目</Pill>
                                  </div>
                                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.whyItMatters}</p>
                                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <DataGroup title="深挖点"><TextList values={item.deepDivePoints} /></DataGroup>
                                    <DataGroup title="证明点"><TextList values={item.proofPoints} /></DataGroup>
                                  </div>
                                </article>
                              ))}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <DataGroup title="风险点"><TextList values={selectedResume.candidatePrep.riskPoints} /></DataGroup>
                              <DataGroup title="常见追问"><TextList values={selectedResume.candidatePrep.followUpQuestions} /></DataGroup>
                            </div>

                            {candidatePrepExecution && (
                              <div className="rounded-xl border border-border bg-slate-50 p-4 text-xs leading-relaxed text-muted-foreground">
                                <p className="font-medium text-foreground">Agent 执行记录</p>
                                <p className="mt-1">{candidatePrepExecution.model}{candidatePrepExecution.usedFallback ? " · fallback" : ""}</p>
                                <div className="mt-2 space-y-1">
                                  {candidatePrepExecution.steps.map((step) => (
                                    <p key={step}>- {step}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                            生成后会出现：简历亮点、90 秒自我介绍、项目深挖点、风险点和常见追问。
                          </div>
                        )}
                      </div>
                    )}
                  </Panel>

                  <Panel title="面试级别与薪资难度" icon={<Gauge size={16} />}>
                    <div className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="候选人级别">
                          <select className={inputCls} value={candidateSeniority}
                            onChange={(e) => setCandidateSeniority(e.target.value as CandidateSeniority)}>
                            {seniorityOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="期望月薪（K）">
                          <input className={inputCls} type="number" min={0} max={150} value={candidateSalaryK}
                            onChange={(e) => setCandidateSalaryK(Math.max(0, Number(e.target.value) || 0))} />
                        </Field>
                      </div>
                      <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">自动面试强度</p>
                            <h4 className="mt-1 text-lg font-semibold">{candidateTarget.summary}</h4>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                              {difficultyCopy[candidateTarget.difficulty].description}
                            </p>
                          </div>
                          <Pill variant={candidateTarget.difficulty === "hard" ? "warn" : candidateTarget.difficulty === "medium" ? "accent" : "brand"}>
                            {difficultyCopy[candidateTarget.difficulty].tone}
                          </Pill>
                        </div>
                      </article>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        规则：中级或 20K+ 进入中等强度；高级、专家或 35K+ 进入高难强度。薪资越高，模拟会更偏系统设计、复杂排障、架构取舍和业务影响力追问。
                      </p>
                    </div>
                  </Panel>

                  <Panel title="按文稿练习" icon={<UserRound size={16} />}>
                    {!interviewScript ? (
                      <div className="grid gap-3">
                        <p className="text-sm leading-relaxed text-muted-foreground">先在“面试官文稿”里生成一份文字稿，再切回来逐题练习。</p>
                        <button className={btnPrimary} type="button" onClick={() => setInterviewWorkspace("interviewer")}>
                          <Sparkles size={15} /> 去生成文稿
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between gap-3">
                          <Pill variant="brand">第 {scriptPracticeIndex + 1}/{interviewScript.questions.length} 题</Pill>
                          <Pill>{Object.keys(scriptPracticeAnswers).length} 题已暂存</Pill>
                        </div>
                        <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
                          {[
                            { key: "structure", label: "结构作答" },
                            { key: "followup", label: "追问训练" },
                            { key: "risk", label: "风险防守" },
                            { key: "proof", label: "证据库" },
                            { key: "weakness", label: "弱点复练" },
                            { key: "checklist", label: "上场清单" },
                          ].map((item) => (
                            <button
                              key={item.key}
                              className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                                candidatePracticeMode === item.key ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                              type="button"
                              onClick={() => setCandidatePracticeMode(item.key as "structure" | "followup" | "risk" | "proof" | "weakness" | "checklist")}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                        <article className="rounded-xl border border-border bg-slate-50 p-4">
                          <h4 className="text-sm font-semibold">{currentScriptQuestion?.question}</h4>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{currentScriptQuestion?.intent}</p>
                        </article>

                        {candidatePracticeMode === "structure" && (
                          <div className="grid gap-3">
                            <textarea className={textareaCls + " min-h-[220px]"} placeholder="在这里写你的文字回答。" value={scriptPracticeAnswer}
                              onChange={(e) => {
                                setScriptPracticeAnswer(e.target.value);
                                setCandidatePracticeReview(null);
                              }} />
                            <div className="flex flex-wrap gap-2">
                              <button className={btnSecondary} type="button" onClick={fillCandidateAnswerTemplate}>
                                <Sparkles size={15} /> 填入答题骨架
                              </button>
                              <button className={btnSecondary} type="button" onClick={() => saveScriptPracticeAnswer()}>
                                <Save size={15} /> 暂存回答
                              </button>
                              <button className={btnPrimary} type="button" onClick={reviewScriptPracticeAnswer}>
                                <Gauge size={15} /> 本地诊断
                              </button>
                              <button className={btnGhost} type="button" onClick={applyCandidateNextAnswerDraft} disabled={!candidatePracticeReview}>
                                <Pencil size={15} /> 生成下一版
                              </button>
                              <button className={btnGhost} type="button" disabled={scriptPracticeIndex <= 0}
                                onClick={() => saveScriptPracticeAnswer(Math.max(scriptPracticeIndex - 1, 0))}>
                                上一题
                              </button>
                              <button className={btnPrimary} type="button" disabled={scriptPracticeIndex >= interviewScript.questions.length - 1}
                                onClick={() => saveScriptPracticeAnswer(Math.min(scriptPracticeIndex + 1, interviewScript.questions.length - 1))}>
                                下一题
                              </button>
                            </div>
                            {candidatePracticeReview && (
                              <article className="rounded-xl border border-border bg-slate-50 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Practice Review</p>
                                    <h4 className="mt-1 text-lg font-semibold">当前回答 {candidatePracticeReview.score} 分</h4>
                                  </div>
                                  <Pill variant={candidatePracticeReview.score >= 80 ? "brand" : "warn"}>
                                    {candidatePracticeReview.score >= 80 ? "可上场" : "继续打磨"}
                                  </Pill>
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                  <DataGroup title="做得好的"><TextList values={candidatePracticeReview.strengths} /></DataGroup>
                                  <DataGroup title="下一版要改"><TextList values={candidatePracticeReview.fixes} /></DataGroup>
                                </div>
                                {candidatePracticeReview.missingSignals.length > 0 && (
                                  <div className="mt-3">
                                    <DataGroup title="还没覆盖的优秀信号"><TextList values={candidatePracticeReview.missingSignals} /></DataGroup>
                                  </div>
                                )}
                                <div className="mt-3 rounded-lg border border-dashed border-border bg-surface p-3">
                                  <h5 className="text-sm font-semibold">推荐重答骨架</h5>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{candidatePracticeReview.rewrittenAnswer}</p>
                                </div>
                              </article>
                            )}
                          </div>
                        )}

                        {candidatePracticeMode === "followup" && (
                          <div className="grid gap-3">
                            {candidateFollowUpDrills.map((item) => (
                              <article key={`${item.title}-${item.question}`} className="rounded-xl border border-border p-4 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <h4 className="text-sm font-semibold">{item.title}</h4>
                                  <Pill variant="accent">追问</Pill>
                                </div>
                                <p className="mt-2 text-sm font-medium leading-relaxed">{item.question}</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600"><strong>策略：</strong>{item.strategy}</p>
                                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{item.answerFrame}</p>
                              </article>
                            ))}
                          </div>
                        )}

                        {candidatePracticeMode === "risk" && (
                          <div className="grid gap-3">
                            {candidateRiskDrills.map((item) => (
                              <article key={item.title} className="rounded-xl border border-border p-4 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <h4 className="text-sm font-semibold">{item.title}</h4>
                                  <Pill variant="warn">防守题</Pill>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.risk}</p>
                                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{item.drill}</p>
                              </article>
                            ))}
                          </div>
                        )}

                        {candidatePracticeMode === "proof" && (
                          <div className="grid gap-3">
                            <DataGroup title="可复用证明点">
                              <TextList values={candidateProofBank.length ? candidateProofBank : ["先生成候选人准备面板，系统会把亮点、岗位匹配和项目证明点沉淀在这里。"]} />
                            </DataGroup>
                            <DataGroup title="练习提示"><TextList values={interviewScript.candidateTips} /></DataGroup>
                          </div>
                        )}

                        {candidatePracticeMode === "weakness" && (
                          <div className="grid gap-3">
                            {candidateWeaknessQueue.map((item) => (
                              <article key={item.questionOrder} className="rounded-xl border border-border p-4 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <h4 className="text-sm font-semibold">第 {item.questionOrder} 题 · {item.score === null ? "待诊断" : `${item.score} 分`}</h4>
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{item.question}</p>
                                  </div>
                                  <Pill variant={item.priority === "high" ? "warn" : item.priority === "medium" ? "accent" : "brand"}>
                                    {item.priority === "high" ? "优先复练" : item.priority === "medium" ? "待补强" : "已稳定"}
                                  </Pill>
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600"><strong>原因：</strong>{item.reason}</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600"><strong>行动：</strong>{item.action}</p>
                                <button className={btnGhost} type="button" onClick={() => jumpToCandidatePracticeQuestion(item.questionOrder)}>
                                  <Play size={15} /> 去复练这题
                                </button>
                              </article>
                            ))}
                          </div>
                        )}

                        {candidatePracticeMode === "checklist" && (
                          <div className="grid gap-3">
                            <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Candidate Readiness</p>
                                  <h4 className="mt-1 text-lg font-semibold">
                                    {candidateReadinessChecklist.missing.length === 0 ? "可以上场" : "还差几块拼图"}
                                  </h4>
                                </div>
                                <Pill variant={candidateReadinessChecklist.missing.length === 0 ? "brand" : "warn"}>
                                  {candidateReadinessChecklist.ready.length}/{candidateReadinessChecklist.ready.length + candidateReadinessChecklist.missing.length}
                                </Pill>
                              </div>
                            </article>
                            <div className="grid gap-3 md:grid-cols-2">
                              <DataGroup title="已准备好"><TextList values={candidateReadinessChecklist.ready.length ? candidateReadinessChecklist.ready : ["还没有完成可确认的准备项。"]} /></DataGroup>
                              <DataGroup title="还缺什么"><TextList values={candidateReadinessChecklist.missing} /></DataGroup>
                            </div>
                            <DataGroup title="下一步行动"><TextList values={candidateReadinessChecklist.nextActions.length ? candidateReadinessChecklist.nextActions : ["保持当前材料，面试前再快速复述一次自我介绍和主讲项目。"]} /></DataGroup>
                          </div>
                        )}
                      </div>
                    )}
                  </Panel>

                  <Panel title="AI 文本模拟" icon={<MessageSquareText size={16} />}>
                    <div className="grid gap-3">
                      <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
                        {(Object.keys(interviewModeLabels) as InterviewMode[]).map((mode) => (
                          <button key={mode}
                            className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                              interviewMode === mode ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            onClick={() => setInterviewMode(mode)} type="button">
                            {interviewModeLabels[mode]}
                          </button>
                        ))}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="轮次">
                          <select className={inputCls} value={roundType} onChange={(e) => setRoundType(e.target.value as RoundType)}>
                            {(Object.keys(roundTypeLabels) as RoundType[]).map((type) => <option key={type} value={type}>{roundTypeLabels[type]}</option>)}
                          </select>
                        </Field>
                        <Field label="当前难度">
                          <input className={inputCls} value={`${candidateTarget.difficultyLabel} · ${candidateTarget.seniorityLabel}`} readOnly />
                        </Field>
                      </div>
                      <button className={btnPrimary} type="button" onClick={() => { setDeliveryMode("text"); void handleStartInterview(); }} disabled={busy === "interview-start"}>
                        <Play size={15} /> 开始{candidateTarget.difficultyLabel}文字模拟
                      </button>
                    </div>
                  </Panel>
                </div>

                <div className="flex min-h-[640px] flex-col rounded-xl border border-border bg-surface shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <h4 className="text-base font-semibold">
                      {activeSession ? `${interviewModeLabels[activeSession.mode]} / ${roundTypeLabels[activeSession.roundType]}` : "面试对话"}
                    </h4>
                    {activeSession && <Pill variant="brand">{activeSession.status}</Pill>}
                  </div>
                  <div className="flex-1 space-y-3 overflow-auto p-5">
                    {!activeSession ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">点击左侧“开始文字模拟”，AI 会一题一题追问。</div>
                    ) : (
                      activeSession.turns.map((turn) => (
                        <div key={turn.id}>
                          <div className="mr-auto max-w-[82%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                            {turn.question}
                          </div>
                          {turn.answer && (
                            <div className={cn("ml-auto max-w-[82%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-wrap", messageGradientCls)}>
                              {turn.answer}
                            </div>
                          )}
                          {turn.feedback && (
                            <article className="mt-2 rounded-xl border border-border bg-surface p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <h5 className="text-sm font-semibold">第 {turn.order} 题诊断</h5>
                                <Pill variant="accent">准确 {scoreOrDash(turn.score.accuracy)}</Pill>
                              </div>
                              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{turn.feedback}</p>
                              {turn.betterAnswer && <p className="mt-1 text-sm text-slate-500 leading-relaxed">{turn.betterAnswer}</p>}
                            </article>
                          )}
                        </div>
                      ))
                    )}
                    {activeSession?.summary && (
                      <article className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="text-sm font-semibold">总评</h5>
                          <Pill variant="accent">总分 {scoreOrDash(activeSession.score.overall)}</Pill>
                        </div>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{activeSession.summary}</p>
                      </article>
                    )}
                  </div>
                  <div className="grid gap-2.5 border-t border-border p-4">
                    {openTurn && activeSession?.status !== "finished" ? (
                      <>
                        <textarea className={textareaCls} placeholder="输入你的文字回答" value={answerText} onChange={(e) => setAnswerText(e.target.value)} />
                        <div className="flex gap-2">
                          <button className={btnPrimary} type="button" onClick={() => void handleSubmitAnswer()} disabled={busy === "interview-answer"}>
                            <Send size={15} /> 提交回答
                          </button>
                          <button className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                            type="button" onClick={() => void handleFinishInterview()} disabled={answeredTurns === 0 || busy === "interview-finish"}>
                            <CheckCircle2 size={15} /> 生成复盘
                          </button>
                        </div>
                      </>
                    ) : (
                      <button className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        type="button" onClick={() => void handleFinishInterview()} disabled={!activeSession || activeSession.status === "finished"}>
                        <CheckCircle2 size={15} /> 生成复盘
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Panel title="最近面试" icon={<ClipboardList size={16} />}>
              {sessions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">暂无面试记录</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {sessions.slice(0, 6).map((session) => (
                    <button key={session.id} type="button" className="rounded-xl border border-border p-4 text-left shadow-sm hover:bg-slate-50"
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setActiveSession(session.status === "active" ? session : activeSession);
                        setInterviewWorkspace("candidate");
                      }}>
                      <div className="flex items-start justify-between gap-3">
                        <h5 className="text-sm font-semibold">{interviewModeLabels[session.mode]} / {roundTypeLabels[session.roundType]}</h5>
                        <Pill variant={session.status === "finished" ? "brand" : "accent"}>{session.status === "finished" ? "已完成" : session.status}</Pill>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{session.company?.name ?? "未命名公司"}{session.targetRole ? ` / ${session.targetRole}` : ""}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Pill>总分 {scoreOrDash(session.score.overall)}</Pill>
                        <Pill>回答 {session.turns.filter((turn) => turn.answer).length}/{session.turns.length}</Pill>
                        <Pill>{formatDate(session.updatedAt)}</Pill>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ─── Articles ─── */}
        {activeTab === "articles" && (
          <ArticlesTab ref={articlesRef} onToast={setToast} />
        )}

        {/* ─── Startup Ideas ─── */}
        {activeTab === "ideas" && (
          <div className="grid gap-4">
            <Panel title="创业想法库" icon={<Rocket size={16} />}>
              <div className="grid gap-4">
                <div className="grid gap-3 xl:grid-cols-[minmax(320px,1.5fr)_170px_170px_auto_auto] xl:items-center">
                  <input
                    className={cn(inputCls, "xl:min-w-0")}
                    placeholder="搜索 idea、用户、方案、数据源或标签"
                    value={startupIdeaFilters.q}
                    onChange={(e) => setStartupIdeaFilters({ ...startupIdeaFilters, q: e.target.value })}
                  />
                  <select
                    className={compactSelectCls}
                    value={startupIdeaFilters.status}
                    onChange={(e) => {
                      const next = { ...startupIdeaFilters, status: e.target.value };
                      setStartupIdeaFilters(next);
                      void loadStartupIdeas(next);
                    }}
                  >
                    <option value="">全部状态</option>
                    {startupIdeaStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <select
                    className={compactSelectCls}
                    value={startupIdeaFilters.tag}
                    onChange={(e) => {
                      const next = { ...startupIdeaFilters, tag: e.target.value };
                      setStartupIdeaFilters(next);
                      void loadStartupIdeas(next);
                    }}
                  >
                    <option value="">全部标签</option>
                    {startupIdeaTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                  <button className={cn(btnSecondary, "xl:justify-center")} type="button" onClick={() => void loadStartupIdeas(startupIdeaFilters)}>
                    <Search size={15} /> 搜索
                  </button>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button className={btnSecondary} type="button" onClick={() => openStartupIdeaCreate()}>
                      <Sparkles size={15} /> Agent 生成
                    </button>
                    <button className={btnSecondary} type="button" onClick={() => openStartupIdeaCreate(aiPodcastIdeaForm)}>
                      <Sparkles size={15} /> AI 播客模板
                    </button>
                    <button className={btnPrimary} type="button" onClick={() => openStartupIdeaCreate()}>
                      <Plus size={15} /> 新建想法
                    </button>
                  </div>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
              <Panel title="想法列表" icon={<Rocket size={16} />}>
                {startupIdeas.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">还没有创业想法。可以先保存 AI 播客模板，后续继续补充验证计划。</p>
                    <button className={btnPrimary + " mx-auto mt-4"} type="button" onClick={() => openStartupIdeaCreate(aiPodcastIdeaForm)}>
                      <Sparkles size={15} /> 记录 AI 播客 idea
                    </button>
                  </div>
                ) : (
                  <div className="grid max-h-[680px] gap-2.5 overflow-auto pr-1">
                    {startupIdeas.map((idea) => (
                      <button
                        key={idea.id}
                        type="button"
                        onClick={() => setSelectedStartupIdeaId(idea.id)}
                        className={cn(
                          "rounded-xl border bg-surface p-3.5 text-left shadow-sm transition-colors",
                          selectedStartupIdea?.id === idea.id ? "border-primary ring-2 ring-primary/15" : "border-border hover:bg-slate-50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-sm font-semibold leading-snug">{idea.title}</h4>
                              <Pill variant={idea.status === "testing" ? "accent" : idea.status === "validated" ? "brand" : "default"}>{idea.status}</Pill>
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{idea.oneLiner || idea.solution || "暂无一句话描述"}</p>
                          </div>
                          <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">{formatDate(idea.updatedAt)}</span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {idea.tags.slice(0, 4).map((tag) => <Pill key={tag}>{tag}</Pill>)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="想法详情" icon={<Rocket size={16} />}>
                {!selectedStartupIdea ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">选择一个创业想法查看详情。</div>
                ) : (
                  <div className="grid gap-3">
                    <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Pill variant="brand">{selectedStartupIdea.status}</Pill>
                          <h3 className="mt-2.5 text-lg font-semibold leading-snug">{selectedStartupIdea.title}</h3>
                          {selectedStartupIdea.oneLiner && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{selectedStartupIdea.oneLiner}</p>}
                          <p className="mt-2 text-xs text-slate-500">最近更新：{formatDate(selectedStartupIdea.updatedAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className={btnSecondary} type="button" onClick={() => openStartupIdeaEdit(selectedStartupIdea)}>
                            <Pencil size={15} /> 编辑
                          </button>
                          <button className={btnGhost} type="button" onClick={() => void deleteStartupIdea(selectedStartupIdea.id)}>
                            <Trash2 size={15} /> 删除
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selectedStartupIdea.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
                      </div>
                    </article>

                    <div className="grid gap-3 xl:grid-cols-2">
                      <CompactIdeaCard title="用户痛点" value={selectedStartupIdea.problem} />
                      <CompactIdeaCard title="目标用户" value={selectedStartupIdea.targetUsers} />
                      <CompactIdeaCard title="解决方案" value={selectedStartupIdea.solution} />
                      <CompactIdeaCard title="数据输入" value={selectedStartupIdea.dataSignals} />
                    </div>

                    <CompactIdeaCard title="AI Agent 工作流">
                      {splitIdeaWorkflow(selectedStartupIdea.aiAgentFlow || "").length === 0 ? (
                        <p className="text-[13px] leading-6 text-slate-600">待补充</p>
                      ) : (
                        <ol className="grid max-h-[220px] gap-2 overflow-auto pr-1">
                          {splitIdeaWorkflow(selectedStartupIdea.aiAgentFlow || "").map((step, index) => (
                            <li key={`${selectedStartupIdea.id}-${index}`} className="grid grid-cols-[22px_1fr] gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-white">
                                {index + 1}
                              </span>
                              <p className="text-[13px] leading-6 text-slate-600">{step}</p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </CompactIdeaCard>

                    <div className="grid gap-3 xl:grid-cols-3">
                      <CompactIdeaCard title="商业化" value={selectedStartupIdea.monetization} />
                      <CompactIdeaCard title="验证计划" value={selectedStartupIdea.validationPlan} />
                      <CompactIdeaCard title="风险" value={selectedStartupIdea.risks} />
                    </div>
                  </div>
                )}
              </Panel>
            </div>

            {showStartupIdeaEditor && (
              <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 backdrop-blur-sm">
                <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
                  <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                      <h3 className="text-base font-semibold">{editingStartupIdeaId ? "编辑创业想法" : "新建创业想法"}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">把想法拆成痛点、用户、方案、Agent 流程和验证计划，方便后续迭代。</p>
                    </div>
                    <button className="rounded-lg p-2 text-muted-foreground hover:bg-slate-50 hover:text-foreground" type="button" onClick={() => setShowStartupIdeaEditor(false)}>
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-5">
                    <div className="grid gap-4">
                      <div className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold">LangGraph Agent 输入</h4>
                            <p className="mt-1 text-xs text-slate-600">
                              输入一句想法，Agent 会调用 GLM-5.1 按我们的模板生成创业想法详情。
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Pill variant="accent">LangGraph</Pill>
                            <Pill variant={startupIdeaAgentExecution?.usedFallback ? "warn" : "brand"}>
                              {startupIdeaAgentExecution?.usedFallback ? "Fallback" : "GLM-5.1"}
                            </Pill>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <Field label="一句想法">
                            <textarea
                              className={textareaCls + " min-h-[112px]"}
                              placeholder="例如：做一个帮求职者自动整理面经、生成追问训练计划的 Agent。"
                              value={startupIdeaAgentInput}
                              onChange={(e) => setStartupIdeaAgentInput(e.target.value)}
                            />
                          </Field>
                          <Field label="补充要求">
                            <input
                              className={inputCls}
                              placeholder="可选：例如先做 B2B 版、微信生态优先、要强调多 Agent 调度。"
                              value={startupIdeaAgentContext}
                              onChange={(e) => setStartupIdeaAgentContext(e.target.value)}
                            />
                          </Field>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-slate-600">
                              执行链路：拆解想法 → 生成方案骨架 → 输出模板详情
                            </p>
                            <button
                              className={btnPrimary}
                              type="button"
                              onClick={() => void generateStartupIdeaWithAgent()}
                              disabled={busy === "startup-idea-agent"}
                            >
                              <Sparkles size={15} />
                              {busy === "startup-idea-agent" ? "Agent 生成中" : "运行 Agent"}
                            </button>
                          </div>
                          {startupIdeaAgentExecution && (
                            <div className="rounded-xl border border-white/50 bg-white/70 p-3">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>模型：{startupIdeaAgentExecution.model}</span>
                                <span>·</span>
                                <span>{startupIdeaAgentExecution.usedFallback ? "当前为 fallback 输出" : "已使用真实模型生成"}</span>
                              </div>
                              <TextList values={startupIdeaAgentExecution.steps} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1.4fr_160px]">
                        <Field label="标题">
                          <input className={inputCls} value={startupIdeaForm.title} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, title: e.target.value })} />
                        </Field>
                        <Field label="状态">
                          <select className={inputCls} value={startupIdeaForm.status} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, status: e.target.value })}>
                            <option value="idea">idea</option>
                            <option value="research">research</option>
                            <option value="testing">testing</option>
                            <option value="validated">validated</option>
                            <option value="paused">paused</option>
                          </select>
                        </Field>
                      </div>
                      <Field label="一句话">
                        <input className={inputCls} value={startupIdeaForm.oneLiner} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, oneLiner: e.target.value })} />
                      </Field>
                      <Field label="标签">
                        <input className={inputCls} placeholder="逗号分隔" value={startupIdeaForm.tags} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, tags: e.target.value })} />
                      </Field>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="用户痛点">
                          <textarea className={textareaCls} value={startupIdeaForm.problem} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, problem: e.target.value })} />
                        </Field>
                        <Field label="目标用户">
                          <textarea className={textareaCls} value={startupIdeaForm.targetUsers} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, targetUsers: e.target.value })} />
                        </Field>
                      </div>
                      <Field label="解决方案">
                        <textarea className={textareaCls} value={startupIdeaForm.solution} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, solution: e.target.value })} />
                      </Field>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="AI Agent 工作流">
                          <textarea className={textareaCls + " min-h-[220px]"} value={startupIdeaForm.aiAgentFlow} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, aiAgentFlow: e.target.value })} />
                        </Field>
                        <Field label="数据输入">
                          <textarea className={textareaCls + " min-h-[220px]"} value={startupIdeaForm.dataSignals} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, dataSignals: e.target.value })} />
                        </Field>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Field label="商业化">
                          <textarea className={textareaCls} value={startupIdeaForm.monetization} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, monetization: e.target.value })} />
                        </Field>
                        <Field label="验证计划">
                          <textarea className={textareaCls} value={startupIdeaForm.validationPlan} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, validationPlan: e.target.value })} />
                        </Field>
                        <Field label="风险">
                          <textarea className={textareaCls} value={startupIdeaForm.risks} onChange={(e) => setStartupIdeaForm({ ...startupIdeaForm, risks: e.target.value })} />
                        </Field>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                    <button className={btnSecondary} type="button" onClick={() => setShowStartupIdeaEditor(false)}>取消</button>
                    <button className={btnPrimary} type="button" onClick={() => void saveStartupIdea()} disabled={busy === "startup-idea-save"}>
                      <Save size={15} /> 保存想法
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── GitHub Trends ─── */}
        {activeTab === "github" && (
          <div className="grid gap-4">
            <Panel title="开源趋势雷达" icon={<GitBranch size={16} />}>
              <div className="grid gap-3 xl:grid-cols-[minmax(240px,1.2fr)_170px_150px_140px_150px_auto] xl:items-center">
                <input
                  className={cn(inputCls, "xl:min-w-0")}
                  placeholder="搜索 agent、mcp、hermes agent、coding agent"
                  value={githubFilters.q}
                  onChange={(e) => setGithubFilters({ ...githubFilters, q: e.target.value })}
                />
                <select
                  className={compactSelectCls}
                  value={githubFilters.topic}
                  onChange={(e) => void updateGithubFilters({ ...githubFilters, topic: e.target.value })}
                >
                  <option value="">全部方向</option>
                  <option value="AI Agent">AI Agent</option>
                  <option value="MCP">MCP</option>
                  <option value="LLM">LLM</option>
                  <option value="DevTools">DevTools</option>
                </select>
                <select
                  className={compactSelectCls}
                  value={githubFilters.language}
                  onChange={(e) => void updateGithubFilters({ ...githubFilters, language: e.target.value })}
                >
                  <option value="">全部语言</option>
                  {githubLanguages.map((language) => <option key={language} value={language}>{language}</option>)}
                </select>
                <select
                  className={compactSelectCls}
                  value={githubFilters.window}
                  onChange={(e) => void updateGithubFilters({ ...githubFilters, window: e.target.value })}
                >
                  <option value="daily">日榜</option>
                  <option value="weekly">周榜</option>
                </select>
                <select
                  className={compactSelectCls}
                  value={githubFilters.sort}
                  onChange={(e) => void updateGithubFilters({ ...githubFilters, sort: e.target.value })}
                >
                  <option value="score">潜力分</option>
                  <option value="delta">Star 增速</option>
                  <option value="stars">Star 总数</option>
                  <option value="updated">最近活跃</option>
                </select>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <button className={btnSecondary} type="button" onClick={() => void loadGithubTrends(githubFilters)}>
                    <Search size={15} /> 搜索
                  </button>
                  <button className={btnPrimary} type="button" onClick={() => void refreshGithubTrends()} disabled={busy === "github-refresh"}>
                    <RefreshCcw size={15} /> {busy === "github-refresh" ? "刷新中" : "刷新日榜"}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Pill variant="brand">{githubMeta?.total ?? githubRepos.length} 个仓库</Pill>
                <Pill>{githubMeta?.snapshotDate ?? "未刷新"}</Pill>
                <button
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    githubFilters.favorite === "true" ? "bg-zinc-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                  type="button"
                  onClick={() => void updateGithubFilters({ ...githubFilters, favorite: githubFilters.favorite === "true" ? "" : "true" })}
                >
                  只看收藏
                </button>
                {githubTopics.slice(0, 10).map((topic) => (
                  <button
                    key={topic}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    type="button"
                    onClick={() => setGithubFilters({ ...githubFilters, q: topic })}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </Panel>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <Panel title="今日雷达简报" icon={<Sparkles size={16} />}>
                <div className="grid gap-3">
                  <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Radar Brief</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950">{githubRadar.headline}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{githubRadar.summary}</p>
                      </div>
                      <div className="grid min-w-[220px] grid-cols-3 gap-2 text-xs">
                        <RepoMiniStat label="候选" value={githubMeta?.total ?? githubRepos.length} />
                        <RepoMiniStat label="去重后" value={githubRadar.selectedRepoCount} />
                        <RepoMiniStat label="主题数" value={githubRadar.uniqueThemeCount} />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className={btnPrimary} type="button" onClick={() => void analyzeGithubRadarDigest()} disabled={busy === "github-radar-analyze"}>
                        <Sparkles size={15} /> {busy === "github-radar-analyze" ? "生成中" : "生成 AI 简报"}
                      </button>
                      <button className={btnSecondary} type="button" onClick={() => void saveGithubRadarAsSource()} disabled={busy === "github-radar-source"}>
                        <Save size={15} /> {busy === "github-radar-source" ? "保存中" : "保存到来源"}
                      </button>
                    </div>
                  </article>

                  <div className="grid gap-3 xl:grid-cols-2">
                    <CompactIdeaCard title="关键信号">
                      <TextListOrEmpty values={githubRadar.keySignals} emptyText="刷新榜单后会生成趋势信号摘要。" />
                    </CompactIdeaCard>
                    <CompactIdeaCard title="这轮先看什么">
                      <TextListOrEmpty values={githubRadar.watchlist} emptyText="还没有优先级建议。" />
                    </CompactIdeaCard>
                  </div>

                  {(githubRadarDigest.summary || githubRadarExecution) && (
                    <div className="grid gap-3 xl:grid-cols-2">
                      <CompactIdeaCard title={githubRadarDigest.title || "AI 雷达简报"} value={githubRadarDigest.summary || "点击生成 AI 简报后，系统会给出一版更适合行动的中文总结。"} />
                      <CompactIdeaCard title="建议动作">
                        <TextListOrEmpty values={githubRadarDigest.recommendedActions ?? []} emptyText="还没有建议动作。" />
                      </CompactIdeaCard>
                      <CompactIdeaCard title="主题判断">
                        <TextListOrEmpty values={githubRadarDigest.themeTakeaways ?? []} emptyText="还没有主题判断。" />
                      </CompactIdeaCard>
                      <CompactIdeaCard title="机会与风险">
                        <TextListOrEmpty values={[...(githubRadarDigest.opportunities ?? []), ...(githubRadarDigest.risks ?? []).map((item) => `风险：${item}`)]} emptyText="还没有机会与风险判断。" />
                      </CompactIdeaCard>
                    </div>
                  )}

                  {githubRadarExecution && (
                    <div className="rounded-xl border border-border bg-surface p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>模型：{githubRadarExecution.model}</span>
                        <span>·</span>
                        <span>{githubRadarExecution.usedFallback ? "当前是 fallback 简报" : "已使用真实模型简报"}</span>
                      </div>
                      <TextList values={githubRadarExecution.steps} />
                    </div>
                  )}

                  <div className="grid gap-2.5">
                    {githubRadar.topRepositories.map((repo) => (
                      <article
                        key={repo.id}
                        className="rounded-xl border border-border bg-surface p-3 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white">#{repo.rank}</span>
                              <button
                                className="truncate text-left text-sm font-semibold text-slate-900 hover:text-primary"
                                type="button"
                                onClick={() => setSelectedGithubRepoId(repo.id)}
                              >
                                {repo.fullName}
                              </button>
                              <Pill variant="accent">{repo.theme}</Pill>
                              {repo.dedupedCount > 1 && <Pill>{repo.dedupedCount} 个同类</Pill>}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{repo.reason}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <RepoMiniStat label="Score" value={repo.score} />
                            <RepoMiniStat label="24h" value={repo.starDelta24h} />
                            <RepoMiniStat label="7d" value={repo.starDelta7d} />
                          </div>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {repo.tags.map((tag) => <Pill key={`${repo.id}-${tag}`}>{tag}</Pill>)}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button className={btnSecondary} type="button" onClick={() => setSelectedGithubRepoId(repo.id)}>
                            <Eye size={15} /> 查看详情
                          </button>
                          <button className={btnSecondary} type="button" onClick={() => {
                            const full = githubRepos.find((item) => item.id === repo.id);
                            if (full) {
                              void saveGithubRepoAsSource(full);
                            }
                          }} disabled={busy === `github-source-${repo.id}`}>
                            <Save size={15} /> {busy === `github-source-${repo.id}` ? "保存中" : "存为来源"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel title="主题簇" icon={<Layers3 size={16} />}>
                {githubRadar.themeClusters.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    暂无主题聚合结果，刷新榜单后会把相近方向聚成可读的观察簇。
                  </div>
                ) : (
                  <div className="grid gap-2.5">
                    {githubRadar.themeClusters.map((theme) => (
                      <article key={theme.key} className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">{theme.label}</h4>
                            <p className="mt-1 text-xs text-slate-500">{theme.repoCount} 个仓库 · 平均分 {theme.averageScore}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {theme.languages.map((language) => <Pill key={`${theme.key}-${language}`} variant="accent">{language}</Pill>)}
                          </div>
                        </div>
                        <div className="mt-2">
                          <TextListOrEmpty values={theme.signals} emptyText="暂无主题信号。" />
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {theme.leadRepos.map((repo) => (
                            <button
                              key={repo.id}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                              type="button"
                              onClick={() => setSelectedGithubRepoId(repo.id)}
                            >
                              {repo.fullName}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
              <Panel title="潜力仓库榜" icon={<GitBranch size={16} />}>
                {githubRepos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">还没有缓存的 GitHub 榜单，先刷新一次日榜。</p>
                    <button className={btnPrimary + " mx-auto mt-4"} type="button" onClick={() => void refreshGithubTrends()} disabled={busy === "github-refresh"}>
                      <RefreshCcw size={15} /> 刷新 GitHub 日榜
                    </button>
                  </div>
                ) : (
                  <div className="grid max-h-[720px] gap-2.5 overflow-auto pr-1">
                    {githubRepos.map((repo) => (
                      <article
                        key={repo.id}
                        onClick={() => setSelectedGithubRepoId(repo.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedGithubRepoId(repo.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "cursor-pointer rounded-xl border bg-surface p-3.5 text-left shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                          selectedGithubRepo?.id === repo.id ? "border-primary ring-2 ring-primary/15" : "border-border hover:bg-slate-50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                                {repo.rank || "-"}
                              </span>
                              <h4 className="truncate text-sm font-semibold">{repo.fullName}</h4>
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              {repo.description || "暂无仓库描述。"}
                            </p>
                          </div>
                          <button
                            className={cn(
                              "shrink-0 rounded-lg px-2 py-1 text-xs font-medium",
                              repo.isFavorite ? "bg-zinc-900 text-white" : "bg-slate-100 text-slate-600",
                            )}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void toggleGithubFavorite(repo);
                            }}
                            disabled={busy === `github-favorite-${repo.id}`}
                          >
                            {repo.isFavorite ? "已收藏" : "收藏"}
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                          <RepoMiniStat label="Score" value={repo.score} />
                          <RepoMiniStat label="Stars" value={repo.stars} />
                          <RepoMiniStat label="24h" value={repo.starDelta24h} />
                          <RepoMiniStat label="7d" value={repo.starDelta7d} />
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {repo.language && <Pill variant="accent">{repo.language}</Pill>}
                          {repo.topics.slice(0, 4).map((topic) => <Pill key={topic}>{topic}</Pill>)}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="仓库详情" icon={<GitBranch size={16} />}>
                {!selectedGithubRepo ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">选择一个仓库查看详情。</div>
                ) : (
                  <div className="grid gap-3">
                    <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill variant="brand">Score {selectedGithubRepo.score}</Pill>
                            {selectedGithubRepo.language && <Pill variant="accent">{selectedGithubRepo.language}</Pill>}
                            {selectedGithubRepo.license && <Pill>{selectedGithubRepo.license}</Pill>}
                          </div>
                          <h3 className="mt-2.5 text-xl font-semibold leading-snug">{selectedGithubRepo.fullName}</h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{selectedGithubRepo.description || "暂无仓库描述。"}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <a className={btnSecondary} href={selectedGithubRepo.htmlUrl} target="_blank" rel="noreferrer">
                              <ExternalLink size={15} /> GitHub
                            </a>
                            {selectedGithubRepo.homepage && (
                              <a className={btnGhost} href={selectedGithubRepo.homepage} target="_blank" rel="noreferrer">
                                <ExternalLink size={15} /> 官网
                              </a>
                            )}
                            <button className={btnSecondary} type="button" onClick={() => void toggleGithubFavorite(selectedGithubRepo)}>
                              {selectedGithubRepo.isFavorite ? "取消收藏" : "收藏"}
                            </button>
                            <button className={btnPrimary} type="button" onClick={() => void analyzeGithubRepo()} disabled={busy === "github-analyze"}>
                              <Sparkles size={15} /> {busy === "github-analyze" ? "分析中" : "AI 分析"}
                            </button>
                            <button className={btnSecondary} type="button" onClick={() => void saveGithubRepoAsSource(selectedGithubRepo)} disabled={busy === `github-source-${selectedGithubRepo.id}`}>
                              <Save size={15} /> {busy === `github-source-${selectedGithubRepo.id}` ? "保存中" : "存为来源"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>

                    <div className="grid gap-3 md:grid-cols-4">
                      <RepoSignalCard label="Stars" value={selectedGithubRepo.stars} caption={`24h +${selectedGithubRepo.starDelta24h}`} />
                      <RepoSignalCard label="Forks" value={selectedGithubRepo.forks} caption={`${selectedGithubRepo.watchers} watchers`} />
                      <RepoSignalCard label="Issues" value={selectedGithubRepo.openIssues} caption="open issues" />
                      <RepoSignalCard label="最近 Push" value={formatDate(selectedGithubRepo.pushedAt)} caption={formatDate(selectedGithubRepo.createdAtGithub)} />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedGithubRepo.topics.map((topic) => <Pill key={topic}>{topic}</Pill>)}
                    </div>

                    <div className="grid gap-3 xl:grid-cols-2">
                      <CompactIdeaCard title="AI 总结" value={selectedGithubRepo.analysis?.summary || "点击 AI 分析后生成仓库总结。"} />
                      <CompactIdeaCard title="为什么在涨">
                        <TextListOrEmpty values={selectedGithubRepo.analysis?.whyTrending ?? []} />
                      </CompactIdeaCard>
                      <CompactIdeaCard title="潜力理由">
                        <TextListOrEmpty values={selectedGithubRepo.analysis?.potentialReasons ?? []} />
                      </CompactIdeaCard>
                      <CompactIdeaCard title="学习价值">
                        <TextListOrEmpty values={selectedGithubRepo.analysis?.learningValue ?? []} />
                      </CompactIdeaCard>
                      <CompactIdeaCard title="适用场景">
                        <TextListOrEmpty values={selectedGithubRepo.analysis?.useCases ?? []} />
                      </CompactIdeaCard>
                      <CompactIdeaCard title="风险信号">
                        <TextListOrEmpty values={selectedGithubRepo.analysis?.riskSignals ?? []} />
                      </CompactIdeaCard>
                    </div>

                    {githubAnalyzeExecution && (
                      <div className="rounded-xl border border-border bg-surface p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>模型：{githubAnalyzeExecution.model}</span>
                          <span>·</span>
                          <span>{githubAnalyzeExecution.usedFallback ? "当前是 fallback 分析" : "已使用真实模型分析"}</span>
                        </div>
                        <TextList values={githubAnalyzeExecution.steps} />
                      </div>
                    )}

                    <Field label="研究备注">
                      <textarea
                        className={textareaCls + " min-h-[120px]"}
                        placeholder="记录你想研究它的原因、可借鉴功能、后续文章选题或产品灵感。"
                        value={githubNoteDraft}
                        onChange={(e) => setGithubNoteDraft(e.target.value)}
                      />
                    </Field>
                    <div className="flex justify-end">
                      <button className={btnSecondary} type="button" onClick={() => void saveGithubNote()} disabled={busy === "github-note"}>
                        <Save size={15} /> 保存备注
                      </button>
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}

        {showRecordAgentEditor && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h3 className="text-base font-semibold">新增记录</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">通过 Agent 把原始八股文整理成面试可直接复述的学习卡，再保存进题库。</p>
                </div>
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-slate-50 hover:text-foreground" type="button" onClick={closeRecordAgentEditor}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-5">
                <div className="grid gap-3">
                  <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold">八股整理 Agent</h4>
                        <p className="mt-1 text-xs text-slate-600">
                          直接贴原始八股文、技术摘录或零散知识点，Agent 会改写成面试时能直接复述的一张学习卡。
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Pill variant="accent">GLM-5.1</Pill>
                        <Pill variant={recordAgentExecution?.usedFallback ? "warn" : "brand"}>
                          {recordAgentExecution?.usedFallback ? "Fallback" : "Agent"}
                        </Pill>
                      </div>
                    </div>
                  </article>
                  <Field label="原始内容">
                    <textarea
                      className={textareaCls + " min-h-[240px]"}
                      placeholder="例如把一整段 Redis、MySQL、React、消息队列、缓存、系统设计等八股文直接贴进来。"
                      value={recordText}
                      onChange={(e) => setRecordText(e.target.value)}
                    />
                  </Field>
                  <Field label="补充要求">
                    <input
                      className={inputCls}
                      placeholder="可选：例如偏前端面试、要更口语化、希望补项目连接点。"
                      value={recordContext}
                      onChange={(e) => setRecordContext(e.target.value)}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <button className={btnPrimary} type="button" onClick={() => void handleRecordAgentGenerate()} disabled={busy === "record-agent"}>
                      <Sparkles size={15} /> {busy === "record-agent" ? "Agent 生成中" : "生成面试卡"}
                    </button>
                    <button className={btnSecondary} type="button" onClick={() => void handleRecordSave()} disabled={busy === "record-save"}>
                      <Save size={15} /> 保存到题库
                    </button>
                  </div>
                  {recordAgentExecution && (
                    <div className="rounded-xl border border-border bg-surface p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>模型：{recordAgentExecution.model}</span>
                        <span>·</span>
                        <span>{recordAgentExecution.usedFallback ? "当前是 fallback 草稿" : "已使用真实模型生成"}</span>
                      </div>
                      <TextList values={recordAgentExecution.steps} />
                    </div>
                  )}
                  <div className="grid gap-3 rounded-xl border border-border bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold">Agent 草稿</h4>
                      <Pill variant="accent">{recordDraft.questionType || "八股"}</Pill>
                    </div>
                    <Field label="面试题">
                      <textarea
                        className={textareaCls + " min-h-[96px]"}
                        value={recordDraft.question}
                        onChange={(e) => setRecordDraft({ ...recordDraft, question: e.target.value })}
                      />
                    </Field>
                    <Field label="面试答案">
                      <textarea
                        className={textareaCls + " min-h-[220px]"}
                        value={recordDraft.answer}
                        onChange={(e) => setRecordDraft({ ...recordDraft, answer: e.target.value })}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="主题">
                        <input
                          className={inputCls}
                          list="topic-options"
                          value={recordDraft.topicName}
                          onChange={(e) => setRecordDraft({ ...recordDraft, topicName: e.target.value })}
                        />
                      </Field>
                      <Field label="标签">
                        <input
                          className={inputCls}
                          value={recordDraft.tags}
                          onChange={(e) => setRecordDraft({ ...recordDraft, tags: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label="面试提示">
                      <textarea
                        className={textareaCls + " min-h-[156px]"}
                        value={recordDraft.note}
                        onChange={(e) => setRecordDraft({ ...recordDraft, note: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <button className={btnSecondary} type="button" onClick={closeRecordAgentEditor}>取消</button>
                <button className={btnPrimary} type="button" onClick={() => void handleRecordSave()} disabled={busy === "record-save"}>
                  <Save size={15} /> 保存到题库
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Sprint ─── */}
        {activeTab === "sprint" && (
          <div className="grid gap-4">
            <Panel title="生成冲刺计划" icon={<CalendarDays size={16} />}>
              <div className="flex flex-wrap items-center gap-2">
                <select className={compactSelectCls} value={selectedJobTarget?.id ?? ""}
                  onChange={(e) => setSelectedJobTargetId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">选择岗位目标</option>
                  {jobTargets.map((t) => <option key={t.id} value={t.id}>{t.company?.name ?? "未命名公司"} / {t.roleName}</option>)}
                </select>
                <div className="flex gap-2" role="group">
                  {[3, 7, 14].map((days) => (
                    <button key={days}
                      className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        sprintDays === days ? "border-primary bg-primary-soft text-primary-hover" : "border-border bg-surface text-muted-foreground hover:text-foreground")}
                      type="button" onClick={() => setSprintDays(days)}>
                      {days}天
                    </button>
                  ))}
                </div>
                <button className={btnPrimary} type="button" onClick={() => void handleGenerateSprint()} disabled={busy === "sprint-generate"}>
                  <Sparkles size={15} /> 生成
                </button>
              </div>
            </Panel>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,520px)_1fr]">
              <div className="grid gap-4">
                <SprintList
                  plans={sprintPlans}
                  activePlanId={selectedSprintPlan?.id ?? null}
                  onSelect={setSelectedSprintId}
                  onTaskStatus={updateTaskStatus}
                />
              </div>

              <Panel title="冲刺详情" icon={<ListChecks size={16} />}>
                {!selectedSprintPlan ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">生成一个冲刺计划后查看每天安排。</div>
                ) : (
                  <div className="grid gap-4">
                    <div className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold">{selectedSprintPlan.title}</h4>
                          <p className="mt-1 text-sm text-slate-600">
                            {selectedSprintPlan.company?.name ?? "未命名公司"} / {selectedSprintPlan.targetRole ?? selectedSprintPlan.jobTarget?.roleName ?? "目标岗位"}
                          </p>
                        </div>
                        <Pill variant="brand">{selectedSprintStats.rate}%</Pill>
                      </div>
                      {selectedSprintPlan.summary && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{selectedSprintPlan.summary}</p>
                      )}
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                        <div className={cn("h-full rounded-full", progressGradientCls)} style={{ width: `${selectedSprintStats.rate}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <ScoreCard label="总任务" value={selectedSprintStats.total} />
                      <ScoreCard label="待做" value={selectedSprintStats.todo} />
                      <ScoreCard label="进行中" value={selectedSprintStats.doing} />
                      <ScoreCard label="完成" value={selectedSprintStats.done} />
                    </div>

                    <div className="grid gap-3">
                      {selectedSprintTasksByDay.map(([dayIndex, tasks]) => (
                        <article key={dayIndex} className="rounded-xl border border-border p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <h5 className="text-sm font-semibold">Day {dayIndex + 1}</h5>
                            <Pill>{tasks.filter((task) => task.status === "done").length}/{tasks.length}</Pill>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {tasks.map((task) => (
                              <div key={task.id} className="grid gap-2 rounded-lg border border-border bg-surface p-3 md:grid-cols-[auto_1fr_auto] md:items-center">
                                <Pill variant={task.status === "done" ? "brand" : task.status === "doing" ? "accent" : "default"}>
                                  {task.status === "done" ? "已完成" : task.status === "doing" ? "进行中" : "待做"}
                                </Pill>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">{task.title}</p>
                                  {task.description && <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{task.description}</p>}
                                </div>
                                <button className={btnGhost} type="button" onClick={() => void updateTaskStatus(task.id, task.status === "todo" ? "doing" : task.status === "doing" ? "done" : "todo")}>
                                  {task.status === "done" ? "重开" : task.status === "doing" ? "完成" : "开始"}
                                </button>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}

        {/* ─── Review ─── */}
        {activeTab === "review" && (
          <div className="grid gap-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">复盘</h3>
                <p className="mt-1 text-sm text-muted-foreground">低分题、薄弱点和待补八股会集中在这里。</p>
              </div>
              <div className="flex gap-2">
                <button className={btnSecondary} type="button" onClick={() => void loadReviews(reviewFilters)}>
                  <RefreshCcw size={15} /> 刷新
                </button>
                <button className={btnSecondary} type="button" onClick={() => void handleExportData()} disabled={busy === "export"}>
                  <Download size={15} /> 导出
                </button>
              </div>
            </div>
            <Panel title="复盘任务池" icon={<ListChecks size={16} />}>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_160px_auto_auto]">
                <input className={inputCls} placeholder="公司" value={reviewFilters.company}
                  onChange={(e) => setReviewFilters({ ...reviewFilters, company: e.target.value })} />
                <input className={inputCls} placeholder="主题" value={reviewFilters.topic}
                  onChange={(e) => setReviewFilters({ ...reviewFilters, topic: e.target.value })} />
                <input className={inputCls} placeholder="轮次" value={reviewFilters.roundType}
                  onChange={(e) => setReviewFilters({ ...reviewFilters, roundType: e.target.value })} />
                <select className={inputCls} value={reviewFilters.status}
                  onChange={(e) => setReviewFilters({ ...reviewFilters, status: e.target.value })}>
                  <option value="">全部状态</option>
                  <option value="todo">待处理</option>
                  <option value="doing">处理中</option>
                  <option value="done">已完成</option>
                </select>
                <button className={btnPrimary} type="button" onClick={() => void loadReviews(reviewFilters)}>
                  <Search size={15} /> 筛选
                </button>
                <button className={btnGhost} type="button" onClick={() => {
                  const next = { company: "", topic: "", roundType: "", status: "" };
                  setReviewFilters(next);
                  void loadReviews(next);
                }}>重置</button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <ScoreCard label="待处理" value={reviewCards.filter((card) => card.status === "todo").length} />
                <ScoreCard label="处理中" value={reviewCards.filter((card) => card.status === "doing").length} />
                <ScoreCard label="已完成" value={reviewCards.filter((card) => card.status === "done").length} />
              </div>
            </Panel>
            {latestFinishedSession && (
              <Panel title="最近复盘报告" icon={<BarChart3 size={16} />}>
                <div className="grid grid-cols-3 gap-3">
                  <ScoreCard label="总分" value={latestFinishedSession.score.overall ?? 0} />
                  <ScoreCard label="八股" value={latestFinishedSession.score.knowledge ?? 0} />
                  <ScoreCard label="表达" value={latestFinishedSession.score.expression ?? 0} />
                </div>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">{latestFinishedSession.summary}</p>
                <div className="mt-3.5 grid gap-3">
                  {latestFinishedSession.turns.filter((t) => t.answer).slice(0, 5).map((turn) => (
                    <article key={turn.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h5 className="text-sm font-semibold">第 {turn.order} 题：{turn.question}</h5>
                        <Pill variant="accent">准确 {scoreOrDash(turn.score.accuracy)}</Pill>
                      </div>
                      {turn.feedback && <p className="mt-2 text-sm text-slate-500 leading-relaxed">{turn.feedback}</p>}
                      {turn.betterAnswer && <p className="mt-1 text-sm text-slate-500 leading-relaxed">{turn.betterAnswer}</p>}
                    </article>
                  ))}
                </div>
              </Panel>
            )}
            <ReviewList cards={reviewCards} onStatus={updateReviewStatus} onCreateTask={createReviewTask} />
          </div>
        )}

        {/* ─── Lab ─── */}
        {activeTab === "lab" && (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(340px,440px)_1fr]">
              <Panel title="训练实验室" icon={<Code2 size={16} />}>
                <div className="grid gap-3">
                  <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
                    {(["coding", "system_design", "peer_mock"] as LabType[]).map((type) => (
                      <button key={type}
                        className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                          labType === type ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setLabType(type)} type="button">
                        {type === "coding" ? "代码" : type === "system_design" ? "白板" : "同伴"}
                      </button>
                    ))}
                  </div>
                  <Field label="岗位方向">
                    <input className={inputCls} placeholder={selectedJobTarget?.roleName ?? "可选"} value={labRole}
                      onChange={(e) => setLabRole(e.target.value)} />
                  </Field>
                  <button className={btnPrimary} type="button" onClick={() => void handleStartLab()} disabled={busy === "lab-start"}>
                    <Play size={15} /> 新建练习
                  </button>
                </div>
              </Panel>

              <Panel title={activeLab?.title ?? "当前练习"} icon={labIcon(activeLab?.type ?? labType)}>
                {!activeLab ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">先新建一个练习</div>
                ) : (
                  <div className="grid gap-3">
                    <p className="text-sm text-slate-500 leading-relaxed">{activeLab.prompt}</p>
                    <textarea
                      className={cn(textareaCls + " min-h-[300px]", activeLab.type === "coding" && "font-mono text-[13px]")}
                      value={labContent} onChange={(e) => setLabContent(e.target.value)} />
                    <button className={btnPrimary} type="button" onClick={() => void handleSubmitLab()} disabled={busy === "lab-submit"}>
                      <Sparkles size={15} /> 生成反馈
                    </button>
                    {typeof activeLab.feedback.score === "number" && (
                      <article className="rounded-xl border border-border p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="text-sm font-semibold">练习反馈</h5>
                          <Pill variant="accent">得分 {activeLab.feedback.score}</Pill>
                        </div>
                        <DataGroup title="优点"><TextList values={activeLab.feedback.strengths ?? []} /></DataGroup>
                        <DataGroup title="缺口"><TextList values={activeLab.feedback.gaps ?? []} /></DataGroup>
                        {activeLab.feedback.nextAction && <p className="text-sm text-slate-500 leading-relaxed">{activeLab.feedback.nextAction}</p>}
                      </article>
                    )}
                  </div>
                )}
              </Panel>
            </div>

            <Panel title="最近练习" icon={<ClipboardList size={16} />}>
              <LabList sessions={labSessions} activeId={activeLab?.id ?? null} onSelect={setActiveLabId} />
            </Panel>
          </div>
        )}

        {/* ─── Trends ─── */}
        {activeTab === "trends" && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreCard label="平均模拟分" value={averageInterviewScore} />
              <ScoreCard label="复习完成率" value={sprintDoneRate} />
              <ScoreCard label="掌握度达标" value={cards.length ? Math.round((cards.filter((c) => c.mastery >= 3).length / cards.length) * 100) : 0} />
              <ScoreCard label="错题清理率" value={reviewCards.length ? Math.round(((reviewCards.length - todoReviewCount) / reviewCards.length) * 100) : 0} />
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Panel title="准备度仪表盘" icon={<Gauge size={16} />}>
                <div className="grid gap-3">
                  {readinessRows.map((row) => (
                    <div key={row.label} className="rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <h5 className="text-sm font-semibold">{row.label}</h5>
                        <Pill variant={row.value >= 70 ? "brand" : row.value >= 40 ? "accent" : "warn"}>{row.value}</Pill>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                        <div className={cn("h-full rounded-full", progressGradientCls)} style={{ width: `${Math.min(row.value, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="面试分数走势" icon={<BarChart3 size={16} />}>
                {interviewTimeline.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">完成模拟面试后展示分数走势。</div>
                ) : (
                  <div className="grid gap-3">
                    {interviewTimeline.map((session, index) => {
                      const score = session.score.overall ?? 0;
                      return (
                        <div key={session.id} className="rounded-xl border border-border p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <h5 className="text-sm font-semibold">第 {index + 1} 轮 · {session.company?.name ?? "未命名公司"}</h5>
                            <Pill variant="accent">{score}</Pill>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                            <div className={cn("h-full rounded-full", progressGradientCls)} style={{ width: `${Math.min(score, 100)}%` }} />
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{formatDate(session.updatedAt)} / {session.targetRole ?? "目标岗位"}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Panel title="知识掌握分布" icon={<BookOpen size={16} />}>
                <div className="grid gap-3">
                  {masteryRows.map((row) => (
                    <div key={row.label} className="rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <h5 className="text-sm font-semibold">{row.label}</h5>
                        <Pill>{row.count}</Pill>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                        <div className={cn("h-full rounded-full", progressGradientCls)} style={{ width: `${Math.round((row.count / Math.max(...masteryRows.map((item) => item.count), 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="冲刺完成排行" icon={<ListChecks size={16} />}>
                {sprintProgressRows.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">生成冲刺计划后展示完成进度。</div>
                ) : (
                  <div className="grid gap-3">
                    {sprintProgressRows.map((row) => (
                      <button key={row.id} className="rounded-xl border border-border p-4 text-left shadow-sm hover:bg-slate-50" type="button"
                        onClick={() => { setSelectedSprintId(row.id); setActiveTab("sprint"); }}>
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="text-sm font-semibold">{row.label}</h5>
                          <Pill variant="brand">{row.caption}</Pill>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                          <div className={cn("h-full rounded-full", progressGradientCls)} style={{ width: `${row.value}%` }} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="最近面试记录" icon={<MessageSquareText size={16} />}>
                <SessionList sessions={sessions.slice(0, 8)} />
              </Panel>
              <Panel title="薄弱主题" icon={<Tags size={16} />}>
                <WeaknessList reviewCards={reviewCards} />
              </Panel>
            </div>
          </div>
        )}
      </main>

      {/* Datalists */}
      <datalist id="company-options">
        {companies.map((c) => <option key={c.id} value={c.name} />)}
      </datalist>
      <datalist id="topic-options">
        {topics.map((t) => <option key={t.id} value={t.name} />)}
      </datalist>

      {/* Toast */}
      {busy && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-border bg-surface p-3.5 shadow-lg">
          <LoadingSpinner />
        </div>
      )}
      {toast && !busy && (
        <div className="fixed bottom-5 right-5 z-50 max-w-[420px] rounded-xl border border-border bg-surface p-3.5 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
