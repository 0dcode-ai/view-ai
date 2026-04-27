import { describe, expect, it } from "vitest";
import { isInterviewMode, isRoundType, questionMix, roundFocus } from "@/lib/interview-modes";

describe("interview modes", () => {
  it("validates supported modes", () => {
    expect(isInterviewMode("resume")).toBe(true);
    expect(isInterviewMode("company")).toBe(true);
    expect(isInterviewMode("mixed")).toBe(true);
    expect(isInterviewMode("random")).toBe(false);
  });

  it("keeps the mixed mode ratio from the product plan", () => {
    expect(questionMix("mixed")).toEqual({ resume: 40, company: 40, general: 20 });
  });

  it("validates and describes interview rounds", () => {
    expect(isRoundType("manager_round")).toBe(true);
    expect(isRoundType("random_round")).toBe(false);
    expect(roundFocus("system_design")).toContain("架构");
  });
});
