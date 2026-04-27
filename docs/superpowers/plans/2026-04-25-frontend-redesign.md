# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the interview prep tool UI from blue glassmorphism dashboard to a modern minimalist interface using Tailwind CSS + shadcn/ui, with component extraction from the monolithic page.tsx.

**Architecture:** Replace hand-written CSS with Tailwind utilities. Replace sidebar layout with sticky topbar. Extract 13 inline components into separate files under `app/components/`. page.tsx remains the state owner (~300 lines), delegating rendering to view components via props.

**Tech Stack:** Next.js App Router, React, Tailwind CSS v4, shadcn/ui, Inter font, lucide-react

**Spec:** `docs/superpowers/specs/2026-04-25-frontend-redesign-design.md`

---

## Task 1: Install Tailwind CSS v4 and dependencies

**Files:**
- Modify: `package.json`
- Create: `postcss.config.mjs`
- Create: `app/globals.css` (will be overwritten in Task 3)

- [ ] **Step 1: Install Tailwind CSS v4 and PostCSS plugin**

Run:
```bash
cd /Users/william/coding/projects/view_agent && npm install tailwindcss @tailwindcss/postcss
```

Expected: packages installed successfully.

- [ ] **Step 2: Install shadcn/ui peer dependencies**

Run:
```bash
npm install class-variance-authority clsx tailwind-merge @radix-ui/react-slot @radix-ui/react-select @radix-ui/react-tooltip
```

Expected: packages installed successfully.

- [ ] **Step 3: Create PostCSS config**

Create `postcss.config.mjs`:

```mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 4: Verify Tailwind is wired up**

Temporarily add `@import "tailwindcss"` as the first line of `app/globals.css` (keep all existing CSS below it for now). Run:

```bash
npm run dev
```

Expected: app loads with existing styles still working (Tailwind base layers + old CSS coexist). Kill dev server after verifying.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json postcss.config.mjs
git commit -m "chore: install tailwind css v4 and shadcn peer deps"
```

---

## Task 2: Create utility files (cn, types, helpers)

**Files:**
- Create: `lib/utils.ts`
- Create: `app/types.ts`
- Create: `app/helpers.ts`

- [ ] **Step 1: Create `lib/utils.ts` with cn() utility**

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `app/types.ts` — extract all types from page.tsx**

Copy all type definitions from `app/page.tsx` lines 38–264 (CompanyOption, TopicOption, KnowledgeCard, ResumeProfile, JobTarget, InterviewTurn, InterviewSession, ReviewCard, SprintTask, SprintPlan, DailyData, LearningPath, LabType, LabSession, CompanyPrep, KnowledgeSuggestion, KnowledgeForm, TabKey) into `app/types.ts`. Also copy the constant objects: `pageLabels`, `emptyKnowledgeForm`, `navItems`, `difficultyLabels`, `masteryLabels`.

```ts
import {
  BookOpen,
  BriefcaseBusiness,
  ClipboardList,
  Code2,
  FileText,
  MessageSquareText,
} from "lucide-react";
import type { InterviewMode, RoundType } from "@/lib/interview-modes";

export type CompanyOption = {
  id: number;
  name: string;
};

export type TopicOption = {
  id: number;
  name: string;
};

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
  prep: "公司备考",
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

export const navItems: Array<{ key: TabKey; label: string; icon: typeof BookOpen }> = [
  { key: "targets", label: pageLabels.targets, icon: BriefcaseBusiness },
  { key: "knowledge", label: pageLabels.knowledge, icon: BookOpen },
  { key: "resume", label: pageLabels.resume, icon: FileText },
  { key: "interview", label: pageLabels.interview, icon: MessageSquareText },
  { key: "review", label: pageLabels.review, icon: ClipboardList },
  { key: "lab", label: pageLabels.lab, icon: Code2 },
];

export const difficultyLabels: Record<string, string> = {
  easy: "基础",
  medium: "中等",
  hard: "困难",
};

export const masteryLabels = ["未学", "见过", "会背", "能结合项目", "能追问展开"];
```

- [ ] **Step 3: Create `app/helpers.ts` — extract helper functions**

```ts
export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "请求失败");
  }

  return payload as T;
}

export function joinTags(tags: string[]) {
  return tags.filter(Boolean).join("，");
}

export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("zh-CN");
}

export function scoreOrDash(value: number | undefined) {
  return typeof value === "number" ? value : "-";
}
```

- [ ] **Step 4: Verify types compile**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors (types.ts and helpers.ts have no dependencies on the old page.tsx yet).

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts app/types.ts app/helpers.ts
git commit -m "feat: add shared types, helpers, and cn utility"
```

---

## Task 3: Rewrite globals.css with Tailwind theme

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css entirely**

Write new `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-foreground: #0f172a;
  --color-muted: #64748b;
  --color-border: #e2e8f0;
  --color-primary: #3b82f6;
  --color-primary-hover: #1d4ed8;
  --color-primary-soft: #eff6ff;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-destructive: #ef4444;
}

@layer base {
  * {
    box-sizing: border-box;
  }

  html {
    min-height: 100%;
  }

  body {
    min-height: 100%;
    margin: 0;
    color: var(--color-foreground);
    background: var(--color-background);
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }
}
```

Note: The old CSS classes are now gone. The app will look broken until we update the components. This is expected — we'll fix it in subsequent tasks.

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: replace custom CSS with Tailwind theme"
```

---

## Task 4: Update layout.tsx with Inter font

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "面试训练台",
  description: "本地优先的面试 AI 训练软件",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify layout loads**

Run:
```bash
npm run dev
```

Expected: page loads with Inter font. Content is unstyled (broken layout) since old CSS is gone. Kill dev server.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add Inter font to root layout"
```

---

## Task 5: Create shared UI components

**Files:**
- Create: `app/components/shared/panel.tsx`
- Create: `app/components/shared/metric-card.tsx`
- Create: `app/components/shared/score-card.tsx`
- Create: `app/components/shared/score-bar.tsx`
- Create: `app/components/shared/pill.tsx`
- Create: `app/components/shared/field.tsx`
- Create: `app/components/shared/data-group.tsx`
- Create: `app/components/shared/text-list.tsx`
- Create: `app/components/shared/loading-spinner.tsx`

- [ ] **Step 1: Create `panel.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, icon, children, className }: PanelProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-sm", className)}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create `metric-card.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  className?: string;
}

export function MetricCard({ icon, label, value, className }: MetricCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4 shadow-sm", className)}>
      <div className="flex items-center gap-2 text-sm text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-2.5 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create `score-card.tsx`**

```tsx
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  label: string;
  value: number;
  className?: string;
}

export function ScoreCard({ label, value, className }: ScoreCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-hover">
          {value}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `pill.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PillVariant = "default" | "brand" | "accent" | "warn" | "success";

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
  className?: string;
}

const variantStyles: Record<PillVariant, string> = {
  default: "bg-slate-100 text-slate-600",
  brand: "bg-primary-soft text-primary-hover",
  accent: "bg-sky-50 text-sky-700",
  warn: "bg-amber-50 text-amber-600",
  success: "bg-green-50 text-green-700",
};

