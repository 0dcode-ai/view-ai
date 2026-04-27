# Frontend Redesign: Modern Minimalist UI

## Summary

Redesign the interview preparation tool ("面试训练台") from its current blue glassmorphism dashboard to a modern minimalist interface inspired by Linear/Notion. Scope includes visual overhaul with Tailwind CSS + shadcn/ui, component extraction from the monolithic page.tsx, and layout change from sidebar to top navigation.

## Goals

- Achieve a clean, professional aesthetic with blue-gray tones and restrained color usage
- Break the 1472-line page.tsx into ~20 focused component files
- Replace hand-written CSS with Tailwind utilities and shadcn/ui components
- Switch from sidebar layout to top navigation bar
- Introduce Inter font for consistent typography

## Non-goals

- Adding new features or changing existing functionality
- Changing the API layer, database schema, or backend logic
- Adding dark mode (can be a follow-up)
- Changing state management approach (keep useState in page.tsx)

## Tech Stack Changes

### Add

- **Tailwind CSS v4** — utility-first styling, replaces all hand-written CSS
- **shadcn/ui** — headless UI primitives (Button, Card, Input, Textarea, Badge, Select, etc.)
- **@radix-ui/*** — installed as shadcn/ui peer dependencies
- **class-variance-authority (cva)** — for shadcn component variants
- **clsx + tailwind-merge** — for className composition via `cn()` utility

### Remove

- **globals.css** — will be reduced from 879 lines to ~50 lines (Tailwind base + custom vars)
- All hand-written CSS classes (`.app-shell`, `.sidebar`, `.panel`, `.btn`, etc.)

### Keep

- **lucide-react** — icons
- **Next.js App Router** — framework
- **All existing dependencies** (zod, prisma, etc.)

## Design System

### Color Palette

| Role        | Token            | Value                  | Usage                     |
|-------------|------------------|------------------------|---------------------------|
| Background  | `--background`   | `#f8fafc` (Slate 50)  | Page background           |
| Surface     | `--card`         | `#ffffff`              | Cards, panels             |
| Primary text| `--foreground`   | `#0f172a` (Slate 900) | Titles, body text         |
| Muted text  | `--muted`        | `#64748b` (Slate 500) | Descriptions, labels      |
| Border      | `--border`       | `#e2e8f0` (Slate 200) | Dividers, card borders    |
| Brand       | `--primary`      | `#3b82f6` (Blue 500)  | Buttons, links, active    |
| Brand hover | `--primary-hover`| `#1d4ed8` (Blue 700)  | Hover states              |
| Brand bg    | `--primary-soft` | `#eff6ff` (Blue 50)   | Background tint           |
| Success     | `--success`      | `#22c55e` (Green 500) | Completed states          |
| Warning     | `--warning`      | `#f59e0b` (Amber 500) | Alerts                    |
| Danger      | `--destructive`  | `#ef4444` (Red 500)   | Errors, delete            |

### Typography

- **Font**: Inter via `next/font/google`, system fallback for CJK
- **Scale**: Tailwind default (14px base)
  - Page title: `text-2xl font-semibold` (24px)
  - Section title: `text-lg font-semibold` (18px)
  - Body: `text-sm` (14px)
  - Caption/label: `text-xs` (12px)
- **Weight range**: 400 (regular), 500 (medium), 600 (semibold)

### Spacing & Layout

- Grid: 4px base, use Tailwind spacing scale
- Content max-width: `max-w-6xl` (1152px), centered with `mx-auto`
- Page padding: `px-6 py-8` (24px horizontal, 32px vertical)
- Card padding: `p-5` (20px)
- Gap between cards: `gap-4` (16px)

### Border Radius

- Cards/panels: `rounded-lg` (8px)
- Buttons: `rounded-md` (6px)
- Inputs: `rounded-md` (6px)
- Pills/badges: `rounded-full`

### Shadows

- Cards: `shadow-sm` — subtle, flat
- Topbar: `shadow-sm` + border-bottom — not floating, just separated
- No glassmorphism, no backdrop-filter blur, no gradients on surfaces

### Motion

- Use Tailwind's `transition-colors` for interactive state changes
- Keep it minimal — no heavy animations

## Layout: Top Navigation Bar

```
┌─────────────────────────────────────────────────────────┐
│  ◆ 面试AI    准备  八股  简历  模拟  复盘               │
├─────────────────────────────────────────────────────────┤
│                  max-w-6xl mx-auto                       │
│                                                         │
│  Page Title + Description                                │
│                                                         │
│  [Metric] [Metric] [Metric] [Metric]                    │
│                                                         │
│  ┌───────────────────────────────────────────┐          │
│  │  Card content                              │          │
│  └───────────────────────────────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Topbar Specification

- Height: `h-14` (56px)
- Background: `bg-white`
- Border: `border-b border-slate-200`
- Position: `sticky top-0 z-50`
- Left side: Brand icon (◆ blue square, rounded) + "面试AI" text
- Right side: Navigation tabs
  - Inactive: `text-slate-500 hover:text-slate-900`
  - Active: `bg-blue-500 text-white rounded-md px-3 py-1.5`
- Padding: `px-6`

### Content Area

- No sidebar — full width
- Content centered with `max-w-6xl mx-auto`
- All existing two-column layouts preserved within the content area

## Component Architecture

### File Structure

```
app/
  layout.tsx                    # Root layout (Inter font, global styles)
  page.tsx                      # Main page — state owner + tab router (~200-300 lines)
  globals.css                   # Tailwind base + CSS vars only (~50 lines)
  components/
    layout/
      topbar.tsx                # Top navigation bar
    shared/
      panel.tsx                 # shadcn Card wrapper
      metric-card.tsx           # Dashboard metric card
      score-bar.tsx             # Progress bar for scores
      pill.tsx                  # Badge/tag pill
      loading-spinner.tsx       # Loading indicator
      toast.tsx                 # Toast notification
    targets/
      targets-view.tsx          # "准备" tab view
      jd-form.tsx               # JD paste/parse form
    prep/
      prep-view.tsx             # "公司备考" tab view
    knowledge/
      knowledge-view.tsx        # "八股" tab view
      knowledge-form.tsx        # Create/edit knowledge card
      card-list.tsx             # Knowledge card list
    resume/
      resume-view.tsx           # "简历" tab view
    interview/
      interview-view.tsx        # "模拟" tab view
      chat-window.tsx           # Chat panel
      chat-bubble.tsx           # Individual message bubble
    sprint/
      sprint-view.tsx           # "计划" tab view
    review/
      review-view.tsx           # "复盘" tab view
    trends/
      trends-view.tsx           # "趋势" tab view
  lib/
    utils.ts                    # cn() utility for Tailwind class merging
```

### Component Interfaces

**page.tsx** owns all state and data fetching. Each view component receives:
- Data as props (cards, sessions, etc.)
- Callbacks for mutations (onSave, onDelete, etc.)
- Loading/error states

Example interface for `KnowledgeView`:
```tsx
interface KnowledgeViewProps {
  cards: KnowledgeCard[];
  companies: CompanyOption[];
  topics: TopicOption[];
  loading: boolean;
  onSave: (data: KnowledgeFormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdateMastery: (id: number, mastery: number) => Promise<void>;
}
```

**Shared components** use shadcn/ui primitives directly and accept `className` for composition.

### Tab Routing

The tab state remains in page.tsx as `activeTab` useState. The topbar receives the current tab and an `onTabChange` callback. Each view component is conditionally rendered based on the active tab. No file-system routing changes.

## shadcn/ui Components to Install

- Button
- Card (CardHeader, CardTitle, CardContent, CardDescription)
- Input
- Textarea
- Select (Select, SelectTrigger, SelectValue, SelectContent, SelectItem)
- Badge
- Separator
- Tabs (optional, may use custom topbar tabs instead)
- Tooltip

## Visual Changes per Component

### Topbar (replaces sidebar)
- **Before**: 252px sidebar with glassmorphism, icons + labels, sticky left
- **After**: 56px sticky top bar, white background, brand left + tabs right

### Metric Cards
- **Before**: White card with blue border, blue text value
- **After**: White card with 3px blue top border accent, slate text, larger number

### Panel/Card
- **Before**: White card with blue-tinted border, glassmorphism backdrop-filter, gradient header
- **After**: White card with slate-200 border, shadow-sm, clean flat header with text only

### Buttons
- **Before**: Gradient blue-to-cyan with heavy shadow
- **After**: Flat blue-500 background, no gradient, shadow-sm on hover only

### Chat Bubbles
- **Before**: AI on `#eff6ff`, user on `#2563eb` solid, 8px radius
- **After**: AI on `slate-100`, user on `blue-500`, 12px radius (more rounded)

### Tags/Pills
- **Before**: Custom `.pill` class with brand/accent/warn variants
- **After**: shadcn Badge with variant prop

### Forms
- **Before**: Custom `.input` / `.textarea` with blue focus ring
- **After**: shadcn Input / Textarea with consistent focus styles

### Empty States
- **Before**: Dashed border, blue-tinted background
- **After**: Centered text with muted icon, no border

## Responsive Behavior

- **>=1024px**: Full topbar with all tabs visible, two-column layouts
- **768-1023px**: Topbar tabs scroll horizontally, single-column layouts
- **<768px**: Compact topbar, stacked layout, smaller padding

## Implementation Order

1. Install and configure Tailwind CSS v4 + shadcn/ui
2. Create `lib/utils.ts` with `cn()` utility
3. Rewrite `globals.css` to Tailwind base + theme variables
4. Update `layout.tsx` with Inter font
5. Install shadcn components (Button, Card, Input, etc.)
6. Extract `Topbar` component
7. Extract shared components (Panel, MetricCard, etc.)
8. Extract each view component one by one (targets, knowledge, resume, interview, etc.)
9. Wire up all props and callbacks in page.tsx
10. Delete old CSS classes, clean up globals.css
11. Test all tabs and interactions
12. Responsive testing and polish
