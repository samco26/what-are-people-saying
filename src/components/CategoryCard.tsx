"use client";
import { useEffect, useState, type ReactNode } from "react";
import type { Category, ConsensusResult, RecurringOpinion, SourceId } from "@/lib/types";
import { starRating } from "@/lib/stars";
import { PlatformStack } from "./PlatformStack";
import { SentimentBar } from "./SentimentBar";
import { Stars } from "./Stars";

/* The category cards: the same answer with a star rating worked out from
   the sentiment split (src/lib/stars.ts). Every card keeps everything the
   default card has (summary, platform buttons, sentiment bar, recurring
   opinions). What differs by category is the head (an app gets its icon,
   the rest a kind line and title) and the shape of the opinions: a film
   lists them as review rows, a product as tick-and-cross chips, a place as
   chips, an app as review cards.

   The rating strip is the same on every card: a compact tile on the left
   and the three platform buttons beside it, stretched to the tile's height
   so the row reads as one line. Platforms carry no rating of their own.

   On phones all four share one column: summary, the opinions in a box that
   scrolls in place, the rating strip, the bar. The page itself never
   scrolls. General view, desktop only, returns to the default card for the
   same subject. */

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

/* Opinions the analysis found to be about the subject; a sample carries
   no classification, so its analysed total stands in. */
const analysedCount = (result: ConsensusResult) => result.sources.reduce((total, status) => total + (status.relevant ?? status.itemsAnalysed), 0);
const supportOf = (opinion: RecurringOpinion) => opinion.support ?? opinion.evidenceIds.length;

function GeneralView({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="general ctl" onClick={onClick} aria-label="Back to the general view">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5 7 10l5 5" /></svg>
      General view
    </button>
  );
}

/* The rating tile and the platform buttons on one line, the buttons
   stretched to the tile's height (CSS .rating-strip). */
function RatingStrip({ result, onChoose }: { result: ConsensusResult; onChoose: CardProps["onChoose"] }) {
  const count = analysedCount(result);
  const rating = starRating(result.sentiment, count);
  return (
    <div className="rating-strip">
      <div className="tile tile-strip ctl" role="img" aria-label={`The internet says ${rating.stars.toFixed(1)} out of 5, ${Math.round(rating.approval * 100)}% positive from ${count} opinions`}>
        <span className="score score-md">{rating.stars.toFixed(1)}</span>
        <span className="tile-meta"><Stars value={rating.stars} /><span className="approval">{Math.round(rating.approval * 100)}% positive · {count} opinions</span></span>
      </div>
      <PlatformStack result={result} onChoose={onChoose} />
    </div>
  );
}

/* The opinion elements, in the shape each card uses. The colour carries the
   sentiment; there are no marks or stars beside the sentence, only the
   number of posts behind it. */
function FilmRows({ opinions, onOpinion, limit }: { opinions: RecurringOpinion[]; onOpinion: CardProps["onOpinion"]; limit?: number }) {
  return <>{opinions.slice(0, limit).map((opinion) => (
    <button type="button" key={opinion.id} className={`opinion-pill opinion-${opinion.sentiment} rev`} onClick={() => onOpinion(opinion)} aria-label={`${opinion.sentiment}: ${opinion.sentence} ${supportOf(opinion)} posts. Explore supporting posts.`}>
      <span>{opinion.sentence}</span>
      <span className="revmeta" aria-hidden="true">{supportOf(opinion)} posts</span>
    </button>
  ))}</>;
}
function Chips({ opinions, onOpinion }: { opinions: RecurringOpinion[]; onOpinion: CardProps["onOpinion"] }) {
  return <>{opinions.map((opinion) => (
    <button type="button" key={opinion.id} className={`opinion-pill opinion-${opinion.sentiment} chip`} onClick={() => onOpinion(opinion)} aria-label={`${opinion.sentiment}: ${opinion.sentence} ${supportOf(opinion)} posts. Explore supporting posts.`}>
      {opinion.sentence}
      <span className="n" aria-hidden="true">{supportOf(opinion)}</span>
    </button>
  ))}</>;
}
function Cards({ opinions, onOpinion }: { opinions: RecurringOpinion[]; onOpinion: CardProps["onOpinion"] }) {
  return <>{opinions.map((opinion) => (
    <button type="button" key={opinion.id} className={`opinion-pill opinion-${opinion.sentiment} card`} onClick={() => onOpinion(opinion)} aria-label={`${opinion.sentiment}: ${opinion.sentence} ${supportOf(opinion)} posts. Explore supporting posts.`}>
      <span className="ttl" aria-hidden="true">{supportOf(opinion)} posts</span>
      {opinion.sentence}
    </button>
  ))}</>;
}

