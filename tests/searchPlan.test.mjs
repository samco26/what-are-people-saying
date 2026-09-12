import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { planSearch, planFromParts, fallbackPlan, buildXTerms, buildYouTubeQuery } from "../src/lib/searchPlan.ts";

const originalFetch = globalThis.fetch;
const previousKey = process.env.OPENAI_API_KEY;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previousKey;
});

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
function mockOpenAI(makeOutput, inspect = () => {}) {
  process.env.OPENAI_API_KEY = "test-placeholder-not-a-key";
  globalThis.fetch = async (input, init) => {
    assert.match(String(input), /^https:\/\/api.openai.com\/v1\/responses/);
    const body = JSON.parse(init.body);
    assert.equal(body.store, false);
    inspect(body);
    const output = makeOutput();
    if (output instanceof Response) return output;
    return json({ id: "resp_fixture", object: "response", status: "completed", model: body.model,
      output: [{ id: "msg_fixture", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(output), annotations: [] }] }],
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } });
  };
}

const parts = {
  subject: "Tuscany weather in August",
  interpretation: "The summer weather in the Tuscany region of Italy, as experienced by visitors.",
  phrases: ["Tuscany weather", "Tuscany in August", "Tuscany weather"],
  keywords: ["August", "heat"],
  exclude: ["recipe"],
  youtubeQuery: "Tuscany weather August",
  category: "general",
  kind: "",
  ambiguous: false,
  suggestion: "",
  suggestionCategory: "general",
};

test("a planned search turns a natural-language subject into platform terms", async () => {
  mockOpenAI(() => parts, (body) => {
    assert.equal(body.reasoning.effort, "none");
    assert.ok(body.max_output_tokens <= 400);
    assert.match(body.input, /the weather in Tuscany in August/);
    assert.equal(body.text.format.name, "search_plan");
  });
  const plan = await planSearch("the weather in Tuscany in August");
  assert.equal(plan.planned, true);
  assert.equal(plan.subject, "the weather in Tuscany in August");
  assert.equal(plan.interpretation, parts.interpretation);
  assert.equal(plan.category, "general");
  assert.equal(plan.kind, undefined);
  assert.equal(plan.suggestion, undefined);
  assert.equal(plan.queries.x, '("Tuscany weather" OR "Tuscany in August") -recipe');
  assert.equal(plan.queries.youtube, "Tuscany weather August -recipe");
  assert.equal(plan.queries.reddit, "Tuscany weather in August");
});

test("a short subject as typed always stays among the X terms", () => {
  const plan = planFromParts("Keychron K2", { ...parts, subject: "Keychron K2", phrases: ["K2 keyboard"], keywords: [], exclude: [], youtubeQuery: "Keychron K2 review" });
  assert.equal(plan.queries.x, '("Keychron K2" OR "K2 keyboard")');
  assert.equal(plan.queries.youtube, "Keychron K2 review");
});

test("operator characters from the model never reach a query, and exclusions cannot cancel included words", () => {
  const terms = buildXTerms("jaguar", {
    phrases: ['jaguar) OR (is:verified', "-jaguar -is:retweet", "jaguar f-type"],
    keywords: ["lang:fr", "car", "OR"],
    exclude: ["animal", "jaguar", '"car"'],
  });
  // "lang:fr" cleans to two words, so it is not a keyword and is dropped.
  assert.equal(terms, '(jaguar OR "jaguar OR is verified" OR "jaguar is retweet" OR "jaguar f type") -animal -car');
  assert.equal(buildYouTubeQuery("jaguar", { youtubeQuery: "jaguar car | animal", subject: "Jaguar", exclude: ["animal", "car"] }), "jaguar car animal");
});

test("over-long term lists are trimmed to fit X's query limit or fall back to the subject", () => {
  const long = Array.from({ length: 4 }, (_, i) => `${"word".repeat(12)} ${i}`);
  const terms = buildXTerms("fictional subject", { phrases: long, keywords: long.map((t) => t.replace(/ /g, "")), exclude: [] });
  assert.ok(terms.length <= 480, `${terms.length} characters`);
  assert.ok(terms.startsWith('("fictional subject"'));
  const single = buildXTerms("x".repeat(600), { phrases: [], keywords: [], exclude: [] });
  assert.ok(single.length <= 200);
});

