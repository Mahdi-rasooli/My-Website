import { describe, expect, it } from "vitest";
import { Euler, Group, Quaternion, Vector3 } from "three";
import { ARM, HAND_REST, RING_OFFSET, SLOT_DIR, armChain, gripRotation, ringCenter } from "./rig";

const pose = (side: 1 | -1) => new Euler(-0.7, 0, -side * 0.2);

/** The same nested groups the component renders, to check the maths against three.js itself. */
function sceneRing(side: 1 | -1, arm: Euler, wrist: Quaternion) {
  const pivot = new Group();
  pivot.position.set(side * ARM.shoulder.x, ARM.shoulder.y, 0);
  pivot.rotation.copy(arm);
  const splay = new Group();
  splay.rotation.z = side * ARM.splay;
  const elbow = new Group();
  elbow.position.set(0, ARM.elbowY, 0);
  elbow.rotation.x = ARM.bend;
  const w = new Group();
  w.position.set(0, ARM.wristY, 0);
  w.quaternion.copy(wrist);
  const ring = new Group();
  ring.position.copy(RING_OFFSET);
  pivot.add(splay);
  splay.add(elbow);
  elbow.add(w);
  w.add(ring);
  pivot.updateMatrixWorld(true);
  return ring.getWorldPosition(new Vector3());
}

describe("ringCenter", () => {
  it("matches the rendered group hierarchy", () => {
    for (const side of [1, -1] as const) {
      const wrist = gripRotation(side, pose(side), new Quaternion());
      const expected = sceneRing(side, pose(side), wrist);
      expect(ringCenter(side, pose(side), wrist).distanceTo(expected)).toBeLessThan(1e-9);
      expect(ringCenter(side, pose(side), HAND_REST).distanceTo(sceneRing(side, pose(side), HAND_REST))).toBeLessThan(
        1e-9,
      );
    }
  });

  it("is mirror-symmetric between the two hands", () => {
    const l = ringCenter(1, pose(1), gripRotation(1, pose(1), new Quaternion()));
    const r = ringCenter(-1, pose(-1), gripRotation(-1, pose(-1), new Quaternion()));
    expect(l.x).toBeCloseTo(-r.x);
    expect(l.y).toBeCloseTo(r.y);
    expect(l.z).toBeCloseTo(r.z);
  });
});

describe("gripRotation", () => {
  it("turns the hole to run front to back and the slot toward the other hand", () => {
    for (const side of [1, -1] as const) {
      const world = armChain(side, pose(side), new Quaternion()).multiply(
        gripRotation(side, pose(side), new Quaternion()),
      );
      const hole = new Vector3(0, 1, 0).applyQuaternion(world);
      const slot = SLOT_DIR(side).applyQuaternion(world);
      expect(hole.distanceTo(new Vector3(0, 0, 1))).toBeLessThan(1e-9);
      expect(slot.distanceTo(new Vector3(-side, 0, 0))).toBeLessThan(1e-9);
    }
  });
});
