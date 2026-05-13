import { describe, expect, it } from "vitest";
import { loadLeetCodeInterviewReferenceQuestions } from "@/lib/leetcode-interview-reference";

describe("leetcode interview reference seed", () => {
  it("loads a curated set of rewritten leetcode interview cards", async () => {
    const questions = await loadLeetCodeInterviewReferenceQuestions();

    expect(questions.length).toBeGreaterThanOrEqual(8);
    expect(questions.some((item) => item.source?.includes("LeetCode 官方公开主题"))).toBe(true);
    expect(questions.some((item) => item.question.includes("动态规划"))).toBe(true);
    expect(questions.some((item) => item.question.includes("SQL"))).toBe(true);
  });
});
