/* The analysis: the collected sample goes to OpenAI once, and a structured
   answer comes back in the shape the screen already draws.

   Two rules keep it honest. The model may only cite items it was given:
   the threads a platform "drew from" are chosen by id from the sample, and
   the real titles and links are filled in here, so no link is ever invented.
   And the model is told to say when the evidence is thin rather than fill
   the slots: fewer than three themes is a valid answer.

   The model is CONSENSUS_MODEL, gpt-5.6-luna by default. See README.md for
   what a search costs on each model. */

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { ConsensusResult, SourceId, SourceItem, SourceStatus, SourceThread } from "../types";
import { env } from "../env";

const DEFAULT_MODEL = "gpt-5.6-luna";

/* The most of the sample the model reads. Above this the longest items are
   dropped first, which keeps a search inside a predictable cost. */
const MAX_ITEMS = 220;

const Verdict = z.enum(["positive", "mixed", "negative"]);
const Agreement = z.enum(["strong", "moderate", "weak"]);
const Level = z.enum(["low", "medium", "high"]);
const Theme = z.object({ title: z.string(), detail: z.string() });
const Confidence = z.object({ level: Level, reason: z.string() });
const Split = z.object({ positive: z.number(), neutral: z.number(), negative: z.number() });

const Analysis = z.object({
  summary: z.string(),
  verdict: Verdict,
  agreement: Agreement,
  confidence: Confidence,
  sentiment: Split,
  positives: z.array(Theme),
  negatives: z.array(Theme),
  bySource: z.array(
    z.object({
      source: z.enum(["youtube", "x", "reddit"]),
      verdict: Verdict,
      agreement: Agreement,
      confidence: Confidence,
      positives: z.array(Theme),
      negatives: z.array(Theme),
      /* Ids of the items this platform's reading rests on, from the sample. */
      drawnFrom: z.array(z.string()),
    }),
  ),
});

const SYSTEM = `You read a sample of public discussion about a subject and describe where opinion sits. You write for a general reader, in plain English, in the first person plural never ("we"), and without hedging phrases.

Rules:
- Describe the sample you were given, not everyone. A positive result is not the same as strong agreement; report both.
- The summary is one to three sentences. Qualitative, no percentages, no lists.
- Positives and negatives are the themes people actually raise, up to three each, each with a title of a few words and a detail sentence. If the sample supports fewer than three, give fewer. Never invent a theme to fill a slot.
- Confidence is about the evidence: how much there is, who it comes from, how consistent it is. Say why in one sentence.
- sentiment is the share of items that read as positive, neutral and negative, as fractions summing to 1.
- For each platform that has items, give its own reading, and list in drawnFrom the ids of the items that reading rests on, four to eight of them, most representative first. Only ids from the sample.
- Ignore spam, adverts and items that are not about the subject. If almost nothing is about the subject, say so in the summary and set confidence low.`;

function formatItems(items: SourceItem[]): string {
  return items
    .map((it) => {
      const bits = [it.kind, it.publishedAt ? it.publishedAt.slice(0, 10) : null, it.engagement != null ? `${it.engagement} reactions` : null]
        .filter(Boolean)
        .join(", ");
      return `[${it.id}] (${it.source}; ${bits}) ${it.text}`;
    })
    .join("\n");
}

/* Trim the sample to the budget, keeping every source represented: the
   longest items go first, spread across sources. */
export function trimSample(items: SourceItem[], max = MAX_ITEMS): SourceItem[] {
  if (items.length <= max) return items;
  const bySource = new Map<SourceId, SourceItem[]>();
  for (const it of items) bySource.set(it.source, [...(bySource.get(it.source) ?? []), it]);
  const share = Math.floor(max / bySource.size);
  const kept: SourceItem[] = [];
  for (const list of bySource.values()) {
    kept.push(...[...list].sort((a, b) => a.text.length - b.text.length).slice(0, share));
  }
  return kept;
}

export async function analyse(subject: string, items: SourceItem[], statuses: SourceStatus[]): Promise<ConsensusResult> {
  const client = new OpenAI({ apiKey: env("OPENAI_API_KEY") });
  const model = env("CONSENSUS_MODEL") ?? DEFAULT_MODEL;
  const sample = trimSample(items);
  const byId = new Map(sample.map((it) => [it.id, it]));

  const response = await client.responses.parse({
    model,
    instructions: SYSTEM,
    input: `Subject: ${subject}\n\nSample of ${sample.length} items:\n${formatItems(sample)}`,
    max_output_tokens: 6000,
    reasoning: { effort: "none" },
    text: { format: zodTextFormat(Analysis, "consensus_analysis") },
    /* A search is complete in one request, so its response does not need
       to be retained by the provider for later retrieval. */
    store: false,
  });

  const refusal = response.output
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content)
    .find((part) => part.type === "refusal");
  if (refusal) {
    throw new Error("The analysis declined this subject.");
  }
  const out = response.output_parsed;
  if (!out) throw new Error("The analysis did not come back in the expected shape.");

  const threadsFor = (ids: string[]): SourceThread[] =>
    ids
      .map((id) => byId.get(id))
      .filter((it): it is SourceItem => Boolean(it))
      .map((it) => ({ title: it.text.length > 140 ? `${it.text.slice(0, 139)}…` : it.text, kind: it.kind, url: it.url }));

  const seen = new Set(sample.map((it) => it.source));

  return {
    subject,
    summary: out.summary,
    sentiment: normalise(out.sentiment),
    verdict: out.verdict,
    agreement: out.agreement,
    confidence: out.confidence,
    positives: out.positives.slice(0, 3),
    negatives: out.negatives.slice(0, 3),
    sources: statuses,
    bySource: out.bySource
      .filter((b) => seen.has(b.source))
      .map((b) => ({
        source: b.source,
        verdict: b.verdict,
        agreement: b.agreement,
        confidence: b.confidence,
        positives: b.positives.slice(0, 3),
        negatives: b.negatives.slice(0, 3),
        threads: threadsFor(b.drawnFrom).slice(0, 8),
      })),
    illustrative: false,
  };
}

function normalise(s: { positive: number; neutral: number; negative: number }) {
  const p = Math.max(0, s.positive), n = Math.max(0, s.neutral), g = Math.max(0, s.negative);
  const total = p + n + g || 1;
  return { positive: p / total, neutral: n / total, negative: g / total };
}
