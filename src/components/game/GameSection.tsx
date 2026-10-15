"use client";

import dynamic from "next/dynamic";
import { profile } from "@/content/profile";

const OptimizeGame = dynamic(() => import("./OptimizeGame"), {
  ssr: false,
  loading: () => <div className="sheet h-[36rem] animate-pulse" />,
});

/** Stop 5: the "optimize my morning" mini-game. */
export default function GameSection() {
  return (
    <section data-stop={5} className="flex min-h-svh items-center px-5 py-20 md:px-12 lg:px-20">
      <div className="mx-auto grid w-full max-w-5xl items-start gap-10 md:grid-cols-[1fr_1.15fr]">
        <div className="md:sticky md:top-24">
          <p className="font-mono text-xs text-cyan">subprocess morning_routine</p>
          <h2 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] font-extrabold [font-variation-settings:'wdth'_115]">
            {profile.game.title}
          </h2>
          <p className="mt-5 max-w-[42ch] leading-relaxed text-line/85">{profile.game.intro}</p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>Drag the grip, or use the arrows, to reorder steps.</li>
            <li>Remove the steps that waste time. Keep the ones that matter.</li>
            <li>Press Ship it when your flow is ready.</li>
          </ul>
        </div>
        <OptimizeGame />
      </div>
    </section>
  );
}