test("without a key, on an error, or on an empty answer the subject is searched as typed", async () => {
  delete process.env.OPENAI_API_KEY;
  assert.deepEqual(await planSearch('best "budget" laptop'), fallbackPlan('best "budget" laptop'));
  const fallback = fallbackPlan('best "budget" laptop');
  assert.equal(fallback.planned, false);
  assert.equal(fallback.interpretation, undefined);
  assert.equal(fallback.category, "general");
  assert.equal(fallback.queries.x, '"best budget laptop"');
  assert.equal(fallback.queries.youtube, 'best "budget" laptop');
  assert.equal(fallback.queries.reddit, 'best "budget" laptop');

  mockOpenAI(() => json({ error: { message: "fixture failure" } }, 500));
  assert.equal((await planSearch("fictional phone")).planned, false);
  mockOpenAI(() => ({ ...parts, phrases: [] }));
  assert.equal((await planSearch("fictional phone")).planned, false);
  mockOpenAI(() => ({ ...parts, interpretation: "   " }));
  const plan = await planSearch("fictional phone");
  assert.equal(plan.planned, true);
  assert.equal(plan.interpretation, undefined);
});

test("a category and its kind line come through; an unknown category is general", () => {
  const plan = planFromParts("the Keychron K2", { ...parts, subject: "Keychron K2", category: "product", kind: "  Product ·  75% wireless   keyboard " });
  assert.equal(plan.category, "product");
  assert.equal(plan.kind, "Product · 75% wireless keyboard");
  assert.equal(plan.suggestion, undefined);
  const odd = planFromParts("thing", { ...parts, category: "person", kind: "Person" });
  assert.equal(odd.category, "general");
  assert.equal(odd.kind, undefined);
});

test("an ambiguous name gets the general card and a suggestion, never a guessed category", () => {
  const plan = planFromParts("dune", { ...parts, subject: "Dune", category: "film", kind: "Film · 2026", ambiguous: true, suggestion: "Dune: Part Three (2026 film)", suggestionCategory: "film" });
  assert.equal(plan.category, "general");
  assert.equal(plan.kind, undefined);
  assert.equal(plan.suggestion, "Dune: Part Three (2026 film)");
  assert.equal(plan.suggestionCategory, "film");
  // An unknown category for the suggestion is carried as general.
  const odd = planFromParts("dune", { ...parts, ambiguous: true, suggestion: "Dune (novel)", suggestionCategory: "book" });
  assert.equal(odd.suggestion, "Dune (novel)");
  assert.equal(odd.suggestionCategory, "general");
  // A suggestion that only repeats the subject is not offered.
  const same = planFromParts("Dune", { ...parts, ambiguous: true, suggestion: " dune ", suggestionCategory: "film" });
  assert.equal(same.suggestion, undefined);
  assert.equal(same.suggestionCategory, undefined);
  // Not ambiguous: the suggestion is ignored even if the model filled it.
  const clear = planFromParts("Spotify", { ...parts, category: "app", kind: "Music streaming", ambiguous: false, suggestion: "Spotify Premium" });
  assert.equal(clear.category, "app");
  assert.equal(clear.suggestion, undefined);
});

test("a confirmed reading tells the model the name is settled", async () => {
  let input = "";
  mockOpenAI(() => ({ ...parts, subject: "iPhone Duo", category: "product", kind: "Product · foldable phone" }), (body) => { input = body.input; });
  const plan = await planSearch("iphone duo concept", { confirmed: true });
  assert.match(input, /chose this exact reading/);
  assert.equal(plan.category, "product");
  mockOpenAI(() => parts, (body) => { input = body.input; });
  await planSearch("iphone duo");
  assert.doesNotMatch(input, /chose this exact reading/);
});

test("the plan is told a card is only for one named thing with a review or marketplace listing", async () => {
  let instructions = "";
  mockOpenAI(() => parts, (body) => { instructions = body.instructions; });
  await planSearch("smartphones");
  assert.match(instructions, /has its own listing on the site people check for that kind of thing/);
  assert.match(instructions, /"iPhone 17"/);
  assert.match(instructions, /NOT a brand or company alone \("Apple"/);
  assert.match(instructions, /NOT a class of things \("smartphones"/);
  assert.match(instructions, /"McDonald's", "Disneyland"/);
  assert.match(instructions, /NOT a city, country, region, island or neighbourhood \("Rome", "Melbourne"/);
  assert.match(instructions, /NOT a franchise, genre, director, band, actor or author/);
  assert.match(instructions, /NOT the company behind it \("OpenAI"\)/);
  assert.match(instructions, /condition, time, use, aspect or comparison to a thing is "general": "the weather in Rome in August"/);
  assert.match(instructions, /suggestionCategory: the category the suggestion would get on its own, by the same listing test/);
});
