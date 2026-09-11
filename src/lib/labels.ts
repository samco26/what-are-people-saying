import type { Agreement, ConfidenceLevel, Verdict } from "./types";

/* The words the screen uses for the three classifications, so every place
   that prints one prints the same thing. */

export const VERDICT_TEXT: Record<Verdict, string> = {
  positive: "Positive",
  mixed: "Mixed",
  negative: "Negative",
};

export const AGREEMENT_TEXT: Record<Agreement, string> = {
  strong: "with strong agreement",
  moderate: "with moderate agreement",
  weak: "with little agreement",
};

export const CONFIDENCE_TEXT: Record<ConfidenceLevel, string> = {
  low: "low",
  medium: "medium",
  high: "high",
};
