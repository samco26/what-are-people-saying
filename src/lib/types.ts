/* The shared shapes every part of the app reads.

   A connector (YouTube, X, Reddit) is a later milestone, but the format it
   will return is fixed here now so the screen, the sample data and the future
   analysis all agree on one shape. Nothing in version one stores any of it. */

export type SourceId = "youtube" | "x" | "reddit";

export interface SourceInfo {
  id: SourceId;
  name: string;
  /* Served from public/logos. */
  logo: string;
}

export const SOURCES: ReadonlyArray<SourceInfo> = [
  { id: "youtube", name: "YouTube", logo: "/logos/youtube.png" },
  { id: "x", name: "X", logo: "/logos/x.png" },
  { id: "reddit", name: "Reddit", logo: "/logos/reddit.png" },
];

export function sourceInfo(id: SourceId): SourceInfo {
  return SOURCES.find((s) => s.id === id) ?? { id, name: id, logo: "" };
}

export function sourceName(id: SourceId): string {
  return sourceInfo(id).name;
}

/* What a connector reports about itself alongside its items. "partial" means
   it returned something but less than it was asked for, which the answer has
   to say rather than hide. */
export type SourceAvailability = "ok" | "partial" | "unavailable";

export interface SearchWindow {
  from: string;
  to: string;
  months: number;
}

export interface SourceStatus {
  source: SourceId;
  availability: SourceAvailability;
  /* Accepted unique relevant opinions after analysis; collected candidates before analysis. */
  itemsAnalysed: number;
  /* A plain-English reason when the source is partial or unavailable. */
  note?: string;
  /* Actual bounds when a source expands independently of the others. */
  window?: SearchWindow;
}

/* One collected item, whatever platform it came from. */
export interface SourceItem {
  id: string;
  source: SourceId;
  kind: "video" | "comment" | "post" | "reply" | "thread";
  text: string;
  title?: string;
  author?: string;
  url?: string;
  publishedAt?: string;
  engagement?: number;
  /* Links an opinion to its context without counting that context as a vote. */
  parentId?: string;
}

export type Verdict = "positive" | "mixed" | "negative";

/* Positive is not the same as strong agreement: a sample can lean positive
   while people disagree a lot. Both are reported. */
export type Agreement = "strong" | "moderate" | "weak";

export type ConfidenceLevel = "low" | "medium" | "high";

export interface Confidence {
  level: ConfidenceLevel;
  reason: string;
}

export interface Theme {
  title: string;
  detail: string;
}

/* A thread, video or post the analysis drew on. In the prototype these are
   fictional titles and say so; a live result carries the real url. */
export interface SourceThread {
  id?: string;
  title: string;
  kind: SourceItem["kind"];
  /* Kept out of the AI prompt, then restored server-side for attribution. */
  author?: string;
  url?: string;
  fictional?: true;
  comments?: EvidenceComment[];
}

export type OpinionSentiment = "positive" | "neutral" | "negative";
export interface EvidenceComment {
  id: string;
  author?: string;
  text: string;
  sentiment?: OpinionSentiment;
}
export interface RecurringOpinion {
  id: string;
  sentence: string;
  sentiment: OpinionSentiment;
  evidenceIds: string[];
  /* Exact supporting comments, namespaced by source; older samples omit this. */
  evidenceCommentIds?: string[];
  /* Number of distinct supporting opinions, kept internal. */
  support?: number;
}

/* One platform's share of the sample. Its sentiment comes from the
   classification counts and its threads from the representative references.
   The reading fields are optional: fictional samples still carry them, the
   live analysis no longer writes them. */
export interface SourceAnalysis {
  source: SourceId;
  sentiment?: SentimentSplit;
  verdict?: Verdict;
  agreement?: Agreement;
  confidence?: Confidence;
  positives?: Theme[];
  negatives?: Theme[];
  threads: SourceThread[];
}

/* The share of the sample that read as positive, neutral and negative.
   Fractions counted from accepted evidence, shown as rounded percentages. */
export interface SentimentSplit {
  positive: number;
  neutral: number;
  negative: number;
}

/* Four categories use stars in the shared answer layout; general uses a meter. */
export type Category = "film" | "product" | "place" | "app" | "general";
export const CATEGORIES: ReadonlyArray<Category> = ["film", "product", "place", "app", "general"];

export interface ConsensusResult {
  subject: string;
  context?: SubjectContext;
  category?: Category;
  /* A few words on what the subject is, printed on the category card:
     "Film · 2026 · dir. Denis Villeneuve". */
  kind?: string;
  /* When the typed name could mean several things, the most likely specific
     subject, offered as ghost text in the search field, and what kind of
     thing that reading is, sent back with the search when it is accepted. */
  suggestion?: string;
  suggestionCategory?: Category;
  /* Actual collection bounds, supplied by the server for live searches. */
  window?: SearchWindow;
  /* One to three qualitative sentences. The default view shows only this. */
  summary: string;
  opinions?: RecurringOpinion[];
  sentiment: SentimentSplit;
  verdict: Verdict;
  agreement: Agreement;
  confidence: Confidence;
  /* Up to three each. Fewer means fewer were supported by the sample. */
  positives: Theme[];
  negatives: Theme[];
  sources: SourceStatus[];
  /* One entry per platform that returned anything. */
  bySource: SourceAnalysis[];
  /* True on every sample result, false on a live one. The screen labels
     the two differently. */
  illustrative: boolean;
}

export type ConsensusResponse =
  | { kind: "result"; result: ConsensusResult }
  | { kind: "subject-unresolved"; subject: string; reason: "ambiguous" | "unverified" | "unavailable"; message: string }
  /* No live sources are connected and the subject is not one of the
     samples. */
  | { kind: "no-live-search"; subject: string; message: string; examples: string[] }
  /* Live sources ran but too little came back to describe honestly. */
  | { kind: "insufficient"; subject: string; message: string; sources: SourceStatus[]; window?: ConsensusResult["window"]; context?: SubjectContext };

export interface SubjectContext {
  original: string;
  name: string;
  nameRefs: number[];
  description: { text: string; refs: number[] };
  aliases: Array<{ text: string; refs: number[] }>;
  facts: Array<{ text: string; refs: number[] }>;
  sources: Array<{ title: string; url: string }>;
  checkedAt: string;
}
