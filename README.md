# What People Think

A personal, non-commercial app that reads a bounded selection of online discussion about a subject and returns a short opinion summary, estimated sentiment percentages and supporting evidence.

## Current checkpoint: BETA 0.9.4

Deployed BETA 0.9.4 on 12 September 2026. A live search for “ChatGPT” returned 234 YouTube opinions and 50 X posts, followed by a grounded OpenAI answer with separate evidence for both sources. This verifies the production X Bearer token, paid recent-search access, YouTube collection and multi-source analysis path. A prior X HTTP 400 was traced to its requirement that `end_time` be at least ten seconds old and fixed in commit `b466fbe`. Reddit remains unconnected, and the actual provider charges have not yet been reconciled against their dashboards.

The interface, server-side OpenAI analysis and YouTube/X/Reddit connectors are implemented. This workspace has no live API keys: local checks use simulated service responses, and controlled production checks use the server's configured credentials. Live evidence quality and billed cost still need auditing.

Searches now lead with the opinion itself, display **N opinions read from the last 3 months / 12 months / 3 years**, and show labelled positive/neutral/negative percentages above the bar. Live results do not say “Live sample” or “Nothing is kept”. Fictional results retain their explicit label. Source coverage explains missing platforms or comments, and live evidence links open the actual collected comments.

The search field rotates a mix of current news subjects and niche interests, such as “the weather in Tuscany in August”, “silent mechanical keyboards” and “growing tomatoes on a balcony”. Suggestions demonstrate possible searches; they do not guarantee sufficient evidence.

## Setup

Use Node.js 24 (or Node.js 22.15+ for the test runner).

```bash
npm ci
npm run dev
npm test
npm run typecheck
npm run build
npm run start
```

Open http://localhost:3000. The app uses Next.js 15.5.25, TypeScript, React and Tailwind CSS. The tests use Node's built-in runner and the existing TypeScript compiler; no additional test dependency is required.

Put credentials in `.env.local` locally or Vercel's Environment Variables. Never commit real environment files, keys or sessions. All credential handling and external service calls stay on the server.

