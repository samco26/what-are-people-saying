# Search quality, speed and cost audit — 12 September 2026

Scope: milestones 6–8 and 10. This is an audit of the code and simulated provider responses, with local fixes. It does not claim that a new live result is accurate, faster, cheaper or representative of the public. BETA 0.13.0 was deployed from merge `04c3a31` on 13 September; GitHub/Vercel reported success and the production homepage returned HTTP 200 with the new version. Paid live searches remain unevaluated. The 13 September merge preserves the newer advisory lookup: if web verification fails, search the literal input without inferred identity, category or aliases and keep confidence low.

## Findings and fixes

| Finding | Consequence | Change |
| --- | --- | --- |
| The overall sentiment was an AI estimate; platform bars used classification counts. | Two different scoring methods could disagree. | Both now use the same accepted counts; the final writer receives that calculated balance. |
| The star formula used review-site anchors and pulled small samples toward three. | The displayed rating could diverge from the described opinions. | Use a transparent linear sentiment index. Sample size changes confidence, not the score. All-neutral evidence has no rating. |
| Unclassified entries could appear as evidence; every scraped comment counted toward sufficiency. | Irrelevant/no-opinion content could leak into sources or conceal insufficient evidence. | Every non-video item must have exactly one valid classification. Irrelevant items are excluded; exact text/ID duplicates count once. Recheck the minimum after filtering. |
| X OR clauses included standalone words such as “August” or “heat”. | A result could match without mentioning Tuscany at all. | Only subject phrases are alternatives. Keyword fields cannot broaden the query. |
| A relevant video could supply creator praise, unrelated jokes and bare questions. | Pleasant tone could be mistaken for a positive subject opinion. | Explicit classification rules exclude those unless an actual subject-specific assessment is present. This semantic rule still needs live evaluation. |
| Opinion drilldowns selected entire parent groups. | The first visible comments might not support the selected opinion. | Preserve exact supporting comment IDs and filter the drilldown to them. Rank selected representative comments first in platform views. |
| X post text appeared as both a title and a coloured quote. | Every quote appeared duplicated. | Suppress matching headings and duplicate attribution; retain the coloured original text. |
| Identity extraction and query planning were separate serial requests. | An extra round trip before collection. | Combine extraction and planning using the same cited report. |

## Implemented flow

`input → current web evidence → verified identity + category + platform queries → parallel bounded collection → classify every item + propose supported themes → validate/deduplicate/count → write from checked findings → shared result layout`

Web facts establish identity and dates, never votes. The successful path still makes four Responses API requests:

| Request | Earlier pipeline | Revised pipeline |
| --- | --- | --- |
| 1 | Web research | Web research |
| 2 | Cited identity extraction | Cited identity extraction and platform planning |
| 3 | Platform planning | Full collection classification and recurring themes |
| 4 | Combined analysis/summary/estimated score | Short summary from validated themes and calculated scores |

Platform collection runs between requests 2 and 3 in the revised pipeline. The short writer receives no raw comments, just checked themes, their support counts, sentiment counts, platform/group totals, dates and factual context. Every collected item still reaches the classifier. Missing/conflicting labels fail explicitly, with no automatic paid retry. Fewer than eight accepted opinions skips writing and returns insufficient evidence. A higher configured minimum is also enforced before returning a result.

The score is `1 + 4 × (positive + 0.5 × neutral) / accepted`. The qualitative direction uses the same balance: positive at 60% or more, negative at 40% or less, mixed otherwise. Neutral means an explicit mixed/indifferent assessment, not unrelated chatter. These are transparent interface conventions, not a scientific population estimator or submitted star reviews.

## Efficiency judgement

This is a reasonable starting tradeoff, not a demonstrated optimum. Combining preparation requests offsets the extra verification boundary before writing. Parallel source collection, request-local reuse, compact numeric labels, bounded output and existing source caps remain. There is no new dependency, source expansion, permanent social-content store or increase in X's 20-post cap.

Keeping related work together and independent work parallel follows [OpenAI's latency guidance](https://developers.openai.com/api/docs/guides/latency-optimization). The same number of requests does not guarantee the same time or price. The combined extraction has a 2,600-token ceiling; classification retains 16,000 and the short writer has 700. Actual token usage and provider time must be measured. Output ceilings are limits, not expected consumption.

Do not lower the model quality, reduce the selected sample or skip factual verification solely to claim speed. First measure where time and errors occur. The app already exposes lookup (including planning), collection and analysis (classification plus summary) in `Server-Timing`. Compare median and slow-tail latency, not a single fast search. There are no new measured latency or billed-cost results from this audit.

## Remaining sampling limits

- YouTube can contribute up to 300 comments, X up to 20 posts; Reddit is not yet live. A pooled score can therefore mostly describe YouTube discussion. Equal platform weighting would introduce a different arbitrary bias, not make it representative.
- Highest-viewed videos, most-liked comments and relevance-ranked posts favour visible/engaged audiences. People who do not post are absent. Multiple comments under one video are not independent samples of the public.
- Exact-text deduplication is conservative and can merge independent people using the same words. It cannot reliably detect paraphrased spam, bots or coordinated posting.
- Category, relevance, sentiment and thematic entailment are still AI judgements. Valid IDs and matching sentiment do not prove that a quote supports every word of a theme. Separating synthesis reduces contamination; it does not eliminate model error.
- Date expansion is triggered by raw collection counts before classification. A full but irrelevant collection can end with insufficient evidence. This version deliberately avoids an automatic extra paid retrieval loop.
- Confidence is limited by accepted volume, platform coverage and number of post groups. It is not a statistical confidence interval. The result should be described as selected online discussion, never representative general-public opinion.

## Verification and next acceptance check

Local evidence: 63 simulated-provider tests pass, TypeScript passes and the production build passes. Browser checks cover all five categories at 1440×900, 390×844 and 320×660, equal-height rating/icon controls, no page/row overflow, quote deduplication, Back, clickable suggestions and reduced motion, with no runtime errors. Provider tests verify combined research/planning, full-item input, strict classification, filtering, calculated counts and summary input. These do not measure real model accuracy.

Before judging the revised pipeline ready for broader use, run a bounded live comparison over roughly 12 subjects: examples from all five categories, ambiguous names, sparse topics and recently announced/versioned products. Include the user's failing queries when available. For each search:

1. Inspect a spread of accepted and rejected items across platforms/post groups in memory. Human-check subject relevance, actual opinion and polarity; inspect every displayed theme and its linked evidence.
2. Check the summary's direction and claims against the accepted distribution, including mixed and no-evidence outcomes. Confirm corrected names and dates.
3. Record content-free aggregate measurements: accepted/collected counts by platform, post groups, error rate, stage durations, AI input/output tokens, web tool usage and actual provider charges. Do not retain social text, usernames or authentication data.
4. Compare median/slow-tail time and total cost with a baseline using the same bounded subjects. If classification is still weak, prioritise its prompt/model evaluation. If collection is the problem, test a more diverse bounded sampling method before adding more volume. Make those changes only against measured quality and cost.

The current per-process X budget remains unsuitable as a whole-app spending cap. Its provider-side limit and the project’s outstanding public-search protections remain separate acceptance work; this change does not resolve them.

The merge retains the newer compact default meter, phone spacing, narrower review-category rules and removal of About this answer. This audit’s equal-evidence scoring supersedes the intervening reaction-weighting experiment; likes do not become votes.
