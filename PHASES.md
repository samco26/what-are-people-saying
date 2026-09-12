# What People Think — phase tracker

Last audited: 12 September 2026 (Australia/Melbourne).

## Where we are

**The website is built and deployed. Milestones 1–5 are complete; milestones 6–8 have successful live searches, with quality and cost checks still open.** The analysis backend uses OpenAI's Responses API and passes local type, build and sample-mode checks. Reddit's connector now passes simulated OAuth, search, comment, attribution and failure tests, but Reddit requires explicit Data API approval before live credentials can be used.

Use the ten milestones in [PROJECT.md](PROJECT.md) as the stable numbering. Completion is based on evidence, not the app's BETA version number.

## All phases

| Phase | Milestone | Status | Evidence / remaining acceptance check |
|---|---|---|---|
| 1 | Specification, development rules and private GitHub repository | Complete | PROJECT.md, AGENTS.md and secret exclusions exist. GitHub confirmed `samco26/what-are-people-saying` is private during the initial audit. |
| 2 | Produce and refine the visual mockup | Complete | Design record, original mockup checkpoint `2f3be72`, subsequent user-directed design passes and the implemented interface. Further polish belongs to phase 10. |
| 3 | Build the Next.js, TypeScript and Tailwind foundation | Complete | App pages, components, server route, TypeScript and Tailwind configuration exist. Production builds pass. |
| 4 | Connect GitHub to Vercel and deploy | Complete | Vercel's GitHub deployment record reported success for `ba269f2` on 11 September 2026. User also confirmed the site is live. |
| 5 | Complete search/loading/result flow with labelled sample data | Complete — sample mode | Six fictional samples, processing/result/error states and unknown-subject fallback are implemented. Desktop/mobile and route checks are recorded in README.md. Sample and unknown-subject API requests passed again after the OpenAI conversion. |
| 6 | Integrate server-side AI analysis | Live response verified; quality/cost checks pending | `src/lib/analysis/analyse.ts` uses the OpenAI Responses API, GPT-5.6 Luna by default, Zod Structured Outputs and `store: false`. TypeScript and the production build pass. Complete this phase only after a controlled request with synthetic evidence verifies account/model access, output quality, errors and measured cost. |
| 7 | Integrate YouTube | Live collection verified; quality/edge cases pending | Separate video/comment connector exists. Complete when an authorized request retrieves real relevant comments, preserves their links and yields a grounded answer; test disabled comments, quota errors and insufficient evidence. |
| 8 | Integrate X with collection and spending controls | Live collection verified; cost controls still need audit | After fixing X's ten-second `end_time` rule, a controlled production search returned 50 real X posts with source-specific analysis and links. The daily counter is only per server process, not a reliable whole-app spending cap. Reconcile actual charges and add an enforceable whole-app limit before completion. |
| 9 | Integrate Reddit when access is available | Implementation verified locally; approval/live verification pending | OAuth, post search, comment collection, attribution and partial-failure handling pass simulated tests. Current Reddit policy requires explicit approval even for non-commercial use. Submit the application, add the three server-only settings only after approval, then demonstrate a successful authenticated search with real evidence. |
| 10 | Refine UI and test privately before public availability | In progress | Substantial visual refinement and sample-mode checks are done. Still needs live-result quality checks, failure/partial-source tests, abuse/cost protections and a controlled user trial. |

## Immediate next checkpoint

Submit the transparent non-commercial Reddit Data API application. After approval, add the three Reddit settings to Vercel Production, redeploy and run one controlled live search. Do not enable unrestricted public live searches until a search limit and spending protection are in place.

## Technology actually in the project

| Part | What is used | Where verified |
|---|---|---|
| Website and server routes | Next.js 15.5.25 | package.json; src/app |
| Interactive interface | React 18.3.1 | package.json; src/components |
| Application language | TypeScript | tsconfig.json; .ts/.tsx source files |
| Styling | Tailwind CSS 3.4.13 plus custom CSS | package.json; tailwind.config.ts; src/app/globals.css |
| Hosting | Vercel | Successful GitHub deployment status and user confirmation |
| AI provider in the code | OpenAI Responses API; GPT-5.6 Luna default | package.json; src/lib/analysis/analyse.ts; live production responses verified |

## Latest verification

BETA 0.9.5 makes Reddit activation require the client ID, client secret and identifying user agent together. Simulated tests verify the OAuth token exchange, bounded search and comment requests, exact date filtering, evidence links, required public username attribution and explicit partial failures. The analysis prompt still excludes author names. A privacy page accurately describes transient processing and external providers. Thirty tests, TypeScript and the production build pass. Vercel reported the `6f354ed` deployment successful; the production homepage showed BETA 0.9.5 and `/privacy` returned HTTP 200. Live Reddit access remains unverified pending explicit approval.

X now uses official full-archive search with its own 3/12/36-month empty-result fallback, even when other sources have sufficient evidence. It stops at the first nonempty response and keeps the 20-post total cap. Twenty-seven tests and the production build pass, including the 12-month and 3-year paths, empty results, access/billing failures, timeout cancellation, per-request reuse, and the wider answer window. Vercel deployed `122d279` successfully. The live exact query “mercury marine boat engines australia” completed all three X windows with no matches and returned 159 YouTube opinions (9.1 seconds total; 2.840 seconds collection). “Mercury Marine” returned 15 X posts over three months and 243 YouTube opinions (12.5 seconds total; 1.020 seconds collection), confirming archive access and stopping on matches. No social content was persisted. Earlier successful X searches below used the recent endpoint.

The preceding checkpoint capped X at 20 posts per search, at most US$0.10 in post-read charges at the published US$0.005 rate, excluding AI. The code clamps old higher environment settings to 20. Twenty-two tests and the production build passed; a controlled production search returned exactly 20 X posts. Earlier live 50-post checks below describe the previous limit.

BETA 0.9.4 adds 3/12/36-month collection with a 50-opinion expansion threshold, keeps earlier evidence, and reuses per-request source responses. Twenty-one mocked tests pass, including X's present-time request rule, accepted empty responses and safe provider-error handling. TypeScript and the production build pass. Vercel deployed the X fix in `b466fbe`; the Mercury Marine request then succeeded without HTTP 400 but found no exact-phrase X matches in seven days. A subsequent production “ChatGPT” search returned 234 YouTube comments and 50 X posts with live links and separate source analysis. This verifies nonempty paid X collection; charges still need to be reconciled in the provider dashboards. Reddit was unconnected, and no social content was saved during verification.

The BETA 0.9.3 search and daily-example work has been combined with the OpenAI migration. Both consensus and news-topic selection now use the Responses API with `store: false`. Ten mocked tests, TypeScript and the production build pass. GitHub/Vercel confirmed production deployment `6403248138` for commit `a39030b` succeeded on 12 September 2026. The live homepage returned HTTP 200 with BETA 0.9.3 and the new niche example; `/api/subjects` returned HTTP 200 with six news topics and six evergreen examples. This verifies deployment and live news suggestions, not the paid consensus/YouTube analysis or its speed; those milestone acceptance checks remain open.

- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 15.5.25.
- Production server sample request: passed without an AI key.
- Production server unknown-subject request: passed and returned the truthful no-live-search state.
- Dependency audit: zero known vulnerabilities.
- No Anthropic or Claude references remain in active project files or the dependency lock.
- No credentials were read or created locally. The controlled live query used the production server’s configured keys.

## Keeping this live

At each relevant checkpoint, update this file with verified evidence and refresh the in-conversation tracker. The tracker is updated on request or during project work; it is not an automatic background monitor. Never mark a live integration complete merely because its code exists.
