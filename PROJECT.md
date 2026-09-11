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
- Submitting the search expands the same glass container smoothly downward. The search field stays in place at the top of that container.
- Show the one-to-three-sentence answer inside the expanded container.
- Put a Get Specific button at the bottom of the answer. It expands platform, time-period and audience-context refinements within the same card.
- The latest design request adds simple refinements to the design scope. Complex filter builders remain excluded.
- Demographic controls may be represented as a future, unavailable capability in the mockup. Demographic inference remains excluded; implementing demographic filtering would require a separate decision and reliable data.
- Mobile and desktop are equally important.

## Sources and data

- Version one includes YouTube, X and Reddit as separate connectors.
- Each connector returns a shared item format and an explicit availability status.
- Support partial success: an unavailable source must not prevent analysis of sufficient evidence from other sources.
- Source access and credentials are separate integration milestones; a source displayed in a mockup is not a claim of working access.
- Use bounded collection limits. Exact limits will be set during integration.
- Do not permanently store social-media content.
- Clearly label all fictional examples and simulated results used in design and development.
- Supporting links in live results must come from collected source material.

## Excluded from version one

- Demographic inference.
- User accounts.
- Payments.
- Instagram, TikTok, Facebook and LinkedIn.
- Complicated date or source controls beyond the simple Get Specific panel.
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
