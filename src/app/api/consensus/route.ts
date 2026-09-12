import { NextResponse } from "next/server";
import { EXAMPLE_SUBJECTS, findSample } from "@/lib/subjects";
import { liveEnabled } from "@/lib/env";
import { collectAdaptive } from "@/lib/connectors/adaptive";
import { collectAll } from "@/lib/connectors";
import { planSearch } from "@/lib/searchPlan";
import { analyse } from "@/lib/analysis/analyse";
import { CATEGORIES, SOURCES, type Category, type ConsensusResponse } from "@/lib/types";

/* POST /api/consensus  { subject: string; categoryHint?: Category }

   Two paths, chosen by what keys exist on the server:

   Live, when OPENAI_API_KEY and at least one source key are set: the
   available platforms are collected in parallel, each under its own
   timeout, then the sample goes to OpenAI once and the answer comes back
   in the shape the screen draws. A platform without a key is reported as
   unavailable in the answer. Too little collected and the answer says so
   instead of guessing. Nothing collected is kept.

   Sample, otherwise: the six example subjects answer from labelled
   fictional samples, and anything else gets the no-live-search state.

   The browser never sees a key: the route only ever asks whether a key
   exists. Searches use all three sources and the default recent window. */

export const runtime = "nodejs";
/* Collection plus analysis can take half a minute. Vercel's default is
   shorter; this asks for the most the plan allows, up to a minute. */
export const maxDuration = 60;

const MIN_ITEMS_DEFAULT = 8;

function readSubject(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const value = (body as { subject?: unknown }).subject;
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

/* When the subject was accepted from a did-you-mean suggestion, the browser
   sends the category the plan gave that reading. Only a known category
   counts; anything else is treated as no hint. */
function readCategoryHint(body: unknown): Category | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const value = (body as { categoryHint?: unknown }).categoryHint;
  return typeof value === "string" && (CATEGORIES as ReadonlyArray<string>).includes(value) ? value as Category : undefined;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be JSON." }, { status: 400 });
  }

  const subject = readSubject(body);
  if (!subject) {
    return NextResponse.json({ error: "Enter a subject to search for." }, { status: 400 });
  }

  const noStore = { headers: { "Cache-Control": "no-store" } };

  if (!liveEnabled()) {
    const sample = findSample(subject);
    const response: ConsensusResponse = sample
      ? { kind: "result", result: sample }
      : {
          kind: "no-live-search",
          subject,
          message:
            "Version one has no live connection to YouTube, X or Reddit yet, so there is nothing to sample for this subject. The example subjects below show how a finished answer will look.",
          examples: EXAMPLE_SUBJECTS,
        };
    return NextResponse.json(response, noStore);
  }

  const to = new Date();
  /* First work out what to search for on each platform, then collect. The
     plan falls back to the subject as typed if that step cannot complete. */
  const planStarted = performance.now();
  const categoryHint = readCategoryHint(body);
  const plan = await planSearch(subject, { confirmed: Boolean(categoryHint) });
  const planMs = performance.now() - planStarted;
  const collectionStarted = performance.now();
  const { items, statuses, window } = await collectAdaptive(subject, SOURCES.map((source) => source.id), to, collectAll, plan.queries);
  const collectionMs = performance.now() - collectionStarted;
  const opinionCount = items.filter((item) => item.kind !== "video").length;

  const minItems = Number.parseInt(process.env.MIN_ITEMS ?? "", 10) || MIN_ITEMS_DEFAULT;
  if (opinionCount < minItems) {
    const response: ConsensusResponse = {
      kind: "insufficient",
      subject,
      message:
        opinionCount === 0
          ? "Nothing came back from the platforms that could be reached, so there is nothing to describe."
          : `Only ${opinionCount} opinion${opinionCount === 1 ? "" : "s"} came back, which is too few to describe honestly.`,
      sources: statuses,
      window,
    };
    return NextResponse.json(response, noStore);
  }

  try {
    const analysisStarted = performance.now();
    const result = await analyse(subject, items, statuses, window, plan.interpretation);
    const analysisMs = performance.now() - analysisStarted;
    result.window = window;
    /* The plan decided what kind of thing this is; the screen picks the
       card from it. An ambiguous name gets the general card and a
       suggestion for the search field. */
    result.category = plan.category === "general" && categoryHint ? categoryHint : plan.category;
    if (plan.kind) result.kind = plan.kind;
    /* A confirmed reading is never offered another suggestion. */
    if (plan.suggestion && !categoryHint) { result.suggestion = plan.suggestion; result.suggestionCategory = plan.suggestionCategory; }
    const response: ConsensusResponse = { kind: "result", result };
    return NextResponse.json(response, { headers: {
      ...noStore.headers,
      "Server-Timing": `plan;dur=${planMs.toFixed(0)}, collection;dur=${collectionMs.toFixed(0)}, analysis;dur=${analysisMs.toFixed(0)}`,
    } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The analysis failed.";
    return NextResponse.json({ error: message }, { status: 502, ...noStore });
  }
}
