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

export interface SourceStatus {
  source: SourceId;
  availability: SourceAvailability;
  /* How many items from this source went into the analysis. */
  itemsAnalysed: number;
  /* A plain-English reason when the source is partial or unavailable. */
  note?: string;
}

/* One collected item, whatever platform it came from. */
export interface SourceItem {
  id: string;
  source: SourceId;
  kind: "video" | "comment" | "post" | "reply" | "thread";
  text: string;
  author?: string;
  url?: string;
  publishedAt?: string;
  engagement?: number;
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
  title: string;
  kind: SourceItem["kind"];
  url?: string;
  fictional?: true;
}

/* One platform's own reading of the sample: what that platform's users
   thought, on its own, before the platforms are combined. */
export interface SourceAnalysis {
  source: SourceId;
  verdict: Verdict;
  agreement: Agreement;
  confidence: Confidence;
  positives: Theme[];
  negatives: Theme[];
  threads: SourceThread[];
}

/* The share of the sample that read as positive, neutral and negative.
   Fractions that sum to one. Drawn as a bar, never printed as figures. */
export interface SentimentSplit {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ConsensusResult {
  subject: string;
  /* One to three qualitative sentences. The default view shows only this. */
  summary: string;
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
  /* No live sources are connected and the subject is not one of the
     samples. */
  | { kind: "no-live-search"; subject: string; message: string; examples: string[] }
  /* Live sources ran but too little came back to describe honestly. */
  | { kind: "insufficient"; subject: string; message: string; sources: SourceStatus[] };

/* The Get Specific refinements. They preview a selection in version one and
   will drive collection once sources are live. The demographic groups are
   multi-select: an empty list means no filter on that dimension. */
export type PeriodId = "7d" | "30d" | "12m" | "all" | "custom";
export type AgeId = "18-24" | "25-34" | "35-44" | "45-54" | "55+";
export type GenderId = "male" | "female" | "other";
export type RegionId = "na" | "sa" | "eu" | "af" | "me" | "as" | "oce";

export interface Refinements {
  platforms: SourceId[];
  period: PeriodId;
  /* ISO dates, used when period is "custom". */
  from: string;
  to: string;
  ages: AgeId[];
  genders: GenderId[];
  regions: RegionId[];
}

export const PERIODS: ReadonlyArray<{ id: PeriodId; label: string }> = [
  { id: "7d", label: "Past week" },
  { id: "30d", label: "Past month" },
  { id: "12m", label: "Past year" },
  { id: "all", label: "Any time" },
  { id: "custom", label: "Custom range" },
];

export const AGES: ReadonlyArray<{ id: AgeId; label: string }> = [
  { id: "18-24", label: "18 to 24" },
  { id: "25-34", label: "25 to 34" },
  { id: "35-44", label: "35 to 44" },
  { id: "45-54", label: "45 to 54" },
  { id: "55+", label: "55 and over" },
];

export const GENDERS: ReadonlyArray<{ id: GenderId; label: string }> = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
];

export const REGIONS: ReadonlyArray<{ id: RegionId; code: string; label: string }> = [
  { id: "na", code: "NA", label: "North America" },
  { id: "sa", code: "SA", label: "South America" },
  { id: "eu", code: "EU", label: "Europe" },
  { id: "af", code: "AF", label: "Africa" },
  { id: "me", code: "ME", label: "Middle East" },
  { id: "as", code: "AS", label: "Asia" },
  { id: "oce", code: "OCE", label: "Oceania" },
];

export const DEFAULT_REFINEMENTS: Refinements = {
  platforms: ["youtube", "x", "reddit"],
  period: "30d",
  from: "",
  to: "",
  ages: [],
  genders: [],
  regions: [],
};
