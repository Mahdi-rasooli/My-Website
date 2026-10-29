"use client";

import { useState, type KeyboardEvent } from "react";
import { profile } from "@/content/profile";
import { useStore } from "@/lib/store";
import { E, LEVELS, N, S, W, createBoard, flow, minTurns, rotate, tap, type Board } from "./pipes";

const CELL = 80;
const MARGIN = 56;
const ARM = CELL / 2;
const PARS = LEVELS.map((level) => minTurns(createBoard(level)));
const ARMS = [
  { bit: N, x: 0, y: -ARM, name: "up" },
  { bit: E, x: ARM, y: 0, name: "right" },
  { bit: S, x: 0, y: ARM, name: "down" },
  { bit: W, x: -ARM, y: 0, name: "left" },
] as const;

const center = (board: Board, i: number) => ({
  x: MARGIN + (i % board.w) * CELL + CELL / 2,
  y: (Math.floor(i / board.w) + 0.5) * CELL + 8,
});

function Pipe({ mask, lit, solved }: { mask: number; lit: boolean; solved: boolean }) {
  const arms = ARMS.filter((a) => mask & a.bit);
  const color = lit ? "#5ce1e6" : "#2d4866";
  return (
    <>
      {/* Invisible square keeps the spin centred on the tile whatever its shape. */}
      <rect x={-ARM} y={-ARM} width={CELL} height={CELL} fill="none" />
      {lit &&
        arms.map((a) => (
          <line
            key={`g${a.bit}`}
            x2={a.x}
            y2={a.y}
            stroke="#5ce1e6"
            strokeOpacity={0.22}
            strokeWidth={26}
          />
        ))}
      {lit && arms.length > 0 && <circle r={13} fill="#5ce1e6" fillOpacity={0.22} />}
      {/* Square ends meet the next tile's pipe exactly at the shared edge. */}
      {arms.map((a) => (
        <line key={a.bit} x2={a.x} y2={a.y} stroke={color} strokeWidth={14} />
      ))}
      {solved &&
        lit &&
        arms.map((a) => (
          <line
            key={`p${a.bit}`}
            x2={a.x}
            y2={a.y}
            stroke="#ffb547"
            strokeWidth={4}
            strokeDasharray="3 13"
            className="flow-dash"
          />
        ))}
      {arms.length > 0 && <circle r={9} fill={color} />}
    </>
  );
}

