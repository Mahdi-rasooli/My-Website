"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig, Reorder, animate, useDragControls } from "motion/react";
import { profile } from "@/content/profile";
import { GAME_DURATION, scoreGame, shuffleSteps, type ScoreResult, type Step } from "./gameLogic";

type Phase = "ready" | "playing" | "done";

function GripIcon() {
  return (
    <svg viewBox="0 0 10 16" className="h-4 w-2.5" aria-hidden>
      {[2, 8].map((x) => [2, 8, 14].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} fill="currentColor" />))}
    </svg>
  );
}

function StepRow({
  step,
  index,
  count,
  onMove,
  onRemove,
  onTouch,
}: {
  step: Step;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  onTouch: () => void;
}) {
  const controls = useDragControls();
  const iconButton =
    "grid size-7 place-items-center text-muted transition-colors hover:text-line disabled:opacity-25 disabled:hover:text-muted";

  return (
    <Reorder.Item
      value={step}
      dragListener={false}
      dragControls={controls}
      onDragStart={onTouch}
      className="flex items-center gap-2 border border-cyan/20 bg-bg-deep/90 py-0.5 pr-1 pl-1.5 select-none"
      whileDrag={{ scale: 1.02, borderColor: "rgba(255,181,71,0.8)", zIndex: 10 }}
    >
      <button
        type="button"
        aria-label={`Drag ${step.label}`}
        onPointerDown={(e) => {
          onTouch();
          controls.start(e);
        }}
        className="grid h-8 w-7 cursor-grab touch-none place-items-center text-cyan/70 active:cursor-grabbing"
        tabIndex={-1}
      >
        <GripIcon />
      </button>
      <span className="w-5 font-mono text-xs text-muted">{index + 1}</span>
      <span className="flex-1 text-sm">{step.label}</span>
      <button type="button" aria-label={`Move ${step.label} up`} className={iconButton} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        ↑
      </button>
      <button
        type="button"
        aria-label={`Move ${step.label} down`}
        className={iconButton}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        ↓
      </button>
      <button
        type="button"
        aria-label={`Remove ${step.label}`}
        className="grid size-7 place-items-center text-muted transition-colors hover:text-amber"
        onClick={() => onRemove(step.id)}
      >
        ✕
      </button>
    </Reorder.Item>
  );
}

function Result({ result, onReplay }: { result: ScoreResult; onReplay: () => void }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const controls = animate(0, result.score, { duration: 1.2, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [result.score]);

  return (
    <div className="sheet p-6 md:p-8" role="status">
      <p className="font-mono text-xs text-cyan">process shipped</p>
      <p className="mt-4 flex items-baseline gap-3">
        <span className="text-7xl font-extrabold text-amber [font-variation-settings:'wdth'_120]">{shown}</span>
        <span className="text-muted">/ 100</span>
      </p>
      <p className="mt-2 text-2xl font-bold">{result.rank}</p>

      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-cyan/15 pt-5 text-sm">
        <div>
          <dt className="text-muted">Flow order</dt>
          <dd className="mt-1 font-semibold">{result.orderPoints} / 60</dd>
        </div>
        <div>
          <dt className="text-muted">Waste cut</dt>
          <dd className="mt-1 font-semibold">{result.wastePoints} / 30</dd>
        </div>
        <div>
          <dt className="text-muted">Speed</dt>
          <dd className="mt-1 font-semibold">{result.timePoints} / 10</dd>
        </div>
      </dl>

      {result.broken && (
        <p className="mt-5 text-sm text-amber">
          You deleted {result.essentialsDeleted === 1 ? "an essential step" : `${result.essentialsDeleted} essential steps`}, so the
          process broke. Lean is good; missing steps are not.
        </p>
      )}
      <p className="mt-5 text-line/85">{profile.game.punchline}</p>
      <button type="button" onClick={onReplay} className="mt-6 border border-cyan/40 px-5 py-3 transition-colors hover:border-cyan hover:text-cyan">
        Play again
      </button>
    </div>
  );
}

/** Drag the morning routine into an efficient flow and cut the waste within 20 seconds. */
export default function OptimizeGame() {
  const [steps, setSteps] = useState<Step[]>(() => shuffleSteps());
  const [phase, setPhase] = useState<Phase>("ready");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const startedAt = useRef(0);
  const finished = useRef(false);
  const stepsRef = useRef(steps);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const finish = useCallback((remaining: number) => {
    if (finished.current) return;
    finished.current = true;
    setTimeLeft(remaining);
    setResult(scoreGame(stepsRef.current, remaining));
    setPhase("done");
  }, []);

  const touch = useCallback(() => {
    if (phase !== "ready") return;
    startedAt.current = performance.now();
    setPhase("playing");
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    let frame = 0;
    const tick = () => {
      const remaining = Math.max(0, GAME_DURATION - (performance.now() - startedAt.current) / 1000);
      setTimeLeft(Math.ceil(remaining * 10) / 10);
      if (remaining <= 0) finish(0);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, finish]);

  const move = (from: number, to: number) => {
    touch();
    setSteps((s) => {
      const next = [...s];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const remove = (id: string) => {
    touch();
    setSteps((s) => s.filter((step) => step.id !== id));
  };

  const replay = () => {
    finished.current = false;
    setSteps(shuffleSteps());
    setTimeLeft(GAME_DURATION);
    setResult(null);
    setPhase("ready");
  };

  if (phase === "done" && result) return <Result result={result} onReplay={replay} />;

  const urgent = phase === "playing" && timeLeft <= 5;
  return (
    <MotionConfig reducedMotion="user">
      <div className="sheet p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs text-muted">
            {phase === "ready" ? "Timer starts on your first move" : `${steps.length} steps left`}
          </p>
          <p className={`font-mono text-sm tabular-nums ${urgent ? "text-amber" : "text-line"}`} aria-label={`${Math.ceil(timeLeft)} seconds left`}>
            {timeLeft.toFixed(1)}s
          </p>
        </div>
        <div className="mt-3 h-px w-full bg-cyan/15">
          <div className="h-px bg-amber" style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }} />
        </div>

        <Reorder.Group
          axis="y"
          values={steps}
          onReorder={(next) => {
            touch();
            setSteps(next);
          }}
          className="mt-4 flex flex-col gap-1"
        >
          {steps.map((step, i) => (
            <StepRow key={step.id} step={step} index={i} count={steps.length} onMove={move} onRemove={remove} onTouch={touch} />
          ))}
        </Reorder.Group>

        <button
          type="button"
          onClick={() => {
            touch();
            finish(phase === "ready" ? GAME_DURATION : timeLeft);
          }}
          className="mt-5 w-full bg-amber py-3.5 font-semibold text-bg-deep transition-shadow hover:shadow-[0_0_32px_-4px_var(--amber)]"
        >
          Ship it
        </button>
      </div>
    </MotionConfig>
  );
}
