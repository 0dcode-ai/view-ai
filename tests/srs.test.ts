import { describe, expect, it } from "vitest";
import { nextReviewDate, priorityFromReview } from "@/lib/srs";

describe("spaced repetition helpers", () => {
  it("pushes higher mastery cards farther into the future", () => {
    const now = new Date("2026-04-25T00:00:00.000Z");
    const low = nextReviewDate({ mastery: 1, reviewCount: 0, now });
    const high = nextReviewDate({ mastery: 4, reviewCount: 0, now });

    expect(high.getTime()).toBeGreaterThan(low.getTime());
  });

  it("reduces priority after a successful review", () => {
    expect(priorityFromReview({ priorityScore: 80, mastery: 3, markReviewed: true })).toBeLessThan(80);
  });

  it("raises priority after mistakes", () => {
    expect(priorityFromReview({ priorityScore: 50, mastery: 1, mistakeDelta: 2 })).toBe(74);
  });
});