function Foot({ result }: { result: ConsensusResult }) {
  return <div className="foot"><SentimentBar split={result.sentiment} note={analysedCount(result) < LIMITED_BELOW ? "Limited results on subject found" : undefined} /></div>;
}
function Sample({ result }: { result: ConsensusResult }) {
  return <>{result.illustrative && <p className="sample-label">Illustrative sample · fictional opinions</p>}{result.context && <p className="sample-label">Showing results for {result.subject}</p>}</>;
}

/* One column, shared by every category on phones: summary, the opinions in
   a box that scrolls in place, then the rating strip fixed beneath it, and
   the bar. */
function PhoneCard({ result, onChoose, opinions, box }: { result: ConsensusResult; onChoose: CardProps["onChoose"]; opinions: ReactNode; box: "list" | "chips" | "cards" }) {
  return (
    <div className="result-copy pbody">
      <Sample result={result} />
      <p className="answer-small">{result.summary}</p>
      <div className="opn"><span className="label">Common opinions</span><div className={`opbox opbox-${box}`}>{opinions}</div></div>
      <RatingStrip result={result} onChoose={onChoose} />
      <Foot result={result} />
    </div>
  );
}

/* The desktop skeleton every category shares: head, rating strip, summary,
   opinions, bar. An app's head is its icon, name, kind and stars; the rest
   get the kind line and the title. */
function DesktopCard({ result, onChoose, onGeneral, opinions, box, label }: CardProps & { opinions: ReactNode; box: "list" | "chips" | "cards"; label?: string }) {
  const app = result.category === "app";
  const rating = app ? starRating(result.sentiment, analysedCount(result)) : undefined;
  return (
    <div className="result-copy ccard">
      <Sample result={result} />
      {app && rating
        ? <div className="apphead">
            <div className="appicon" aria-hidden="true">{result.subject.replace(/^the\s+/i, "").charAt(0).toUpperCase()}</div>
            <div><h2 className="ctitle">{result.subject}</h2><div className="sub">{result.kind}</div><Stars value={rating.stars} /></div>
            <GeneralView onClick={onGeneral} />
          </div>
        : <>
            <div className="eyebrow"><span>{result.kind}</span><GeneralView onClick={onGeneral} /></div>
            <h2 className="ctitle">{result.subject}</h2>
          </>}
      <RatingStrip result={result} onChoose={onChoose} />
      {label && <span className="label">{label}</span>}
      <p className="answer-small">{result.summary}</p>
      <div className="csection"><span className="label">Common opinions</span><div className={box}>{opinions}</div></div>
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
  const shape = ((): { box: "list" | "chips" | "cards"; opinions: ReactNode; label?: string } => {
    switch (result.category) {
      case "film": return { box: "list", opinions: <FilmRows opinions={opinions} onOpinion={onOpinion} /> };
      case "product": return { box: "chips", opinions: <Chips opinions={opinions} onOpinion={onOpinion} />, label: "People say" };
      case "place": return { box: "chips", opinions: <Chips opinions={opinions} onOpinion={onOpinion} /> };
      default: return { box: "cards", opinions: <Cards opinions={opinions} onOpinion={onOpinion} /> };
    }
  })();
  if (phone) return <PhoneCard result={result} onChoose={onChoose} box={shape.box} opinions={shape.opinions} />;
  return <DesktopCard {...props} box={shape.box} opinions={shape.opinions} label={shape.label} />;
}
