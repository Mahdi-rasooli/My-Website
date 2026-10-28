import { describe, expect, it } from "vitest";
import { dampAngle, shortestAngle } from "./flowRider";

describe("shortestAngle", () => {
  it("returns the signed turn the short way round", () => {
    expect(shortestAngle(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(shortestAngle(0, -Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
    // From just left of the back to just right of it: a small turn, not almost a full circle.
    expect(shortestAngle(Math.PI - 0.1, -Math.PI + 0.1)).toBeCloseTo(0.2);
    expect(shortestAngle(-Math.PI + 0.1, Math.PI - 0.1)).toBeCloseTo(-0.2);
  });
});

describe("dampAngle", () => {
  it("moves toward the target the short way and settles on it", () => {
    const a = dampAngle(Math.PI - 0.1, -Math.PI + 0.1, 10, 0.016);
    expect(shortestAngle(Math.PI - 0.1, a)).toBeGreaterThan(0);
    expect(shortestAngle(Math.PI - 0.1, a)).toBeLessThan(0.2);
    let x = 0;
    for (let i = 0; i < 200; i++) x = dampAngle(x, 2, 10, 0.016);
    expect(x).toBeCloseTo(2);
  });
});
