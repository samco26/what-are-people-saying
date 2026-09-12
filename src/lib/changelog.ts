/* The BETA number and what changed. CHANGELOG[0].v is the single source of
   truth for the number on the badge. Entries are written for the person
   reading the dialog, not for a developer, and nothing is listed that is not
   actually working in that version. */

export type ChangeKind = "new" | "changed" | "removed";

export interface ChangeEntry {
  v: string;
  date: string;
  items: ReadonlyArray<readonly [ChangeKind, string]>;
}

export const CHANGELOG: ReadonlyArray<ChangeEntry> = [
  {
    v: "0.12.2", date: "12 September 2026",
    items: [
      ["new", "Live searches check the subject’s official name and current facts against web sources before looking for opinions."],
      ["changed", "Verified names and supported aliases guide platform searches and category cards. Unclear subjects and failed fact-checks are explained before collecting discussion."],
      ["new", "About this answer shows linked subject facts separately from opinions."],
    ],
  },
  {
    v: "0.12.1", date: "12 September 2026",
    items: [
      ["changed", "A did-you-mean suggestion now carries the kind of thing it is, so accepting it lands on the right card (a product stays a product) instead of the usual answer; and a name is only called ambiguous when it is shared by genuinely different things, not when a product is rumoured, unreleased or a concept."],
      ["changed", "The heading reads Find the popular opinion on, the rotating examples have no question mark, and on phones the top left shows Privacy instead of the title."],
    ],
  },
  {
    v: "0.12.0", date: "12 September 2026",
    items: [
      ["new", "A film, product, place or app gets a card shaped like the site people would normally check for it, with a star rating out of five worked out from the sentiment, each platform's own rating beside its logo, and the common opinions with how many posts back each one. Everything else keeps the usual answer."],
      ["new", "When a name could mean several things, the usual answer is shown and the search field suggests the most likely specific one; Tab or a click searches it."],
      ["new", "General view, top right of a category card on desktop, switches back to the usual answer for the same subject."],
      ["changed", "The heading asks how people feel about a subject, and the header reads Sentiment analyser."],
    ],
  },
  {
    v: "0.11.0", date: "12 September 2026",
    items: [
      ["new", "Before searching, the subject is turned into the words people actually use for it, so a question typed in plain English finds real posts on each platform. If that step fails the subject is searched as typed."],
      ["changed", "X posts are chosen by X's relevance ranking instead of newest first, so a busy subject is not reduced to its last few hours."],
      ["changed", "When a YouTube video has more comments in the period than the 30 that are read, the ones viewers liked most are kept."],
      ["changed", "Searches that find nothing on X, or cannot reach it, no longer use up the daily X reading budget."],
    ],
  },
  {
    v: "0.10.3", date: "12 September 2026",
    items: [
      ["changed", "The analysis returns its classification as compact reference lists and only the representative posts per platform, and YouTube reads top and recent comments together. The answer is unchanged; the measured search time is about the same."],
      ["new", "A small note above the sentiment bar when fewer than 50 opinions were found."],
      ["changed", "On phones every recurring opinion is listed under the answer and the list scrolls on its own. Show more opinions is desktop only."],
    ],
  },
  {
    v: "0.10.2", date: "12 September 2026",
    items: [
      ["changed", "The BETA label text is centred, and How it works sits at the bottom right of the search card again."],
    ],
  },
  {
    v: "0.10.1", date: "12 September 2026",
    items: [
      ["changed", "The overall sentiment bar now sits under the platform icons in the answer."],
      ["changed", "Tapping anywhere outside an expanded view closes it. Smaller answer text on phones so the opinions fit on one screen."],
      ["removed", "The About this answer panel, the list behind the BETA badge, the arrows on text links and two sentences from How it works."],
    ],
  },
  {
    v: "0.10.0", date: "12 September 2026",
    items: [
      ["changed", "Turquoise and peach liquid glass, with a flowing search animation."],
      ["new", "Recurring opinions settle around the answer. Tap one to explore its supporting posts."],
      ["changed", "Platform logos open a full-screen sentiment bar and original posts with coloured comment excerpts."],
      ["removed", "Analysed totals, repeated platform headings and dots in opinion bubbles."],
    ],
  },
  {
    v: "0.9.5",
    date: "12 September 2026",
    items: [
      ["changed", "The Reddit connector is ready for approved OAuth access and now reports unreadable comment sections instead of hiding them."],
      ["changed", "Representative Reddit evidence keeps its required public username attribution, while usernames stay out of the AI analysis."],
      ["new", "A privacy page explains how searches and temporary public discussion data are processed."],
    ],
  },
  {
    v: "0.9.4",
    date: "12 September 2026",
    items: [
      ["changed", "Searches start with 3 months of discussion, then widen to 12 months and 3 years when fewer than 50 opinions are found. The answer shows the period used."],
      ["changed", "Older YouTube videos can contribute recent comments. Earlier opinions are retained and duplicates removed when the search expands."],
      ["changed", "Source responses are reused within a search to avoid repeated collection. X payment errors now explain that API billing needs attention."],
    ],
  },
  {
    v: "0.9.3",
    date: "12 September 2026",
    items: [
      ["changed", "Answers lead with what people think. The count shows opinions read in the last month, with percentages above the opinion bar."],
      ["changed", "YouTube reads up to 30 top-ranked comments from each of the 10 most-viewed matching recent videos. All collected opinions reach the AI."],
      ["changed", "Less duplicate AI output when one platform is available, lighter YouTube responses, and no artificial loading delay."],
      ["new", "Rotating examples mix today's BBC News topics with niche interests. News loads separately and evergreen examples remain if it is unavailable."],
      ["changed", "Live evidence links open the actual comments. Source coverage explains missing platforms or comments."],
      ["removed", "The Live sample label and Nothing is kept line above the answer."],
    ],
  },
  {
    v: "0.9.2",
    date: "11 September 2026",
    items: [
      ["removed", "Get Specific and all search filters. Enter a subject to search across the connected platforms."],
    ],
  },
  {
    v: "0.9.1",
    date: "11 September 2026",
    items: [
      ["changed", "The site is called What People Think. It was The General Consensus."],
    ],
  },
  {
    v: "0.9",
    date: "11 September 2026",
    items: [
      ["changed", "Get Specific and How does this work rethought. Each panel is now the width of the search card and grows out of its own pill, which stays exactly where you clicked and becomes the panel's header. No more travelling pill, no more empty space beside the text."],
      ["changed", "The rows inside arrive one after another, rising from below, and the panels open in about half a second and close faster."],
      ["changed", "Platforms and Time period sit side by side in Get Specific, above the demographics."],
    ],
  },
  {
    v: "0.8.2",
    date: "11 September 2026",
    items: [
      ["changed", "The Get Specific and How does this work pills sit exactly on their glass, flush with the card's edges. The sliver of glass that showed past each button is gone."],
    ],
  },
  {
    v: "0.8.1",
    date: "11 September 2026",
    items: [
      ["changed", "The Get Specific and How does this work pills show their labels again. Their position is now measured in pixels, so the pill and the label always line up."],
    ],
  },
  {
    v: "0.8",
    date: "11 September 2026",
    items: [
      ["new", "The live search is built and waits for its keys. Once they are set, a search collects a bounded sample from YouTube, X and Reddit, sends it to OpenAI once, and answers from that. Until then the six examples answer as before."],
      ["new", "A search that finds too little says so, platform by platform, instead of guessing."],
      ["changed", "Get Specific's pill travels to the panel's corner as it opens, and How does this work opens the same way to the same width."],
    ],
  },
  {
    v: "0.7",
    date: "11 September 2026",
    items: [
      ["changed", "Get Specific opens smoothly. Only its visible edge animates now, from the pill's outline out to the panel's, instead of the panel changing shape as it grows."],
      ["changed", "A platform's evidence is simpler: its verdict on one line, a line on confidence, what people liked and did not as short lists, and the titles it drew on."],
      ["changed", "The accent is the golden orange from the foot of the background, on the badge, the search button and anything selected."],
      ["new", "How does this work, under the search card on the right, mirroring Get Specific, with a short explanation."],
      ["removed", "The small print at the foot of the page."],
    ],
  },
  {
    v: "0.6",
    date: "11 September 2026",
    items: [
      ["changed", "The background is the sunset gradient image, slate blue down to orange."],
      ["changed", "Every card and every button is frosted glass now: see-through, blurred, with a bright edge. Text on the glass is dark."],
      ["changed", "Get Specific is back to the small pill under the search card, and grows into the full panel from there."],
      ["new", "An Overall opinion title above the sentiment bar."],
    ],
  },
  {
    v: "0.5",
    date: "11 September 2026",
    items: [
      ["changed", "The page never scrolls. Cards grow outward, and a card that still cannot fit the window scrolls inside itself."],
      ["changed", "Every expansion is slower and smoother. The answer and Get Specific take the longest, nearly a second."],
      ["changed", "Get Specific is now a second card the same width as the search card, with a bar built like the search box. It opens the same way and spreads into two columns."],
      ["changed", "Nothing inside a card sits wider than the search box's text. The answer has more room above it, and the heading sits the same distance above the card as Get Specific sits below it."],
      ["changed", "The platform buttons are logos alone, smaller, under their label on the right."],
      ["new", "A sentiment bar bottom left under every answer: green, dark grey and red in proportion, no figures."],
      ["changed", "The ground is a deeper gradient and the glass is slightly see-through, so it shows."],
    ],
  },
  {
    v: "0.4",
    date: "11 September 2026",
    items: [
      ["changed", "New colours, taken from the X-ray poster reference: poster paper and cool grey for the page, charcoal glass surfaces, ice blue and khaki for the quiet marks, and one orange accent for the badge, the search button and anything selected."],
    ],
  },
  {
    v: "0.3",
    date: "11 September 2026",
    items: [
      ["changed", "The page is now lemon cream, as a soft gradient, with the teal glass surfaces kept on top of it."],
      ["changed", "Opening a platform's evidence widens the answer card to both sides and shows the evidence beside the answer, with the search box staying put. On a phone it sits below."],
      ["changed", "Get Specific grows from its pill into the panel instead of dropping a menu beneath it."],
      ["new", "Demographics: age, gender and region, each with several choices that can be selected together. Click to select, click again to clear."],
      ["changed", "X is available on every example subject and has its own evidence page for each."],
      ["removed", "The audience control, the overall sentiment pill under the answer, and the unavailable-source notes."],
    ],
  },
  {
    v: "0.2",
    date: "11 September 2026",
    items: [
      ["changed", "New colours: teal green and lemon chiffon over a deep green gradient, with the glass surfaces kept."],
      ["changed", "The example subjects now rotate inside the search box. Press Enter on an empty box to search the one showing."],
      ["new", "Get Specific sits under the search box and can be set before a search. The time period now takes a custom date range."],
      ["new", "Each platform has its own evidence page, opened from the logos under an answer, with its own verdict, themes and the threads it drew on."],
      ["new", "This BETA badge and the list behind it."],
      ["removed", "The pause control for the examples, and the single Show the evidence panel."],
    ],
  },
  {
    v: "0.1",
    date: "11 September 2026",
    items: [
      ["new", "First working preview: search, a sample answer, Get Specific and an evidence panel, on six fictional example subjects."],
    ],
  },
];
