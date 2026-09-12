import type { CSSProperties } from "react";
import type { RecurringOpinion } from "@/lib/types";
/* Every recurring opinion is rendered. Desktop positions the first six
   around the answer and keeps the rest behind "Show more opinions"; phones
   list them all under the answer in a box that scrolls on its own. The frame
   only exists on phones, where it carries the fade at the bottom of the
   scrolling list; on desktop it is display:contents. */
export function OpinionPills({ opinions, onSelect, onMore }: { opinions: RecurringOpinion[]; onSelect: (opinion: RecurringOpinion) => void; onMore: () => void }) {
  return <div className="opinion-frame"><div className="opinion-cloud" aria-label="Recurring opinions">
    {opinions.map((opinion, index) => <button key={opinion.id} type="button" className={`opinion-pill opinion-${opinion.sentiment}`} style={{ "--pill-order": Math.min(index, 8) } as CSSProperties} onClick={() => onSelect(opinion)} aria-label={`${opinion.sentiment}: ${opinion.sentence} Explore supporting posts.`}>{opinion.sentence}</button>)}
    {opinions.length > 6 && <button className="text-action more-opinions" type="button" onClick={onMore}>Show more opinions</button>}
  </div></div>;
}
