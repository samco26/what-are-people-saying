"use client";
import { SOURCES, type ConsensusResult, type SourceId } from "@/lib/types";
import { Logo } from "./Logo";

/* The three platform logo buttons on a category card. A platform that
   returned nothing is shown greyed and cannot be opened, as on the default
   card. Platforms carry no rating of their own; the card's one rating sits
   beside this row and the buttons stretch to its height (CSS .rating-strip). */
export function PlatformStack({ result, onChoose }: { result: ConsensusResult; onChoose: (id: SourceId) => void }) {
  return (
    <div className="pstack" aria-label="Explore a platform">
      {SOURCES.map((source) => {
        const reading = result.bySource.find((entry) => entry.source === source.id);
        const status = result.sources.find((entry) => entry.source === source.id);
        const available = Boolean(reading) && status?.availability !== "unavailable";
        return (
          <button type="button" key={source.id} className="srcbtn ctl" disabled={!available} onClick={() => onChoose(source.id)} aria-label={available ? `Explore ${source.name}` : `${source.name} unavailable`}>
            <Logo id={source.id} size={24} />
          </button>
        );
      })}
    </div>
  );
}
