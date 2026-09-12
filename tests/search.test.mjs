import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { youtube } from "../src/lib/connectors/youtube.ts";
import { analyse } from "../src/lib/analysis/analyse.ts";
import { sentimentPercentages } from "../src/lib/sentiment.ts";

const originalFetch = globalThis.fetch;
const previousKey = process.env.OPENAI_API_KEY;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previousKey;
});

const date = "2026-09-10T00:00:00Z";
const opts = () => ({ subject: "fictional test phone", from: new Date("2026-08-13"), to: new Date("2026-09-12"), signal: new AbortController().signal });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const videos = { items: Array.from({ length: 10 }, (_, i) => ({ id: { videoId: `v${i}` }, snippet: { title: `Fictional test video ${i}`, description: "Context only", publishedAt: date } })) };
const comments = (id) => ({ items: Array.from({ length: 30 }, (_, i) => ({ snippet: { topLevelComment: { id: `${id}c${i}`, snippet: { textOriginal: `Fictional opinion ${i} ${"long text ".repeat(90)}END`, publishedAt: date, likeCount: i } } } })) });

test("YouTube fetches 10 by views and 30 top comments per video concurrently, preserving long text", async () => {
  let active = 0, peak = 0, commentCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(init.cache, "no-store");
    if (url.pathname.endsWith("/search")) {
      assert.equal(url.searchParams.get("maxResults"), "10");
      assert.equal(url.searchParams.get("order"), "viewCount");
      assert.equal(url.searchParams.get("publishedAfter"), null);
      assert.equal(url.searchParams.get("publishedBefore"), opts().to.toISOString());
      assert.ok(url.searchParams.get("fields"));
      return json(videos);
    }
    assert.equal(url.searchParams.get("maxResults"), "30");
    assert.equal(url.searchParams.get("order"), "relevance");
    commentCalls++; active++; peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    return json(comments(url.searchParams.get("videoId")));
  };
  const result = await youtube.collect(opts());
  assert.equal(commentCalls, 10);
  assert.equal(peak, 10);
  assert.equal(result.items.length, 310);
  assert.equal(result.status.itemsAnalysed, 300);
  assert.equal(result.status.availability, "ok");
  const opinions = result.items.filter((item) => item.kind === "comment");
  assert.ok(opinions.every((item) => item.text.endsWith("END") && item.parentId));
  assert.equal(opinions[0].url, "https://www.youtube.com/watch?v=v0&lc=v0c0");
});

test("a failed comment section preserves other videos and reports the shortfall", async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/search")) return json(videos);
    if (url.searchParams.get("videoId") === "v0") return json({}, 403);
    return json(comments(url.searchParams.get("videoId")));
  };
  const result = await youtube.collect(opts());
  assert.equal(result.status.itemsAnalysed, 270);
  assert.equal(result.status.availability, "partial");
  assert.match(result.status.note, /1 video comment sections could not be read/);
});

test("out-of-window comments and titles alone do not count as opinions", async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/search")) return json(videos);
    const body = comments("old");
    for (const item of body.items) item.snippet.topLevelComment.snippet.publishedAt = "2020-01-01";
    return json(body);
  };
  const result = await youtube.collect(opts());
  assert.equal(result.items.length, 10);
  assert.equal(result.status.itemsAnalysed, 0);
  assert.equal(result.status.availability, "unavailable");
});

