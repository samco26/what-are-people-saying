# What People Think — phase tracker

Last audited: 12 September 2026 (Australia/Melbourne).

## Where we are

**The website is built and deployed. Milestones 1–5 are complete; milestones 6–7 now have a successful live search, with quality and cost checks still open.** The analysis backend has been converted completely from Anthropic/Claude to OpenAI's Responses API and passes local type, build and sample-mode checks. A controlled production query now returns a live OpenAI answer from 160 YouTube opinions. This verifies the working path, while detailed evidence-quality and cost checks remain open; X and Reddit still require access/integration work.

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
| 8 | Integrate X with collection and spending controls | Empty live search accepted; evidence/billing verification pending | The deployed timestamp fix removed HTTP 400 in a controlled search on 12 September. That query returned zero X posts. Recent-post search and per-request limits exist. The daily counter is only per server process, not a reliable whole-app spending cap. Verify nonempty results, actual charges, enforceable limits and reply coverage before completion. |
| 9 | Integrate Reddit when access is available | Written; access/live verification pending | OAuth, post search and comment collection exist. Confirm permitted access and demonstrate a successful authenticated search with real evidence. |
| 10 | Refine UI and test privately before public availability | In progress | Substantial visual refinement and sample-mode checks are done. Still needs live-result quality checks, failure/partial-source tests, abuse/cost protections and a controlled user trial. |

## Immediate next checkpoint

Review the live answer against its collected evidence, measure actual API cost, and verify the remaining source failure cases. Do not enable unrestricted public live searches until a search limit and spending protection are in place.

## Technology actually in the project

| Part | What is used | Where verified |
|---|---|---|
| Website and server routes | Next.js 15.5.25 | package.json; src/app |
| Interactive interface | React 18.3.1 | package.json; src/components |
| Application language | TypeScript | tsconfig.json; .ts/.tsx source files |
| Styling | Tailwind CSS 3.4.13 plus custom CSS | package.json; tailwind.config.ts; src/app/globals.css |
| Hosting | Vercel | Successful GitHub deployment status and user confirmation |
| AI provider in the code | OpenAI Responses API; GPT-5.6 Luna default | package.json; src/lib/analysis/analyse.ts; live API not yet verified |

## Latest verification

The X fix in `b466fbe` passed twenty tests and the production build; Vercel reported success. A controlled production Mercury Marine search took 6.239 seconds, returned 160 YouTube opinions over 3 months, and received an accepted empty response from X without HTTP 400. The follow-up clarification says explicitly that an empty X response means no matching posts, and has a regression test. Paid collection limits remain unchanged; no alternative provider has been enabled. No social content was saved during verification.

BETA 0.9.4 adds 3/12/36-month collection with a 50-opinion expansion threshold, keeps earlier evidence, and reuses per-request source responses. Sixteen mocked tests pass, covering escalation, stopping, deduplication, retained evidence after failure, calendar boundaries and recent comments on older videos. X collection volume is unchanged; its recent endpoint is not repeated during date expansion. The production build also passes. Vercel confirmed deployment of `1a2539b`. The production Mercury Marine query returned a result with 160 YouTube opinions from 3 months in 5.9 seconds (collection 1.101 seconds; analysis 4.275 seconds). X returned HTTP 400 and Reddit was unconnected. This is one measured query, not a latency guarantee; 12/36-month fallback paths are verified with mocks.

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
