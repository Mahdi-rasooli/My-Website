import { describe, expect, it } from "vitest";
import {
  ARRIVAL_INTERVAL,
  BUDGET,
  STATIONS,
  applyFix,
  canApply,
  createLine,
  metrics,
  outcome,
  run,
  stars,
  type Line,
} from "./lineSim";

const at = (id: string) => STATIONS.findIndex((s) => s.id === id);
const spawned = (line: Line) => line.nextId;

describe("the starting line", () => {
  it("is jammed: Review cannot keep up and its queue keeps growing", () => {
    const line = createLine();
    expect(metrics(line).stable).toBe(false);
    expect(metrics(line).bottleneck).toBe(at("review"));
    run(line, 10);
    const early = metrics(line).queues[at("review")];
    run(line, 10);
    expect(metrics(line).queues[at("review")]).toBeGreaterThan(early);
    expect(outcome(line)).toBe("jammed");
  });

  it("never loses a request: everything spawned is either shipped or still on the line", () => {
    const line = createLine();
    run(line, 15);
    applyFix(line, at("recheck"), "remove");
    run(line, 15);
    expect(line.shippedCount + line.items.length).toBe(spawned(line));
  });
});

describe("fixes", () => {
  it("costs budget and refuses what is not allowed", () => {
    const line = createLine();
    expect(canApply(line, at("intake"), "remove").ok).toBe(false); // essential
    expect(canApply(line, at("recheck"), "ai").ok).toBe(false); // nothing to automate
    expect(applyFix(line, at("review"), "ai")).toBe(true);
    expect(line.budget).toBe(BUDGET - 2);
    expect(canApply(line, at("review"), "ai").ok).toBe(false); // already automated
    applyFix(line, at("recheck"), "remove");
    applyFix(line, at("print"), "remove");
    expect(line.budget).toBe(0);
    expect(canApply(line, at("ship"), "worker").ok).toBe(false); // out of budget
  });

  it("moves requests on when their station is removed", () => {
    const line = createLine();
    run(line, 20);
    applyFix(line, at("review"), "ai");
    run(line, 8);
    expect(line.items.some((i) => i.station === at("recheck"))).toBe(true);
    applyFix(line, at("recheck"), "remove");
    expect(line.items.some((i) => i.station === at("recheck"))).toBe(false);
  });
});

describe("solutions", () => {
  it("AI on Review plus cutting both waste steps: optimized, 1.7 s process time, three stars", () => {
    const line = createLine();
    run(line, 6);
    applyFix(line, at("review"), "ai");
    applyFix(line, at("recheck"), "remove");
    applyFix(line, at("print"), "remove");
    expect(metrics(line).stable).toBe(true);
    expect(metrics(line).processTime).toBeCloseTo(1.7);
    run(line, 30);
    expect(outcome(line)).toBe("optimized");
    expect(stars(line)).toBe(3);
  });

  it("people instead of AI also flows, but slower: two stars", () => {
    const line = createLine();
    applyFix(line, at("review"), "worker");
    applyFix(line, at("review"), "worker");
    applyFix(line, at("recheck"), "remove");
    applyFix(line, at("print"), "remove");
    expect(metrics(line).stable).toBe(true);
    expect(metrics(line).processTime).toBeCloseTo(2.7);
    run(line, 40);
    expect(outcome(line)).toBe("optimized");
    expect(stars(line)).toBe(2);
  });

  it("spending everything without fixing the flow is a dead end", () => {
    const line = createLine();
    applyFix(line, at("approve"), "ai");
    applyFix(line, at("ship"), "worker");
    applyFix(line, at("intake"), "worker");
    run(line, 20);
    expect(line.budget).toBe(0);
    expect(outcome(line)).toBe("stuck");
  });

  it("ships about one request per arrival once stable", () => {
    const line = createLine();
    applyFix(line, at("review"), "ai");
    applyFix(line, at("recheck"), "remove");
    applyFix(line, at("print"), "remove");
    run(line, 40);
    expect(metrics(line).throughputPerMin).toBeCloseTo(60 / ARRIVAL_INTERVAL, -1);
  });
});
