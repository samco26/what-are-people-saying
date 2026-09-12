/* FICTIONAL SAMPLE RESULTS.

   Everything in this file is made up for design and development. No platform
   was queried, no AI ran, no quote below was said by anyone, and no thread
   title below exists. Every result carries illustrative: true and the screen
   labels it. Live results replace this file's role entirely in later
   milestones.

   The six subjects are the ones DESIGN.md names for the opening view. Some
   deliberately have fewer than three positives or negatives and one is too
   broad to answer well, so those states of the screen are exercised. All
   three platforms are available on every subject, at the user's request;
   the unavailable and partial states still exist in the types for live
   results. */

import type { ConsensusResult, SourceThread } from "./types";

export interface SampleEntry {
  /* How the subject is shown in the rotating search box. */
  display: string;
  /* Other ways someone might type it. Matched after normalisation. */
  aliases: string[];
  result: ConsensusResult;
}

const t = (kind: SourceThread["kind"], title: string): SourceThread => ({ kind, title, fictional: true });

export const SAMPLES: SampleEntry[] = [
  {
    display: "the weather in Tuscany",
    aliases: ["tuscany weather", "weather tuscany", "tuscan weather", "tuscany"],
    result: {
      subject: "the weather in Tuscany",
      sentiment: { positive: 0.66, neutral: 0.22, negative: 0.12 },
      summary:
        "Tuscany's weather draws warm reactions, with spring and early autumn described again and again as the time to go. The one steady complaint is July and August, which several travellers found hotter and stickier than they expected.",
      verdict: "positive",
      agreement: "moderate",
      confidence: {
        level: "medium",
        reason:
          "A reasonable number of items from all three sources, but most are travel posts from visitors rather than people who live there.",
      },
      positives: [
        { title: "Spring and autumn are the sweet spot", detail: "May, June, September and October come up repeatedly as mild, dry and comfortable for walking." },
        { title: "Long, reliable summers", detail: "People planning weddings and long stays like that rain is rare between June and September." },
        { title: "Cool evenings in the hills", detail: "Hill towns get a breeze after dark, which several posts mention as the reason to stay outside Florence." },
      ],
      negatives: [
        { title: "Peak summer heat", detail: "July and August are called oppressive by a good share of the sample, especially in Florence and Siena." },
        { title: "Wet, grey winters", detail: "A smaller group warns that November to February can be damp and quiet, with short days." },
      ],
      sources: [
        { source: "youtube", availability: "ok", itemsAnalysed: 41 },
        { source: "x", availability: "ok", itemsAnalysed: 29 },
        { source: "reddit", availability: "ok", itemsAnalysed: 63 },
      ],
      bySource: [
        {
          source: "youtube",
          verdict: "positive",
          agreement: "moderate",
          confidence: { level: "medium", reason: "Mostly travel vlogs and their comments, which lean towards people who had a good trip." },
          positives: [
            { title: "Shoulder-season light", detail: "Late September and May videos draw the warmest comments about the weather itself." },
            { title: "Dry summers for outdoor plans", detail: "Wedding and long-stay vlogs praise how rarely rain interrupts anything." },
          ],
          negatives: [
            { title: "August in the cities", detail: "Commenters on Florence vlogs describe the heat as the low point of their trip." },
          ],
          threads: [
            t("video", "Tuscany in late September, an honest week"),
            t("video", "Why we chose Siena in May over Florence in July"),
            t("comment", "Florence in August was a mistake, here is what I would do instead"),
          ],
        },
        {
          source: "x",
          verdict: "positive",
          agreement: "moderate",
          confidence: { level: "low", reason: "Short posts, many of them a photo with a line of caption, so the mood is clear and the reasons are thin." },
          positives: [
            { title: "Golden evenings", detail: "Sunset posts from the hills draw the warmest replies in the sample." },
          ],
          negatives: [
            { title: "Heatwave complaints", detail: "August posts from Florence are mostly about the temperature." },
          ],
          threads: [
            t("post", "Thirty-eight degrees in Florence and the gelato is not helping"),
            t("post", "Val d'Orcia at seven in the evening in late September. Nothing to add"),
          ],
        },
        {
          source: "reddit",
          verdict: "positive",
          agreement: "moderate",
          confidence: { level: "medium", reason: "Plenty of replies, with a few residents correcting the visitors, which gives the sample some balance." },
          positives: [
            { title: "Locals back spring and autumn", detail: "Residents in the replies agree with visitors on the best months, which is unusual." },
            { title: "Cool hill-town evenings", detail: "Several threads recommend staying up in the hills for the breeze after dark." },
          ],
          negatives: [
            { title: "Damp winters", detail: "A January thread is blunt about rain and short days." },
            { title: "Peak summer heat", detail: "July and August draw the same complaint in almost every thread that mentions them." },
          ],
          threads: [
            t("thread", "Best month to visit Tuscany for walking?"),
            t("thread", "Is January in Tuscany worth it? Rained nine days of twelve"),
            t("thread", "Val d'Orcia in July, tips for the heat"),
          ],
        },
      ],
      illustrative: true,
    },
  },
  {
    display: "the newest ChatGPT model",
    aliases: ["newest chatgpt model", "new chatgpt model", "latest chatgpt model", "chatgpt", "the new chatgpt", "chatgpt model"],
    result: {
      subject: "the newest ChatGPT model",
      sentiment: { positive: 0.41, neutral: 0.19, negative: 0.4 },
      summary:
        "Opinion on the newest ChatGPT model is split. Developers and heavy users are mostly pleased with speed and coding help, while a loud share of everyday users say the tone has changed for the worse and that usage limits arrive too quickly. Nobody agrees on whether it is a big step or a small one.",
      verdict: "mixed",
      agreement: "weak",
      confidence: {
        level: "medium",
        reason:
          "Plenty of items across all three sources, but a lot of it is reaction to launch coverage rather than hands-on use.",
      },
      positives: [
        { title: "Faster, noticeably", detail: "Response speed is the most common single compliment, across all three sources." },
        { title: "Better at code", detail: "Developers report fewer broken snippets and better handling of long files." },
        { title: "Follows instructions more closely", detail: "Several long-time users say it sticks to format and length requests where the last model drifted." },
      ],
      negatives: [
        { title: "Tone feels flatter", detail: "A recurring complaint that answers read colder and more corporate than before." },
        { title: "Limits hit too soon", detail: "Free and lower-tier users describe running into caps within a short session." },
        { title: "Launch hype versus reality", detail: "A sceptical group says the demos oversold it and day-to-day differences are small." },
      ],
      sources: [
        { source: "youtube", availability: "ok", itemsAnalysed: 58 },
        { source: "x", availability: "ok", itemsAnalysed: 44 },
        { source: "reddit", availability: "ok", itemsAnalysed: 77 },
      ],
      bySource: [
        {
          source: "youtube",
          verdict: "mixed",
          agreement: "weak",
          confidence: { level: "medium", reason: "Review videos are mostly positive; their comment sections are not, and both count." },
          positives: [
            { title: "Speed on camera", detail: "Side-by-side demos of response time are the most-liked moments in the reviews." },
            { title: "Long-file coding demos", detail: "Reviewers who work through a real codebase come away impressed." },
          ],
          negatives: [
            { title: "Hype versus daily use", detail: "The top comments under the biggest reviews say the difference is small in ordinary use." },
          ],
          threads: [
            t("video", "I used the new model for a week, here is what changed"),
            t("video", "New ChatGPT model: faster, but is it smarter?"),
            t("comment", "The usage limits nobody mentioned in the review"),
          ],
        },
        {
          source: "x",
          verdict: "negative",
          agreement: "moderate",
          confidence: { level: "low", reason: "Posts at launch skew towards complaint, and X moves on quickly, so this reads the first days more than the weeks after." },
          positives: [
            { title: "Quick replies", detail: "The speed is acknowledged even in posts that go on to complain." },
          ],
          negatives: [
            { title: "The tone", detail: "The most-shared posts in the sample are about answers reading like a press release." },
            { title: "Limits", detail: "Screenshots of the limit warning after a short session circulate widely." },
          ],
          threads: [
            t("post", "New model is quick but talks like a press release now"),
            t("post", "Twenty minutes in and I have hit the limit. Fast does not help if I cannot use it"),
            t("post", "Refactored a huge file in one go. Fine, it is better"),
          ],
        },
        {
          source: "reddit",
          verdict: "positive",
          agreement: "moderate",
          confidence: { level: "medium", reason: "Long threads from people who use it for work, with the complaints argued out in the replies." },
          positives: [
            { title: "Better at code", detail: "Developer threads report fewer broken snippets and better memory of a long file." },
            { title: "Follows instructions", detail: "Writers say it now keeps to the format and length they asked for." },
          ],
          negatives: [
            { title: "Limits on lower tiers", detail: "Free-tier users in the replies describe running into caps quickly." },
          ],
          threads: [
            t("thread", "Refactored a 900-line file in one go without it losing the plot"),
            t("thread", "Is the tone change real or are people imagining it?"),
            t("thread", "Free tier limits with the new model, what are you seeing?"),
          ],
        },
      ],
      illustrative: true,
    },
  },
  {
    display: "cinema",
    aliases: ["the cinema", "cinemas", "going to the cinema", "movie theaters", "movie theatres", "the movies"],
    result: {
      subject: "cinema",
      sentiment: { positive: 0.38, neutral: 0.34, negative: 0.28 },
      summary:
        "Cinema still has a strong pull for the experience of seeing a film in a full room, while ticket prices are the main thing keeping people home. Opinions on streaming and the big screen vary widely, so there is little agreement beyond that.",
      verdict: "mixed",
      agreement: "weak",
      confidence: {
        level: "low",
        reason:
          "The subject is too wide for a single sample to describe well, and many items are about specific films rather than cinema itself.",
      },
      positives: [
        { title: "The shared room still matters", detail: "Laughing and gasping with a crowd is the reason most people give for still going." },
        { title: "Independent cinemas are loved", detail: "Smaller venues with a bar and a curated programme get consistently warm mentions." },
      ],
      negatives: [
        { title: "Ticket and snack prices", detail: "By far the most common complaint, often with a comparison to a month of streaming." },
      ],
      sources: [
        { source: "youtube", availability: "ok", itemsAnalysed: 36 },
        { source: "x", availability: "ok", itemsAnalysed: 21 },
        { source: "reddit", availability: "ok", itemsAnalysed: 52 },
      ],
      bySource: [
        {
          source: "youtube",
          verdict: "mixed",
          agreement: "weak",
          confidence: { level: "low", reason: "Most of the sample is film reviews, and only their comments touch on cinema-going itself." },
          positives: [
            { title: "The crowd reaction", detail: "Comments about a packed screening cheering are the warmest in the sample." },
          ],
          negatives: [
            { title: "Prices", detail: "The cost of two tickets and snacks is raised under almost every video." },
          ],
          threads: [
            t("video", "Is the cinema worth it in 2026?"),
            t("comment", "Saw it in a packed room and the whole place cheered at the ending"),
          ],
        },
        {
          source: "x",
          verdict: "mixed",
          agreement: "weak",
          confidence: { level: "low", reason: "Posts about cinema-going are scattered among posts about particular films, and few say why." },
          positives: [
            { title: "Opening-night crowds", detail: "Posts from a full opening-night screening are the warmest in the sample." },
          ],
          negatives: [
            { title: "Prices", detail: "A photo of the receipt for two tickets and snacks is a recurring post." },
          ],
          threads: [
            t("post", "Full room, everyone gasped at the same moment. This is why"),
            t("post", "Two tickets and a popcorn. I could have bought the film"),
          ],
        },
        {
          source: "reddit",
          verdict: "mixed",
          agreement: "weak",
          confidence: { level: "low", reason: "Threads about cinema itself are few, and they split evenly between fondness and frustration." },
          positives: [
            { title: "Independent venues", detail: "Local cinemas with a bar and a considered programme are recommended by name." },
          ],
          negatives: [
            { title: "Prices", detail: "The most-upvoted comments compare a single trip to a month of streaming." },
          ],
          threads: [
            t("thread", "Forty-two dollars for two tickets and a popcorn, is this normal now?"),
            t("thread", "Shout-out to the small cinemas keeping the habit alive"),
          ],
        },
      ],
      illustrative: true,
    },
  },
  {
    display: "the Keychron K2",
    aliases: ["keychron k2", "k2 keyboard", "keychron k2 keyboard", "the keychron k2 keyboard"],
    result: {
      subject: "the Keychron K2",
      sentiment: { positive: 0.78, neutral: 0.14, negative: 0.08 },
      summary:
        "Enthusiasm for the Keychron K2 is strong and unusually consistent. It is recommended over and over as the sensible first mechanical keyboard, especially for Mac users, with the main reservations being its height and the stock keycaps rather than anything about how it types.",
      verdict: "positive",
      agreement: "strong",
      confidence: {
        level: "high",
        reason:
          "A good number of items from all three sources, mostly from people who own the keyboard, and the same points come up independently in each.",
      },
      positives: [
        { title: "Typing feel for the money", detail: "Owners describe it as a big step up from a laptop keyboard without a big-step-up price." },
        { title: "Mac layout out of the box", detail: "Having a proper Command key and media keys without remapping is mentioned constantly." },
        { title: "Hot-swap switches", detail: "Enthusiasts like that switches can be changed later without soldering." },
      ],
      negatives: [
        { title: "It sits high", detail: "Many owners say a wrist rest is not optional, and a few returned it for that reason." },
        { title: "Stock keycaps feel cheap", detail: "The ABS caps go shiny, and replacing them is the first upgrade most people make." },
        { title: "Bluetooth wake-up lag", detail: "A recurring complaint that the first keystroke after idle is lost on wireless." },
      ],
      sources: [
        { source: "youtube", availability: "ok", itemsAnalysed: 49 },
        { source: "x", availability: "ok", itemsAnalysed: 31 },
        { source: "reddit", availability: "ok", itemsAnalysed: 88 },
      ],
      bySource: [
        {
          source: "youtube",
          verdict: "positive",
          agreement: "strong",
          confidence: { level: "high", reason: "Long-term reviews and their comments agree, and several are from people two years in." },
          positives: [
            { title: "Sound and feel on camera", detail: "Typing tests are the most replayed parts of the reviews, and the comments approve." },
            { title: "The Mac layout", detail: "Reviewers switching from Apple keyboards call it the easiest move they made." },
          ],
          negatives: [
            { title: "Height", detail: "Nearly every review recommends a wrist rest before it recommends anything else." },
            { title: "Stock keycaps", detail: "Reviewers show the shine after a few months and swap them on camera." },
          ],
          threads: [
            t("video", "Keychron K2 two years later, still my daily keyboard"),
            t("video", "The best first mechanical keyboard for Mac users"),
            t("comment", "Get the wrist rest. That is the whole review"),
          ],
        },
        {
          source: "x",
          verdict: "positive",
          agreement: "moderate",
          confidence: { level: "medium", reason: "Shorter posts and fewer of them, but the praise and the one complaint match the other sources." },
          positives: [
            { title: "Value", detail: "The price is the reason most posts give for recommending it to a friend." },
          ],
          negatives: [
            { title: "Wireless wake lag", detail: "The lost first keystroke after idle is the one complaint that keeps recurring." },
          ],
          threads: [
            t("post", "The K2 wake lag on Bluetooth is the only thing between this and a perfect starter board"),
            t("post", "Bought a K2 for a friend starting out. Still the easy answer"),
          ],
        },
        {
          source: "reddit",
          verdict: "positive",
          agreement: "strong",
          confidence: { level: "high", reason: "The largest sample here, from owners, with the same recommendations repeated across many threads." },
          positives: [
            { title: "The sensible first board", detail: "It is the default answer in beginner threads, with reasons given." },
            { title: "Hot-swap switches", detail: "Owners describe changing switches later as the cheap way to keep it fresh." },
          ],
          negatives: [
            { title: "It sits high", detail: "A few owners say they returned it for the height alone." },
            { title: "Keycaps", detail: "Replacing the stock caps is treated as the first upgrade everyone makes." },
          ],
          threads: [
            t("thread", "First mechanical keyboard for a Mac, is the K2 still the answer?"),
            t("thread", "Two years on the K2, no need for anything fancier"),
            t("thread", "Returned my K2 because of the height, what sits lower?"),
          ],
        },
      ],
      illustrative: true,
    },
  },
  {
    display: "living in Melbourne",
    aliases: ["melbourne", "life in melbourne", "moving to melbourne", "living in melbourne australia", "melbourne living"],
    result: {
      subject: "living in Melbourne",
      sentiment: { positive: 0.47, neutral: 0.18, negative: 0.35 },
      summary:
        "Living in Melbourne inspires affection and frustration in the same breath. Food, coffee, culture and the sense that there is always something on are praised almost without exception, while rent, the weather and the commute from the affordable suburbs are the three things that wear people down.",
      verdict: "mixed",
      agreement: "moderate",
      confidence: {
        level: "medium",
        reason:
          "A large Reddit sample from residents balanced by smaller YouTube and X ones that skew towards recent arrivals and passing moods.",
      },
      positives: [
        { title: "Food and coffee", detail: "Named as the best in the country by locals and often by people who have since moved away." },
        { title: "Something is always on", detail: "Live music, sport, festivals and galleries come up as the reason people stay." },
        { title: "Trams and walkable inner suburbs", detail: "Getting around without a car in the inner ring is a real draw for newcomers." },
      ],
      negatives: [
        { title: "Rent", detail: "The single most common complaint, and the reason most given for thinking about leaving." },
        { title: "Four seasons in a day", detail: "The weather joke is made constantly and only half in jest. Grey winters get to people." },
        { title: "The outer-suburb commute", detail: "Affordable housing means long drives or patchy trains, which sours the rest of the list." },
      ],
      sources: [
        { source: "youtube", availability: "ok", itemsAnalysed: 27 },
        { source: "x", availability: "ok", itemsAnalysed: 38 },
        { source: "reddit", availability: "ok", itemsAnalysed: 104 },
      ],
      bySource: [
        {
          source: "youtube",
          verdict: "positive",
          agreement: "moderate",
          confidence: { level: "low", reason: "A small sample of moving-to-Melbourne videos, which are made by people who chose to move there." },
          positives: [
            { title: "Food and coffee", detail: "Every arrival video has a coffee segment, and the comments agree with it." },
            { title: "Trams and the inner suburbs", detail: "Living without a car is a recurring selling point for newcomers." },
          ],
          negatives: [
            { title: "Rent", detail: "The cost of a place near the centre is the caveat in nearly every video." },
          ],
          threads: [
            t("video", "One year in Melbourne, what nobody told me"),
            t("video", "Moving to Melbourne from overseas, the honest costs"),
            t("comment", "Everything they say about the food is true. So is everything about the rent"),
          ],
        },
        {
          source: "x",
          verdict: "mixed",
          agreement: "weak",
          confidence: { level: "low", reason: "Short posts, and much of it is weather jokes, so it says more about the mood than the reasons." },
          positives: [
            { title: "Gigs and sport", detail: "Posts from a night out are the warmest in the sample." },
          ],
          negatives: [
            { title: "The weather", detail: "Four seasons in a day is posted about constantly, and not always as a joke." },
          ],
          threads: [
            t("post", "Sunburn and a soaking in the same afternoon. Melbourne"),
            t("post", "Three gigs on tonight and I cannot pick. This city"),
          ],
        },
        {
          source: "reddit",
          verdict: "mixed",
          agreement: "moderate",
          confidence: { level: "medium", reason: "A large sample of residents, with long threads that argue both sides properly." },
          positives: [
            { title: "Culture and food", detail: "Even the complaint threads concede the food, coffee and music are the best in the country." },
          ],
          negatives: [
            { title: "Rent", detail: "The most-upvoted threads about leaving all start with rent." },
            { title: "The outer-suburb commute", detail: "A seventy-minute trip from the west is discussed as ordinary, and resented." },
          ],
          threads: [
            t("thread", "Is a 70-minute commute from the west normal or have I made a mistake?"),
            t("thread", "Moved from Brisbane five years ago. Miss the sun, would never give up the coffee"),
            t("thread", "Thinking of leaving Melbourne over rent, talk me out of it"),
          ],
        },
      ],
      illustrative: true,
    },
  },
  {
    display: "vinyl records",
    aliases: ["vinyl", "records", "vinyl record", "record collecting", "collecting vinyl", "lps"],
    result: {
      subject: "vinyl records",
      sentiment: { positive: 0.68, neutral: 0.2, negative: 0.12 },
      summary:
        "Affection for vinyl centres on the ritual, the artwork and the community more than any claim about sound. The complaints are practical rather than passionate, with the price of new pressings the one thing nearly everyone grumbles about.",
      verdict: "positive",
      agreement: "moderate",
      confidence: {
        level: "medium",
        reason:
          "A strong Reddit sample from collectors and smaller YouTube and X ones, so the sample leans towards people already invested in the hobby.",
      },
      positives: [
        { title: "The ritual of listening", detail: "Choosing a record and sitting down with it is described as the point, not a chore." },
        { title: "Artwork and ownership", detail: "Large sleeves and having a physical object come up as the reason to buy something you could stream." },
        { title: "Record shops and community", detail: "Local shops and swap meets are mentioned warmly, especially by newer collectors." },
      ],
      negatives: [
        { title: "New pressings cost too much", detail: "Prices for new releases draw the most consistent complaint in the sample." },
        { title: "Quality control", detail: "Warped or noisy new records are a regular frustration, with some labels called out by name." },
      ],
      sources: [
        { source: "youtube", availability: "ok", itemsAnalysed: 33 },
        { source: "x", availability: "ok", itemsAnalysed: 26 },
        { source: "reddit", availability: "ok", itemsAnalysed: 96 },
      ],
      bySource: [
        {
          source: "youtube",
          verdict: "positive",
          agreement: "moderate",
          confidence: { level: "medium", reason: "Collection tours and setup videos, whose comments are generous but from people already in the hobby." },
          positives: [
            { title: "The ritual", detail: "Sitting down with a whole album is the thing commenters say they came to vinyl for." },
            { title: "Artwork", detail: "Sleeve close-ups draw the most comments in collection videos." },
          ],
          negatives: [
            { title: "Warped new records", detail: "Unboxing videos that end with a warped disc are a small genre of their own." },
          ],
          threads: [
            t("video", "My record collection, and why I still buy new"),
            t("comment", "Fifty dollars for a single LP that arrives warped. Love the format, hate what it has become"),
          ],
        },
        {
          source: "x",
          verdict: "positive",
          agreement: "moderate",
          confidence: { level: "medium", reason: "A steady stream of now-playing posts, which are fond by nature, with the complaints in the replies." },
          positives: [
            { title: "Now playing", detail: "A photo of a record on the turntable is the sample's most common post, and the replies are warm." },
            { title: "Record shop finds", detail: "Posts about a find at a local shop draw congratulations rather than envy." },
          ],
          negatives: [
            { title: "New pressing prices", detail: "Replies under new-release posts are where the price complaints gather." },
          ],
          threads: [
            t("post", "Sunday, coffee, side two. Nothing else planned"),
            t("post", "Found a first pressing at the local shop for less than a new reissue costs"),
            t("post", "Fifty for a single LP and it arrived warped. Again"),
          ],
        },
        {
          source: "reddit",
          verdict: "positive",
          agreement: "moderate",
          confidence: { level: "medium", reason: "A large collector community, so the sample is fond by selection but frank about the costs." },
          positives: [
            { title: "Record shops", detail: "Threads thanking a local shop, or the person behind the counter, are common." },
            { title: "Ownership", detail: "Having the object is the reason most give for buying something they could stream." },
          ],
          negatives: [
            { title: "Price of new pressings", detail: "The most consistent complaint, with specific labels named." },
            { title: "Quality control", detail: "Noisy or off-centre pressings are a running frustration." },
          ],
          threads: [
            t("thread", "It is not about it sounding better. It is about listening to a whole album for once"),
            t("thread", "Shout-out to the guy at my local shop who talked me out of a bad pressing"),
            t("thread", "New pressing prices are getting out of hand, is anyone else slowing down?"),
          ],
        },
      ],
      illustrative: true,
    },
  },
];

