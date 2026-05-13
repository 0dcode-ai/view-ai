import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  Gauge,
  ListChecks,
  MessageSquareText,
  Plus,
  Save,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import type { Application, ApplicationStage, KeywordMatchItem } from "@/app/types";
import { DataGroup } from "@/app/components/shared/data-group";
import { Field } from "@/app/components/shared/field";
import { MetricCard } from "@/app/components/shared/metric-card";
import { Panel } from "@/app/components/shared/panel";
import { Pill } from "@/app/components/shared/pill";
import { ScoreCard } from "@/app/components/shared/score-card";
import { TextList } from "@/app/components/shared/text-list";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  compactSelectCls,
  inputCls,
  softGradientCls,
  textareaCls,
} from "@/app/components/shared/styles";
import type { ApplicationsTabProps, ApplicationDetailTab } from "@/app/features/applications/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/app/helpers";

export function ApplicationsTab(props: ApplicationsTabProps) {
  const {
    busy,
    nowTs,
    applications,
    applicationMetrics,
    applicationFilters,
    applicationForm,
    applicationDetailTab,
    applicationJdDraft,
    selectedApplication,
    selectedMatchReport,
    primaryResumeVersion,
    resumeVersions,
    sourceDocuments,
    sourceForm,
    agentRunResult,
    resumes,
    jobTargets,
    seniorityOptions,
    stageLabels,
    stageOrder,
    onFiltersChange,
    onLoadApplications,
    onSelectApplication,
    onApplicationFormChange,
    onCreateApplication,
    onUpdateApplication,
    onDetailTabChange,
    onJdDraftChange,
    onSaveApplicationJd,
    onMatchApplication,
    onCreateResumeVersion,
    onAutoSelectResumeVersion,
    onGenerateResumeBullet,
    onSourceFormChange,
    onCreateSource,
    onActiveTabChange,
  } = props;

  const todayFollowUps = nowTs === null
    ? 0
    : applications.filter((item) => item.followUpAt && isSameLocalDay(item.followUpAt, nowTs)).length;

  return (
    <div className="grid gap-4">
      <Panel title="求职机会管道" icon={<BriefcaseBusiness size={16} />}>
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="活跃机会" value={applicationMetrics?.active ?? applications.filter((item) => !item.archived).length} icon={<BriefcaseBusiness size={16} />} />
            <MetricCard label="平均匹配" value={`${applicationMetrics?.averageMatchScore ?? 0}%`} icon={<Gauge size={16} />} />
            <MetricCard label="已归档" value={applicationMetrics?.archived ?? 0} icon={<ClipboardList size={16} />} />
            <MetricCard label="今日下一步" value={todayFollowUps} icon={<CalendarDays size={16} />} />
          </div>

          <ApplicationFiltersBar
            filters={applicationFilters}
            onChange={onFiltersChange}
            onLoad={onLoadApplications}
            onNew={() => {
              onDetailTabChange("overview");
              onSelectApplication(null);
            }}
          />

          <ApplicationStageFilter
            applications={applications}
            metrics={applicationMetrics}
            filters={applicationFilters}
            stageLabels={stageLabels}
            stageOrder={stageOrder}
            onChange={(next) => {
              onFiltersChange(next);
              onLoadApplications(next);
            }}
          />

          <ApplicationPipelineTable
            applications={applications}
            selectedApplication={selectedApplication}
            stageLabels={stageLabels}
            stageOrder={stageOrder}
            onSelect={onSelectApplication}
            onUpdate={onUpdateApplication}
          />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(340px,440px)_1fr]">
        <ApplicationCreatePanel
          busy={busy}
          form={applicationForm}
          resumes={resumes}
          jobTargets={jobTargets}
          seniorityOptions={seniorityOptions}
          stageLabels={stageLabels}
          stageOrder={stageOrder}
          onChange={onApplicationFormChange}
          onCreate={onCreateApplication}
        />

        <ApplicationDetailPanel
          busy={busy}
          selectedApplication={selectedApplication}
          detailTab={applicationDetailTab}
          jdDraft={applicationJdDraft}
          selectedMatchReport={selectedMatchReport}
          primaryResumeVersion={primaryResumeVersion}
          resumeVersions={resumeVersions}
          sourceDocuments={sourceDocuments}
          sourceForm={sourceForm}
          agentRunResult={agentRunResult}
          stageLabels={stageLabels}
          stageOrder={stageOrder}
          onDetailTabChange={onDetailTabChange}
          onUpdate={onUpdateApplication}
          onJdDraftChange={onJdDraftChange}
          onSaveJd={onSaveApplicationJd}
          onMatch={onMatchApplication}
          onCreateResumeVersion={onCreateResumeVersion}
          onAutoSelectResumeVersion={onAutoSelectResumeVersion}
          onGenerateResumeBullet={onGenerateResumeBullet}
          onSourceFormChange={onSourceFormChange}
          onCreateSource={onCreateSource}
          onGoInterview={() => onActiveTabChange("interview")}
        />
      </div>
    </div>
  );
}

