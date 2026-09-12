"use client";
import { SOURCES, sourceName, type ConsensusResponse, type SourceId, type SourceStatus } from "@/lib/types";
import { Logo } from "./Logo";
export function Coverage({ sources }: { sources: SourceStatus[] }) {
  const missing = sources.filter((source) => source.availability !== "ok");
  if (!missing.length) return null;
  return <p className="coverage-note">{missing.map((source) => `${sourceName(source.source)} ${source.availability === "unavailable" ? "is unavailable" : "has limited coverage"}`).join(". ")}.</p>;
}
export function Answer({ response, onPick, onChoose }: { response: ConsensusResponse; onPick: (subject: string) => void; onChoose: (id: SourceId) => void }) {
  if (response.kind === "no-live-search") return <div className="result-copy">
    <h2>No live search yet</h2><p>There is no live discussion available for “{response.subject}”. Try an illustrative example.</p>
    <div className="example-list">{response.examples.map((subject) => <button className="example ctl" key={subject} onClick={() => onPick(subject)}>{subject}</button>)}</div>
  </div>;
  if (response.kind === "insufficient") return <div className="result-copy"><h2>Not enough to go on</h2><p>The available discussion about “{response.subject}” is too limited to describe honestly.</p><Coverage sources={response.sources} /></div>;
  const result = response.result;
  return <div className="result-copy">
    {result.illustrative && <p className="sample-label">Illustrative sample · fictional opinions</p>}
    <p className="overall-answer">{result.summary}</p>
    <div className="source-buttons" aria-label="Explore a platform">
      {SOURCES.map((source) => {
        const available = result.sources.some((status) => status.source === source.id && status.availability !== "unavailable") && result.bySource.some((reading) => reading.source === source.id);
        return <button key={source.id} type="button" className="srcbtn ctl" disabled={!available} aria-label={available ? `Explore ${source.name}` : `${source.name} unavailable`} onClick={() => onChoose(source.id)}><Logo id={source.id} size={23} /></button>;
      })}
    </div>
    <Coverage sources={result.sources} />
  </div>;
}
