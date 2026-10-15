import { describe, it, expect } from "vitest";
import { NODE_US, avatarU, cameraStops } from "./world";
import { LAST_STOP } from "./track";

describe("world layout", () => {
  it("places nodes in increasing order along the flow", () => {
    for (let i = 1; i < NODE_US.length; i++) expect(NODE_US[i]).toBeGreaterThan(NODE_US[i - 1]);
  });
  it("parks the avatar on node 01 in the hero and on OUTPUT at contact", () => {
    expect(avatarU(0)).toBeCloseTo(NODE_US[0]);
    expect(avatarU(LAST_STOP)).toBeCloseTo(NODE_US[4]);
  });
  it("has one camera framing per stop on both layouts", () => {
    expect(cameraStops(false)).toHaveLength(LAST_STOP + 1);
    expect(cameraStops(true)).toHaveLength(LAST_STOP + 1);
  });
});
