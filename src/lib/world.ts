import { CatmullRomCurve3, Vector3 } from "three";
import { LAST_STOP, segmentOf } from "./track";

/** Journey nodes 01–04 followed by the OUTPUT node. */
export const NODE_POSITIONS: readonly Vector3[] = [
  new Vector3(0, 0, 0),
  new Vector3(9, 1.6, -5),
  new Vector3(18, -1.2, -10),
  new Vector3(27, 1, -15),
  new Vector3(36, 0, -20),
];

/** Where the hero knot floats before it is optimized. */
export const KNOT_CENTER = new Vector3(0, 0, 0);

/** The clean, optimized flow: enters off-screen, passes every node, exits. */
export const mainCurve = new CatmullRomCurve3(
  // Enters from below the hero copy so it never crosses the text.
  [new Vector3(-3, -7, 3), new Vector3(-1.6, -2.2, 1.2), ...NODE_POSITIONS, new Vector3(46, 0.4, -25)],
  false,
  "centripetal",
);

/** Curve parameter (0–1) closest to each node in NODE_POSITIONS. */
export const NODE_US: readonly number[] = NODE_POSITIONS.map((node) => {
  const samples = 2000;
  let best = 0;
  let bestDist = Infinity;
  const p = new Vector3();
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    mainCurve.getPointAt(u, p);
    const d = p.distanceToSquared(node);
    if (d < bestDist) {
      bestDist = d;
      best = u;
    }
  }
  return best;
});

/** Avatar position on the curve for each stop (hero … contact). */
const AVATAR_STOP_US = [
  NODE_US[0],
  NODE_US[0],
  NODE_US[1],
  NODE_US[2],
  NODE_US[3],
  (NODE_US[3] + NODE_US[4]) / 2,
  NODE_US[4],
];

export function avatarU(track: number): number {
  const { from, to, t } = segmentOf(track);
  return AVATAR_STOP_US[from] + (AVATAR_STOP_US[to] - AVATAR_STOP_US[from]) * t;
}

export interface CameraStop {
  pos: Vector3;
  look: Vector3;
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/**
 * One camera framing per stop. On desktop cards sit on the left, so the camera
 * looks left of each node to push it right. On mobile cards sit at the bottom,
 * so the camera looks below each node to push it up.
 */
export function cameraStops(isMobile: boolean): CameraStop[] {
  const nodeStop = (n: Vector3): CameraStop =>
    isMobile
      ? { pos: n.clone().add(v(0, 1.2, 11)), look: n.clone().add(v(0, -2.6, 0)) }
      : { pos: n.clone().add(v(1.5, 1.2, 7.5)), look: n.clone().add(v(-3.2, 0.3, 0)) };

  const out = NODE_POSITIONS[4];
  const stops: CameraStop[] = [
    isMobile
      ? { pos: v(0, 0.4, 13), look: v(0, 2.6, 0) }
      : { pos: v(0, 0.6, 9.5), look: v(-3.4, 0, 0) },
    nodeStop(NODE_POSITIONS[0]),
    nodeStop(NODE_POSITIONS[1]),
    nodeStop(NODE_POSITIONS[2]),
    nodeStop(NODE_POSITIONS[3]),
    isMobile
      ? { pos: v(18, 16, 36), look: v(18, -1, -10) }
      : { pos: v(18, 9, 22), look: v(18, -1, -10) },
    isMobile
      ? { pos: out.clone().add(v(0, 1, 11)), look: out.clone().add(v(0, -2.4, 0)) }
      : { pos: out.clone().add(v(0, 1, 8)), look: out.clone().add(v(0, -1.4, 0)) },
  ];
  if (stops.length !== LAST_STOP + 1) throw new Error("cameraStops must match STOPS");
  return stops;
}
