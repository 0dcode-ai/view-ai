import { describe, expect, it } from "vitest";
import { nextReviewDate, priorityFromReview } from "./srs";

describe("srs utilities", () => {
  it("schedules later reviews as mastery grows", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const easy = nextReviewDate({ mastery: 0, reviewCount: 0, now });
    const strong = nextReviewDate({ mastery: 4, reviewCount: 0, now });

    expect(strong.getTime()).toBeGreaterThan(easy.getTime());
  });

  it("lowers priority after review and raises it after mistakes", () => {
    expect(priorityFromReview({ priorityScore: 80, mastery: 2, markReviewed: true })).toBeLessThan(80);
    expect(priorityFromReview({ priorityScore: 80, mastery: 2, mistakeDelta: 1 })).toBeGreaterThan(80);
  });
});
