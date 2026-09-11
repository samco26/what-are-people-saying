import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { x } from "../src/lib/connectors/x.ts";

const originalFetch = globalThis.fetch;
const previousToken = process.env.X_BEARER_TOKEN;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (previousToken === undefined) delete process.env.X_BEARER_TOKEN;
  else process.env.X_BEARER_TOKEN = previousToken;
});

async function collectWith(to) {
  process.env.X_BEARER_TOKEN = "test-placeholder-not-a-token";
  let requested;
  globalThis.fetch = async (input) => {
    requested = new URL(String(input));
    return Response.json({ meta: { result_count: 0 } });
  };
  await x.collect({
    subject: "fictional boat engine",
    from: new Date(Date.now() - 86_400_000),
    to,
    signal: new AbortController().signal,
  });
  return requested;
}

test("X omits an end_time near now so the API can apply its valid default", async () => {
  const requested = await collectWith(new Date());
  assert.equal(requested.searchParams.get("end_time"), null);
});

test("X retains an end_time for a genuinely historical search", async () => {
  const to = new Date(Date.now() - 60_000);
  const requested = await collectWith(to);
  assert.equal(requested.searchParams.get("end_time"), to.toISOString());
});
