# The General Consensus

A personal, non-commercial web app that turns a controlled sample of online discussion about a subject into one clear consensus statement, with supporting themes and source counts.

## Status

Milestones 3 and 5 of [PROJECT.md](PROJECT.md) are written: the Next.js, TypeScript and Tailwind scaffold, and the complete search, processing and result flow on clearly labelled sample data. The General Consensus is the working title; the GitHub repository is `what-are-people-saying`.

**This code has not yet been compiled or run with Next.js.** It was written on a machine without Node.js, so the first `npm install` and `npm run build` are the first real check. What has been done is the stand-in check in [tools/no-node-check](tools/no-node-check/README.md): every source file parses as TypeScript and JSX, and the app mounts and runs through every state in a browser with React and Tailwind loaded from a CDN. That is not a type check and not a build. Nothing below should be read as verified until a build has passed.

The server-side analysis and the YouTube, X and Reddit connectors are written and switch on by keys; see Going live below. Without keys, every result the app shows is a fictional sample and is labelled as such on screen.

## Setup

Node.js 18.17 or newer is required.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Other commands:

```bash
npm run build      # production build, which is also the strictest type check
npm run typecheck  # TypeScript only, no build
npm run start      # serve the production build
```

## What is implemented

- **Opening view.** The heading "See what people think about" above a single glass search box, with the six example subjects sweeping upward inside the empty box. Pressing Enter on an empty box searches the example showing. The rotation stops for reduced-motion preferences, while typing and while a result is on screen. The title returns to the initial view. A BETA badge top right opens the list of what changed in each version; the number comes from `src/lib/changelog.ts`.
- **Search flow.** Submitting unfolds the card slowly beneath the field, which stays in place. A brief processing state gives way to one to three qualitative sentences, with a sentiment bar bottom left: green, dark grey and red in proportion, no figures. The page never scrolls; if the window is too short, the card's body scrolls inside the card once it has opened.
- **Sentiment extracted from.** Under the answer, on the right, a round logo button for each platform. Opening one grows the card outward to both sides and shows that platform's evidence in a column beside the answer, with the search box staying put; below 1024px it stacks beneath. The page shows the platform's verdict and agreement, items analysed, confidence with reason, up to three positives and negatives with an explicit note when fewer are supported, and the threads, videos or posts it drew on. In this version the titles are fictional and unlinked, and say so. A platform that a live result reports unavailable would be disabled; every sample has all three.
- **Get Specific.** A small glass pill at the search card's left edge that opens into a panel the card's width: the panel is laid out at full size and only its visible edge animates out from the pill, which stays put as the panel's header, so it never stutters and never moves away from where it was clicked. The rows inside arrive one after another. Platforms and Time period sit side by side above the demographics: platform chips with logos and a time period with a custom from-and-to date range on the left, demographics on the right as rows of chips that combine, age, gender and region. Click to select, click again to clear. It can be set before a search. The refinements preview a selection and say so; they do not reanalyse anything.
- **How does this work.** The mirror of Get Specific at the search card's right edge: a pill that opens the same way into a short plain-English explanation of what the site does, what an answer means and what version one is.
- **Look.** The background is the user's own gradient image in `public/bg.avif`. Every card and control is frosted glass over it, with dark type. See DESIGN.md for the passes that led here.
- **No live search state.** A subject that is not one of the six samples gets a truthful message and the example subjects to try, never an invented answer.
- **Server route.** `POST /api/consensus` answers from the sample data. It exists so the browser already talks to the server the way it will when analysis and the connectors arrive, and so no key ever reaches the browser.
- **Shared item format.** `src/lib/types.ts` fixes the item, source-status, per-platform analysis and result shapes every connector will convert to.

## Going live

The live search is built and switches on by keys. With no keys, the app answers only the six example subjects, from labelled samples. With `ANTHROPIC_API_KEY` plus at least one source key, every search collects a bounded sample from the connected platforms, sends it to Claude once, and answers from that. A platform without its key is reported as unavailable in the answer rather than failing the search. Nothing collected is stored.

