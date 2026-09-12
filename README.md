# What People Think

A personal, non-commercial app that reads a bounded selection of online discussion about a subject and returns a short opinion summary, recurring opinion pills and linked evidence.

## Current checkpoint: BETA 0.13.1 — search interruption fix

Every category now uses the default answer and floating opinion pills. Films/media, products, places and apps use a compact sentiment star score beside the source icons; general subjects retain the meter. The score and icons have equal height (44px desktop, 40px phone). All results show their interpreted subject. Suggestions pulse subtly instead of showing a Tab badge, remain clickable/keyboard accessible, and respect reduced motion. Duplicate post headings are suppressed when they repeat the coloured quote.

The search pipeline now classifies every collected item before writing the summary. Overall and platform meters, stars and the qualitative verdict use the same accepted classification counts. Unclassified, conflicting, irrelevant and exact duplicate evidence cannot contribute. Opinion drilldowns show only their supporting comments. Too few surviving opinions produces an insufficient-evidence result. Extraction and planning share a request, keeping four successful-path AI requests overall. See [SEARCH_AUDIT.md](SEARCH_AUDIT.md) for the findings, tradeoffs and pending live evaluation.

Production searches for “iphone fold” reproduced HTTP 502 twice (23.4 and 25.7 seconds). Safe diagnostics identified `classification_references`: the model omitted, duplicated or invented references in its four classification lists. BETA 0.13.1 replaces those lists with one required enum field per collected opinion, enforced by Structured Outputs. Video context has no classification slot. Completeness and evidence filtering stay enforced; no repair call, source reads or automatic paid retries are added. Vercel successfully deployed `9eb7b96`, and the production homepage returned HTTP 200 with BETA 0.13.1. A controlled “iphone fold” search then returned HTTP 200 and a product result in 24.67 seconds: 27 accepted YouTube opinions, 4 X opinions and 9 recurring themes. YouTube reported partial coverage, X was available and Reddit remained unavailable. Server timing: lookup 9.559 seconds, collection 0.657 seconds, analysis 13.406 seconds. No social content was persisted. This verifies the original failure is resolved for that live request, not broad semantic accuracy, population representativeness or billed savings.

The preceding BETA 0.9.5 checkpoint was deployed from commit `6f354ed` on 12 September 2026. It prepares the Reddit connector for approved OAuth access, adds Reddit-specific connector tests, preserves the public username attribution required for representative Reddit evidence, and adds a live privacy page. Reddit's current policy requires explicit approval before Data API access, including for non-commercial apps, so the production connector remains off until Reddit approves the use case and issues or authorizes credentials. The preceding checkpoint verified YouTube and X archive collection; billed charges have not been reconciled against provider dashboards.

The interface, server-side OpenAI analysis and YouTube/X/Reddit connectors are implemented. This workspace has no live API keys: local checks use simulated service responses, and controlled production checks use the server's configured credentials. Live evidence quality and billed cost still need auditing.

The interface uses the user’s turquoise, shell-pink, peach and salmon palette. Search expands into the overall answer; recurring opinions float into place in green, grey or red glass pills. Desktop shows up to six initially; on phones the whole list sits under the answer and scrolls within itself. The page stays fixed, with internal scrolling when necessary. Source buttons are logos only and replace the answer with a full-screen evidence view. A source view contains its logo, a full-width sentiment bar, and original post titles followed by sentiment-coloured comment excerpts. Each live post section links to its collected parent URL. Show more reveals the remaining analysed post groups without numeric totals. For general subjects the compact overall sentiment bar sits beside the platform icons; the four review categories use stars in the icon row. Tapping anywhere outside an expanded view closes it. Analysed counts and repeated platform headings are not displayed.

