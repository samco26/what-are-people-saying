import type { SubjectContext } from "@/lib/types";

export function SubjectFacts({ context }: { context: SubjectContext }) {
  return <section aria-label="Subject facts">
    <h3>{context.name}</h3>
    {[context.description, ...context.facts].map((claim, index) => <p className="quiet" key={index}>
      {claim.text}{" "}{claim.refs.map((ref) => {
        const source = context.sources[ref];
        return source ? <a key={ref} href={source.url} target="_blank" rel="noopener noreferrer" className="text-action" aria-label={`Source: ${source.title}`}>[{ref + 1}]</a> : null;
      })}
    </p>)}
    <p className="quiet">Web facts checked {context.checkedAt.slice(0, 10)}. Opinions come from the collected platform discussion.</p>
  </section>;
}
