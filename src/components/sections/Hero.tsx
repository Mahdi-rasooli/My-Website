"use client";

import { profile } from "@/content/profile";
import { getAge } from "@/lib/age";
import { useStore } from "@/lib/store";
import { scrollToStop } from "@/components/ScrollDriver";
import BlurText from "@/components/text/BlurText";
import GradientText from "@/components/text/GradientText";

export default function Hero() {
  const optimized = useStore((s) => s.optimized);
  const booted = useStore((s) => s.booted);
  // Computed at render so the static HTML never goes stale after a birthday.
  const age = getAge(profile.birthDate);

  return (
    <section
      data-stop={0}
      data-optimized={optimized}
      className="relative flex min-h-svh items-end px-5 pb-14 md:items-center md:px-12 md:pb-0 lg:px-20"
    >
      {/* On small screens the flow passes behind the copy; a soft scrim keeps it readable. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-bg-deep via-bg-deep/75 to-transparent md:hidden"
      />
      <div className="relative max-w-3xl">
        <h1 className="wordmark text-[clamp(3.25rem,9vw,8.5rem)] leading-[0.86] font-extrabold uppercase">
          {/* One gradient across all three lines, so it flows from "I'm" into the name. */}
          <GradientText className="block">
            <span className="block">I&apos;m {profile.firstName}</span>
            <span className="block">{profile.name.split(" ").slice(1).join(" ")}</span>
          </GradientText>
        </h1>

        <BlurText text={profile.pitch} play={booted} className="mt-8 max-w-[26ch] text-2xl leading-snug md:text-3xl" />
        <p className="mt-3 text-muted" suppressHydrationWarning>
          {profile.role}. {age}, Computer Science graduate, former web developer.
        </p>

        <button
          type="button"
          onClick={() => scrollToStop(1)}
          className="mt-10 text-left text-muted underline decoration-cyan/40 underline-offset-[6px] transition-colors hover:text-line"
        >
          If you want to see how I got here, please scroll down
        </button>
      </div>
    </section>
  );
}
