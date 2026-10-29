"use client";

import dynamic from "next/dynamic";
import { profile } from "@/content/profile";

const BottleneckGame = dynamic(() => import("./BottleneckGame"), {
  ssr: false,
  loading: () => <div className="sheet h-[38rem] animate-pulse" />,
});

/** Stop 5: Bottleneck Rush, process optimization as a 60-second game. */
export default function GameSection() {
  return (
    <section data-stop={5} className="flex min-h-svh items-center px-5 py-20 md:px-12 lg:px-20">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <p className="font-mono text-xs text-cyan">subprocess request_pipeline</p>
            <h2 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] font-extrabold [font-variation-settings:'wdth'_115]">
              {profile.game.title}
            </h2>
          </div>
          <div>
            <p className="max-w-[46ch] leading-relaxed text-line/85">{profile.game.intro}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted">
              <li>Tap a station to see how much it can handle.</li>
              <li>Add a person (1), automate with AI (2) or remove a step (1). You have 4.</li>
              <li>Win by getting every station to keep up and clearing the pile-up.</li>
            </ul>
          </div>
        </div>
        <div className="mt-8">
          <BottleneckGame />
        </div>
      </div>
    </section>
  );
}
