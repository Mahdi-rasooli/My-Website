"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { profile } from "@/content/profile";
import { useStore } from "@/lib/store";
import { useIsMobile } from "@/lib/useEnvironment";
import {
  ARRIVAL_INTERVAL,
  BASELINE_PROCESS_TIME,
  BUDGET,
  COST,
  SINK,
  STATIONS,
  TRAVEL,
  applyFix,
  canApply,
  createLine,
  metrics,
  outcome,
  serviceTime,
  stars,
  step,
  type FixKind,
  type Line,
} from "./lineSim";

type Phase = "ready" | "playing" | "won";
type Point = [number, number];
type Tone = "move" | "work" | "wait" | "late";

const TILE = { w: 112, h: 64 };
const LAYOUTS = {
  row: {
    width: 1000,
    height: 320,
    input: [36, 230] as Point,
    output: [964, 230] as Point,
    station: (i: number): Point => [138 + i * 145, 230],
    stack: (n: number): Point => [0, -46 - n * 15],
    maxStack: 9,
  },
  column: {
    width: 360,
    height: 840,
    input: [96, 28] as Point,
    output: [96, 796] as Point,
    station: (i: number): Point => [96, 112 + i * 124],
    stack: (n: number): Point => [76 + n * 32, 0],
    maxStack: 5,
  },
};
type Layout = (typeof LAYOUTS)["row"];

const TONE: Record<Tone, string> = { move: "#ffb547", work: "#ffb547", wait: "#e39a35", late: "#ff7a5c" };
const JAM = "#ff7a5c";
const ARRIVALS_PER_MIN = Math.round(60 / ARRIVAL_INTERVAL);
const FIX_LABEL: Record<FixKind, string> = {
  worker: "Add a person",
  ai: "Automate with AI",
  remove: "Remove this step",
};

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

/** Win burst: bricks thrown up and back over the line from the output, each on its own arc. */
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  dx: -60 - ((i * 53) % 420),
  peak: -110 - ((i * 37) % 120),
  dy: 40 + ((i * 29) % 70),
  r: ((i * 97) % 540) - 270,
  delay: (i % 6) * 0.07,
  tone: (["move", "work", "late"] as const)[i % 3],
}));

/** A plain snapshot of the line for rendering (the simulation itself lives in a ref). */
function snapshot(line: Line, layout: Layout) {
  const point = (i: number): Point => (i === -1 ? layout.input : i === SINK ? layout.output : layout.station(i));
  const bricks: { id: number; x: number; y: number; tone: Tone; scale: number }[] = [];
  const stacked = new Array<number>(SINK).fill(0);
  const working = new Array<number>(SINK).fill(0);

  const queued = line.items.filter((it) => it.phase === "queue").sort((a, b) => a.queuedAt - b.queuedAt || a.id - b.id);
  for (const it of queued) {
    const n = stacked[it.station]++;
    if (n >= layout.maxStack) continue;
    const [x, y] = point(it.station);
    const [dx, dy] = layout.stack(n);
    bricks.push({ id: it.id, x: x + dx, y: y + dy, tone: line.time - it.queuedAt > 3 ? "late" : "wait", scale: 1 });
  }
  for (const it of line.items) {
    if (it.phase === "travel") {
      const [ax, ay] = point(it.from);
      const [bx, by] = point(it.station);
      const k = ease(Math.min(it.t / TRAVEL, 1));
      bricks.push({ id: it.id, x: ax + (bx - ax) * k, y: ay + (by - ay) * k, tone: "move", scale: 0.85 });
    } else if (it.phase === "work") {
      const n = working[it.station]++;
      const [x, y] = point(it.station);
      const spread = line.stations[it.station].workers - 1;
      bricks.push({ id: it.id, x: x + (n - spread / 2) * 30, y: y + 8, tone: "work", scale: 0.7 });
    }
  }
  return {
    bricks,
    overflow: stacked.map((n) => Math.max(0, n - layout.maxStack)),
    stations: line.stations.map((s, i) => ({ ...s, service: serviceTime(line, i) })),
    m: metrics(line),
    budget: line.budget,
    outcome: outcome(line),
    shipped: line.shippedCount,
    stars: stars(line),
  };
}
type View = ReturnType<typeof snapshot>;

function Brick({ x, y, tone, scale }: { x: number; y: number; tone: Tone; scale: number }) {
  const fill = TONE[tone];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-10.5} y={-10.5} width={7} height={4} rx={1.2} fill={fill} />
      <rect x={3.5} y={-10.5} width={7} height={4} rx={1.2} fill={fill} />
      <rect x={-15} y={-7} width={30} height={14} rx={2.5} fill={fill} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
      <rect x={-12} y={-4.5} width={24} height={2} rx={1} fill="#fff" opacity={0.28} />
    </g>
  );
}

