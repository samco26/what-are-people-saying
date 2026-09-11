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
        The bar under the answer shows how the sample split between positive, neutral and
        negative. The three logos open each platform on its own: its verdict, what people liked
        and did not, and the threads it drew on.
      </p>
      <p className="mrow m-0">
        An answer describes the sample, not everyone. A positive result is not the same as
        strong agreement, and when the evidence is thin it says so rather than forcing a
        verdict. Nothing collected is kept.
      </p>
      <p className="mrow m-0 text-[13px] text-faint">
        This is version one. The six example subjects answer from fictional samples written for
        design, and are labelled as such. Live sources and analysis switch on as their keys
        arrive.
      </p>
    </div>
  );
}
