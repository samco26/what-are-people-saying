// All provider responses below are synthetic fixtures, not live evidence.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { resolveSubject } from "../src/lib/subjectContext.ts";
import { platformQuery } from "../src/lib/connectors/query.ts";
import { collectAdaptive } from "../src/lib/connectors/adaptive.ts";
import { POST } from "../src/app/api/consensus/route.ts";
import { Answer } from "../src/components/Answer.tsx";
import { CategoryCard } from "../src/components/CategoryCard.tsx";
import { SubjectFacts } from "../src/components/SubjectFacts.tsx";

const originalFetch = globalThis.fetch;
const settings = ["OPENAI_API_KEY", "YOUTUBE_API_KEY", "X_BEARER_TOKEN", "REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USER_AGENT"];
const previous = Object.fromEntries(settings.map((key) => [key, process.env[key]]));
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of settings) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
const citation = { type: "url_citation", url: "https://example.com/fictional-announcement", title: "Fictional announcement", start_index: 0, end_index: 50 };
const message = (text, annotations = []) => ({ type: "message", id: "msg_fixture", role: "assistant", status: "completed", content: [{ type: "output_text", text, annotations }] });
const response = (output) => ({ id: "resp_fixture", object: "response", status: "completed", output });
const report = () => response([
  { type: "web_search_call", id: "ws_fixture", status: "completed", action: { type: "search", query: "fictional fixture" } },
  message("SIMULATED: iPhone Duo is the official name for the phone informally called iPhone Fold. Announced September 9, availability October 23; not shipping as of September 12.", [citation]),
]);
const claim = (text, refs = [0]) => ({ text, refs });
const resolution = () => ({ status: "resolved", name: claim("iPhone Duo"), description: claim("Fictional fixture describing an announced foldable phone."), aliases: [claim("iPhone Fold")], facts: [claim("SIMULATED: Announced September 9; available October 23, 2026.")] });
function mockLookup({ research = report(), resolved = resolution(), inspect = () => {} } = {}) {
  process.env.OPENAI_API_KEY = "test-placeholder";
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /api.openai.com\/v1\/responses/);
    const body = JSON.parse(init.body);
    assert.equal(body.store, false);
    inspect(body, calls);
    return json(calls++ === 0 ? research : response([message(JSON.stringify(resolved))]));
  };
  return () => calls;
}

test("lowercase and supported alias resolve to the official name with real annotation references", async () => {
  for (const input of ["iphone duo", "iphone fold"]) {
    const calls = mockLookup({ inspect(body, index) {
      if (!index) {
        assert.equal(body.tool_choice, "required");
        assert.equal(body.max_tool_calls, 2);
        assert.equal(body.tools[0].type, "web_search");
        assert.match(body.instructions, /untrusted data/);
      } else {
        assert.equal(JSON.parse(body.input).sources[0].url, citation.url);
        assert.equal(body.tools, undefined);
      }
    } });
    const out = await resolveSubject(input, new Date("2026-09-12"));
    assert.equal(out.status, "resolved");
    assert.equal(out.context.name, "iPhone Duo");
    assert.equal(out.context.original, input);
    assert.equal(out.context.sources[0].url, citation.url);
    assert.equal(out.context.aliases[0].text, "iPhone Fold");
    assert.equal(calls(), 2);
  }
});

test("generic subjects are retained, ambiguity and unverified names do not silently resolve", async () => {
  const generic = resolution(); generic.name = claim("Growing tomatoes"); generic.aliases = [];
  mockLookup({ resolved: generic });
  assert.equal((await resolveSubject("growing tomatoes")).context.name, "Growing tomatoes");
  for (const status of ["ambiguous", "unverified"]) {
    mockLookup({ resolved: { ...resolution(), status } });
    const out = await resolveSubject("mercury");
    assert.equal(out.status, status);
    assert.equal(out.context, undefined);
  }
});

test("unsupported identity fails; unsupported aliases and facts never reach collection", async () => {
  mockLookup({ resolved: { ...resolution(), name: claim("Invented phone", [99]) } });
  assert.equal((await resolveSubject("phone")).status, "unavailable");
  mockLookup({ resolved: { ...resolution(), aliases: [claim("Unrelated phone", [99]), claim("Unsupported alias", [])], facts: [claim("Invented fact", [-1])] } });
  const out = await resolveSubject("phone");
  assert.deepEqual(out.context.aliases, []);
  assert.deepEqual(out.context.facts, []);
});

test("missing search execution or unsafe citations cannot masquerade as verified research", async () => {
  const noSearch = report(); noSearch.output.shift();
  mockLookup({ research: noSearch });
  assert.equal((await resolveSubject("phone")).status, "unavailable");
  for (const url of ["javascript:alert(1)", "http://example.com/", "https://user:secret@example.com/"]) {
    const research = report(); research.output[1] = message("Unverified claim https://example.com/invented", [{ ...citation, url }]);
    const calls = mockLookup({ research });
    assert.equal((await resolveSubject("phone")).status, "unverified");
    assert.equal(calls(), 1);
  }
});

