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

## Fifth pass, 11 September 2026: rules of the page

Three rules the user set, which override anything above that conflicts:

1. **The page never scrolls.** The app is one screen tall. Cards grow outward, not down; a card that still cannot fit the window scrolls inside itself, and only once its opening has finished. This reverses the third pass, where the page was made scrollable.
2. **Nothing inside a card sits wider than the search box's text.** Every card body is inset 22px from the field's edge, so text and controls start where the typed subject starts.
3. **Liquid glass is the core aesthetic.** The panes are slightly see-through (76%), with more blur and saturation so the ground's gradient and its two drifting lights show through them, and a brighter rim. The ground gradient runs from poster paper to the slate blue of the wall.

Also in this pass: every expansion is slower, with the answer and Get Specific at 900ms out and 600ms back; Get Specific is a second card of the search card's width, with a bar built like the search field, opening the same way and spreading into two columns; the heading sits 12px above the card, the same as the gap between the cards; the answer has 48px above it; the platform buttons are 36px logo-only circles under their label; and a sentiment bar sits bottom left under the answer, in the user's own green, dark grey and red, with no figures printed.

## Sixth pass, 11 September 2026: frosted glass on the sunset

- **The ground is the user's image.** `public/bg.avif`, a 10 KB gradient from slate blue at the top through cream to warm orange at the foot. The drifting lights are off; the image is not painted over.
- **Frosted glass everywhere.** The user supplied three liquid-glass references (a menu over a black-sand beach, iOS-style controls over autumn trees, a pale glass pill). Every card and every control is now the same recipe: a pale white tint at 24% (30% on controls) over a heavy blur with saturation, a sheen off the top left, a rim brightest along the top edge, and a soft drop. The charcoal smoked glass of the fourth and fifth passes is gone, and so type on glass is dark now: `#1A1B1E`, with hairlines in the same dark at 12%. The orange stays a solid fill for the badge and the search button, with a white edge so it sits in the same material.
- **Verdict chips** are tints of the ice blue, the khaki and the orange under dark type, so they read on pale glass.
- **Get Specific** is back to the small pill at the search card's left edge, as the user asked, and grows in place into the full-width panel: width, corners and padding animate on the slow pair, and on a wide screen it grows outward to 1180px in two columns.
- **Overall opinion** is the title above the sentiment bar, matching "Sentiment extracted from" above the logos.

## Seventh pass, 11 September 2026: the smooth morph

- **Why Get Specific stuttered.** The pill was growing into the panel by animating its width, its left margin, its corner radius and its padding at once, on an element with a backdrop blur, while the segmented control inside re-measured its highlight on every frame as the width changed. Each frame re-laid the page out. The ui-ux-pro-max animation rules put it plainly: animate transform, opacity or a clip, never width or height.
- **The fix.** The panel is laid out at its full size from the start and positioned over whatever is beneath it; the wrapper keeps only the pill's 36px in the flow, so the page never moves. What animates is a clip-path, from the pill's outline out to the panel's rounded rectangle, and the body's opacity a beat behind. Nothing inside changes size while it opens. The one cost is the drop shadow, which a clip removes from that panel; its rim and blur carry the glass. Its height is capped to the window and it scrolls inside itself once settled.
- **Simpler platform evidence.** Verdict, agreement and item count on one line; one line of confidence; Liked and Did not like as short lists of titles; the titles it drew from, with one note that they are fictional. The confidence heading, the theme details, the shortfall notes, the kind labels and the per-item fictional marks are gone.
- **The accent** is now the golden orange at the foot of the background image, `#F2A33A`, read by eye. It carries dark type, because white on it falls short of the floor. The focus ring is a darker cut of it, `#C9781A`, so it reads on pale glass.
- **How does this work** mirrors Get Specific at the search card's right edge: the same pill, the same clip-path opening, to the card's own 720px rather than the wide width, holding four short paragraphs in plain English. Opening one closes the other. The small print at the foot of the page is gone, with nothing in its place, at the user's request.

## Eighth pass, 11 September 2026: the pills rethought

The user asked for the expanding pills to be judged as a concept against the ui-ux-pro-max rules, and they failed three of them. The panels opened to 1180px because Get Specific once needed two columns, so a four-paragraph explanation sat in a panel three times wider than its text (the user's "massive gap"). The pill travelled to a corner that moved away from where it was clicked, which breaks spatial continuity and the cause-and-effect the rules ask of every animation. And 900ms is past the ceiling for a panel that is opened and closed often.

What replaced it:

- **The panel is the card's width and grows out of its pill.** The wrapper is the 720px column; each panel is laid out at that width from the start and only its clip animates, from the pill's outline in its own corner to the full rounded rectangle. The pill stays exactly where it was clicked and becomes the panel's header, its rim fading into the panel's. No pixel measurement is needed any more, because the pill's corner and the panel's corner are the same point.
- **Standard timings for these two** (520ms out, 360ms back, ease-out in and ease-in out), the answer keeping its slow reveal. Press feedback on the pill.
- **Rows arrive in sequence.** Each `.mrow` rises from 8px below, one beat (50ms) after the last, on the way in; all leave together, faster, on the way out. Hierarchy motion: entering from below reads as deeper.
- **Get Specific fits 720px** with Platforms and Time period side by side above the demographics. How does this work runs at 15px on a 76ch measure.
- **Kept:** the no-scroll rule (the wrapper still holds only the pills' 36px; a panel's height is capped to the window and scrolls inside), and the 22px inset.
