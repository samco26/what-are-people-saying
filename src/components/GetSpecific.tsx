"use client";

import type { ReactNode } from "react";
import {
  AGES,
  GENDERS,
  PERIODS,
  REGIONS,
  SOURCES,
  type ConsensusResult,
  type Refinements,
  type SourceId,
} from "@/lib/types";
import { Logo } from "./Logo";
import { Pill } from "./Pill";

/* The refinements behind Get Specific: platforms, a time period with a
   custom date range, and demographics as three rows of chips that can be
   combined. Click a chip to select it, click again to clear it. It sits
   under the search card and can be set before a search. In version one it
   previews a selection and says so. Once the sources are live, a change
   here will collect and analyse again.

   Every change is written as an update on the previous value, so two quick
   taps never overwrite each other.

   `result` is null before a search. A platform is only marked unavailable
   once a result has said so. */
export function GetSpecific({
  result,
  value,
  onChange,
}: {
  result: ConsensusResult | null;
  value: Refinements;
  onChange: (update: (prev: Refinements) => Refinements) => void;
}) {
  const availability = (id: SourceId) =>
    result ? (result.sources.find((s) => s.source === id)?.availability ?? "unavailable") : "ok";

  const togglePlatform = (id: SourceId) =>
    onChange((v) => {
      const has = v.platforms.includes(id);
      /* At least one platform stays selected; there is nothing to sample
         from none. */
      if (has && v.platforms.length === 1) return v;
      return { ...v, platforms: has ? v.platforms.filter((p) => p !== id) : [...v.platforms, id] };
    });

  function toggleIn<T extends string>(list: T[], id: T): T[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  const chosen = SOURCES.filter(
    (s) => value.platforms.includes(s.id) && availability(s.id) !== "unavailable",
  ).map((s) => s.name);

  return (
    <div className="flex flex-col gap-5">
      <div className="mrow grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-8">
      <Row label="Platforms">
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => {
            const a = availability(s.id);
            const off = a === "unavailable";
            const on = !off && value.platforms.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                className="chip ctl"
                aria-pressed={on}
                disabled={off}
                title={off ? `${s.name} is unavailable for this sample` : undefined}
                onClick={() => togglePlatform(s.id)}
              >
                <Logo id={s.id} size={20} />
                {s.name}
                {off ? <small>Unavailable</small> : null}
              </button>
            );
          })}
        </div>
      </Row>

      <Row label="Time period">
        <Pill
          label="Time period"
          stops={PERIODS}
          value={value.period}
          onChange={(period) => onChange((v) => ({ ...v, period }))}
        />
        <div className="unfold" data-open={value.period === "custom" ? "1" : undefined}>
          <div>
            <div className="px-1 pt-3 pb-1 flex flex-wrap gap-3">
              <label className="datefield">
                <span className="text-[12px] text-muted">From</span>
                <input
                  type="date"
                  value={value.from}
                  max={value.to || undefined}
                  onChange={(e) => {
                    const from = e.target.value;
                    onChange((v) => ({ ...v, from }));
                  }}
                />
              </label>
              <label className="datefield">
                <span className="text-[12px] text-muted">To</span>
                <input
                  type="date"
                  value={value.to}
                  min={value.from || undefined}
                  onChange={(e) => {
                    const to = e.target.value;
                    onChange((v) => ({ ...v, to }));
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </Row>
      </div>

      <Row label="Demographics" className="mrow">
        <div className="flex flex-col gap-3">
          <Group label="Age">
            {AGES.map((a) => (
              <button
                key={a.id}
                type="button"
                className="chip ctl"
                aria-pressed={value.ages.includes(a.id)}
                onClick={() => onChange((v) => ({ ...v, ages: toggleIn(v.ages, a.id) }))}
              >
                {a.label}
              </button>
            ))}
          </Group>
          <Group label="Gender">
            {GENDERS.map((g) => (
              <button
                key={g.id}
                type="button"
                className="chip ctl"
                aria-pressed={value.genders.includes(g.id)}
                onClick={() => onChange((v) => ({ ...v, genders: toggleIn(v.genders, g.id) }))}
              >
                {g.label}
              </button>
            ))}
          </Group>
          <Group label="Region">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                className="chip ctl"
                aria-pressed={value.regions.includes(r.id)}
                aria-label={r.label}
                title={r.label}
                onClick={() => onChange((v) => ({ ...v, regions: toggleIn(v.regions, r.id) }))}
              >
                {r.code}
                <small>{r.label}</small>
              </button>
            ))}
          </Group>
        </div>
      </Row>

      <p className="mrow m-0 text-[12px] leading-[1.55] text-faint">
        Selected: {listNames(chosen)}, {periodText(value)}, {demographicText(value)}. Platforms and
        the time period shape what a live search collects. The six example subjects are fixed
        samples and ignore them. Demographics are recorded but not yet applied, because no
        platform supplies that data.
      </p>
    </div>
  );
}

function Row({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 min-w-0${className ? ` ${className}` : ""}`}>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={label}>
      <span className="text-[12px] text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function listNames(names: string[]): string {
  if (names.length === 0) return "no platforms";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function periodText(v: Refinements): string {
  if (v.period !== "custom") return (PERIODS.find((p) => p.id === v.period)?.label ?? "").toLowerCase();
  if (v.from && v.to) return `${niceDate(v.from)} to ${niceDate(v.to)}`;
  if (v.from) return `from ${niceDate(v.from)}`;
  if (v.to) return `up to ${niceDate(v.to)}`;
  return "a custom range, not yet set";
}

function demographicText(v: Refinements): string {
  const parts: string[] = [];
  if (v.ages.length) parts.push(`ages ${v.ages.map((a) => AGES.find((x) => x.id === a)?.label ?? a).join(", ")}`);
  if (v.genders.length) parts.push(v.genders.map((g) => GENDERS.find((x) => x.id === g)?.label.toLowerCase() ?? g).join(", "));
  if (v.regions.length) parts.push(v.regions.map((r) => REGIONS.find((x) => x.id === r)?.label ?? r).join(", "));
  return parts.length ? parts.join(", ") : "everyone";
}

function niceDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}
