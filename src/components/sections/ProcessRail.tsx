"use client";

import { useStore } from "@/lib/store";
import { scrollToStop } from "@/components/ScrollDriver";

const LABELS = ["Start", "Computer Science", "Web development", "Machine learning", "Avitec", "Mini-game", "Contact"];

/** Desktop-only vertical mini-diagram of the page: shows where you are, click to jump. */
export default function ProcessRail() {
  const activeStop = useStore((s) => s.activeStop);
  return (
    <nav aria-label="Sections" className="fixed top-1/2 right-6 z-40 hidden -translate-y-1/2 lg:block">
      <ol className="relative flex flex-col gap-5">
        <span aria-hidden className="absolute top-1 bottom-1 left-[5px] w-px bg-cyan/25" />
        {LABELS.map((label, i) => {
          const active = i === activeStop;
          return (
            <li key={label} className="relative">
              <button
                type="button"
                onClick={() => scrollToStop(i)}
                aria-current={active ? "step" : undefined}
                className="group flex items-center gap-3"
              >
                <span
                  className={`block size-[11px] border transition-colors ${
                    active ? "border-amber bg-amber" : "border-cyan/60 bg-bg-deep group-hover:border-cyan"
                  }`}
                />
                <span
                  className={`absolute right-6 text-xs whitespace-nowrap transition-opacity ${
                    active ? "text-line opacity-100" : "text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
