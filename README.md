# What People Think

A personal, non-commercial app that reads a bounded selection of online discussion about a subject and returns a short opinion summary, recurring opinion pills and linked evidence.

## Current checkpoint: BETA 0.10.1

The preceding BETA 0.9.5 checkpoint was deployed from commit `6f354ed` on 12 September 2026. It prepares the Reddit connector for approved OAuth access, adds Reddit-specific connector tests, preserves the public username attribution required for representative Reddit evidence, and adds a live privacy page. Reddit's current policy requires explicit approval before Data API access, including for non-commercial apps, so the production connector remains off until Reddit approves the use case and issues or authorizes credentials. The preceding checkpoint verified YouTube and X archive collection; billed charges have not been reconciled against provider dashboards.

BETA 0.10.1 adds a web fact-check before live platform collection. It resolves official spelling and supported aliases, supplies cited current facts to analysis, and stops with a clear explanation when the subject is ambiguous, unverified or the lookup is unavailable. This checkpoint is locally verified only; the new lookup has not been deployed or exercised with paid live API access.

The interface, server-side OpenAI analysis and YouTube/X/Reddit connectors are implemented. This workspace has no live API keys: local checks use simulated service responses, and controlled production checks use the server's configured credentials. Live evidence quality and billed cost still need auditing.

The interface uses the user’s turquoise, shell-pink, peach and salmon palette. Search expands into the overall answer; recurring opinions float into place in green, grey or red glass pills. Desktop shows up to six initially, mobile three. The page stays fixed, with internal scrolling when necessary. Source buttons are logos only and replace the answer with a full-screen evidence view. A source view contains its logo, a full-width sentiment bar, and original post titles followed by sentiment-coloured comment excerpts. Each live post section links to its collected parent URL. Show more reveals the remaining analysed post groups without numeric totals. The overall meter is in About this answer. Analysed counts and repeated platform headings are not displayed.

