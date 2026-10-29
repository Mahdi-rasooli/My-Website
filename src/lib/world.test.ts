import { describe, it, expect } from "vitest";
import { Vector3 } from "three";
import { AVATAR_GAP, NODE_POSITIONS, NODE_US, avatarU, cameraStops, mainCurve } from "./world";
import { LAST_STOP } from "./track";

describe("world layout", () => {
  it("places nodes in increasing order along the flow", () => {
    for (let i = 1; i < NODE_US.length; i++) expect(NODE_US[i]).toBeGreaterThan(NODE_US[i - 1]);
  });
  it("parks the avatar just before node 01 in the hero and OUTPUT at contact", () => {
    expect(avatarU(0)).toBeLessThan(NODE_US[0]);
    expect(avatarU(LAST_STOP)).toBeLessThan(NODE_US[4]);
  });
  it("stands the avatar the same short distance before every node", () => {
    const at = new Vector3();
    const nodeOfStop: [number, number][] = [
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3],
      [LAST_STOP, 4],
    ];
    for (const [stop, node] of nodeOfStop) {
      mainCurve.getPointAt(avatarU(stop), at);
      expect(at.distanceTo(NODE_POSITIONS[node])).toBeCloseTo(AVATAR_GAP, 1);
    }
  });
  it("has one camera framing per stop on both layouts", () => {
    expect(cameraStops(false)).toHaveLength(LAST_STOP + 1);
    expect(cameraStops(true)).toHaveLength(LAST_STOP + 1);
  });
});
