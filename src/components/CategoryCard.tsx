"use client";
import { useEffect, useState, type ReactNode } from "react";
import type { Category, ConsensusResult, RecurringOpinion, SourceId } from "@/lib/types";
import { starRating } from "@/lib/stars";
import { PlatformStack } from "./PlatformStack";
import { SentimentBar } from "./SentimentBar";
import { Stars } from "./Stars";

/* The category cards: the same answer, laid out the way the site people
   would normally check for that kind of thing lays it out. A film reads
   like Letterboxd, a product like Amazon, a place like Google Maps, an app
   like the App Store. Every card keeps everything the default card has
   (summary, platform buttons, sentiment bar, recurring opinions) and adds
   a star rating worked out from the sentiment split (src/lib/stars.ts).

   On phones all four share one column: rating, summary, the opinions in a
   box that scrolls in place, each platform's rating, the bar. The page
   itself never scrolls. General view, desktop only, returns to the default
   card for the same subject. */

const LIMITED_BELOW = 50;

interface CardProps {
  result: ConsensusResult;
  onChoose: (id: SourceId) => void;
  onOpinion: (opinion: RecurringOpinion) => void;
  onGeneral: () => void;
}

function usePhone(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    const sync = () => setPhone(mq.matches);
    sync(); mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return phone;
}

const analysedCount = (result: ConsensusResult) => result.sources.reduce((total, status) => total + status.itemsAnalysed, 0);
const supportOf = (opinion: RecurringOpinion) => opinion.support ?? opinion.evidenceIds.length;
const opinionStars = (opinion: RecurringOpinion) => opinion.sentiment === "positive" ? 4.5 : opinion.sentiment === "negative" ? 2 : 3;

function GeneralView({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="general ctl" onClick={onClick} aria-label="Back to the general view">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5 7 10l5 5" /></svg>
      General view
    </button>
  );
}

function RatingTile({ result, poster }: { result: ConsensusResult; poster?: boolean }) {
  const count = analysedCount(result);
  const rating = starRating(result.sentiment, count);
  return (
    <div className={`tile ${poster ? "tile-poster" : "tile-place"} ctl`} role="img" aria-label={`The internet says ${rating.stars.toFixed(1)} out of 5, ${Math.round(rating.approval * 100)}% positive from ${count} opinions`}>
      <span className="label">The internet says</span>
      <span className="score score-xl">{rating.stars.toFixed(1)}</span>
      <Stars value={rating.stars} size="lg" />
      <span className="approval">{Math.round(rating.approval * 100)}% positive<br />{count} opinions</span>
    </div>
  );
}

/* The opinion elements, in the shape each card uses. */
function FilmRows({ opinions, onOpinion, limit }: { opinions: RecurringOpinion[]; onOpinion: CardProps["onOpinion"]; limit?: number }) {
  return <>{opinions.slice(0, limit).map((opinion) => (
    <button type="button" key={opinion.id} className={`opinion-pill opinion-${opinion.sentiment} rev`} onClick={() => onOpinion(opinion)} aria-label={`${opinion.sentiment}: ${opinion.sentence} ${supportOf(opinion)} posts. Explore supporting posts.`}>
      <span>{opinion.sentence}</span>
      <span className="revmeta" aria-hidden="true"><Stars value={opinionStars(opinion)} size="xs" /><span>{supportOf(opinion)} posts</span></span>
    </button>
  ))}</>;
}
function Chips({ opinions, onOpinion, marks }: { opinions: RecurringOpinion[]; onOpinion: CardProps["onOpinion"]; marks?: boolean }) {
  return <>{opinions.map((opinion) => (
    <button type="button" key={opinion.id} className={`opinion-pill opinion-${opinion.sentiment} chip`} onClick={() => onOpinion(opinion)} aria-label={`${opinion.sentiment}: ${opinion.sentence} ${supportOf(opinion)} posts. Explore supporting posts.`}>
      {marks && <span className="mark" aria-hidden="true">{opinion.sentiment === "positive" ? "✓" : opinion.sentiment === "negative" ? "✕" : "–"}</span>}
      {opinion.sentence}
      <span className="n" aria-hidden="true">{supportOf(opinion)}</span>
    </button>
  ))}</>;
}
function Cards({ opinions, onOpinion }: { opinions: RecurringOpinion[]; onOpinion: CardProps["onOpinion"] }) {
  return <>{opinions.map((opinion) => (
    <button type="button" key={opinion.id} className={`opinion-pill opinion-${opinion.sentiment} card`} onClick={() => onOpinion(opinion)} aria-label={`${opinion.sentiment}: ${opinion.sentence} ${supportOf(opinion)} posts. Explore supporting posts.`}>
      <span className="ttl" aria-hidden="true"><span>{supportOf(opinion)} posts</span><Stars value={opinionStars(opinion)} size="xs" /></span>
      {opinion.sentence}
    </button>
  ))}</>;
}

