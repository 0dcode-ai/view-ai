"use client";

import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Code2,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  ListChecks,
  MessageSquareText,
  Mic,
  Play,
  RefreshCcw,
  Save,
  Search,
  Send,
  Sparkles,
  Tags,
  Target,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  interviewModeLabels,
  roundTypeLabels,
  type InterviewMode,
  type RoundType,
} from "@/lib/interview-modes";
import {
  type CompanyOption,
  type CompanyIntel,
  type CompanyPrep,
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
  type ReviewCard,
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
import { CardList } from "@/app/components/knowledge/card-list";
import { ReviewList } from "@/app/components/review/review-list";
import { ExperienceList } from "@/app/components/review/experience-list";
import { SessionList } from "@/app/components/shared/session-list";
import { SprintList } from "@/app/components/shared/sprint-list";
import { LabList } from "@/app/components/lab/lab-list";
import { WeaknessList } from "@/app/components/trends/weakness-list";

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[112px] resize-y leading-relaxed";
const btnPrimary = "flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60";
const btnSecondary = "flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-60";
const btnGhost = "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft disabled:opacity-60";

function labIcon(type: LabType) {
  if (type === "peer_mock") return <Users size={16} />;
  if (type === "system_design") return <GitBranch size={16} />;
  return <Code2 size={16} />;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("targets");
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

  const [filters, setFilters] = useState({ q: "", company: "", topic: "", mastery: "", questionType: "" });
  const [knowledgeForm, setKnowledgeForm] = useState<KnowledgeForm>(emptyKnowledgeForm);
  const [knowledgeSuggestion, setKnowledgeSuggestion] = useState<KnowledgeSuggestion | null>(null);

  const [resumeTitle] = useState("我的简历");
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

  const [interviewMode, setInterviewMode] = useState<InterviewMode>("mixed");
  const [roundType, setRoundType] = useState<RoundType>("first_round");
  const [deliveryMode, setDeliveryMode] = useState<"text" | "voice">("text");
  const [targetCompanyName, setTargetCompanyName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [voiceHint, setVoiceHint] = useState("");
  const [answerDurationSec, setAnswerDurationSec] = useState(90);

  const [sprintDays, setSprintDays] = useState(7);
  const [interviewDate] = useState("");

  const [reviewFilters] = useState({ company: "", topic: "", roundType: "", status: "" });
  const [labType, setLabType] = useState<LabType>("coding");
  const [labRole, setLabRole] = useState("");
  const [activeLabId, setActiveLabId] = useState<number | null>(null);
  const [labContent, setLabContent] = useState("");

  const selectedResume = useMemo(() => {
    if (!selectedResumeId) return null;
    return resumes.find((r) => r.id === selectedResumeId) ?? null;
  }, [resumes, selectedResumeId]);

  const selectedJobTarget = useMemo(() => {
    if (!selectedJobTargetId) return null;
    return jobTargets.find((t) => t.id === selectedJobTargetId) ?? null;
  }, [jobTargets, selectedJobTargetId]);

  const openTurn = activeSession?.turns.find((turn) => !turn.answer) ?? null;
  const answeredTurns = activeSession?.turns.filter((turn) => turn.answer).length ?? 0;
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
    if (activeLab) setLabContent(activeLab.content ?? activeLab.starterCode ?? "");
  }, [activeLab]);

  async function refreshAll() {
    await Promise.allSettled([
      loadKnowledge(), loadResumes(), loadJobTargets(), loadReviews(),
      loadSprints(), loadSessions(), loadDaily(), loadLearningPath(),
      loadLabs(), loadExperiences(),
    ]);
  }

  async function loadKnowledge(nextFilters = filters) {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const payload = await requestJson<{ cards: KnowledgeCard[]; companies: CompanyOption[]; topics: TopicOption[] }>(
      `/api/knowledge${params.toString() ? `?${params.toString()}` : ""}`,
    );
    setCards(payload.cards);
    setCompanies(payload.companies);
    setTopics(payload.topics);
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

  async function loadExperiences(companyName = companies.find((c) => c.id === prepCompanyId)?.name) {
    const params = new URLSearchParams();
    if (companyName) params.set("company", companyName);
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
    setBusy("interview-start");
    try {
      const payload = await requestJson<{ session: InterviewSession }>("/api/interviews/start", {
        method: "POST",
        body: JSON.stringify({
          mode: interviewMode, roundType, deliveryMode,
          targetCompanyName, targetRole,
          resumeProfileId: selectedResume?.id,
          jobTargetId: selectedJobTarget?.id,
        }),
      });
      setActiveSession(payload.session);
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

  async function handleGenerateSprint() {
    setBusy("sprint-generate");
    try {
      await requestJson<{ sprintPlan: SprintPlan }>("/api/sprints/generate", {
        method: "POST",
        body: JSON.stringify({
          companyName: selectedJobTarget?.company?.name ?? targetCompanyName,
          roleName: selectedJobTarget?.roleName ?? targetRole,
          jobTargetId: selectedJobTarget?.id,
          resumeProfileId: selectedResume?.id,
          days: sprintDays,
          interviewDate: interviewDate || undefined,
        }),
      });
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

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Banner */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-white/80">Interview AI</p>
              <h1 className="mt-1 text-2xl font-bold">{pageLabels[activeTab]}</h1>
              <p className="mt-1 text-sm text-white/80">贴 JD、存八股、做模拟、看复盘。</p>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold">{jobTargets.length}</div>
                <div className="text-xs text-white/80">岗位目标</div>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold">{lowMasteryCount}</div>
                <div className="text-xs text-white/80">低掌握卡</div>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold">{todoReviewCount}</div>
                <div className="text-xs text-white/80">待复习</div>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold">{averageInterviewScore}</div>
                <div className="text-xs text-white/80">平均分</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Targets ─── */}
        {activeTab === "targets" && (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,440px)_1fr]">
              <Panel title="今日训练" icon={<ListChecks size={16} />}>
                {!dailyData ? (
                  <div className="py-8 text-center text-sm text-muted">暂无今日任务</div>
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
                            <p className="mt-0.5 text-xs text-muted">{card.topic?.name ?? "通用"} / {masteryLabels[card.mastery] ?? "未学"}</p>
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
                            <p className="mt-0.5 text-xs text-muted">{card.weakness}</p>
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
                  <div className="py-8 text-center text-sm text-muted">暂无路径</div>
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,440px)_1fr]">
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
                    <div className="py-8 text-center text-sm text-muted">暂无岗位目标</div>
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
          </div>
        )}

        {/* ─── Prep / 公司 ─── */}
        {activeTab === "prep" && (
          <div className="grid gap-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">公司情报</h3>
                <p className="mt-1 text-sm text-muted">录入真实面经，聚合高频题、轮次分布和公司定向训练。</p>
              </div>
              <div className="flex gap-2">
                <select className={inputCls + " w-auto"} value={prepCompanyId ?? ""} onChange={(e) => setPrepCompanyId(Number(e.target.value) || null)}>
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  <div className="py-8 text-center text-sm text-muted">粘贴面经后生成结构化预览</div>
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel title="公司高频题" icon={<BookOpen size={16} />}>
                {!companyIntel || companyIntel.highFrequencyQuestions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted">选择公司或录入面经后查看高频题</div>
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
                  <div className="py-8 text-center text-sm text-muted">暂无轮次统计</div>
                ) : (
                  <div className="grid gap-3">
                    {companyIntel.roundDistribution.map((row) => (
                      <div key={row.roundType} className="rounded-xl border border-border p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="text-sm font-semibold">{row.roundType}</h5>
                          <Pill variant="brand">{row.count}</Pill>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
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
              <ExperienceList experiences={experiences}
                onGenerateCards={handleExperienceGenerateCards}
                onStartInterview={handleExperienceStartInterview}
                onCreateTasks={handleExperienceCreateTasks} />
            </Panel>
          </div>
        )}

        {/* ─── Knowledge ─── */}
        {activeTab === "knowledge" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,440px)_1fr]">
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
              </div>
              <CardList cards={cards} onProgress={updateKnowledgeProgress} />
            </Panel>
          </div>
        )}

        {/* ─── Resume ─── */}
        {activeTab === "resume" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="贴简历" icon={<FileText size={16} />}>
              <div className="grid gap-3">
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
              <select className={inputCls} value={selectedResumeId ?? ""}
                onChange={(e) => setSelectedResumeId(e.target.value ? Number(e.target.value) : null)}>
                {resumes.length === 0 && <option value="">暂无简历</option>}
                {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
              {!selectedResume ? (
                <div className="py-8 text-center text-sm text-muted">暂无简历</div>
              ) : (
                <div className="mt-3.5 grid gap-3">
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

        {/* ─── Interview ─── */}
        {activeTab === "interview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(300px,400px)_1fr]">
            <Panel title="开始模拟" icon={<Target size={16} />}>
              <div className="grid gap-3">
                <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
                  {(Object.keys(interviewModeLabels) as InterviewMode[]).map((mode) => (
                    <button key={mode}
                      className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                        interviewMode === mode ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground")}
                      onClick={() => setInterviewMode(mode)} type="button">
                      {interviewModeLabels[mode]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2" role="group">
                  <button className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    deliveryMode === "text" ? "border-primary bg-primary-soft text-primary-hover" : "border-border bg-surface text-muted hover:text-foreground")}
                    type="button" onClick={() => setDeliveryMode("text")}>文本</button>
                  <button className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    deliveryMode === "voice" ? "border-primary bg-primary-soft text-primary-hover" : "border-border bg-surface text-muted hover:text-foreground")}
                    type="button" onClick={() => setDeliveryMode("voice")}>语音模拟</button>
                </div>
                <Field label="岗位目标">
                  <select className={inputCls} value={selectedJobTarget?.id ?? ""}
                    onChange={(e) => setSelectedJobTargetId(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">不使用岗位目标</option>
                    {jobTargets.map((t) => <option key={t.id} value={t.id}>{t.company?.name ?? "未命名公司"} / {t.roleName}</option>)}
                  </select>
                </Field>
                <Field label="轮次">
                  <select className={inputCls} value={roundType}
                    onChange={(e) => setRoundType(e.target.value as RoundType)}>
                    {(Object.keys(roundTypeLabels) as RoundType[]).map((type) => <option key={type} value={type}>{roundTypeLabels[type]}</option>)}
                  </select>
                </Field>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  <Target size={14} />
                  <span>{selectedJobTarget ? `${selectedJobTarget.company?.name ?? "未命名公司"} / ${selectedJobTarget.roleName}` : "未选择岗位目标"}</span>
                </div>
                <button className={btnPrimary} type="button" onClick={() => void handleStartInterview()} disabled={busy === "interview-start"}>
                  <Play size={15} /> 开始
                </button>
                {!selectedJobTarget && (
                  <button className={btnGhost} type="button" onClick={() => setActiveTab("targets")}>先建目标</button>
                )}
              </div>
            </Panel>

            <div className="flex min-h-[520px] flex-col rounded-xl border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <h4 className="text-base font-semibold">
                  {activeSession ? `${interviewModeLabels[activeSession.mode]} / ${roundTypeLabels[activeSession.roundType]}` : "面试对话"}
                </h4>
                {activeSession && <Pill variant="brand">{activeSession.status}</Pill>}
              </div>
              <div className="flex-1 space-y-3 overflow-auto p-5">
                {!activeSession ? (
                  <div className="py-8 text-center text-sm text-muted">暂无面试</div>
                ) : (
                  activeSession.turns.map((turn) => (
                    <div key={turn.id}>
                      <div className="mr-auto max-w-[82%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                        {turn.question}
                      </div>
                      {turn.answer && (
                        <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-wrap">
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
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            <Pill>结构 {scoreOrDash(turn.score.structure)}</Pill>
                            <Pill>深度 {scoreOrDash(turn.score.depth)}</Pill>
                            <Pill>JD {scoreOrDash(turn.score.jobRelevance)}</Pill>
                            <Pill>表达 {scoreOrDash(turn.score.expressionClarity)}</Pill>
                          </div>
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
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Pill>简历 {scoreOrDash(activeSession.score.resume)}</Pill>
                      <Pill>八股 {scoreOrDash(activeSession.score.knowledge)}</Pill>
                      <Pill>JD {scoreOrDash(activeSession.score.jdMatch)}</Pill>
                      <Pill>表达 {scoreOrDash(activeSession.score.expression)}</Pill>
                    </div>
                  </article>
                )}
              </div>
              <div className="grid gap-2.5 border-t border-border p-4">
                {deliveryMode === "voice" && activeSession?.status !== "finished" && (
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="语音模拟文本">
                        <input className={inputCls} value={voiceHint} onChange={(e) => setVoiceHint(e.target.value)} />
                      </Field>
                      <Field label="时长秒">
                        <input className={inputCls} type="number" min={15} value={answerDurationSec} onChange={(e) => setAnswerDurationSec(Number(e.target.value))} />
                      </Field>
                    </div>
                    <button className={btnSecondary} type="button" onClick={() => void handleTranscribe()} disabled={busy === "transcribe"}>
                      <Mic size={15} /> 模拟转写
                    </button>
                  </div>
                )}
                {openTurn && activeSession?.status !== "finished" ? (
                  <>
                    <textarea className={textareaCls} placeholder="输入回答" value={answerText} onChange={(e) => setAnswerText(e.target.value)} />
                    <div className="flex gap-2">
                      <button className={btnPrimary} type="button" onClick={() => void handleSubmitAnswer()} disabled={busy === "interview-answer"}>
                        <Send size={15} /> 提交
                      </button>
                      <button className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        type="button" onClick={() => void handleFinishInterview()} disabled={answeredTurns === 0 || busy === "interview-finish"}>
                        <CheckCircle2 size={15} /> 结束
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

        {/* ─── Sprint ─── */}
        {activeTab === "sprint" && (
          <div className="grid gap-6">
            <Panel title="生成冲刺计划" icon={<CalendarDays size={16} />}>
              <div className="flex flex-wrap items-center gap-2">
                <select className={inputCls + " w-auto"} value={selectedJobTarget?.id ?? ""}
                  onChange={(e) => setSelectedJobTargetId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">选择岗位目标</option>
                  {jobTargets.map((t) => <option key={t.id} value={t.id}>{t.company?.name ?? "未命名公司"} / {t.roleName}</option>)}
                </select>
                <div className="flex gap-2" role="group">
                  {[3, 7, 14].map((days) => (
                    <button key={days}
                      className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        sprintDays === days ? "border-primary bg-primary-soft text-primary-hover" : "border-border bg-surface text-muted hover:text-foreground")}
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
            <SprintList plans={sprintPlans} onTaskStatus={updateTaskStatus} />
          </div>
        )}

        {/* ─── Review ─── */}
        {activeTab === "review" && (
          <div className="grid gap-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">复盘</h3>
                <p className="mt-1 text-sm text-muted">低分题、薄弱点和待补八股会集中在这里。</p>
              </div>
              <button className={btnSecondary} type="button" onClick={() => void loadReviews()}>
                <RefreshCcw size={15} /> 刷新
              </button>
            </div>
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
            <ReviewList cards={reviewCards} />
          </div>
        )}

        {/* ─── Lab ─── */}
        {activeTab === "lab" && (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,440px)_1fr]">
              <Panel title="训练实验室" icon={<Code2 size={16} />}>
                <div className="grid gap-3">
                  <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
                    {(["coding", "system_design", "peer_mock"] as LabType[]).map((type) => (
                      <button key={type}
                        className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                          labType === type ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground")}
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
                  <div className="py-8 text-center text-sm text-muted">先新建一个练习</div>
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
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreCard label="平均模拟分" value={averageInterviewScore} />
              <ScoreCard label="复习完成率" value={sprintDoneRate} />
              <ScoreCard label="掌握度达标" value={cards.length ? Math.round((cards.filter((c) => c.mastery >= 3).length / cards.length) * 100) : 0} />
              <ScoreCard label="错题清理率" value={reviewCards.length ? Math.round(((reviewCards.length - todoReviewCount) / reviewCards.length) * 100) : 0} />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel title="最近面试趋势" icon={<BarChart3 size={16} />}>
                <SessionList sessions={sessions.slice(0, 12)} />
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
