import { describe, expect, it } from "vitest";
import {
  buildInterviewPlatformBenchmarks,
  summarizeBenchmarkCoverage,
} from "@/lib/interview-platform-benchmarks";

describe("interview platform benchmarks", () => {
  it("marks core market gaps as missing for an empty workspace", () => {
    const items = buildInterviewPlatformBenchmarks({
      knowledgeCount: 0,
      hasResume: false,
      hasJobTarget: false,
      hasCandidatePrep: false,
      hasInterviewerSession: false,
      hasFinishedInterview: false,
      hasInterviewScript: false,
      practiceAnswerCount: 0,
      reviewTodoCount: 0,
      labSessionCount: 0,
    });

    expect(items.find((item) => item.id === "adaptive-jd-resume-mock")?.ourStatus).toBe("missing");
    expect(items.find((item) => item.id === "company-question-bank")?.ourStatus).toBe("missing");
    expect(items.find((item) => item.id === "live-coding-environment")?.ourStatus).toBe("missing");
  });

  it("recognizes strengthened areas when the workspace has interview assets", () => {
    const items = buildInterviewPlatformBenchmarks({
      knowledgeCount: 25,
      hasResume: true,
      hasJobTarget: true,
      hasCandidatePrep: true,
      hasInterviewerSession: true,
      hasFinishedInterview: true,
      hasInterviewScript: true,
      practiceAnswerCount: 4,
      reviewTodoCount: 2,
      labSessionCount: 1,
    });

    expect(items.find((item) => item.id === "adaptive-jd-resume-mock")?.ourStatus).toBe("strong");
    expect(items.find((item) => item.id === "structured-scorecards")?.ourStatus).toBe("strong");
    expect(items.find((item) => item.id === "company-question-bank")?.ourStatus).toBe("strong");
    expect(items.find((item) => item.id === "live-coding-environment")?.ourStatus).toBe("partial");
  });

  it("summarizes coverage and recommends the first missing or partial item", () => {
    const items = buildInterviewPlatformBenchmarks({
      knowledgeCount: 6,
      hasResume: true,
      hasJobTarget: false,
      hasCandidatePrep: false,
      hasInterviewerSession: false,
      hasFinishedInterview: false,
      hasInterviewScript: false,
      practiceAnswerCount: 0,
      reviewTodoCount: 0,
      labSessionCount: 0,
    });
    const summary = summarizeBenchmarkCoverage(items);

    expect(summary.score).toBeGreaterThanOrEqual(0);
    expect(summary.score).toBeLessThanOrEqual(100);
    expect(summary.next?.ourStatus).toBe("missing");
  });
});
