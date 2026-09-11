import { NextResponse } from "next/server";
import { EXAMPLE_SUBJECTS, findSample } from "@/lib/subjects";
import { liveEnabled } from "@/lib/env";
import { collectAll } from "@/lib/connectors";
import { analyse } from "@/lib/analysis/analyse";
import {
  DEFAULT_REFINEMENTS,
  type ConsensusResponse,
  type PeriodId,
  type Refinements,
  type SourceId,
} from "@/lib/types";

/* POST /api/consensus  { subject: string, refinements?: Refinements }

   Two paths, chosen by what keys exist on the server:

   Live, when ANTHROPIC_API_KEY and at least one source key are set: the
   requested platforms are collected in parallel, each under its own
   timeout, then the sample goes to Claude once and the answer comes back
   in the shape the screen draws. A platform without a key is reported as
   unavailable in the answer. Too little collected and the answer says so
   instead of guessing. Nothing collected is kept.

   Sample, otherwise: the six example subjects answer from labelled
   fictional samples, and anything else gets the no-live-search state.

   The browser never sees a key: the route only ever asks whether a key
   exists. Demographic refinements are accepted and ignored, because no
   source provides that data and the app does not infer it. */

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

const SOURCE_IDS: SourceId[] = ["youtube", "x", "reddit"];
const PERIOD_IDS: PeriodId[] = ["7d", "30d", "12m", "all", "custom"];

/* Only the parts of the refinements the server acts on, each checked. */
function readRefinements(body: unknown): Pick<Refinements, "platforms" | "period" | "from" | "to"> {
  const r = typeof body === "object" && body !== null ? (body as { refinements?: unknown }).refinements : undefined;
  const o = typeof r === "object" && r !== null ? (r as Record<string, unknown>) : {};
  const platforms = Array.isArray(o.platforms)
    ? o.platforms.filter((p): p is SourceId => typeof p === "string" && (SOURCE_IDS as string[]).includes(p))
    : [];
  const period = PERIOD_IDS.includes(o.period as PeriodId) ? (o.period as PeriodId) : DEFAULT_REFINEMENTS.period;
  const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  return {
    platforms: platforms.length ? platforms : DEFAULT_REFINEMENTS.platforms,
    period,
    from: date(o.from),
    to: date(o.to),
  };
}

/* The time window as dates, from the period or the custom range.
   Keep helpers private: Next.js only permits route handlers and route
   configuration to be exported from this file. */
function windowFor(period: PeriodId, from: string, to: string): { from?: Date; to?: Date } {
  const now = Date.now();
  const days = (n: number) => new Date(now - n * 86_400_000);
  if (period === "7d") return { from: days(7) };
  if (period === "30d") return { from: days(30) };
  if (period === "12m") return { from: days(365) };
  if (period === "custom") {
    const f = from ? new Date(`${from}T00:00:00Z`) : undefined;
    const t = to ? new Date(`${to}T23:59:59Z`) : undefined;
    return { from: f && Number.isFinite(f.getTime()) ? f : undefined, to: t && Number.isFinite(t.getTime()) ? t : undefined };
  }
  return {};
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

  const refinements = readRefinements(body);
  const window = windowFor(refinements.period, refinements.from, refinements.to);

  const { items, statuses } = await collectAll(refinements.platforms, {
    subject,
    period: refinements.period,
    from: window.from,
    to: window.to,
  });

  const minItems = Number.parseInt(process.env.MIN_ITEMS ?? "", 10) || MIN_ITEMS_DEFAULT;
  if (items.length < minItems) {
    const response: ConsensusResponse = {
      kind: "insufficient",
      subject,
      message:
        items.length === 0
          ? "Nothing came back from the platforms that could be reached, so there is nothing to describe."
          : `Only ${items.length} item${items.length === 1 ? "" : "s"} came back, which is too few to describe honestly.`,
      sources: statuses,
    };
    return NextResponse.json(response, noStore);
  }

  try {
    const result = await analyse(subject, items, statuses);
    const response: ConsensusResponse = { kind: "result", result };
    return NextResponse.json(response, noStore);
  } catch (err) {
    const message = err instanceof Error ? err.message : "The analysis failed.";
    return NextResponse.json({ error: message }, { status: 502, ...noStore });
  }
}
