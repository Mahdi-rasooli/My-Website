"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText as GSAPSplitText } from "gsap/SplitText";

gsap.registerPlugin(GSAPSplitText);

/**
 * Letters that rise and pop in one after another, played once on mount.
 * Adapted from React Bits' SplitText (reactbits.dev/text-animations/split-text), trimmed to
 * the load trigger this site uses. Remount it with a new `key` to play it again.
 */
export default function SplitText({
  text,
  className = "",
  delay = 35,
  duration = 0.55,
  ease = "back.out(1.8)",
}: {
  text: string;
  className?: string;
  /** Milliseconds between letters. */
  delay?: number;
  duration?: number;
  ease?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.visibility = "visible";
      return;
    }
    let split: GSAPSplitText | null = null;
    let tween: gsap.core.Tween | null = null;
    let live = true;
    // Splitting before the font arrives would measure the fallback face.
    document.fonts.ready.then(() => {
      if (!live) return;
      split = new GSAPSplitText(el, { type: "chars", smartWrap: true });
      el.style.visibility = "visible";
      tween = gsap.fromTo(
        split.chars,
        { opacity: 0, y: "0.7em", scale: 0.6 },
        { opacity: 1, y: 0, scale: 1, duration, ease, stagger: delay / 1000 },
      );
    });
    return () => {
      live = false;
      tween?.kill();
      split?.revert();
    };
  }, [text, delay, duration, ease]);

  return (
    <p ref={ref} className={className} style={{ visibility: "hidden" }}>
      {text}
    </p>
  );
}
