# Version-one specification

## Purpose

A user enters the name of a subject. The application retrieves a controlled sample from YouTube, X and Reddit, analyses relevant discussion, and returns a short qualitative consensus with supporting themes and source counts available on expansion. The name is What People Think. It was The General Consensus until 11 September 2026.

This is a simple consumer-facing, personal, non-commercial project. Visitors encounter the search function immediately.

## Required result

- A default answer of one to three qualitative sentences about the sampled discussion.
- Positive, mixed or negative classification.
- Three positives and three negatives when supported by evidence. If fewer are supported, explicitly state that rather than inventing themes to fill the slots.
- Confidence level, with a brief explanation based on the available evidence.
- Number of items analysed per source.
- Links to representative source material.
- Clear warnings for unavailable sources.

Consensus describes the collected sample, not every person's opinion. Distinguish a positive result from strong agreement. When evidence is insufficient, show that clearly instead of forcing a verdict.

The default view prioritises the short answer. Keep supporting classification, confidence, themes and detailed source counts expandable. Surface unavailable-source notices unobtrusively with the answer.

## Search interaction

- Initially show a prominent search bar with the heading “See what people think about” and example subjects sweeping upward.
- Mix daily news subjects with niche evergreen examples in that rotation. News suggestions load independently, are grounded in dated publisher headlines, and fall back to evergreen examples when unavailable.
- Submitting the search expands the same glass container smoothly downward. The search field stays in place at the top of that container.
- Show the one-to-three-sentence answer inside the expanded container.
- Search accepts only a subject. No platform, time-period, audience or demographic refinement controls are offered.
- Collect from all connected sources using 3 months initially, then 12 months and 3 years when fewer than 50 opinions are collected. Retain and deduplicate earlier findings, report the actual window, and respect source-specific coverage limits.
- Mobile and desktop are equally important.

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

See DESIGN.md for the agreed midnight-blue palette, Helvetica typography, rounded liquid-glass surfaces and interaction details. The first interactive mockup is ready for refinement before application implementation.

Accounts, payments and demographic inference remain excluded. Further source expansion requires evaluating access; the current source list is YouTube, X and Reddit.
