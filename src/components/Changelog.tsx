"use client";

import { useEffect, useRef } from "react";
import { CHANGELOG } from "@/lib/changelog";

/* The list behind the BETA badge. Escape or a click on the scrim closes it,
   focus lands on the close button when it opens, and the dot beside each
   line says what kind of change it was. */
export function Changelog({ onClose }: { onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="scrim"
      onPointerDown={(e) => {
        if (box.current && !box.current.contains(e.target as Node)) onClose();
      }}
    >
      <div ref={box} role="dialog" aria-modal="true" aria-label="What changed" className="pane pane-small dialog">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="beta" aria-hidden="true">BETA {CHANGELOG[0].v}</span>
            <span className="text-[13px] font-semibold">What changed</span>
          </div>
          <button type="button" className="btn btn-quiet btn-small" onClick={onClose} autoFocus>
            Close
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {CHANGELOG.map((entry) => (
            <section key={entry.v} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-3">
                <span className="text-[14px] font-semibold">BETA {entry.v}</span>
                <span className="text-[12px] text-faint">{entry.date}</span>
              </div>
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {entry.items.map(([kind, text], i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-[1.5] text-ink">
                    <span className={`dot dot-${kind}`} aria-hidden="true" />
                    <span>
                      <span className="sr-only">{kind}: </span>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-5 pt-4 border-t border-line text-[11px] text-faint">
          <span className="inline-flex items-center gap-2"><span className="dot dot-new !mt-0" aria-hidden="true" />New</span>
          <span className="inline-flex items-center gap-2"><span className="dot dot-changed !mt-0" aria-hidden="true" />Changed</span>
          <span className="inline-flex items-center gap-2"><span className="dot dot-removed !mt-0" aria-hidden="true" />Removed</span>
        </div>
      </div>
    </div>
  );
}