The new source classifications and recurring-opinion schema pass mocked checks; their live latency, output quality and cost have not yet been verified. This checkpoint does not change source request limits. The loading bar is indeterminate and respects reduced motion.

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
| `SUBJECT_MODEL` | Optional web research/extraction model; defaults to `CONSENSUS_MODEL`, then `gpt-5.6-luna`. Must support Responses web search and Structured Outputs. |
| `CONSENSUS_MODEL` | Defaults to `gpt-5.6-luna`; the current model is retained for these changes. |
| `YOUTUBE_API_KEY` | YouTube Data API v3 access. Collection is fixed at 10 videos × 30 comments. |
| `X_BEARER_TOKEN` | X full-archive search access (pay-per-use or Enterprise). |
| `X_MAX_RESULTS` | Default 20; bounded to 10–20 posts per query, including older environment overrides. Up to US$0.10 in post-read charges at US$0.005 per post, excluding AI. |
| `X_DAILY_POST_BUDGET` | Default 1,000; best-effort per-process budget, not a global billing cap. |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` | All three are required to activate Reddit: approved OAuth credentials and Reddit's identifying user-agent string. |
| `REDDIT_MAX_POSTS`, `REDDIT_COMMENTS_PER_POST` | Defaults 10 posts and 12 comments per post. |
| `MIN_ITEMS` | Default 8 opinions before analysis; video context does not count. |

The earlier `YOUTUBE_MAX_VIDEOS` and `YOUTUBE_COMMENTS_PER_VIDEO` settings are no longer used. YouTube's 10 × 30 collection is fixed to the requested scope.

Without an AI key plus at least one source key, only six built-in fictional subjects return results: the weather in Tuscany, the newest ChatGPT model, cinema, the Keychron K2, living in Melbourne and vinyl records. Other searches clearly report that live search is unavailable. News suggestions fall back to evergreen examples without an AI key.

## Collection and analysis

`POST /api/consensus` accepts `{ "subject": "..." }`. Before collecting live discussion, it uses OpenAI Responses web search (not a direct Google integration) to identify the subject from current cited sources. Research requires web search, allows at most two built-in tool calls and 2,400 output tokens; a separate extraction call allows 2,000 output tokens. Both share a 20-second deadline, disable retries and response storage, and use no new dependency. A resolved name and description require valid references to actual HTTPS citation annotations. Unsupported aliases and facts are dropped. This validates provenance, not the truth of every model interpretation; semantic accuracy needs live evaluation.

Official capitalization is preserved. Up to two supported aliases join the canonical name in one platform search query, using each platform’s OR syntax without multiplying post-read limits. The raw input is retained in context; it is not automatically added as an alias. Generic topics should stay generic. Ambiguous/unverified subjects or unavailable research return `subject-unresolved` before any platform reads. Sample mode skips the lookup. Web facts never count as opinions or contribute to sentiment. The analyser receives dated context and must distinguish speculation, announcement reactions and ownership. This temporal distinction is model-based; collection still follows the agreed windows and all collected entries reach analysis. Linked facts and the confidence explanation appear in About this answer.

YouTube/Reddit start with the preceding 3 calendar months and expand to 12 months and then 36 months if fewer than 50 total opinions have been collected. Fifty is a collection threshold, not a claim of confidence or relevance; the model still checks the evidence. Earlier findings are kept and deduplicated. X independently searches 3, 12 and 36 months using its full archive, expanding only on empty responses and stopping at the first matches. The response metadata and AI input retain the widest completed search window and X's own window. There are no user-facing source, date or demographic filters.

- Each source has its own connector and returns a shared format with an explicit availability status. Sources run in parallel with a nine-second limit each per pass. X's complete fallback sequence shares one nine-second limit. Access failures are not retried; X archive failures explicitly report the incomplete window.
- YouTube asks for the **10 highest-viewed matching videos regardless of upload date**, then requests relevance-ranked top-level comments in parallel. When fewer than 30 comments qualify in the window, it also checks the 30 latest comments. At most **30 unique opinions per video** are selected, retaining previously selected recent opinions when widening the window. “Top” means the API's relevance ranking, not a guaranteed global ordering by likes. Fewer videos, disabled comments, timeouts or fewer in-window comments produce an explicit shortfall, not invented replacements.
- Video titles/descriptions provide context. Only comments count as YouTube opinions. Parent references connect each comment to its video. Collected opinion text is preserved in full across connectors. Separate titles and parent IDs keep comments attached to their original videos/posts.
- **All collected entries reach OpenAI.** The former 220-entry cutoff and preference for shorter entries have been removed. At the default limits this is up to 300 YouTube comments, 20 X posts and 130 Reddit posts/comments per pass (deduplicated across up to three passes), plus 10 YouTube context entries.
- OpenAI is instructed to lead with the substantive opinion, ignore spam and irrelevant material, distinguish claims from verified facts, and treat collected text as untrusted data. It must acknowledge thin evidence rather than invent themes.
- The model labels each collected non-video entry positive, neutral, negative or irrelevant. Platform bars are derived from valid classifications; they are model judgements, not population polling. The overall meter remains an AI estimate. Likes are not additional opinions. Unknown classifications remain explicitly unclassified.
- The server copies post titles, verbatim text and parent links from collected entries. Only HTTPS links on the matching platform are rendered. Excerpts may end after 260 characters and show an ellipsis; open the post for full context. X supplies the post itself when no replies were collected. Recurring sentences require at least two distinct supporting texts and valid references. Repeated sentences and duplicate references are removed; at most twenty survive. All relevant grouped posts remain available behind Show more.
- Social-media content lives only for a request and is never permanently stored. Search responses and connector requests use `no-store`; OpenAI requests use `store: false`.

YouTube needs one video search and up to two comment-list requests per video: 11–21 requests, about 110–120 quota units. Successful and failed responses are memoized only within the request, so widening the date window does not repeat these reads. Reddit searches use the nearest supported year/all filter, then apply exact dates locally. AI cost includes the preliminary web research/extraction as well as collected text and generated output; the larger sample can cost more than the previous version.

## Reddit access

Reddit now requires a submitted request and explicit approval for all Data API access. The connector is locally verified with simulated OAuth, search, comment, date-filter and partial-failure responses, but that does not prove live access. Apply through Reddit's [Data API request form](https://support.reddithelp.com/hc/en-us/requests/new?tf_42139884615700=api_request_type_developer_clone&ticket_form_id=14868593862164), describe the OpenAI processing and non-storage accurately, and follow Reddit's credential instructions after approval. Do not add unapproved or scraped session credentials.

The approved confidential client is expected to use an application-only OAuth token. Its user agent must follow Reddit's identifying format, for example `web:what-are-people-saying:v1 (by /u/your_username)`. Reddit's documented free-access limit for eligible approved clients is 100 queries per minute averaged over ten minutes, but Reddit decides eligibility and may impose different limits or fees.

One app search makes one token request, up to two distinct listing searches across the 3/12/36-month fallback, and up to 20 distinct comment-list requests in the theoretical worst case. That is at most 23 Reddit HTTP requests and 260 unique posts/comments before deduplication, with no pagination, background collection or app database. Search and comment responses are reused only inside the active request.

Reddit representative evidence links to the original item and shows the supplied public username for attribution. Usernames are not included in the OpenAI prompt or used for demographic inference. The public `/privacy` page explains processing by the app, OpenAI and infrastructure providers.

## Response speed

Sparse searches can take longer than dense ones because they try broader windows. YouTube search/comment responses and Reddit tokens/comment responses are reused in request memory, avoiding redundant reads. No social content is cached across searches. X makes up to three archive requests, at least 1.05 seconds apart after empty responses, and stops at the first nonempty response. Therefore at most one response contains paid posts: up to 20 total, with no extra reply requests or pagination. Its daily budget reserves 20 posts once for the complete search, not once per date window. The result is memoized within the request and is not fetched again when other sources expand.

X omits `end_time` for searches ending near the current instant, allowing the API to apply its indexing-safe default. Historical end times are preserved. An accepted empty response explicitly reports no matching posts over three years. X searches the verified name and up to two supported aliases as quoted phrases joined with OR. Narrow or long phrases can still miss relevant discussion. No third-party X provider is configured.

The existing parallel collection is retained. YouTube responses request only fields used by analysis, omitting thumbnails and unrelated metadata. When only one platform has opinions, OpenAI generates its reading once and the server uses it for both the overall answer and platform evidence. Short numeric evidence references replace long source IDs. The same analysis call now also classifies entries and supplies recurring-opinion references. Its output ceiling is 16,000 tokens instead of 6,000 to accommodate those labels; this can increase analysis latency and cost and needs a controlled live follow-up. The artificial 1.1-second minimum loading wait has been removed.

These changes reduce unnecessary work without dropping selected opinions or changing the configured model. The measured niche query above verifies one live response time, not a before/after speedup: collecting more text can offset savings. Successful live responses expose `Server-Timing` durations for `lookup`, `collection` and `analysis`, making the remaining delay measurable without logging subjects, credentials or content. The consensus route requests a 60-second hosting limit and gives the final analysis only the remaining time before a 55-second request deadline, with no analysis retries. The new research and extraction calls add latency and AI/web-search charges; paid live timing, model/tool access and actual costs remain unverified.

## Daily example subjects

`GET /api/subjects` loads BBC RSS headlines from technology, entertainment/arts, business and world news. It accepts only valid publisher links and articles dated today in **Australia/Melbourne**, excluding future-dated stories. Up to eight headlines per feed are considered.

OpenAI selects up to six short topics. Each accepted topic must be copied directly from its supporting headline. The response includes the originating headline, URL and publication date. News topics alternate with six evergreen examples; if fewer news topics qualify, the remaining examples stay evergreen. The suggestions endpoint includes BBC attribution.

Suggestions load independently of searches. Only the public news suggestions and attribution are cached, keyed by calendar date and refreshed hourly to admit breaking news. Simultaneous requests on one server instance share the work. The browser refreshes in the background every 15 minutes while visible and when the page becomes visible. No scheduler, extra source account or new dependency is needed. Failed feeds or AI calls return evergreen examples. A first news refresh can take several seconds, but does not delay the search field or searches. Different cold server instances can still make concurrent refresh calls.

## Verification and limitations

- Current checkpoint: 44 mocked tests, TypeScript and the production build pass. The new tests cover official naming, supported aliases, generic subjects, ambiguity, citation validation, failed/cancelled lookup, sample bypass and the full route through real connector/analysis code using simulated responses. Desktop (1440×900) and mobile (390×844) browser checks passed for sample search, verified naming, linked facts, Back navigation, ambiguity and lookup-failure retry, with no runtime errors or document overflow. Browser responses were explicitly simulated. The new lookup and changed analysis prompt still need a controlled live check.
- `npm test`: mocked YouTube collection, parallel requests, complete AI input, one-source and multi-source schemas, citation validation, partial failures, time windows, rounding, dated news parsing, topic grounding and news fallback.
- `npm run typecheck` and `npm run build`: required before a checkpoint is committed.
- Browser checks cover desktop/mobile search, labelled samples, the revised live-result layout using an explicitly fictional fixture, evidence links, source coverage, asynchronous suggestions, Enter-to-search, overflow and runtime errors.
- The public BBC feed format was checked directly, and production returned six AI-selected news topics after deployment. Controlled live queries verified YouTube/OpenAI, and an earlier multi-source query returned 50 X posts before the current 20-post cap. Reddit is locally verified only with simulated provider responses; approval and live access remain pending. Detailed evidence quality and billed cost have not been audited.
- Popular videos and top-ranked comments are a popularity-biased selection. Even the widest window can miss discussion, and a bounded selection is not exhaustive. Fewer than 300 opinions is expected where coverage is limited. Suggestions can be broader than the available evidence.
- The news rotation uses one publisher across several categories, not a comprehensive trend ranking.
- The glass effect needs `backdrop-filter`; smaller windows scroll within the card.

## Project structure

```text
src/app/api/consensus/route.ts     search and collection window
src/app/api/subjects/route.ts      cached daily news suggestions
src/lib/connectors/               separate source integrations and adaptive date windows
src/lib/analysis/analyse.ts        grounded OpenAI analysis and evidence mapping
src/lib/subjectContext.ts         bounded web research and cited subject resolution
src/lib/connectors/query.ts       platform-specific alias queries within existing limits
src/components/SubjectFacts.tsx   linked facts, separate from social evidence
src/lib/newsSubjects.ts           dated RSS headlines and grounded topic selection
src/lib/suggestions.ts            evergreen examples and interleaving
src/lib/sentiment.ts              percentage rounding
src/lib/types.ts                  shared source, evidence and result shapes
src/lib/sampleData.ts             clearly fictional demonstration results
src/components/SearchCard.tsx     search/loading/result flow and suggestions
src/components/Answer.tsx         short answer, platform logos and qualitative coverage
src/components/PlatformEvidence.tsx parent post links and verbatim comment pills
src/components/OpinionPills.tsx   recurring opinions around the answer
src/lib/analysis/evidence.ts      validated grouping, classification and source URLs
src/lib/changelog.ts              BETA badge version and release notes
tests/                           Node tests with simulated service responses
```

See [PROJECT.md](PROJECT.md) for scope, [DESIGN.md](DESIGN.md) for the agreed visual direction, and [AGENTS.md](AGENTS.md) for development rules. Accounts, payments and demographic inference remain excluded. The GitHub repository remains private.
