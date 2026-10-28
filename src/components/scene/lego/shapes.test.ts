import { describe, expect, it } from "vitest";
import { BoxGeometry, LatheGeometry } from "three";
import { clipShape, headProfile, taperTop, uvByHeight } from "./shapes";

const column = (g: BoxGeometry | LatheGeometry, attr: "position" | "uv", i: number) => {
  const a = g.getAttribute(attr);
  return Array.from({ length: a.count }, (_, k) => a.getComponent(k, i));
};

describe("taperTop", () => {
  it("narrows the top of a box in x and leaves the bottom alone", () => {
    const g = taperTop(new BoxGeometry(2, 2, 2), 0.5);
    const xs = column(g, "position", 0);
    const ys = column(g, "position", 1);
    const topX = Math.max(...xs.filter((_, k) => ys[k] > 0.99));
    const bottomX = Math.max(...xs.filter((_, k) => ys[k] < -0.99));
    expect(topX).toBeCloseTo(0.5);
    expect(bottomX).toBeCloseTo(1);
  });

  it("keeps depth untouched", () => {
    const g = taperTop(new BoxGeometry(2, 2, 2), 0.5);
    expect(Math.max(...column(g, "position", 2))).toBeCloseTo(1);
  });
});

describe("headProfile", () => {
  it("runs from the bottom center to the top center with the given radius", () => {
    const pts = headProfile(5, 8, 1);
    expect(pts[0].x).toBe(0);
    expect(pts[0].y).toBeCloseTo(-4);
    expect(pts.at(-1)!.x).toBe(0);
    expect(pts.at(-1)!.y).toBeCloseTo(4);
    expect(Math.max(...pts.map((p) => p.x))).toBeCloseTo(5);
  });
});

describe("clipShape", () => {
  const pts = clipShape(1.5, 2.5, 1.2).getPoints(24);
  const radius = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);
  const angle = (p: { x: number; y: number }) => Math.abs(Math.atan2(p.y, p.x));

  it("stays within the ring's outer radius and outside its hole", () => {
    for (const p of pts) {
      expect(radius(p)).toBeLessThanOrEqual(2.5 + 1e-6);
      expect(radius(p)).toBeGreaterThanOrEqual(1.5 - 1e-6);
    }
  });

  it("leaves the opening (centered on +x) clear, with rounded ends reaching into it", () => {
    for (const p of pts) expect(angle(p)).toBeGreaterThan(0.3);
    expect(pts.some((p) => angle(p) < 0.5)).toBe(true);
  });
});

describe("uvByHeight", () => {
  it("maps v linearly from the bottom (0) to the top (1)", () => {
    const g = uvByHeight(new LatheGeometry(headProfile(5, 8, 1), 12), 8);
    const vs = column(g, "uv", 1);
    const ys = column(g, "position", 1);
    expect(Math.min(...vs)).toBeCloseTo(0);
    expect(Math.max(...vs)).toBeCloseTo(1);
    const mid = ys.findIndex((y) => Math.abs(y) < 1e-6);
    if (mid !== -1) expect(vs[mid]).toBeCloseTo(0.5);
  });
});
