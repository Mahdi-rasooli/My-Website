/**
 * Bottleneck Rush: a tiny discrete simulation of a request-handling line.
 * Requests arrive at a steady pace and pass through each station in turn; a station
 * with too little capacity builds a queue. The player spends a small budget on fixes:
 * add a person, automate a step with AI, or remove a step that adds nothing.
 */

export type FixKind = "worker" | "ai" | "remove";

export interface StationDef {
  id: string;
  label: string;
  /** Seconds one person needs per request. */
  service: number;
  /** Needed for the request to be done at all; waste steps can be removed. */
  essential: boolean;
  /** Seconds per request once automated with AI; absent if AI cannot help. */
  aiService?: number;
  blurb: string;
}

export const STATIONS: readonly StationDef[] = [
  { id: "intake", label: "Intake", service: 0.3, essential: true, blurb: "Logs each new request." },
  {
    id: "review",
    label: "Review",
    service: 1.5,
    essential: true,
    aiService: 0.5,
    blurb: "One person reads every request by hand.",
  },
  { id: "recheck", label: "Re-check", service: 1.2, essential: false, blurb: "Reviews the review. Adds nothing." },
  { id: "approve", label: "Approve", service: 0.5, essential: true, aiService: 0.2, blurb: "Signs off the decision." },
  {
    id: "print",
    label: "Print & sign",
    service: 1.0,
    essential: false,
    blurb: "Prints it, signs it, scans it back in.",
  },
  { id: "ship", label: "Ship", service: 0.4, essential: true, blurb: "Sends the result out." },
];

/** A new request arrives every this many seconds. */
export const ARRIVAL_INTERVAL = 0.8;
export const BUDGET = 4;
export const COST: Record<FixKind, number> = { worker: 1, ai: 2, remove: 1 };
export const MAX_WORKERS = 3;
/** Seconds a request takes to ride the pipe between stations. */
export const TRAVEL = 0.4;
export const BASELINE_PROCESS_TIME = STATIONS.reduce((sum, s) => sum + s.service, 0);

/** Index used as the destination after the last station. */
export const SINK = STATIONS.length;
const MAX_WIP = 48;
const THROUGHPUT_WINDOW = 20;

export interface StationState {
  workers: number;
  automated: boolean;
  removed: boolean;
}

export interface Item {
  id: number;
  /** Station it last left (-1 = the input). */
  from: number;
  /** Station it is heading to or at (SINK = the output). */
  station: number;
  phase: "travel" | "queue" | "work";
  /** Seconds spent in the current phase. */
  t: number;
  queuedAt: number;
  bornAt: number;
}

export interface Line {
  time: number;
  stations: StationState[];
  items: Item[];
  nextId: number;
  spawnIn: number;
  budget: number;
  shippedCount: number;
  /** Ship times within the throughput window. */
  recent: number[];
}

export const createLine = (): Line => ({
  time: 0,
  stations: STATIONS.map(() => ({ workers: 1, automated: false, removed: false })),
  items: [],
  nextId: 0,
  spawnIn: 0,
  budget: BUDGET,
  shippedCount: 0,
  recent: [],
});

export const serviceTime = (line: Pick<Line, "stations">, i: number) =>
  line.stations[i].automated ? STATIONS[i].aiService! : STATIONS[i].service;

function nextActive(line: Line, from: number) {
  for (let i = from + 1; i < SINK; i++) if (!line.stations[i].removed) return i;
  return SINK;
}

export function canApply(
  line: Pick<Line, "stations" | "budget">,
  i: number,
  fix: FixKind,
): { ok: boolean; reason?: string } {
  const s = line.stations[i];
  const def = STATIONS[i];
  if (s.removed) return { ok: false, reason: "This step is already gone." };
  if (fix === "remove" && def.essential) return { ok: false, reason: "Essential: every request needs this step." };
  if (fix === "ai" && !def.aiService) return { ok: false, reason: "Nothing here that AI does better." };
  if (fix === "ai" && s.automated) return { ok: false, reason: "Already automated." };
  if (fix === "worker" && s.workers >= MAX_WORKERS)
    return { ok: false, reason: `At most ${MAX_WORKERS} people per step.` };
  if (line.budget < COST[fix]) return { ok: false, reason: "Not enough fixes left." };
  return { ok: true };
}