Source request limits are unchanged. Loading starts with “Finding what people think…” and rotates connected-platform and reading/summary placeholders every 3.6 seconds, with a left-to-right sweep. These are placeholders, not measured server stages. Reduced motion disables the text animation. `GET /api/consensus` returns only connected source IDs without calling any provider; unavailable platforms are omitted from the rotation.

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
| `OPENAI_API_KEY` | Required for live consensus, the search plan that precedes each collection, and AI-selected news suggestions. |
| `SUBJECT_MODEL` | Optional lookup model; defaults to `CONSENSUS_MODEL`, then `gpt-5.6-luna`. Must support Responses web search and Structured Outputs. |
| `CONSENSUS_MODEL` | Defaults to `gpt-5.6-luna`; used by the analysis, the search plan and the news suggestions. |
| `YOUTUBE_API_KEY` | YouTube Data API v3 access. Collection is fixed at 10 videos × 30 comments. |
| `X_BEARER_TOKEN` | X full-archive search access (pay-per-use or Enterprise). |
| `X_MAX_RESULTS` | Default 20; bounded to 10–20 posts per query, including older environment overrides. Up to US$0.10 in post-read charges at US$0.005 per post, excluding AI. |
| `X_DAILY_POST_BUDGET` | Default 1,000 posts a day; best-effort per-process budget, not a global billing cap. Only posts actually returned count against it; empty and failed searches give their reservation back. Set the monthly spend limit in X's developer console for an enforceable ceiling. |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` | All three are required to activate Reddit: approved OAuth credentials and Reddit's identifying user-agent string. |
| `REDDIT_MAX_POSTS`, `REDDIT_COMMENTS_PER_POST` | Defaults 10 posts and 12 comments per post. |
| `MIN_ITEMS` | Default 8 opinions before analysis; video context does not count. |

The earlier `YOUTUBE_MAX_VIDEOS` and `YOUTUBE_COMMENTS_PER_VIDEO` settings are no longer used. YouTube's 10 × 30 collection is fixed to the requested scope.

Without an AI key plus at least one source key, seven built-in fictional subjects return results: the weather in Tuscany, the newest ChatGPT model, cinema, the Keychron K2, living in Melbourne, the fictional Harbour Lane Burgers and vinyl records. Other searches clearly report that live search is unavailable. News suggestions fall back to evergreen examples without an AI key.

## Collection and analysis

Live searches use four AI requests on the successful path:

1. A current web lookup establishes identity and cited facts (at most two web tool calls; 2,400 output-token ceiling).
2. One structured request extracts the official name, description, up to two cited aliases and five dated facts **and** the category/platform search plan (2,600 output-token ceiling). These first two requests share a 20-second deadline. An unresolved or failed lookup preserves the newer advisory behaviour: search the literal input with no invented facts, aliases or category, and use low confidence. A browser category hint cannot override the verified category.
3. After parallel collection, one request reads all collected entries and returns complete positive/neutral/negative/irrelevant classifications, recurring opinions and representative references (16,000 output-token ceiling). Promotional text, questions without opinions, unrelated subjects and creator praise must be excluded. Neutral means an explicit balanced or indifferent assessment. The server validates completeness, removes duplicates and checks theme references. Each non-video reference has one required positive/neutral/negative/irrelevant field in the response schema, preventing missing or duplicate assignments during generation. Invalid responses still fail explicitly, without automatic paid retries.
4. A short writing request gets only accepted theme sentences/support counts, calculated sentiment, source/group counts, date range and factual context (700 output-token ceiling). Raw comments are not sent a second time. Both analysis steps share the remaining time before the route's 55-second deadline. Fewer than eight accepted opinions skips this writing request and returns insufficient evidence; `MIN_ITEMS` can raise that threshold, but cannot lower it below eight.

`POST /api/consensus` accepts `{ "subject": "..." }`. Query syntax is assembled in code from sanitised plan fields. X uses subject phrases in OR clauses, never standalone generic keywords such as “heat”; YouTube uses subject-specific plain terms and exclusions; Reddit uses the concise subject. Supported aliases are combined within the existing bounded requests. All context and evidence live only for the request. API calls disable response storage and retries. Citation checks verify source provenance, not factual correctness; semantic relevance and accurate summaries still require live evaluation.

Stars are a sentiment index: `1 + 4 × (positive + 0.5 × neutral) / accepted`, rounded to one decimal. This is not a submitted review average. No rating is shown for empty or entirely neutral evidence. There are no popularity-site thresholds, hidden priors or sample-size adjustments. The qualitative direction uses the same balance (positive at 60% or above, negative at 40% or below, otherwise mixed). These are product conventions, not statistically validated public approval measures. Confidence is low without verified identity, for fewer than 50 accepted opinions, one platform or fewer than five post groups, and at most medium otherwise because selection remains biased.

YouTube/Reddit start with the preceding 3 calendar months and expand to 12 months and then 36 months if fewer than 50 total opinions have been collected. Fifty is a collection threshold, not a claim of confidence or relevance; the model still checks the evidence. Earlier findings are kept and deduplicated. X independently searches 3, 12 and 36 months using its full archive, expanding only on empty responses and stopping at the first matches. The response metadata and AI input retain the widest completed search window and X's own window. There are no user-facing source, date or demographic filters.

