import { NextResponse } from "next/server";
import { EXAMPLE_SUBJECTS, findSample } from "@/lib/subjects";
import { liveEnabled } from "@/lib/env";
import { collectAdaptive } from "@/lib/connectors/adaptive";
import { collectAll } from "@/lib/connectors";
import { fallbackPlan } from "@/lib/searchPlan";
import { resolveSubject } from "@/lib/subjectContext";
import { analyse } from "@/lib/analysis/analyse";
import { SOURCES, type ConsensusResponse } from "@/lib/types";

/* POST /api/consensus  { subject: string; categoryHint?: Category }

   Two paths, chosen by what keys exist on the server:

   Live, when OPENAI_API_KEY and at least one source key are set: the
   available platforms are collected in parallel, each under its own
   timeout, then OpenAI classifies the sample and writes a checked summary
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

export async function POST(request: Request) {
  const started = performance.now();
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
  const lookupStarted = performance.now();
  const lookup = await resolveSubject(subject, to);
  const lookupMs = performance.now() - lookupStarted;
  const context = lookup.status === "resolved" ? lookup.context : undefined;
  const name = context?.name ?? subject;
  // Verified extraction already planned queries. Otherwise preserve the literal input.
  const plan = lookup.status === "resolved" ? lookup.plan : fallbackPlan(subject);
  const collectionStarted = performance.now();
  const { items, statuses, window } = await collectAdaptive(name, SOURCES.map((source) => source.id), to, collectAll, plan.queries, context?.aliases.map((alias) => alias.text));
  const collectionMs = performance.now() - collectionStarted;
  const opinionCount = items.filter((item) => item.kind !== "video").length;

  const minItems = Math.max(MIN_ITEMS_DEFAULT, Number.parseInt(process.env.MIN_ITEMS ?? "", 10) || MIN_ITEMS_DEFAULT);
  if (opinionCount < minItems) {
    const response: ConsensusResponse = {
      kind: "insufficient",
      subject: name,
      context,
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
    const result = await analyse(name, items, statuses, window, plan.interpretation, context, Math.max(1, 55_000 - (performance.now() - started)));
    const analysisMs = performance.now() - analysisStarted;
    if (result.sources.reduce((sum, source) => sum + source.itemsAnalysed, 0) < minItems) {
      const response: ConsensusResponse = { kind: "insufficient", subject: name, context, sources: result.sources, window, message: "Too few unique, relevant opinions remained after checking the collected discussion." };
      return NextResponse.json(response, noStore);
    }
    result.window = window;
    /* Verified category changes only the score presentation. */
    result.category = plan.category;
    if (plan.kind) result.kind = plan.kind;
    const response: ConsensusResponse = { kind: "result", result };
    return NextResponse.json(response, { headers: {
      ...noStore.headers,
      "Server-Timing": `lookup;dur=${lookupMs.toFixed(0)}, collection;dur=${collectionMs.toFixed(0)}, analysis;dur=${analysisMs.toFixed(0)}`,
    } });
  } catch {
    const message = "The evidence check or summary could not finish. Please try again.";
    return NextResponse.json({ error: message }, { status: 502, ...noStore });
  }
}
