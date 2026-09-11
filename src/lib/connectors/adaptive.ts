import { collectAll } from "./index";
import type { SourceId, SourceItem, SourceStatus } from "../types";

export const SEARCH_MONTHS = [3, 12, 36] as const;
export const EXPAND_BELOW = 50;

/* Preserve the day where possible, clamping month ends instead of overflowing. */
export function monthsBefore(to: Date, months: number): Date {
  const from = new Date(to);
  const day = from.getUTCDate();
  from.setUTCDate(1);
  from.setUTCMonth(from.getUTCMonth() - months);
  const last = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0)).getUTCDate();
  from.setUTCDate(Math.min(day, last));
  return from;
}

export async function collectAdaptive(
  subject: string, sources: SourceId[], to = new Date(),
  collect: typeof collectAll = collectAll,
) {
  const items = new Map<string, SourceItem>();
  const statuses = new Map<SourceId, SourceStatus>();
  const memo = new Map<string, Promise<unknown>>();
  let active = sources;
  let months: number = 3;
  for (const windowMonths of SEARCH_MONTHS) {
    if (!active.length) break;
    months = windowMonths;
    const batch = await collect(active, {
      subject, from: monthsBefore(to, months), to, memo, previousItems: [...items.values()],
    });
    for (const item of batch.items) if (!items.has(item.id)) items.set(item.id, item);
    for (const status of batch.statuses) statuses.set(status.source, status);
    const count = [...items.values()].filter((item) => item.kind !== "video").length;
    if (count >= EXPAND_BELOW) break;
    // X recent search cannot reach further back. Access failures are not retried.
    active = batch.expandable;
  }
  return {
    items: [...items.values()],
    statuses: sources.map((source) => {
      const status = statuses.get(source)!;
      const count = [...items.values()].filter((item) => item.source === source && item.kind !== "video").length;
      return { ...status, itemsAnalysed: count, availability: count > 0 && status.availability === "unavailable" ? "partial" as const : status.availability };
    }),
    window: { from: monthsBefore(to, months).toISOString(), to: to.toISOString(), months },
  };
}
