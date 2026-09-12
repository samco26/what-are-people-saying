/* Reddit, through its approved OAuth Data API access.

   Three steps: a client-credentials token, a search for posts about the
   subject, then the top comments on each of the first few posts. Post
   titles with their text and the comments both become items.

   Bounds: REDDIT_MAX_POSTS (default 10) and REDDIT_COMMENTS_PER_POST
   (default 12), so at most about 130 items and twelve calls a search,
   against Reddit's free-access limit of 100 calls a minute per OAuth client.
   The user agent is required by Reddit's rules and has to name the app and
   the account. Access must be approved by Reddit before these credentials
   are used.

   Not verified against the live API yet: written from the API's published
   shapes and switched on only when both Reddit keys and the identifying user
   agent exist. */

import type { SourceItem } from "../types";
import { env, envInt } from "../env";
import { platformQuery } from "./query";
import { getJson, getOnce, inWindow, reasonFor, statusFor, type Collected, type CollectOptions, type Connector } from "./shared";

const AUTH = "https://www.reddit.com/api/v1/access_token";
const API = "https://oauth.reddit.com";

interface TokenResponse {
  access_token?: string;
}

interface Listing<T> {
  data?: { children?: Array<{ kind?: string; data?: T }> };
}

interface Post {
  id?: string;
  title?: string;
  selftext?: string;
  author?: string;
  subreddit?: string;
  score?: number;
  created_utc?: number;
  permalink?: string;
  num_comments?: number;
}

interface Comment {
  id?: string;
  body?: string;
  score?: number;
  created_utc?: number;
  permalink?: string;
  author?: string;
  subreddit?: string;
}

function attribution(author?: string, subreddit?: string): string | undefined {
  const parts = [author ? `u/${author}` : undefined, subreddit ? `r/${subreddit}` : undefined].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

async function token(signal: AbortSignal, agent: string): Promise<string> {
  const id = env("REDDIT_CLIENT_ID") ?? "";
  const secret = env("REDDIT_CLIENT_SECRET") ?? "";
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await getJson<TokenResponse>(AUTH, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Basic ${basic}`,
      "User-Agent": agent,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.access_token) throw new Error("Reddit returned no token.");
  return res.access_token;
}

const isoFromUtc = (s?: number) => (typeof s === "number" ? new Date(s * 1000).toISOString() : undefined);

async function collect(opts: CollectOptions): Promise<Collected> {
  const agent = env("REDDIT_USER_AGENT") ?? "";
  const maxPosts = envInt("REDDIT_MAX_POSTS", 10, 1, 25);
  const perPost = envInt("REDDIT_COMMENTS_PER_POST", 12, 1, 50);
  const bearer = await getOnce("reddit:token", opts, () => token(opts.signal, agent));
  const headers = { Authorization: `bearer ${bearer}`, "User-Agent": agent };

  const search = new URL(`${API}/search`);
  search.searchParams.set("q", opts.aliases?.length ? platformQuery("reddit", opts) : opts.queries?.reddit ?? opts.subject);
  search.searchParams.set("sort", "relevance");
  search.searchParams.set("t", opts.from && opts.to && opts.to.getTime() - opts.from.getTime() <= 366 * 86_400_000 ? "year" : "all");
  search.searchParams.set("limit", String(maxPosts));
  search.searchParams.set("type", "link");
  search.searchParams.set("raw_json", "1");

  const found = await getOnce(search.toString(), opts, () => getJson<Listing<Post>>(search.toString(), { signal: opts.signal, headers }));
  const posts = (found.data?.children ?? [])
    .map((c) => c.data)
    .filter((p): p is Post => Boolean(p && p.id && p.title))
    .filter((p) => inWindow(isoFromUtc(p.created_utc), opts.from, opts.to));

  const items: SourceItem[] = posts.map((p) => ({
    id: `reddit:post:${p.id}`,
    source: "reddit",
    kind: "thread",
    text: `${p.title}\n${p.selftext ?? ""}`.trim(),
    title: p.title,
    author: attribution(p.author, p.subreddit),
    url: p.permalink ? `https://www.reddit.com${p.permalink}` : undefined,
    publishedAt: isoFromUtc(p.created_utc),
    engagement: p.score,
  }));

  const failures: string[] = [];
  const commentRuns = posts.map(async (p) => {
    const url = new URL(`${API}/comments/${p.id}`);
    url.searchParams.set("sort", "top");
    url.searchParams.set("limit", String(perPost));
    url.searchParams.set("depth", "1");
    url.searchParams.set("raw_json", "1");
    try {
      const res = await getOnce(url.toString(), opts, () => getJson<Array<Listing<Comment>>>(url.toString(), { signal: opts.signal, headers }));
      const listing = res[1];
      return (listing?.data?.children ?? [])
        .filter((c) => c.kind === "t1" && c.data?.body && c.data.id)
        .map((c) => c.data!)
        .filter((c) => c.body !== "[deleted]" && c.body !== "[removed]")
        .filter((c) => inWindow(isoFromUtc(c.created_utc), opts.from, opts.to))
        .map(
          (c): SourceItem => ({
            id: `reddit:comment:${c.id}`,
            source: "reddit",
            kind: "comment",
            text: c.body ?? "",
            parentId: `reddit:post:${p.id}`,
            author: attribution(c.author, c.subreddit ?? p.subreddit),
            url: c.permalink ? `https://www.reddit.com${c.permalink}` : undefined,
            publishedAt: isoFromUtc(c.created_utc),
            engagement: c.score,
          }),
        );
    } catch (error) {
      failures.push(reasonFor(error, opts.signal.aborted));
      return [] as SourceItem[];
    }
  });
  for (const batch of await Promise.all(commentRuns)) items.push(...batch);

  const asked = maxPosts + maxPosts * perPost;
  const notes = [
    `Read ${items.length} of up to ${asked} Reddit posts and comments from ${posts.length} matching threads; entries are filtered to the search window.`,
    failures.length ? `${failures.length} comment sections could not be read. ${[...new Set(failures)].join(" ")}` : "",
  ].filter(Boolean);
  return {
    items,
    canExpand: posts.length === 0 || failures.length < posts.length,
    status: { ...statusFor("reddit", items.length, asked), note: notes.join(" ") },
  };
}

export const reddit: Connector = {
  id: "reddit",
  configured: () => Boolean(env("REDDIT_CLIENT_ID") && env("REDDIT_CLIENT_SECRET") && env("REDDIT_USER_AGENT")),
  collect,
};
