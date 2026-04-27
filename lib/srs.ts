export function nextReviewDate(input: {
  mastery: number;
  reviewCount: number;
  mistakeCount?: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const mastery = Math.max(0, Math.min(4, input.mastery));
  const reviewCount = Math.max(0, input.reviewCount);
  const mistakePenalty = Math.max(0, input.mistakeCount ?? 0);
  const intervals = [1, 2, 4, 7, 14];
  const days = Math.max(1, intervals[mastery] + Math.min(reviewCount, 6) - Math.min(mistakePenalty, 4));

  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export function priorityFromReview(input: {
  priorityScore: number;
  mastery: number;
  markReviewed?: boolean;
  mistakeDelta?: number;
}) {
  const reviewedDelta = input.markReviewed ? -8 - input.mastery * 2 : 0;
  const mistakeDelta = Math.max(0, input.mistakeDelta ?? 0) * 12;
  return Math.max(0, Math.min(100, input.priorityScore + reviewedDelta + mistakeDelta));
}
