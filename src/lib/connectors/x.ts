/* X, through the v2 recent search with an app Bearer token.

   One call: recent posts matching the subject, retweets excluded, English
   only. Recent search reaches back seven days, so an earlier time window
   is clamped to that and the status says so.

   Spend controls, because X bills by posts read: X_MAX_RESULTS (10 to 20,
   default 20) is the most one search reads, and X_DAILY_POST_BUDGET
   (default 1000) is a best-effort daily ceiling kept in this process's
   memory. On a serverless host that memory is per instance, so the ceiling
   is a guard rail rather than a hard cap; set a billing-cycle spending
   limit in the X developer console for a whole-app cap.

   Live empty and nonempty searches were verified on 12 September 2026.
   Billed cost still needs reconciliation. Enabled only when
   X_BEARER_TOKEN exists. */

import type { SourceItem } from "../types";
import { env, envInt } from "../env";
import { getJson, statusFor, tidy, type Collected, type CollectOptions, type Connector } from "./shared";

const API = "https://api.x.com/2/tweets/search/recent";
const RECENT_DAYS = 7;
const END_TIME_SAFETY_MS = 15_000;

interface RecentSearchResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
    author_id?: string;
    public_metrics?: { like_count?: number; retweet_count?: number; reply_count?: number };
  }>;
  meta?: { result_count?: number };
}

/* The day's spend, per process. */
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

async function collect(opts: CollectOptions): Promise<Collected> {
  const token = env("X_BEARER_TOKEN") ?? "";
  // Enforce the agreed US$0.10 post-read budget even with an older env value.
  const max = envInt("X_MAX_RESULTS", 20, 10, 20);

  if (!spend(max)) {
    return {
      items: [],
      status: { source: "x", availability: "unavailable", itemsAnalysed: 0, note: "Today's reading budget for X is used up." },
    };
  }

  const earliest = new Date(Date.now() - RECENT_DAYS * 24 * 3600 * 1000 + 60_000);
  let clamped = false;
  let from = opts.from;
  if (from && from < earliest) {
    from = earliest;
    clamped = true;
  }

  const url = new URL(API);
  url.searchParams.set("query", `"${opts.subject.replace(/"/g, "")}" -is:retweet lang:en`);
  url.searchParams.set("max_results", String(max));
  url.searchParams.set("tweet.fields", "created_at,public_metrics,author_id");
  if (from) url.searchParams.set("start_time", from.toISOString());
  /* X rejects an end_time less than ten seconds before it receives the
     request. For a search ending now, omitting it uses X's safe default. */
  if (opts.to && opts.to.getTime() <= Date.now() - END_TIME_SAFETY_MS) {
    url.searchParams.set("end_time", opts.to.toISOString());
  }

  const res = await getJson<RecentSearchResponse>(url.toString(), {
    signal: opts.signal,
    headers: { Authorization: `Bearer ${token}` },
  });

  const items: SourceItem[] = (res.data ?? []).map((p) => ({
    id: `x:post:${p.id}`,
    source: "x",
    kind: "post",
    text: tidy(p.text),
    url: `https://x.com/i/status/${p.id}`,
    publishedAt: p.created_at,
    engagement: (p.public_metrics?.like_count ?? 0) + (p.public_metrics?.retweet_count ?? 0),
  }));

  const note = items.length === 0
    ? (clamped ? "No matching X posts were found in the last seven days." : "No matching X posts were found in this search window.")
    : (clamped ? "X only searches the last seven days, so the time period was narrowed to that." : undefined);
  const status = statusFor("x", items.length, max, note);
  if (note && status.availability === "ok") status.note = note;
  return { items, status };
}

export const x: Connector = {
  id: "x",
  configured: () => Boolean(env("X_BEARER_TOKEN")),
  collect,
};
