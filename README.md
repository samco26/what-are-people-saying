# The General Consensus

A personal, non-commercial web app that turns a controlled sample of online discussion about a subject into one clear consensus statement, with supporting themes and source counts.

## Status

Milestones 3 and 5 of [PROJECT.md](PROJECT.md) are written: the Next.js, TypeScript and Tailwind scaffold, and the complete search, processing and result flow on clearly labelled sample data. The General Consensus is the working title; the GitHub repository is `what-are-people-saying`.

**This code has not yet been compiled or run with Next.js.** It was written on a machine without Node.js, so the first `npm install` and `npm run build` are the first real check. What has been done is the stand-in check in [tools/no-node-check](tools/no-node-check/README.md): every source file parses as TypeScript and JSX, and the app mounts and runs through every state in a browser with React and Tailwind loaded from a CDN. That is not a type check and not a build. Nothing below should be read as verified until a build has passed.

Not built yet: server-side AI analysis, and the YouTube, X and Reddit connectors. Every result the app shows today is a fictional sample and is labelled as such on screen.

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
- **Search flow.** Submitting unfolds the same card downward while the field stays in place. A brief processing state gives way to one to three qualitative sentences. The page scrolls as the card grows.
- **Sentiment extracted from.** Under the answer, a button for each platform with its logo. Opening one grows the card outward to both sides and shows that platform's evidence in a column beside the answer, with the search box staying put; below 1024px it stacks beneath. The page shows the platform's verdict and agreement, items analysed, confidence with reason, up to three positives and negatives with an explicit note when fewer are supported, and the threads, videos or posts it drew on. In this version the titles are fictional and unlinked, and say so. A platform that a live result reports unavailable would be disabled; every sample has all three.
- **Get Specific.** A glass pill under the card that grows into its own panel, and can be set before a search. Platform chips with logos, a time period with a custom from-and-to date range, and demographics as three rows of chips that combine: age, gender and region. Click to select, click again to clear. The refinements preview a selection and say so; they do not reanalyse anything.
- **No live search state.** A subject that is not one of the six samples gets a truthful message and the example subjects to try, never an invented answer.
- **Server route.** `POST /api/consensus` answers from the sample data. It exists so the browser already talks to the server the way it will when analysis and the connectors arrive, and so no key ever reaches the browser.
- **Shared item format.** `src/lib/types.ts` fixes the item, source-status, per-platform analysis and result shapes every connector will convert to.

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

See [DESIGN.md](DESIGN.md). The implemented look takes its dark palette, glass pane construction, segmented controls and easing from the Kia DAA dashboard's dark and glass modes, as agreed on 11 September 2026.

## Development rules

See [AGENTS.md](AGENTS.md). In short: stay within the current milestone, never expose keys in browser code, never commit `.env` files, never fabricate evidence, label simulated data, and do not store social-media content.
