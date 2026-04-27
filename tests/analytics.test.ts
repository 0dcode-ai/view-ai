import { describe, expect, it } from "vitest";
import { analyzeExpression, averageScore, readinessScore } from "@/lib/analytics";

describe("analytics helpers", () => {
  it("calculates expression signals from text answers", () => {
    const metrics = analyzeExpression("首先介绍背景，然后说明方案，最后补充结果。这个项目优化了接口延迟。", 60);

    expect(metrics.answerLength).toBeGreaterThan(10);
    expect(metrics.estimatedWordsPerMinute).toBeGreaterThan(0);
    expect(metrics.structureCompleteness).toBeGreaterThan(40);
  });

  it("averages detailed score objects", () => {
    expect(averageScore({ accuracy: 4, depth: 2, structure: 3 })).toBe(3);
    expect(averageScore({})).toBe(0);
  });

  it("combines company readiness dimensions", () => {
    const score = readinessScore({
      jdMatchScore: 80,
      knowledgeTotal: 10,
      masteredKnowledge: 5,
      finishedSessions: 2,
      todoReviews: 1,
      totalReviews: 4,
    });

    expect(score.overall).toBeGreaterThan(50);
    expect(score.coverage).toBe(50);
  });
});
