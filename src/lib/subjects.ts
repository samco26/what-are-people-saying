import { SAMPLES } from "./sampleData";
import type { ConsensusResult } from "./types";

/* The subjects the opening heading rotates through, in DESIGN.md's order. */
export const EXAMPLE_SUBJECTS: string[] = SAMPLES.map((s) => s.display);

/* Lower case, punctuation stripped, spaces collapsed, and a leading "the"
   removed, so "The Keychron K2!" and "keychron k2" are the same subject. */
export function normaliseSubject(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the\s+/, "");
}

/* A sample result for the subject, or null when there is none. Null is the
   honest answer: version one has no live search to fall back on. */
export function findSample(raw: string): ConsensusResult | null {
  const key = normaliseSubject(raw);
  if (!key) return null;
  for (const entry of SAMPLES) {
    const names = [entry.display, ...entry.aliases].map(normaliseSubject);
    if (names.includes(key)) return entry.result;
  }
  return null;
}
