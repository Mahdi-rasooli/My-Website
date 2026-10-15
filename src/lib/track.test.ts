import { describe, it, expect } from "vitest";
import { trackFromScroll, activeStopIndex, segmentOf, LAST_STOP } from "./track";

describe("trackFromScroll", () => {
  const centers = [500, 1500, 2500];
  it("clamps before the first panel", () => expect(trackFromScroll(0, centers)).toBe(0));
  it("clamps after the last panel", () => expect(trackFromScroll(9999, centers)).toBe(2));
  it("interpolates between centers", () => expect(trackFromScroll(1000, centers)).toBeCloseTo(0.5));
  it("handles empty input", () => expect(trackFromScroll(100, [])).toBe(0));
  it("handles zero-height gaps without NaN", () => {
    expect(Number.isNaN(trackFromScroll(500, [500, 500, 900]))).toBe(false);
  });
});

describe("activeStopIndex", () => {
  it("rounds and clamps", () => {
    expect(activeStopIndex(1.4)).toBe(1);
    expect(activeStopIndex(1.6)).toBe(2);
    expect(activeStopIndex(-3)).toBe(0);
    expect(activeStopIndex(99)).toBe(LAST_STOP);
  });
});

describe("segmentOf", () => {
  it("rests exactly on a stop", () => expect(segmentOf(2)).toEqual({ from: 2, to: 3, t: 0 }));
  it("is halfway at the midpoint", () => expect(segmentOf(2.5).t).toBeCloseTo(0.5));
  it("holds near a stop", () => expect(segmentOf(2.1).t).toBe(0));
  it("clamps at the end", () => expect(segmentOf(10)).toEqual({ from: LAST_STOP, to: LAST_STOP, t: 0 }));
  it("clamps below zero", () => expect(segmentOf(-1)).toEqual({ from: 0, to: 1, t: 0 }));
});
