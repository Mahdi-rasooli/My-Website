/**
 * Values that change every frame. Kept outside React so the 3D scene can read
 * them in `useFrame` without triggering re-renders.
 */
export const sceneState = {
  /** 0 = hero … 6 = contact (see lib/track.ts). */
  track: 0,
  /** Change in track since the previous scroll event. */
  velocity: 0,
  /** 0 = tangled knot, 1 = clean flow. Tweened by `optimize()`. */
  untangle: 0,
  /** Pointer position, -1…1 on both axes. */
  pointer: { x: 0, y: 0 },
  /** When the mini-game was last won (performance.now() seconds), so the figure can cheer. */
  celebratedAt: -Infinity,
};
