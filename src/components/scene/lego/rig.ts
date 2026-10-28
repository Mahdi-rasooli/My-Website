import { Euler, Matrix4, Quaternion, Vector3 } from "three";

/** Arm joints in minifig millimetres: shoulder pivot, splay, elbow bend and wrist. */
export const ARM = { shoulder: { x: 6.6, y: 24.6 }, splay: 0.12, elbowY: -4.2, bend: -0.5, wristY: -5.1 };

/**
 * Hand clip, sized like the real part: after the 0.3 mm bevel the hole is 3.2 mm
 * across (it grips a LEGO bar), the hand 5 mm wide and 3.1 mm tall, and the slot
 * about 1.6 mm, narrower than the hole so a bar snaps in.
 */
export const HAND = { inner: 1.9, outer: 2.2, depth: 2.4, bevel: 0.3, bevelHeight: 0.35, gap: 1.3 };
export const HAND_OUTER = HAND.outer + HAND.bevel;

/** Resting wrist: undoes the forearm's forward bend so the hole runs top to bottom. */
export const HAND_REST = new Quaternion().setFromEuler(new Euler(0.45, 0, 0));
/** The ring's center relative to the wrist joint: its back wall takes the wrist peg. */
export const RING_OFFSET = new Vector3(0, -0.4, HAND_OUTER - 0.55);

/** Slot angle in the clip shape's plane: forward and a little inward once stood upright. */
export const slotAngle = (side: 1 | -1) => Math.atan2(-0.88, -side * 0.48);
/** Slot direction in the wrist frame (the hole runs along the wrist frame's y). */
export const SLOT_DIR = (side: 1 | -1) => new Vector3(Math.cos(slotAngle(side)), 0, -Math.sin(slotAngle(side)));

const UP = new Vector3(0, 1, 0);
const FORWARD = new Vector3(0, 0, 1);

/** Body-space hand orientation for gripping a flat edge: hole front to back, slot toward the other hand. */
function gripTarget(side: 1 | -1) {
  const slot = SLOT_DIR(side);
  const local = new Matrix4().makeBasis(UP, slot, new Vector3().crossVectors(UP, slot));
  const inward = new Vector3(-side, 0, 0);
  const body = new Matrix4().makeBasis(FORWARD, inward, new Vector3().crossVectors(FORWARD, inward));
  return new Quaternion().setFromRotationMatrix(body.multiply(local.transpose()));
}
const GRIP = { [1]: gripTarget(1), [-1]: gripTarget(-1) } as const;

const _e = new Euler();
const _q = new Quaternion();

/** Orientation of the forearm frame (the wrist's parent) relative to the body. */
export function armChain(side: 1 | -1, arm: Euler, out: Quaternion): Quaternion {
  out.setFromEuler(arm);
  out.multiply(_q.setFromEuler(_e.set(0, 0, side * ARM.splay)));
  return out.multiply(_q.setFromEuler(_e.set(ARM.bend, 0, 0)));
}

/** Wrist rotation (in the forearm frame) that turns the hand to grip a flat edge, for the given arm pose. */
export function gripRotation(side: 1 | -1, arm: Euler, out: Quaternion): Quaternion {
  return armChain(side, arm, out).invert().multiply(GRIP[side]);
}

/** Body-space center of a hand's ring for an arm pose and wrist rotation. */
export function ringCenter(side: 1 | -1, arm: Euler, wrist: Quaternion): Vector3 {
  const v = RING_OFFSET.clone().applyQuaternion(wrist);
  v.y += ARM.wristY;
  v.applyQuaternion(_q.setFromEuler(_e.set(ARM.bend, 0, 0)));
  v.y += ARM.elbowY;
  v.applyQuaternion(_q.setFromEuler(_e.set(0, 0, side * ARM.splay)));
  v.applyQuaternion(_q.setFromEuler(arm));
  return v.add(new Vector3(side * ARM.shoulder.x, ARM.shoulder.y, 0));
}
