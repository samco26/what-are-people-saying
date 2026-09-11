"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { EXAMPLE_SUBJECTS } from "@/lib/subjects";
import { DEFAULT_REFINEMENTS, type ConsensusResponse, type Refinements, type SourceId } from "@/lib/types";
import { RotatingSubjects } from "./RotatingSubjects";
import { Answer } from "./Answer";
import { PlatformEvidence } from "./PlatformEvidence";
import { GetSpecific } from "./GetSpecific";

/* The heading, the one glass card, and the flow inside it: idle, then a
   brief processing state, then the answer. The field stays where it is at
   the top. The card unfolds downward for the answer, and when a platform's
   evidence is opened it grows outward to both sides and the evidence takes
   the column beside the answer; on a narrow screen it stacks beneath. The
   example subjects rotate inside the empty field, and Get Specific sits
   under the card as a pill that grows into its own panel. */

type Phase =
  | { name: "idle" }
  | { name: "loading"; subject: string }
  | { name: "done"; subject: string; response: ConsensusResponse }
  | { name: "error"; subject: string; message: string };

/* The processing state is shown for at least this long so it reads as a
   step rather than a flicker. The sample answers instantly, so this is the
   whole wait. */
const MIN_WAIT_MS = 1100;

export function SearchCard() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [reduced, setReduced] = useState(false);
  const [refine, setRefine] = useState<Refinements>(DEFAULT_REFINEMENTS);
  const [specific, setSpecific] = useState(false);
  const [pick, setPick] = useState<SourceId | null>(null);
  /* The last platform shown stays rendered while its column closes. */
  const [last, setLast] = useState<SourceId | null>(null);
  const shown = useRef("");
  const run = useRef(0);
  const answerId = useId();
  const specificId = useId();
  const panelId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const search = useCallback(async (subject: string) => {
    const s = subject.trim();
    if (!s) return;
    const id = ++run.current;
    setQuery(s);
    setPick(null);
    setLast(null);
    setPhase({ name: "loading", subject: s });
    const started = Date.now();

    let next: Phase;
    try {
      const res = await fetch("/api/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: s }),
      });
      if (!res.ok) throw new Error(`The server answered with status ${res.status}.`);
      const response = (await res.json()) as ConsensusResponse;
      next = { name: "done", subject: s, response };
    } catch (err) {
      next = {
        name: "error",
        subject: s,
        message: err instanceof Error ? err.message : "Something went wrong.",
      };
    }

    const wait = MIN_WAIT_MS - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    /* A newer search has started in the meantime: drop this one. */
    if (id !== run.current) return;
    setPhase(next);
  }, []);

  const onShow = useCallback((s: string) => {
    shown.current = s;
  }, []);

  /* An empty box searches the example it is showing. */
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void search(query.trim() || shown.current);
  };

  const choose = (id: SourceId) => {
    setPick((cur) => (cur === id ? null : id));
    setLast(id);
  };

  const open = phase.name !== "idle";
  const result = phase.name === "done" && phase.response.kind === "result" ? phase.response.result : null;
  const view = pick ?? last;
  const analysis = result && view ? result.bySource.find((b) => b.source === view) : undefined;
  const status = result && view ? result.sources.find((s) => s.source === view) : undefined;
  const wide = Boolean(pick && result);

  return (
    <div>
      <div className="mx-auto w-full max-w-[720px]">
        <h1 className="m-0 mb-5 sm:mb-6 text-[clamp(24px,4.8vw,36px)] font-normal tracking-[-0.02em] leading-tight page-muted">
          See what people think about
          <span className="sr-only">, for example {EXAMPLE_SUBJECTS.join(", ")}</span>
        </h1>
      </div>

      <section className="pane card p-3 sm:p-4" data-wide={wide ? "1" : undefined} aria-label="Search">
        <div className="card-top">
          <form onSubmit={onSubmit} role="search" className="field">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Subject"
              aria-controls={answerId}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              maxLength={200}
            />
            {query === "" ? (
              <span className="ghost">
                <RotatingSubjects subjects={EXAMPLE_SUBJECTS} paused={reduced || open} onShow={onShow} />
              </span>
            ) : null}
            <button type="submit" className="go" disabled={phase.name === "loading"} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          </form>
        </div>

        <div className="unfold" data-open={open ? "1" : undefined} id={answerId} aria-live="polite">
          <div>
            <div className="px-2 pt-8 pb-3 sm:px-3">
              {phase.name === "loading" ? <Loading subject={phase.subject} /> : null}
              {phase.name === "error" ? <ErrorNote subject={phase.subject} message={phase.message} /> : null}
              {phase.name === "done" ? (
                <div className="answer">
                  <Answer
                    key={phase.subject}
                    response={phase.response}
                    onPick={(s) => void search(s)}
                    pick={pick}
                    onChoose={choose}
                    panelId={panelId}
                  />
                  {result ? (
                    <div className="unfold" data-open={pick ? "1" : undefined} id={panelId}>
                      <div>
                        <div>
                          {analysis && status ? (
                            <div key={view ?? ""} className="swap">
                              <PlatformEvidence analysis={analysis} status={status} />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[720px] mt-3">
        <div className="pane morph" data-open={specific ? "1" : undefined}>
          <button
            type="button"
            className="morph-head"
            aria-expanded={specific}
            aria-controls={specificId}
            onClick={() => setSpecific((v) => !v)}
          >
            Get Specific
            <svg className="chev" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1.5 3.5L5 7l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="unfold" data-open={specific ? "1" : undefined} id={specificId}>
            <div>
              <div className="morph-body">
                <GetSpecific result={result} value={refine} onChange={setRefine} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Loading({ subject }: { subject: string }) {
  return (
    <div className="flex items-center gap-3 text-[15px] text-muted">
      <span className="dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        Reading a sample of what people say about <span className="text-ink">{subject}</span>
      </span>
    </div>
  );
}

function ErrorNote({ subject, message }: { subject: string; message: string }) {
  return (
    <div className="rise">
      <span className="label">Could not search</span>
      <p className="m-0 mt-2 text-[15px] leading-[1.55] text-ink">
        The search for <span className="font-semibold">{subject}</span> did not complete.
      </p>
      <p className="m-0 mt-1 text-[13px] leading-[1.5] text-muted">{message}</p>
    </div>
  );
}
