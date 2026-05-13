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
  type TechnicalArticle,
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
  buildInterviewPlatformBenchmarks,
  summarizeBenchmarkCoverage,
  type InterviewBenchmarkStatus,
} from "@/lib/interview-platform-benchmarks";
import {
  requestJson,
  joinTags,
  formatDate,
  scoreOrDash,
} from "@/app/helpers";
import { buildKnowledgeStudyGuide } from "@/lib/knowledge-study-guide";

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
import { KnowledgeStudyGuideView } from "@/app/components/knowledge/study-guide-view";
import { ApplicationsTab } from "@/app/features/applications/applications-tab";
import {
  applicationStageLabels,
  applicationStageOrder,
  emptyApplicationForm,
  emptySourceForm,
  type ApplicationDetailTab,
  type ApplicationFilters,
  type ApplicationForm,
  type SourceForm,
} from "@/app/features/applications/types";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  compactSelectCls,
  heroGradientCls,
  inputCls,
  messageGradientCls,
  progressGradientCls,
  softGradientCls,
  textareaCls,
} from "@/app/components/shared/styles";
import { RecordAgentEditor } from "@/app/features/records/record-agent-editor";
import { RecordsTab } from "@/app/features/records/records-tab";
import {
  createKnowledgeCard,
  createKnowledgeCards,
  deleteKnowledgeCard,
  exportWorkspaceData,
  generateRecordCard,
  generateRecordCards,
  loadKnowledgeArticles,
  loadKnowledgeCards,
  seedQuestionBank,
  suggestKnowledgeCard,
  updateKnowledgeCard,
  updateKnowledgeCardProgress,
  type KnowledgeExportPayload,
  type KnowledgeFilters,
} from "@/app/features/records/api";
import type {
  RecordAgentExecution,
  RecordAgentMode,
  RecordBatchDraft,
} from "@/app/features/records/types";
import {
  cardToKnowledgeForm,
  emptyRecordAgentDraft,
  makeRecordBatchDraft,
  recordAgentDraftToForm,
} from "@/app/features/records/utils";
import { GithubTrendsTab } from "@/app/features/github-trends/github-trends-tab";
import {
  analyzeGithubRadar,
  analyzeGithubRepository,
  createGithubRadarSourceDraft,
  createGithubRepoSourceDraft,
  loadGithubTrendList,
  refreshGithubTrendList,
  updateGithubRepository,
} from "@/app/features/github-trends/api";
import {
  emptyGithubRadar,
  emptyGithubRadarDigest,
  type GithubRadarBrief,
  type GithubRadarDigest,
  type GithubRadarDigestResponse,
  type GithubRepoAnalyzeResponse,
  type GithubTrendFilters,
  type GithubTrendListResponse,
  type GithubTrendRepo,
} from "@/app/features/github-trends/types";

const ACTIVE_TAB_STORAGE_KEY = "interview-ai-active-tab";
const WORKSPACE_STORAGE_KEY = "interview-ai-interview-workspace";
const DEFAULT_TAB: TabKey = "home";
const validTabs = new Set<TabKey>(Object.keys(pageLabels) as TabKey[]);
const quickDialogs = new Set<QuickDialog>(["experience", "jd", "resume", "interview", "sprint"]);
const benchmarkStatusCopy: Record<InterviewBenchmarkStatus, { label: string; pill: "brand" | "accent" | "warn" }> = {
  strong: { label: "已具备", pill: "brand" },
  partial: { label: "可加强", pill: "accent" },
  missing: { label: "待补齐", pill: "warn" },
};
const majorCompanyNames = [
  "字节跳动",
  "阿里巴巴",
  "腾讯",
  "百度",
  "美团",
  "京东",
  "拼多多",
  "小米",
  "快手",
  "华为",
  "Google",
  "Meta",
  "Microsoft",
  "Amazon",
  "Apple",
  "Netflix",
  "OpenAI",
  "NVIDIA",
];

function isTabKey(value: string | null | undefined): value is TabKey {
  return !!value && validTabs.has(value as TabKey);
}

function isQuickDialog(value: string | null | undefined): value is QuickDialog {
  return !!value && quickDialogs.has(value as QuickDialog);
}

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

function isInterviewerSessionSummary(value: unknown): value is InterviewerSessionSummary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<InterviewerSessionSummary>;
  return typeof candidate.overallScore === "number"
    && typeof candidate.summary === "string"
    && Array.isArray(candidate.questionReviews)
    && Array.isArray(candidate.discussionReviews)
    && !!candidate.dimensionAverages
    && typeof candidate.dimensionAverages === "object";
}

type StartupIdeaAgentExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
};

type StartupIdeaAgentResponse = {
  idea: StartupIdeaAgentIdea;
  execution: StartupIdeaAgentExecution;
};

type QuickDialog = "experience" | "jd" | "resume" | "interview" | "sprint";

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

type CandidatePrepResponse = {
  prep: CandidatePrep;
  execution: CandidatePrepExecution;
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

function labIcon(type: LabType) {
  if (type === "peer_mock") return <Users size={16} />;
  if (type === "system_design") return <GitBranch size={16} />;
  return <Code2 size={16} />;
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

type QuickAction = {
  title: string;
  description: string;
  icon: ReactNode;
  action: () => void;
  tone?: "primary" | "soft";
};

function EmptyBeauty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: QuickAction;
}) {
  return (
    <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/55 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
        <Sparkles size={18} />
      </div>
      <h4 className="mt-4 text-sm font-semibold text-slate-950">{title}</h4>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && (
        <button className={btnPrimary + " mx-auto mt-4"} type="button" onClick={action.action}>
          {action.icon}
          {action.title}
        </button>
      )}
    </div>
  );
}

