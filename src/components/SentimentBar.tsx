import type { SentimentSplit } from "@/lib/types";
import { sentimentPercentages } from "@/lib/sentiment";
/* The three-colour bar. An optional note sits small at its top right; the
   answer card uses it to say when the sample behind the bar was thin.
   With no split at all (nothing on topic was found) the bar is drawn
   plain grey, so the answer keeps its shape. compact drops the legend:
   the answer card draws the bar on one line with the platform buttons,
   where the colours speak for themselves; the platform view keeps it. */
export function SentimentBar({ split, note, compact }: { split?: SentimentSplit; note?: string; compact?: boolean }) {
  const values = sentimentPercentages(split ?? { positive: 0, neutral: 0, negative: 0 });
  const empty = values.every((value) => value === 0);
  const classes = ["sentiment", empty ? "sentiment-empty" : "", compact ? "sentiment-compact" : ""].filter(Boolean).join(" ");
  return <div className={classes} role="img" aria-label={empty ? "No sentiment breakdown: not enough on-topic discussion was found." : `Estimated sentiment: ${values[0]}% positive, ${values[1]}% neutral, ${values[2]}% negative.${note ? ` ${note}.` : ""}`}>
    {note && !empty && <p className="sent-note" aria-hidden="true">{note}</p>}
    <div className="sentbar" aria-hidden="true">{!empty && values.map((value, i) => <span key={i} className={["sent-pos", "sent-neu", "sent-neg"][i]} style={{ flex: `0 0 ${value}%` }} />)}</div>
    {!compact && <div className="sent-legend" aria-hidden="true"><span>Positive</span><span>Neutral</span><span>Negative</span></div>}
  </div>;
}