function Foot({ result }: { result: ConsensusResult }) {
  return <div className="foot"><SentimentBar split={result.sentiment} note={analysedCount(result) < LIMITED_BELOW ? "Limited results on subject found" : undefined} /></div>;
}
function Sample({ result }: { result: ConsensusResult }) {
  return result.illustrative ? <p className="sample-label">Illustrative sample · fictional opinions</p> : null;
}

/* One column, shared by every category on phones. */
function PhoneCard({ result, onChoose, opinions, box }: { result: ConsensusResult; onChoose: CardProps["onChoose"]; opinions: ReactNode; box: "list" | "chips" | "cards" }) {
  const count = analysedCount(result);
  const rating = starRating(result.sentiment, count);
  return (
    <div className="result-copy pbody">
      <Sample result={result} />
      <div className="tile ctl" role="img" aria-label={`The internet says ${rating.stars.toFixed(1)} out of 5, ${Math.round(rating.approval * 100)}% positive from ${count} opinions`}>
        <span className="score score-md">{rating.stars.toFixed(1)}</span>
        <Stars value={rating.stars} />
        <span className="approval">{Math.round(rating.approval * 100)}% positive<br />{count} opinions</span>
      </div>
      <p className="answer-small">{result.summary}</p>
      <div className="opn"><span className="label">Common opinions</span><div className={`opbox opbox-${box}`}>{opinions}</div></div>
      <PlatformStack result={result} onChoose={onChoose} />
      <Foot result={result} />
    </div>
  );
}

function FilmCard({ result, onChoose, onOpinion, onGeneral }: CardProps) {
  const opinions = result.opinions ?? [];
  return (
    <div className="result-copy ccard">
      <Sample result={result} />
      <div className="two">
        <div className="side"><RatingTile result={result} poster /><PlatformStack result={result} onChoose={onChoose} fill /></div>
        <div>
          <div className="eyebrow"><span>{result.kind}</span><GeneralView onClick={onGeneral} /></div>
          <h2 className="ctitle">{result.subject}</h2>
          <p className="answer-small">{result.summary}</p>
          <div className="csection"><span className="label">Common opinions</span><div className="list"><FilmRows opinions={opinions} onOpinion={onOpinion} /></div></div>
        </div>
      </div>
      <Foot result={result} />
    </div>
  );
}

function ProductCard({ result, onChoose, onOpinion, onGeneral }: CardProps) {
  const count = analysedCount(result);
  const rating = starRating(result.sentiment, count);
  return (
    <div className="result-copy ccard">
      <Sample result={result} />
      <div className="eyebrow"><span>{result.kind}</span><GeneralView onClick={onGeneral} /></div>
      <h2 className="ctitle">{result.subject}</h2>
      <div className="rating-row"><span className="score score-sm">{rating.stars.toFixed(1)}</span><Stars value={rating.stars} /><span className="dot">·</span><span>{count} opinions</span><span className="dot">·</span><span>{Math.round(rating.approval * 100)}% positive</span></div>
      <span className="label">People say</span>
      <p className="answer-small">{result.summary}</p>
      <div className="cols">
        <div><span className="label">By platform</span><PlatformStack result={result} onChoose={onChoose} /></div>
        <div><span className="label">Common opinions</span><div className="chips"><Chips opinions={result.opinions ?? []} onOpinion={onOpinion} marks /></div></div>
      </div>
      <Foot result={result} />
    </div>
  );
}

