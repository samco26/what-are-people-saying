"use client";
import { SOURCES, sourceName, type ConsensusResponse, type SourceId, type SourceStatus } from "@/lib/types";
import { Logo } from "./Logo";
import { SentimentBar } from "./SentimentBar";
export function Coverage({ sources }: { sources: SourceStatus[] }) {
  const missing = sources.filter((source) => source.availability !== "ok");
  if (!missing.length) return null;
  return <p className="coverage-note">{missing.map((source) => `${sourceName(source.source)} ${source.availability === "unavailable" ? "is unavailable" : "has limited coverage"}`).join(". ")}.</p>;
}
/* Below this many analysed opinions the answer says the sample was thin. The
   search widens its date window while under the same number. */
const LIMITED_BELOW = 50;
export function Answer({ response, onPick, onChoose }: { response: ConsensusResponse; onPick: (subject: string) => void; onChoose: (id: SourceId) => void }) {
  if (response.kind === "no-live-search") return <div className="result-copy">
    <h2>No live search yet</h2><p>There is no live discussion available for “{response.subject}”. Try an illustrative example.</p>
    <div className="example-list">{response.examples.map((subject) => <button className="example ctl" key={subject} onClick={() => onPick(subject)}>{subject}</button>)}</div>
  </div>;
  /* Too little on the subject: the same shape as an answer, with a plain
     sentence in the answer's place, the platform buttons greyed and the bar
     empty, so a thin result never looks like a verdict. */
  if (response.kind === "insufficient") return <div className="result-copy">
    <p className="overall-answer">Not enough people are talking about “{response.subject}” to say what they think.</p>
    <p className="quiet">{response.message}</p>
    <Coverage sources={response.sources} />
    <div className="source-buttons" aria-label="Explore a platform">
      {SOURCES.map((source) => <button key={source.id} type="button" className="srcbtn ctl" disabled aria-label={`${source.name} has nothing to show`}><Logo id={source.id} size={23} /></button>)}
    </div>
    <SentimentBar />
  </div>;
  const result = response.result;
  const analysed = result.sources.reduce((total, status) => total + (status.relevant ?? status.itemsAnalysed), 0);
  return <div className="result-copy">
    {result.illustrative && <p className="sample-label">Illustrative sample · fictional opinions</p>}
    <p className="overall-answer">{result.summary}</p>
    <div className="source-buttons" aria-label="Explore a platform">
      {SOURCES.map((source) => {
        const available = result.sources.some((status) => status.source === source.id && status.availability !== "unavailable") && result.bySource.some((reading) => reading.source === source.id);
        return <button key={source.id} type="button" className="srcbtn ctl" disabled={!available} aria-label={available ? `Explore ${source.name}` : `${source.name} unavailable`} onClick={() => onChoose(source.id)}><Logo id={source.id} size={23} /></button>;
      })}
    </div>
    <SentimentBar split={result.sentiment} note={analysed < LIMITED_BELOW ? "Limited results on subject found" : undefined} />
  </div>;
}
