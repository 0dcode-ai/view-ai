import type { CompanyOption, KnowledgeCard, KnowledgeForm, TopicOption } from "@/app/types";
import { emptyKnowledgeForm } from "@/app/types";
import { joinTags } from "@/app/helpers";
import type { RecordAgentCardDraft, RecordBatchDraft } from "@/app/features/records/types";

export const emptyRecordAgentDraft: KnowledgeForm = {
  ...emptyKnowledgeForm,
  source: "快速记录 Agent",
  questionType: "八股",
  abilityDimension: "基础知识",
  mastery: 1,
  priorityScore: 72,
};

export function recordAgentDraftToForm(draft: RecordAgentCardDraft): KnowledgeForm {
  return {
    question: draft.question,
    answer: draft.answer,
    companyName: "",
    topicName: draft.topicName,
    roleDirection: "",
    questionType: draft.questionType,
    abilityDimension: draft.abilityDimension,
    mastery: draft.masterySuggestion,
    priorityScore: draft.priorityScore,
    tags: joinTags(draft.tags),
    difficulty: draft.difficulty,
    source: "快速记录 Agent",
    note: draft.note,
  };
}

export function makeRecordBatchDraft(draft: RecordAgentCardDraft, index: number): RecordBatchDraft {
  return {
    ...recordAgentDraftToForm(draft),
    source: "文章拆题 Agent",
    draftId: `${Date.now()}-${index}-${draft.question.slice(0, 12)}`,
    selected: true,
  };
}

export function cardToKnowledgeForm(card: KnowledgeCard): KnowledgeForm {
  return {
    question: card.question,
    answer: card.answer,
    companyName: card.company?.name ?? "",
    topicName: card.topic?.name ?? "",
    roleDirection: card.roleDirection ?? "",
    questionType: card.questionType,
    abilityDimension: card.abilityDimension,
    mastery: card.mastery,
    priorityScore: card.priorityScore,
    tags: joinTags(card.tags),
    difficulty: card.difficulty === "easy" || card.difficulty === "hard" ? card.difficulty : "medium",
    source: card.source ?? "",
    note: card.note ?? "",
  };
}

export function formToSyntheticKnowledgeCard(form: KnowledgeForm, id = -1): KnowledgeCard {
  return {
    id,
    question: form.question || "待生成题目",
    answer: form.answer || "待生成答案",
    roleDirection: form.roleDirection || null,
    questionType: form.questionType || "八股",
    abilityDimension: form.abilityDimension || "基础知识",
    mastery: form.mastery,
    reviewCount: 0,
    mistakeCount: 0,
    priorityScore: form.priorityScore,
    nextReviewAt: null,
    tags: form.tags.split(/[，,\s]+/).map((tag) => tag.trim()).filter(Boolean),
    difficulty: form.difficulty,
    source: form.source || null,
    note: form.note || null,
    company: form.companyName ? ({ id, name: form.companyName } satisfies CompanyOption) : null,
    topic: form.topicName ? ({ id, name: form.topicName } satisfies TopicOption) : null,
    updatedAt: new Date(0).toISOString(),
  };
}
