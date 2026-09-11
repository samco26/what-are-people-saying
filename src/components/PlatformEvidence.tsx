import { sourceName, type SourceAnalysis, type SourceStatus, type Theme } from "@/lib/types";
import { AGREEMENT_TEXT, CONFIDENCE_TEXT, VERDICT_TEXT } from "@/lib/labels";
import { Logo } from "./Logo";

/* One platform's own evidence, kept simple: its verdict on one line, a
   line of confidence, what people liked and did not as plain lists, and
   the titles it drew on. In the prototype the titles are fictional and
   one line says so; nothing is linked. */
export function PlatformEvidence({ analysis, status }: { analysis: SourceAnalysis; status: SourceStatus }) {
  const name = sourceName(analysis.source);

  return (
    <div className="inset p-4 sm:p-5 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Logo id={analysis.source} size={22} />
          {name}
        </span>
        <span className={`verdict verdict-${analysis.verdict}`}>{VERDICT_TEXT[analysis.verdict]}</span>
        <span className="text-[13px] text-muted">
          {AGREEMENT_TEXT[analysis.agreement]}, {status.itemsAnalysed} items
        </span>
      </div>

      <p className="m-0 text-[13px] leading-[1.55] text-muted">
        <span className="font-semibold text-ink capitalize">{CONFIDENCE_TEXT[analysis.confidence.level]} confidence.</span>{" "}
        {analysis.confidence.reason}
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Themes label="Liked" items={analysis.positives} colour="var(--sentPos)" />
        <Themes label="Did not like" items={analysis.negatives} colour="var(--sentNeg)" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="label">Drawn from</span>
        <ul className="list-none m-0 p-0 flex flex-col">
          {analysis.threads.map((th, i) => (
            <li key={i} className="thread">
              {th.title}
            </li>
          ))}
        </ul>
        <p className="m-0 text-[12px] leading-[1.5] text-faint">
          Fictional titles for this prototype, so nothing is linked. Live results will link to the real thread.
        </p>
      </div>
    </div>
  );
}

/* Titles only. Where the platform's sample supported fewer than three, the
   list is simply shorter. */
function Themes({ label, items, colour }: { label: string; items: Theme[]; colour: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label">{label}</span>
      {items.length > 0 ? (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {items.map((t) => (
            <li key={t.title} className="flex gap-3 text-[14px] leading-[1.45] text-ink">
              <span aria-hidden="true" className="mt-[7px] w-[7px] h-[7px] rounded-full flex-none" style={{ background: colour }} />
              <span>{t.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[13px] text-faint">Nothing that the sample supported.</p>
      )}
    </div>
  );
}
