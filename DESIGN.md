# The General Consensus — design direction

Working title and first visual direction, supplied by the user on 11 September 2026. The mockup is a proposal for refinement, not an approved final design or a live application.

## Appearance

- Minimalist and techy, with open space around the primary search.
- Midnight blue through blue-grey, with light grey text instead of pure white.
- Helvetica, with Helvetica Neue and Arial fallbacks.
- Rounded cards and buttons with liquid-glass transparency, thin highlights, soft reflections and restrained background light.
- Use the supplied UI references for material, typography and spacing. Do not reproduce their dashboards or add unrelated features.
- Current proposed tokens: background `#070e20`, primary text `#dfe5ef`, secondary text `#a4b2c8`, main glass radius `30px`.

## Opening view

The search bar is the main action. Above it, show “See what people think about” followed by gently rotating subjects that sweep upward. Include both general and specific subjects: the weather in Tuscany, the newest ChatGPT model, cinema, the Keychron K2, living in Melbourne and vinyl records.

The motion pauses for reduced-motion preferences and while the user is typing or viewing a result. Keep a manual pause control available. The product title returns to the initial search view.

## Answer and refinements

On submission, the search container unfolds downward while the input retains its position. A brief processing state gives way to one to three qualitative sentences. Do not turn the first answer into a dashboard of scores and charts.

Get Specific appears beneath the answer. It opens refinements inside the same container:

- Platforms: YouTube, X and Reddit, with unavailable sources clearly marked.
- A simple time-period selector.
- Audience context, such as enthusiasts or newcomers.
- A future demographics section, explicitly unavailable without reliable source data; no demographic inference.

Supporting sentiment classification, confidence, positives, negatives, counts and source evidence are available through a secondary disclosure in the expanded area.

## Prototype behaviour

The interactive concept contains fictional examples, clearly labelled as illustrative. No live platform or AI requests occur. Unknown subjects show a truthful no-live-search state. Refinement controls preview selection and do not claim to have reanalysed a dataset. Example evidence is fictional and must not be presented as actual source links.

The final app should adapt collection to selected parameters and recompute the answer. That behaviour belongs to implementation and integration milestones.

## Responsive behaviour

Desktop and mobile are equally important. Maintain the search-and-expanding-card structure on both. Stack filters vertically when narrow, wrap source options, keep inputs at least 16px on mobile and give touch actions comfortable targets.

## Still to refine

Glass intensity, atmospheric lighting, exact corner radii, transition timing, copy and the eventual audience-filter taxonomy. No additional platforms have been selected beyond YouTube, X and Reddit.