function isSameLocalDay(value: string, nowTs: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date(nowTs);
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function ApplicationFiltersBar({
  filters,
  onChange,
  onLoad,
  onNew,
}: {
  filters: ApplicationsTabProps["applicationFilters"];
  onChange: ApplicationsTabProps["onFiltersChange"];
  onLoad: ApplicationsTabProps["onLoadApplications"];
  onNew: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className="min-w-[260px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        placeholder="搜索公司、岗位、地点、备注"
        value={filters.q}
        onChange={(event) => onChange({ ...filters, q: event.target.value })}
      />
      <select
        className={compactSelectCls}
        value={filters.sort}
        onChange={(event) => {
          const next = { ...filters, sort: event.target.value };
          onChange(next);
          onLoad(next);
        }}
      >
        <option value="priority">按优先级</option>
        <option value="followUp">按跟进日</option>
        <option value="updated">按更新时间</option>
      </select>
      <select
        className={compactSelectCls}
        value={filters.archived}
        onChange={(event) => {
          const next = { ...filters, archived: event.target.value };
          onChange(next);
          onLoad(next);
        }}
      >
        <option value="false">只看活跃</option>
        <option value="true">只看归档</option>
        <option value="">全部机会</option>
      </select>
      <button className={btnSecondary} type="button" onClick={() => onLoad(filters)}>
        <Search size={15} /> 搜索
      </button>
      <button className={btnPrimary} type="button" onClick={onNew}>
        <Plus size={15} /> 新增岗位
      </button>
    </div>
  );
}

function ApplicationStageFilter({
  applications,
  metrics,
  filters,
  stageLabels,
  stageOrder,
  onChange,
}: {
  applications: Application[];
  metrics: ApplicationsTabProps["applicationMetrics"];
  filters: ApplicationsTabProps["applicationFilters"];
  stageLabels: ApplicationsTabProps["stageLabels"];
  stageOrder: ApplicationStage[];
  onChange: (filters: ApplicationsTabProps["applicationFilters"]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={cn("rounded-full border px-3 py-1.5 text-sm", !filters.stage ? "border-zinc-900 bg-zinc-900 text-white" : "border-border bg-surface hover:bg-slate-50")}
        onClick={() => onChange({ ...filters, stage: "" })}
      >
        全部 {metrics?.active ?? applications.length}
      </button>
      {stageOrder.map((stage) => (
        <button
          key={stage}
          type="button"
          className={cn("rounded-full border px-3 py-1.5 text-sm", filters.stage === stage ? "border-zinc-900 bg-zinc-900 text-white" : "border-border bg-surface hover:bg-slate-50")}
          onClick={() => onChange({ ...filters, stage })}
        >
          {stageLabels[stage]} {metrics?.byStage?.[stage] ?? applications.filter((item) => item.stage === stage).length}
        </button>
      ))}
    </div>
  );
}

function ApplicationPipelineTable({
  applications,
  selectedApplication,
  stageLabels,
  stageOrder,
  onSelect,
  onUpdate,
}: {
  applications: Application[];
  selectedApplication: Application | null;
  stageLabels: ApplicationsTabProps["stageLabels"];
  stageOrder: ApplicationStage[];
  onSelect: ApplicationsTabProps["onSelectApplication"];
  onUpdate: ApplicationsTabProps["onUpdateApplication"];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="grid grid-cols-[1.35fr_130px_100px_120px_110px_110px_1.2fr] gap-3 border-b border-border bg-slate-50 px-4 py-2 text-xs font-semibold text-muted-foreground max-xl:hidden">
        <span>公司 / 岗位</span><span>状态</span><span>匹配</span><span>薪资</span><span>地点</span><span>跟进</span><span>下一步</span>
      </div>
      <div className="max-h-[420px] overflow-auto">
        {applications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">暂无求职机会，先保存一个岗位，管道就转起来了。</div>
        ) : (
          applications.map((application) => (
            <ApplicationPipelineRow
              key={application.id}
              application={application}
              selected={selectedApplication?.id === application.id}
              stageLabels={stageLabels}
              stageOrder={stageOrder}
              onSelect={() => onSelect(application.id)}
              onUpdate={(patch) => onUpdate(application.id, patch)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ApplicationPipelineRow({
  application,
  selected,
  stageLabels,
  stageOrder,
  onSelect,
  onUpdate,
}: {
  application: Application;
  selected: boolean;
  stageLabels: ApplicationsTabProps["stageLabels"];
  stageOrder: ApplicationStage[];
  onSelect: () => void;
  onUpdate: (patch: Partial<Application>) => void;
}) {
  const score = application.matchReport?.matchScore ?? 0;
  const salary = application.salaryMinK || application.salaryMaxK
    ? `${application.salaryMinK ?? "-"}-${application.salaryMaxK ?? "-"}K`
    : application.salaryK ? `${application.salaryK}K` : "-";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full gap-3 border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-b-0 xl:grid-cols-[1.35fr_130px_100px_120px_110px_110px_1.2fr]",
        selected ? "bg-zinc-50" : "bg-surface hover:bg-slate-50",
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
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onUpdate({ stage: event.target.value as ApplicationStage })}
      >
        {stageOrder.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
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
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onUpdate({ followUpAt: event.target.value || null })}
      />
      <span className="truncate text-xs text-muted-foreground">{application.nextAction || application.progress.nextActions[0] || "生成匹配报告"}</span>
    </button>
  );
}

function ApplicationCreatePanel({
  busy,
  form,
  resumes,
  jobTargets,
  seniorityOptions,
  stageLabels,
  stageOrder,
  onChange,
  onCreate,
}: {
  busy: string | null;
  form: ApplicationsTabProps["applicationForm"];
  resumes: ApplicationsTabProps["resumes"];
  jobTargets: ApplicationsTabProps["jobTargets"];
  seniorityOptions: ApplicationsTabProps["seniorityOptions"];
  stageLabels: ApplicationsTabProps["stageLabels"];
  stageOrder: ApplicationsTabProps["stageOrder"];
  onChange: ApplicationsTabProps["onApplicationFormChange"];
  onCreate: ApplicationsTabProps["onCreateApplication"];
}) {
  return (
    <Panel title="新增 / 保存岗位" icon={<Plus size={16} />}>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="公司"><input className={inputCls} placeholder="例如 字节跳动" value={form.companyName} onChange={(event) => onChange({ ...form, companyName: event.target.value })} /></Field>
          <Field label="岗位"><input className={inputCls} placeholder="例如 AI 后端工程师" value={form.roleName} onChange={(event) => onChange({ ...form, roleName: event.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="级别"><select className={inputCls} value={form.level} onChange={(event) => onChange({ ...form, level: event.target.value as ApplicationsTabProps["applicationForm"]["level"] })}>{seniorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
          <Field label="阶段"><select className={inputCls} value={form.stage} onChange={(event) => onChange({ ...form, stage: event.target.value as ApplicationStage })}>{stageOrder.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="薪资下限 K"><input className={inputCls} type="number" min={0} max={300} value={form.salaryMinK} onChange={(event) => onChange({ ...form, salaryMinK: Number(event.target.value), salaryK: Number(event.target.value) })} /></Field>
          <Field label="薪资上限 K"><input className={inputCls} type="number" min={0} max={300} value={form.salaryMaxK} onChange={(event) => onChange({ ...form, salaryMaxK: Number(event.target.value) })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="地点"><input className={inputCls} placeholder="北京 / 远程" value={form.location} onChange={(event) => onChange({ ...form, location: event.target.value })} /></Field>
          <Field label="来源"><input className={inputCls} placeholder="Boss / 内推 / 官网" value={form.source} onChange={(event) => onChange({ ...form, source: event.target.value })} /></Field>
        </div>
        <Field label="岗位链接"><input className={inputCls} placeholder="https://..." value={form.jobUrl} onChange={(event) => onChange({ ...form, jobUrl: event.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="关联简历"><select className={inputCls} value={form.resumeProfileId} onChange={(event) => onChange({ ...form, resumeProfileId: event.target.value })}><option value="">暂不关联</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}</select></Field>
          <Field label="关联 JD"><select className={inputCls} value={form.jobTargetId} onChange={(event) => onChange({ ...form, jobTargetId: event.target.value })}><option value="">暂不关联</option>{jobTargets.map((target) => <option key={target.id} value={target.id}>{target.company?.name ? `${target.company.name} · ` : ""}{target.roleName}</option>)}</select></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="投递日"><input className={inputCls} type="date" value={form.appliedAt} onChange={(event) => onChange({ ...form, appliedAt: event.target.value })} /></Field>
          <Field label="跟进日"><input className={inputCls} type="date" value={form.followUpAt} onChange={(event) => onChange({ ...form, followUpAt: event.target.value })} /></Field>
          <Field label="截止日"><input className={inputCls} type="date" value={form.deadlineAt} onChange={(event) => onChange({ ...form, deadlineAt: event.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="联系人"><input className={inputCls} value={form.contactName} onChange={(event) => onChange({ ...form, contactName: event.target.value })} /></Field>
          <Field label="邮箱"><input className={inputCls} value={form.contactEmail} onChange={(event) => onChange({ ...form, contactEmail: event.target.value })} /></Field>
        </div>
        <Field label="JD 原文快照"><textarea className={textareaCls + " min-h-[120px]"} placeholder="粘贴 JD，后续匹配和简历定制都从这里开始。" value={form.jdSnapshot} onChange={(event) => onChange({ ...form, jdSnapshot: event.target.value })} /></Field>
        <Field label="备注"><textarea className={textareaCls + " min-h-[76px]"} placeholder="投递渠道、面试轮次、准备重点。" value={form.note} onChange={(event) => onChange({ ...form, note: event.target.value })} /></Field>
        <button className={btnPrimary} type="button" onClick={onCreate} disabled={busy === "application-create"}><Plus size={15} /> 创建机会</button>
      </div>
    </Panel>
  );
}

function ApplicationDetailPanel({
  busy,
  selectedApplication,
  detailTab,
  jdDraft,
  selectedMatchReport,
  primaryResumeVersion,
  resumeVersions,
  sourceDocuments,
  sourceForm,
  agentRunResult,
  stageLabels,
  stageOrder,
  onDetailTabChange,
  onUpdate,
  onJdDraftChange,
  onSaveJd,
  onMatch,
  onCreateResumeVersion,
  onAutoSelectResumeVersion,
  onGenerateResumeBullet,
  onSourceFormChange,
  onCreateSource,
  onGoInterview,
}: {
  busy: string | null;
  selectedApplication: ApplicationsTabProps["selectedApplication"];
  detailTab: ApplicationDetailTab;
  jdDraft: string;
  selectedMatchReport: ApplicationsTabProps["selectedMatchReport"];
  primaryResumeVersion: ApplicationsTabProps["primaryResumeVersion"];
  resumeVersions: ApplicationsTabProps["resumeVersions"];
  sourceDocuments: ApplicationsTabProps["sourceDocuments"];
  sourceForm: ApplicationsTabProps["sourceForm"];
  agentRunResult: ApplicationsTabProps["agentRunResult"];
  stageLabels: ApplicationsTabProps["stageLabels"];
  stageOrder: ApplicationStage[];
  onDetailTabChange: ApplicationsTabProps["onDetailTabChange"];
  onUpdate: ApplicationsTabProps["onUpdateApplication"];
  onJdDraftChange: ApplicationsTabProps["onJdDraftChange"];
  onSaveJd: ApplicationsTabProps["onSaveApplicationJd"];
  onMatch: ApplicationsTabProps["onMatchApplication"];
  onCreateResumeVersion: ApplicationsTabProps["onCreateResumeVersion"];
  onAutoSelectResumeVersion: ApplicationsTabProps["onAutoSelectResumeVersion"];
  onGenerateResumeBullet: ApplicationsTabProps["onGenerateResumeBullet"];
  onSourceFormChange: ApplicationsTabProps["onSourceFormChange"];
  onCreateSource: ApplicationsTabProps["onCreateSource"];
  onGoInterview: () => void;
}) {
  return (
    <Panel title="岗位详情工作台" icon={<Target size={16} />}>
      {!selectedApplication ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">选择一个机会查看 Teal 式准备闭环。</div>
      ) : (
        <div className="grid gap-4">
          <ApplicationDetailHero
            application={selectedApplication}
            busy={busy}
            stageLabels={stageLabels}
            onMatch={onMatch}
            onCreateResumeVersion={onCreateResumeVersion}
            onGoInterview={onGoInterview}
          />

          <div className="flex flex-wrap gap-2">
            {([
              ["overview", "概览"],
              ["jd", "JD"],
              ["match", "匹配"],
              ["resume", "简历版本"],
              ["prep", "面试准备"],
              ["activity", "活动"],
            ] as Array<[ApplicationDetailTab, string]>).map(([tab, label]) => (
              <button key={tab} type="button" className={cn("rounded-full border px-3 py-1.5 text-sm", detailTab === tab ? "border-zinc-900 bg-zinc-900 text-white" : "border-border bg-surface hover:bg-slate-50")} onClick={() => onDetailTabChange(tab)}>{label}</button>
            ))}
          </div>

          {detailTab === "overview" && (
            <ApplicationOverviewTab
              application={selectedApplication}
              stageLabels={stageLabels}
              stageOrder={stageOrder}
              onUpdate={(patch) => onUpdate(selectedApplication.id, patch)}
            />
          )}

          {detailTab === "jd" && (
            <ApplicationJdTab
              application={selectedApplication}
              jdDraft={jdDraft}
              onJdDraftChange={onJdDraftChange}
              onSaveJd={onSaveJd}
              onMatch={() => onMatch(selectedApplication.id)}
            />
          )}

          {detailTab === "match" && (
            <ApplicationMatchTab
              selectedMatchReport={selectedMatchReport}
              primaryResumeVersion={primaryResumeVersion}
              onGenerateResumeBullet={onGenerateResumeBullet}
            />
          )}

          {detailTab === "resume" && (
            <ApplicationResumeVersionsTab
              application={selectedApplication}
              resumeVersions={resumeVersions}
              busy={busy}
              onCreateResumeVersion={onCreateResumeVersion}
              onAutoSelectResumeVersion={onAutoSelectResumeVersion}
            />
          )}

          {detailTab === "prep" && (
            <ApplicationPrepTab
              sourceDocuments={sourceDocuments}
              sourceForm={sourceForm}
              agentRunResult={agentRunResult}
              busy={busy}
              onSourceFormChange={onSourceFormChange}
              onCreateSource={onCreateSource}
            />
          )}

          {detailTab === "activity" && <ApplicationActivityTab application={selectedApplication} />}
        </div>
      )}
    </Panel>
  );
}

function ApplicationDetailHero({
  application,
  busy,
  stageLabels,
  onMatch,
  onCreateResumeVersion,
  onGoInterview,
}: {
  application: Application;
  busy: string | null;
  stageLabels: ApplicationsTabProps["stageLabels"];
  onMatch: ApplicationsTabProps["onMatchApplication"];
  onCreateResumeVersion: ApplicationsTabProps["onCreateResumeVersion"];
  onGoInterview: () => void;
}) {
  return (
    <div className={cn("rounded-2xl border border-border p-4", softGradientCls)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill variant="brand">{stageLabels[application.stage] ?? application.stage}</Pill>
            <Pill variant="accent">优先级 {application.priority}</Pill>
            {application.jobUrl && <a className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:underline" href={application.jobUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> 岗位链接</a>}
          </div>
          <h3 className="mt-3 text-xl font-semibold">{application.company?.name ?? "未填写公司"} · {application.roleName}</h3>
          <p className="mt-1 text-sm text-slate-600">{application.location || "未填写地点"} · {application.source || "手动录入"} · {formatDate(application.updatedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={btnSecondary} type="button" onClick={() => onMatch(application.id)} disabled={busy === `application-match-${application.id}`}><Sparkles size={15} /> 刷新匹配</button>
          <button className={btnSecondary} type="button" onClick={() => onCreateResumeVersion(application.id)} disabled={busy === `resume-version-create-${application.id}`}><Copy size={15} /> 创建简历版本</button>
          <button className={btnPrimary} type="button" onClick={onGoInterview}><MessageSquareText size={15} /> 去模拟</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <ScoreCard label="准备度" value={application.progress.overall} />
        <ScoreCard label="匹配分" value={application.matchReport?.matchScore ?? 0} />
        <ScoreCard label="简历" value={application.progress.resumeReady} />
        <ScoreCard label="JD" value={application.progress.jdReady} />
        <ScoreCard label="模拟" value={application.progress.mockReady} />
      </div>
    </div>
  );
}

function ApplicationOverviewTab({
  application,
  stageLabels,
  stageOrder,
  onUpdate,
}: {
  application: Application;
  stageLabels: ApplicationsTabProps["stageLabels"];
  stageOrder: ApplicationStage[];
  onUpdate: (patch: Partial<Application>) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-border bg-surface p-4">
        <h4 className="text-sm font-semibold">下一步动作</h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{application.nextAction || application.progress.nextActions[0] || "先补齐 JD，再生成一次匹配报告。"}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {application.progress.nextActions.map((action) => <div key={action} className="rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-slate-600">{action}</div>)}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <h4 className="text-sm font-semibold">Inline 更新</h4>
        <div className="mt-3 grid gap-3">
          <Field label="阶段"><select className={inputCls} value={application.stage} onChange={(event) => onUpdate({ stage: event.target.value as ApplicationStage })}>{stageOrder.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select></Field>
          <Field label="优先级"><input className={inputCls} type="number" min={0} max={100} value={application.priority} onChange={(event) => onUpdate({ priority: Number(event.target.value) })} /></Field>
          <Field label="备注"><textarea className={textareaCls + " min-h-[80px]"} defaultValue={application.note ?? ""} onBlur={(event) => onUpdate({ note: event.target.value })} /></Field>
          <button className={btnGhost} type="button" onClick={() => onUpdate({ archived: !application.archived })}>{application.archived ? "恢复活跃" : "归档机会"}</button>
        </div>
      </div>
    </div>
  );
}

function ApplicationJdTab({
  application,
  jdDraft,
  onJdDraftChange,
  onSaveJd,
  onMatch,
}: {
  application: Application;
  jdDraft: string;
  onJdDraftChange: ApplicationsTabProps["onJdDraftChange"];
  onSaveJd: ApplicationsTabProps["onSaveApplicationJd"];
  onMatch: () => void;
}) {
  return (
    <div className="grid gap-3">
      <textarea className={textareaCls + " min-h-[360px]"} placeholder="粘贴或编辑 JD 原文快照。" value={jdDraft} onChange={(event) => onJdDraftChange(event.target.value)} />
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} type="button" onClick={onSaveJd}><Save size={15} /> 保存 JD</button>
        <button className={btnSecondary} type="button" onClick={onMatch}><Sparkles size={15} /> 保存后生成匹配</button>
        <button className={btnGhost} type="button" onClick={() => onJdDraftChange(application.jobTarget?.rawJd ?? "")}>使用关联 JD</button>
      </div>
    </div>
  );
}

function ApplicationMatchTab({
  selectedMatchReport,
  primaryResumeVersion,
  onGenerateResumeBullet,
}: Pick<ApplicationsTabProps, "selectedMatchReport" | "primaryResumeVersion" | "onGenerateResumeBullet">) {
  return (
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
                {primaryResumeVersion && <button className={btnGhost} type="button" onClick={() => onGenerateResumeBullet(primaryResumeVersion.id, item.keyword)}>生成 bullet</button>}
              </div>
            </div>
          ))}
          {selectedMatchReport?.summary && <p className="rounded-lg border border-border bg-stone-50 p-3 text-sm leading-relaxed text-slate-600">{selectedMatchReport.summary}</p>}
        </div>
      </div>
    </div>
  );
}

function KeywordRow({ item }: { item: KeywordMatchItem }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm">{item.keyword}</strong>
        <Pill variant={item.found ? "brand" : item.required ? "warn" : "default"}>{item.category}</Pill>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.suggestion}</p>
      {item.evidence[0] && <p className="mt-1 line-clamp-1 text-xs text-slate-500">证据：{item.evidence[0].quote}</p>}
    </div>
  );
}

function ApplicationResumeVersionsTab({
  application,
  resumeVersions,
  busy,
  onCreateResumeVersion,
  onAutoSelectResumeVersion,
}: Pick<ApplicationsTabProps, "resumeVersions" | "busy" | "onCreateResumeVersion" | "onAutoSelectResumeVersion"> & {
  application: Application;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">应用内版本不会覆盖原始简历；AI 生成内容先进入候选区。</p>
        <button className={btnPrimary} type="button" onClick={() => onCreateResumeVersion(application.id)}><Plus size={15} /> 创建定制版本</button>
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
              <button className={btnSecondary} type="button" onClick={() => onAutoSelectResumeVersion(version.id)} disabled={busy === `resume-version-auto-${version.id}`}><ListChecks size={15} /> Auto-Select</button>
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
  );
}

function ApplicationPrepTab({
  sourceDocuments,
  sourceForm,
  agentRunResult,
  busy,
  onSourceFormChange,
  onCreateSource,
}: Pick<ApplicationsTabProps, "sourceDocuments" | "sourceForm" | "agentRunResult" | "busy" | "onSourceFormChange" | "onCreateSource">) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="来源可信材料" icon={<FileText size={16} />}>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="来源类型"><select className={inputCls} value={sourceForm.sourceType} onChange={(event) => onSourceFormChange({ ...sourceForm, sourceType: event.target.value as ApplicationsTabProps["sourceForm"]["sourceType"] })}><option value="note">备注</option><option value="resume">简历</option><option value="jd">JD</option><option value="article">技术文章</option><option value="experience">面经</option><option value="github">GitHub</option></select></Field>
            <Field label="标题"><input className={inputCls} value={sourceForm.title} placeholder="例如 JD 原文 / README 摘要" onChange={(event) => onSourceFormChange({ ...sourceForm, title: event.target.value })} /></Field>
          </div>
          <textarea className={textareaCls + " min-h-[140px]"} placeholder="粘贴可引用的来源材料，Agent 输出会带 evidence。" value={sourceForm.content} onChange={(event) => onSourceFormChange({ ...sourceForm, content: event.target.value })} />
          <button className={btnSecondary} type="button" onClick={onCreateSource} disabled={busy === "source-create"}><Save size={15} /> 保存来源</button>
          <div className="grid gap-2">{sourceDocuments.length === 0 ? <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">还没有来源材料。</div> : sourceDocuments.map((source) => <article key={source.id} className="rounded-xl border border-border bg-surface p-3"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{source.title}</strong><Pill>{source.sourceType}</Pill></div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{source.content}</p></article>)}</div>
        </div>
      </Panel>
      <Panel title="Agent 运行结果" icon={<Sparkles size={16} />}>
        {!agentRunResult ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">点击 Agent 后展示 output / execution / evidence。</div> : <AgentRunResultView agentRunResult={agentRunResult} />}
      </Panel>
    </div>
  );
}

function AgentRunResultView({ agentRunResult }: { agentRunResult: NonNullable<ApplicationsTabProps["agentRunResult"]> }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">{String(agentRunResult.output.title ?? "Agent 输出")}</h4>
            {renderAgentSourceMix(agentRunResult.output.sourceMix)}
          </div>
          <Pill variant={agentRunResult.execution.usedFallback ? "warn" : "brand"}>{agentRunResult.execution.usedFallback ? "fallback" : "success"}</Pill>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{String(agentRunResult.output.summary ?? "")}</p>
      </div>
      {Array.isArray(agentRunResult.output.highlights) && agentRunResult.output.highlights.length > 0 && <DataGroup title="关键亮点"><TextList values={(agentRunResult.output.highlights as string[]).filter(Boolean)} /></DataGroup>}
      {Array.isArray(agentRunResult.output.risks) && agentRunResult.output.risks.length > 0 && <DataGroup title="风险提醒"><TextList values={(agentRunResult.output.risks as string[]).filter(Boolean)} /></DataGroup>}
      {Array.isArray(agentRunResult.output.nextActions) && agentRunResult.output.nextActions.length > 0 && <DataGroup title="下一步动作"><TextList values={(agentRunResult.output.nextActions as string[]).filter(Boolean)} /></DataGroup>}
      {Array.isArray(agentRunResult.output.generatedArtifacts) && agentRunResult.output.generatedArtifacts.length > 0 && <DataGroup title="产物清单"><TextList values={(agentRunResult.output.generatedArtifacts as string[]).filter(Boolean)} /></DataGroup>}
      {Array.isArray(agentRunResult.output.githubSignals) && agentRunResult.output.githubSignals.length > 0 && <DataGroup title="GitHub 信号"><TextList values={(agentRunResult.output.githubSignals as string[]).filter(Boolean)} /></DataGroup>}
      <DataGroup title="执行步骤"><TextList values={agentRunResult.execution.steps} /></DataGroup>
      <DataGroup title="引用证据">
        {agentRunResult.evidence.length === 0 ? <p className="text-sm text-muted-foreground">暂无 evidence，当前内容应视为 AI 推断。</p> : <div className="grid gap-2">{agentRunResult.evidence.map((item, index) => <article key={`${item.sourceId}-${item.chunkId}-${index}`} className="rounded-lg border border-border bg-slate-50 p-3"><p className="text-sm leading-relaxed text-slate-600">“{item.quote}”</p><p className="mt-1 text-xs text-muted-foreground">{item.reason}</p></article>)}</div>}
      </DataGroup>
    </div>
  );
}

function ApplicationActivityTab({ application }: { application: Application }) {
  return (
    <div className="grid gap-2">
      {(application.activities ?? []).length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无活动记录。</div> : (application.activities ?? []).map((activity) => <article key={activity.id} className="rounded-xl border border-border bg-surface p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{activity.title}</strong><span className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</span></div>{activity.detail && <p className="mt-1 text-sm text-slate-600">{activity.detail}</p>}</article>)}
    </div>
  );
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

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}
