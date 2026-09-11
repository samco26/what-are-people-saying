import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { parseHeadlines, newsDay, collectNewsSubjects } from "../src/lib/newsSubjects.ts";
import { EVERGREEN_SUBJECTS, mixSubjects } from "../src/lib/suggestions.ts";

const fetchBefore = globalThis.fetch;
const keyBefore = process.env.OPENAI_API_KEY;
afterEach(() => {
  globalThis.fetch = fetchBefore;
  if (keyBefore === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = keyBefore;
});

const item = (title, date, url = "https://www.bbc.co.uk/news/articles/fictional?tracking=test") =>
  `<item><title><![CDATA[${title}]]></title><link>${url}</link><pubDate>${date}</pubDate></item>`;

test("today follows Melbourne midnight and filters old, future and unsafe news entries", () => {
  assert.equal(newsDay(new Date("2026-09-11T14:00:00Z")), "2026-09-12");
  const xml = `<rss><channel>${[
    item("Fictional camera &amp; lens launch", "Fri, 11 Sep 2026 16:00:00 GMT"),
    item("Old story", "Thu, 10 Sep 2026 16:00:00 GMT"),
    item("Future story", "Sat, 12 Sep 2026 04:00:00 GMT"),
    item("Unsafe URL", "Fri, 11 Sep 2026 16:00:00 GMT", "https://malicious.example/story"),
    item("Bad date", "not a date"),
  ].join("")}</channel></rss>`;
  const parsed = parseHeadlines(xml, "2026-09-12", "technology", new Date("2026-09-12T00:00:00Z"));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].title, "Fictional camera & lens launch");
  assert.equal(parsed[0].url, "https://www.bbc.co.uk/news/articles/fictional");
});

test("news alternates with niche ideas and unavailable news returns evergreen examples", () => {
  const news = Array.from({ length: 6 }, (_, i) => ({ subject: `Fictional topical subject ${i}` }));
  const mixed = mixSubjects(news);
  assert.equal(mixed.length, 12);
  assert.equal(mixed[0], news[0].subject);
  assert.equal(mixed[1], "the weather in Tuscany in August");
  assert.deepEqual(mixed.filter((_, index) => index % 2 === 1), EVERGREEN_SUBJECTS);
  assert.deepEqual(mixSubjects([]), EVERGREEN_SUBJECTS);
});

test("news picks must be grounded in dated headlines; duplicates and invented topics are rejected", async () => {
  process.env.OPENAI_API_KEY = "test-placeholder-not-a-key";
  const now = new Date();
  const today = newsDay(now);
  let feedCalls = 0, modelCalls = 0;
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://feeds.bbci.co.uk/")) {
      feedCalls++;
      assert.equal(init.cache, "no-store");
      return new Response(`<rss>${item("Fictional Camera Z launches today", now.toUTCString())}</rss>`);
    }
    modelCalls++;
    const request = JSON.parse(init.body);
    assert.equal(request.store, false);
    assert.match(request.input, /Fictional Camera Z/);
    return new Response(JSON.stringify({ id: "resp_test", object: "response", status: "completed", model: request.model,
      output: [{ id: "msg_test", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", annotations: [], text: JSON.stringify({ topics: [
        { headlineIndex: 0, subject: "Camera Z" },
        { headlineIndex: 0, subject: "Camera Z" },
        { headlineIndex: 0, subject: "Invented Phone Duo" },
        { headlineIndex: 900, subject: "No source" },
      ] }) }] }], usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    }), { headers: { "Content-Type": "application/json" } });
  };
  const subjects = await collectNewsSubjects(today);
  assert.equal(feedCalls, 4);
  assert.equal(modelCalls, 1);
  assert.equal(subjects.length, 1);
  assert.equal(subjects[0].subject, "Camera Z");
  assert.equal(subjects[0].headline, "Fictional Camera Z launches today");
});

test("news failure does not call the model or prevent evergreen suggestions", async () => {
  process.env.OPENAI_API_KEY = "test-placeholder-not-a-key";
  globalThis.fetch = async (input) => {
    assert.match(String(input), /^https:\/\/feeds.bbci.co.uk/);
    throw new Error("Simulated feed failure");
  };
  assert.deepEqual(await collectNewsSubjects(newsDay()), []);
});
