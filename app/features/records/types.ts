import type { KnowledgeForm, TechnicalArticle } from "@/app/types";
import type { KnowledgeStudyGuide } from "@/lib/knowledge-study-guide";

export type RecordAgentCardDraft = {
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
  studyGuide?: KnowledgeStudyGuide;
};

export type RecordAgentExecution = {
  steps: string[];
  model: string;
  usedFallback: boolean;
};

export type RecordAgentResponse = {
  cardDraft: RecordAgentCardDraft;
  execution: RecordAgentExecution;
};

export type RecordAgentBatchResponse = {
  cardDrafts: RecordAgentCardDraft[];
  execution: RecordAgentExecution;
};

export type RecordAgentMode = "single" | "batch";

export type RecordBatchDraft = KnowledgeForm & {
  draftId: string;
  selected: boolean;
};

export type RecordAgentEditorProps = {
  busy: string | null;
  isOpen: boolean;
  mode: RecordAgentMode;
  recordText: string;
  recordContext: string;
  recordDraft: KnowledgeForm;
  execution: RecordAgentExecution | null;
  articles: TechnicalArticle[];
  articleId: number | null;
  batchMaxCards: number;
  batchDrafts: RecordBatchDraft[];
  onClose: () => void;
  onModeChange: (mode: RecordAgentMode) => void;
  onRecordTextChange: (value: string) => void;
  onRecordContextChange: (value: string) => void;
  onRecordDraftChange: (value: KnowledgeForm) => void;
  onArticleIdChange: (value: number | null) => void;
  onBatchMaxCardsChange: (value: number) => void;
  onGenerateSingle: () => void;
  onGenerateBatch: () => void;
  onSaveSingle: () => void;
  onSaveBatch: () => void;
  onUpdateBatchDraft: (draftId: string, patch: Partial<KnowledgeForm & { selected: boolean }>) => void;
  onRemoveBatchDraft: (draftId: string) => void;
  onSelectAllBatchDrafts: (selected: boolean) => void;
};