function Station({
  index,
  view,
  layout,
  selected,
  onSelect,
}: {
  index: number;
  view: View;
  layout: Layout;
  selected: boolean;
  onSelect: (i: number) => void;
}) {
  const def = STATIONS[index];
  const s = view.stations[index];
  const queue = view.m.queues[index];
  const jammed = !s.removed && queue >= 4;
  const [x, y] = layout.station(index);
  const stroke = s.removed
    ? "#3a4d68"
    : selected
      ? "#ffb547"
      : jammed
        ? JAM
        : s.automated
          ? "#5ce1e6"
          : "rgba(92,225,230,0.45)";
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onSelect(index);
  };
  const label = s.removed
    ? `${def.label}: removed`
    : `${def.label}: ${s.service.toFixed(1)} seconds per request, ${s.workers} ${s.workers === 1 ? "person" : "people"}, ${queue} waiting`;

  return (
    <g
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={s.removed ? -1 : 0}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => !s.removed && onSelect(index)}
      onKeyDown={onKey}
      className={`outline-none ${s.removed ? "" : "cursor-pointer"} [&:focus-visible>rect]:stroke-amber`}
      opacity={s.removed ? 0.4 : 1}
    >
      <rect
        x={-TILE.w / 2}
        y={-TILE.h / 2}
        width={TILE.w}
        height={TILE.h}
        rx={10}
        fill={s.automated ? "rgba(92,225,230,0.12)" : "#0b1a2e"}
        stroke={stroke}
        strokeWidth={selected || jammed ? 2.5 : 1.5}
        strokeDasharray={s.removed ? "5 5" : undefined}
        className={jammed ? "motion-safe:animate-pulse" : undefined}
      />
      <text
        x={-TILE.w / 2 + 10}
        y={-10}
        fontSize={14}
        fontWeight={600}
        fill="#e8f1ff"
        textDecoration={s.removed ? "line-through" : undefined}
      >
        {def.label}
      </text>
      {!s.removed && (
        <>
          {/* Bottom row: people on the left; on the right the time per request, behind an AI badge once automated. */}
          {Array.from({ length: s.workers }, (_, k) => (
            <circle key={k} cx={-TILE.w / 2 + 14 + k * 10} cy={22} r={3.2} fill="#e8f1ff" opacity={0.8} />
          ))}
          <text
            x={TILE.w / 2 - 10}
            y={26}
            fontSize={11}
            textAnchor="end"
            fill={s.automated ? "#5ce1e6" : "#7f93b2"}
            className="font-mono"
          >
            {s.service.toFixed(1)}s
          </text>
          {s.automated && (
            <g transform={`translate(${TILE.w / 2 - 60} 22)`}>
              <rect x={-11} y={-7} width={22} height={14} rx={7} fill="#5ce1e6" />
              <text y={4} fontSize={10} fontWeight={700} textAnchor="middle" fill="#060e1a">
                AI
              </text>
            </g>
          )}
        </>
      )}
    </g>
  );
}

