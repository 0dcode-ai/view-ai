import { requestJson } from "@/app/helpers";
import type {
  CompanyOption,
  KnowledgeCard,
  KnowledgeForm,
  KnowledgeSuggestion,
  TechnicalArticleListResponse,
  TopicOption,
} from "@/app/types";
import type { RecordAgentBatchResponse, RecordAgentResponse } from "@/app/features/records/types";

export type KnowledgeFilters = {
  q: string;
  company: string;
  topic: string;
  mastery: string;
  questionType: string;
};

export type KnowledgeListResponse = {
  cards: KnowledgeCard[];
  companies: CompanyOption[];
  topics: TopicOption[];
  tags: string[];
};

export type KnowledgeExportPayload = {
  counts?: {
    knowledgeCards?: number;
    interviews?: number;
  };
  [key: string]: unknown;
};

export type SeedQuestionBankResponse = {
  created: number;
  skipped: number;
  total: number;
};

function toQueryString(filters: Partial<Record<string, string>>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function loadKnowledgeCards(filters: KnowledgeFilters) {
  return requestJson<KnowledgeListResponse>(`/api/knowledge${toQueryString(filters)}`);
}

export async function loadKnowledgeArticles() {
  const payload = await requestJson<TechnicalArticleListResponse>("/api/articles");
  return payload.articles;
}

export function suggestKnowledgeCard(input: Pick<KnowledgeForm, "question" | "answer" | "companyName" | "topicName" | "tags">) {
  return requestJson<{ suggestion: KnowledgeSuggestion }>("/api/knowledge/suggest", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createKnowledgeCard(input: KnowledgeForm) {
  return requestJson<{ card: KnowledgeCard }>("/api/knowledge", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createKnowledgeCards(cards: KnowledgeForm[]) {
  return requestJson<{ created: KnowledgeCard[] }>("/api/knowledge/bulk", {
    method: "POST",
    body: JSON.stringify({ cards }),
  });
}

export function generateRecordCard(input: { rawText: string; extraContext: string }) {
  return requestJson<RecordAgentResponse>("/api/knowledge/agent", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function generateRecordCards(input: {
  rawText: string;
  articleId?: number;
  extraContext: string;
  maxCards: number;
}) {
  return requestJson<RecordAgentBatchResponse>("/api/knowledge/agent/batch", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateKnowledgeCardProgress(cardId: number, input: { mastery: number; markReviewed: boolean }) {
  return requestJson(`/api/knowledge/${cardId}/progress`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateKnowledgeCard(cardId: number, input: KnowledgeForm) {
  return requestJson(`/api/knowledge/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteKnowledgeCard(cardId: number) {
  return requestJson(`/api/knowledge/${cardId}`, { method: "DELETE" });
}

export function seedQuestionBank() {
  return requestJson<SeedQuestionBankResponse>("/api/question-bank/seed", {
    method: "POST",
  });
}

export async function exportWorkspaceData() {
  const response = await fetch("/api/export");
  const payload = (await response.json().catch(() => null)) as KnowledgeExportPayload | null;
  if (!response.ok) {
    const errorPayload = payload as { error?: string } | null;
    throw new Error(errorPayload?.error || "导出失败");
  }
  return payload ?? {};
}
