import type { KnowledgeCard } from "@/app/types";
import { difficultyLabels } from "@/app/types";
import { Pill } from "@/app/components/shared/pill";
import { buildKnowledgeStudyGuide } from "@/lib/knowledge-study-guide";
import { cn } from "@/lib/utils";

function GuideList({ values }: { values: string[] }) {
  return (
    <ul className="space-y-1.5">
      {values.map((value, index) => (
        <li key={`${value}-${index}`} className="flex gap-2 text-[13px] leading-6 text-slate-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
          <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

function GuideBlock({
  title,
  values,
  text,
  compact = false,
}: {
  title: string;
  values?: string[];
  text?: string;
  compact?: boolean;
}) {
  const hasList = Boolean(values?.length);
  const hasText = Boolean(text?.trim());
  if (!hasList && !hasText) return null;

  return (
    <article className={cn("rounded-xl border border-border bg-surface shadow-sm", compact ? "p-3" : "p-4")}>
      <h5 className="text-[13px] font-semibold text-foreground">{title}</h5>
      <div className="mt-2">
        {hasList ? (
          <GuideList values={values ?? []} />
        ) : (
          <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-600">{text}</p>
        )}
      </div>
    </article>
  );
}

export function KnowledgeStudyGuideView({ card, compact = false }: { card: KnowledgeCard; compact?: boolean }) {
  const guide = buildKnowledgeStudyGuide({
    question: card.question,
    answer: card.answer,
    note: card.note,
    topicName: card.topic?.name,
    tags: card.tags,
  });

  return (
    <div className="grid gap-3">
      <article className={cn("rounded-xl border border-zinc-200 bg-[linear-gradient(135deg,#fafaf9_0%,#f5f5f4_55%,#e7e5e4_100%)] shadow-sm", compact ? "p-3" : "p-4")}>
        <div className="flex flex-wrap items-center gap-2">
          <Pill variant="brand">结构化题解</Pill>
          <Pill>{card.questionType || "八股"}</Pill>
          <Pill variant="accent">{difficultyLabels[card.difficulty] ?? card.difficulty}</Pill>
        </div>
        <h4 className="mt-3 text-base font-semibold leading-snug text-foreground">{guide.headline}</h4>
        <p className="mt-2 text-sm leading-6 text-slate-700">{guide.coreAnswer}</p>
      </article>

      <GuideBlock title="面试回答" text={guide.interviewAnswer} compact={compact} />
      <div className={cn("grid gap-3", compact ? "" : "lg:grid-cols-2")}>
        <GuideBlock title="考点定位" values={guide.problemContext} compact={compact} />
        <GuideBlock title="思路" values={guide.thinkingPath} compact={compact} />
        <GuideBlock title="步骤" values={guide.keySteps} compact={compact} />
        <GuideBlock title="复杂度与取舍" values={guide.tradeoffs} compact={compact} />
        <GuideBlock title="易错点" values={guide.pitfalls} compact={compact} />
        <GuideBlock title="常见追问" values={guide.followUps} compact={compact} />
      </div>
      <GuideBlock title="示例 / 代码 / 场景" text={guide.exampleOrCode} compact={compact} />
      <GuideBlock title="项目连接" values={guide.projectHooks} compact={compact} />
      <GuideBlock title="自检要点" values={guide.reviewChecklist} compact={compact} />
    </div>
  );
}
