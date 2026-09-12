"use client";
import { SOURCES, type ConsensusResult, type SourceId } from "@/lib/types";
import { starRating } from "@/lib/stars";
import { Logo } from "./Logo";
import { Stars } from "./Stars";

/* Each platform's logo button with that platform's own star rating beside
   it, from its share of the classification. A platform that returned
   nothing is shown greyed and cannot be opened, as on the default card.
   A column on desktop; a row of three on phones (CSS). */
export function PlatformStack({ result, onChoose, fill }: { result: ConsensusResult; onChoose: (id: SourceId) => void; fill?: boolean }) {
  return (
    <div className={fill ? "pstack pstack-fill" : "pstack"} aria-label="Explore a platform">
      {SOURCES.map((source) => {
        const reading = result.bySource.find((entry) => entry.source === source.id);
        const status = result.sources.find((entry) => entry.source === source.id);
        const available = Boolean(reading) && status?.availability !== "unavailable";
        const count = status?.itemsAnalysed ?? 0;
        const rating = reading?.sentiment ? starRating(reading.sentiment, count) : undefined;
        return (
          <div className="prow" key={source.id}>
            <button type="button" className="srcbtn srcbtn-sm ctl" disabled={!available} onClick={() => onChoose(source.id)}
              aria-label={available ? `Explore ${source.name}${rating ? `, ${rating.stars.toFixed(1)} stars` : ""}` : `${source.name} unavailable`}>
              <Logo id={source.id} size={20} />
            </button>
            {rating ? <><b>{rating.stars.toFixed(1)}</b><Stars value={rating.stars} size="xs" /></> : <span className="prow-none">no opinions</span>}
          </div>
        );
      })}
    </div>
  );
}
