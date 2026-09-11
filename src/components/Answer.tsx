"use client";

import {
  SOURCES,
  sourceName,
  type ConsensusResponse,
  type ConsensusResult,
  type SentimentSplit,
  type SourceId,
} from "@/lib/types";
import { Logo } from "./Logo";
import { sentimentPercentages } from "@/lib/sentiment";

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
              <button type="button" className="example ctl" onClick={() => onPick(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (response.kind === "insufficient") {
    return (
      <div className="rise">
        <span className="label">Not enough to go on</span>
        <p className="m-0 mt-2 text-[16px] leading-[1.55] text-ink">
          The live search for <span className="font-semibold">&ldquo;{response.subject}&rdquo;</span> did not
          find enough to describe.
        </p>
        <p className="m-0 mt-2 text-[14px] leading-[1.55] text-muted">{response.message}</p>
        <ul className="list-none m-0 mt-4 p-0 flex flex-col gap-1.5">
          {response.sources.map((s) => (
            <li key={s.source} className="text-[13px] text-muted">
              <span className="font-semibold text-ink">{sourceName(s.source)}:</span>{" "}
              {s.availability === "unavailable"
                ? `unavailable. ${s.note ?? ""}`
                : `${s.itemsAnalysed} opinion${s.itemsAnalysed === 1 ? "" : "s"}${s.note ? `. ${s.note}` : ""}`}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return <Result result={response.result} pick={pick} onChoose={onChoose} panelId={panelId} />;
}

/* The default view is the short answer. Under it, bottom left, the sentiment
   bar; bottom right, the platforms the sentiment was extracted from, as
   logos alone. Each logo opens that platform's own evidence page. */
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
        {result.illustrative ? (
          <>
            <span className="label">Illustrative sample</span>
            <span className="text-[12px] text-faint">Fictional result for design. No live search ran.</span>
          </>
        ) : (
          <span className="text-[12px] text-faint">
            {result.sources.reduce((n, s) => n + s.itemsAnalysed, 0)} opinions read
            {result.window ? ` from the last ${result.window.months} month${result.window.months === 1 ? "" : "s"}` : ""}
          </span>
        )}
      </div>

      <p className="m-0 text-[17px] sm:text-[19px] leading-[1.55] text-ink">{result.summary}</p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex flex-col items-start gap-2">
          <span className="label">Overall opinion</span>
          <SentimentBar split={result.sentiment} />
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <span className="label">Sentiment extracted from</span>
          <div className="flex gap-2">
            {SOURCES.map((s) => {
              const st = result.sources.find((x) => x.source === s.id);
              const off = !st || st.availability === "unavailable" || !result.bySource.some((b) => b.source === s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className="srcbtn ctl"
                  aria-label={off ? `${s.name}, unavailable for this sample` : `What ${s.name} users said`}
                  aria-expanded={pick === s.id}
                  aria-controls={panelId}
                  disabled={off}
                  title={st?.note ? `${s.name}: ${st.note}` : off ? `${s.name} was unavailable for this sample` : s.name}
                  onClick={() => onChoose(s.id)}
                >
                  <Logo id={s.id} size={20} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {!result.illustrative && result.sources.some((source) => source.note || source.availability !== "ok") && (
        <details className="mt-4 text-[12px] leading-[1.5] text-muted">
          <summary className="cursor-pointer">Source coverage</summary>
          <ul className="m-0 mt-2 pl-4">
            {result.sources.filter((source) => source.note || source.availability !== "ok").map((source) => (
              <li key={source.source}>{sourceName(source.source)}: {source.note ?? source.availability}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/* Percentages are estimates of the collected opinions, not population polling. */
function SentimentBar({ split }: { split: SentimentSplit }) {
  const percentages = sentimentPercentages(split);
  if (percentages.every((percentage) => percentage === 0)) {
    return <span className="text-[12px] text-muted">No reliable opinion split available.</span>;
  }
  const labels = ["Positive", "Neutral", "Negative"];
  const classes = ["sent-pos", "sent-neu", "sent-neg"];
  return (
    <div className="sentiment" role="img" aria-label={`Estimated sentiment among relevant opinions read: ${percentages[0]}% positive, ${percentages[1]}% neutral, ${percentages[2]}% negative`}>
      <div className="sent-labels" aria-hidden="true">
        {labels.map((label, index) => (
          <span key={label}>
            <span className={`sent-key ${classes[index]}`} />
            <strong>{percentages[index]}%</strong>
            <span className="sent-label-name">{label}</span>
          </span>
        ))}
      </div>
      <div className="sentbar" aria-hidden="true">
        {classes.map((className, index) => <span key={className} className={className} style={{ flex: `0 0 ${percentages[index]}%` }} />)}
      </div>
    </div>
  );
}