const reading = {
  verdict: "positive", agreement: "moderate", confidence: { level: "medium", reason: "Fictional evidence." },
  positives: [{ title: "Design", detail: "Fictional praise." }], negatives: [], drawnFrom: [1, 299, 300, 9999, 0, 1],
};
const analysisOutput = { ...reading, summary: "Excitement for the fictional phone is substantial.", sentiment: { positive: 0.6, neutral: 0.2, negative: 0.2 } };
function mockOpenAI(makeOutput, inspect) {
  process.env.OPENAI_API_KEY = "test-placeholder-not-a-key";
  globalThis.fetch = async (input, init) => {
    assert.match(String(input), /^https:\/\/api.openai.com\/v1\/responses/);
    const body = JSON.parse(init.body);
    assert.equal(body.store, false);
    inspect(body);
    return json({ id: "resp_fixture", object: "response", status: "completed", model: body.model,
      output: [{ id: "msg_fixture", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(makeOutput()), annotations: [] }] }],
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } });
  };
}
const sample = () => [{ id: "video0", source: "youtube", kind: "video", text: "Fictional context" },
  ...Array.from({ length: 300 }, (_, i) => ({ id: `comment${i}`, source: "youtube", kind: "comment", text: `Fictional opinion ${i}`, parentId: "video0", url: `https://www.youtube.com/watch?v=fictional&lc=${i}` }))];

test("all 300 opinions reach OpenAI and one-source evidence is generated only once", async () => {
  mockOpenAI(() => analysisOutput, (body) => {
    assert.ok(!body.text.format.schema.properties.bySource);
    const lines = body.input.split("\n").filter((line) => line.startsWith('{"ref":')).map(JSON.parse);
    assert.equal(lines.length, 301);
    assert.equal(lines.at(-1).text, "Fictional opinion 299");
    assert.equal(lines.at(-1).parent, 0);
    assert.match(body.instructions, /Lead immediately/);
    assert.match(body.instructions, /untrusted data/);
  });
  const result = await analyse("fictional phone", sample(), [{ source: "youtube", availability: "ok", itemsAnalysed: 301 }]);
  assert.equal(result.sources[0].itemsAnalysed, 300);
  assert.equal(result.bySource.length, 1);
  assert.deepEqual(result.bySource[0].positives, result.positives);
  assert.equal(result.bySource[0].threads.length, 3); // invalid, duplicate and context references excluded
  assert.ok(result.bySource[0].threads.every((thread) => thread.kind === "comment"));
});

test("multi-source analysis preserves opinions and attribution without sending authors to OpenAI", async () => {
  const items = [...sample(), { id: "x1", source: "x", kind: "post", text: "Fictional X reaction", author: "public_test_author", url: "https://x.com/i/status/fictional" }];
  mockOpenAI(() => {
    const { drawnFrom, ...overall } = analysisOutput;
    return { ...overall, bySource: [{ ...reading, source: "youtube", drawnFrom: [1, 301] }, { ...reading, source: "x", drawnFrom: [301, 1] }] };
  }, (body) => {
    assert.ok(body.text.format.schema.properties.bySource);
    assert.match(body.input, /Fictional opinion 299/);
    assert.match(body.input, /Fictional X reaction/);
    assert.doesNotMatch(body.input, /public_test_author/);
  });
  const result = await analyse("fictional phone", items, [{ source: "youtube", availability: "ok", itemsAnalysed: 300 }, { source: "x", availability: "partial", itemsAnalysed: 1 }]);
  assert.equal(result.bySource.length, 2);
  assert.equal(result.bySource[0].threads.length, 1);
  assert.equal(result.bySource[1].threads.length, 1);
  assert.match(result.bySource[1].threads[0].url, /^https:\/\/x.com/);
  assert.equal(result.bySource[1].threads[0].author, "public_test_author");
});

test("percentage rounding totals 100 for thirds, tiny segments and uneven splits", () => {
  assert.deepEqual(sentimentPercentages({ positive: 0, neutral: 0, negative: 0 }), [0, 0, 0]);
  for (const split of [
    { positive: 1, neutral: 1, negative: 1 },
    { positive: 0.999, neutral: 0.0005, negative: 0.0005 },
    { positive: 0.335, neutral: 0.335, negative: 0.33 },
    { positive: 0, neutral: 1, negative: 0 },
  ]) {
    const result = sentimentPercentages(split);
    assert.equal(result.reduce((sum, value) => sum + value, 0), 100);
    assert.ok(result.every((value) => Number.isInteger(value) && value >= 0));
  }
});