- Each source has its own connector and returns a shared format with an explicit availability status. Sources run in parallel with a nine-second limit each per pass. X's complete fallback sequence shares one nine-second limit. Access failures are not retried; X archive failures explicitly report the incomplete window.
- YouTube asks for the **10 highest-viewed matching videos regardless of upload date**, then requests relevance-ranked top-level comments in parallel. When fewer than 30 comments qualify in the window, it also checks the 30 latest comments. At most **30 unique opinions per video** are selected: opinions kept from an earlier pass first, then the most-liked of the rest (no minimum, so a small subject's unliked comments still count), retaining previously selected recent opinions when widening the window. “Top” means the API's relevance ranking, not a guaranteed global ordering by likes. Fewer videos, disabled comments, timeouts or fewer in-window comments produce an explicit shortfall, not invented replacements.
- Video titles/descriptions provide context. Only comments count as YouTube opinions. Parent references connect each comment to its video. Collected opinion text is preserved in full across connectors. Separate titles and parent IDs keep comments attached to their original videos/posts.
- **All collected entries reach OpenAI.** The former 220-entry cutoff and preference for shorter entries have been removed. At the default limits this is up to 300 YouTube comments, 20 X posts and 130 Reddit posts/comments per pass (deduplicated across up to three passes), plus 10 YouTube context entries.
- OpenAI is instructed to lead with the substantive opinion, ignore spam and irrelevant material, distinguish claims from verified facts, and treat collected text as untrusted data. It must acknowledge thin evidence rather than invent themes.
- The model labels each collected non-video entry positive, neutral, negative or irrelevant. All meters, stars and the verdict derive from accepted classification counts; the labels are model judgements, not population polling. Likes are not additional opinions. Unknown classifications cannot count as evidence.
- The server copies post titles, verbatim text and parent links from collected entries. Only HTTPS links on the matching platform are rendered. Excerpts may end after 260 characters and show an ellipsis; open the post for full context. X supplies the post itself when no replies were collected. Recurring sentences require at least two distinct supporting texts and valid references. Repeated sentences and duplicate references are removed; at most twenty survive. All relevant grouped posts remain available behind Show more.
- Social-media content lives only for a request and is never permanently stored. Search responses and connector requests use `no-store`; OpenAI requests use `store: false`.

YouTube needs one video search and two comment-list requests per video, top and recent read together: 21 requests, about 120 quota units. Successful and failed responses are memoized only within the request, so widening the date window does not repeat these reads. Reddit searches use the nearest supported year/all filter, then apply exact dates locally. AI cost depends on the collected text and generated output; the larger sample can cost more than the previous version.

## Reddit access

Reddit now requires a submitted request and explicit approval for all Data API access. The connector is locally verified with simulated OAuth, search, comment, date-filter and partial-failure responses, but that does not prove live access. Apply through Reddit's [Data API request form](https://support.reddithelp.com/hc/en-us/requests/new?tf_42139884615700=api_request_type_developer_clone&ticket_form_id=14868593862164), describe the OpenAI processing and non-storage accurately, and follow Reddit's credential instructions after approval. Do not add unapproved or scraped session credentials.

The approved confidential client is expected to use an application-only OAuth token. Its user agent must follow Reddit's identifying format, for example `web:what-are-people-saying:v1 (by /u/your_username)`. Reddit's documented free-access limit for eligible approved clients is 100 queries per minute averaged over ten minutes, but Reddit decides eligibility and may impose different limits or fees.

One app search makes one token request, up to two distinct listing searches across the 3/12/36-month fallback, and up to 20 distinct comment-list requests in the theoretical worst case. That is at most 23 Reddit HTTP requests and 260 unique posts/comments before deduplication, with no pagination, background collection or app database. Search and comment responses are reused only inside the active request.

Reddit representative evidence links to the original item and shows the supplied public username for attribution. Usernames are not included in the OpenAI prompt or used for demographic inference. The public `/privacy` page explains processing by the app, OpenAI and infrastructure providers.

## Response speed

Sparse searches can take longer than dense ones because they try broader windows. YouTube search/comment responses and Reddit tokens/comment responses are reused in request memory, avoiding redundant reads. No social content is cached across searches. X makes up to three archive requests, at least 1.05 seconds apart after empty responses, and stops at the first nonempty response. Therefore at most one response contains paid posts: up to 20 total, with no extra reply requests or pagination. Its daily budget reserves 20 posts once for the complete search, not once per date window, and gives back whatever was not returned, so empty and failed searches cost no budget. The result is memoized within the request and is not fetched again when other sources expand.

X omits `end_time` for searches ending near the current instant, allowing the API to apply its indexing-safe default. Historical end times are preserved. An accepted empty response explicitly reports no matching posts over three years. X is asked for `sort_order=relevancy` rather than the default newest-first, so the 20 posts are X's most relevant in the window instead of the last few hours of a busy subject; billing is per post returned, so the ordering does not change the cost. Without a search plan the entire subject is quoted as an exact phrase, so long natural-language queries can return no matches even when related discussion exists; the plan exists to avoid that. No third-party X provider is configured.

Parallel platform collection, compact numeric references and request-local response reuse remain in place. The merged preparation step offsets the additional short summary step, so a successful search still uses four AI requests. Classification output no longer includes estimated percentages or unused positive/negative theme objects. Actual latency and total token use can still increase or decrease; request count alone does not prove a saving. The historical 0.10.3 production analysis timing of 11.95 seconds belongs to the previous pipeline.

Analysis failures return a content-free stage code and elapsed time; server logs omit inputs, social content, credentials and raw provider messages. Successful responses expose `Server-Timing` for `lookup` (including extraction/planning), `collection` and `analysis` (classification plus summary). The route requests a 60-second hosting limit. Relevance filtering happens after bounded collection; rejected items do not automatically trigger more paid searches. This can yield insufficient evidence even when more relevant discussion exists elsewhere. No social content is cached across searches.

## Daily example subjects

`GET /api/subjects` loads BBC RSS headlines from technology, entertainment/arts, business and world news. It accepts only valid publisher links and articles dated today in **Australia/Melbourne**, excluding future-dated stories. Up to eight headlines per feed are considered.

OpenAI selects up to six short topics. Each accepted topic must be copied directly from its supporting headline. The response includes the originating headline, URL and publication date. News topics alternate with six evergreen examples; if fewer news topics qualify, the remaining examples stay evergreen. The suggestions endpoint includes BBC attribution.

Suggestions load independently of searches. Only the public news suggestions and attribution are cached, keyed by calendar date and refreshed hourly to admit breaking news. Simultaneous requests on one server instance share the work. The browser refreshes in the background every 15 minutes while visible and when the page becomes visible. No scheduler, extra source account or new dependency is needed. Failed feeds or AI calls return evergreen examples. A first news refresh can take several seconds, but does not delay the search field or searches. Different cold server instances can still make concurrent refresh calls.

## Verification and limitations

- Current checkpoint: 65 tests, TypeScript and the production build pass using the bundled Node.js 24 runtime (the same commands behind the package scripts; npm is not on PATH). Browser checks used bundled Playwright because agent-browser is not installed. All five categories passed at 1440×900, 390×844 and 320×660 with equal-height controls, no page/row overflow, duplicate-quote removal, Back, clickable suggestions, reduced motion and no runtime errors. Provider responses and browser fixtures were simulated. The 0.13.1 loading flow also passed initial/rotating messages, connected-source filtering, stable height, reduced motion, result cleanup and next-search reset at those sizes. The exact failing subject now completes on production; broader semantic quality and billed cost remain unverified.
- `npm test`: search planning and fallback, query sanitising, mocked YouTube collection, parallel requests, complete AI input, one-source and multi-source schemas, citation validation, partial failures, time windows, rounding, dated news parsing, topic grounding and news fallback.
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
src/lib/newsSubjects.ts           dated RSS headlines and grounded topic selection
src/lib/suggestions.ts            evergreen examples and interleaving
src/lib/sentiment.ts              percentage rounding
src/lib/stars.ts                  star rating from the sentiment split
src/lib/types.ts                  shared source, evidence and result shapes
src/lib/sampleData.ts             clearly fictional demonstration results
src/components/SearchCard.tsx     search/loading/result flow and suggestions
src/components/Answer.tsx         short answer, platform logos and qualitative coverage
src/components/Stars.tsx          the star glyphs
src/components/PlatformEvidence.tsx parent post links and verbatim comment pills
src/components/OpinionPills.tsx   recurring opinions around the answer
src/lib/analysis/evidence.ts      validated grouping, classification and source URLs
src/lib/changelog.ts              BETA badge version and release notes
tests/                           Node tests with simulated service responses
```

See [PROJECT.md](PROJECT.md) for scope, [DESIGN.md](DESIGN.md) for the agreed visual direction, and [AGENTS.md](AGENTS.md) for development rules. Accounts, payments and demographic inference remain excluded. The GitHub repository remains private.
