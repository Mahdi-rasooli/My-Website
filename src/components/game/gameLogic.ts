export type StepKind = "essential" | "waste";

export interface Step {
  id: string;
  label: string;
  kind: StepKind;
  /** Position in the ideal flow for essential steps; -1 for waste. */
  rank: number;
}

export type Rank = "Chaos Agent" | "Process Apprentice" | "Flow Engineer" | "Systems Architect";

export interface ScoreResult {
  score: number;
  rank: Rank;
  orderPoints: number;
  wastePoints: number;
  timePoints: number;
  wasteRemoved: number;
  essentialsDeleted: number;
  broken: boolean;
}

export const GAME_DURATION = 20;

export const STEPS: readonly Step[] = [
  { id: "wake", label: "Wake up", kind: "essential", rank: 0 },
  { id: "shower", label: "Shower", kind: "essential", rank: 1 },
  { id: "coffee", label: "Make coffee", kind: "essential", rank: 2 },
  { id: "breakfast", label: "Breakfast", kind: "essential", rank: 3 },
  { id: "email", label: "Check email", kind: "essential", rank: 4 },
  { id: "commute", label: "Commute", kind: "essential", rank: 5 },
  { id: "work", label: "Start work", kind: "essential", rank: 6 },
  { id: "snooze", label: "Snooze alarm", kind: "waste", rank: -1 },
  { id: "social", label: "Scroll social media", kind: "waste", rank: -1 },
  { id: "phone", label: "Check phone again", kind: "waste", rank: -1 },
  { id: "reread", label: "Re-read same email", kind: "waste", rank: -1 },
];

const ESSENTIAL_COUNT = STEPS.filter((s) => s.kind === "essential").length;
const WASTE_COUNT = STEPS.length - ESSENTIAL_COUNT;

const ORDER_POINTS = 60;
const WASTE_POINTS_EACH = 30 / WASTE_COUNT;
const TIME_POINTS = 10;
const DELETED_ESSENTIAL_PENALTY = 15;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Share of essential-step pairs that appear in the correct relative order. */
export function orderFraction(steps: readonly Step[]): number {
  const ranks = steps.filter((s) => s.kind === "essential").map((s) => s.rank);
  if (ranks.length < 2) return 0;
  let correct = 0;
  let total = 0;
  for (let i = 0; i < ranks.length; i++) {
    for (let j = i + 1; j < ranks.length; j++) {
      total++;
      if (ranks[i] < ranks[j]) correct++;
    }
  }
  return correct / total;
}

export function rankFor(score: number): Rank {
  if (score >= 90) return "Systems Architect";
  if (score >= 70) return "Flow Engineer";
  if (score >= 40) return "Process Apprentice";
  return "Chaos Agent";
}

/** Score the board the player shipped. `kept` is the final list, in order. */
export function scoreGame(kept: readonly Step[], timeLeft: number, duration = GAME_DURATION): ScoreResult {
  const essentialsKept = kept.filter((s) => s.kind === "essential").length;
  const essentialsDeleted = ESSENTIAL_COUNT - essentialsKept;
  const wasteRemoved = WASTE_COUNT - (kept.length - essentialsKept);

  const orderPoints = orderFraction(kept) * ORDER_POINTS;
  const wastePoints = wasteRemoved * WASTE_POINTS_EACH;
  const timePoints = clamp(timeLeft / duration, 0, 1) * TIME_POINTS;
  const penalty = essentialsDeleted * DELETED_ESSENTIAL_PENALTY;

  const score = Math.round(clamp(orderPoints + wastePoints + timePoints - penalty, 0, 100));
  return {
    score,
    rank: rankFor(score),
    orderPoints: Math.round(orderPoints),
    wastePoints: Math.round(wastePoints),
    timePoints: Math.round(timePoints),
    wasteRemoved,
    essentialsDeleted,
    broken: essentialsDeleted > 0,
  };
}

/** Fisher–Yates shuffle that never hands the player an (almost) solved board. */
export function shuffleSteps(rand: () => number = Math.random): Step[] {
  for (let attempt = 0; attempt < 10; attempt++) {
    const deck = [...STEPS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (orderFraction(deck) < 0.75) return deck;
  }
  return [...STEPS].reverse();
}
