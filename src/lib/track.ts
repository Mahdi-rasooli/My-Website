/**
 * The page is a sequence of "stops". Scroll position becomes a continuous
 * `track` value: 0 = hero, 1–4 = journey nodes, 5 = game, 6 = contact.
 */
export const STOPS = ["hero", "boot", "web", "ml", "avitec", "game", "contact"] as const;
export type StopName = (typeof STOPS)[number];
export const LAST_STOP = STOPS.length - 1;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Piecewise-linear map from the viewport's vertical center to a track value. */
export function trackFromScroll(scrollCenter: number, panelCenters: readonly number[]): number {
  const n = panelCenters.length;
  if (n === 0) return 0;
  if (scrollCenter <= panelCenters[0]) return 0;
  for (let i = 0; i < n - 1; i++) {
    const a = panelCenters[i];
    const b = panelCenters[i + 1];
    if (scrollCenter <= b) return b > a ? i + (scrollCenter - a) / (b - a) : i + 1;
  }
  return n - 1;
}

export function activeStopIndex(track: number): number {
  return clamp(Math.round(track), 0, LAST_STOP);
}

/**
 * The two stops around `track` and an eased blend between them. The first and
 * last `hold / 2` of each segment stay pinned to the stop so cards can be read.
 */
export function segmentOf(track: number, hold = 0.35): { from: number; to: number; t: number } {
  const c = clamp(track, 0, LAST_STOP);
  const from = Math.min(Math.floor(c), LAST_STOP);
  const to = Math.min(from + 1, LAST_STOP);
  const h = hold / 2;
  const raw = clamp((c - from - h) / (1 - 2 * h), 0, 1);
  return { from, to, t: raw * raw * (3 - 2 * raw) };
}

/** Like `segmentOf`, but with reduced motion the view cuts to the nearest stop instead of gliding. */
export function framingOf(track: number, reducedMotion: boolean): { from: number; to: number; t: number } {
  if (!reducedMotion) return segmentOf(track);
  const stop = activeStopIndex(track);
  return { from: stop, to: stop, t: 0 };
}