function Meter({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-1 font-mono text-lg tabular-nums ${warn ? "text-amber" : "text-line"}`}>{value}</dd>
      {hint && <dd className="text-[11px] text-muted">{hint}</dd>}
    </div>
  );
}

function StationPanel({
  index,
  line,
  onFix,
}: {
  index: number | null;
  line: View | null;
  onFix: (i: number, fix: FixKind) => void;
}) {
  if (index === null || !line) {
    return (
      <p className="text-sm text-muted">
        Tap a station to inspect it. {ARRIVALS_PER_MIN} requests arrive every minute; find the step that cannot keep up.
      </p>
    );
  }
  const def = STATIONS[index];
  const s = line.stations[index];
  const perMin = Math.round((s.workers / serviceTime(line, index)) * 60);
  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-semibold">{def.label}</span>
        <span className={`font-mono text-xs ${perMin < ARRIVALS_PER_MIN ? "text-amber" : "text-cyan"}`}>
          handles {perMin}/min · needs {ARRIVALS_PER_MIN}/min
        </span>
      </p>
      <p className="mt-1 text-sm text-line/80">{def.blurb}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {(["worker", "ai", "remove"] as const).map((fix) => {
          const check = canApply(line, index, fix);
          return (
            <button
              key={fix}
              type="button"
              disabled={!check.ok}
              title={check.reason}
              onClick={() => onFix(index, fix)}
              className="border border-cyan/30 px-3 py-2.5 text-left text-sm transition-colors enabled:hover:border-cyan enabled:hover:text-cyan disabled:opacity-35"
            >
              <span className="block">{FIX_LABEL[fix]}</span>
              <span className="font-mono text-[11px] text-muted">{check.ok ? `costs ${COST[fix]}` : check.reason}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Result({ view, onReplay }: { view: View; onReplay: () => void }) {
  const after = view.m.processTime;
  const gain = Math.round((1 - after / BASELINE_PROCESS_TIME) * 100);
  const automated = STATIONS.filter((_, i) => view.stations[i].automated).map((s) => s.label);
  const removed = STATIONS.filter((_, i) => view.stations[i].removed).map((s) => s.label);
  const verdict = [
    "",
    "It flows. Now make it lean.",
    "Flowing, but you paid for it in people.",
    "Lean and flowing. That's the job.",
  ][view.stars];
  return (
    <div role="status">
      <p className="font-mono text-xs text-cyan">line optimized</p>
      <p className="mt-3 text-3xl tracking-widest text-amber" aria-label={`${view.stars} of 3 stars`}>
        {"★".repeat(view.stars)}
        <span className="text-line/20">{"★".repeat(3 - view.stars)}</span>
      </p>
      <p className="mt-2 text-xl font-bold">{verdict}</p>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-cyan/15 pt-4 text-sm">
        <div>
          <dt className="text-muted">Process time</dt>
          <dd className="mt-1 font-mono">
            {BASELINE_PROCESS_TIME.toFixed(1)}s → {after.toFixed(1)}s
          </dd>
          <dd className="font-semibold text-amber">−{gain}%</dd>
        </div>
        <div>
          <dt className="text-muted">People added</dt>
          <dd className="mt-1 font-mono">{view.m.peopleAdded}</dd>
        </div>
        <div>
          <dt className="text-muted">Changed</dt>
          <dd className="mt-1 text-xs leading-relaxed">
            {[...automated.map((l) => `${l} → AI`), ...removed.map((l) => `${l} cut`)].join(", ") || "headcount only"}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-line/85">{profile.game.punchline}</p>
      <button
        type="button"
        onClick={onReplay}
        className="mt-5 border border-cyan/40 px-5 py-2.5 transition-colors hover:border-cyan hover:text-cyan"
      >
        Play again
      </button>
    </div>
  );
}

/** Bottleneck Rush: requests pile up at a slow step; spend a few fixes to get the line flowing. */
export default function BottleneckGame() {
  const layout = LAYOUTS[useIsMobile() ? "column" : "row"];
  const celebrate = useStore((s) => s.celebrate);
  const lineRef = useRef<Line | null>(null);
  const visible = useRef(true);
  const root = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<View>(() => snapshot(createLine(), layout));

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => (visible.current = entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fixed-step simulation, rendered once per animation frame while on screen.
  useEffect(() => {
    if (phase === "ready") return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let optimizedFor = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const line = lineRef.current;
      if (line && visible.current) {
        acc += dt;
        while (acc >= 1 / 60) {
          step(line, 1 / 60);
          acc -= 1 / 60;
        }
        const next = snapshot(line, layout);
        optimizedFor = next.outcome === "optimized" ? optimizedFor + dt : 0;
        if (phase === "playing" && optimizedFor > 1.5) {
          setPhase("won");
          setSelected(null);
          celebrate();
        }
        setView(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, layout, celebrate]);

  const start = useCallback(() => {
    lineRef.current = createLine();
    setSelected(null);
    setPhase("playing");
  }, []);

  const fix = useCallback(
    (i: number, kind: FixKind) => {
      const line = lineRef.current;
      if (!line || !applyFix(line, i, kind)) return;
      if (line.stations[i].removed) setSelected(null);
      setView(snapshot(line, layout));
    },
    [layout],
  );

  const select = useCallback((i: number) => setSelected((cur) => (cur === i ? null : i)), []);

  const [ix, iy] = layout.input;
  const [ox, oy] = layout.output;
  const waiting = view.m.queues.reduce((a, b) => a + b, 0);
  const bottleneck = STATIONS[view.m.bottleneck]?.label ?? "A step";
  const status =
    phase === "won"
      ? "Line optimized."
      : view.outcome === "stuck"
        ? "Out of fixes and still jammed."
        : view.outcome === "draining"
          ? "Flowing. Clearing the backlog…"
          : phase === "playing"
            ? `${bottleneck} can't keep up.`
            : "";

  return (
    <div ref={root} className="sheet p-4 md:p-6">
      <div className="relative">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="block w-full select-none"
          role="group"
          aria-label="Request line: input, six stations, output"
        >
          <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="#5ce1e6" strokeOpacity={0.14} strokeWidth={12} />
          <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="#5ce1e6" strokeOpacity={0.55} strokeWidth={2.5} />
          {view.m.stable && phase !== "ready" && (
            <line
              x1={ix}
              y1={iy}
              x2={ox}
              y2={oy}
              stroke="#5ce1e6"
              strokeWidth={2.5}
              strokeDasharray="3 13"
              className="flow-dash"
            />
          )}
          <circle cx={ix} cy={iy} r={9} fill="#0a1628" stroke="#5ce1e6" strokeWidth={3} />
          <circle cx={ox} cy={oy} r={11} fill="#ffb547" />
          <text x={ox} y={oy + 30} textAnchor="middle" fontSize={12} fill="#7f93b2" className="font-mono">
            {view.shipped} shipped
          </text>

          {STATIONS.map((_, i) => (
            <Station key={i} index={i} view={view} layout={layout} selected={selected === i} onSelect={select} />
          ))}
          {view.overflow.map((n, i) => {
            if (!n) return null;
            const [x, y] = layout.station(i);
            const [dx, dy] = layout.stack(layout.maxStack);
            return (
              <text key={i} x={x + dx} y={y + dy + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={JAM}>
                +{n}
              </text>
            );
          })}
          {view.bricks.map((b) => (
            <Brick key={b.id} {...b} />
          ))}
          {phase === "won" && (
            <g transform={`translate(${ox} ${oy})`} aria-hidden>
              {CONFETTI.map((c, i) => (
                <g
                  key={i}
                  className="brick-pop"
                  style={
                    {
                      "--dx": `${c.dx}px`,
                      "--peak": `${c.peak}px`,
                      "--dy": `${c.dy}px`,
                      "--r": `${c.r}deg`,
                      animationDelay: `${c.delay}s`,
                    } as React.CSSProperties
                  }
                >
                  <Brick x={0} y={0} tone={c.tone} scale={0.9} />
                </g>
              ))}
            </g>
          )}
        </svg>

        {phase === "ready" && (
          <div className="absolute inset-0 grid place-items-center bg-bg-deep/55 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={start}
              className="bg-amber px-7 py-3.5 font-semibold text-bg-deep transition-shadow hover:shadow-[0_0_32px_-4px_var(--amber)]"
            >
              Start the line
            </button>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-cyan/15 pt-4 sm:grid-cols-4">
        <Meter
          label="Process time"
          value={`${view.m.processTime.toFixed(1)}s`}
          hint={`was ${BASELINE_PROCESS_TIME.toFixed(1)}s`}
        />
        <Meter
          label="Shipping"
          value={`${Math.round(view.m.throughputPerMin)}/min`}
          hint={`${ARRIVALS_PER_MIN}/min arriving`}
          warn={phase !== "ready" && !view.m.stable}
        />
        <Meter label="Waiting" value={`${waiting}`} hint="requests in queues" warn={waiting >= 6} />
        <div>
          <dt className="text-xs text-muted">Fixes left</dt>
          <dd className="mt-2 flex gap-1.5" aria-label={`${view.budget} of ${BUDGET} fixes left`}>
            {Array.from({ length: BUDGET }, (_, k) => (
              <span key={k} className={`size-3 ${k < view.budget ? "bg-amber" : "border border-amber/40"}`} />
            ))}
          </dd>
        </div>
      </dl>

      <div className="mt-5 min-h-30 border-t border-cyan/15 pt-4">
        {phase === "won" ? (
          <Result view={view} onReplay={start} />
        ) : view.outcome === "stuck" ? (
          <div role="status">
            <p className="font-semibold text-amber">Out of fixes, and {bottleneck} is still the bottleneck.</p>
            <p className="mt-1 text-sm text-line/80">
              Hint: adding people is not the only lever. What could AI take over, and which steps add nothing?
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-4 border border-cyan/40 px-5 py-2.5 transition-colors hover:border-cyan hover:text-cyan"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {phase === "playing" && (
              <p className="mb-3 font-mono text-xs text-cyan" aria-hidden>
                {status}
              </p>
            )}
            <StationPanel index={phase === "playing" ? selected : null} line={view} onFix={fix} />
          </>
        )}
      </div>
    </div>
  );
}
