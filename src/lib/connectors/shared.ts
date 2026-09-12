/* Helpers the three connectors share. Kept apart from the orchestrator so
   nothing imports in a circle. */

import type { SourceId, SourceItem, SourceStatus } from "../types";

export interface CollectOptions {
  subject: string;
  /* Only items published in this window, when a source can filter by
     date. Undefined means no bound on that side. */
  from?: Date;
  to?: Date;
  signal: AbortSignal;
  /* Request-local only: reused while expanding the same search, never persisted. */
  memo?: Map<string, Promise<unknown>>;
  previousItems?: SourceItem[];
  /* Planned search terms per platform (see searchPlan.ts). A connector
     without an entry searches the subject as typed. */
  queries?: Partial<Record<SourceId, string>>;
}

export interface Collected {
  items: SourceItem[];
  status: SourceStatus;
  canExpand?: boolean;
}

export interface Connector {
  id: SourceId;
  configured: () => boolean;
  collect: (opts: CollectOptions) => Promise<Collected>;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
  }
}

/* Keep only the provider's short, documented error explanation. Never copy
   request URLs, headers or credentials into the error shown by the app. */
function responseDetail(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as {
      title?: unknown;
      detail?: unknown;
      error?: { message?: unknown };
      errors?: Array<{ message?: unknown; detail?: unknown }>;
    };
    const candidates = [
      parsed.errors?.[0]?.message,
      parsed.errors?.[0]?.detail,
      parsed.error?.message,
      parsed.detail,
      parsed.title,
    ];
    const detail = candidates.find((value): value is string => typeof value === "string" && value.trim().length > 0);
    return detail ? tidy(detail, 300) : undefined;
  } catch {
    return undefined;
  }
}

/* A fetch that turns non-2xx into HttpError and parses JSON. */
export async function getJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    const detail = responseDetail(await res.text());
    const host = new URL(url).host;
    console.error("Connector request failed", { host, status: res.status, detail });
    throw new HttpError(res.status, `${res.status} from ${host}`, detail);
  }
  return (await res.json()) as T;
}

export function getOnce<T>(key: string, opts: CollectOptions, read: () => Promise<T>): Promise<T> {
  if (!opts.memo) return read();
  const existing = opts.memo.get(key);
  if (existing) return existing as Promise<T>;
  const pending = read();
  opts.memo.set(key, pending);
  return pending;
}

/* A plain-English reason for the answer, never the raw error. */
export function reasonFor(err: unknown, timedOut: boolean): string {
  if (timedOut) return "Did not respond in time.";
  if (err instanceof HttpError) {
    if (err.status === 402) return "Payment is required by this source. Check its API credits and billing settings.";
    if (err.status === 401 || err.status === 403) return "Access was refused. The key or its permissions may be wrong.";
    if (err.status === 429) return "The request limit was reached for now.";
    if (err.status === 400 && err.detail) return `The request was rejected: ${err.detail}`;
    return `The service answered with an error (${err.status}).`;
  }
  return "Could not be reached.";
}

/* One item's text, tidied and capped so the analysis reads evenly. */
export function tidy(text: string, max = 600): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/* Keeps the sample's status honest: partial when a source returned
   something but clearly less than it was asked for. */
export function statusFor(id: SourceId, count: number, asked: number, note?: string): SourceStatus {
  if (count === 0) {
    return { source: id, availability: "unavailable", itemsAnalysed: 0, note: note ?? "Nothing matched." };
  }
  if (count < Math.ceil(asked / 3)) {
    return {
      source: id,
      availability: "partial",
      itemsAnalysed: count,
      note: note ?? "Fewer items matched than were asked for.",
    };
  }
  return { source: id, availability: "ok", itemsAnalysed: count };
}

/* Whether a date falls inside the requested window. */
export function inWindow(iso: string | undefined, from?: Date, to?: Date): boolean {
  if (!iso || (!from && !to)) return true;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return true;
  if (from && t < from.getTime()) return false;
  if (to && t > to.getTime()) return false;
  return true;
}
