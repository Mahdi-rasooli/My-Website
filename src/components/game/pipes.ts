/**
 * Untangle the Pipeline: a pipe-rotation puzzle. Each tile is a bitmask of its
 * openings; tapping turns it a quarter turn clockwise. The board is solved when the
 * input on the left edge connects through matching openings to the output on the right.
 */

export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

const DIRS = [
  { bit: N, dx: 0, dy: -1, opposite: S },
  { bit: E, dx: 1, dy: 0, opposite: W },
  { bit: S, dx: 0, dy: 1, opposite: N },
  { bit: W, dx: -1, dy: 0, opposite: E },
] as const;

/** Turns a tile's openings clockwise by k quarter turns. */
export function rotate(mask: number, k: number): number {
  let m = mask;
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
}

const GLYPH: Record<string, number> = {
  "─": E | W,
  "│": N | S,
  "┌": E | S,
  "┐": S | W,
  "└": N | E,
  "┘": N | W,
  "├": N | E | S,
  "┤": N | S | W,
  "┬": E | S | W,
  "┴": N | E | W,
  "┼": N | E | S | W,
  "·": 0,
};

export interface Level {
  /** The solved layout, drawn with box characters; tiles off the path are decoys. */
  rows: string[];
  inRow: number;
  outRow: number;
}

export const LEVELS: readonly Level[] = [
  { inRow: 0, outRow: 3, rows: ["──┐│", "┐┌┘─", "│└─┐", "┌─┘└"] },
  { inRow: 2, outRow: 0, rows: ["┬┌┐│┌", "└│└─┘", "─┘┼┐│", "┌┴─┘┤", "│┐┌├─"] },
  { inRow: 4, outRow: 1, rows: ["┌─┬┐┌┐", "│├┘└┼┌", "└┌─┐┤│", "┬│┌│─│", "─┘┴└─┘"] },
];

export interface PathCell {
  index: number;
  /** Openings this tile needs on the solution path (toward the previous and next tile). */
  need: number;
}

export interface Board {
  w: number;
  h: number;
  inRow: number;
  outRow: number;
  /** Current openings of every tile. */
  cells: number[];
  /** Quarter turns applied to each tile since its designed orientation (for drawing the spin). */
  turns: number[];
  taps: number;
  path?: PathCell[];
}

const masksOf = (level: Level) => level.rows.flatMap((row) => [...row].map((ch) => GLYPH[ch] ?? 0));

function connections(cells: number[], w: number, h: number, i: number) {
  const x = i % w;
  const y = Math.floor(i / w);
  const out: number[] = [];
  for (const d of DIRS) {
    const nx = x + d.dx;
    const ny = y + d.dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
    const j = ny * w + nx;
    if (cells[i] & d.bit && cells[j] & d.opposite) out.push(j);
  }
  return out;
}

function reachable(cells: number[], w: number, h: number, start: number) {
  const parent = new Map<number, number>([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    for (const j of connections(cells, w, h, i)) {
      if (parent.has(j)) continue;
      parent.set(j, i);
      queue.push(j);
    }
  }
  return parent;
}

/** The designed route from input to output (shortest, in case decoys happen to connect). */
export function solutionPath(level: Level): PathCell[] {
  const cells = masksOf(level);
  const w = level.rows[0].length;
  const parent = reachable(cells, w, level.rows.length, level.inRow * w);
  const route: number[] = [];
  for (let i = level.outRow * w + w - 1; i !== -1; i = parent.get(i)!) route.unshift(i);
  const toward = (a: number, b: number) =>
    DIRS.find((d) => d.dx === (b % w) - (a % w) && d.dy === Math.floor(b / w) - Math.floor(a / w))!.bit;
  return route.map((index, k) => ({
    index,
    need: (k === 0 ? W : toward(index, route[k - 1])) | (k === route.length - 1 ? E : toward(index, route[k + 1])),
  }));
}

/** Small integer hash so every visitor gets the same scramble. */
function hash(a: number, b: number) {
  let h = Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 1597334677);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  return (h ^ (h >>> 13)) >>> 0;
}

/** Taps (clockwise only) a tile needs before it has all the openings in `need`. */
function tapsToFit(mask: number, need: number) {
  let t = 0;
  while (t < 4 && (rotate(mask, t) & need) !== need) t++;
  return t;
}

/**
 * A level's board, scrambled so every pipe on the path needs one or two taps: never
 * already right, never three taps away (which would mean turning almost all the way round).
 */
export function createBoard(level: Level, { scrambled = true } = {}): Board {
  const base = masksOf(level);
  const path = solutionPath(level);
  const need = new Map(path.map((p) => [p.index, p.need]));
  const seed = LEVELS.indexOf(level);
  const turns = base.map((mask, i) => {
    if (!scrambled) return 0;
    const k = hash(seed, i) % 4;
    const req = need.get(i);
    if (req === undefined) return k;
    for (let j = 0; j < 4; j++) {
      const taps = tapsToFit(rotate(mask, k + j), req);
      if (taps >= 1 && taps <= 2) return (k + j) % 4;
    }
    return k;
  });
  return {
    w: level.rows[0].length,
    h: level.rows.length,
    inRow: level.inRow,
    outRow: level.outRow,
    cells: base.map((mask, i) => rotate(mask, turns[i])),
    turns,
    taps: 0,
    path,
  };
}

/** Turns one tile a quarter turn clockwise. */
export function tap(board: Board, i: number) {
  board.cells[i] = rotate(board.cells[i], 1);
  board.turns[i]++;
  board.taps++;
}

/** Tiles connected to the input, and whether the flow reaches the output. */
export function flow(board: Board) {
  const { w, h, cells } = board;
  const start = board.inRow * w;
  const connected = new Set<number>(cells[start] & W ? reachable(cells, w, h, start).keys() : []);
  const last = board.outRow * w + w - 1;
  return { connected, solved: connected.has(last) && (cells[last] & E) !== 0 };
}

/** Taps each path tile needs from where it is now. */
export function solveSteps(board: Board) {
  return (board.path ?? []).map(({ index, need }) => ({ index, turns: tapsToFit(board.cells[index], need) }));
}

/** The par for a board: the fewest taps along the designed route. */
export const minTurns = (board: Board) => solveSteps(board).reduce((sum, s) => sum + s.turns, 0);
