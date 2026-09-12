import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { reddit } from "../src/lib/connectors/reddit.ts";

const originalFetch = globalThis.fetch;
const originalError = console.error;
const names = ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USER_AGENT", "REDDIT_MAX_POSTS", "REDDIT_COMMENTS_PER_POST"];
const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalError;
  for (const name of names) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const options = () => ({
  subject: "fictional keyboard",
  from: new Date("2026-06-12T00:00:00Z"),
  to: new Date("2026-09-12T00:00:00Z"),
  signal: new AbortController().signal,
  memo: new Map(),
});

function credentials() {
  process.env.REDDIT_CLIENT_ID = "test-client-id";
  process.env.REDDIT_CLIENT_SECRET = "test-client-secret";
  process.env.REDDIT_USER_AGENT = "web:what-are-people-saying:v1 (by /u/test_account)";
}

test("Reddit requires both approved OAuth credentials and an identifying user agent", () => {
  delete process.env.REDDIT_CLIENT_ID;
  delete process.env.REDDIT_CLIENT_SECRET;
  delete process.env.REDDIT_USER_AGENT;
  assert.equal(reddit.configured(), false);
  process.env.REDDIT_CLIENT_ID = "test-client-id";
  process.env.REDDIT_CLIENT_SECRET = "test-client-secret";
  assert.equal(reddit.configured(), false);
  process.env.REDDIT_USER_AGENT = "web:test:v1 (by /u/test_account)";
  assert.equal(reddit.configured(), true);
});

test("Reddit exchanges credentials server-side and maps posts and comments with attribution", async () => {
  credentials();
  process.env.REDDIT_MAX_POSTS = "2";
  process.env.REDDIT_COMMENTS_PER_POST = "2";
  const calls = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push(url);
    assert.equal(init.cache, "no-store");
    assert.equal(init.headers["User-Agent"], process.env.REDDIT_USER_AGENT);
    if (url.pathname === "/api/v1/access_token") {
      assert.equal(init.method, "POST");
      assert.equal(init.body, "grant_type=client_credentials");
      assert.equal(init.headers.Authorization, `Basic ${Buffer.from("test-client-id:test-client-secret").toString("base64")}`);
      return json({ access_token: "test-bearer" });
    }
    assert.equal(init.headers.Authorization, "bearer test-bearer");
    if (url.pathname === "/search") {
      assert.equal(url.hostname, "oauth.reddit.com");
      assert.equal(url.searchParams.get("q"), "fictional keyboard");
      assert.equal(url.searchParams.get("t"), "year");
      assert.equal(url.searchParams.get("limit"), "2");
      return json({ data: { children: [
        { kind: "t3", data: { id: "p1", title: "Fictional keyboard review", selftext: "A test post.", author: "post_author", subreddit: "keyboards", created_utc: 1_789_084_800, permalink: "/r/keyboards/comments/p1/test/", score: 7 } },
        { kind: "t3", data: { id: "old", title: "Old post", created_utc: 1_704_067_200 } },
      ] } });
    }
    assert.equal(url.pathname, "/comments/p1");
    assert.equal(url.searchParams.get("sort"), "top");
    assert.equal(url.searchParams.get("limit"), "2");
    return json([{}, { data: { children: [
      { kind: "t1", data: { id: "c1", body: "Fictional helpful comment", author: "comment_author", subreddit: "keyboards", created_utc: 1_789_084_800, permalink: "/r/keyboards/comments/p1/test/c1/", score: 4 } },
      { kind: "more", data: { id: "more" } },
    ] } }]);
  };

  const result = await reddit.collect(options());
  assert.equal(calls.length, 3);
  assert.equal(result.items.length, 2);
  assert.deepEqual(result.items.map((item) => item.author), ["u/post_author · r/keyboards", "u/comment_author · r/keyboards"]);
  assert.deepEqual(result.items.map((item) => item.url), [
    "https://www.reddit.com/r/keyboards/comments/p1/test/",
    "https://www.reddit.com/r/keyboards/comments/p1/test/c1/",
  ]);
  assert.equal(result.status.itemsAnalysed, 2);
  assert.match(result.status.note, /2 of up to 6 Reddit posts and comments from 1 matching threads/);
});

test("Reddit preserves readable threads and reports comment-section failures", async () => {
  credentials();
  process.env.REDDIT_MAX_POSTS = "2";
  process.env.REDDIT_COMMENTS_PER_POST = "1";
  console.error = () => {};
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/v1/access_token") return json({ access_token: "test-bearer" });
    if (url.pathname === "/search") return json({ data: { children: [
      { data: { id: "p1", title: "First fictional thread", author: "one", subreddit: "testing", created_utc: 1_789_084_800 } },
      { data: { id: "p2", title: "Second fictional thread", author: "two", subreddit: "testing", created_utc: 1_789_084_800 } },
    ] } });
    if (url.pathname === "/comments/p1") return json({}, 403);
    return json([{}, { data: { children: [{ kind: "t1", data: { id: "c2", body: "Readable fictional reply", author: "reader", created_utc: 1_789_084_800 } }] } }]);
  };

  const result = await reddit.collect(options());
  assert.equal(result.items.length, 3);
  assert.equal(result.status.availability, "ok");
  assert.match(result.status.note, /1 comment sections could not be read/);
  assert.match(result.status.note, /Access was refused/);
  assert.equal(result.canExpand, true);
});