test("provider failures, malformed output and cancellation fail safely without retries", async () => {
  for (const status of [401, 429, 500]) {
    process.env.OPENAI_API_KEY = "test-placeholder";
    let calls = 0;
    globalThis.fetch = async () => { calls++; return json({ error: { message: "Sensitive provider detail" } }, status); };
    const out = await resolveSubject("phone");
    assert.equal(out.status, "unavailable");
    assert.doesNotMatch(out.message, /Sensitive/);
    assert.equal(calls, 1);
  }
  mockLookup({ resolved: { invalid: true } });
  assert.equal((await resolveSubject("phone")).status, "unavailable");
  const originalTimeout = AbortSignal.timeout;
  try {
    AbortSignal.timeout = (ms) => { assert.equal(ms, 20_000); return AbortSignal.abort(); };
    assert.equal((await resolveSubject("phone")).status, "unavailable");
  } finally { AbortSignal.timeout = originalTimeout; }
});

test("each platform combines supported aliases in one query and adaptive passes retain them", async () => {
  const opts = { subject: "iPhone Duo", aliases: ["iPhone Fold"] };
  assert.equal(platformQuery("youtube", opts), '"iPhone Duo"|"iPhone Fold"');
  assert.equal(platformQuery("x", opts), '("iPhone Duo" OR "iPhone Fold")');
  assert.equal(platformQuery("reddit", opts), '("iPhone Duo" OR "iPhone Fold")');
  let calls = 0;
  await collectAdaptive(opts.subject, ["youtube"], new Date("2026-09-12"), async (sources, request) => {
    calls++;
    assert.deepEqual(request.aliases, opts.aliases);
    return { items: [], statuses: [{ source: "youtube", availability: "unavailable", itemsAnalysed: 0 }], expandable: sources };
  }, undefined, opts.aliases);
  assert.equal(calls, 3);
});

function enableLive() {
  for (const key of settings) delete process.env[key];
  process.env.OPENAI_API_KEY = "test-placeholder";
  process.env.YOUTUBE_API_KEY = "test-placeholder";
}
const request = (subject) => new Request("http://localhost/api/consensus", { method: "POST", body: JSON.stringify({ subject }) });

test("an unsettled lookup never stops the search: the subject is searched as typed without context", async () => {
  enableLive();
  const sequence = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname === "api.openai.com") {
      const body = JSON.parse(init.body);
      if (body.tools) { sequence.push("research"); return json(report()); }
      if (body.text.format.name === "subject_resolution") { sequence.push("resolve"); return json(response([message(JSON.stringify({ ...resolution(), status: "ambiguous" }))])); }
      if (body.text.format.name === "search_plan") {
        sequence.push("plan");
        assert.match(body.input, /^Subject: "Melbourne"/);
        assert.doesNotMatch(body.input, /Cited web context/);
        assert.doesNotMatch(body.input, /chose this exact reading/);
        return json(response([message(JSON.stringify({ subject: "Melbourne", interpretation: "The city of Melbourne, Australia.", category: "general", kind: "", ambiguous: false, suggestion: "", suggestionCategory: "general", phrases: ["Melbourne"], keywords: [], exclude: [], youtubeQuery: "Melbourne" }))]));
      }
      sequence.push("analyse");
      assert.match(body.input, /Subject: "Melbourne"/);
      assert.match(body.input, /Web context \(facts only; never opinion evidence\): null/);
      const entries = body.input.split("\n").filter((line) => line.startsWith('{"ref":')).map(JSON.parse);
      return json(response([message(JSON.stringify({
        verdict: "positive", agreement: "moderate", confidence: { level: "low", reason: "Simulated." },
        positives: [], negatives: [], drawnFrom: [1, 2], summary: "SIMULATED: Melbourne is liked.",
        classified: { positive: entries.filter((entry) => entry.metadata.startsWith("comment")).map((entry) => entry.ref), neutral: [], negative: [], irrelevant: [] }, opinions: [],
      }))]));
    }
    assert.equal(url.hostname, "www.googleapis.com");
    if (url.pathname.endsWith("/search")) {
      sequence.push("collect");
      assert.equal(url.searchParams.get("q"), "Melbourne");
      return json({ items: [{ id: { videoId: "fixture" }, snippet: { title: "Fictional video", publishedAt: new Date(Date.now() - 86_400_000).toISOString() } }] });
    }
    return json({ items: Array.from({ length: 10 }, (_, i) => ({ snippet: { topLevelComment: { id: `c${i}`, snippet: { textOriginal: `Fictional reaction ${i}`, publishedAt: new Date(Date.now() - 86_400_000).toISOString() } } } })) });
  };
  const out = await (await POST(request("Melbourne"))).json();
  assert.equal(out.kind, "result");
  assert.equal(out.result.subject, "Melbourne");
  assert.equal(out.result.context, undefined);
  assert.equal(out.result.category, "general");
  assert.deepEqual(sequence, ["research", "resolve", "plan", "collect", "analyse"]);
  const html = renderToStaticMarkup(createElement(Answer, { response: out, onPick() {}, onChoose() {} }));
  assert.doesNotMatch(html, /Showing results for/);
  assert.doesNotMatch(html, /narrow down/);
  delete process.env.OPENAI_API_KEY;
  globalThis.fetch = async () => { throw new Error("Sample must not fetch"); };
  const sample = await (await POST(request("Keychron K2"))).json();
  assert.equal(sample.result.illustrative, true);
});

