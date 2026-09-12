import type { OpinionSentiment, RecurringOpinion, SentimentSplit, SourceId, SourceItem, SourceThread } from "../types";

export interface Classification { ref: number; sentiment: OpinionSentiment | "irrelevant" }
export interface OpinionDraft { sentence: string; sentiment: OpinionSentiment; refs: number[] }

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
  const conflicts = new Set<number>();
  for (const entry of classifications) {
    if (!Number.isInteger(entry.ref) || !items[entry.ref] || items[entry.ref].kind === "video") continue;
    if (labels.has(entry.ref)) conflicts.add(entry.ref);
    labels.set(entry.ref, entry.sentiment);
  }
  for (const ref of conflicts) labels.delete(ref);
  const seenTexts = new Set<string>();
  const seenIds = new Set<string>();
  const acceptedRefs: number[] = [];
  const textKey = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");
  const groups = new Map<string, SourceThread & { source: SourceId; rank: number }>();
  const groupForRef = new Map<number, string>();
  const splits: Record<SourceId, SentimentSplit> = {
    youtube: { positive: 0, neutral: 0, negative: 0 },
    x: { positive: 0, neutral: 0, negative: 0 },
    reddit: { positive: 0, neutral: 0, negative: 0 },
  };
  items.forEach((item, ref) => {
    if (item.kind === "video" || !labels.has(ref) || labels.get(ref) === "irrelevant") return;
    const identity = `${item.source}:${item.id}`;
    const text = textKey(item.text);
    if (!text || seenTexts.has(text) || seenIds.has(identity)) return;
    seenTexts.add(text); seenIds.add(identity); acceptedRefs.push(ref);
    const parent = item.parentId ? byId.get(`${item.source}:${item.parentId}`) : undefined;
    const root = parent ?? item;
    const key = `${root.source}:${root.id}`;
    const sentiment = labels.get(ref);
    if (sentiment && sentiment !== "irrelevant") splits[item.source][sentiment]++;
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
    const valid = [...new Set(draft.refs)].filter((ref) => Number.isInteger(ref) && groupForRef.has(ref) && labels.has(ref) && labels.get(ref) === draft.sentiment);
    const distinct = new Set(valid.map((ref) => items[ref].text.trim().toLowerCase().replace(/\s+/g, " ")));
    return { id: `opinion-${index}`, sentence: draft.sentence.trim(), sentiment: draft.sentiment, evidenceIds: [...new Set(valid.map((ref) => groupForRef.get(ref)!))], evidenceCommentIds: valid.map((ref) => `${items[ref].source}:${items[ref].id}`), support: distinct.size };
  }).filter((opinion) => opinion.support >= 2 && opinion.sentence.length > 0)
    .sort((a, b) => b.support - a.support)
    .filter((opinion, index, all) => all.findIndex((other) => other.sentence.toLowerCase() === opinion.sentence.toLowerCase()) === index)
    .slice(0, 20)
    /* Support counts stay internal; the writer uses them to avoid overstating themes. */
    .map((opinion): RecurringOpinion => opinion);
  return {
    opinions, splits, acceptedRefs,
    counts: Object.values(splits).reduce((sum, split) => ({ positive: sum.positive + split.positive, neutral: sum.neutral + split.neutral, negative: sum.negative + split.negative }), { positive: 0, neutral: 0, negative: 0 }),
    threadsFor: (source: SourceId): SourceThread[] => [...groups.values()]
      .filter((group) => group.source === source)
      .sort((a, b) => a.rank - b.rank || b.comments!.length - a.comments!.length)
      .map(({ source: _source, rank: _rank, ...thread }) => ({ ...thread, comments: [...thread.comments!].sort((a, b) => {
        const priority = (id: string) => {
          const rank = preferred.findIndex((ref) => items[ref]?.source === source && items[ref]?.id === id);
          return rank < 0 ? Number.MAX_SAFE_INTEGER : rank;
        };
        return priority(a.id) - priority(b.id);
      }) })),
  };
}
