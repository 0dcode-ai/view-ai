export type ExpressionMetrics = {
  answerLength: number;
  estimatedWordsPerMinute: number;
  fillerCount: number;
  structureCompleteness: number;
  pauseHint: string;
};

const fillerWords = ["嗯", "呃", "然后", "就是", "那个", "其实", "怎么说"];

export function analyzeExpression(answer: string, durationSec?: number | null): ExpressionMetrics {
  const clean = answer.trim();
  const answerLength = clean.length;
  const effectiveDuration = Math.max(durationSec ?? Math.ceil(answerLength / 3), 15);
  const estimatedWords = Math.max(Math.round(answerLength / 1.7), 1);
  const estimatedWordsPerMinute = Math.round((estimatedWords / effectiveDuration) * 60);
  const fillerCount = fillerWords.reduce((count, word) => count + occurrences(clean, word), 0);
  const structureMarkers = ["背景", "目标", "方案", "难点", "结果", "复盘", "首先", "其次", "最后"];
  const structureHits = structureMarkers.filter((marker) => clean.includes(marker)).length;
  const structureCompleteness = Math.min(100, Math.round((structureHits / 5) * 100 + Math.min(answerLength / 12, 35)));

  return {
    answerLength,
    estimatedWordsPerMinute,
    fillerCount,
    structureCompleteness,
    pauseHint:
      estimatedWordsPerMinute > 190
        ? "语速偏快，适合刻意停顿。"
        : estimatedWordsPerMinute < 80
          ? "语速偏慢，建议压缩铺垫。"
          : "语速区间正常。",
  };
}

export function averageScore(score: Record<string, number | undefined>): number {
  const values = Object.values(score).filter((value): value is number => typeof value === "number");
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function readinessScore(input: {
  jdMatchScore?: number;
  knowledgeTotal: number;
  masteredKnowledge: number;
  finishedSessions: number;
  todoReviews: number;
  totalReviews: number;
}) {
  const jd = input.jdMatchScore ?? 50;
  const coverage = input.knowledgeTotal ? Math.round((input.masteredKnowledge / input.knowledgeTotal) * 100) : 0;
  const mock = Math.min(100, input.finishedSessions * 25);
  const review = input.totalReviews
    ? Math.round(((input.totalReviews - input.todoReviews) / input.totalReviews) * 100)
    : input.todoReviews === 0
      ? 70
      : 0;

  return {
    jd,
    coverage,
    mock,
    review,
    overall: Math.round(jd * 0.3 + coverage * 0.3 + mock * 0.2 + review * 0.2),
  };
}

function occurrences(text: string, word: string): number {
  if (!word) {
    return 0;
  }
  return text.split(word).length - 1;
}
