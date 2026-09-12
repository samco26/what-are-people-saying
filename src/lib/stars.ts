/* The star rating on a category card, worked out from the sentiment split.

   Star sites are inflated: most Amazon ratings are five stars and products
   cluster at 4.1 to 4.5, so readers treat 4.2 as good, 3.5 as middling and
   under 3 as bad. Scraped discussion runs the other way: neutral chatter
   dominates and written text leans to complaints. A plain 1 + 4 x positive
   would rate everything about a star low.

   Rotten Tomatoes is the closest existing analogue: its score is simply
   the share of reviews that are positive, neutral excluded, with public
   thresholds at 60% (Fresh) and 75% (Certified Fresh). Those thresholds
   already carry a meaning, so the stars are pinned to them.

   The number is a summary of what was said, not a measure of quality; the
   approval share is always printed beside it. */

import type { SentimentSplit } from "./types";

/* approval share -> stars. Straight lines between these points. */
const ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [0.15, 1], [0.30, 2], [0.50, 3], [0.60, 3.5], [0.75, 4], [0.90, 4.5], [1, 5],
];
/* Below this many opinions the rating is pulled toward 3, IMDb style, so
   a dozen enthusiastic posts do not read as universal acclaim. */
const PRIOR_WEIGHT = 10;

export interface StarRating {
  /* 1 to 5, one decimal on screen. */
  stars: number;
  /* Share of opinionated posts that were positive, 0 to 1. */
  approval: number;
}

export function rawStars(approval: number): number {
  const a = Math.min(1, Math.max(0, approval));
  for (let i = 1; i < ANCHORS.length; i++) {
    const [x0, y0] = ANCHORS[i - 1], [x1, y1] = ANCHORS[i];
    if (a <= x1) return y0 + (y1 - y0) * ((a - x0) / (x1 - x0));
  }
  return 5;
}

export function starRating(split: SentimentSplit, opinions: number): StarRating {
  const positive = Math.max(0, split.positive), neutral = Math.max(0, split.neutral), negative = Math.max(0, split.negative);
  const total = positive + neutral + negative;
  const opinionated = positive + negative;
  if (!total || !opinionated) return { stars: 3, approval: 0 };
  const approval = positive / opinionated;
  /* Neutral posts say nothing about quality, so they neither add nor take
     away until they are most of the sample; then the rating drifts to 3. */
  const conviction = Math.min(1, (1 - neutral / total) / 0.5);
  const prior = opinions / (opinions + PRIOR_WEIGHT);
  const stars = 3 + (rawStars(approval) - 3) * conviction * prior;
  return { stars: Math.round(stars * 10) / 10, approval };
}
