"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/* A layout effect in the browser, a plain effect on the server, where a
   layout effect has nothing to lay out and React says so. */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* A segmented control whose highlight slides to the chosen stop rather than
   redrawing. The highlight is measured in a layout effect because the stops
   are not the same width and the chosen one changes weight, so it has to be
   measured after layout and before paint. The first placement is never
   animated, keyed on the thumb node, so a control that is torn down and
   rebuilt places fresh instead of sliding in from nowhere. */

export interface PillStop<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
}

export function Pill<T extends string>({
  label,
  stops,
  value,
  onChange,
}: {
  label: string;
  stops: ReadonlyArray<PillStop<T>>;
  value: T;
  onChange: (id: T) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const seen = useRef<HTMLSpanElement | null>(null);

  useIsoLayoutEffect(() => {
    const t = track.current;
    const th = thumb.current;
    if (!t || !th) return;
    const put = () => {
      const el = t.querySelector<HTMLElement>('[data-on="1"]');
      if (!el) {
        th.style.opacity = "0";
        return;
      }
      th.style.opacity = "1";
      th.style.width = `${el.offsetWidth}px`;
      th.style.height = `${el.offsetHeight}px`;
      th.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
    };
    if (seen.current === th) {
      put();
    } else {
      seen.current = th;
      const keep = th.style.transition;
      th.style.transition = "none";
      put();
      void th.offsetWidth;
      th.style.transition = keep;
    }
    /* The control can change size without a render: the window resizes, or
       the panel holding it grows from a pill to full width. Both re-measure. */
    window.addEventListener("resize", put);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(put) : null;
    if (ro) ro.observe(t);
    return () => {
      window.removeEventListener("resize", put);
      if (ro) ro.disconnect();
    };
  });

  return (
    <div ref={track} role="radiogroup" aria-label={label} className="pill ctl">
      <span ref={thumb} aria-hidden="true" className="pill-thumb" />
      {stops.map((s) => {
        const on = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={on}
            data-on={on ? "1" : undefined}
            disabled={s.disabled}
            onClick={() => onChange(s.id)}
            className="pill-stop"
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
