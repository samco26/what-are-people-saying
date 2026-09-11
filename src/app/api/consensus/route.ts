import { NextResponse } from "next/server";
import { EXAMPLE_SUBJECTS, findSample } from "@/lib/subjects";
import { liveEnabled } from "@/lib/env";
import { collectAll } from "@/lib/connectors";
import { analyse } from "@/lib/analysis/analyse";
import { SOURCES, type ConsensusResponse } from "@/lib/types";

/* POST /api/consensus  { subject: string }

   Two paths, chosen by what keys exist on the server:

   Live, when ANTHROPIC_API_KEY and at least one source key are set: the
   available platforms are collected in parallel, each under its own
   timeout, then the sample goes to Claude once and the answer comes back
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
  const from = new Date(to.getTime() - 30 * 86_400_000);
  const collectionStarted = performance.now();
  const { items, statuses } = await collectAll(SOURCES.map((source) => source.id), {
    subject,
    from,
    to,
  });
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
    };
    return NextResponse.json(response, noStore);
  }

  try {
    const analysisStarted = performance.now();
    const result = await analyse(subject, items, statuses);
    const analysisMs = performance.now() - analysisStarted;
    result.window = { from: from.toISOString(), to: to.toISOString(), months: 1 };
    const response: ConsensusResponse = { kind: "result", result };
    return NextResponse.json(response, { headers: {
      ...noStore.headers,
      "Server-Timing": `collection;dur=${collectionMs.toFixed(0)}, analysis;dur=${analysisMs.toFixed(0)}`,
    } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The analysis failed.";
    return NextResponse.json({ error: message }, { status: 502, ...noStore });
  }
}
