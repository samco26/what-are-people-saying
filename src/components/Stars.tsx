import type { CSSProperties } from "react";

/* Five stars filled to a fraction. The fill is a gradient clipped to the
   glyphs, so 4.2 shows as four stars and a fifth of the fifth. */
export function Stars({ value, size = "md" }: { value: number; size?: "xs" | "md" | "lg" }) {
  const fill = `${Math.max(0, Math.min(5, value)) / 5 * 100}%`;
  return (
    <span className={`stars stars-${size}`} style={{ "--fill": fill } as CSSProperties} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      ★★★★★
    </span>
  );
}
