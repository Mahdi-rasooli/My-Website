"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/useEnvironment";

const LINE = "initializing process: mahdi_rasouli.exe";
const SHOW_MS = 1100;
const FADE_MS = 450;

/** A short boot overlay that covers the 3D scene while it loads. Click to skip. */
export default function Boot() {
  const setBooted = useStore((s) => s.setBooted);
  const reducedMotion = useReducedMotion();
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setBooted();
      return;
    }
    const fade = window.setTimeout(() => setFading(true), SHOW_MS);
    return () => window.clearTimeout(fade);
  }, [reducedMotion, setBooted]);

  useEffect(() => {
    if (!fading) return;
    const done = window.setTimeout(() => {
      setGone(true);
      setBooted();
    }, FADE_MS);
    return () => window.clearTimeout(done);
  }, [fading, setBooted]);

  if (gone || reducedMotion) return null;

  return (
    <div
      aria-hidden
      onClick={() => setFading(true)}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg-deep transition-opacity duration-450 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-[min(90vw,26rem)] font-mono text-xs text-cyan">
        <p className="boot-type overflow-hidden whitespace-nowrap" style={{ ["--chars" as string]: LINE.length }}>
          {LINE}
        </p>
        <div className="mt-4 flex items-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-1 items-center last:flex-none">
              <span className="boot-node size-2.5 border border-cyan" style={{ animationDelay: `${180 + i * 170}ms` }} />
              {i < 4 && <span className="boot-wire h-px flex-1 bg-cyan/70" style={{ animationDelay: `${260 + i * 170}ms` }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
