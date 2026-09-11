import type { Config } from "tailwindcss";

/* The colours live as CSS variables in globals.css so a token can be changed
   in one place. Tailwind reads them here so utilities such as text-ink and
   bg-pane exist. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        line: "var(--line)",
        soft: "var(--soft)",
        accent: "var(--accent)",
        up: "var(--up)",
        down: "var(--down)",
        neg: "var(--neg)",
      },
      fontFamily: {
        sans: ["Helvetica", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        glass: "var(--radius)",
      },
      transitionTimingFunction: {
        house: "cubic-bezier(.2,.7,.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;
