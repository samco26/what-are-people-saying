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

## Implemented direction, 11 September 2026

The original mockup and UI reference images were not available when the application was built, so the user asked for the look to take heavy inspiration from the Kia DAA dashboard's live interface, in dark mode. What came across, and what did not:

- **The pane.** The glass surface is the dashboard's glass-mode construction rebuilt for this palette: blur the ground and put its colour back (`blur(20px) saturate(1.55) brightness(1.05)`), a smoked midnight-blue tint, a white sheen off the top-left corner, a shadow gathering at the bottom, and a one-pixel rim that catches the light at the top and returns dimmer underneath. Radius stays at the agreed 30px. A smaller inset surface, at 22px, holds the panels that open inside the pane.
- **The ground.** Two soft lights drifting very slowly behind everything, a cool one top right and a bluer one bottom left, over the agreed `#070e20`. They are what the pane blurs. They stop under reduced motion.
- **Controls.** The dashboard's pill segmented control, with its highlight sliding to the chosen stop rather than redrawing, is the time-period and audience control. Its 11px tracked uppercase labels head every section. Its house easing, `cubic-bezier(.2,.7,.3,1)`, is the easing everywhere. Its 36px minimum control height is the floor here too, and the search button and main actions are 44px or more.
- **Colour.** The dashboard's dark tokens are read the other way up, so what is borrowed is the grade rather than the hue: light grey ink, a cool blue-grey for secondary text, and lifted green, amber and rose for positive, mixed and negative that clear 4.5:1 on the pane. One cool blue accent for focus and selection. Kia's red is deliberately not here: nothing on this screen is an alarm.
- **Type.** Helvetica as agreed, not the dashboard's Archivo. Nothing smaller than 11px.
- **Not carried across.** The rail, the header, the charts, the liquid-metal surfaces and the moving mesh field. This is one container on an open page, and it stays that way.

## Second pass, 11 September 2026

Changes the user asked for after seeing the first preview, all implemented:

- **Two colours.** Teal green `#3D8D7A` and lemon chiffon `#FFFACD` are the whole palette. The ground is a deep green gradient with a teal light top right and a warm lemon light bottom left. Text is lemon chiffon and its tints. Positive is a tint of the teal, mixed is the lemon, and negative is a muted clay, the one colour outside the pair, used for negative marks only. The blue and brown first proposed were dropped at the user's request.
- **BETA badge.** Top right, the dashboard's badge in the teal, opening a list of what changed with green, lemon and clay dots for new, changed and removed.
- **Examples in the box.** The rotating subjects now sweep inside the empty search box in place of a placeholder. Enter on an empty box searches the one showing. The pause control is gone; reduced motion still stops the rotation.
- **Get Specific under the box.** A small quiet button under the search box, there before any search, unfolding its own pane: platform chips with the real logos, the time-period control with a Custom range that reveals from-and-to dates, audience, and the unavailable demographics note.
- **Sentiment extracted from.** Under the answer, right-aligned, a button for each platform with its logo. Each opens that platform's own evidence page in the same container, and switching platforms crossfades. The single Show the evidence panel is gone; the overall classification and confidence sit on one line under the answer.
- **Motion.** One set of tokens: entering eases out over 320ms, leaving eases in over 220ms, micro-interactions at 180ms, a press scale of 0.97 on buttons, chevrons that turn, and crossfades for content swapped inside an open container. Everything stops under reduced motion.

## Third pass, 11 September 2026

- **Lemon ground, teal glass.** The page is now the lemon chiffon as a soft gradient, with a teal light top right and a warmer lemon light bottom left. The panes stay smoked teal, made denser (86%) so lemon type on them clears 4.5:1 over a light ground. Type on the page itself is deep teal.
- **The card grows sideways.** With an answer showing, opening a platform's evidence widens the card from 720px to 1180px, equally to both sides, and the evidence takes the second column beside the answer. The search field is held at the resting width in the centre and never moves. Below 1024px the card cannot widen, so the evidence stacks beneath, as before. The page scrolls.
- **Get Specific morphs.** The button is a small teal glass pill that grows into the panel in place: width, corners and padding animate together and the body unfolds inside. Nothing drops out of it.
- **Demographics replace audience.** Three rows of chips, age, gender and region, any number selected at once, click to select and click again to clear. The explanatory paragraph under the heading is gone at the user's request; the summary line at the foot of the panel still says the selection is a preview.
- **Removed.** The overall sentiment pill and its line under the answer, and the unavailable or partial source notes. X is available on every example with an evidence page of its own.
- **Spacing.** The answer sits further below the search box.

## Fourth pass, 11 September 2026: the X-ray palette

The user supplied a photograph of X-ray posters on a wall (a LENSLI bag, a Comme des Garçons shirt, an Issey Miyake Men poster, a CREARE "mechanism of cool" poster) and asked for the palette to be extracted from it. Read by eye rather than measured:

| In the picture | Hex | Role in the app |
|---|---|---|
| Poster paper | `#ECEAE4` | type on the glass, the top of the page gradient |
| Cool grey wall | `#D6D7D3` | the bottom of the page gradient |
| Slate blue wall | `#4E5B70` | type on the page, the cool drifting light |
| Issey Miyake black | `#141518` | the glass surfaces, at 88% |
| CREARE ice blue | `#B9C4DA` | positive marks, the selected stop in the time control |
| Collar and wood khaki | `#B5A688` | mixed marks, the warm drifting light |
| "mechanism of cool" orange | `#E4572E` | the single accent: BETA badge, search button, selected chips, focus |

The picture is monochrome with one warm note, and the app follows that: orange appears only where something is chosen or needs to be found. Orange on charcoal is under the 4.5:1 floor for small type, so wherever orange has to be read it is lifted to `#F08A66`; as a fill it carries charcoal type. Negative marks use the lifted orange as well, on the X-ray logic that cool means fine and warm means flagged. The teal and lemon of the previous pass are gone.
