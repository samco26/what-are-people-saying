"use client";

import { SOURCES, type ConsensusResponse, type ConsensusResult, type SourceId } from "@/lib/types";
import { Logo } from "./Logo";

/* What the card shows once a search has answered: either the answer column,
   or the truthful no-live-search state for a subject the sample does not
   have. The platform evidence itself is drawn by the card, beside or beneath
   this column, so this only owns the buttons that open it. */
export function Answer({
  response,
  onPick,
  pick,
  onChoose,
  panelId,
}: {
  response: ConsensusResponse;
  onPick: (subject: string) => void;
  pick: SourceId | null;
  onChoose: (id: SourceId) => void;
  panelId: string;
}) {
  if (response.kind === "no-live-search") {
    return (
      <div className="rise">
        <span className="label">No live search yet</span>
        <p className="m-0 mt-2 text-[16px] leading-[1.55] text-ink">
          Nothing to sample for <span className="font-semibold">&ldquo;{response.subject}&rdquo;</span>.
        </p>
        <p className="m-0 mt-2 text-[14px] leading-[1.55] text-muted">{response.message}</p>
        <ul className="list-none m-0 mt-4 p-0 flex flex-wrap gap-2">
          {response.examples.map((s) => (
            <li key={s}>
              <button type="button" className="example" onClick={() => onPick(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return <Result result={response.result} pick={pick} onChoose={onChoose} panelId={panelId} />;
}

/* The default view is the short answer and, under it, the platforms the
   sentiment was extracted from. Each logo opens that platform's own
   evidence page. */
function Result({
  result,
  pick,
  onChoose,
  panelId,
}: {
  result: ConsensusResult;
  pick: SourceId | null;
  onChoose: (id: SourceId) => void;
  panelId: string;
}) {
  return (
    <div className="rise">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
        <span className="label">Illustrative sample</span>
        <span className="text-[12px] text-faint">Fictional result for design. No live search ran.</span>
      </div>

      <p className="m-0 text-[17px] sm:text-[19px] leading-[1.55] text-ink">{result.summary}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="label mr-1 w-full sm:w-auto">Sentiment extracted from</span>
        {SOURCES.map((s) => {
          const st = result.sources.find((x) => x.source === s.id);
          const off = !st || st.availability === "unavailable" || !result.bySource.some((b) => b.source === s.id);
          return (
            <button
              key={s.id}
              type="button"
              className="btn"
              aria-expanded={pick === s.id}
              aria-controls={panelId}
              disabled={off}
              title={off ? `${s.name} was unavailable for this sample` : `What ${s.name} users said`}
              onClick={() => onChoose(s.id)}
            >
              <Logo id={s.id} />
              {s.name}
              {off ? <small>Unavailable</small> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
