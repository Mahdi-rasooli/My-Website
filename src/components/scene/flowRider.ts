import { MathUtils, Vector3, type Camera, type Object3D } from "three";
import { avatarU, mainCurve } from "@/lib/world";
import { sceneState } from "@/lib/sceneState";

/** Stand just before each node ring so the avatar never clips through it. */
const U_BEHIND_NODE = 0.02;

export interface Rider {
  pop: number;
  /** 0 = standing still, 1 = walking at full pace. */
  speed: number;
  prev: Vector3;
  target: Vector3;
  placed: boolean;
  /** Direction of the last real movement (forward or back along the flow). */
  travelYaw: number;
  /** Current facing, turned smoothly toward where it should look. */
  yaw: number;
}

export const createRider = (): Rider => ({
  pop: 0,
  speed: 0,
  prev: new Vector3(),
  target: new Vector3(),
  placed: false,
  travelYaw: 0,
  yaw: 0,
});

/** Signed turn from one angle to another, taking the short way round (−π..π). */
export const shortestAngle = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

/** Frame-rate independent damping between angles, always turning the short way. */
export const dampAngle = (current: number, target: number, lambda: number, dt: number) =>
  current + shortestAngle(current, target) * (1 - Math.exp(-lambda * dt));

/** How far a walking avatar turns from the viewer toward where it is going. */
const WALK_HEADING = 0.85;

/**
 * Moves an avatar along the process flow for one frame: pops it in once the knot
 * is untangled and follows the scroll track. Like a game character on a stick, it
 * turns to face the way it is actually moving (back toward the previous node when
 * the visitor scrolls up), then turns back to the viewer when it stops.
 * Returns false while the avatar is hidden.
 */
export function rideFlow(
  root: Object3D,
  camera: Camera,
  delta: number,
  r: Rider,
  reducedMotion: boolean,
  scale = 1,
  yawOffset = 0,
): boolean {
  r.pop = MathUtils.damp(r.pop, sceneState.untangle > 0.8 ? 1 : 0, 5, delta);
  const overshoot = 1 + 0.25 * Math.sin(Math.min(r.pop, 1) * Math.PI) * (1 - r.pop);
  root.scale.setScalar(r.pop * overshoot * scale);
  root.visible = r.pop > 0.001;
  if (!root.visible) return false;

  const u = Math.max(0, avatarU(sceneState.track, reducedMotion) - U_BEHIND_NODE);
  mainCurve.getPointAt(u, r.target);
  r.target.y += 0.07;
  const faceCam = Math.atan2(camera.position.x - root.position.x, camera.position.z - root.position.z);
  if (!r.placed) r.yaw = faceCam + yawOffset;
  if (!r.placed || reducedMotion) {
    root.position.copy(r.target);
    r.placed = true;
  }
  r.prev.copy(root.position);
  root.position.set(
    MathUtils.damp(root.position.x, r.target.x, 6, delta),
    MathUtils.damp(root.position.y, r.target.y, 6, delta),
    MathUtils.damp(root.position.z, r.target.z, 6, delta),
  );
  r.speed = MathUtils.damp(r.speed, Math.min(r.prev.distanceTo(root.position) / delta / 4, 1), 8, delta);

  const dx = root.position.x - r.prev.x;
  const dz = root.position.z - r.prev.z;
  if (dx * dx + dz * dz > 1e-10) r.travelYaw = Math.atan2(dx, dz);
  const walking = Math.min(r.speed * 2, 1) * WALK_HEADING;
  const heading = faceCam + shortestAngle(faceCam, r.travelYaw) * walking;
  r.yaw = reducedMotion ? faceCam + yawOffset : dampAngle(r.yaw, heading + yawOffset, 10, delta);
  root.rotation.y = r.yaw;
  return true;
}
