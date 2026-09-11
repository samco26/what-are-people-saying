"use client";

import { useEffect, useState, type CSSProperties } from "react";

/* One subject on screen at a time, each arriving from below and leaving
   upward. The element is keyed on the index so the animation restarts for
   every new subject. Paused, the current one simply stands.

   onShow reports which subject is standing, so an empty search box can be
   submitted to search the example it is showing. */

const SWEEP_MS = 2600;

export function RotatingSubjects({
  subjects,
  paused,
  onShow,
}: {
  subjects: string[];
  paused: boolean;
  onShow?: (subject: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const rotating = !paused && subjects.length > 1;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(
      () => setIndex((n) => (n + 1) % subjects.length),
      SWEEP_MS,
    );
    return () => window.clearInterval(timer);
  }, [rotating, subjects.length]);

  const text = subjects[index] ?? "";

  useEffect(() => {
    if (onShow) onShow(text);
  }, [text, onShow]);

  const style = { "--sweepMs": `${SWEEP_MS}ms` } as CSSProperties;

  return (
    <span className="sweepbox" aria-hidden="true">
      <span key={index} className={rotating ? "sweep" : "sweep sweep-still"} style={style}>
        {text}
      </span>
    </span>
  );
}
