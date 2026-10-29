"use client";

import { LazyMotion, domAnimation, m } from "motion/react";
import { useStore } from "@/lib/store";

const HIDDEN = { filter: "blur(10px)", opacity: 0, y: -28 };
const SHOWN = { filter: "blur(0px)", opacity: 1, y: 0 };
// Halfway through, each word overshoots a little before it settles.
const REVEAL = {
  filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
  opacity: [0, 0.5, 1],
  y: [-28, 4, 0],
};

/**
 * A line whose words drop in out of a blur, one after another, once `play` turns true.
 * Adapted from React Bits' BlurText (reactbits.dev/text-animations/blur-text).
 */
export default function BlurText({
  text,
  play,
  className = "",
  delay = 110,
  stepDuration = 0.35,
}: {
  text: string;
  play: boolean;
  className?: string;
  /** Milliseconds between words. */
  delay?: number;
  stepDuration?: number;
}) {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const words = text.split(" ");
  return (
    <LazyMotion features={domAnimation} strict>
      <p className={`flex flex-wrap ${className}`}>
        <span className="sr-only">{text}</span>
        {words.map((word, i) => (
          <m.span
            key={i}
            aria-hidden
            className="inline-block will-change-[transform,filter,opacity]"
            initial={reducedMotion ? false : HIDDEN}
            animate={reducedMotion ? SHOWN : play ? REVEAL : HIDDEN}
            transition={{ duration: stepDuration * 2, times: [0, 0.5, 1], delay: (i * delay) / 1000 }}
          >
            {i < words.length - 1 ? `${word} ` : word}
          </m.span>
        ))}
      </p>
    </LazyMotion>
  );
}
