import type { CSSProperties } from "react";
import type { RecurringOpinion } from "@/lib/types";
export function OpinionPills({ opinions, onSelect, onMore }: { opinions: RecurringOpinion[]; onSelect: (opinion: RecurringOpinion) => void; onMore: () => void }) {
  return <div className="opinion-cloud" aria-label="Recurring opinions">
    {opinions.slice(0, 6).map((opinion, index) => <button key={opinion.id} type="button" className={`opinion-pill opinion-${opinion.sentiment}`} style={{ "--pill-order": index } as CSSProperties} onClick={() => onSelect(opinion)} aria-label={`${opinion.sentiment}: ${opinion.sentence} Explore supporting posts.`}>{opinion.sentence}</button>)}
    {opinions.length > 3 && <button className={`text-action more-opinions ${opinions.length <= 6 ? "mobile-only" : ""}`} type="button" onClick={onMore}>Show more opinions</button>}
  </div>;
}
