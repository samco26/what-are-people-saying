"use client";
import { SOURCES, sourceName, type ConsensusResponse, type SourceId, type SourceStatus } from "@/lib/types";
import { Logo } from "./Logo";
import { SentimentBar } from "./SentimentBar";
import { Stars } from "./Stars";
import { starRating } from "@/lib/stars";
export function Coverage({ sources }: { sources: SourceStatus[] }) {
  const missing = sources.filter((source) => source.availability !== "ok");
  if (!missing.length) return null;
  return <p className="coverage-note">{missing.map((source) => `${sourceName(source.source)} ${source.availability === "unavailable" ? "is unavailable" : "has limited coverage"}`).join(". ")}.</p>;
}
/* Below this many analysed opinions the answer says the sample was thin. The
   search widens its date window while under the same number. */
const LIMITED_BELOW = 50;
export function Answer({ response, onPick, onChoose }: { response: ConsensusResponse; onPick: (subject: string) => void; onChoose: (id: SourceId) => void }) {
  if (response.kind === "subject-unresolved") return <div className="result-copy"><h2>{response.reason === "unavailable" ? "The fact-check couldn’t finish" : "Let’s narrow down the subject"}</h2><p>{response.message}</p>{response.reason === "unavailable" && <button type="button" className="text-action" onClick={() => onPick(response.subject)}>Try again</button>}</div>;
  if (response.kind === "no-live-search") return <div className="result-copy">
    <h2>No live search yet</h2><p>There is no live discussion available for “{response.subject}”. Try an illustrative example.</p>
    <div className="example-list">{response.examples.map((subject) => <button className="example ctl" key={subject} onClick={() => onPick(subject)}>{subject}</button>)}</div>
  </div>;
  if (response.kind === "insufficient") return <div className="result-copy"><h2>Not enough to go on</h2><p>The available discussion about “{response.subject}” is too limited to describe honestly.</p><Coverage sources={response.sources} /></div>;
  const result = response.result;
  const analysed = result.sources.reduce((total, status) => total + status.itemsAnalysed, 0);
  const rated = Boolean(result.category && result.category !== "general");
  const rating = starRating(result.sentiment, analysed);
  return <div className="result-copy">
    {result.illustrative && <p className="sample-label">Illustrative sample · fictional opinions</p>}
    <p className="sample-label">Showing results for {result.subject}</p>
    <p className="overall-answer">{result.summary}</p>
    <div className="source-buttons" aria-label="Explore a platform">
      {rated && <div className="rating-pill ctl" title="Sentiment score from collected opinions, not submitted star reviews. 1 = negative, 3 = balanced, 5 = positive.">
        {rating ? <><Stars value={rating.stars} /><strong>{rating.stars.toFixed(1)}<span>/5</span></strong><span className="sr-only">Sentiment score, not submitted star reviews. {Math.round(rating.approval * 100)} percent of positive or negative opinions are positive.</span></> : <span>No rating yet</span>}
      </div>}
      {SOURCES.map((source) => {
        const available = result.sources.some((status) => status.source === source.id && status.availability !== "unavailable") && result.bySource.some((reading) => reading.source === source.id);
        return <button key={source.id} type="button" className="srcbtn ctl" disabled={!available} aria-label={available ? `Explore ${source.name}` : `${source.name} unavailable`} onClick={() => onChoose(source.id)}><Logo id={source.id} size={23} /></button>;
      })}
    </div>
    {rated ? analysed < LIMITED_BELOW && <p className="coverage-note">Limited results on subject found</p> : <SentimentBar split={result.sentiment} note={analysed < LIMITED_BELOW ? "Limited results on subject found" : undefined} />}
    <Coverage sources={result.sources} />
  </div>;
}
