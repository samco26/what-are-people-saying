import type { SentimentSplit } from "@/lib/types";
import { sentimentPercentages } from "@/lib/sentiment";
export function SentimentBar({ split }: { split?: SentimentSplit }) {
  const values = sentimentPercentages(split ?? { positive: 0, neutral: 0, negative: 0 });
  if (values.every((value) => value === 0)) return <p className="quiet">No reliable sentiment breakdown is available.</p>;
  return <div className="sentiment" role="img" aria-label={`Estimated sentiment: ${values[0]}% positive, ${values[1]}% neutral, ${values[2]}% negative`}>
    <div className="sentbar" aria-hidden="true">{values.map((value, i) => <span key={i} className={["sent-pos", "sent-neu", "sent-neg"][i]} style={{ flex: `0 0 ${value}%` }} />)}</div>
    <div className="sent-legend" aria-hidden="true"><span>Positive</span><span>Neutral</span><span>Negative</span></div>
  </div>;
}