function PlaceCard({ result, onChoose, onOpinion, onGeneral }: CardProps) {
  return (
    <div className="result-copy ccard">
      <Sample result={result} />
      <div className="grid2">
        <RatingTile result={result} />
        <div>
          <div className="eyebrow"><span>{result.kind}</span><GeneralView onClick={onGeneral} /></div>
          <h2 className="ctitle">{result.subject}</h2>
          <p className="answer-small">{result.summary}</p>
        </div>
        <PlatformStack result={result} onChoose={onChoose} />
        <div><span className="label">Common opinions</span><div className="chips"><Chips opinions={result.opinions ?? []} onOpinion={onOpinion} /></div></div>
      </div>
      <Foot result={result} />
    </div>
  );
}

function AppCard({ result, onChoose, onOpinion, onGeneral }: CardProps) {
  const count = analysedCount(result);
  const rating = starRating(result.sentiment, count);
  return (
    <div className="result-copy ccard">
      <Sample result={result} />
      <div className="apphead">
        <div className="appicon" aria-hidden="true">{result.subject.replace(/^the\s+/i, "").charAt(0).toUpperCase()}</div>
        <div><h2 className="ctitle">{result.subject}</h2><div className="sub">{result.kind}</div><Stars value={rating.stars} /></div>
        <GeneralView onClick={onGeneral} />
      </div>
      <p className="answer-small">{result.summary}</p>
      <div className="two">
        <div className="side">

          <div className="tile score-tile ctl" role="img" aria-label={`${rating.stars.toFixed(1)} out of 5 from ${count} opinions, ${Math.round(rating.approval * 100)}% positive`}>
            <span className="score score-md">{rating.stars.toFixed(1)}<span className="den">/5</span></span>
            <Stars value={rating.stars} />
            <span className="approval">{count} opinions · {Math.round(rating.approval * 100)}% positive</span>
          </div>
          <PlatformStack result={result} onChoose={onChoose} />
        </div>
        <div className="cards"><Cards opinions={result.opinions ?? []} onOpinion={onOpinion} /></div>
      </div>
      <Foot result={result} />
    </div>
  );
}

export function isCategoryCard(result: ConsensusResult): result is ConsensusResult & { category: Exclude<Category, "general"> } {
  return Boolean(result.category) && result.category !== "general";
}

export function CategoryCard(props: CardProps) {
  const phone = usePhone();
  const { result, onChoose, onOpinion } = props;
  const opinions = result.opinions ?? [];
  if (phone) {
    switch (result.category) {
      case "film": return <PhoneCard result={result} onChoose={onChoose} box="list" opinions={<FilmRows opinions={opinions} onOpinion={onOpinion} />} />;
      case "product": return <PhoneCard result={result} onChoose={onChoose} box="chips" opinions={<Chips opinions={opinions} onOpinion={onOpinion} marks />} />;
      case "place": return <PhoneCard result={result} onChoose={onChoose} box="chips" opinions={<Chips opinions={opinions} onOpinion={onOpinion} />} />;
      default: return <PhoneCard result={result} onChoose={onChoose} box="cards" opinions={<Cards opinions={opinions} onOpinion={onOpinion} />} />;
    }
  }
  switch (result.category) {
    case "film": return <FilmCard {...props} />;
    case "product": return <ProductCard {...props} />;
    case "place": return <PlaceCard {...props} />;
    default: return <AppCard {...props} />;
  }
}
