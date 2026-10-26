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
}

export const createRider = (): Rider => ({ pop: 0, speed: 0, prev: new Vector3(), target: new Vector3(), placed: false });

/**
 * Moves an avatar along the process flow for one frame: pops it in once the knot
 * is untangled, follows the scroll track, and turns it toward the camera
 * (a little toward the direction of travel while walking).
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

  const faceCam = Math.atan2(camera.position.x - root.position.x, camera.position.z - root.position.z);
  const tangent = mainCurve.getTangentAt(u);
  root.rotation.y = yawOffset + MathUtils.lerp(faceCam, Math.atan2(tangent.x, tangent.z), r.speed * 0.45);
  return true;
}