/** Applies a fix if allowed; requests at a removed station move straight on. */
export function applyFix(line: Line, i: number, fix: FixKind): boolean {
  if (!canApply(line, i, fix).ok) return false;
  line.budget -= COST[fix];
  const s = line.stations[i];
  if (fix === "worker") s.workers++;
  else if (fix === "ai") s.automated = true;
  else {
    s.removed = true;
    const to = nextActive(line, i);
    for (const item of line.items) {
      if (item.station !== i) continue;
      item.from = i;
      item.station = to;
      item.phase = "travel";
      item.t = 0;
    }
  }
  return true;
}

/** Advances the line by dt seconds. */
export function step(line: Line, dt: number) {
  line.time += dt;
  line.spawnIn -= dt;
  while (line.spawnIn <= 0) {
    line.spawnIn += ARRIVAL_INTERVAL;
    if (line.items.length >= MAX_WIP) continue;
    line.items.push({
      id: line.nextId++,
      from: -1,
      station: nextActive(line, -1),
      phase: "travel",
      t: 0,
      queuedAt: 0,
      bornAt: line.time,
    });
  }

  let shipped = false;
  for (const item of line.items) {
    item.t += dt;
    if (item.phase === "work" && item.t >= serviceTime(line, item.station)) {
      item.from = item.station;
      item.station = nextActive(line, item.station);
      item.phase = "travel";
      item.t = 0;
    } else if (item.phase === "travel" && item.t >= TRAVEL) {
      if (item.station === SINK) {
        shipped = true;
        line.shippedCount++;
        line.recent.push(line.time);
        item.station = -1; // marked for removal
        continue;
      }
      item.phase = "queue";
      item.queuedAt = line.time;
      item.t = 0;
    }
  }
  if (shipped) line.items = line.items.filter((item) => item.station !== -1);

  for (let i = 0; i < SINK; i++) {
    const s = line.stations[i];
    if (s.removed) continue;
    let busy = 0;
    const waiting: Item[] = [];
    for (const item of line.items) {
      if (item.station !== i) continue;
      if (item.phase === "work") busy++;
      else if (item.phase === "queue") waiting.push(item);
    }
    waiting.sort((a, b) => a.queuedAt - b.queuedAt || a.id - b.id);
    for (const item of waiting) {
      if (busy >= s.workers) break;
      item.phase = "work";
      item.t = 0;
      busy++;
    }
  }

  while (line.recent.length && line.recent[0] < line.time - THROUGHPUT_WINDOW) line.recent.shift();
}

/** Runs the line for a number of seconds in fixed steps. */
export function run(line: Line, seconds: number, dt = 1 / 60) {
  for (let t = 0; t < seconds - 1e-9; t += dt) step(line, dt);
}

export function metrics(line: Line) {
  let processTime = 0;
  let bottleneck = -1;
  let minCapacity = Infinity;
  let peopleAdded = 0;
  line.stations.forEach((s, i) => {
    if (s.removed) return;
    const service = serviceTime(line, i);
    processTime += service;
    peopleAdded += s.workers - 1;
    const capacity = s.workers / service;
    if (capacity < minCapacity) {
      minCapacity = capacity;
      bottleneck = i;
    }
  });
  const queues = STATIONS.map((_, i) => line.items.filter((it) => it.station === i && it.phase === "queue").length);
  const window = Math.min(line.time, THROUGHPUT_WINDOW);
  return {
    /** Seconds of actual work per request (no waiting). */
    processTime,
    bottleneck,
    stable: minCapacity >= 1 / ARRIVAL_INTERVAL - 1e-9,
    queues,
    wip: line.items.length,
    throughputPerMin: window > 0 ? (line.recent.length / window) * 60 : 0,
    peopleAdded,
  };
}

export type Outcome = "jammed" | "draining" | "optimized" | "stuck";

export function outcome(line: Line): Outcome {
  const m = metrics(line);
  if (!m.stable) return line.budget === 0 ? "stuck" : "jammed";
  return Math.max(...m.queues) <= 2 ? "optimized" : "draining";
}

/** Three stars for the lean answer (AI plus cutting waste), two for buying capacity with people. */
export function stars(line: Line): 1 | 2 | 3 {
  const { processTime } = metrics(line);
  if (processTime <= 2.0 + 1e-9) return 3;
  if (processTime <= 3.0 + 1e-9) return 2;
  return 1;
}
