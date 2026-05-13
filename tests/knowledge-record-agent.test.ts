import { describe, expect, it, vi } from "vitest";
import { runKnowledgeRecordBatchAgent } from "@/lib/knowledge-record-agent";

const sampleArticle = `
幻觉（Hallucination）是怎么产生的？你有哪些方法可以减轻模型幻觉？
大模型本质是在预测"下一个最可能出现的 Token"，不是在检索事实，所以它天然就会编。
减轻幻觉的核心思路就是减少模型自由发挥的空间，具体几个方向：
第一，用 RAG 把真实资料塞进上下文，让模型基于事实回答，而不是凭记忆瞎编。
第二，用 Function Calling 让模型去调真实接口查数据，别自己编答案，比如问天气就调天气 API。
第三，用 Structured Output 约束输出格式，格式越固定，模型"自由发挥"的空间就越小。
第四，Prompt 里明确说"如果不知道就说不知道"。
第五，多轮验证，让模型自己检查一遍输出，或者用另一个模型做 fact-check。

什么是 Structured Output？如何通过它控制模型输出？
Structured Output 就是让模型按你指定的格式输出，而不是自由文本。
最常见的需求就是输出 JSON，比如做信息提取时需要稳定字段。
更可靠的是用 JSON Schema 约束，字段名、类型、必填项都能卡死。
从聊天走向系统，Structured Output 是关键一步。
`;

describe("knowledge record batch agent", () => {
  it("splits an article with multiple questions into multiple card drafts", async () => {
    vi.stubEnv("AI_PROVIDER", "mock");
    vi.stubEnv("OPENAI_API_KEY", "");

    const payload = await runKnowledgeRecordBatchAgent({
      rawText: sampleArticle,
      extraContext: "偏 AI Agent 面试",
      maxCards: 8,
    });

    expect(payload.execution.usedFallback).toBe(true);
    expect(payload.cardDrafts.length).toBeGreaterThanOrEqual(2);
    expect(payload.cardDrafts.map((draft) => draft.question)).toEqual([
      "幻觉（Hallucination）是怎么产生的？你有哪些方法可以减轻模型幻觉？",
      "什么是 Structured Output？如何通过它控制模型输出？",
    ]);
  });

  it("returns drafts that can be saved as knowledge forms", async () => {
    vi.stubEnv("AI_PROVIDER", "mock");
    vi.stubEnv("OPENAI_API_KEY", "");

    const payload = await runKnowledgeRecordBatchAgent({
      rawText: sampleArticle,
      maxCards: 3,
    });

    for (const draft of payload.cardDrafts) {
      expect(draft.question.length).toBeGreaterThan(4);
      expect(draft.answer.length).toBeGreaterThan(12);
      expect(draft.questionType).toBe("八股");
      expect(draft.difficulty).toBe("medium");
      expect(draft.masterySuggestion).toBeGreaterThanOrEqual(0);
      expect(draft.priorityScore).toBeGreaterThanOrEqual(0);
      expect(draft.note).toContain("## 一句话结论");
      expect(draft.note).toContain("## 思路");
      expect(draft.note).toContain("## 步骤");
      expect(draft.note).toContain("## 复杂度与取舍");
      expect(draft.note).toContain("常见追问");
      expect(draft.note).toContain("项目连接");
      expect(draft.studyGuide?.followUps.length).toBeGreaterThan(0);
      expect(draft.studyGuide?.reviewChecklist.length).toBeGreaterThan(0);
    }
  });

  it("respects maxCards in fallback mode", async () => {
    vi.stubEnv("AI_PROVIDER", "mock");
    vi.stubEnv("OPENAI_API_KEY", "");

    const payload = await runKnowledgeRecordBatchAgent({
      rawText: sampleArticle,
      maxCards: 1,
    });

    expect(payload.cardDrafts).toHaveLength(1);
    expect(payload.cardDrafts[0].question).toContain("幻觉");
  });
});
