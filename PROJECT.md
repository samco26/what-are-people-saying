# Version-one specification

## Purpose

A user enters the name of a subject. The application retrieves a controlled sample from YouTube, X and Reddit, analyses relevant discussion, and returns a short qualitative consensus with supporting recurring opinions and linked source evidence available on expansion. The name is What People Think. It was The General Consensus until 11 September 2026.

This is a simple consumer-facing, personal, non-commercial project. Visitors encounter the search function immediately.

## Required result

- A default answer of one to three qualitative sentences about the sampled discussion.
- Positive, mixed or negative classification.
- Up to twenty distinct recurring opinions, each consolidated into one sentence and classified positive, neutral or negative. Aim for five to twenty only when supported by repeated evidence; never pad the result or force an equal balance.
- Confidence level, with a brief explanation based on the available evidence.
- Classify every collected opinion before summarising. Reject irrelevant, unclassified and duplicate evidence; derive meters, stars and the verdict from accepted counts. Recheck sufficiency after filtering. The final writer receives accepted findings, not unreviewed scraped material.
- Keep collection counts internal. The four review categories show a compact star sentiment score derived from the same checked evidence as the meter; it is not a submitted review average.
- Links to representative source material.
- All categories use the default answer layout. Films/media, products, places and apps replace the overall meter with a star pill in the source-icon row, of equal height. Every result shows “Showing results for …”. An unresolved live identity preserves the literal input, uses the general category and lowers confidence. Any did-you-mean suggestion pulses subtly and accepts a click or Tab, with reduced-motion support.
- Clear warnings for unavailable sources.

Consensus describes the collected sample, not every person's opinion. Distinguish a positive result from strong agreement. When evidence is insufficient, show that clearly instead of forcing a verdict.

The default view prioritises the short answer. Keep the overall sentiment meter, confidence and supporting evidence expandable. Surface unavailable-source notices unobtrusively with the answer.

## Search interaction

- Initially show a prominent search bar with the heading “See what people think about” and example subjects sweeping upward.
- Mix daily news subjects with niche evergreen examples in that rotation. News suggestions load independently, are grounded in dated publisher headlines, and fall back to evergreen examples when unavailable.
- Submitting the search expands the same glass container smoothly downward. The search field stays in place at the top of that container.
- Show the one-to-three-sentence answer inside the expanded container.
- For short multiword subjects, start bounded platform collection with the cleaned original term alongside a short cited web lookup. Resolve identity and category from that report in the opinion-analysis request. Single-word, longer and question/comparison/conditional inputs retain researched platform queries before collection. This is a conservative routing heuristic, not an ambiguity detector. Do not automatically re-fetch platforms if the original wording misses relevant discussion. Preserve the literal input and general category when identity cannot be verified. Pass dated facts separately from opinions, distinguish speculation from confirmed announcements and availability, and never count web facts as opinions.
- Search accepts only a subject. No platform, time-period, audience or demographic refinement controls are offered.
- Collect from all connected sources using 3 months initially, then 12 months and 3 years when fewer than 50 opinions are collected. Retain and deduplicate earlier findings, report the actual window, and respect source-specific coverage limits.
- Mobile and desktop are equally important. The page stays within one screen; details may scroll internally.
- On desktop show the strongest recurring opinions in glass pills around the main card; on mobile initially show three beneath it. Pills float into place and settle, without dots. Show more reveals the remaining supported opinions.
- Source controls use platform logos only. Opening one replaces the main answer with an expanded view; Back restores it and the subject remains editable in a compact control.
- A platform view starts with its logo and a full-width sentiment bar, without repeated titles or analysed totals. Show up to five original post/video sections initially, with Show more for the rest.
- Each post section uses the actual title, followed by a few verbatim collected comment excerpts in sentiment-coloured pills. Suppress a title when it duplicates the quote; an opinion drilldown shows only its supporting comments. The entire section links to the original post. X entries use their own text when no replies were collected; never invent comments.
- An opinion pill can reveal its supporting posts. Loading uses an indeterminate liquid bar, starting with “Finding what people think…” and rotating connected-platform and discussion placeholders in a left-to-right sweep, with reduced-motion support.

## Sources and data

- Version one includes YouTube, X and Reddit as separate connectors.
- Each connector returns a shared item format and an explicit availability status.
- Support partial success: an unavailable source must not prevent analysis of sufficient evidence from other sources.
- Source access and credentials are separate integration milestones; a source displayed in a mockup is not a claim of working access.
- Use bounded collection limits. Exact limits will be set during integration.
- X independently searches the official archive for 3 months, then 12 months and 3 years only when its previous response is empty. It stops at the first matching window and reads at most 20 posts total, with no pagination or additional reply reads. At US$0.005 per returned post this limits X post-read charges to US$0.10 per query, excluding AI.
- YouTube reads up to 30 top-ranked comments from each of the 10 most-viewed matching videos, allowing older videos with in-window comments. Video metadata is context, not an opinion count. All collected opinions must reach analysis.
- Do not permanently store social-media content.
- Clearly label all fictional examples and simulated results used in design and development.
- Supporting links in live results must come from collected source material.

## Excluded from version one

- Demographic inference.
- User accounts.
- Payments.
- Instagram, TikTok, Facebook and LinkedIn.
- User-configurable date, source, audience and demographic filters.
- Permanent storage of social-media content.

## Technology

- Next.js for the website and server routes.
- TypeScript for application code.
- Tailwind CSS for styling.
- Server-side AI integration.
- GitHub for source control, initially a private repository named `what-are-people-saying`.
- Vercel for hosting and automatic deployments from GitHub.

## Milestones

1. Save this specification, development instructions and secret exclusions; create the GitHub repository.
2. Produce and refine a visual mockup with the user before implementing the application.
3. Scaffold Next.js, TypeScript and Tailwind; add the project name, search field, button and placeholder result.
4. Connect the GitHub repository to Vercel and deploy the skeleton early. This is an infrastructure milestone, not a public launch.
5. Build and validate the complete search/loading/result flow with clearly labelled sample data.
6. Integrate server-side AI analysis.
7. Integrate YouTube.
8. Integrate X with bounded collection and spending controls.
9. Integrate Reddit when access is available.
10. Refine the UI and test privately before public availability.

Save each working checkpoint as a Git commit. Deployment and integrations must be verified before being described as complete.

## Visual direction

Use the user-supplied Tiffany-blue gradient image as the page background, with the existing peach/salmon controls, Helvetica typography, rounded liquid-glass surfaces and fluid interaction details. See DESIGN.md. The user refined the interactive mockup and authorized implementation on 12 September 2026.

Accounts, payments and demographic inference remain excluded. Further source expansion requires evaluating access; the current source list is YouTube, X and Reddit.