// Illustrative evidence for the design flow. No real quotations or URLs.
for (const entry of SAMPLES) {
  const result = entry.result;
  for (const reading of result.bySource) {
    reading.sentiment = reading.verdict === "negative"
      ? { positive: .2, neutral: .25, negative: .55 }
      : reading.verdict === "mixed" ? { positive: .38, neutral: .27, negative: .35 }
      : { positive: .65, neutral: .2, negative: .15 };
    reading.threads.forEach((thread, index) => {
      thread.id = `sample:${reading.source}:${index}`;
      thread.comments = [
        ...(reading.positives ?? []).slice(0, 2).map((theme, i) => ({ id: `${thread.id}:positive:${i}`, text: theme.detail, sentiment: "positive" as const })),
        ...(reading.negatives ?? []).slice(0, 1).map((theme, i) => ({ id: `${thread.id}:negative:${i}`, text: theme.detail, sentiment: "negative" as const })),
      ];
    });
  }
  result.opinions = [
    ...result.positives.map((theme, i) => ({ id: `positive-${i}`, sentence: theme.detail, sentiment: "positive" as const, evidenceIds: result.bySource.flatMap((source) => source.threads.slice(0, 1).map((thread) => thread.id!)) })),
    ...result.negatives.map((theme, i) => ({ id: `negative-${i}`, sentence: theme.detail, sentiment: "negative" as const, evidenceIds: result.bySource.flatMap((source) => source.threads.slice(-1).map((thread) => thread.id!)) })),
  ];
}

// Concise fictional sentences keep the keyboard demonstration readable on mobile.
const keyboard = SAMPLES.find((entry) => entry.display === "the Keychron K2");
if (keyboard) {
  keyboard.result.summary = "The Keychron K2 is widely liked for its typing feel and compact layout. The main reservations are its height, stock keycaps and Bluetooth wake-up delay.";
  const examples = [
    ["The typing feel is satisfying for the price.", "positive"],
    ["The tall case benefits from a wrist rest.", "negative"],
    ["The Mac layout feels familiar from the start.", "positive"],
    ["Bluetooth can be slow to wake up.", "negative"],
    ["The switch choice changes the sound.", "neutral"],
    ["Replaceable switches make it easy to personalise.", "positive"],
    ["The stock keycaps feel less premium than the case.", "negative"],
  ] as const;
  keyboard.result.opinions = examples.map(([sentence, sentiment], index) => ({
    id: `keyboard-opinion-${index}`, sentence, sentiment,
    evidenceIds: keyboard.result.bySource.flatMap((reading) => reading.threads.slice(0, 1).map((thread) => thread.id!)),
  }));
}