function DialogShell({
  title,
  description,
  icon,
  onClose,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-sky-100 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4 border-b border-sky-100 bg-[linear-gradient(135deg,#f8fbff,#edf8ff)] px-5 py-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
              {icon}
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-950">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          </div>
          <button className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-950" type="button" onClick={onClose} aria-label="关闭弹窗">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>(DEFAULT_TAB);
  const [hasRestoredShellState, setHasRestoredShellState] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialLoadErrors, setInitialLoadErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [activeDialog, setActiveDialog] = useState<QuickDialog | null>(null);

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

  const [filters, setFilters] = useState<KnowledgeFilters>({ q: "", company: "", topic: "", mastery: "", questionType: "" });
  const [knowledgeForm, setKnowledgeForm] = useState<KnowledgeForm>(emptyKnowledgeForm);
  const [knowledgeEditForm, setKnowledgeEditForm] = useState<KnowledgeForm>(emptyKnowledgeForm);
  const [knowledgeSuggestion, setKnowledgeSuggestion] = useState<KnowledgeSuggestion | null>(null);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<number | null>(null);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<number | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [recordText, setRecordText] = useState("");
  const [recordContext, setRecordContext] = useState("");
  const [recordDraft, setRecordDraft] = useState<KnowledgeForm>(emptyRecordAgentDraft);
  const [recordAgentMode, setRecordAgentMode] = useState<RecordAgentMode>("single");
  const [recordAgentExecution, setRecordAgentExecution] = useState<RecordAgentExecution | null>(null);
  const [recordArticles, setRecordArticles] = useState<TechnicalArticle[]>([]);
  const [recordArticleId, setRecordArticleId] = useState<number | null>(null);
  const [recordBatchMaxCards, setRecordBatchMaxCards] = useState(8);
  const [recordBatchDrafts, setRecordBatchDrafts] = useState<RecordBatchDraft[]>([]);
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
  const [prepCompanySearch, setPrepCompanySearch] = useState("");
  const [prepRoleFilter, setPrepRoleFilter] = useState("");
  const [selectedPrepCompanyName, setSelectedPrepCompanyName] = useState("");
  const [selectedPrepJobTargetId, setSelectedPrepJobTargetId] = useState<number | null>(null);
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
  const [interviewerDraftAnswers, setInterviewerDraftAnswers] = useState<Record<number, string>>({});
  const [interviewerDiscussionParentId, setInterviewerDiscussionParentId] = useState<number | null>(null);
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
  const interviewPlatformBenchmarks = useMemo(
    () => buildInterviewPlatformBenchmarks({
      knowledgeCount: cards.length,
      hasResume: Boolean(selectedResume),
      hasJobTarget: Boolean(selectedJobTarget),
      hasCandidatePrep: Boolean(selectedResume?.candidatePrep),
      hasInterviewerSession: Boolean(interviewerSession || sessions.some((session) => session.config?.sessionKind === "mock_interviewer")),
      hasFinishedInterview: sessions.some((session) => session.status === "finished" && Boolean(session.summary)),
      hasInterviewScript: Boolean(interviewScript),
      practiceAnswerCount: Object.keys(scriptPracticeAnswers).length,
      reviewTodoCount: reviewCards.filter((card) => card.status === "todo").length,
      labSessionCount: labSessions.length,
    }),
    [cards.length, interviewScript, interviewerSession, labSessions.length, reviewCards, scriptPracticeAnswers, selectedJobTarget, selectedResume, sessions],
  );
  const interviewBenchmarkCoverage = useMemo(
    () => summarizeBenchmarkCoverage(interviewPlatformBenchmarks),
    [interviewPlatformBenchmarks],
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
  const interviewerFollowUpTurns = useMemo(
    () => interviewerSession?.turns.filter((turn) => turn.turnType === "followup") ?? [],
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
  const prepRoleOptions = useMemo(
    () =>
      Array.from(new Set(jobTargets.map((target) => target.roleName.trim()).filter(Boolean))).sort((left, right) =>
        left.localeCompare(right, "zh-Hans-CN"),
      ),
    [jobTargets],
  );
  const prepCompanyDirectory = useMemo(() => {
    const directory = new Map<string, { name: string; companyId: number | null; jdCount: number; reportCount: number; roles: Set<string> }>();
    const ensureEntry = (name: string, companyId: number | null = null) => {
      const normalized = name.trim();
      if (!normalized) return null;
      const current = directory.get(normalized);
      if (current) {
        if (companyId && !current.companyId) current.companyId = companyId;
        return current;
      }
      const next = { name: normalized, companyId, jdCount: 0, reportCount: 0, roles: new Set<string>() };
      directory.set(normalized, next);
      return next;
    };

    majorCompanyNames.forEach((name) => ensureEntry(name));
    companies.forEach((company) => ensureEntry(company.name, company.id));
    jobTargets.forEach((target) => {
      const entry = ensureEntry(target.company?.name ?? "");
      if (!entry) return;
      entry.jdCount += 1;
      if (target.roleName.trim()) entry.roles.add(target.roleName.trim());
    });
    experiences.forEach((report) => {
      const entry = ensureEntry(report.company?.name ?? "");
      if (!entry) return;
      entry.reportCount += 1;
      if (report.roleName.trim()) entry.roles.add(report.roleName.trim());
    });

    return [...directory.values()]
      .filter((entry) => entry.name.toLowerCase().includes(prepCompanySearch.trim().toLowerCase()))
      .filter((entry) => !prepRoleFilter || entry.roles.has(prepRoleFilter))
      .sort((left, right) => right.jdCount - left.jdCount || right.reportCount - left.reportCount || left.name.localeCompare(right.name, "zh-Hans-CN"));
  }, [companies, experiences, jobTargets, prepCompanySearch, prepRoleFilter]);
  const prepFilteredJobTargets = useMemo(
    () =>
      jobTargets
        .filter((target) => !selectedPrepCompanyName || (target.company?.name ?? "") === selectedPrepCompanyName)
        .filter((target) => !prepRoleFilter || target.roleName === prepRoleFilter)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    [jobTargets, prepRoleFilter, selectedPrepCompanyName],
  );
  const selectedPrepJobTarget = useMemo(
    () => prepFilteredJobTargets.find((target) => target.id === selectedPrepJobTargetId) ?? prepFilteredJobTargets[0] ?? null,
    [prepFilteredJobTargets, selectedPrepJobTargetId],
  );
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
      { label: "报告完成", value: companyIntel?.readiness.review ?? companyPrep?.readiness.review ?? (latestFinishedSession ? 100 : 0) },
      { label: "冲刺进度", value: sprintDoneRate },
    ],
    [averageInterviewScore, companyIntel, companyPrep, latestFinishedSession, selectedJobTarget, sprintDoneRate],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get("tab");
    const actionFromUrl = params.get("action");
    const savedTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    const restoredTab = isTabKey(tabFromUrl) ? tabFromUrl : isTabKey(savedTab) ? savedTab : DEFAULT_TAB;
    setActiveTab(restoredTab);
    if (isQuickDialog(actionFromUrl)) {
      setActiveDialog(actionFromUrl);
    }

    const savedWorkspace = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (savedWorkspace === "candidate" || savedWorkspace === "interviewer") {
      setInterviewWorkspace(savedWorkspace);
    }

    setHasRestoredShellState(true);
  }, []);

  useEffect(() => {
    if (activeTab === "interview" && !selectedSessionId) {
      setInterviewWorkspace("candidate");
    }
  }, [activeTab, selectedSessionId]);

  useEffect(() => {
    if (!hasRestoredShellState) return;
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [activeTab, hasRestoredShellState]);

  useEffect(() => {
    if (!hasRestoredShellState) return;
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, interviewWorkspace);
  }, [hasRestoredShellState, interviewWorkspace]);

  useEffect(() => {
    if (!hasRestoredShellState) return;

    let cancelled = false;
    setIsInitialLoading(true);
    void refreshAll().finally(() => {
      if (!cancelled) {
        setIsInitialLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasRestoredShellState]);

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
    if (selectedPrepCompanyName && !prepCompanyDirectory.some((company) => company.name === selectedPrepCompanyName)) {
      setSelectedPrepCompanyName("");
    }
  }, [prepCompanyDirectory, selectedPrepCompanyName]);

  useEffect(() => {
    if (!selectedPrepJobTargetId && prepFilteredJobTargets[0]) {
      setSelectedPrepJobTargetId(prepFilteredJobTargets[0].id);
      return;
    }
    if (selectedPrepJobTargetId && !prepFilteredJobTargets.some((target) => target.id === selectedPrepJobTargetId)) {
      setSelectedPrepJobTargetId(prepFilteredJobTargets[0]?.id ?? null);
    }
  }, [prepFilteredJobTargets, selectedPrepJobTargetId]);

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
    if (!selectedSessionDetail) {
      setInterviewerSession(null);
      setInterviewerSummary(null);
      setFocusedInterviewerTurnId(null);
      setInterviewerDiscussionParentId(null);
      return;
    }

    if (selectedSessionDetail.config?.sessionKind === "mock_interviewer") {
      setInterviewWorkspace("interviewer");
      setInterviewerSession(selectedSessionDetail);
      setInterviewerAnswerText("");
      setInterviewerDiscussionTitle("");
      setInterviewerDraftAnswers({});
      setInterviewerDiscussionParentId(null);
      setShowInterviewerIdealAnswer(false);
      setFocusedInterviewerTurnId((current) => {
        if (current && selectedSessionDetail.turns.some((turn) => turn.id === current)) return current;
        return selectedSessionDetail.turns.find((turn) => turn.turnType === "primary")?.id
          ?? selectedSessionDetail.turns.find((turn) => turn.turnType === "discussion")?.id
          ?? selectedSessionDetail.turns[0]?.id
          ?? null;
      });
      const persistedSummary = selectedSessionDetail.expression?.interviewerSummary;
      setInterviewerSummary(isInterviewerSessionSummary(persistedSummary) ? persistedSummary : null);
      return;
    }

    setInterviewerSession(null);
    setInterviewerSummary(null);
    setFocusedInterviewerTurnId(null);
    setInterviewerAnswerText("");
    setInterviewerDiscussionTitle("");
    setInterviewerDraftAnswers({});
    setInterviewerDiscussionParentId(null);
  }, [selectedSessionDetail]);

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
    const payload = await loadGithubTrendList(nextFilters);
    setGithubRepos(payload.repositories);
    setGithubLanguages(payload.languages);
    setGithubTopics(payload.topics);
    setGithubRadar(payload.radar);
    setGithubMeta(payload.meta);
  }

  async function refreshAll() {
    const tasks: Array<[string, Promise<unknown> | undefined]> = [
      ["知识库", loadKnowledge()],
      ["简历", loadResumes()],
      ["岗位目标", loadJobTargets()],
      ["复盘", loadReviews()],
      ["冲刺计划", loadSprints()],
      ["模拟记录", loadSessions()],
      ["今日数据", loadDaily()],
      ["岗位路径", loadLearningPath()],
      ["实验室", loadLabs()],
      ["面经", loadExperiences()],
      ["技术文章", articlesRef.current?.refresh()],
      ["记录文章", loadRecordArticles()],
      ["创业想法", loadStartupIdeas()],
      ["开源趋势", loadGithubTrends()],
    ];
    const results = await Promise.allSettled(tasks.map(([, task]) => task));
    const errors = results.flatMap((result, index) => {
      if (result.status === "fulfilled") return [];
      const label = tasks[index]?.[0] ?? "未知模块";
      const message = result.reason instanceof Error ? result.reason.message : "加载失败";
      return [`${label}：${message}`];
    });

    setInitialLoadErrors(errors);
    if (errors.length > 0) {
      setToast(`部分模块加载失败：${errors.slice(0, 2).join("；")}`);
    }
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
    const payload = await loadKnowledgeCards(nextFilters);
    setCards(payload.cards);
    setCompanies(payload.companies);
    setTopics(payload.topics);
    setKnowledgeTags(payload.tags);
    setPrepCompanyId((c) => c ?? payload.companies[0]?.id ?? null);
  }

  async function loadRecordArticles() {
    const articles = await loadKnowledgeArticles();
    setRecordArticles(articles);
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
      const payload = await suggestKnowledgeCard({
        question: knowledgeForm.question,
        answer: knowledgeForm.answer,
        companyName: knowledgeForm.companyName,
        topicName: knowledgeForm.topicName,
        tags: knowledgeForm.tags,
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
      setToast("已生成题库建议。");
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
      await createKnowledgeCard(knowledgeForm);
      setKnowledgeForm(emptyKnowledgeForm);
      setKnowledgeSuggestion(null);
      await Promise.all([loadKnowledge(), loadDaily()]);
      setToast("题库记录已保存。");
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
      const payload = await generateRecordCard({
        rawText: recordText,
        extraContext: recordContext,
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

  async function handleRecordBatchGenerate() {
    if (!recordArticleId && recordText.trim().length < 12) {
      setToast("请选择一篇技术文章，或直接贴入一段完整文章。");
      return;
    }
    setBusy("record-batch-agent");
    try {
      const payload = await generateRecordCards({
        rawText: recordText,
        articleId: recordArticleId ?? undefined,
        extraContext: recordContext,
        maxCards: recordBatchMaxCards,
      });
      setRecordBatchDrafts(payload.cardDrafts.map(makeRecordBatchDraft));
      setRecordAgentExecution(payload.execution);
      setToast(payload.execution.usedFallback ? "已用本地规则拆出多张八股卡草稿。" : `已生成 ${payload.cardDrafts.length} 张可编辑八股卡草稿。`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "文章拆题失败");
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
      const payload = await createKnowledgeCard(recordDraft);
      setRecordText("");
      setRecordContext("");
      setRecordDraft(emptyRecordAgentDraft);
      setRecordAgentExecution(null);
      setShowRecordAgentEditor(false);
      await Promise.all([loadKnowledge(), loadDaily()]);
      setSelectedKnowledgeId(payload.card.id);
      setToast("已保存为面试题库记录，可以继续编辑。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存记录失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleRecordBatchSave() {
    const selectedDrafts = recordBatchDrafts.filter((draft) => draft.selected);
    if (selectedDrafts.length === 0) {
      setToast("请至少勾选一张要保存的八股卡。");
      return;
    }
    const invalid = selectedDrafts.find((draft) => !draft.question.trim() || !draft.answer.trim());
    if (invalid) {
      setToast("被勾选的草稿里还有题目或答案为空。");
      return;
    }
    setBusy("record-batch-save");
    try {
      const payload = await createKnowledgeCards(
        selectedDrafts.map(({ draftId: _draftId, selected: _selected, ...draft }) => draft),
      );
      setRecordText("");
      setRecordContext("");
      setRecordDraft(emptyRecordAgentDraft);
      setRecordBatchDrafts([]);
      setRecordArticleId(null);
      setRecordAgentExecution(null);
      setShowRecordAgentEditor(false);
      await Promise.all([loadKnowledge(), loadDaily()]);
      setSelectedKnowledgeId(payload.created[0]?.id ?? null);
      setToast(`已批量保存 ${payload.created.length} 张八股卡。`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "批量保存失败");
    } finally {
      setBusy(null);
    }
  }

  function updateRecordBatchDraft(draftId: string, patch: Partial<KnowledgeForm & { selected: boolean }>) {
    setRecordBatchDrafts((drafts) => drafts.map((draft) => (draft.draftId === draftId ? { ...draft, ...patch } : draft)));
  }

  function removeRecordBatchDraft(draftId: string) {
    setRecordBatchDrafts((drafts) => drafts.filter((draft) => draft.draftId !== draftId));
  }

  function jumpToBenchmarkTarget(target: "interviewer" | "candidate" | "records" | "lab" | "review" | "articles") {
    if (target === "interviewer") {
      setActiveTab("interviewer");
      return;
    }
    if (target === "candidate") {
      setActiveTab("interview");
      setInterviewWorkspace("candidate");
      return;
    }
    setActiveTab(target);
  }

  function openRecordAgentEditor() {
    setRecordText("");
    setRecordContext("");
    setRecordDraft(emptyRecordAgentDraft);
    setRecordAgentMode("single");
    setRecordAgentExecution(null);
    setRecordBatchDrafts([]);
    setRecordArticleId(null);
    setRecordBatchMaxCards(8);
    setShowRecordAgentEditor(true);
    void loadRecordArticles();
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
      const payload = await refreshGithubTrendList(githubFilters);
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
      const payload = await updateGithubRepository(repo.id, { isFavorite: !repo.isFavorite });
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
      const payload = await updateGithubRepository(selectedGithubRepo.id, { note: githubNoteDraft });
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
      const payload = await analyzeGithubRepository(selectedGithubRepo.id);
      patchGithubRepo(payload.repository);
      setGithubAnalyzeExecution(payload.execution);
      setToast(payload.execution.usedFallback ? "已生成规则兜底分析。" : `${payload.execution.model} 已完成仓库分析。`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "仓库分析失败");
    } finally {
      setBusy(null);
    }
  }

  async function analyzeGithubRadarDigest() {
    setBusy("github-radar-analyze");
    try {
      const payload = await analyzeGithubRadar(githubFilters);
      setGithubRadarDigest(payload.digest);
      setGithubRadarExecution(payload.execution);
      setToast(payload.execution.usedFallback ? "已生成规则兜底雷达简报。" : `${payload.execution.model} 已完成 GitHub 雷达简报。`);
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
      const payload = await createGithubRadarSourceDraft(githubFilters);

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
      const payload = await createGithubRepoSourceDraft(repo.id, githubFilters);

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
      await updateKnowledgeCardProgress(cardId, { mastery, markReviewed });
      await Promise.all([loadKnowledge(), loadDaily()]);
      setToast(markReviewed ? "题目状态已记录。" : "题目状态已更新。");
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
      await updateKnowledgeCard(editingKnowledgeId, knowledgeEditForm);
      setEditingKnowledgeId(null);
      await Promise.all([loadKnowledge(), loadDaily()]);
      setToast("题库记录已更新。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "更新失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleKnowledgeDelete(cardId: number) {
    if (!window.confirm("确认删除这条题库记录吗？历史面试报告会保留。")) return;
    setBusy(`knowledge-delete-${cardId}`);
    try {
      await deleteKnowledgeCard(cardId);
      setSelectedKnowledgeId((current) => (current === cardId ? null : current));
      await Promise.all([loadKnowledge(), loadDaily(), loadReviews()]);
      setToast("题库记录已删除。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "删除失败");
    } finally {
      setBusy(null);
    }
  }

  function handleStartReview() {
    const first = reviewQueue[0] ?? cards[0];
    if (!first) {
      setToast("暂无题库记录。");
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
      setInterviewerDraftAnswers({});
      setInterviewerDiscussionParentId(null);
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

  function focusInterviewerTurn(turnId: number, persistedAnswer?: string | null) {
    if (focusedInterviewerTurnId) {
      setInterviewerDraftAnswers((current) => ({
        ...current,
        [focusedInterviewerTurnId]: interviewerAnswerText,
      }));
    }
    setFocusedInterviewerTurnId(turnId);
    setInterviewerAnswerText(interviewerDraftAnswers[turnId] ?? persistedAnswer ?? "");
    setShowInterviewerIdealAnswer(false);
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
      setInterviewerDraftAnswers((current) => {
        const next = { ...current };
        delete next[interviewerFocusedTurn.id];
        return next;
      });
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
      setInterviewerDraftAnswers({});
      setInterviewerAnswerText("");
      setInterviewerDiscussionTitle("");
      setInterviewerDiscussionParentId(null);
      await loadSessions();
      setToast("自由讨论卡已记录。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "自由讨论记录失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleRelinkInterviewerDiscussion() {
    if (!interviewerSession || !interviewerFocusedTurn || interviewerFocusedTurn.turnType !== "discussion") {
      setToast("先选择一张自由讨论卡。");
      return;
    }
    if (!interviewerDiscussionParentId) {
      setToast("先选择要归属的主问题。");
      return;
    }
    setBusy("interviewer-answer");
    try {
      const payload = await requestJson<{ session: InterviewSession; answeredTurn: { id: number } }>(
        `/api/interviewer-sessions/${interviewerSession.id}/answer`,
        {
          method: "POST",
          body: JSON.stringify({
            mode: "relink_discussion",
            turnId: interviewerFocusedTurn.id,
            sourceTurnId: interviewerDiscussionParentId,
            answer: interviewerAnswerText || interviewerFocusedTurn.answer || "已归属到主问题。",
            transcriptSource: "text",
          }),
        },
      );
      setInterviewerSession(payload.session);
      setInterviewerDraftAnswers((current) => {
        const next = { ...current };
        delete next[interviewerFocusedTurn.id];
        return next;
      });
      setFocusedInterviewerTurnId(payload.answeredTurn.id);
      setInterviewerDiscussionParentId(null);
      setInterviewerAnswerText("");
      await loadSessions();
      setToast("自由讨论卡已归属到主问题。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "自由讨论归属失败");
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
      setInterviewerDraftAnswers({});
      setInterviewerDiscussionParentId(null);
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
      setToast(status === "done" ? "报告动作已完成。" : "报告动作状态已更新。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "报告动作更新失败");
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
      setToast("已转成冲刺任务。");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成复盘任务失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleExportData() {
    setBusy("export");
    try {
      const payload = await exportWorkspaceData();
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
      const payload = await seedQuestionBank();
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

  if (!hasRestoredShellState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Topbar activeTab={activeTab} onTabChange={setActiveTab} onRefresh={() => void refreshAll()} />

      <main className="mx-auto max-w-[1680px] px-4 py-5 lg:px-6 lg:py-6">
        {(isInitialLoading || initialLoadErrors.length > 0) && (
          <div className="mb-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            {isInitialLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">部分模块没有加载完整</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    这通常是后端接口或本地服务暂时不可用导致的，页面会保留已加载的数据。
                  </p>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                    {initialLoadErrors.slice(0, 4).map((error) => (
                      <span key={error}>{error}</span>
                    ))}
                  </div>
                </div>
                <button className={btnSecondary} type="button" onClick={() => void refreshAll()}>
                  <RefreshCcw size={15} /> 重新加载
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── Applications ─── */}
        {activeTab === "applications" && (
          <ApplicationsTab
            busy={busy}
            nowTs={nowTs}
            applications={applications}
            applicationMetrics={applicationMetrics}
            applicationFilters={applicationFilters}
            applicationForm={applicationForm}
            applicationDetailTab={applicationDetailTab}
            applicationJdDraft={applicationJdDraft}
            selectedApplication={selectedApplication}
            selectedMatchReport={selectedMatchReport}
            primaryResumeVersion={primaryResumeVersion}
            resumeVersions={resumeVersions}
            sourceDocuments={sourceDocuments}
            sourceForm={sourceForm}
            agentRunResult={agentRunResult}
            resumes={resumes}
            jobTargets={jobTargets}
            seniorityOptions={seniorityOptions}
            stageLabels={applicationStageLabels}
            stageOrder={applicationStageOrder}
            onFiltersChange={setApplicationFilters}
            onLoadApplications={(nextFilters) => void loadApplications(nextFilters)}
            onSelectApplication={setSelectedApplicationId}
            onApplicationFormChange={setApplicationForm}
            onCreateApplication={() => void handleCreateApplication()}
            onUpdateApplication={(id, patch) => void handleUpdateApplication(id, patch)}
            onDetailTabChange={setApplicationDetailTab}
            onJdDraftChange={setApplicationJdDraft}
            onSaveApplicationJd={() => void handleSaveApplicationJd()}
            onMatchApplication={(id) => void handleMatchApplication(id)}
            onCreateResumeVersion={(id) => void handleCreateResumeVersion(id)}
            onAutoSelectResumeVersion={(id) => void handleAutoSelectResumeVersion(id)}
            onGenerateResumeBullet={(versionId, keyword) => void handleGenerateResumeBullet(versionId, keyword)}
            onSourceFormChange={setSourceForm}
            onCreateSource={() => void handleCreateSource()}
            onActiveTabChange={setActiveTab}
          />
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
                          <p className="mt-1 text-xs text-muted-foreground">{agent.agentName} · {agent.model ?? "deepseek-v4-pro"}</p>
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
          <RecordsTab
            busy={busy}
            filters={filters}
            recordCards={recordCards}
            selectedKnowledgeCard={selectedKnowledgeCard}
            recordTagFilter={recordTagFilter}
            recordTagGroups={recordTagGroups}
            onFiltersChange={setFilters}
            onLoadKnowledge={(nextFilters) => void loadKnowledge(nextFilters)}
            onRecordTagFilterChange={setRecordTagFilter}
            onSelectedKnowledgeIdChange={setSelectedKnowledgeId}
            onOpenRecordAgentEditor={openRecordAgentEditor}
            onSeedQuestionBank={() => void handleSeedQuestionBank()}
            onExportData={() => void handleExportData()}
            onStartKnowledgeEdit={startKnowledgeEdit}
            onActiveTabChange={setActiveTab}
          />
        )}

        {/* ─── Home ─── */}
        {activeTab === "home" && (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="题库记录" value={cards.length} icon={<BookOpen size={16} />} />
              <MetricCard label="公司面经" value={experiences.length} icon={<Building2 size={16} />} />
              <MetricCard label="岗位目标" value={jobTargets.length} icon={<Target size={16} />} />
              <MetricCard label="平均模拟分" value={averageInterviewScore || "-"} icon={<Gauge size={16} />} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(360px,460px)_1fr]">
              <Panel title="核心动作" icon={<ListChecks size={16} />}>
                <div className="grid gap-3">
                  {[
                    { title: "录入公司面经", description: "粘贴原文，生成公司、轮次、题目和标签。", icon: <Building2 size={15} />, action: () => setActiveDialog("experience"), tone: "primary" as const },
                    { title: "新增题库题目", description: "把八股文或技术文章整理成题目和答案。", icon: <BookOpen size={15} />, action: openRecordAgentEditor },
                    { title: "解析简历", description: "提取项目、技能和可追问点。", icon: <FileText size={15} />, action: () => setActiveDialog("resume") },
                    { title: "匹配 JD", description: "生成岗位能力要求和简历缺口。", icon: <Target size={15} />, action: () => setActiveDialog("jd") },
                    { title: "开始模拟", description: "按公司、JD、简历和题库进入训练。", icon: <Play size={15} />, action: () => setActiveDialog("interview"), tone: "primary" as const },
                  ].map((item) => (
                    <button
                      key={item.title}
                      className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:bg-sky-50"
                      type="button"
                      onClick={item.action}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="flex items-center gap-2 text-sm font-semibold">
                          {item.icon}
                          {item.title}
                        </h4>
                        {item.tone === "primary" && <Pill variant="brand">核心</Pill>}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </button>
                  ))}
                </div>
              </Panel>

              <div className="grid gap-4">
                <Panel title="产品工作台" icon={<Gauge size={16} />}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button className="rounded-xl border border-border p-4 text-left shadow-sm transition-colors hover:bg-slate-50" type="button" onClick={() => setActiveTab("records")}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">维护题库</h4>
                        <Pill variant="brand">{cards.length} 条</Pill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">搜索、筛选、编辑真实面试题和参考答案。</p>
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
                    <button className="rounded-xl border border-border p-4 text-left shadow-sm transition-colors hover:bg-slate-50" type="button" onClick={() => setActiveTab("prep")}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">公司情报训练</h4>
                        <Pill variant="warn">{experiences.length} 条面经</Pill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">围绕公司、岗位、面经和高频题做定向准备。</p>
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
                        <button className={btnGhost} type="button" onClick={() => setActiveTab("review")}>看报告</button>
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
              <Panel title="核心准备" icon={<ListChecks size={16} />}>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <ScoreCard label="岗位目标" value={jobTargets.length} />
                    <ScoreCard label="题库记录" value={cards.length} />
                    <ScoreCard label="模拟轮次" value={sessions.length} />
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <h4 className="text-sm font-semibold">推荐顺序</h4>
                    <TextList values={["先录入目标 JD 和简历", "再补公司面经与高频题", "最后启动一轮定向模拟并查看报告"]} />
                  </div>
                </div>
              </Panel>

              <Panel title="岗位准备路径" icon={<GitBranch size={16} />}>
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
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">公司情报</h3>
                <p className="mt-1 text-sm text-muted-foreground">这里只做公司和 JD 浏览。先看大公司，再按岗位筛选本地已录入的 JD。</p>
              </div>
              <div className="flex gap-2">
                <button className={btnSecondary} type="button" onClick={() => setActiveDialog("experience")}>
                  <Building2 size={15} /> 录入面经
                </button>
                <button className={btnPrimary} type="button" onClick={() => setActiveDialog("jd")}>
                  <Target size={15} /> 新增 JD
                </button>
              </div>
            </div>

            <Panel title="筛选条件" icon={<Search size={16} />}>
              <div className="grid gap-3 lg:grid-cols-[minmax(220px,300px)_1fr_auto]">
                <input
                  className={inputCls}
                  placeholder="搜索公司"
                  value={prepCompanySearch}
                  onChange={(e) => setPrepCompanySearch(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm transition-colors",
                      !prepRoleFilter ? "border-sky-300 bg-sky-600 text-white" : "border-border bg-surface text-muted-foreground hover:text-foreground",
                    )}
                    type="button"
                    onClick={() => setPrepRoleFilter("")}
                  >
                    全部岗位
                  </button>
                  {prepRoleOptions.map((role) => (
                    <button
                      key={role}
                      className={cn(
                        "rounded-full border px-3 py-2 text-sm transition-colors",
                        prepRoleFilter === role ? "border-sky-300 bg-sky-600 text-white" : "border-border bg-surface text-muted-foreground hover:text-foreground",
                      )}
                      type="button"
                      onClick={() => setPrepRoleFilter(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <button
                  className={btnGhost}
                  type="button"
                  onClick={() => {
                    setPrepCompanySearch("");
                    setPrepRoleFilter("");
                    setSelectedPrepCompanyName("");
                  }}
                >
                  重置
                </button>
              </div>
            </Panel>

            <div className="grid gap-4 xl:grid-cols-[280px_minmax(360px,0.9fr)_minmax(420px,1.1fr)]">
              <Panel title="公司列表" icon={<Building2 size={16} />}>
                <div className="mb-3">
                  <button
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                      !selectedPrepCompanyName ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100" : "border-border bg-surface hover:bg-sky-50",
                    )}
                    type="button"
                    onClick={() => setSelectedPrepCompanyName("")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm">全部公司</strong>
                      <Pill variant="accent">{prepFilteredJobTargets.length} JD</Pill>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">查看当前筛选条件下的全部岗位。</p>
                  </button>
                </div>
                <div className="grid max-h-[720px] gap-3 overflow-auto pr-1">
                  {prepCompanyDirectory.map((company) => (
                    <button
                      key={company.name}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition-colors",
                        selectedPrepCompanyName === company.name ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100" : "border-border bg-surface hover:bg-sky-50",
                      )}
                      type="button"
                      onClick={() => {
                        setSelectedPrepCompanyName(company.name);
                        setPrepCompanyId(company.companyId);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <strong className="text-sm text-slate-950">{company.name}</strong>
                        <Pill variant={company.jdCount > 0 ? "brand" : "default"}>{company.jdCount} JD</Pill>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">面经 {company.reportCount} 条</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[...company.roles].slice(0, 3).map((role) => <Pill key={`${company.name}-${role}`}>{role}</Pill>)}
                      </div>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="JD 列表" icon={<FileText size={16} />}>
                {prepFilteredJobTargets.length === 0 ? (
                  <EmptyBeauty
                    title="还没有匹配到 JD"
                    description="当前公司或岗位筛选下还没有本地 JD。可以先切换公司，或者新增一条目标岗位 JD。"
                    action={{ title: "新增 JD", description: "", icon: <Target size={15} />, action: () => setActiveDialog("jd") }}
                  />
                ) : (
                  <div className="grid max-h-[720px] gap-3 overflow-auto pr-1">
                    {prepFilteredJobTargets.map((target) => (
                      <button
                        key={target.id}
                        className={cn(
                          "rounded-xl border px-4 py-4 text-left transition-colors",
                          selectedPrepJobTarget?.id === target.id ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100" : "border-border bg-surface hover:bg-sky-50",
                        )}
                        type="button"
                        onClick={() => setSelectedPrepJobTargetId(target.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">{target.company?.name ?? "未命名公司"}</p>
                            <h4 className="mt-1 text-sm font-semibold text-slate-950">{target.roleName}</h4>
                          </div>
                          <Pill variant="accent">{target.match.matchScore || 0}</Pill>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{target.rawJd}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {target.parsed.requiredSkills.slice(0, 3).map((skill) => <Pill key={`${target.id}-${skill}`}>{skill}</Pill>)}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDate(target.updatedAt)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="JD 详情" icon={<ClipboardList size={16} />}>
                {!selectedPrepJobTarget ? (
                  <EmptyBeauty
                    title="选择一条 JD"
                    description="从中间列表选择岗位后，这里会显示职责、要求、风险点和简历匹配情况。"
                  />
                ) : (
                  <div className="grid gap-4">
                    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{selectedPrepJobTarget.company?.name ?? "未命名公司"}</p>
                          <h4 className="mt-1 text-base font-semibold text-slate-950">{selectedPrepJobTarget.roleName}</h4>
                        </div>
                        <Pill variant="brand">匹配 {selectedPrepJobTarget.match.matchScore || 0}</Pill>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className={btnPrimary} type="button" onClick={() => { setSelectedJobTargetId(selectedPrepJobTarget.id); setActiveTab("interview"); }}>
                          <Play size={15} /> 用这条 JD 模拟
                        </button>
                        <button className={btnSecondary} type="button" onClick={() => { setSelectedJobTargetId(selectedPrepJobTarget.id); setActiveTab("targets"); }}>
                          <Gauge size={15} /> 查看匹配报告
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <DataGroup title="岗位职责"><TextList values={selectedPrepJobTarget.parsed.responsibilities} /></DataGroup>
                      <DataGroup title="必备技能"><TextList values={selectedPrepJobTarget.parsed.requiredSkills} /></DataGroup>
                      <DataGroup title="加分项"><TextList values={selectedPrepJobTarget.parsed.bonusSkills} /></DataGroup>
                      <DataGroup title="风险点"><TextList values={selectedPrepJobTarget.parsed.riskPoints} /></DataGroup>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <DataGroup title="简历优势"><TextList values={selectedPrepJobTarget.match.strengths} /></DataGroup>
                      <DataGroup title="简历缺口"><TextList values={selectedPrepJobTarget.match.gaps} /></DataGroup>
                    </div>

                    <article className="rounded-xl border border-border bg-slate-50 p-4 shadow-sm">
                      <h4 className="text-sm font-semibold">原始 JD</h4>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{selectedPrepJobTarget.rawJd}</p>
                    </article>
                  </div>
                )}
              </Panel>
            </div>
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

            <Panel title="题库记录" icon={<BookOpen size={16} />}>
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
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(280px,1fr)_minmax(340px,440px)]">
                <div className="grid max-h-[760px] gap-3 overflow-auto pr-1">
                  {cards.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">暂无题库记录</div>
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
                          {(() => {
                            const guide = buildKnowledgeStudyGuide({
                              question: card.question,
                              answer: card.answer,
                              note: card.note,
                              topicName: card.topic?.name,
                              tags: card.tags,
                            });
                            return (
                              <>
                                <div className="flex items-start justify-between gap-3">
                                  <h5 className="text-sm font-semibold leading-snug">{card.question}</h5>
                                  <Pill variant="accent">{card.questionType || "八股"}</Pill>
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{guide.coreAnswer}</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {card.company && <Pill>{card.company.name}</Pill>}
                                  {card.topic && <Pill>{card.topic.name}</Pill>}
                                  <Pill variant="accent">{difficultyLabels[card.difficulty] ?? card.difficulty}</Pill>
                                  <Pill>{guide.followUps.length} 追问</Pill>
                                </div>
                              </>
                            );
                          })()}
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
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
                    <div className="py-8 text-center text-sm text-muted-foreground">选择一条题库记录查看详情</div>
                  ) : editingKnowledgeId === selectedKnowledgeCard.id ? (
                    <div className="grid gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold">编辑题库记录</h4>
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
                          <Pill variant="brand">题目详情</Pill>
                          <h4 className="mt-3 text-base font-semibold leading-snug">{selectedKnowledgeCard.question}</h4>
                        </div>
                        <button className={btnGhost} type="button" onClick={() => startKnowledgeEdit(selectedKnowledgeCard)}>
                          <Pencil size={14} /> 编辑
                        </button>
                      </div>
                      <KnowledgeStudyGuideView card={selectedKnowledgeCard} />
                      <div className="flex flex-wrap gap-1.5">
                        {selectedKnowledgeCard.company && <Pill>{selectedKnowledgeCard.company.name}</Pill>}
                        {selectedKnowledgeCard.topic && <Pill>{selectedKnowledgeCard.topic.name}</Pill>}
                        {selectedKnowledgeCard.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
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
                                <div key={turn.id} className="grid gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      focusInterviewerTurn(turn.id, turn.answer);
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

                                  {followUps.length > 0 && (
                                    <div className="ml-4 grid gap-2 border-l border-border pl-3">
                                      {followUps.map((followUp, index) => (
                                        <button
                                          key={followUp.id}
                                          type="button"
                                          onClick={() => {
                                            focusInterviewerTurn(followUp.id, followUp.answer);
                                          }}
                                          className={cn(
                                            "rounded-xl border p-3 text-left transition-colors",
                                            interviewerFocusedTurn?.id === followUp.id ? "border-primary bg-primary-soft/30" : "border-border bg-surface hover:bg-slate-50",
                                          )}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex flex-wrap gap-2">
                                              <Pill variant="accent">追问 {index + 1}</Pill>
                                              {followUp.questionSource && <Pill>{followUp.questionSource}</Pill>}
                                            </div>
                                            <Pill variant={followUp.answer?.trim() ? "brand" : "accent"}>{followUp.answer?.trim() ? "已记录" : "待记录"}</Pill>
                                          </div>
                                          <p className="mt-2 text-sm font-medium leading-relaxed">{followUp.question}</p>
                                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{followUp.answer?.trim() || "还没有纪要。"}</p>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
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
                                      focusInterviewerTurn(turn.id, turn.answer);
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
                              {interviewerFocusedTurn?.turnType === "primary" && interviewerSession.turns.filter((turn) => turn.parentTurnId === interviewerFocusedTurn?.id && turn.turnType === "followup").length > 0 && (
                                <DataGroup title="已挂载追问">
                                  <TextList values={interviewerSession.turns.filter((turn) => turn.parentTurnId === interviewerFocusedTurn?.id && turn.turnType === "followup").map((turn) => turn.question)} />
                                </DataGroup>
                              )}
                              {interviewerFocusedTurn?.turnType === "followup" && interviewerFocusedTurn.parentTurnId && (
                                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                                  这是一条追问卡，已挂到主问题 #{interviewerSession.turns.find((turn) => turn.id === interviewerFocusedTurn.parentTurnId)?.order ?? "-"}。
                                </p>
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

                          {interviewerFocusedTurn?.turnType === "discussion" && (
                            <Field label="归属到主问题">
                              <select
                                className={inputCls}
                                value={interviewerDiscussionParentId ?? ""}
                                onChange={(e) => setInterviewerDiscussionParentId(e.target.value ? Number(e.target.value) : null)}
                              >
                                <option value="">先选择一个主问题</option>
                                {interviewerPrimaryTurns.map((turn) => (
                                  <option key={turn.id} value={turn.id}>
                                    主问题 {turn.order} · {turn.question}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <button className={btnPrimary} type="button" onClick={() => void handleSubmitInterviewerAnswer()} disabled={!interviewerFocusedTurn || busy === "interviewer-answer"}>
                              <Send size={15} /> 保存到当前题卡
                            </button>
                            <button className={btnSecondary} type="button" onClick={() => void handleCreateInterviewerDiscussion()} disabled={busy === "interviewer-answer"}>
                              <ClipboardList size={15} /> 新建自由讨论卡
                            </button>
                            {interviewerFocusedTurn?.turnType === "discussion" && (
                              <button className={btnSecondary} type="button" onClick={() => void handleRelinkInterviewerDiscussion()} disabled={busy === "interviewer-answer"}>
                                <GitBranch size={15} /> 归属到主问题
                              </button>
                            )}
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
            <Panel title="市场标杆补齐雷达" icon={<BarChart3 size={16} />}>
              <div className="grid gap-4 xl:grid-cols-[minmax(280px,360px)_1fr]">
                <article className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Market Coverage</p>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-4xl font-bold">{interviewBenchmarkCoverage.score}</span>
                    <span className="pb-1 text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    对照 LeetCode、HackerRank、CodeSignal、CoderPad、interviewing.io、Big Interview、Pramp 等平台的公开能力，持续检查我们还差什么。
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <ScoreCard label="已具备" value={interviewBenchmarkCoverage.strong} />
                    <ScoreCard label="可加强" value={interviewBenchmarkCoverage.partial} />
                    <ScoreCard label="待补齐" value={interviewBenchmarkCoverage.missing} />
                  </div>
                  {interviewBenchmarkCoverage.next && (
                    <button
                      className={btnPrimary + " mt-4 w-full"}
                      type="button"
                      onClick={() => jumpToBenchmarkTarget(interviewBenchmarkCoverage.next!.target)}
                    >
                      <Target size={15} /> 下一步：{interviewBenchmarkCoverage.next.ctaLabel}
                    </button>
                  )}
                </article>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {interviewPlatformBenchmarks.map((item) => {
                    const status = benchmarkStatusCopy[item.ourStatus];
                    return (
                      <article key={item.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold leading-snug">{item.title}</h4>
                          <Pill variant={status.pill}>{status.label}</Pill>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.platforms.join(" / ")}</p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.marketPattern}</p>
                        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{item.evidence}</p>
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{item.recommendedAction}</p>
                        <button className={btnGhost + " mt-3"} type="button" onClick={() => jumpToBenchmarkTarget(item.target)}>
                          {item.ctaLabel}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </Panel>

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
                        setActiveSession(session.config?.sessionKind === "mock_interviewer" ? activeSession : (session.status === "active" ? session : activeSession));
                        setInterviewWorkspace(session.config?.sessionKind === "mock_interviewer" ? "interviewer" : "candidate");
                      }}>
                      <div className="flex items-start justify-between gap-3">
                        <h5 className="text-sm font-semibold">
                          {session.config?.sessionKind === "mock_interviewer"
                            ? "面试官 Agent"
                            : `${interviewModeLabels[session.mode]} / ${roundTypeLabels[session.roundType]}`}
                        </h5>
                        <Pill variant={session.status === "finished" ? "brand" : "accent"}>{session.status === "finished" ? "已完成" : session.status}</Pill>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{session.company?.name ?? "未命名公司"}{session.targetRole ? ` / ${session.targetRole}` : ""}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Pill>总分 {scoreOrDash(session.score.overall)}</Pill>
                        {session.config?.sessionKind === "mock_interviewer" ? (
                          <>
                            <Pill>主问题 {session.turns.filter((turn) => turn.turnType === "primary" && turn.answer?.trim()).length}/{session.plan?.primaryQuestionBudget ?? session.turns.filter((turn) => turn.turnType === "primary").length}</Pill>
                            <Pill>讨论 {session.turns.filter((turn) => turn.turnType === "discussion").length}</Pill>
                          </>
                        ) : (
                          <Pill>回答 {session.turns.filter((turn) => turn.answer).length}/{session.turns.length}</Pill>
                        )}
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
                              输入一句想法，Agent 会调用当前配置模型按我们的模板生成创业想法详情。
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Pill variant="accent">LangGraph</Pill>
                            <Pill variant={startupIdeaAgentExecution?.usedFallback ? "warn" : "brand"}>
                              {startupIdeaAgentExecution?.usedFallback ? "Fallback" : startupIdeaAgentExecution?.model || "deepseek-v4-pro"}
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
          <GithubTrendsTab
            busy={busy}
            filters={githubFilters}
            repositories={githubRepos}
            languages={githubLanguages}
            topics={githubTopics}
            meta={githubMeta}
            radar={githubRadar}
            radarDigest={githubRadarDigest}
            radarExecution={githubRadarExecution}
            selectedRepository={selectedGithubRepo}
            noteDraft={githubNoteDraft}
            analyzeExecution={githubAnalyzeExecution}
            onSetFilters={setGithubFilters}
            onUpdateFilters={(next) => void updateGithubFilters(next)}
            onSearch={() => void loadGithubTrends(githubFilters)}
            onRefresh={() => void refreshGithubTrends()}
            onSelectRepository={setSelectedGithubRepoId}
            onToggleFavorite={(repo) => void toggleGithubFavorite(repo)}
            onAnalyzeRepository={() => void analyzeGithubRepo()}
            onAnalyzeRadar={() => void analyzeGithubRadarDigest()}
            onSaveRadarAsSource={() => void saveGithubRadarAsSource()}
            onSaveRepositoryAsSource={(repo) => void saveGithubRepoAsSource(repo)}
            onNoteDraftChange={setGithubNoteDraft}
            onSaveNote={() => void saveGithubNote()}
          />
        )}

        <RecordAgentEditor
          busy={busy}
          isOpen={showRecordAgentEditor}
          mode={recordAgentMode}
          recordText={recordText}
          recordContext={recordContext}
          recordDraft={recordDraft}
          execution={recordAgentExecution}
          articles={recordArticles}
          articleId={recordArticleId}
          batchMaxCards={recordBatchMaxCards}
          batchDrafts={recordBatchDrafts}
          onClose={closeRecordAgentEditor}
          onModeChange={(mode) => {
            setRecordAgentMode(mode);
            setRecordAgentExecution(null);
          }}
          onRecordTextChange={setRecordText}
          onRecordContextChange={setRecordContext}
          onRecordDraftChange={setRecordDraft}
          onArticleIdChange={setRecordArticleId}
          onBatchMaxCardsChange={setRecordBatchMaxCards}
          onGenerateSingle={() => void handleRecordAgentGenerate()}
          onGenerateBatch={() => void handleRecordBatchGenerate()}
          onSaveSingle={() => void handleRecordSave()}
          onSaveBatch={() => void handleRecordBatchSave()}
          onUpdateBatchDraft={updateRecordBatchDraft}
          onRemoveBatchDraft={removeRecordBatchDraft}
          onSelectAllBatchDrafts={(selected) => {
            setRecordBatchDrafts((drafts) => drafts.map((draft) => ({ ...draft, selected })));
          }}
        />

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
                <h3 className="text-lg font-semibold">面试报告</h3>
                <p className="mt-1 text-sm text-muted-foreground">只展示模拟面试的总评、逐题诊断和更好的回答示例。</p>
              </div>
              <div className="flex gap-2">
                <button className={btnSecondary} type="button" onClick={() => void loadSessions()}>
                  <RefreshCcw size={15} /> 刷新
                </button>
                <button className={btnSecondary} type="button" onClick={() => void handleExportData()} disabled={busy === "export"}>
                  <Download size={15} /> 导出
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(300px,420px)_1fr]">
              <Panel title="报告列表" icon={<ListChecks size={16} />}>
                {sessions.filter((session) => session.status === "finished").length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">完成一轮模拟后会生成报告。</div>
                ) : (
                  <div className="grid max-h-[640px] gap-3 overflow-auto pr-1">
                    {sessions.filter((session) => session.status === "finished").map((session) => (
                      <button
                        key={session.id}
                        className={cn(
                          "rounded-xl border bg-surface p-4 text-left shadow-sm transition-colors hover:bg-sky-50",
                          selectedSessionDetail?.id === session.id ? "border-primary ring-2 ring-primary/15" : "border-border",
                        )}
                        type="button"
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold">{session.company?.name ?? "未命名公司"} / {session.targetRole ?? "目标岗位"}</h4>
                          <Pill variant="accent">{scoreOrDash(session.score.overall)}</Pill>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{session.summary || "暂无总评"}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDate(session.updatedAt)} · {roundTypeLabels[session.roundType]}</p>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>
              <Panel title="报告详情" icon={<BarChart3 size={16} />}>
                {!selectedSessionDetail || selectedSessionDetail.status !== "finished" ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">选择一份已完成报告查看详情。</div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      <ScoreCard label="总分" value={selectedSessionDetail.score.overall ?? 0} />
                      <ScoreCard label="八股" value={selectedSessionDetail.score.knowledge ?? 0} />
                      <ScoreCard label="表达" value={selectedSessionDetail.score.expression ?? 0} />
                    </div>
                    <article className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                      <h4 className="text-sm font-semibold">总评</h4>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{selectedSessionDetail.summary || "暂无总评"}</p>
                    </article>
                    <div className="grid gap-3">
                      {selectedSessionDetail.turns.filter((t) => t.answer).map((turn) => (
                        <article key={turn.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-sm font-semibold">第 {turn.order} 题：{turn.question}</h5>
                            <Pill variant="accent">准确 {scoreOrDash(turn.score.accuracy)}</Pill>
                          </div>
                          {turn.answer && <p className="mt-2 text-sm leading-6 text-slate-600"><strong>原回答：</strong>{turn.answer}</p>}
                          {turn.feedback && <p className="mt-2 text-sm leading-6 text-slate-600"><strong>诊断：</strong>{turn.feedback}</p>}
                          {turn.betterAnswer && <p className="mt-2 text-sm leading-6 text-slate-600"><strong>改进示例：</strong>{turn.betterAnswer}</p>}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            </div>
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
              <ScoreCard label="模拟轮次" value={sessions.length} />
              <ScoreCard label="题库记录" value={cards.length} />
              <ScoreCard label="岗位目标" value={jobTargets.length} />
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
              <Panel title="题库分布" icon={<BookOpen size={16} />}>
                {cards.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">录入题库后展示主题分布。</div>
                ) : (
                  <div className="grid gap-3">
                    {Array.from(new Map(cards.map((card) => [card.topic?.name ?? "通用", cards.filter((item) => (item.topic?.name ?? "通用") === (card.topic?.name ?? "通用")).length]))).map(([label, count]) => (
                      <div key={label} className="rounded-xl border border-border p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="text-sm font-semibold">{label}</h5>
                          <Pill>{count}</Pill>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                          <div className={cn("h-full rounded-full", progressGradientCls)} style={{ width: `${Math.round((count / Math.max(cards.length, 1)) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              <Panel title="最近报告摘要" icon={<Tags size={16} />}>
                {!latestFinishedSession ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">暂无已完成面试报告。</div>
                ) : (
                  <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <h5 className="text-sm font-semibold">{latestFinishedSession.company?.name ?? "未命名公司"} / {latestFinishedSession.targetRole ?? "目标岗位"}</h5>
                      <Pill variant="accent">{scoreOrDash(latestFinishedSession.score.overall)}</Pill>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{latestFinishedSession.summary}</p>
                    <button className={btnGhost + " mt-3"} type="button" onClick={() => { setSelectedSessionId(latestFinishedSession.id); setActiveTab("review"); }}>
                      查看报告
                    </button>
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}
      </main>

      {activeDialog === "experience" && (
        <DialogShell
          title="录入公司面经"
          description="只需要粘贴原文。AI 会先结构化成轮次、题目、标签和可信度，确认后再保存。"
          icon={<Building2 size={18} />}
          onClose={() => setActiveDialog(null)}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="公司">
                  <input className={inputCls} list="company-options" placeholder="如 Google" value={experienceCompanyName} onChange={(e) => setExperienceCompanyName(e.target.value)} />
                </Field>
                <Field label="岗位">
                  <input className={inputCls} placeholder="如 后端工程师 / SWE" value={experienceRoleName} onChange={(e) => setExperienceRoleName(e.target.value)} />
                </Field>
              </div>
              <Field label="面经原文">
                <textarea className={textareaCls + " min-h-[320px]"} placeholder="粘贴整段面经：公司、岗位、轮次、题目、体验、结果..." value={experienceText} onChange={(e) => setExperienceText(e.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button className={btnSecondary} type="button" onClick={() => void handleExperienceParse()} disabled={busy === "experience-parse"}>
                  <Sparkles size={15} /> AI 结构化
                </button>
                <button className={btnPrimary} type="button" onClick={() => void handleExperienceSave()} disabled={!experienceDraft || busy === "experience-save"}>
                  <Save size={15} /> 保存面经
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-4">
              {!experienceDraft ? (
                <EmptyBeauty title="等待结构化" description="点击 AI 结构化后，这里会出现公司、岗位、轮次、问题和标签预览。" />
              ) : (
                <div className="grid gap-3">
                  <div className="rounded-lg border border-sky-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-950">{experienceDraft.companyName || "目标公司"} / {experienceDraft.roleName}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{experienceDraft.summary}</p>
                      </div>
                      <Pill variant="brand">{experienceDraft.confidence}</Pill>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {experienceDraft.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
                    </div>
                  </div>
                  {experienceDraft.rounds.map((round) => (
                    <article key={`${round.order}-${round.roundType}`} className="rounded-lg border border-sky-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h5 className="text-sm font-semibold text-slate-950">第 {round.order} 轮 · {round.roundType}</h5>
                        <Pill variant="accent">{round.questions.length} 题</Pill>
                      </div>
                      <TextList values={round.questions} />
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogShell>
      )}

      {activeDialog === "jd" && (
        <DialogShell
          title="匹配目标 JD"
          description="输入公司、岗位和 JD，系统会结合当前简历生成职责、技能、风险点和匹配缺口。"
          icon={<Target size={18} />}
          onClose={() => setActiveDialog(null)}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(300px,1fr)]">
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="公司">
                  <input className={inputCls} placeholder="可选" value={jdCompanyName} onChange={(e) => setJdCompanyName(e.target.value)} />
                </Field>
                <Field label="岗位">
                  <input className={inputCls} placeholder="如 AI 平台后端" value={jdRoleName} onChange={(e) => setJdRoleName(e.target.value)} />
                </Field>
              </div>
              <Field label="JD 原文">
                <textarea className={textareaCls + " min-h-[340px]"} placeholder="粘贴岗位描述，越完整越好。" value={jdText} onChange={(e) => setJdText(e.target.value)} />
              </Field>
              <button className={btnPrimary} type="button" onClick={() => void handleJobTargetParse()} disabled={busy === "job-parse"}>
                <Sparkles size={15} /> 生成岗位目标
              </button>
            </div>
            <div className="grid gap-3">
              {selectedResume && (
                <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                  <p className="text-xs font-semibold text-slate-500">当前简历</p>
                  <h4 className="mt-1 text-sm font-semibold text-slate-950">{selectedResume.title}</h4>
                  <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">{selectedResume.parsed.summary || selectedResume.rawText}</p>
                </div>
              )}
              {!selectedJobTarget ? (
                <EmptyBeauty title="还没有岗位报告" description="生成后会在这里看到匹配分、缺口技能和项目话术建议。" />
              ) : (
                <div className="grid gap-3 rounded-lg border border-sky-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">最新匹配</p>
                      <h4 className="mt-1 text-sm font-semibold text-slate-950">{selectedJobTarget.company?.name ?? "目标公司"} / {selectedJobTarget.roleName}</h4>
                    </div>
                    <Pill variant="brand">匹配 {selectedJobTarget.match.matchScore || 0}</Pill>
                  </div>
                  <DataGroup title="面试重点"><TextList values={selectedJobTarget.parsed.interviewFocus} /></DataGroup>
                  <DataGroup title="待补缺口"><TextList values={selectedJobTarget.match.gaps} /></DataGroup>
                </div>
              )}
            </div>
          </div>
        </DialogShell>
      )}

      {activeDialog === "resume" && (
        <DialogShell
          title="解析简历"
          description="粘贴文本版简历，生成结构化经历、技能、项目和面试追问。"
          icon={<FileText size={18} />}
          onClose={() => setActiveDialog(null)}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
            <div className="grid gap-3">
              <Field label="简历标题">
                <input className={inputCls} placeholder="如 后端主投版" value={resumeTitle} onChange={(e) => setResumeTitle(e.target.value)} />
              </Field>
              <Field label="简历文本">
                <textarea className={textareaCls + " min-h-[360px]"} placeholder="粘贴简历文本" value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
              </Field>
              <button className={btnPrimary} type="button" onClick={() => void handleResumeParse()} disabled={busy === "resume-parse"}>
                <Sparkles size={15} /> 解析并保存
              </button>
            </div>
            <div className="grid gap-3">
              {resumes.length === 0 ? (
                <EmptyBeauty title="还没有简历" description="解析后会沉淀为简历档案，并可用于 JD 匹配和模拟面试。" />
              ) : (
                resumes.slice(0, 4).map((resume) => (
                  <button
                    key={resume.id}
                    type="button"
                    onClick={() => setSelectedResumeId(resume.id)}
                    className={cn(
                      "rounded-lg border bg-white p-4 text-left shadow-sm transition",
                      selectedResumeId === resume.id ? "border-sky-300 ring-4 ring-sky-100" : "border-sky-100 hover:bg-sky-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-slate-950">{resume.title}</strong>
                      <Pill>{formatDate(resume.updatedAt)}</Pill>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{resume.parsed.summary || resume.rawText}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogShell>
      )}

      {activeDialog === "interview" && (
        <DialogShell
          title="启动模拟面试"
          description="选择模拟模式和轮次。开始后不会中途展示完整评分，结束时统一生成复盘。"
          icon={<MessageSquareText size={18} />}
          onClose={() => setActiveDialog(null)}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-sky-100 bg-sky-50 p-1">
                {(Object.keys(interviewModeLabels) as InterviewMode[]).map((mode) => (
                  <button key={mode}
                    className={cn("rounded-md px-3 py-2 text-sm font-semibold transition",
                      interviewMode === mode ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-950")}
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
                <Field label="目标公司">
                  <input className={inputCls} placeholder={selectedJobTarget?.company?.name ?? "可选"} value={targetCompanyName} onChange={(e) => setTargetCompanyName(e.target.value)} />
                </Field>
              </div>
              <Field label="目标岗位">
                <input className={inputCls} placeholder={selectedJobTarget?.roleName ?? "如 后端工程师"} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <button className={btnPrimary} type="button" onClick={() => { setDeliveryMode("text"); void handleStartInterview(); setActiveDialog(null); }} disabled={busy === "interview-start"}>
                  <Play size={15} /> 文字模拟
                </button>
                <button className={btnSecondary} type="button" onClick={() => { setDeliveryMode("voice"); void handleStartInterview(); setActiveDialog(null); }} disabled={busy === "interview-start"}>
                  <Mic size={15} /> 语音入口
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">上下文优先级</p>
                <ol className="mt-3 grid gap-2 text-sm text-slate-600">
                  <li>1. JD 目标：{selectedJobTarget?.roleName ?? "暂未选择"}</li>
                  <li>2. 简历：{selectedResume?.title ?? "暂未选择"}</li>
                  <li>3. 公司题库：{targetCompanyName || selectedJobTarget?.company?.name || "可选"}</li>
                  <li>4. 历史模拟：{sessions.length} 轮</li>
                </ol>
              </div>
              <div className="rounded-lg border border-sky-100 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">面试强度</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{candidateTarget.summary}。系统会按薪资和级别提高项目深挖、系统设计和反事实追问比例。</p>
              </div>
            </div>
          </div>
        </DialogShell>
      )}

      {activeDialog === "sprint" && (
        <DialogShell
          title="生成冲刺计划"
          description="把目标公司、岗位和面试日期拆成每日任务，覆盖八股、项目话术、模拟和报告。"
          icon={<CalendarDays size={18} />}
          onClose={() => setActiveDialog(null)}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(300px,1fr)]">
            <div className="grid gap-3">
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 14].map((days) => (
                  <button key={days}
                    className={cn("rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      sprintDays === days ? "border-sky-300 bg-sky-600 text-white" : "border-sky-100 bg-white text-slate-600 hover:bg-sky-50")}
                    type="button" onClick={() => setSprintDays(days)}>
                    {days} 天
                  </button>
                ))}
              </div>
              <button className={btnPrimary} type="button" onClick={() => { void handleGenerateSprint(); setActiveDialog(null); }} disabled={busy === "sprint-generate"}>
                <Sparkles size={15} /> 生成计划
              </button>
            </div>
            <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
              <p className="text-xs font-semibold text-slate-500">计划会优先覆盖</p>
              <TextList values={[
                selectedJobTarget ? `${selectedJobTarget.company?.name ?? "目标公司"} / ${selectedJobTarget.roleName}` : "当前选择的岗位目标",
                `${cards.length} 条题库记录`,
                `${sessions.length} 轮历史模拟`,
                "至少一次完整模拟与报告查看",
              ]} />
            </div>
          </div>
        </DialogShell>
      )}

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
