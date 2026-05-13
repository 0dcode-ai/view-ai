import { BookOpen, Download, Gauge, Pencil, Plus, Search, Sparkles } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { KnowledgeCard, TabKey } from "@/app/types";
import { KnowledgeStudyGuideView } from "@/app/components/knowledge/study-guide-view";
import { Panel } from "@/app/components/shared/panel";
import { Pill } from "@/app/components/shared/pill";
import { btnGhost, btnPrimary, btnSecondary, inputCls } from "@/app/components/shared/styles";
import { buildKnowledgeStudyGuide } from "@/lib/knowledge-study-guide";
import { cn } from "@/lib/utils";

type RecordTagGroup = {
  title: string;
  tags: string[];
};

export type RecordsTabProps = {
  busy: string | null;
  filters: { q: string; company: string; topic: string; mastery: string; questionType: string };
  recordCards: KnowledgeCard[];
  selectedKnowledgeCard: KnowledgeCard | null;
  recordTagFilter: string;
  recordTagGroups: RecordTagGroup[];
  onFiltersChange: Dispatch<SetStateAction<{ q: string; company: string; topic: string; mastery: string; questionType: string }>>;
  onLoadKnowledge: (filters?: { q: string; company: string; topic: string; mastery: string; questionType: string }) => void;
  onRecordTagFilterChange: (tag: string) => void;
  onSelectedKnowledgeIdChange: (id: number | null) => void;
  onOpenRecordAgentEditor: () => void;
  onSeedQuestionBank: () => void;
  onExportData: () => void;
  onStartKnowledgeEdit: (card: KnowledgeCard) => void;
  onActiveTabChange: (tab: TabKey) => void;
};

export function RecordsTab({
  busy,
  filters,
  recordCards,
  selectedKnowledgeCard,
  recordTagFilter,
  recordTagGroups,
  onFiltersChange,
  onLoadKnowledge,
  onRecordTagFilterChange,
  onSelectedKnowledgeIdChange,
  onOpenRecordAgentEditor,
  onSeedQuestionBank,
  onExportData,
  onStartKnowledgeEdit,
  onActiveTabChange,
}: RecordsTabProps) {
  return (
    <div className="grid gap-4">
      <Panel title="题库记录" icon={<BookOpen size={16} />}>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold">记录库</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">平时直接浏览、搜索和筛选题目，需要新增时再进入 Agent 模块。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={btnPrimary} type="button" onClick={onOpenRecordAgentEditor}>
                <Plus size={15} /> 新增记录
              </button>
              <button className={btnSecondary} type="button" onClick={onSeedQuestionBank} disabled={busy === "seed-bank"}>
                <Sparkles size={15} /> 导入内置题库
              </button>
              <button className={btnGhost} type="button" onClick={onExportData} disabled={busy === "export"}>
                <Download size={15} /> 导出
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className={inputCls + " min-w-[220px] flex-1"}
                  placeholder="搜索题目、答案、提示或标签"
                  value={filters.q}
                  onChange={(event) => onFiltersChange({ ...filters, q: event.target.value })}
                />
                <button className={btnSecondary} type="button" onClick={() => onLoadKnowledge()}>
                  <Search size={15} /> 搜索
                </button>
              </div>

              <div className="rounded-xl border border-border bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">按标签筛选</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">支持按语言、技术栈和岗位方向快速切片，比如 `C++`、`后端开发`、`前端开发`、`产品设计`。</p>
                  </div>
                  {recordTagFilter && (
                    <button className={btnGhost} type="button" onClick={() => onRecordTagFilterChange("")}>
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
                              onRecordTagFilterChange(nextTag);
                              onLoadKnowledge({
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
              <RecordCardList
                cards={recordCards}
                selectedCard={selectedKnowledgeCard}
                onSelect={(card) => {
                  onSelectedKnowledgeIdChange(card.id);
                }}
              />

              <RecordDetail
                card={selectedKnowledgeCard}
                onEdit={onStartKnowledgeEdit}
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="辅助能力" icon={<Gauge size={16} />}>
        <div className="grid gap-3 md:grid-cols-3">
          <button className="rounded-xl border border-border p-4 text-left shadow-sm hover:bg-slate-50" type="button" onClick={() => onActiveTabChange("review")}>
            <h4 className="text-sm font-semibold">面试报告</h4>
            <p className="mt-1 text-sm text-muted-foreground">查看模拟面试的评分、逐题诊断和改进建议。</p>
          </button>
          <button className="rounded-xl border border-border p-4 text-left shadow-sm hover:bg-slate-50" type="button" onClick={() => onActiveTabChange("sprint")}>
            <h4 className="text-sm font-semibold">冲刺计划</h4>
            <p className="mt-1 text-sm text-muted-foreground">把岗位目标拆成每日准备动作。</p>
          </button>
          <button className="rounded-xl border border-border p-4 text-left shadow-sm hover:bg-slate-50" type="button" onClick={() => onActiveTabChange("prep")}>
            <h4 className="text-sm font-semibold">公司情报</h4>
            <p className="mt-1 text-sm text-muted-foreground">面经、公司高频题作为补充入口。</p>
          </button>
        </div>
      </Panel>
    </div>
  );
}

function RecordCardList({
  cards,
  selectedCard,
  onSelect,
}: {
  cards: KnowledgeCard[];
  selectedCard: KnowledgeCard | null;
  onSelect: (card: KnowledgeCard) => void;
}) {
  return (
    <div className="grid max-h-[680px] gap-3 overflow-auto pr-1">
      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无记录，点击“新增记录”后粘贴八股文或技术文章，Agent 会整理成结构化题目和答案。</div>
      ) : (
        cards.map((card) => {
          const guide = buildKnowledgeStudyGuide({
            question: card.question,
            answer: card.answer,
            note: card.note,
            topicName: card.topic?.name,
            tags: card.tags,
          });

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card)}
              className={cn(
                "rounded-xl border bg-surface p-3.5 text-left shadow-sm transition-colors",
                selectedCard?.id === card.id ? "border-primary ring-2 ring-primary/15" : "border-border hover:bg-slate-50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold leading-snug">{card.question}</h4>
                <Pill variant="accent">{card.questionType || "八股"}</Pill>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{guide.coreAnswer}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {card.topic && <Pill>{card.topic.name}</Pill>}
                <Pill variant="accent">{guide.followUps.length} 追问</Pill>
                <Pill>{guide.reviewChecklist.length} 自检点</Pill>
                {card.tags.slice(0, 2).map((tag) => <Pill key={tag}>{tag}</Pill>)}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

function RecordDetail({
  card,
  onEdit,
}: {
  card: KnowledgeCard | null;
  onEdit: (card: KnowledgeCard) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-slate-50 p-4">
      {!card ? (
        <div className="py-8 text-center text-sm text-muted-foreground">选择一条记录查看原文。</div>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Pill variant="brand">记录详情</Pill>
              <h4 className="mt-3 text-base font-semibold leading-snug">{card.question}</h4>
            </div>
            <button className={btnGhost} type="button" onClick={() => onEdit(card)}>
              <Pencil size={14} /> 编辑
            </button>
          </div>
          <div className="max-h-[520px] overflow-auto pr-1">
            <KnowledgeStudyGuideView card={card} compact />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {card.topic && <Pill>{card.topic.name}</Pill>}
            {card.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
          </div>
        </div>
      )}
    </div>
  );
}
