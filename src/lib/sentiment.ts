import type { SentimentSplit } from "./types";

/* Largest-remainder rounding keeps visible percentages at exactly 100. */
export function sentimentPercentages(split: SentimentSplit): number[] {
  const values = [split.positive, split.neutral, split.negative].map((value) =>
    Number.isFinite(value) ? Math.max(0, value) : 0,
  );
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return [0, 0, 0];
  const exact = values.map((value) => value / total * 100);
  const rounded = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, remainder: value - rounded[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  const missing = 100 - rounded.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < missing; index++) rounded[order[index].index]++;
  return rounded;
}

/** All displayed judgements use these same accepted classification counts. */
export function sentimentVerdict(split: SentimentSplit): "positive" | "mixed" | "negative" {
  const total = split.positive + split.neutral + split.negative;
  if (!total) return "mixed";
  const balance = (split.positive + split.neutral * 0.5) / total;
  return balance >= 0.6 ? "positive" : balance <= 0.4 ? "negative" : "mixed";
}
