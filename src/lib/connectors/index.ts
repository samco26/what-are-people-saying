/* The connector orchestrator.

   Each source is a separate connector that turns its own platform's
   responses into the shared SourceItem shape and reports its own
   availability. This runs the requested connectors in parallel, each under
   its own timeout, and never lets one failure stop the others: a source
   that is not configured, times out or rejects the request comes back as an
   unavailable status with a plain reason, and the analysis goes ahead on
   whatever the rest returned.

   Nothing collected is stored. Items live for the length of one request. */

import type { SourceId, SourceItem, SourceStatus } from "../types";
import { reasonFor, type CollectOptions, type Collected, type Connector } from "./shared";
import { youtube } from "./youtube";
import { x } from "./x";
import { reddit } from "./reddit";

/* How long any one source may take. Vercel gives the whole route about a
   minute at most, and the analysis needs most of it. */
const SOURCE_TIMEOUT_MS = 9000;

const CONNECTORS: Record<SourceId, Connector> = { youtube, x, reddit };

export function connectorConfigured(id: SourceId): boolean {
  return CONNECTORS[id].configured();
}

export async function collectAll(
  sources: SourceId[],
  opts: Omit<CollectOptions, "signal">,
): Promise<{ items: SourceItem[]; statuses: SourceStatus[] }> {
  const runs = sources.map(async (id): Promise<Collected> => {
    const c = CONNECTORS[id];
    if (!c.configured()) {
      return {
        items: [],
        status: { source: id, availability: "unavailable", itemsAnalysed: 0, note: "Not connected yet." },
      };
    }
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), SOURCE_TIMEOUT_MS);
    try {
      return await c.collect({ ...opts, signal: ctl.signal });
    } catch (err) {
      return {
        items: [],
        status: {
          source: id,
          availability: "unavailable",
          itemsAnalysed: 0,
          note: reasonFor(err, ctl.signal.aborted),
        },
      };
    } finally {
      clearTimeout(timer);
    }
  });

  const results = await Promise.all(runs);
  return {
    items: results.flatMap((r) => r.items),
    statuses: results.map((r) => r.status),
  };
}
