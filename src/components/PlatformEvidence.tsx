import type { ReactNode } from "react";
import {
  sourceName,
  type SourceAnalysis,
  type SourceAvailability,
  type SourceStatus,
  type Theme,
} from "@/lib/types";
import { AGREEMENT_TEXT, CONFIDENCE_TEXT, VERDICT_TEXT } from "@/lib/labels";
import { Logo } from "./Logo";

/* One platform's own evidence page: its verdict and agreement, how many of
   its items were read, why the confidence is what it is, its positives and
   negatives, and the threads, videos or posts it drew on. In the prototype
   the threads are fictional titles and say so; nothing is linked. */

const AVAILABILITY: Record<SourceAvailability, string> = {
  ok: "available",
  partial: "partly sampled",
  unavailable: "unavailable",
};

const KIND: Record<string, string> = {
  video: "Video",
  comment: "Comment",
  post: "Post",
  reply: "Reply",
  thread: "Thread",
};

export function PlatformEvidence({ analysis, status }: { analysis: SourceAnalysis; status: SourceStatus }) {
  const name = sourceName(analysis.source);

  return (
    <div className="inset p-4 sm:p-5 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Logo id={analysis.source} size={22} />
          {name}
        </span>
        <span className={`verdict verdict-${analysis.verdict}`}>{VERDICT_TEXT[analysis.verdict]}</span>
        <span className="text-[13px] text-muted">{AGREEMENT_TEXT[analysis.agreement]}</span>
        <span className="text-[13px] text-faint sm:ml-auto tabular-nums">
          {status.itemsAnalysed} items analysed, {AVAILABILITY[status.availability]}
        </span>
      </div>

      <Block label="Confidence">
        <p className="m-0 text-[14px] leading-[1.55] text-ink">
          <span className="font-semibold capitalize">{CONFIDENCE_TEXT[analysis.confidence.level]}.</span>{" "}
          {analysis.confidence.reason}
        </p>
      </Block>

      <div className="grid gap-6 sm:grid-cols-2">
        <Themes label="Positives" singular="positive" items={analysis.positives} colour="var(--up)" />
        <Themes label="Negatives" singular="negative" items={analysis.negatives} colour="var(--neg)" />
      </div>

      <Block label={`What ${name} users were reading`}>
        <p className="m-0 text-[12px] leading-[1.55] text-faint">
          Fictional titles written for this prototype, so nothing here is linked. Live results will
          link each one to the real thread.
        </p>
        <ul className="list-none m-0 p-0 flex flex-col">
          {analysis.threads.map((th, i) => (
            <li key={i} className="thread">
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-faint w-[72px] flex-none pt-[3px]">
                {KIND[th.kind] ?? th.kind}
              </span>
              <span>
                {th.title}
                {th.fictional ? <span className="text-[11px] text-faint"> (fictional)</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

/* Up to three themes. When the platform's sample supports fewer, it says so
   rather than filling the slots. */
function Themes({
  label,
  singular,
  items,
  colour,
}: {
  label: string;
  singular: string;
  items: Theme[];
  colour: string;
}) {
  return (
    <Block label={label}>
      {items.length > 0 ? (
        <ul className="list-none m-0 p-0 flex flex-col gap-3">
          {items.map((t) => (
            <li key={t.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-[7px] w-[7px] h-[7px] rounded-full flex-none"
                style={{ background: colour }}
              />
              <span>
                <span className="block text-[14px] font-semibold text-ink">{t.title}</span>
                <span className="block text-[13px] leading-[1.5] text-muted">{t.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {items.length < 3 ? (
        <p className="m-0 text-[12px] leading-[1.55] text-faint">{shortfall(items.length, singular)}</p>
      ) : null}
    </Block>
  );
}

function shortfall(count: number, singular: string): string {
  if (count === 0) return `No ${singular}s were supported by this platform's sample.`;
  if (count === 1) return `Only one ${singular} was supported by this platform's sample.`;
  return `Only two ${singular}s were supported by this platform's sample.`;
}
