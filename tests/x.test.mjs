import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { x, resetDailyBudget } from "../src/lib/connectors/x.ts";
import { monthsBefore } from "../src/lib/searchWindow.ts";

const originalFetch = globalThis.fetch;
const originalError = console.error;
const previousToken = process.env.X_BEARER_TOKEN;
const previousMax = process.env.X_MAX_RESULTS;
const previousBudget = process.env.X_DAILY_POST_BUDGET;
afterEach(() => {
  if (previousBudget === undefined) delete process.env.X_DAILY_POST_BUDGET;
  else process.env.X_DAILY_POST_BUDGET = previousBudget;
  resetDailyBudget();
  globalThis.fetch = originalFetch;
  console.error = originalError;
  if (previousToken === undefined) delete process.env.X_BEARER_TOKEN;
  else process.env.X_BEARER_TOKEN = previousToken;
  if (previousMax === undefined) delete process.env.X_MAX_RESULTS;
  else process.env.X_MAX_RESULTS = previousMax;
});
const post = (id) => ({ id: String(id), text: "Fictional test opinion", created_at: "2026-01-01T00:00:00Z" });
const options = (to = new Date()) => ({ subject: "fictional boat engine", to, signal: new AbortController().signal });
async function collectWith(to) {
  process.env.X_BEARER_TOKEN = "test-placeholder-not-a-token";
  const requests = [];
  globalThis.fetch = async (input) => {
    requests.push(new URL(String(input)));
    return Response.json({ data: [post(1)] });
  };
  const result = await x.collect(options(to));
  assert.equal(requests.length, 1, "stop on any matching posts, even fewer than the limit");
  return { requested: requests[0], result };
}

test("X starts with three archive months and omits an unsafe present-time end", async () => {
  const to = new Date();
  const { requested, result } = await collectWith(to);
  assert.equal(requested.pathname, "/2/tweets/search/all");
  assert.equal(requested.searchParams.get("query"), '"fictional boat engine" -is:retweet lang:en');
  assert.equal(requested.searchParams.get("sort_order"), "relevancy");
  assert.equal(requested.searchParams.get("start_time"), monthsBefore(to, 3).toISOString());
  assert.equal(requested.searchParams.get("end_time"), null);
  assert.equal(result.status.window.months, 3);
  assert.equal(result.canExpand, false);
});

test("planned X terms replace the quoted subject and keep the fixed operators", async () => {
  process.env.X_BEARER_TOKEN = "test-placeholder-not-a-token";
  const requests = [];
  globalThis.fetch = async (input) => { requests.push(new URL(String(input))); return Response.json({ data: [post(1)] }); };
  const memo = new Map();
  const planned = { ...options(), memo, queries: { x: '("boat engine" OR outboard) -toy' } };
  const first = await x.collect(planned);
  const again = await x.collect({ ...planned, from: monthsBefore(planned.to, 12) });
  assert.equal(requests.length, 1, "one archive read for the same terms within a request");
  assert.equal(first, again);
  assert.equal(requests[0].searchParams.get("query"), '("boat engine" OR outboard) -toy -is:retweet lang:en');
  assert.equal(requests[0].searchParams.get("sort_order"), "relevancy");
  assert.equal(first.items.length, 1);
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

test("empty X windows widen to twelve months and stop on the first paid results", async () => {
  const to = new Date("2026-09-12T00:00:00Z");
  const requests = [];
  globalThis.fetch = async (input) => {
    requests.push(new URL(input));
    return Response.json(requests.length === 1 ? { meta: { result_count: 0 } } : { data: [post(1), post(2)] });
  };
  const result = await x.collect(options(to));
  assert.deepEqual(requests.map(r => r.searchParams.get("start_time")), ["2026-06-12T00:00:00.000Z", "2025-09-12T00:00:00.000Z"]);
  assert.equal(result.items.length, 2);
  assert.equal(result.status.window.months, 12);
  assert.match(result.status.note, /last 12 months/);
});

test("X can reach three years while fetching at most twenty posts in total", async () => {
  delete process.env.X_MAX_RESULTS;
  const requests = [];
  const to = new Date("2026-09-12T00:00:00Z");
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    requests.push(url);
    assert.equal(url.searchParams.get("max_results"), "20");
    return Response.json(requests.length < 3 ? {} : { data: Array.from({ length: 20 }, (_, i) => post(i)) });
  };
  const result = await x.collect(options(to));
  assert.equal(requests.length, 3);
  assert.equal(requests[2].searchParams.get("start_time"), "2023-09-12T00:00:00.000Z");
  assert.equal(result.items.length, 20);
  assert.equal(result.status.window.months, 36);
});

test("an empty three-year search is explicit and is not repeated within the request", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({}); };
  const opts = { ...options(), memo: new Map() };
  const [first, simultaneous] = await Promise.all([x.collect(opts), x.collect(opts)]);
  const again = await x.collect({ ...opts, from: monthsBefore(opts.to, 36) });
  assert.equal(calls, 3);
  assert.equal(first, simultaneous);
  assert.equal(first, again);
  assert.equal(first.status.note, "No matching X posts were found in the last 3 years.");
  assert.equal(first.status.window.months, 36);
});

