import type { JourneyNode } from "@/content/profile";
import Fill from "./Fill";

export default function NodeCard({ node, active }: { node: JourneyNode; active: boolean }) {
  return (
    <article
      className={`sheet w-full max-w-[30rem] p-6 transition-[opacity,translate] duration-700 md:p-8 ${
        active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-30"
      }`}
    >
      <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-xs">
        <span className="text-cyan">{node.tag}</span>
        {node.period && <span className="text-muted">{node.period}</span>}
      </p>

      <h2 className="mt-4 text-3xl leading-tight font-extrabold [font-variation-settings:'wdth'_112] md:text-4xl">
        {node.title}
      </h2>
      <p className="mt-1 text-amber">{node.subtitle}</p>

      <p className="mt-5 max-w-[60ch] leading-relaxed text-line/85">{node.summary}</p>

      <ul className="mt-5 space-y-2 text-sm text-line/80">
        {node.bullets.map((b) => (
          <li key={b} className="flex gap-3">
            <span aria-hidden className="mt-[0.45em] size-1.5 shrink-0 bg-cyan" />
            <Fill text={b} />
          </li>
        ))}
      </ul>

      {node.metrics && (
        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-cyan/15 pt-5">
          {node.metrics.map((m) => (
            <div key={m.label}>
              <dt className="text-xs text-muted">{m.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-amber">
                <Fill text={m.value} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {node.projects && (
        <ul className="mt-6 space-y-3 border-t border-cyan/15 pt-5 text-sm">
          {node.projects.map((p) => (
            <li key={p.name}>
              {p.url ? (
                <a href={p.url} target="_blank" rel="noreferrer" className="font-semibold text-line hover:text-cyan">
                  {p.name}
                </a>
              ) : (
                <Fill text={p.name} className="font-semibold" />
              )}
              <p className="text-line/70">{p.description}</p>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-6 flex flex-wrap gap-2" aria-label="Skills">
        {node.skills.map((s) => (
          <li key={s} className="border border-cyan/25 px-2.5 py-1 text-xs text-cyan">
            {s}
          </li>
        ))}
      </ul>
    </article>
  );
}
