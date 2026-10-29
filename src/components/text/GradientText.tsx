import type { CSSProperties, ReactNode } from "react";

/** Blueprint cyan through periwinkle and the jacket's coral to amber. */
export const SITE_GRADIENT = ["#5ce1e6", "#8b9dff", "#ff8a65", "#ffb547"];

/**
 * Text filled with a slowly panning gradient (styles in globals.css, `.gradient-text`).
 * Adapted from React Bits' GradientText (reactbits.dev/text-animations/gradient-text).
 */
export default function GradientText({
  children,
  colors = SITE_GRADIENT,
  animationSpeed = 6,
  className = "",
}: {
  children: ReactNode;
  colors?: string[];
  /** Seconds for one sweep across the gradient. */
  animationSpeed?: number;
  className?: string;
}) {
  // Loop back to the first color so the sweep has no seam.
  const style = {
    "--gt-colors": [...colors, colors[0]].join(", "),
    "--gt-speed": `${animationSpeed}s`,
  } as CSSProperties;
  return (
    <span className={`gradient-text ${className}`} style={style}>
      {children}
    </span>
  );
}
