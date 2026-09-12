"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type CSSProperties } from "react";
import { EVERGREEN_SUBJECTS, type SuggestionsResponse } from "@/lib/suggestions";
import type { ConsensusResponse, RecurringOpinion, SourceId } from "@/lib/types";
import { RotatingSubjects } from "./RotatingSubjects";
import { Answer } from "./Answer";
import { PlatformEvidence, PostList } from "./PlatformEvidence";
import { OpinionPills } from "./OpinionPills";
import { CategoryCard, isCategoryCard } from "./CategoryCard";
import { HowItWorks } from "./HowItWorks";
import { Logo } from "./Logo";

type Phase = { name: "idle" } | { name: "loading"; subject: string } | { name: "done"; subject: string; response: ConsensusResponse } | { name: "error"; subject: string };
type View = { kind: "source"; source: SourceId } | { kind: "opinion"; opinion: RecurringOpinion } | { kind: "opinions" | "how" };

export function SearchCard() {
  const [examples, setExamples] = useState(EVERGREEN_SUBJECTS);
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [reduced, setReduced] = useState(false);
  const [history, setHistory] = useState<View[]>([]);
  const [settled, setSettled] = useState(false);
  /* True once General view is pressed: the default card is shown for a
     result that would otherwise get a category card. Reset per search. */
  const [general, setGeneral] = useState(false);
  const view = history.at(-1);
  const shown = useRef(EVERGREEN_SUBJECTS[0]);
  const request = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [origin, setOrigin] = useState({ x: "50%", y: "50%" });
  const result = phase.name === "done" && phase.response.kind === "result" ? phase.response.result : null;
  const category = Boolean(result && isCategoryCard(result) && !general);
  /* The plan's suggestion for an ambiguous name is offered as ghost text
     for as long as the field still holds the searched subject. */
  const suggestion = result?.suggestion && phase.name === "done" && query === phase.subject ? result.suggestion : undefined;

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch("/api/subjects", { signal: controller.signal, cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as SuggestionsResponse;
        if (Array.isArray(data.subjects) && data.subjects.length && data.subjects.every((subject) => typeof subject === "string" && subject.length <= 80)) setExamples(data.subjects);
      } catch { /* Evergreen suggestions remain usable. */ }
    };
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15 * 60_000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); request.current?.abort(); };
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync(); mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => { if (view) panel.current?.focus({ preventScroll: true }); }, [view]);
  /* The answer card keeps its scrollbar hidden while it unfolds, otherwise the
     thin scroll track flashes as the height animates. */
  const unfolded = phase.name !== "idle";
  useEffect(() => {
    if (!unfolded) { setSettled(false); return; }
    const timer = window.setTimeout(() => setSettled(true), reduced ? 0 : 700);
    return () => window.clearTimeout(timer);
  }, [unfolded, reduced]);
  const back = useCallback(() => {
    setHistory((current) => current.slice(0, -1));
    if (history.length === 1) requestAnimationFrame(() => returnFocus.current?.focus({ preventScroll: true }));
  }, [history.length]);
  useEffect(() => {
    if (!view) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); back(); } };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [view, back]);
  /* A tap or click anywhere outside the expanded panel closes it completely. */
  const closeAll = useCallback(() => {
    setHistory([]);
    requestAnimationFrame(() => returnFocus.current?.focus({ preventScroll: true }));
  }, []);
  useEffect(() => {
    if (!view) return;
    const outside = (event: PointerEvent) => { if (panel.current && !panel.current.contains(event.target as Node)) closeAll(); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [view, closeAll]);

  const open = (next: View) => {
    if (!view) {
      const trigger = document.activeElement as HTMLElement;
      returnFocus.current = trigger;
      const bounds = scene.current?.getBoundingClientRect(), button = trigger.getBoundingClientRect();
      if (bounds) setOrigin({ x: `${button.x + button.width / 2 - bounds.x}px`, y: `${button.y + button.height / 2 - bounds.y}px` });
    }
    setHistory((current) => [...current, next]);
  };
  /* categoryHint travels with a subject accepted from a did-you-mean
     suggestion, so the answer lands on the card that reading deserves. */
  const search = async (subject: string, categoryHint?: string) => {
    const value = subject.trim();
    if (!value || phase.name === "loading") return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setQuery(value); setHistory([]); setGeneral(false); setPhase({ name: "loading", subject: value });
    try {
      const response = await fetch("/api/consensus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: value, ...(categoryHint ? { categoryHint } : {}) }), signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json() as ConsensusResponse;
      if (!controller.signal.aborted) setPhase({ name: "done", subject: value, response: data });
    } catch {
      if (!controller.signal.aborted) setPhase({ name: "error", subject: value });
    }
  };
  const onShow = useCallback((subject: string) => { shown.current = subject; }, []);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void search(query || shown.current); };
  /* Tab accepts the did-you-mean suggestion, as in a search engine. */
  const onKey = (event: ReactKeyboardEvent<HTMLInputElement>) => { if (event.key === "Tab" && suggestion) { event.preventDefault(); void search(suggestion, result?.suggestionCategory); } };
  const edit = () => { setHistory([]); requestAnimationFrame(() => { input.current?.focus(); input.current?.select(); }); };
  const source = view?.kind === "source" ? result?.bySource.find((reading) => reading.source === view.source) : undefined;
  const opinions = result?.opinions ?? [];

  return <div className="search-scene" ref={scene} style={{ "--panel-x": origin.x, "--panel-y": origin.y } as CSSProperties}>
    <div className="search-home" hidden={Boolean(view)} data-result={Boolean(result)}>
      <div className={category ? "search-stack wide" : "search-stack"}>
        <h1>Find the popular opinion on</h1>
        <section className="glass main-card" aria-label="Search and overall opinion">
          <form className="field ctl" role="search" onSubmit={submit}>
            <input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKey} aria-label="Subject" maxLength={200} autoComplete="off" enterKeyHint="search" />
            {!query && <span className="ghost"><RotatingSubjects subjects={examples} paused={reduced || phase.name !== "idle"} onShow={onShow} /></span>}
            {suggestion && <span className="ghost ghost-suggest" aria-hidden="true"><span className="ghost-mirror">{query}</span><button type="button" tabIndex={-1} className="ghost-accept" onClick={() => void search(suggestion, result?.suggestionCategory)}>did you mean {suggestion}?</button><kbd>Tab</kbd></span>}
            <button type="submit" className="go" aria-label="Search" disabled={phase.name === "loading"}><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 16V4m-5 5 5-5 5 5" /></svg></button>
          </form>
          <div className="result-unfold" data-open={unfolded} data-settled={settled}><div>
            {phase.name === "loading" && <div className="loading-state"><div className="liquid-track" role="progressbar" aria-label="Searching discussion" aria-valuetext="Searching"><span /><span /></div><p>Finding what people think…</p></div>}
            {phase.name === "error" && <div className="result-copy"><h2>Something interrupted the search.</h2><p>Please try again.</p><button type="button" className="text-action" onClick={() => void search(phase.subject)}>Try again</button></div>}
            {phase.name === "done" && (category && result
              ? <CategoryCard result={result} onChoose={(id) => open({ kind: "source", source: id })} onOpinion={(opinion) => open({ kind: "opinion", opinion })} onGeneral={() => setGeneral(true)} />
              : <Answer response={phase.response} onPick={(subject) => void search(subject)} onChoose={(id) => open({ kind: "source", source: id })} />)}
          </div></div>
        </section>
        <div className="under-card"><button className="text-action" onClick={() => open({ kind: "how" })}>How it works</button></div>
      </div>
      {result && !category && <OpinionPills opinions={opinions} onSelect={(opinion) => open({ kind: "opinion", opinion })} onMore={() => open({ kind: "opinions" })} />}
    </div>
    {view && <section className="glass evidence-screen" ref={panel} tabIndex={-1} aria-label={view.kind === "source" ? `${view.source} evidence` : "Supporting details"}>
      <div className="evidence-nav"><button type="button" className="back-button" onClick={back}><span aria-hidden="true">←</span> Back</button><button className="subject-chip ctl" onClick={edit} aria-label={`Edit subject ${query || "search"}`}><span>{result?.subject || query || "Search"}</span><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 13 9-9 3 3-9 9-4 1 1-4ZM11 6l3 3" /></svg></button></div>
      <div className="evidence-scroll" key={view.kind === "source" ? view.source : view.kind === "opinion" ? view.opinion.id : view.kind}>
        {source && <PlatformEvidence analysis={source} />}
        {view.kind === "opinions" && <><h2>Recurring opinions</h2><div className="all-opinions">{opinions.map((opinion) => <button key={opinion.id} className={`opinion-pill opinion-${opinion.sentiment}`} onClick={() => open({ kind: "opinion", opinion })} aria-label={`${opinion.sentiment}: ${opinion.sentence}`}>{opinion.sentence}</button>)}</div>{!opinions.length && <p className="quiet">There is not enough repeated evidence to identify distinct recurring opinions.</p>}</>}
        {view.kind === "opinion" && <><h2 className="opinion-heading">{view.opinion.sentence}</h2>{result?.bySource.map((reading) => {
          const threads = reading.threads.filter((thread) => thread.id && view.opinion.evidenceIds.includes(thread.id));
          return threads.length ? <section key={reading.source} className="opinion-evidence" aria-label={reading.source}><Logo id={reading.source} size={24} /><PostList threads={threads} source={reading.source} /></section> : null;
        })}</>}
        {view.kind === "how" && <><h2>How it works</h2><HowItWorks /></>}
      </div>
      {result?.illustrative && <p className="evidence-footer">Illustrative sample. Posts and comments are fictional.</p>}
    </section>}
    {suggestion && <span className="sr-only" role="status">Did you mean {suggestion}? Press Tab to search it.</span>}
    <span className="sr-only" role="status" aria-live="polite">{phase.name === "loading" ? "Searching discussion." : phase.name === "done" ? "Search complete." : phase.name === "error" ? "Search failed. Please try again." : ""}</span>
  </div>;
}
