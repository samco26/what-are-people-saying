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
