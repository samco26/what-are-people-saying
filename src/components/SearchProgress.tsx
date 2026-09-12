"use client";

import { useEffect, useState } from "react";
import { SOURCES, type SourceId } from "@/lib/types";

export function SearchProgress() {
  const [sources, setSources] = useState<SourceId[]>([]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/consensus", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json() as { sources?: unknown };
        const available = data.sources;
        if (Array.isArray(available) && !controller.signal.aborted) {
          setSources(SOURCES.filter(({ id }) => available.includes(id)).map(({ id }) => id));
        }
      }).catch(() => { /* General loading messages work without capability flags. */ });
    const timer = window.setInterval(() => setStep((current) => current + 1), 3600);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);

  // Rotating placeholders, not a claim of precise progress through server stages.
  const messages = [
    "Finding what people think…",
    ...SOURCES.filter(({ id }) => sources.includes(id)).map(({ name }) => `Finding what people think on ${name}…`),
    "Reading through the discussion…",
    "Looking for shared opinions…",
    "Bringing the answer together…",
  ];

  return <div className="loading-state">
    <div className="liquid-track" role="progressbar" aria-label="Searching discussion" aria-valuetext="Searching"><span /><span /></div>
    <p className="loading-message" aria-hidden="true"><span key={step}>{messages[step % messages.length]}</span></p>
  </div>;
}
