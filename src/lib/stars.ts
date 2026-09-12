import type { SentimentSplit } from "./types";

export interface StarRating { stars: number; approval: number }

/** A sentiment index, not a collected review score. No inflation or hidden prior. */
export function rawStars(approval: number): number {
  return 1 + 4 * Math.min(1, Math.max(0, approval));
}

export function starRating(split: SentimentSplit, opinions: number): StarRating | undefined {
  if (!Number.isFinite(opinions) || opinions <= 0) return undefined;
  const positive = Number.isFinite(split.positive) ? Math.max(0, split.positive) : 0;
  const negative = Number.isFinite(split.negative) ? Math.max(0, split.negative) : 0;
  if (!positive && !negative) return undefined;
  const approval = positive / (positive + negative);
  const neutral = Number.isFinite(split.neutral) ? Math.max(0, split.neutral) : 0;
  const balance = (positive + 0.5 * neutral) / (positive + neutral + negative);
  return { stars: Math.round(rawStars(balance) * 10) / 10, approval };
}
