/* Official X full-archive search. Try 3, 12 and 36 months independently
   of other sources, widening only after an empty response. Stop at the
   first nonempty response: at most 20 paid post reads in total.

   The query is the planned search terms (see searchPlan.ts), or the subject
   as an exact phrase when no plan exists, plus fixed operators. Results are
   asked for by X's relevance ranking rather than the default newest-first,
   so a busy subject is not reduced to its last few hours. Relevance costs
   the same: billing is per post returned, not per ordering.

   The daily reservation is per server instance, not a whole-app spending
   cap: 20 posts are reserved before the first request and whatever was not
   returned is given back afterwards, so empty and failed searches cost no
   budget. The enforceable ceiling is the monthly spend limit in X's
   developer console. No posts are persisted; memoization lasts only for
   this request. */

import { setTimeout as delay } from "node:timers/promises";
import type { SourceItem, SearchWindow } from "../types";
import { env, envInt } from "../env";
import { platformQuery } from "./query";
import { SEARCH_MONTHS, monthsBefore } from "../searchWindow";
import { getJson, getOnce, reasonFor, statusFor, tidy, type Collected, type CollectOptions, type Connector } from "./shared";

const API = "https://api.x.com/2/tweets/search/all";
const END_TIME_SAFETY_MS = 15_000;
// Archive requests are limited to one per second. Keep fallback calls apart.
const FALLBACK_DELAY_MS = 1050;

interface SearchResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
    public_metrics?: { like_count?: number; retweet_count?: number };
  }>;
}

let budgetDay = "";
let spentToday = 0;

function spend(n: number): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== budgetDay) {
    budgetDay = today;
    spentToday = 0;
  }
  const cap = envInt("X_DAILY_POST_BUDGET", 1000, 10, 1_000_000);
  if (spentToday + n > cap) return false;
  spentToday += n;
  return true;
}

/* X bills per post returned, so a search that returned fewer than it
   reserved (or nothing, or failed) gives the difference back. */
function refund(n: number): void {
  if (n > 0 && budgetDay === new Date().toISOString().slice(0, 10)) spentToday = Math.max(0, spentToday - n);
}

/* Tests only: the counter is otherwise per process and per day. */
export function resetDailyBudget(): void {
  budgetDay = "";
  spentToday = 0;
}

/* The terms X is searched for, before the fixed operators. */
export function xTerms(opts: Pick<CollectOptions, "subject" | "queries" | "aliases">): string {
  if (opts.aliases?.length) return platformQuery("x", opts);
  return opts.queries?.x ?? `"${opts.subject.replace(/"/g, "")}"`;
}

async function collectArchive(opts: CollectOptions, to: Date): Promise<Collected> {
  const token = env("X_BEARER_TOKEN") ?? "";
  // Enforce the agreed US$0.10 post-read budget even with an older env value.
  const max = envInt("X_MAX_RESULTS", 20, 10, 20);
  if (!spend(max)) {
    return {
      items: [], canExpand: false,
      status: { source: "x", availability: "unavailable", itemsAnalysed: 0, note: "Today's reading budget for X is used up." },
    };
  }

  let completedWindow: SearchWindow | undefined;
  for (const months of SEARCH_MONTHS) {
    try {
      if (completedWindow) await delay(FALLBACK_DELAY_MS, undefined, { signal: opts.signal });
      opts.signal.throwIfAborted();
      const from = monthsBefore(to, months);
      const url = new URL(API);
      url.searchParams.set("query", `${xTerms(opts)} -is:retweet lang:en`);
      url.searchParams.set("sort_order", "relevancy");
      url.searchParams.set("max_results", String(max));
      url.searchParams.set("tweet.fields", "created_at,public_metrics");
      url.searchParams.set("start_time", from.toISOString());
      // For present-time searches let X apply its indexing-safe default.
      if (to.getTime() <= Date.now() - END_TIME_SAFETY_MS) url.searchParams.set("end_time", to.toISOString());
      const res = await getJson<SearchResponse>(url.toString(), {
        signal: opts.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      completedWindow = { from: from.toISOString(), to: to.toISOString(), months };
      const items: SourceItem[] = (res.data ?? []).map((p) => ({
        id: `x:post:${p.id}`, source: "x", kind: "post", text: p.text,
        url: `https://x.com/i/status/${p.id}`, publishedAt: p.created_at,
        engagement: (p.public_metrics?.like_count ?? 0) + (p.public_metrics?.retweet_count ?? 0),
      }));
      const period = months === 36 ? "3 years" : `${months} months`;
      const note = items.length
        ? `Read ${items.length} of up to ${max} X posts from the last ${period}.`
        : `No matching X posts were found in the last ${period}.`;
      if (items.length || months === 36) {
        refund(max - items.length);
        return { items, canExpand: false, status: { ...statusFor("x", items.length, max), note, window: completedWindow } };
      }
      // No posts were returned (or billed), so the next window can still read max.
    } catch (error) {
      refund(max);
      return {
        items: [], canExpand: false,
        status: {
          source: "x", availability: "unavailable", itemsAnalysed: 0,
          note: `X archive search could not complete for the last ${months === 36 ? "3 years" : `${months} months`}. ${reasonFor(error, opts.signal.aborted)}`,
          window: completedWindow,
        },
      };
    }
  }
  throw new Error("X search windows are not configured.");
}

export const x: Connector = {
  id: "x",
  configured: () => Boolean(env("X_BEARER_TOKEN")),
  collect: (opts) => {
    const to = opts.to ?? new Date();
    return getOnce(`x:archive:${xTerms(opts)}:${to.toISOString()}`, opts, () => collectArchive(opts, to));
  },
};
