import { Save, Sparkles, Trash2, X } from "lucide-react";
import type { KnowledgeForm } from "@/app/types";
import { Field } from "@/app/components/shared/field";
import { Pill } from "@/app/components/shared/pill";
import { TextList } from "@/app/components/shared/text-list";
import { KnowledgeStudyGuideView } from "@/app/components/knowledge/study-guide-view";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputCls,
  softGradientCls,
  textareaCls,
} from "@/app/components/shared/styles";
import type { RecordAgentEditorProps, RecordAgentMode } from "@/app/features/records/types";
import { formToSyntheticKnowledgeCard } from "@/app/features/records/utils";
import { cn } from "@/lib/utils";

export function RecordAgentEditor({
  busy,
  isOpen,
  mode,
  recordText,
  recordContext,
  recordDraft,
  execution,
  articles,
  articleId,
  batchMaxCards,
  batchDrafts,
  onClose,
  onModeChange,
  onRecordTextChange,
  onRecordContextChange,
  onRecordDraftChange,
  onArticleIdChange,
  onBatchMaxCardsChange,
  onGenerateSingle,
  onGenerateBatch,
  onSaveSingle,
  onSaveBatch,
  onUpdateBatchDraft,
  onRemoveBatchDraft,
  onSelectAllBatchDrafts,
}: RecordAgentEditorProps) {
  if (!isOpen) return null;

  const shouldSelectAll = batchDrafts.some((draft) => !draft.selected);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">新增记录</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">通过 Agent 把原始八股文或技术文章整理成结构化题目和答案，再保存进题库。</p>
          </div>
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-slate-50 hover:text-foreground" type="button" onClick={onClose}>
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
                    参考题解结构：单题整理适合零散知识点；文章拆题适合把一整篇技术文章拆成多条“结论、思路、步骤、示例、取舍、追问、自检要点”都完整的题目。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill variant="accent">deepseek-v4-pro</Pill>
                  <Pill variant={execution?.usedFallback ? "warn" : "brand"}>
                    {execution?.usedFallback ? "Fallback" : "Agent"}
                  </Pill>
                </div>
              </div>
            </article>

            <div className="inline-flex w-fit rounded-xl border border-border bg-slate-50 p-1">
              {([
                ["single", "单张整理"],
                ["batch", "文章拆题"],
              ] as Array<[RecordAgentMode, string]>).map(([nextMode, label]) => (
                <button
                  key={nextMode}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    mode === nextMode ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                  type="button"
                  onClick={() => onModeChange(nextMode)}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "batch" && (
              <div className="grid gap-3 rounded-2xl border border-border bg-slate-50 p-4 md:grid-cols-[1fr_160px]">
                <Field label="选择技术文章">
                  <select
                    className={inputCls}
                    value={articleId ?? ""}
                    onChange={(event) => onArticleIdChange(event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">不选择，直接粘贴文章</option>
                    {articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.title}{article.topic ? ` · ${article.topic}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="最多生成">
                  <select
                    className={inputCls}
                    value={batchMaxCards}
                    onChange={(event) => onBatchMaxCardsChange(Number(event.target.value))}
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 3).map((count) => (
                      <option key={count} value={count}>{count} 条</option>
                    ))}
                  </select>
                </Field>
                <p className="text-xs leading-relaxed text-muted-foreground md:col-span-2">
                  可以只选文章，也可以在下面补充粘贴额外内容。生成后不会自动保存，会先进入可编辑预览。
                </p>
              </div>
            )}

            <Field label={mode === "batch" ? "文章正文 / 补充内容" : "原始内容"}>
              <textarea
                className={textareaCls + (mode === "batch" ? " min-h-[220px]" : " min-h-[240px]")}
                placeholder={mode === "batch"
                  ? "可直接贴一整篇技术文章，或在已选文章基础上补充你想拆题的段落。"
                  : "例如把一整段 Redis、MySQL、React、消息队列、缓存、系统设计等八股文直接贴进来。"}
                value={recordText}
                onChange={(event) => onRecordTextChange(event.target.value)}
              />
            </Field>

            <Field label="补充要求">
              <input
                className={inputCls}
                placeholder="可选：例如偏前端面试、要更口语化、希望补项目连接点。"
                value={recordContext}
                onChange={(event) => onRecordContextChange(event.target.value)}
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              {mode === "single" ? (
                <>
                  <button className={btnPrimary} type="button" onClick={onGenerateSingle} disabled={busy === "record-agent"}>
                    <Sparkles size={15} /> {busy === "record-agent" ? "Agent 生成中" : "生成题解"}
                  </button>
                  <button className={btnSecondary} type="button" onClick={onSaveSingle} disabled={busy === "record-save"}>
                    <Save size={15} /> 保存到题库
                  </button>
                </>
              ) : (
                <>
                  <button className={btnPrimary} type="button" onClick={onGenerateBatch} disabled={busy === "record-batch-agent"}>
                    <Sparkles size={15} /> {busy === "record-batch-agent" ? "拆题中" : "生成多条题解"}
                  </button>
                  <button className={btnSecondary} type="button" onClick={onSaveBatch} disabled={busy === "record-batch-save" || batchDrafts.length === 0}>
                    <Save size={15} /> 保存已勾选
                  </button>
                </>
              )}
            </div>

            {execution && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>模型：{execution.model}</span>
                  <span>·</span>
                  <span>{execution.usedFallback ? "当前是 fallback 草稿" : "已使用真实模型生成"}</span>
                </div>
                <TextList values={execution.steps} />
              </div>
            )}

            {mode === "single" ? (
              <SingleDraftEditor draft={recordDraft} onChange={onRecordDraftChange} />
            ) : (
              <BatchDraftEditor
                drafts={batchDrafts}
                shouldSelectAll={shouldSelectAll}
                onSelectAll={() => onSelectAllBatchDrafts(shouldSelectAll)}
                onUpdate={onUpdateBatchDraft}
                onRemove={onRemoveBatchDraft}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button className={btnSecondary} type="button" onClick={onClose}>取消</button>
          {mode === "single" ? (
            <button className={btnPrimary} type="button" onClick={onSaveSingle} disabled={busy === "record-save"}>
              <Save size={15} /> 保存到题库
            </button>
          ) : (
            <button className={btnPrimary} type="button" onClick={onSaveBatch} disabled={busy === "record-batch-save" || batchDrafts.length === 0}>
              <Save size={15} /> 批量保存
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SingleDraftEditor({ draft, onChange }: { draft: KnowledgeForm; onChange: (draft: KnowledgeForm) => void }) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-slate-50 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">Agent 草稿</h4>
        <Pill variant="accent">{draft.questionType || "八股"}</Pill>
      </div>
      <div className="rounded-xl border border-border bg-surface p-3">
        {draft.question || draft.answer || draft.note ? (
          <KnowledgeStudyGuideView card={formToSyntheticKnowledgeCard(draft)} compact />
        ) : (
          <p className="text-sm text-muted-foreground">生成后这里会预览成“结构化题解”。</p>
        )}
      </div>
      <Field label="面试题">
        <textarea className={textareaCls + " min-h-[96px]"} value={draft.question} onChange={(event) => onChange({ ...draft, question: event.target.value })} />
      </Field>
      <Field label="面试答案">
        <textarea className={textareaCls + " min-h-[220px]"} value={draft.answer} onChange={(event) => onChange({ ...draft, answer: event.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="主题">
          <input className={inputCls} list="topic-options" value={draft.topicName} onChange={(event) => onChange({ ...draft, topicName: event.target.value })} />
        </Field>
        <Field label="标签">
          <input className={inputCls} value={draft.tags} onChange={(event) => onChange({ ...draft, tags: event.target.value })} />
        </Field>
      </div>
      <Field label="结构化题解 Markdown">
        <textarea className={textareaCls + " min-h-[220px] font-mono text-xs"} value={draft.note} onChange={(event) => onChange({ ...draft, note: event.target.value })} />
      </Field>
    </div>
  );
}

function BatchDraftEditor({
  drafts,
  shouldSelectAll,
  onSelectAll,
  onUpdate,
  onRemove,
}: {
  drafts: Array<KnowledgeForm & { draftId: string; selected: boolean }>;
  shouldSelectAll: boolean;
  onSelectAll: () => void;
  onUpdate: (draftId: string, patch: Partial<KnowledgeForm & { selected: boolean }>) => void;
  onRemove: (draftId: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">多题预览</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            已勾选 {drafts.filter((draft) => draft.selected).length}/{drafts.length} 条，保存前可以逐条修改。
          </p>
        </div>
        {drafts.length > 0 && (
          <button className={btnGhost} type="button" onClick={onSelectAll}>
            {shouldSelectAll ? "全选" : "取消全选"}
          </button>
        )}
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-slate-50 p-8 text-center text-sm text-muted-foreground">
          选择技术文章或粘贴正文后，点击“生成多条题解”，这里会出现可编辑草稿。
        </div>
      ) : (
        <div className="grid gap-3">
          {drafts.map((draft, index) => (
            <article key={draft.draftId} className="grid gap-3 rounded-xl border border-border bg-slate-50 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    checked={draft.selected}
                    className="h-4 w-4 rounded border-border text-primary"
                    type="checkbox"
                    onChange={(event) => onUpdate(draft.draftId, { selected: event.target.checked })}
                  />
                  第 {index + 1} 条
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill variant="accent">{draft.questionType || "八股"}</Pill>
                  <button className={btnGhost} type="button" onClick={() => onRemove(draft.draftId)}>
                    <Trash2 size={14} /> 删除
                  </button>
                </div>
              </div>

              <Field label="面试题">
                <textarea className={textareaCls + " min-h-[80px]"} value={draft.question} onChange={(event) => onUpdate(draft.draftId, { question: event.target.value })} />
              </Field>
              <Field label="面试答案">
                <textarea className={textareaCls + " min-h-[180px]"} value={draft.answer} onChange={(event) => onUpdate(draft.draftId, { answer: event.target.value })} />
              </Field>
              <div className="rounded-xl border border-border bg-surface p-3">
                <KnowledgeStudyGuideView card={formToSyntheticKnowledgeCard(draft)} compact />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="主题">
                  <input className={inputCls} list="topic-options" value={draft.topicName} onChange={(event) => onUpdate(draft.draftId, { topicName: event.target.value })} />
                </Field>
                <Field label="标签">
                  <input className={inputCls} value={draft.tags} onChange={(event) => onUpdate(draft.draftId, { tags: event.target.value })} />
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="题型">
                  <input className={inputCls} value={draft.questionType} onChange={(event) => onUpdate(draft.draftId, { questionType: event.target.value })} />
                </Field>
                <Field label="能力维度">
                  <input className={inputCls} value={draft.abilityDimension} onChange={(event) => onUpdate(draft.draftId, { abilityDimension: event.target.value })} />
                </Field>
                <Field label="难度">
                  <select className={inputCls} value={draft.difficulty} onChange={(event) => onUpdate(draft.draftId, { difficulty: event.target.value as KnowledgeForm["difficulty"] })}>
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </Field>
              </div>
              <Field label="结构化题解 Markdown">
                <textarea className={textareaCls + " min-h-[180px] font-mono text-xs"} value={draft.note} onChange={(event) => onUpdate(draft.draftId, { note: event.target.value })} />
              </Field>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
