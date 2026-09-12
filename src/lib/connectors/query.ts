import type { CollectOptions } from "./shared";
import type { SourceId } from "../types";

/** Aliases share one search request, preserving each connector's read limits. */
export function platformQuery(source: SourceId, opts: Pick<CollectOptions, "subject" | "aliases">): string {
  const terms = [...new Set([opts.subject, ...(opts.aliases ?? [])]
    .map((term) => term.replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean))].slice(0, 3);
  if (terms.length < 2) return source === "x" ? `"${terms[0] ?? ""}"` : terms[0] ?? "";
  const quoted = terms.map((term) => `"${term}"`);
  return source === "youtube" ? quoted.join("|") : `(${quoted.join(" OR ")})`;
}
