import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { x } from "../src/lib/connectors/x.ts";

const originalFetch = globalThis.fetch;
const previousToken = process.env.X_BEARER_TOKEN;
const previousMax = process.env.X_MAX_RESULTS;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (previousToken === undefined) delete process.env.X_BEARER_TOKEN;
  else process.env.X_BEARER_TOKEN = previousToken;
  if (previousMax === undefined) delete process.env.X_MAX_RESULTS;
  else process.env.X_MAX_RESULTS = previousMax;
});

async function collectWith(to) {
  process.env.X_BEARER_TOKEN = "test-placeholder-not-a-token";
  let requested;
  globalThis.fetch = async (input) => {
    requested = new URL(String(input));
    return Response.json({ meta: { result_count: 0 } });
  };
  const result = await x.collect({
    subject: "fictional boat engine",
    from: new Date(Date.now() - 30 * 86_400_000),
    to,
    signal: new AbortController().signal,
  });
  return { requested, result };
}

test("X omits an end_time near now so the API can apply its valid default", async () => {
  const { requested, result } = await collectWith(new Date());
  assert.equal(requested.searchParams.get("end_time"), null);
  assert.equal(result.status.note, "No matching X posts were found in the last seven days.");
});

test("X retains an end_time for a genuinely historical search", async () => {
  const to = new Date(Date.now() - 60_000);
  const { requested } = await collectWith(to);
  assert.equal(requested.searchParams.get("end_time"), to.toISOString());
});

test("X requests at most 20 posts even when an old environment setting allows more", async () => {
  for (const setting of [undefined, "50", "100", "invalid", "10"]) {
    if (setting === undefined) delete process.env.X_MAX_RESULTS;
    else process.env.X_MAX_RESULTS = setting;
    const { requested } = await collectWith(new Date());
    assert.equal(requested.searchParams.get("max_results"), setting === "10" ? "10" : "20");
  }
});

test("an accepted empty X search reports no matches and its seven-day coverage", async () => {
  process.env.X_BEARER_TOKEN = "test-placeholder-not-a-token";
  globalThis.fetch = async () => Response.json({ meta: { result_count: 0 } });
  const result = await x.collect({
    subject: "fictional boat engine",
    from: new Date(Date.now() - 90 * 86_400_000),
    to: new Date(),
    signal: new AbortController().signal,
  });
  assert.equal(result.items.length, 0);
  assert.equal(result.status.itemsAnalysed, 0);
  assert.equal(result.status.note, "No matching X posts were found in the last seven days.");
});