**Not yet verified against any live service.** The connectors were written from each platform's published API shapes on a machine with no Node and no keys. The first search with a real key is the first real test, and small fixes should be expected then.

Where each key comes from, and what it costs:

| Key | Where | Cost |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | Per search, roughly 20,000 input tokens and 1,500 output: about 12 cents on `claude-opus-5` (the default), 5 cents on `claude-sonnet-5`, 3 cents on `claude-haiku-4-5`. Set `CONSENSUS_MODEL` to change. |
| `YOUTUBE_API_KEY` | Google Cloud console, enable YouTube Data API v3, create an API key | Free. About 108 quota units a search against a free daily quota of 10,000, so roughly 90 searches a day. |
| `X_BEARER_TOKEN` | developer.x.com, create a project and app, copy the Bearer token | Paid. X bills by posts read; `X_MAX_RESULTS` (default 50) and `X_DAILY_POST_BUDGET` cap it. Recent search covers seven days. |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` | reddit.com/prefs/apps, create a "script" app | Free within 100 calls a minute; a search uses about 12. |

See `.env.example` for every setting with its default. Locally the keys go in `.env.local`; on Vercel they go in the project's Environment Variables. The route asks for a 60 second limit (`maxDuration`), which Vercel honours on its paid plans and caps lower on the free one.

How a live search works, in `src/lib`:

```
env.ts                    which keys exist (never what they are)
connectors/shared.ts      the connector contract and shared helpers
connectors/index.ts       runs the requested connectors in parallel, each under a 9s timeout
connectors/youtube.ts     video search plus top comments
connectors/x.ts           recent search, with the spend controls
connectors/reddit.ts      post search plus top comments, via OAuth
analysis/analyse.ts       one Claude call with a fixed output shape; links come only from collected items
```

## Sample subjects

The weather in Tuscany, the newest ChatGPT model, cinema, the Keychron K2, living in Melbourne and vinyl records. Anything else shows the no-live-search state. All six results are fiction written for design and development, in `src/lib/sampleData.ts`.

## Layout

```
src/app/layout.tsx              page shell, metadata, the drifting ground
src/app/page.tsx                mounts the app
src/app/globals.css             tokens, the glass pane, the unfold, controls, reduced motion
src/app/api/consensus/route.ts  POST: sample answer or the no-live-search response
src/lib/types.ts                shared shapes: items, source status, per-platform analysis, result, refinements
src/lib/sampleData.ts           the six fictional results, with each platform's own reading
src/lib/subjects.ts             subject normalisation and sample lookup
src/lib/labels.ts               the words for positive, mixed, negative, agreement and confidence
src/lib/changelog.ts            the BETA number and what changed
src/components/App.tsx          title, BETA badge, container, small print
src/components/Changelog.tsx    the dialog behind the badge
src/components/SearchCard.tsx   heading, field with rotating examples, processing state, the unfolding container, Get Specific
src/components/RotatingSubjects.tsx
src/components/Answer.tsx       the answer, overall line, source notices, the platform buttons
src/components/PlatformEvidence.tsx  one platform's verdict, confidence, themes and threads
src/components/GetSpecific.tsx  refinements with the custom date range
src/components/Pill.tsx         segmented control with a sliding highlight
src/components/Logo.tsx         a platform's mark from public/logos
public/logos/                   the X, YouTube and Reddit marks
```

## Known limitations

- Not compiled or run yet. See Status.
- No live sources and no AI. The sample data stands in for both.
- The container's height animates when it first opens and when a panel opens inside it, but the step from the processing state to the answer is a cut rather than a glide.
- The glass effect needs `backdrop-filter`. Browsers without it get a solid pane.

## Design

See [DESIGN.md](DESIGN.md). The glass pane construction, segmented controls and easing come from the Kia DAA dashboard's glass mode. The palette is read from the user's X-ray poster reference: paper and cool grey for the page, charcoal glass, ice blue and khaki for the quiet marks, and one orange accent. The table of values is in DESIGN.md.

## Development rules

See [AGENTS.md](AGENTS.md). In short: stay within the current milestone, never expose keys in browser code, never commit `.env` files, never fabricate evidence, label simulated data, and do not store social-media content.