| Setting | Purpose |
|---|---|
| `OPENAI_API_KEY` | Required for live consensus and AI-selected news suggestions. |
| `CONSENSUS_MODEL` | Defaults to `gpt-5.6-luna`; the current model is retained for these changes. |
| `YOUTUBE_API_KEY` | YouTube Data API v3 access. Collection is fixed at 10 videos × 30 comments. |
| `X_BEARER_TOKEN` | X recent search access. |
| `X_MAX_RESULTS` | Default 50; bounded to 10–100 posts per query. |
| `X_DAILY_POST_BUDGET` | Default 1,000; best-effort per-process budget, not a global billing cap. |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` | Reddit OAuth and an identifying user agent. |
| `REDDIT_MAX_POSTS`, `REDDIT_COMMENTS_PER_POST` | Defaults 10 posts and 12 comments per post. |
| `MIN_ITEMS` | Default 8 opinions before analysis; video context does not count. |

The earlier `YOUTUBE_MAX_VIDEOS` and `YOUTUBE_COMMENTS_PER_VIDEO` settings are no longer used. YouTube's 10 × 30 collection is fixed to the requested scope.

Without an AI key plus at least one source key, only six built-in fictional subjects return results: the weather in Tuscany, the newest ChatGPT model, cinema, the Keychron K2, living in Melbourne and vinyl records. Other searches clearly report that live search is unavailable. News suggestions fall back to evergreen examples without an AI key.

## Collection and analysis

`POST /api/consensus` accepts `{ "subject": "..." }`. It starts with the preceding 3 calendar months, expands to 12 months and then 36 months if fewer than 50 opinions have been collected, and reports the final window. Fifty is a collection threshold, not a claim of confidence or relevance; the model still checks the evidence. Earlier findings are kept and deduplicated. X can search only the last seven days and reports that restriction. There are no user-facing source, date or demographic filters.

- Each source has its own connector and returns a shared format with an explicit availability status. Sources run in parallel with a nine-second limit each per pass. Access failures and X recent search are not retried during expansion.
- YouTube asks for the **10 highest-viewed matching videos regardless of upload date**, then requests relevance-ranked top-level comments in parallel. When fewer than 30 comments qualify in the window, it also checks the 30 latest comments. At most **30 unique opinions per video** are selected, retaining previously selected recent opinions when widening the window. “Top” means the API's relevance ranking, not a guaranteed global ordering by likes. Fewer videos, disabled comments, timeouts or fewer in-window comments produce an explicit shortfall, not invented replacements.
- Video titles/descriptions provide context. Only comments count as YouTube opinions. Parent references connect each comment to its video. YouTube comment text is preserved in full; X and Reddit retain their existing 600-character per-entry limit.
- **All collected entries reach OpenAI.** The former 220-entry cutoff and preference for shorter entries have been removed. At the default limits this is up to 300 YouTube comments, 50 X posts and 130 Reddit posts/comments per pass (deduplicated across up to three passes), plus 10 YouTube context entries.
- OpenAI is instructed to lead with the substantive opinion, ignore spam and irrelevant material, distinguish claims from verified facts, and treat collected text as untrusted data. It must acknowledge thin evidence rather than invent themes.
- Percentages are AI estimates across relevant opinions, not audited per-comment classifications or population polling. Likes are not extra votes. Rounded display values add to 100.
- Representative links are resolved from numeric references into the collected evidence, constrained to the correct platform. The model cannot invent a source URL.
- Social-media content lives only for a request and is never permanently stored. Search responses and connector requests use `no-store`; OpenAI requests use `store: false`.

YouTube needs one video search and up to two comment-list requests per video: 11–21 requests, about 110–120 quota units. Successful and failed responses are memoized only within the request, so widening the date window does not repeat these reads. Reddit searches use the nearest supported year/all filter, then apply exact dates locally. AI cost depends on the collected text and generated output; the larger sample can cost more than the previous version.

## Response speed

Sparse searches can take longer than dense ones because they try broader windows. YouTube search/comment responses and Reddit tokens/comment responses are reused in request memory, avoiding redundant reads. No social content is cached across searches. X remains at its existing default of 50 posts for this release; increasing its paid scope and adding conversation replies is a separate decision.

X omits `end_time` for searches ending near the current instant, allowing the API to apply its indexing-safe default. Historical end times are preserved. An accepted empty response explicitly reports no matching posts. X currently quotes the entire subject as an exact phrase, so long natural-language queries can return no matches even when related discussion exists. No third-party X provider is configured.

The existing parallel collection is retained. YouTube responses request only fields used by analysis, omitting thumbnails and unrelated metadata. When only one platform has opinions, OpenAI generates its reading once and the server uses it for both the overall answer and platform evidence. Short numeric evidence references replace long source IDs. The artificial 1.1-second minimum loading wait has been removed.

These changes reduce unnecessary work without dropping selected opinions or changing the configured model. The measured niche query above verifies one live response time, not a before/after speedup: collecting more text can offset savings. Successful live responses expose `Server-Timing` durations for `collection` and `analysis`, making the remaining delay measurable without logging subjects, credentials or content. The consensus route requests a 60-second hosting limit.

## Daily example subjects

`GET /api/subjects` loads BBC RSS headlines from technology, entertainment/arts, business and world news. It accepts only valid publisher links and articles dated today in **Australia/Melbourne**, excluding future-dated stories. Up to eight headlines per feed are considered.

OpenAI selects up to six short topics. Each accepted topic must be copied directly from its supporting headline. The response includes the originating headline, URL and publication date. News topics alternate with six evergreen examples; if fewer news topics qualify, the remaining examples stay evergreen. The explanation panel attributes BBC News.

Suggestions load independently of searches. Only the public news suggestions and attribution are cached, keyed by calendar date and refreshed hourly to admit breaking news. Simultaneous requests on one server instance share the work. The browser refreshes in the background every 15 minutes while visible and when the page becomes visible. No scheduler, extra source account or new dependency is needed. Failed feeds or AI calls return evergreen examples. A first news refresh can take several seconds, but does not delay the search field or searches. Different cold server instances can still make concurrent refresh calls.

## Verification and limitations

- `npm test`: mocked YouTube collection, parallel requests, complete AI input, one-source and multi-source schemas, citation validation, partial failures, time windows, rounding, dated news parsing, topic grounding and news fallback.
- `npm run typecheck` and `npm run build`: required before a checkpoint is committed.
- Browser checks cover desktop/mobile search, labelled samples, the revised live-result layout using an explicitly fictional fixture, evidence links, source coverage, asynchronous suggestions, Enter-to-search, overflow and runtime errors.
- The public BBC feed format was checked directly, and production returned six AI-selected news topics after deployment. Controlled live queries verified YouTube/OpenAI, and a multi-source query returned 50 X posts. Detailed evidence quality and billed cost have not been audited. Mocked checks do not verify every provider failure mode or general response speed.
- Popular videos and top-ranked comments are a popularity-biased selection. Even the widest window can miss discussion, and a bounded selection is not exhaustive. Fewer than 300 opinions is expected where coverage is limited. Suggestions can be broader than the available evidence.
- The news rotation uses one publisher across several categories, not a comprehensive trend ranking.
- The glass effect needs `backdrop-filter`; smaller windows scroll within the card.

## Project structure

```text
src/app/api/consensus/route.ts     search and collection window
src/app/api/subjects/route.ts      cached daily news suggestions
src/lib/connectors/               separate source integrations and adaptive date windows
src/lib/analysis/analyse.ts        grounded OpenAI analysis and evidence mapping
src/lib/newsSubjects.ts           dated RSS headlines and grounded topic selection
src/lib/suggestions.ts            evergreen examples and interleaving
src/lib/sentiment.ts              percentage rounding
src/lib/types.ts                  shared source, evidence and result shapes
src/lib/sampleData.ts             clearly fictional demonstration results
src/components/SearchCard.tsx     search/loading/result flow and suggestions
src/components/Answer.tsx         answer, counts, percentages and source coverage
src/components/PlatformEvidence.tsx supporting themes and source links
src/lib/changelog.ts              BETA badge version and release notes
tests/                           Node tests with simulated service responses
```

See [PROJECT.md](PROJECT.md) for scope, [DESIGN.md](DESIGN.md) for the agreed visual direction, and [AGENTS.md](AGENTS.md) for development rules. Accounts, payments and demographic inference remain excluded. The GitHub repository remains private.
