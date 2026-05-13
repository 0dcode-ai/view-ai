import type {
  AgentRunResponse,
  Application,
  ApplicationDashboardMetrics,
  ApplicationStage,
  JobTarget,
  ResumeProfile,
  ResumeJobMatchReport,
  ResumeVersion,
  SourceDocument,
} from "@/app/types";

export type ApplicationForm = {
  companyName: string;
  roleName: string;
  level: "junior" | "mid" | "senior" | "staff";
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

export type ApplicationFilters = {
  q: string;
  stage: string;
  archived: string;
  sort: string;
};

export type ApplicationDetailTab = "overview" | "jd" | "match" | "resume" | "prep" | "activity";

export type SourceForm = {
  title: string;
  sourceType: "resume" | "jd" | "article" | "experience" | "github" | "note";
  content: string;
};

export type SeniorityOption = {
  value: ApplicationForm["level"];
  label: string;
};

export type ApplicationsTabProps = {
  busy: string | null;
  nowTs: number | null;
  applications: Application[];
  applicationMetrics: ApplicationDashboardMetrics | null;
  applicationFilters: ApplicationFilters;
  applicationForm: ApplicationForm;
  applicationDetailTab: ApplicationDetailTab;
  applicationJdDraft: string;
  selectedApplication: Application | null;
  selectedMatchReport: ResumeJobMatchReport | null;
  primaryResumeVersion: ResumeVersion | null;
  resumeVersions: ResumeVersion[];
  sourceDocuments: SourceDocument[];
  sourceForm: SourceForm;
  agentRunResult: AgentRunResponse | null;
  resumes: ResumeProfile[];
  jobTargets: JobTarget[];
  seniorityOptions: SeniorityOption[];
  stageLabels: Record<ApplicationStage, string>;
  stageOrder: ApplicationStage[];
  onFiltersChange: (filters: ApplicationFilters) => void;
  onLoadApplications: (filters?: ApplicationFilters) => void;
  onSelectApplication: (id: number | null) => void;
  onApplicationFormChange: (form: ApplicationForm) => void;
  onCreateApplication: () => void;
  onUpdateApplication: (id: number, patch: Partial<Application>) => void;
  onDetailTabChange: (tab: ApplicationDetailTab) => void;
  onJdDraftChange: (value: string) => void;
  onSaveApplicationJd: () => void;
  onMatchApplication: (id?: number) => void;
  onCreateResumeVersion: (id?: number) => void;
  onAutoSelectResumeVersion: (id: number) => void;
  onGenerateResumeBullet: (versionId: number, keyword: string) => void;
  onSourceFormChange: (form: SourceForm) => void;
  onCreateSource: () => void;
  onActiveTabChange: (tab: "interview") => void;
};

export const emptyApplicationForm: ApplicationForm = {
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

export const emptySourceForm: SourceForm = {
  title: "",
  sourceType: "note",
  content: "",
};

export const applicationStageLabels: Record<ApplicationStage, string> = {
  saved: "已保存",
  preparing: "准备中",
  applied: "已投递",
  interviewing: "面试中",
  offer: "Offer",
  closed: "已结束",
};

export const applicationStageOrder: ApplicationStage[] = ["saved", "preparing", "applied", "interviewing", "offer", "closed"];