function Tile({
  board,
  index,
  lit,
  solved,
  onTap,
}: {
  board: Board;
  index: number;
  lit: boolean;
  solved: boolean;
  onTap: (i: number) => void;
}) {
  const { x, y } = center(board, index);
  const turns = board.turns[index];
  const mask = board.cells[index];
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onTap(index);
  };
  const open = ARMS.filter((a) => mask & a.bit).map((a) => a.name);
  const label = `Pipe, row ${Math.floor(index / board.w) + 1}, column ${(index % board.w) + 1}: open ${open.join(" and ")}${lit ? ", connected" : ""}`;

  return (
    <g
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={solved ? -1 : 0}
      aria-label={label}
      onClick={() => !solved && onTap(index)}
      onKeyDown={onKey}
      className={`group outline-none ${solved ? "" : "cursor-pointer"}`}
    >
      <rect
        x={-ARM + 3}
        y={-ARM + 3}
        width={CELL - 6}
        height={CELL - 6}
        rx={10}
        fill="#0b1a2e"
        stroke="#5ce1e6"
        strokeOpacity={0.12}
        className="transition-[stroke-opacity] group-hover:stroke-opacity-50 group-focus-visible:stroke-amber group-focus-visible:stroke-opacity-100"
      />
      <g
        style={{
          transform: `rotate(${turns * 90}deg)`,
          transformBox: "fill-box",
          transformOrigin: "center",
          transition: "transform 180ms cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      >
        {/* Drawn in its designed orientation and spun into place, so taps animate. */}
        <Pipe mask={rotate(mask, -turns)} lit={lit} solved={solved} />
      </g>
    </g>
  );
}

const nextBoard = (board: Board, i: number) => {
  const next = { ...board, cells: [...board.cells], turns: [...board.turns] };
  tap(next, i);
  return next;
};

function rating(taps: number, par: number) {
  if (taps <= par + 3) return 3;
  if (taps <= par * 1.6) return 2;
  return 1;
}

/** Untangle the Pipeline: turn the pipes until the flow runs from input to output. */
export default function PipeGame() {
  const celebrate = useStore((s) => s.celebrate);
  const [level, setLevel] = useState(0);
  const [board, setBoard] = useState(() => createBoard(LEVELS[0]));
  const [results, setResults] = useState<number[]>([]);

  const { connected, solved } = flow(board);
  const finished = results.length === LEVELS.length;
  const last = level === LEVELS.length - 1;

  const onTap = (i: number) => {
    const next = nextBoard(board, i);
    setBoard(next);
    if (flow(next).solved && last) celebrate();
  };
  const goNext = () => {
    setResults((r) => [...r, board.taps]);
    if (last) return;
    setLevel(level + 1);
    setBoard(createBoard(LEVELS[level + 1]));
  };
  const restart = () => {
    setResults([]);
    setLevel(0);
    setBoard(createBoard(LEVELS[0]));
  };

  const width = board.w * CELL + MARGIN * 2;
  const height = board.h * CELL + 16;
  const inY = (board.inRow + 0.5) * CELL + 8;
  const outY = (board.outRow + 0.5) * CELL + 8;
  const totalTaps = results.reduce((a, b) => a + b, 0);
  const totalPar = PARS.reduce((a, b) => a + b, 0);
  const stars = rating(totalTaps, totalPar);

  return (
    <div className="sheet p-4 md:p-6">
      <div className="flex items-baseline justify-between gap-4 font-mono text-xs">
        <p className="text-cyan">
          board {level + 1} / {LEVELS.length}
        </p>
        <p className="text-muted tabular-nums">{board.taps} taps</p>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto mt-4 block w-full max-w-[34rem] select-none"
        role="group"
        aria-label={`Pipe puzzle, ${board.w} by ${board.h}. ${solved ? "Solved." : `${connected.size} pipes connected to the input.`}`}
      >
        <line x1={14} y1={inY} x2={MARGIN} y2={inY} stroke="#5ce1e6" strokeWidth={14} strokeLinecap="round" />
        <circle cx={14} cy={inY} r={11} fill="#0a1628" stroke="#5ce1e6" strokeWidth={4} />
        <line
          x1={width - MARGIN}
          y1={outY}
          x2={width - 16}
          y2={outY}
          stroke={solved ? "#5ce1e6" : "#2d4866"}
          strokeWidth={14}
          strokeLinecap="round"
        />
        <circle
          cx={width - 16}
          cy={outY}
          r={solved ? 15 : 12}
          fill="#ffb547"
          className={solved ? "motion-safe:animate-pulse" : undefined}
        />
        {board.cells.map((_, i) => (
          <Tile key={`${level}-${i}`} board={board} index={i} lit={connected.has(i)} solved={solved} onTap={onTap} />
        ))}
      </svg>

      <div className="mt-5 min-h-24 border-t border-cyan/15 pt-4" role="status">
        {finished ? (
          <div>
            <p className="font-mono text-xs text-cyan">pipeline untangled</p>
            <p className="mt-2 text-3xl tracking-widest text-amber" aria-label={`${stars} of 3 stars`}>
              {"★".repeat(stars)}
              <span className="text-line/20">{"★".repeat(3 - stars)}</span>
            </p>
            <p className="mt-2 text-sm text-line/85">
              {LEVELS.length} boards in {totalTaps} taps (par {totalPar}).
            </p>
            <p className="mt-3 text-line/85">{profile.game.punchline}</p>
            <button
              type="button"
              onClick={restart}
              className="mt-4 border border-cyan/40 px-5 py-2.5 transition-colors hover:border-cyan hover:text-cyan"
            >
              Play again
            </button>
          </div>
        ) : solved ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p>
              <span className="font-semibold text-amber">Flowing.</span>{" "}
              <span className="text-line/85">
                Solved in {board.taps} taps <span className="text-muted">(par {PARS[level]})</span>
              </span>
            </p>
            <button
              type="button"
              onClick={goNext}
              className="bg-amber px-5 py-2.5 font-semibold text-bg-deep transition-shadow hover:shadow-[0_0_32px_-4px_var(--amber)]"
            >
              {last ? "See result" : "Next board"}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted">
              Tap a pipe to turn it. Lit pipes are connected to the input; get the flow to the amber output.
            </p>
            {board.taps > 0 && (
              <button
                type="button"
                onClick={() => setBoard(createBoard(LEVELS[level]))}
                className="font-mono text-xs text-muted underline-offset-4 hover:text-line hover:underline"
              >
                reset board
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
