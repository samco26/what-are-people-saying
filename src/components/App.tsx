"use client";

import { useState } from "react";
import { CHANGELOG } from "@/lib/changelog";
import { SearchCard } from "./SearchCard";
import { Changelog } from "./Changelog";

/* The whole screen: the title, the BETA badge, the search, and the small
   print. The title is a button because DESIGN.md says it returns to the
   initial search view; bumping the key throws the search away and mounts a
   fresh one. */
export function App() {
  const [session, setSession] = useState(0);
  const [log, setLog] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          onClick={() => setSession((n) => n + 1)}
          aria-label="What People Think. Return to search."
          className="rounded-full px-3 py-2 -ml-3 text-[13px] font-semibold tracking-[-0.01em] page-ink hover:bg-[color:var(--pageSoft)] transition-colors"
        >
          What People Think
        </button>
        <div className="flex items-center gap-3">
          <a href="/privacy" className="text-[12px] font-medium page-ink opacity-70 hover:opacity-100 transition-opacity">
            Privacy
          </a>
          <button
            type="button"
            className="beta"
            onClick={() => setLog(true)}
            aria-haspopup="dialog"
            aria-expanded={log}
            title="What changed in this version"
          >
            BETA {CHANGELOG[0].v}
          </button>
        </div>
      </header>

      <main className="app-main">
        <SearchCard key={session} />
      </main>

      {log ? <Changelog onClose={() => setLog(false)} /> : null}
    </div>
  );
}
