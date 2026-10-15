import { describe, it, expect } from "vitest";
import { STEPS, orderFraction, rankFor, scoreGame, shuffleSteps, GAME_DURATION } from "./gameLogic";

const essentials = STEPS.filter((s) => s.kind === "essential");
const waste = STEPS.filter((s) => s.kind === "waste");

describe("orderFraction", () => {
  it("is 1 for perfectly ordered essentials", () => {
    expect(orderFraction(essentials)).toBe(1);
  });
  it("is 0 for reversed essentials", () => {
    expect(orderFraction([...essentials].reverse())).toBe(0);
  });
  it("ignores waste cards", () => {
    expect(orderFraction([waste[0], ...essentials, waste[1]])).toBe(1);
  });
  it("is 0 with fewer than two essentials", () => {
    expect(orderFraction([essentials[0]])).toBe(0);
  });
});

describe("rankFor", () => {
  it.each([
    [0, "Chaos Agent"], [39, "Chaos Agent"], [40, "Process Apprentice"],
    [69, "Process Apprentice"], [70, "Flow Engineer"], [89, "Flow Engineer"], [90, "Systems Architect"],
  ])("%i → %s", (score, rank) => expect(rankFor(score)).toBe(rank));
});

describe("scoreGame", () => {
  it("perfect run with full time scores 100", () => {
    expect(scoreGame(essentials, GAME_DURATION).score).toBe(100);
  });
  it("perfect order + all waste removed on timeout scores 90", () => {
    const r = scoreGame(essentials, 0);
    expect(r.score).toBe(90);
    expect(r.rank).toBe("Systems Architect");
  });
  it("penalises deleting essentials and flags a broken process", () => {
    const r = scoreGame(essentials.slice(1), 0);
    expect(r.essentialsDeleted).toBe(1);
    expect(r.broken).toBe(true);
    expect(r.score).toBe(75);
  });
  it("never goes below zero", () => {
    expect(scoreGame([], 0).score).toBe(0);
  });
  it("untouched board keeps waste and earns no waste points", () => {
    const r = scoreGame([...STEPS], 0);
    expect(r.wasteRemoved).toBe(0);
  });
});

describe("shuffleSteps", () => {
  it("returns every step exactly once", () => {
    const s = shuffleSteps();
    expect(s).toHaveLength(STEPS.length);
    expect(new Set(s.map((x) => x.id)).size).toBe(STEPS.length);
  });
  it("never starts already solved, even with a degenerate RNG", () => {
    const identityRng = () => 0.999999;
    expect(orderFraction(shuffleSteps(identityRng))).toBeLessThan(0.75);
  });
});