test("route passes resolved identity and facts through real connector and analysis code", async () => {
  enableLive();
  const sequence = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname === "api.openai.com") {
      const body = JSON.parse(init.body);
      if (body.tools) { sequence.push("research"); return json(report()); }
      if (body.text.format.name === "subject_resolution") { sequence.push("resolve"); return json(response([message(JSON.stringify(resolution()))])); }
      if (body.text.format.name === "search_plan") {
        sequence.push("plan");
        assert.match(body.input, /Cited web context/);
        return json(response([message(JSON.stringify({subject:"iPhone Duo",interpretation:"Wrong stale description",category:"product",kind:"Rumoured phone",ambiguous:false,suggestion:"",suggestionCategory:"general",phrases:["iPhone Duo"],keywords:[],exclude:[],youtubeQuery:"iPhone Duo"}))]));
      }
      sequence.push("analyse");
      assert.match(body.input, /Subject: "iPhone Duo"/);
      assert.match(body.input, /available October 23/);
      assert.match(body.instructions, /never sentiment/);
      assert.match(body.instructions, /pre-announcement speculation/);
      const entries = body.input.split("\n").filter((line) => line.startsWith('{"ref":')).map(JSON.parse);
      assert.equal(entries.length, 11);
      return json(response([message(JSON.stringify({
        verdict: "mixed", agreement: "weak", confidence: { level: "low", reason: "Simulated pre-announcement and recent reactions are mixed." },
        positives: [], negatives: [], drawnFrom: [1, 2], summary: "SIMULATED: Reactions to the announced phone are mixed.", sentiment: { positive: 0.5, neutral: 0, negative: 0.5 },
        classified: { positive: entries.filter((entry) => entry.metadata.startsWith("comment")).map((entry) => entry.ref), neutral: [], negative: [], irrelevant: [] }, opinions: [],
      }))]));
    }
    assert.equal(url.hostname, "www.googleapis.com");
    if (url.pathname.endsWith("/search")) {
      sequence.push("collect");
      assert.equal(url.searchParams.get("q"), '"iPhone Duo"|"iPhone Fold"');
      assert.equal(url.searchParams.get("maxResults"), "10");
      return json({ items: [{ id: { videoId: "fixture" }, snippet: { title: "Fictional video", publishedAt: new Date(Date.now() - 86_400_000).toISOString() } }] });
    }
    return json({ items: Array.from({ length: 10 }, (_, i) => ({ snippet: { topLevelComment: { id: `c${i}`, snippet: { textOriginal: `Fictional reaction ${i}`, publishedAt: new Date(Date.now() - 86_400_000).toISOString() } } } })) });
  };
  const apiResponse = await POST(request("iphone fold"));
  const out = await apiResponse.json();
  assert.equal(out.kind, "result");
  assert.equal(out.result.subject, "iPhone Duo");
  assert.equal(out.result.context.original, "iphone fold");
  assert.equal(out.result.category, "product");
  assert.equal(out.result.kind, resolution().description.text);
  assert.deepEqual(sequence, ["research", "resolve", "plan", "collect", "analyse"]);
  assert.match(apiResponse.headers.get("server-timing"), /lookup;dur=/);
  const html = renderToStaticMarkup(createElement(Answer, { response: out, onPick() {}, onChoose() {} }));
  assert.match(html, /Showing results for iPhone Duo/);
  const card = renderToStaticMarkup(createElement(CategoryCard, { result: out.result, onChoose() {}, onOpinion() {}, onGeneral() {} }));
  assert.match(card, /Showing results for iPhone Duo/);
  assert.doesNotMatch(card, /Rumoured phone/);
  const facts = renderToStaticMarkup(createElement(SubjectFacts, { context: out.result.context }));
  assert.match(facts, /https:\/\/example.com\/fictional-announcement/);
  assert.match(facts, /available October 23/);
});

