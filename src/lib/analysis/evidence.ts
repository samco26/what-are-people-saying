import type { OpinionSentiment, RecurringOpinion, SentimentSplit, SourceId, SourceItem, SourceThread } from "../types";

export interface Classification { ref: number; sentiment: OpinionSentiment | "irrelevant" }
export interface OpinionDraft { sentence: string; sentiment: OpinionSentiment; refs: number[] }

/* How much one classified entry counts toward the sentiment split.

   A comment that a thousand people liked stands for more of the audience
   than one nobody noticed: most people who agree press like rather than
   write. The weight grows with the logarithm of the reactions, so an entry
   with no reactions counts 1, ten count 2, a hundred 3 and ten thousand 5.
   A viral post can therefore never outweigh more than a handful of quiet
   ones, and the opinion counts printed on the cards stay plain counts. */
export function reactionWeight(engagement: number | undefined): number {
  const reactions = typeof engagement === "number" && Number.isFinite(engagement) ? Math.max(0, engagement) : 0;
  return 1 + Math.log10(1 + reactions);
}

/** Only collected URLs are allowed, and only on the corresponding platform. */
export function sourceUrl(value: string | undefined, source: SourceId): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const domains = { youtube: ["youtube.com", "youtu.be"], reddit: ["reddit.com"], x: ["x.com", "twitter.com"] }[source];
    return url.protocol === "https:" && !url.username && !url.password && domains.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)) ? url.href : undefined;
  } catch { return undefined; }
}

/** Request-local grouping. Text is copied verbatim, never written by the model. */
export function buildEvidence(items: SourceItem[], classifications: Classification[], drafts: OpinionDraft[], preferred: number[] = []) {
  const byId = new Map(items.map((item) => [`${item.source}:${item.id}`, item]));
  const labels = new Map<number, Classification["sentiment"]>();
  for (const entry of classifications) {
    if (Number.isInteger(entry.ref) && items[entry.ref] && items[entry.ref].kind !== "video" && !labels.has(entry.ref)) labels.set(entry.ref, entry.sentiment);
  }
  const groups = new Map<string, SourceThread & { source: SourceId; rank: number }>();
  const groupForRef = new Map<number, string>();
  /* splits carry reaction-weighted totals; relevant is the plain number of
     entries classified as being about the subject. */
  const splits: Record<SourceId, SentimentSplit> = {
    youtube: { positive: 0, neutral: 0, negative: 0 },
    x: { positive: 0, neutral: 0, negative: 0 },
    reddit: { positive: 0, neutral: 0, negative: 0 },
  };
  const relevant: Record<SourceId, number> = { youtube: 0, x: 0, reddit: 0 };
  items.forEach((item, ref) => {
    if (item.kind === "video" || labels.get(ref) === "irrelevant") return;
    const parent = item.parentId ? byId.get(`${item.source}:${item.parentId}`) : undefined;
    const root = parent ?? item;
    const key = `${root.source}:${root.id}`;
    const sentiment = labels.get(ref);
    if (sentiment && sentiment !== "irrelevant") { splits[item.source][sentiment] += reactionWeight(item.engagement); relevant[item.source]++; }
    const priority = preferred.indexOf(ref);
    let group = groups.get(key);
    if (!group) {
      group = {
        id: key, source: item.source, title: root.title || root.text,
        kind: root.kind, author: root.author, url: sourceUrl(root.url, root.source), comments: [],
        rank: priority < 0 ? Number.MAX_SAFE_INTEGER : priority,
      };
      groups.set(key, group);
    }
    if (priority >= 0) group.rank = Math.min(group.rank, priority);
    if (!group.comments!.some((comment) => comment.id === item.id)) {
      group.comments!.push({ id: item.id, text: item.text, author: item.author, ...(sentiment && sentiment !== "irrelevant" ? { sentiment } : {}) });
    }
    groupForRef.set(ref, key);
  });
  const opinions = drafts.map((draft, index) => {
    const valid = [...new Set(draft.refs)].filter((ref) => Number.isInteger(ref) && groupForRef.has(ref) && labels.has(ref) && labels.get(ref) !== "irrelevant");
    const distinct = new Set(valid.map((ref) => items[ref].text.trim().toLowerCase().replace(/\s+/g, " ")));
    return { id: `opinion-${index}`, sentence: draft.sentence.trim(), sentiment: draft.sentiment, evidenceIds: [...new Set(valid.map((ref) => groupForRef.get(ref)!))], support: distinct.size };
  }).filter((opinion) => opinion.support >= 2 && opinion.sentence.length > 0)
    .sort((a, b) => b.support - a.support)
    .filter((opinion, index, all) => all.findIndex((other) => other.sentence.toLowerCase() === opinion.sentence.toLowerCase()) === index)
    .slice(0, 20)
    /* support stays on the opinion: the category cards print it. */
    .map((opinion): RecurringOpinion => opinion);
  /* The overall split is the platforms' weighted totals added together, so
     the answer's bar and the platform bars can never disagree. */
  const split: SentimentSplit = { positive: 0, neutral: 0, negative: 0 };
  for (const source of Object.keys(splits) as SourceId[]) for (const key of ["positive", "neutral", "negative"] as const) split[key] += splits[source][key];
  return {
    opinions, splits, split, relevant,
    threadsFor: (source: SourceId): SourceThread[] => [...groups.values()]
      .filter((group) => group.source === source)
      .sort((a, b) => a.rank - b.rank || b.comments!.length - a.comments!.length)
      .map(({ source: _source, rank: _rank, ...thread }) => thread),
  };
}
