/* The short explanation behind "How does this work". Written for someone
   who has never seen the site. It is honest about version one: every answer
   is a labelled sample until the live sources and the analysis arrive.
   Each paragraph is a row that rises in a beat after the last. */
export function HowItWorks() {
  return (
    <div className="flex flex-col gap-4 max-w-[76ch] text-[15px] leading-[1.6] text-ink">
      <p className="mrow m-0">
        Type a subject. What People Think collects a small, bounded sample of what people
        are saying about it on YouTube, X and Reddit, reads it, and gives you one to three plain
        sentences on where opinion sits.
      </p>
      <p className="mrow m-0">
        The percentages above the bar estimate how the relevant opinions split between positive, neutral and
        negative. The three logos open each platform on its own: its verdict, what people liked
        and did not, and the threads it drew on.
      </p>
      <p className="mrow m-0">
        An answer describes the sample, not everyone. A positive result is not the same as
        strong agreement, and when the evidence is thin it says so rather than forcing a
        verdict. Video titles provide context and are not counted as opinions. YouTube reads up to
        30 top-ranked comments from each of the 10 most-viewed matching videos published in the
        last 30 days. Source coverage explains any missing comments or platforms.
      </p>
      <p className="mrow m-0 text-[13px] text-faint">
        The rotating examples mix niche interests with subjects from today’s{" "}
        <a href="https://www.bbc.com/news" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">BBC News</a>
        {" "}headlines, using Melbourne’s calendar day. If news is unavailable, evergreen examples remain.
        Suggestions are ideas to search, not a promise that enough discussion will be available.
        When live search is disconnected, only the six built-in fictional samples can return a result, clearly labelled.
      </p>
    </div>
  );
}