test("archive access, billing and rate failures stop without extra paid requests", async () => {
  console.error = () => {};
  for (const status of [400, 401, 402, 403, 429]) {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({}, { status }); };
    const result = await x.collect(options());
    assert.equal(calls, 1);
    assert.equal(result.canExpand, false);
    assert.equal(result.status.availability, "unavailable");
    assert.match(result.status.note, /X archive search could not complete/);
    assert.equal(result.status.window, undefined);
  }
});

test("aborting during expansion preserves the last completed window and stops requests", async () => {
  const ctl = new AbortController();
  let calls = 0;
  globalThis.fetch = async () => { calls++; ctl.abort(); return Response.json({}); };
  const result = await x.collect({ ...options(), signal: ctl.signal });
  assert.equal(calls, 1);
  assert.equal(result.status.window.months, 3);
  assert.match(result.status.note, /12 months.*Did not respond in time/);
});

test("the daily budget only counts posts actually returned; empty and failed searches give their reservation back", async () => {
  console.error = () => {};
  process.env.X_BEARER_TOKEN = "test-placeholder-not-a-token";
  delete process.env.X_MAX_RESULTS;
  let calls = 0;
  const answer = (body) => { globalThis.fetch = async () => { calls++; return body instanceof Response ? body : Response.json(body); }; };

  // Partial: 5 posts leave 25 of a 30-post budget, so a full 20-post search still fits.
  resetDailyBudget();
  process.env.X_DAILY_POST_BUDGET = "30";
  answer({ data: [post(1), post(2), post(3), post(4), post(5)] });
  assert.equal((await x.collect(options())).items.length, 5);
  answer({ data: Array.from({ length: 20 }, (_, i) => post(i)) });
  assert.equal((await x.collect(options())).items.length, 20);
  calls = 0;
  const refused = await x.collect(options());
  assert.equal(calls, 0);
  assert.equal(refused.status.note, "Today's reading budget for X is used up.");

  // Failure: nothing was billed, so the next search is not blocked.
  resetDailyBudget();
  process.env.X_DAILY_POST_BUDGET = "20";
  answer(Response.json({}, { status: 402 }));
  assert.equal((await x.collect(options())).status.availability, "unavailable");
  answer({ data: [post(1)] });
  assert.equal((await x.collect(options())).items.length, 1);

  // Empty over three years: nothing billed, nothing kept.
  resetDailyBudget();
  answer({});
  assert.equal((await x.collect(options(new Date("2026-09-12T00:00:00Z")))).status.window.months, 36);
  answer({ data: [post(1)] });
  assert.equal((await x.collect(options())).items.length, 1);
});
