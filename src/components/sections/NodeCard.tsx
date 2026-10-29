"use client";

import { useId, useState } from "react";
import type { JourneyNode } from "@/content/profile";
import Fill from "./Fill";

/**
 * One career node. On phones the card stays compact so the 3D figure above it stays in
 * view: bullets, metrics and projects fold behind a "More details" toggle.
 */
export default function NodeCard({ node, active }: { node: JourneyNode; active: boolean }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  return (
    <article
      className={`sheet w-full max-w-[30rem] p-4 transition-[opacity,translate] duration-700 sm:p-6 md:p-8 ${
        active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-30"
      }`}
    >
      <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-xs">
        <span className="text-cyan">{node.tag}</span>
        {node.period && <span className="text-muted">{node.period}</span>}
      </p>

      <h2 className="mt-2 text-2xl leading-tight font-extrabold [font-variation-settings:'wdth'_112] md:mt-4 md:text-4xl">
        {node.title}
      </h2>
      <p className="mt-1 text-sm text-amber md:text-base">{node.subtitle}</p>

      <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-line/85 md:mt-5 md:text-base">{node.summary}</p>

      <div id={detailsId} className={open ? "" : "hidden md:block"}>
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
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((o) => !o)}
        className="mt-3 font-mono text-xs text-cyan underline decoration-cyan/40 underline-offset-4 md:hidden"
      >
        {open ? "Less" : "More details"}
      </button>

      <ul className="mt-4 flex flex-wrap gap-1.5 md:mt-6 md:gap-2" aria-label="Skills">
        {node.skills.map((s) => (
          <li key={s} className="border border-cyan/25 px-2 py-0.5 text-xs text-cyan md:px-2.5 md:py-1">
            {s}
          </li>
        ))}
      </ul>
    </article>
  );
}
