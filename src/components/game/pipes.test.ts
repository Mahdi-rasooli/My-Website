import { describe, expect, it } from "vitest";
import { E, LEVELS, N, S, W, createBoard, flow, minTurns, rotate, solutionPath, solveSteps, tap } from "./pipes";

describe("rotate", () => {
  it("turns openings clockwise and comes back after four turns", () => {
    expect(rotate(E | W, 1)).toBe(N | S);
    expect(rotate(N | E, 1)).toBe(E | S);
    expect(rotate(W, 1)).toBe(N);
    for (let m = 0; m < 16; m++) expect(rotate(m, 4)).toBe(m);
  });
});

describe("levels", () => {
  it("are solved in their designed orientation", () => {
    for (const level of LEVELS) expect(flow(createBoard(level, { scrambled: false })).solved).toBe(true);
  });

  it("start scrambled, with every pipe on the path needing at least one tap", () => {
    LEVELS.forEach((level, i) => {
      const board = createBoard(level);
      expect(flow(board).solved, `level ${i + 1}`).toBe(false);
      expect(minTurns(board)).toBeGreaterThanOrEqual(solutionPath(level).length);
      for (const { turns } of solveSteps(board)) expect(turns === 1 || turns === 2).toBe(true);
    });
  });

  it("are solved by tapping each path pipe its minimum number of times", () => {
    for (const level of LEVELS) {
      const board = createBoard(level);
      for (const { index, turns } of solveSteps(board)) for (let k = 0; k < turns; k++) tap(board, index);
      expect(flow(board).solved).toBe(true);
      expect(board.taps).toBe(minTurns(createBoard(level)));
    }
  });
});

describe("flow", () => {
  it("only connects neighbours that are open toward each other", () => {
    // ─ then │ : the second pipe is not open to the west, so flow stops at the first.
    const board = { w: 2, h: 1, inRow: 0, outRow: 0, cells: [E | W, N | S], turns: [0, 0], taps: 0 };
    const f = flow(board);
    expect([...f.connected]).toEqual([0]);
    expect(f.solved).toBe(false);
    board.cells[1] = E | W;
    expect(flow(board).solved).toBe(true);
  });

  it("needs the first pipe to face the input", () => {
    const board = { w: 1, h: 1, inRow: 0, outRow: 0, cells: [N | S], turns: [0], taps: 0 };
    expect(flow(board).connected.size).toBe(0);
  });
});

describe("tap", () => {
  it("rotates one pipe a quarter turn and counts the tap", () => {
    const board = createBoard(LEVELS[0], { scrambled: false });
    const before = board.cells[0];
    tap(board, 0);
    expect(board.cells[0]).toBe(rotate(before, 1));
    expect(board.turns[0]).toBe(1);
    expect(board.taps).toBe(1);
    expect(rotate(S, 1)).toBe(W);
  });
});