export function Pill({ children, variant = "default", className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Create `field.tsx`**

```tsx
import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
```

- [ ] **Step 6: Create `data-group.tsx`**

```tsx
import type { ReactNode } from "react";

interface DataGroupProps {
  title: string;
  children: ReactNode;
}

export function DataGroup({ title, children }: DataGroupProps) {
  return (
    <div className="border-b border-border pb-3 last:border-b-0 last:pb-0">
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      {children}
    </div>
  );
}
```

- [ ] **Step 7: Create `text-list.tsx`**

```tsx
export function TextList({ values }: { values: string[] }) {
  return (
    <ul className="list-disc pl-5 text-sm text-slate-600 leading-relaxed">
      {(values.length ? values : ["暂无"]).map((value) => (
        <li key={value}>{value}</li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 8: Create `loading-spinner.tsx`**

```tsx
export function LoadingSpinner() {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      处理中
    </span>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add app/components/shared/
git commit -m "feat: add shared UI components (panel, metric-card, score-card, pill, field, data-group, text-list, loading-spinner)"
```

---

## Task 6: Create Topbar component

**Files:**
- Create: `app/components/layout/topbar.tsx`

- [ ] **Step 1: Create topbar component**

```tsx
"use client";

import { BrainCircuit, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, pageLabels, type TabKey } from "@/app/types";

interface TopbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onRefresh: () => void;
}

export function Topbar({ activeTab, onTabChange, onRefresh }: TopbarProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
            <BrainCircuit size={18} />
          </div>
          <span className="text-base font-semibold text-foreground">面试AI</span>
        </div>

        <nav className="flex items-center gap-1" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground hover:bg-slate-100",
                )}
                onClick={() => onTabChange(item.key)}
                type="button"
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <button
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-slate-50 hover:text-foreground"
        type="button"
        onClick={onRefresh}
      >
        <RefreshCcw size={15} />
        刷新
      </button>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/layout/topbar.tsx
git commit -m "feat: add topbar navigation component"
```

---

## Task 7: Create knowledge components

**Files:**
- Create: `app/components/knowledge/card-list.tsx`

- [ ] **Step 1: Create `card-list.tsx`**

This replaces the inline `CardList` function.

```tsx
import { Building2, CheckCircle2, Target } from "lucide-react";
import { Pill } from "@/app/components/shared/pill";
import { masteryLabels, type KnowledgeCard } from "@/app/types";

interface CardListProps {
  cards: KnowledgeCard[];
  onProgress: (cardId: number, mastery: number, markReviewed?: boolean) => Promise<void>;
}

export function CardList({ cards, onProgress }: CardListProps) {
  if (cards.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无学习卡</div>;
  }

  return (
    <div className="mt-3.5 grid gap-3">
      {cards.map((card) => (
        <article key={card.id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h5 className="text-sm font-semibold text-foreground leading-snug">{card.question}</h5>
            <Pill variant="accent">优先级 {card.priorityScore}</Pill>
          </div>
          <p className="mt-2 text-sm text-slate-500 whitespace-pre-wrap leading-relaxed">{card.answer}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {card.company && (
              <Pill variant="brand">
                <Building2 size={12} />
                {card.company.name}
              </Pill>
            )}
            {card.topic && (
              <Pill>
                <Target size={12} />
                {card.topic.name}
              </Pill>
            )}
            <Pill>{card.questionType}</Pill>
            <Pill>{card.abilityDimension}</Pill>
            <Pill variant="warn">{masteryLabels[card.mastery] ?? card.mastery}</Pill>
            <Pill>错 {card.mistakeCount}</Pill>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
              type="button"
              onClick={() => void onProgress(card.id, Math.min(card.mastery + 1, 4), true)}
            >
              <CheckCircle2 size={15} />
              已复习
            </button>
            <button
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
              type="button"
              onClick={() => void onProgress(card.id, Math.max(card.mastery - 1, 0))}
            >
              还不熟
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/knowledge/card-list.tsx
git commit -m "feat: add card-list component for knowledge cards"
```

---

## Task 8: Create review, session, sprint, lab, and weakness components

**Files:**
- Create: `app/components/review/review-list.tsx`
- Create: `app/components/shared/session-list.tsx`
- Create: `app/components/shared/sprint-list.tsx`
- Create: `app/components/lab/lab-list.tsx`
- Create: `app/components/trends/weakness-list.tsx`

- [ ] **Step 1: Create `review-list.tsx`**

```tsx
import { Pill } from "@/app/components/shared/pill";
import type { ReviewCard } from "@/app/types";
import type { RoundType } from "@/lib/interview-modes";
import { roundTypeLabels } from "@/lib/interview-modes";

interface ReviewListProps {
  cards: ReviewCard[];
}

export function ReviewList({ cards }: ReviewListProps) {
  if (cards.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无复习卡</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <article key={card.id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
            <Pill variant="brand">{card.status === "todo" ? "待复习" : card.status}</Pill>
          </div>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{card.weakness}</p>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{card.suggestion}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pill variant="accent">优先级 {card.priority}</Pill>
            {card.session && (
              <Pill>{roundTypeLabels[card.session.roundType as RoundType] ?? card.session.roundType}</Pill>
            )}
            {card.tags.map((tag) => (
              <Pill key={`${card.id}-${tag}`}>{tag}</Pill>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `session-list.tsx`**

```tsx
import { Pill } from "@/app/components/shared/pill";
import { formatDate } from "@/app/helpers";
import { interviewModeLabels, roundTypeLabels } from "@/lib/interview-modes";
import { scoreOrDash } from "@/app/helpers";
import type { InterviewSession } from "@/app/types";

interface SessionListProps {
  sessions: InterviewSession[];
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无模拟记录</div>;
  }

  return (
    <div className="grid gap-3">
      {sessions.map((session) => (
        <article key={session.id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-semibold text-foreground">
              {session.company?.name ?? "未指定公司"} / {session.targetRole ?? "岗位"}
            </h4>
            <Pill variant="accent">总分 {scoreOrDash(session.score.overall)}</Pill>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Pill>{interviewModeLabels[session.mode]}</Pill>
            <Pill>{roundTypeLabels[session.roundType]}</Pill>
            <Pill>{session.status}</Pill>
            <Pill>{formatDate(session.updatedAt)}</Pill>
          </div>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `sprint-list.tsx`**

```tsx
import { Pill } from "@/app/components/shared/pill";
import type { SprintPlan, SprintTask } from "@/app/types";

interface SprintListProps {
  plans: SprintPlan[];
  onTaskStatus: (taskId: number, status: SprintTask["status"]) => Promise<void>;
}

export function SprintList({ plans, onTaskStatus }: SprintListProps) {
  if (plans.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无冲刺计划</div>;
  }

  return (
    <div className="grid gap-3">
      {plans.map((plan) => {
        const done = plan.tasks.filter((t) => t.status === "done").length;
        const rate = plan.tasks.length ? Math.round((done / plan.tasks.length) * 100) : 0;
        return (
          <article key={plan.id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-semibold text-foreground">{plan.title}</h4>
              <Pill variant="brand">{rate}%</Pill>
            </div>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{plan.summary}</p>
            <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${rate}%` }} />
            </div>
            <div className="mt-3 grid gap-2">
              {plan.tasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-[auto_1fr_auto] gap-3 items-start rounded-lg border border-border p-3"
                >
                  <Pill>D{task.dayIndex}</Pill>
                  <div className="min-w-0">
                    <strong className="text-sm">{task.title}</strong>
                    <p className="mt-0.5 text-xs text-muted leading-snug">{task.description}</p>
                  </div>
                  {task.status === "done" ? (
                    <Pill variant="brand">已完成</Pill>
                  ) : (
                    <button
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-slate-50"
                      type="button"
                      onClick={() => void onTaskStatus(task.id, "done")}
                    >
                      完成
                    </button>
                  )}
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Create `lab-list.tsx`**

```tsx
import { cn } from "@/lib/utils";
import { Pill } from "@/app/components/shared/pill";
import type { LabType, LabSession } from "@/app/types";

const typeLabels: Record<LabType, string> = {
  coding: "代码",
  system_design: "白板",
  peer_mock: "同伴",
};

interface LabListProps {
  sessions: LabSession[];
  activeId: number | null;
  onSelect: (id: number) => void;
}

export function LabList({ sessions, activeId, onSelect }: LabListProps) {
  if (sessions.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无实验室练习</div>;
  }

  return (
    <div className="grid gap-2">
      {sessions.map((session) => (
        <button
          key={session.id}
          className={cn(
            "grid grid-cols-[auto_1fr_auto] gap-3 items-center rounded-lg border p-3 text-left transition-colors",
            activeId === session.id
              ? "border-primary bg-primary-soft"
              : "border-border bg-surface hover:bg-slate-50",
          )}
          type="button"
          onClick={() => onSelect(session.id)}
        >
          <Pill variant="brand">{typeLabels[session.type] ?? session.type}</Pill>
          <span className="text-sm font-medium truncate">{session.title}</span>
          <Pill>{session.status === "reviewed" ? "已反馈" : "进行中"}</Pill>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create `weakness-list.tsx`**

```tsx
import type { ReviewCard } from "@/app/types";

interface WeaknessListProps {
  reviewCards: ReviewCard[];
}

export function WeaknessList({ reviewCards }: WeaknessListProps) {
  const counts = new Map<string, number>();
  reviewCards.forEach((card) => {
    card.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  });
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  if (rows.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">暂无薄弱主题</div>;
  }

  return (
    <div className="grid gap-3">
      {rows.map(([tag, count]) => (
        <div key={tag} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-foreground">{tag}</h4>
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
              {count}
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(count * 18, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/components/review/ app/components/shared/session-list.tsx app/components/shared/sprint-list.tsx app/components/lab/ app/components/trends/
git commit -m "feat: add review-list, session-list, sprint-list, lab-list, weakness-list components"
```

---

## Task 9: Create view components (all tabs)

**Files:**
- Create: `app/components/targets/targets-view.tsx`
- Create: `app/components/prep/prep-view.tsx`
- Create: `app/components/knowledge/knowledge-view.tsx`
- Create: `app/components/resume/resume-view.tsx`
- Create: `app/components/interview/interview-view.tsx`
- Create: `app/components/sprint/sprint-view.tsx`
- Create: `app/components/review/review-view.tsx`
- Create: `app/components/lab/lab-view.tsx`
- Create: `app/components/trends/trends-view.tsx`

Each view component receives data and callbacks as props, and uses Tailwind classes + shared components for rendering. The JSX structure mirrors the existing page.tsx render blocks for each tab, but with Tailwind classes instead of custom CSS classes.

- [ ] **Step 1: Create `targets-view.tsx`**

This is the "准备" tab. It shows daily tasks, learning path, JD form, and job target list. Props interface:

```tsx
"use client";

import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  GitBranch,
  ListChecks,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { Panel } from "@/app/components/shared/panel";
import { ScoreCard } from "@/app/components/shared/score-card";
import { Pill } from "@/app/components/shared/pill";
import { Field } from "@/app/components/shared/field";
import { DataGroup } from "@/app/components/shared/data-group";
import { TextList } from "@/app/components/shared/text-list";
import { CardList } from "@/app/components/knowledge/card-list";
import type {
  DailyData,
  JobTarget,
  KnowledgeCard,
  LearningPath,
  ResumeProfile,
  TabKey,
} from "@/app/types";
import { masteryLabels } from "@/app/types";

interface TargetsViewProps {
  dailyData: DailyData | null;
  learningPath: LearningPath | null;
  jdCompanyName: string;
  jdRoleName: string;
  jdText: string;
  selectedResume: ResumeProfile | null;
  jobTargets: JobTarget[];
  busy: string | null;
  onJdCompanyNameChange: (v: string) => void;
  onJdRoleNameChange: (v: string) => void;
  onJdTextChange: (v: string) => void;
  onJobTargetParse: () => Promise<void>;
  onSelectJobTarget: (id: number) => void;
  onTabChange: (tab: TabKey) => void;
  onLoadCompanyPrep: (companyId: number | null) => Promise<void>;
  onUpdateKnowledgeProgress: (cardId: number, mastery: number, markReviewed?: boolean) => Promise<void>;
}

export function TargetsView({
  dailyData,
  learningPath,
  jdCompanyName,
  jdRoleName,
  jdText,
  selectedResume,
  jobTargets,
  busy,
  onJdCompanyNameChange,
  onJdRoleNameChange,
  onJdTextChange,
  onJobTargetParse,
  onSelectJobTarget,
  onTabChange,
  onLoadCompanyPrep,
  onUpdateKnowledgeProgress,
}: TargetsViewProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
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
                  <div
                    key={`daily-card-${card.id}`}
                    className="grid grid-cols-[auto_1fr_auto] gap-3 items-center rounded-lg border border-border p-3"
                  >
                    <Pill>八股</Pill>
                    <div className="min-w-0">
                      <strong className="text-sm">{card.question}</strong>
                      <p className="mt-0.5 text-xs text-muted">
                        {card.topic?.name ?? "通用"} / {masteryLabels[card.mastery] ?? "未学"}
                      </p>
                    </div>
                    <button
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
                      type="button"
                      onClick={() => void onUpdateKnowledgeProgress(card.id, Math.min(card.mastery + 1, 4), true)}
                    >
                      完成
                    </button>
                  </div>
                ))}
                {dailyData.reviewCards.slice(0, 2).map((card) => (
                  <div
                    key={`daily-review-${card.id}`}
                    className="grid grid-cols-[auto_1fr_auto] gap-3 items-center rounded-lg border border-border p-3"
                  >
                    <Pill variant="warn">复盘</Pill>
                    <div className="min-w-0">
                      <strong className="text-sm">{card.title}</strong>
                      <p className="mt-0.5 text-xs text-muted">{card.weakness}</p>
                    </div>
                    <button
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary-soft"
                      type="button"
                      onClick={() => onTabChange("review")}
                    >
                      查看
                    </button>
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
                <article key={stage.title} className="rounded-lg border border-border p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h5 className="text-sm font-semibold">{stage.title}</h5>
                    <Pill variant="brand">{stage.topics.length} 个主题</Pill>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{stage.goal}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {stage.topics.map((topic) => (
                      <Pill key={topic}>{topic}</Pill>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Panel title="准备岗位" icon={<BriefcaseBusiness size={16} />}>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="公司">
                <input
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="可选"
                  value={jdCompanyName}
                  onChange={(e) => onJdCompanyNameChange(e.target.value)}
                />
              </Field>
              <Field label="岗位">
                <input
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="可选"
                  value={jdRoleName}
                  onChange={(e) => onJdRoleNameChange(e.target.value)}
                />
              </Field>
            </div>
            {selectedResume && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                <FileText size={14} />
                <span>使用简历：{selectedResume.title}</span>
              </div>
            )}
            <Field label="JD">
              <textarea
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[300px] resize-y leading-relaxed"
                placeholder="粘贴岗位描述"
                value={jdText}
                onChange={(e) => onJdTextChange(e.target.value)}
              />
            </Field>
            <button
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              type="button"
              onClick={() => void onJobTargetParse()}
              disabled={busy === "job-parse"}
            >
              <Sparkles size={15} />
              生成目标
            </button>
          </div>
        </Panel>

        <Panel title="岗位目标" icon={<Target size={16} />}>
          <div className="grid gap-3">
            {jobTargets.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted">暂无岗位目标</div>
            ) : (
              jobTargets.map((target) => (
                <article key={target.id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold">
                      {target.company?.name ?? "未命名公司"} / {target.roleName}
                    </h4>
                    <Pill variant="brand">匹配 {target.match.matchScore || 0}</Pill>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {target.parsed.requiredSkills.map((s) => (
                      <Pill key={s}>{s}</Pill>
                    ))}
                  </div>
                  <DataGroup title="面试重点">
                    <TextList values={target.parsed.interviewFocus} />
                  </DataGroup>
                  <DataGroup title="简历缺口">
                    <TextList values={target.match.gaps} />
                  </DataGroup>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                      type="button"
                      onClick={() => {
                        onSelectJobTarget(target.id);
                        onTabChange("interview");
                      }}
                    >
                      <Play size={15} />
                      用它模拟
                    </button>
                    <button
                      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-soft"
                      type="button"
                      onClick={() => {
                        onTabChange("prep");
                        void onLoadCompanyPrep(target.company?.id ?? null);
                      }}
                    >
                      <Building2 size={15} />
                      公司备考
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `prep-view.tsx`**

```tsx
"use client";

import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  MessageSquareText,
  Search,
} from "lucide-react";
import { Panel } from "@/app/components/shared/panel";
import { ScoreCard } from "@/app/components/shared/score-card";
import { CardList } from "@/app/components/knowledge/card-list";
import { ReviewList } from "@/app/components/review/review-list";
import { SessionList } from "@/app/components/shared/session-list";
import { SprintList } from "@/app/components/shared/sprint-list";
import type {
  CompanyOption,
  CompanyPrep,
  KnowledgeCard,
  SprintTask,
} from "@/app/types";

interface PrepViewProps {
  companies: CompanyOption[];
  prepCompanyId: number | null;
  companyPrep: CompanyPrep | null;
  busy: string | null;
  onPrepCompanyIdChange: (id: number | null) => void;
  onLoadCompanyPrep: (companyId?: number | null) => Promise<void>;
  onUpdateKnowledgeProgress: (cardId: number, mastery: number, markReviewed?: boolean) => Promise<void>;
  onUpdateTaskStatus: (taskId: number, status: SprintTask["status"]) => Promise<void>;
}

export function PrepView({
  companies,
  prepCompanyId,
  companyPrep,
  busy,
  onPrepCompanyIdChange,
  onLoadCompanyPrep,
  onUpdateKnowledgeProgress,
  onUpdateTaskStatus,
}: PrepViewProps) {
  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">公司备考</h3>
          <p className="mt-1 text-sm text-muted">聚合公司八股、岗位目标、模拟记录、待复习卡和冲刺进度。</p>
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            value={prepCompanyId ?? ""}
            onChange={(e) => onPrepCompanyIdChange(Number(e.target.value) || null)}
          >
            <option value="">选择公司</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            type="button"
            onClick={() => void onLoadCompanyPrep()}
          >
            <Search size={15} />
            查看
          </button>
        </div>
      </div>

      {!companyPrep ? (
        <div className="py-8 text-center text-sm text-muted">选择公司后查看准备度</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ScoreCard label="整体准备度" value={companyPrep.readiness.overall} />
            <ScoreCard label="JD 匹配" value={companyPrep.readiness.jd} />
            <ScoreCard label="八股覆盖" value={companyPrep.readiness.coverage} />
            <ScoreCard label="错题清理" value={companyPrep.readiness.review} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="高优先级八股" icon={<BookOpen size={16} />}>
              <CardList cards={companyPrep.knowledgeCards.slice(0, 6)} onProgress={onUpdateKnowledgeProgress} />
            </Panel>
            <Panel title="待复习卡" icon={<ClipboardList size={16} />}>
              <ReviewList cards={companyPrep.reviewCards.slice(0, 8)} />
            </Panel>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="最近模拟" icon={<MessageSquareText size={16} />}>
              <SessionList sessions={companyPrep.sessions} />
            </Panel>
            <Panel title="冲刺进度" icon={<CalendarDays size={16} />}>
              <SprintList plans={companyPrep.sprintPlans} onTaskStatus={onUpdateTaskStatus} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `knowledge-view.tsx`**

```tsx
"use client";

import { BookOpen, Save, Search, Sparkles } from "lucide-react";
import { Panel } from "@/app/components/shared/panel";
import { Pill } from "@/app/components/shared/pill";
import { Field } from "@/app/components/shared/field";
import { CardList } from "@/app/components/knowledge/card-list";
import type {
  CompanyOption,
  KnowledgeCard,
  KnowledgeForm,
  KnowledgeSuggestion,
  TopicOption,
} from "@/app/types";

interface KnowledgeViewProps {
  cards: KnowledgeCard[];
  companies: CompanyOption[];
  topics: TopicOption[];
  knowledgeForm: KnowledgeForm;
  knowledgeSuggestion: KnowledgeSuggestion | null;
  filters: { q: string };
  busy: string | null;
  onKnowledgeFormChange: (form: KnowledgeForm) => void;
  onKnowledgeSuggest: () => Promise<void>;
  onKnowledgeSave: () => Promise<void>;
  onLoadKnowledge: (filters?: { q: string; company: string; topic: string; mastery: string; questionType: string }) => Promise<void>;
  onResetFilters: () => void;
  onSeedQuestionBank: () => Promise<void>;
  onUpdateKnowledgeProgress: (cardId: number, mastery: number, markReviewed?: boolean) => Promise<void>;
  onFilterQChange: (q: string) => void;
}

const inputCls = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaCls = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[112px] resize-y leading-relaxed";
const btnPrimary = "flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60";
const btnSecondary = "flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-60";
const btnGhost = "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft disabled:opacity-60";

export function KnowledgeView({
  cards,
  companies,
  topics,
  knowledgeForm,
  knowledgeSuggestion,
  filters,
  busy,
  onKnowledgeFormChange,
  onKnowledgeSuggest,
  onKnowledgeSave,
  onLoadKnowledge,
  onResetFilters,
  onSeedQuestionBank,
  onUpdateKnowledgeProgress,
  onFilterQChange,
}: KnowledgeViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <Panel title="录入八股" icon={<Sparkles size={16} />}>
        <div className="grid gap-3">
          <Field label="题目">
            <textarea
              className={textareaCls}
              placeholder="面试题"
              value={knowledgeForm.question}
              onChange={(e) => onKnowledgeFormChange({ ...knowledgeForm, question: e.target.value })}
            />
          </Field>
          <Field label="答案">
            <textarea
              className={textareaCls}
              placeholder="自己的答案或参考答案"
              value={knowledgeForm.answer}
              onChange={(e) => onKnowledgeFormChange({ ...knowledgeForm, answer: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="公司">
              <input
                className={inputCls}
                list="company-options"
                placeholder="可选"
                value={knowledgeForm.companyName}
                onChange={(e) => onKnowledgeFormChange({ ...knowledgeForm, companyName: e.target.value })}
              />
            </Field>
            <Field label="主题">
              <input
                className={inputCls}
                list="topic-options"
                placeholder="可选"
                value={knowledgeForm.topicName}
                onChange={(e) => onKnowledgeFormChange({ ...knowledgeForm, topicName: e.target.value })}
              />
            </Field>
          </div>
          {knowledgeSuggestion && (
            <article className="rounded-lg border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold">AI 建议：{knowledgeSuggestion.questionType}</h4>
                <Pill variant="accent">优先级 {knowledgeSuggestion.priorityScore}</Pill>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {knowledgeSuggestion.tags.map((tag) => (
                  <Pill key={tag}>{tag}</Pill>
                ))}
              </div>
            </article>
          )}
          <div className="flex gap-2">
            <button className={btnSecondary} type="button" onClick={() => void onKnowledgeSuggest()} disabled={busy === "knowledge-suggest"}>
              <Sparkles size={15} />
              AI 建议
            </button>
            <button className={btnPrimary} type="button" onClick={() => void onKnowledgeSave()} disabled={busy === "knowledge-save"}>
              <Save size={15} />
              保存
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="学习卡" icon={<BookOpen size={16} />}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={inputCls + " flex-1 min-w-[180px]"}
            placeholder="搜索八股"
            value={filters.q}
            onChange={(e) => onFilterQChange(e.target.value)}
          />
          <button className={btnSecondary} type="button" onClick={() => void onLoadKnowledge()}>
            <Search size={15} />
            搜索
          </button>
          <button className={btnGhost} type="button" onClick={onResetFilters}>
            全部
          </button>
          <button className={btnSecondary} type="button" onClick={() => void onSeedQuestionBank()} disabled={busy === "seed-bank"}>
            <Sparkles size={15} />
            导入题库
          </button>
        </div>
        <CardList cards={cards} onProgress={onUpdateKnowledgeProgress} />
      </Panel>
    </div>
  );
}
```

- [ ] **Step 4: Create `resume-view.tsx`**

```tsx
"use client";

import { FileText, Layers3, Sparkles } from "lucide-react";
import { Panel } from "@/app/components/shared/panel";
import { Field } from "@/app/components/shared/field";
import { DataGroup } from "@/app/components/shared/data-group";
import { Pill } from "@/app/components/shared/pill";
import { TextList } from "@/app/components/shared/text-list";
import type { ResumeProfile } from "@/app/types";

interface ResumeViewProps {
  resumes: ResumeProfile[];
  selectedResume: ResumeProfile | null;
  selectedResumeId: number | null;
  resumeText: string;
  busy: string | null;
  onResumeTextChange: (text: string) => void;
  onSelectedResumeIdChange: (id: number | null) => void;
  onResumeParse: () => Promise<void>;
}

export function ResumeView({
  resumes,
  selectedResume,
  selectedResumeId,
  resumeText,
  busy,
  onResumeTextChange,
  onSelectedResumeIdChange,
  onResumeParse,
}: ResumeViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title="贴简历" icon={<FileText size={16} />}>
        <div className="grid gap-3">
          <Field label="简历">
            <textarea
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[300px] resize-y leading-relaxed"
              placeholder="粘贴简历文本"
              value={resumeText}
              onChange={(e) => onResumeTextChange(e.target.value)}
            />
          </Field>
          <button
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            type="button"
            onClick={() => void onResumeParse()}
            disabled={busy === "resume-parse"}
          >
            <Sparkles size={15} />
            解析简历
          </button>
        </div>
      </Panel>

      <Panel title="结构化简历" icon={<Layers3 size={16} />}>
        <select
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          value={selectedResumeId ?? ""}
          onChange={(e) => onSelectedResumeIdChange(e.target.value ? Number(e.target.value) : null)}
        >
          {resumes.length === 0 && <option value="">暂无简历</option>}
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
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
                {selectedResume.parsed.skills.map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
              </div>
            </DataGroup>
            <DataGroup title="项目">
              <TextList values={selectedResume.parsed.projects} />
            </DataGroup>
            <DataGroup title="补充问题">
              <TextList values={selectedResume.followUpQuestions} />
            </DataGroup>
          </div>
        )}
      </Panel>
    </div>
  );
}
```

- [ ] **Step 5: Create `interview-view.tsx`**

```tsx
"use client";

import {
  CheckCircle2,
  Mic,
  Play,
  Send,
  Target,
} from "lucide-react";
import { Panel } from "@/app/components/shared/panel";
import { Pill } from "@/app/components/shared/pill";
import { Field } from "@/app/components/shared/field";
import { scoreOrDash } from "@/app/helpers";
import { interviewModeLabels, roundTypeLabels } from "@/lib/interview-modes";
import type {
  InterviewMode,
  InterviewSession,
  InterviewTurn,
  JobTarget,
  RoundType,
} from "@/app/types";
import { cn } from "@/lib/utils";

interface InterviewViewProps {
  interviewMode: InterviewMode;
  roundType: RoundType;
  deliveryMode: "text" | "voice";
  selectedJobTarget: JobTarget | null;
  jobTargets: JobTarget[];
  activeSession: InterviewSession | null;
  answerText: string;
  voiceHint: string;
  answerDurationSec: number;
  busy: string | null;
  onInterviewModeChange: (mode: InterviewMode) => void;
  onRoundTypeChange: (type: RoundType) => void;
  onDeliveryModeChange: (mode: "text" | "voice") => void;
  onSelectedJobTargetIdChange: (id: number | null) => void;
  onStartInterview: () => Promise<void>;
  onSubmitAnswer: () => Promise<void>;
  onFinishInterview: () => Promise<void>;
  onTranscribe: () => Promise<void>;
  onAnswerTextChange: (text: string) => void;
  onVoiceHintChange: (text: string) => void;
  onAnswerDurationSecChange: (sec: number) => void;
  onTabChange: (tab: "targets") => void;
}

const btnPrimary = "flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60";
const btnSecondary = "flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-60";
const btnAccent = "flex items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-60";
const btnGhost = "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft";
const inputCls = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaCls = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[112px] resize-y leading-relaxed";

export function InterviewView({
  interviewMode,
  roundType,
  deliveryMode,
  selectedJobTarget,
  jobTargets,
  activeSession,
  answerText,
  voiceHint,
  answerDurationSec,
  busy,
  onInterviewModeChange,
  onRoundTypeChange,
  onDeliveryModeChange,
  onSelectedJobTargetIdChange,
  onStartInterview,
  onSubmitAnswer,
  onFinishInterview,
  onTranscribe,
  onAnswerTextChange,
  onVoiceHintChange,
  onAnswerDurationSecChange,
  onTabChange,
}: InterviewViewProps) {
  const openTurn = activeSession?.turns.find((turn) => !turn.answer) ?? null;
  const answeredTurns = activeSession?.turns.filter((turn) => turn.answer).length ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(300px,390px)_1fr]">
      <Panel title="开始模拟" icon={<Target size={16} />}>
        <div className="grid gap-3">
          <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
            {(Object.keys(interviewModeLabels) as InterviewMode[]).map((mode) => (
              <button
                className={cn(
                  "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                  interviewMode === mode
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground",
                )}
                key={mode}
                onClick={() => onInterviewModeChange(mode)}
                type="button"
              >
                {interviewModeLabels[mode]}
              </button>
            ))}
          </div>
          <div className="flex gap-2" role="group" aria-label="回答方式">
            <button
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                deliveryMode === "text" ? "border-primary bg-primary-soft text-primary-hover" : "border-border bg-surface text-muted hover:text-foreground",
              )}
              type="button"
              onClick={() => onDeliveryModeChange("text")}
            >
              文本
            </button>
            <button
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                deliveryMode === "voice" ? "border-primary bg-primary-soft text-primary-hover" : "border-border bg-surface text-muted hover:text-foreground",
              )}
              type="button"
              onClick={() => onDeliveryModeChange("voice")}
            >
              语音模拟
            </button>
          </div>
          <Field label="岗位目标">
            <select
              className={inputCls}
              value={selectedJobTarget?.id ?? ""}
              onChange={(e) => onSelectedJobTargetIdChange(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">不使用岗位目标</option>
              {jobTargets.map((t) => (
                <option key={t.id} value={t.id}>{t.company?.name ?? "未命名公司"} / {t.roleName}</option>
              ))}
            </select>
          </Field>
          <Field label="轮次">
            <select
              className={inputCls}
              value={roundType}
              onChange={(e) => onRoundTypeChange(e.target.value as RoundType)}
            >
              {(Object.keys(roundTypeLabels) as RoundType[]).map((type) => (
                <option key={type} value={type}>{roundTypeLabels[type]}</option>
              ))}
            </select>
          </Field>
          <div className="flex items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            <Target size={14} />
            <span>
              {selectedJobTarget
                ? `${selectedJobTarget.company?.name ?? "未命名公司"} / ${selectedJobTarget.roleName}`
                : "未选择岗位目标"}
            </span>
          </div>
          <button className={btnPrimary} type="button" onClick={() => void onStartInterview()} disabled={busy === "interview-start"}>
            <Play size={15} />
            开始
          </button>
          {!selectedJobTarget && (
            <button className={btnGhost} type="button" onClick={() => onTabChange("targets")}>
              先建目标
            </button>
          )}
        </div>
      </Panel>

      <div className="flex min-h-[520px] flex-col rounded-lg border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h4 className="text-base font-semibold">
            {activeSession
              ? `${interviewModeLabels[activeSession.mode]} / ${roundTypeLabels[activeSession.roundType]}`
              : "面试对话"}
          </h4>
          {activeSession && <Pill variant="brand">{activeSession.status}</Pill>}
        </div>
        <div className="flex-1 space-y-3 overflow-auto p-5">
          {!activeSession ? (
            <div className="py-8 text-center text-sm text-muted">暂无面试</div>
          ) : (
            activeSession.turns.map((turn) => (
              <div key={turn.id}>
                <div className="mr-auto max-w-[82%] rounded-xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {turn.question}
                </div>
                {turn.answer && (
                  <div className="ml-auto max-w-[82%] rounded-xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-wrap">
                    {turn.answer}
                  </div>
                )}
                {turn.feedback && (
                  <TurnFeedback turn={turn} />
                )}
              </div>
            ))
          )}
          {activeSession?.summary && (
            <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
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
                  <input className={inputCls} value={voiceHint} onChange={(e) => onVoiceHintChange(e.target.value)} />
                </Field>
                <Field label="时长秒">
                  <input className={inputCls} type="number" min={15} value={answerDurationSec} onChange={(e) => onAnswerDurationSecChange(Number(e.target.value))} />
                </Field>
              </div>
              <button className={btnSecondary} type="button" onClick={() => void onTranscribe()} disabled={busy === "transcribe"}>
                <Mic size={15} />
                模拟转写
              </button>
            </div>
          )}
          {openTurn && activeSession?.status !== "finished" ? (
            <>
              <textarea className={textareaCls} placeholder="输入回答" value={answerText} onChange={(e) => onAnswerTextChange(e.target.value)} />
              <div className="flex gap-2">
                <button className={btnPrimary} type="button" onClick={() => void onSubmitAnswer()} disabled={busy === "interview-answer"}>
                  <Send size={15} />
                  提交
                </button>
                <button className={btnAccent} type="button" onClick={() => void onFinishInterview()} disabled={answeredTurns === 0 || busy === "interview-finish"}>
                  <CheckCircle2 size={15} />
                  结束
                </button>
              </div>
            </>
          ) : (
            <button className={btnAccent} type="button" onClick={() => void onFinishInterview()} disabled={!activeSession || activeSession.status === "finished"}>
              <CheckCircle2 size={15} />
              生成复盘
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TurnFeedback({ turn }: { turn: InterviewTurn }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h5 className="text-sm font-semibold">第 {turn.order} 题诊断</h5>
        <Pill variant="accent">准确 {scoreOrDash(turn.score.accuracy)}</Pill>
      </div>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed">{turn.feedback}</p>
      {turn.betterAnswer && (
        <p className="mt-1 text-sm text-slate-500 leading-relaxed">{turn.betterAnswer}</p>
      )}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Pill>结构 {scoreOrDash(turn.score.structure)}</Pill>
        <Pill>深度 {scoreOrDash(turn.score.depth)}</Pill>
        <Pill>JD {scoreOrDash(turn.score.jobRelevance)}</Pill>
        <Pill>表达 {scoreOrDash(turn.score.expressionClarity)}</Pill>
      </div>
    </article>
  );
}
```

- [ ] **Step 6: Create `sprint-view.tsx`**

```tsx
"use client";

import { CalendarDays, Sparkles } from "lucide-react";
import { Panel } from "@/app/components/shared/panel";
import { SprintList } from "@/app/components/shared/sprint-list";
import { cn } from "@/lib/utils";
import type { JobTarget, SprintPlan, SprintTask } from "@/app/types";

interface SprintViewProps {
  sprintPlans: SprintPlan[];
  selectedJobTarget: JobTarget | null;
  jobTargets: JobTarget[];
  sprintDays: number;
  busy: string | null;
  onSelectedJobTargetIdChange: (id: number | null) => void;
  onSprintDaysChange: (days: number) => void;
  onGenerateSprint: () => Promise<void>;
  onUpdateTaskStatus: (taskId: number, status: SprintTask["status"]) => Promise<void>;
}

export function SprintView({
  sprintPlans,
  selectedJobTarget,
  jobTargets,
  sprintDays,
  busy,
  onSelectedJobTargetIdChange,
  onSprintDaysChange,
  onGenerateSprint,
  onUpdateTaskStatus,
}: SprintViewProps) {
  return (
    <div className="grid gap-4">
      <Panel title="生成冲刺计划" icon={<CalendarDays size={16} />}>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            value={selectedJobTarget?.id ?? ""}
            onChange={(e) => onSelectedJobTargetIdChange(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">选择岗位目标</option>
            {jobTargets.map((t) => (
              <option key={t.id} value={t.id}>{t.company?.name ?? "未命名公司"} / {t.roleName}</option>
            ))}
          </select>
          <div className="flex gap-2" role="group" aria-label="冲刺天数">
            {[3, 7, 14].map((days) => (
              <button
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  sprintDays === days
                    ? "border-primary bg-primary-soft text-primary-hover"
                    : "border-border bg-surface text-muted hover:text-foreground",
                )}
                key={days}
                type="button"
                onClick={() => onSprintDaysChange(days)}
              >
                {days}天
              </button>
            ))}
          </div>
          <button
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            type="button"
            onClick={() => void onGenerateSprint()}
            disabled={busy === "sprint-generate"}
          >
            <Sparkles size={15} />
            生成
          </button>
        </div>
      </Panel>
      <SprintList plans={sprintPlans} onTaskStatus={onUpdateTaskStatus} />
    </div>
  );
}
```

- [ ] **Step 7: Create `review-view.tsx`**

```tsx
"use client";

import { BarChart3, RefreshCcw } from "lucide-react";
import { Panel } from "@/app/components/shared/panel";
import { ScoreCard } from "@/app/components/shared/score-card";
import { ReviewList } from "@/app/components/review/review-list";
import { scoreOrDash } from "@/app/helpers";
import type { InterviewSession, ReviewCard } from "@/app/types";

interface ReviewViewProps {
  reviewCards: ReviewCard[];
  latestFinishedSession: InterviewSession | null;
  onLoadReviews: () => Promise<void>;
}

export function ReviewView({
  reviewCards,
  latestFinishedSession,
  onLoadReviews,
}: ReviewViewProps) {
  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">复盘</h3>
          <p className="mt-1 text-sm text-muted">低分题、薄弱点和待补八股会集中在这里。</p>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-slate-50 hover:text-foreground"
          type="button"
          onClick={() => void onLoadReviews()}
        >
          <RefreshCcw size={15} />
          刷新
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
            {latestFinishedSession.turns
              .filter((turn) => turn.answer)
              .slice(0, 5)
              .map((turn) => (
                <article key={turn.id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h5 className="text-sm font-semibold">
                      第 {turn.order} 题：{turn.question}
                    </h5>
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                      准确 {scoreOrDash(turn.score.accuracy)}
                    </span>
                  </div>
                  {turn.feedback && (
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{turn.feedback}</p>
                  )}
                  {turn.betterAnswer && (
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">{turn.betterAnswer}</p>
                  )}
                </article>
              ))}
          </div>
        </Panel>
      )}
      <ReviewList cards={reviewCards} />
    </div>
  );
}
```

- [ ] **Step 8: Create `lab-view.tsx`**

```tsx
"use client";

import { ClipboardList, Code2, GitBranch, Play, Sparkles, Users } from "lucide-react";
import { Panel } from "@/app/components/shared/panel";
import { Pill } from "@/app/components/shared/pill";
import { DataGroup } from "@/app/components/shared/data-group";
import { TextList } from "@/app/components/shared/text-list";
import { LabList } from "@/app/components/lab/lab-list";
import { cn } from "@/lib/utils";
import type { JobTarget, LabSession, LabType } from "@/app/types";

interface LabViewProps {
  labType: LabType;
  labRole: string;
  activeLab: LabSession | null;
  labSessions: LabSession[];
  labContent: string;
  selectedJobTarget: JobTarget | null;
  targetRole: string;
  busy: string | null;
  onLabTypeChange: (type: LabType) => void;
  onLabRoleChange: (role: string) => void;
  onStartLab: () => Promise<void>;
  onSubmitLab: () => Promise<void>;
  onLabContentChange: (content: string) => void;
  onActiveLabIdChange: (id: number) => void;
}

function labIcon(type: LabType) {
  if (type === "peer_mock") return <Users size={16} />;
  if (type === "system_design") return <GitBranch size={16} />;
  return <Code2 size={16} />;
}

export function LabView({
  labType,
  labRole,
  activeLab,
  labSessions,
  labContent,
  selectedJobTarget,
  targetRole,
  busy,
  onLabTypeChange,
  onLabRoleChange,
  onStartLab,
  onSubmitLab,
  onLabContentChange,
  onActiveLabIdChange,
}: LabViewProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Panel title="训练实验室" icon={<Code2 size={16} />}>
          <div className="grid gap-3">
            <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
              {(["coding", "system_design", "peer_mock"] as LabType[]).map((type) => (
                <button
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                    labType === type ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
                  )}
                  key={type}
                  onClick={() => onLabTypeChange(type)}
                  type="button"
                >
                  {type === "coding" ? "代码" : type === "system_design" ? "白板" : "同伴"}
                </button>
              ))}
            </div>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">岗位方向</span>
              <input
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={selectedJobTarget?.roleName ?? "可选"}
                value={labRole}
                onChange={(e) => onLabRoleChange(e.target.value)}
              />
            </label>
            <button
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              type="button"
              onClick={() => void onStartLab()}
              disabled={busy === "lab-start"}
            >
              <Play size={15} />
              新建练习
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
                className={cn(
                  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[300px] resize-y leading-relaxed",
                  activeLab.type === "coding" && "font-mono text-[13px]",
                )}
                value={labContent}
                onChange={(e) => onLabContentChange(e.target.value)}
              />
              <button
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
                type="button"
                onClick={() => void onSubmitLab()}
                disabled={busy === "lab-submit"}
              >
                <Sparkles size={15} />
                生成反馈
              </button>
              {typeof activeLab.feedback.score === "number" && (
                <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h5 className="text-sm font-semibold">练习反馈</h5>
                    <Pill variant="accent">得分 {activeLab.feedback.score}</Pill>
                  </div>
                  <DataGroup title="优点">
                    <TextList values={activeLab.feedback.strengths ?? []} />
                  </DataGroup>
                  <DataGroup title="缺口">
                    <TextList values={activeLab.feedback.gaps ?? []} />
                  </DataGroup>
                  {activeLab.feedback.nextAction && (
                    <p className="text-sm text-slate-500 leading-relaxed">{activeLab.feedback.nextAction}</p>
                  )}
                </article>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="最近练习" icon={<ClipboardList size={16} />}>
        <LabList sessions={labSessions} activeId={activeLab?.id ?? null} onSelect={onActiveLabIdChange} />
      </Panel>
    </div>
  );
}
```

- [ ] **Step 9: Create `trends-view.tsx`**

```tsx
"use client";

import { BarChart3, Tags } from "lucide-react";
import { Panel } from "@/app/components/shared/panel";
import { ScoreCard } from "@/app/components/shared/score-card";
import { SessionList } from "@/app/components/shared/session-list";
import { WeaknessList } from "@/app/components/trends/weakness-list";
import type { InterviewSession, KnowledgeCard, ReviewCard } from "@/app/types";

interface TrendsViewProps {
  averageInterviewScore: number;
  sprintDoneRate: number;
  cards: KnowledgeCard[];
  reviewCards: ReviewCard[];
  todoReviewCount: number;
  sessions: InterviewSession[];
}

export function TrendsView({
  averageInterviewScore,
  sprintDoneRate,
  cards,
  reviewCards,
  todoReviewCount,
  sessions,
}: TrendsViewProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScoreCard label="平均模拟分" value={averageInterviewScore} />
        <ScoreCard label="复习完成率" value={sprintDoneRate} />
        <ScoreCard
          label="掌握度达标"
          value={cards.length ? Math.round((cards.filter((c) => c.mastery >= 3).length / cards.length) * 100) : 0}
        />
        <ScoreCard
          label="错题清理率"
          value={reviewCards.length ? Math.round(((reviewCards.length - todoReviewCount) / reviewCards.length) * 100) : 0}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="最近面试趋势" icon={<BarChart3 size={16} />}>
          <SessionList sessions={sessions.slice(0, 12)} />
        </Panel>
        <Panel title="薄弱主题" icon={<Tags size={16} />}>
          <WeaknessList reviewCards={reviewCards} />
        </Panel>
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Commit**

```bash
git add app/components/targets/ app/components/prep/ app/components/knowledge/knowledge-view.tsx app/components/resume/ app/components/interview/ app/components/sprint/ app/components/review/review-view.tsx app/components/lab/lab-view.tsx app/components/trends/trends-view.tsx
git commit -m "feat: add all view components for each tab"
```

---

## Task 10: Rewrite page.tsx as orchestrator

**Files:**
- Modify: `app/page.tsx` (complete rewrite)

This is the big swap. Replace the entire 1835-line page.tsx with a slim orchestrator that imports all components and delegates rendering.

- [ ] **Step 1: Rewrite page.tsx**

The new page.tsx keeps all state and handler functions, but replaces the JSX render with component imports. It should be approximately 300 lines. Structure:

1. Imports (types, helpers, components)
2. Home() function with all useState/useEffect/handlers (kept from original)
3. Render: `<Topbar>` + `<main>` with conditional view components
4. Toast/loading overlay

Key changes from original:
- Remove all inline component function definitions (Metric, Panel, Field, ResumeSelect, DataGroup, TextList, PillLine, ScoreCard, CardList, ReviewList, SessionList, SprintList, LabList, WeaknessList)
- Remove all type definitions (now in types.ts)
- Remove all helper functions (now in helpers.ts)
- Remove all CSS class references, use imported components instead
- Replace sidebar with `<Topbar>`
- Replace `<main className="main">` with `<main className="mx-auto max-w-6xl px-6 py-8">`

The render section should look like:

```tsx
return (
  <div className="min-h-screen">
    <Topbar activeTab={activeTab} onTabChange={setActiveTab} onRefresh={() => void refreshAll()} />

    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Interview AI</p>
          <h2 className="mt-1 text-2xl font-semibold">{pageLabels[activeTab]}</h2>
          <p className="mt-2 text-sm text-muted">贴 JD、存八股、做模拟、看复盘。</p>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard icon={<BriefcaseBusiness size={15} />} label="岗位目标" value={jobTargets.length} />
        <MetricCard icon={<BookOpen size={15} />} label="低掌握卡" value={lowMasteryCount} />
        <MetricCard icon={<ListChecks size={15} />} label="待复习" value={todoReviewCount} />
        <MetricCard icon={<Gauge size={15} />} label="平均分" value={averageInterviewScore} />
      </div>

      {/* Tab views */}
      {activeTab === "targets" && <TargetsView ... />}
      {activeTab === "prep" && <PrepView ... />}
      {activeTab === "knowledge" && <KnowledgeView ... />}
      {activeTab === "resume" && <ResumeView ... />}
      {activeTab === "interview" && <InterviewView ... />}
      {activeTab === "sprint" && <SprintView ... />}
      {activeTab === "review" && <ReviewView ... />}
      {activeTab === "lab" && <LabView ... />}
      {activeTab === "trends" && <TrendsView ... />}
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
      <div className="fixed bottom-5 right-5 z-10 rounded-lg border border-border bg-surface p-3.5 shadow-md">
        <LoadingSpinner />
      </div>
    )}
    {toast && !busy && (
      <div className="fixed bottom-5 right-5 z-10 max-w-[420px] rounded-lg border border-border bg-surface p-3.5 shadow-md">
        {toast}
      </div>
    )}
  </div>
);
```

Each view component receives its specific props. The full list of prop bindings per view:

**TargetsView**: dailyData, learningPath, jdCompanyName, jdRoleName, jdText, selectedResume, jobTargets, busy, setJdCompanyName, setJdRoleName, setJdText, handleJobTargetParse, setSelectedJobTargetId, setActiveTab, loadCompanyPrep, updateKnowledgeProgress

**PrepView**: companies, prepCompanyId, companyPrep, busy, setPrepCompanyId, loadCompanyPrep, updateKnowledgeProgress, updateTaskStatus

**KnowledgeView**: cards, companies, topics, knowledgeForm, knowledgeSuggestion, filters, busy, setKnowledgeForm, handleKnowledgeSuggest, handleKnowledgeSave, loadKnowledge, (resetFilters callback), handleSeedQuestionBank, updateKnowledgeProgress, setFilters

**ResumeView**: resumes, selectedResume, selectedResumeId, resumeText, busy, setResumeText, setSelectedResumeId, handleResumeParse

**InterviewView**: interviewMode, roundType, deliveryMode, selectedJobTarget, jobTargets, activeSession, answerText, voiceHint, answerDurationSec, busy, setInterviewMode, setRoundType, setDeliveryMode, setSelectedJobTargetId, handleStartInterview, handleSubmitAnswer, handleFinishInterview, handleTranscribe, setAnswerText, setVoiceHint, setAnswerDurationSec, setActiveTab("targets")

**SprintView**: sprintPlans, selectedJobTarget, jobTargets, sprintDays, busy, setSelectedJobTargetId, setSprintDays, handleGenerateSprint, updateTaskStatus

**ReviewView**: reviewCards, latestFinishedSession, loadReviews

**LabView**: labType, labRole, activeLab, labSessions, labContent, selectedJobTarget, targetRole, busy, setLabType, setLabRole, handleStartLab, handleSubmitLab, setLabContent, setActiveLabId

**TrendsView**: averageInterviewScore, sprintDoneRate, cards, reviewCards, todoReviewCount, sessions

- [ ] **Step 2: Verify the app compiles and loads**

Run:
```bash
npm run dev
```

Expected: app loads with new topbar, all tabs render correctly with Tailwind styling. Check each tab for visual correctness.

- [ ] **Step 3: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: rewrite page.tsx as orchestrator with extracted components and Tailwind styling"
```

---

## Task 11: Responsive polish and final verification

**Files:**
- May modify: various component files for responsive tweaks

- [ ] **Step 1: Test on mobile viewport (680px and below)**

Open the app in a browser at `http://localhost:3000`. Use browser dev tools to test at:
- 375px (mobile)
- 768px (tablet)
- 1280px (desktop)

Verify:
- Topbar tabs scroll horizontally on narrow screens
- All two-column layouts collapse to single column
- Buttons and inputs remain usable
- Text remains readable

If any layout issues are found, add responsive Tailwind classes to the affected components.

- [ ] **Step 2: Test all interactive flows**

Click through each tab and verify:
- "准备" tab: JD form submission, daily tasks display
- "八股" tab: knowledge form, search, AI suggest
- "简历" tab: resume paste and parse
- "模拟" tab: interview configuration, chat UI, answer submission
- "复盘" tab: review cards display
- "实验室" tab: lab creation, submission
- All loading states show the spinner toast
- All error states show the toast message

- [ ] **Step 3: Run existing tests**

Run:
```bash
npm test
```

Expected: all existing tests pass (they test server-side logic which should be unaffected).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete frontend redesign with Tailwind CSS + shadcn/ui"
```
