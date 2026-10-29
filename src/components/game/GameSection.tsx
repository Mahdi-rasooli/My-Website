"use client";

import dynamic from "next/dynamic";
import { profile } from "@/content/profile";

const PipeGame = dynamic(() => import("./PipeGame"), {
  ssr: false,
  loading: () => <div className="sheet h-136 animate-pulse" />,
});

/** Stop 5: Untangle the Pipeline, a pipe-turning puzzle. */
export default function GameSection() {
  return (
    <section data-stop={5} className="flex min-h-svh items-center px-5 py-20 md:px-12 lg:px-20">
      <div className="mx-auto grid w-full max-w-5xl items-start gap-10 md:grid-cols-[1fr_1.15fr]">
        <div className="md:sticky md:top-24">
          <p className="font-mono text-xs text-cyan">subprocess untangle</p>
          <h2 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] font-extrabold [font-variation-settings:'wdth'_115]">
            {profile.game.title}
          </h2>
          <p className="mt-5 max-w-[42ch] leading-relaxed text-line/85">{profile.game.intro}</p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>Tap a pipe to turn it a quarter turn.</li>
            <li>Lit pipes are connected to the input.</li>
            <li>Get the flow to the amber output. Fewer taps, more stars.</li>
          </ul>
        </div>
        <PipeGame />
      </div>
    </section>
  );
}
