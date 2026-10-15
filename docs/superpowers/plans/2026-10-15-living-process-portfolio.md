# Living Process Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Mahdi Rasouli's single-page 3D "Living Process" portfolio as a static Next.js site.

**Architecture:** A fixed react-three-fiber canvas renders a process-diagram world behind a normal scrolling HTML document. Scroll position is converted to a continuous `track` value (0 = hero … 6 = contact) stored in a mutable scene-state object that the 3D scene reads every frame; React-visible state (optimized, active stop, quality) lives in a zustand store. Pure logic (age, track math, game scoring) is unit-tested; visuals are verified in the browser.

**Tech Stack:** Next.js 16.4 (App Router, `output: 'export'`), React 19, TypeScript strict, Tailwind CSS 4, three 0.186, @react-three/fiber 9, @react-three/drei 10, GSAP 3.15, Lenis 1.3, Motion 14, zustand 5, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-15-living-process-portfolio-design.md`

## Global Constraints

- Static export only: no API routes, no server actions, no runtime server features.
- Colors exactly: bg `#0A1628`, bg-deep `#060E1A`, grid `rgba(120,170,255,0.08)`, line `#E8F1FF`, cyan `#5CE1E6`, amber `#FFB547`, muted `#7F93B2`.
- Fonts: Unbounded (display), Inter (body), JetBrains Mono (labels) via `next/font/google`.
- No full-screen bloom/postprocessing. DPR capped at 1.75 (mobile 1).
- 3D canvas is decorative: `aria-hidden`, all content in HTML.
- All personal copy comes from `src/content/profile.ts`; unknowns marked `TODO(mahdi)`.
- Respect `prefers-reduced-motion`; site usable without WebGL.
- Commit after each task (user-authorized). No pushing.

## Review Focus

1. **Initial game shuffle already solved** — visitors should never start with a pre-solved board → test in Task 3.
2. **Scroll beyond panel bounds / zero-height panels** — track must clamp to [0, 6] and never be NaN → tests in Task 4.
3. **Timer while tab hidden / double "Ship it"** — game must finish exactly once; timeout yields time bonus 0 → guarded in Task 9 by a `finished` flag and tested via `scoreGame(…, 0)` in Task 3.
4. **Touch drag vs page scroll on mobile** — reordering cards must not hijack page scroll → drag handle only with `touch-action: none` (Task 9).
5. **No WebGL / reduced motion** — must render the static diagram and skip autoplay → Task 10 + browser check in Task 11.

## File map

| File | Responsibility |
|---|---|
| `src/content/profile.ts` | Typed profile content |
| `src/lib/age.ts` | Age from ISO birth date |
| `src/lib/track.ts` | Scroll → track math, stops, segment blending |
| `src/lib/sceneState.ts` | Mutable per-frame values (track, untangle, pointer) |
| `src/lib/store.ts` | zustand: optimized, activeStop, quality, booted |
| `src/lib/useEnvironment.ts` | reduced-motion, mobile, WebGL detection hooks |
| `src/lib/world.ts` | 3D layout: node positions, curves, camera stops |
| `src/components/ScrollDriver.tsx` | Lenis + panel measurement → sceneState/store |
| `src/components/sections/*` | Boot, Hero, Journey, NodeCard, Contact |
| `src/components/scene/*` | Experience, ProcessPipes, DataPulses, NodeStations, CameraRig, MiniMahdi |
| `src/components/game/*` | gameLogic.ts, OptimizeGame.tsx |
| `src/components/fallback/StaticDiagram.tsx` | SVG flow for no-WebGL |

---

### Task 1: Scaffold project

**Files:** project root (create-next-app), `next.config.ts`, `vitest.config.ts`, `package.json`

- [ ] `git init`, commit spec + plan.
- [ ] `npx create-next-app@16.4.1` into a temp dir (TS, Tailwind, ESLint, App Router, `src/`, alias `@/*`), move files into repo root.
- [ ] Install: `three @react-three/fiber @react-three/drei gsap lenis motion zustand`; dev: `@types/three vitest`.
- [ ] `next.config.ts`: `output: 'export'`, `images: { unoptimized: true }`, `reactStrictMode: true`.
- [ ] `vitest.config.ts` with `@` alias, `environment: 'node'`; script `"test": "vitest run"`.
- [ ] Verify `npm run build` produces `out/`. Commit `chore: scaffold Next.js 16 static app`.

### Task 2: Content model + age

**Files:** Create `src/content/profile.ts`, `src/lib/age.ts`, `src/lib/age.test.ts`

**Produces:** `profile: Profile`, `type JourneyNode`, `type NodeId = 'boot'|'web'|'ml'|'avitec'`, `getAge(birthISO: string, now?: Date): number`.

- [ ] Failing test:

```ts
import { describe, it, expect } from 'vitest';
import { getAge } from './age';

describe('getAge', () => {
  it('counts full years after the birthday', () => {
    expect(getAge('2003-09-03', new Date(2026, 9, 15))).toBe(23);
  });
  it('does not count the year before the birthday', () => {
    expect(getAge('2003-09-03', new Date(2026, 8, 2))).toBe(22);
  });
  it('counts the year on the birthday itself', () => {
    expect(getAge('2003-09-03', new Date(2026, 8, 3))).toBe(23);
  });
});
```

- [ ] Run `npm test` → FAIL (module missing).
- [ ] Implement:

```ts
export function getAge(birthISO: string, now: Date = new Date()): number {
  const [year, month, day] = birthISO.split('-').map(Number);
  const m = now.getMonth() + 1;
  const beforeBirthday = m < month || (m === month && now.getDate() < day);
  return now.getFullYear() - year - (beforeBirthday ? 1 : 0);
}
```

- [ ] `profile.ts` types per spec §9 with real known facts and `TODO(mahdi)` placeholders.
- [ ] `npm test` → PASS. Commit `feat: add typed profile content and age helper`.

### Task 3: Game logic (TDD)

**Files:** Create `src/components/game/gameLogic.ts`, `src/components/game/gameLogic.test.ts`

**Produces:** `type Step { id; label; kind: 'essential'|'waste'; rank: number }`, `STEPS`, `GAME_DURATION = 20`, `orderFraction(kept)`, `rankFor(score)`, `scoreGame(kept, timeLeft, duration?) → ScoreResult`, `shuffleSteps(rand?) → Step[]`.

- [ ] Failing tests:

```ts
import { describe, it, expect } from 'vitest';
import { STEPS, orderFraction, rankFor, scoreGame, shuffleSteps, GAME_DURATION } from './gameLogic';

const essentials = STEPS.filter((s) => s.kind === 'essential');
const waste = STEPS.filter((s) => s.kind === 'waste');

describe('orderFraction', () => {
  it('is 1 for perfectly ordered essentials', () => {
    expect(orderFraction(essentials)).toBe(1);
  });
  it('is 0 for reversed essentials', () => {
    expect(orderFraction([...essentials].reverse())).toBe(0);
  });
  it('ignores waste cards', () => {
    expect(orderFraction([waste[0], ...essentials, waste[1]])).toBe(1);
  });
  it('is 0 with fewer than two essentials', () => {
    expect(orderFraction([essentials[0]])).toBe(0);
  });
});

describe('rankFor', () => {
  it.each([
    [0, 'Chaos Agent'], [39, 'Chaos Agent'], [40, 'Process Apprentice'],
    [69, 'Process Apprentice'], [70, 'Flow Engineer'], [89, 'Flow Engineer'], [90, 'Systems Architect'],
  ])('%i → %s', (score, rank) => expect(rankFor(score)).toBe(rank));
});

describe('scoreGame', () => {
  it('perfect run with full time scores 100', () => {
    expect(scoreGame(essentials, GAME_DURATION).score).toBe(100);
  });
  it('perfect order + all waste removed on timeout scores 90', () => {
    const r = scoreGame(essentials, 0);
    expect(r.score).toBe(90);
    expect(r.rank).toBe('Systems Architect');
  });
  it('penalises deleting essentials and flags a broken process', () => {
    const r = scoreGame(essentials.slice(1), 0);
    expect(r.essentialsDeleted).toBe(1);
    expect(r.broken).toBe(true);
    expect(r.score).toBe(75);
  });
  it('never goes below zero', () => {
    expect(scoreGame([], 0).score).toBe(0);
  });
  it('untouched board keeps waste and earns no waste points', () => {
    const r = scoreGame([...STEPS], 0);
    expect(r.wasteRemoved).toBe(0);
  });
});

describe('shuffleSteps', () => {
  it('returns every step exactly once', () => {
    const s = shuffleSteps();
    expect(s).toHaveLength(STEPS.length);
    expect(new Set(s.map((x) => x.id)).size).toBe(STEPS.length);
  });
  it('never starts already solved, even with a degenerate RNG', () => {
    const identityRng = () => 0.999999;
    expect(orderFraction(shuffleSteps(identityRng))).toBeLessThan(0.75);
  });
});
```

- [ ] Run → FAIL.
- [ ] Implement scoring per spec §6 (order 60 · pairwise; waste 7.5 each; time 10 × timeLeft/duration; −15 per deleted essential; clamp 0–100; round). `shuffleSteps`: Fisher–Yates, retry up to 10× while `orderFraction ≥ 0.75`, fallback `[...STEPS].reverse()`.
- [ ] Run → PASS. Commit `feat: add optimize-your-day game logic`.

### Task 4: Track math + world layout

**Files:** Create `src/lib/track.ts`, `src/lib/track.test.ts`, `src/lib/world.ts`

**Produces:** `STOPS = ['hero','boot','web','ml','avitec','game','contact']`, `LAST_STOP = 6`, `trackFromScroll(scrollCenter, panelCenters)`, `activeStopIndex(track)`, `segmentOf(track, hold?) → { from, to, t }`; `world.ts`: `NODE_POSITIONS: Vector3[]` (5 incl. OUTPUT), `mainCurve: CatmullRomCurve3`, `NODE_US: number[]`, `cameraStops(isMobile) → { pos: Vector3; look: Vector3 }[]` (length 7).

- [ ] Failing tests:

```ts
import { describe, it, expect } from 'vitest';
import { trackFromScroll, activeStopIndex, segmentOf, LAST_STOP } from './track';

describe('trackFromScroll', () => {
  const centers = [500, 1500, 2500];
  it('clamps before the first panel', () => expect(trackFromScroll(0, centers)).toBe(0));
  it('clamps after the last panel', () => expect(trackFromScroll(9999, centers)).toBe(2));
  it('interpolates between centers', () => expect(trackFromScroll(1000, centers)).toBeCloseTo(0.5));
  it('handles empty input', () => expect(trackFromScroll(100, [])).toBe(0));
  it('handles zero-height gaps without NaN', () => {
    expect(Number.isNaN(trackFromScroll(500, [500, 500, 900]))).toBe(false);
  });
});

describe('activeStopIndex', () => {
  it('rounds and clamps', () => {
    expect(activeStopIndex(1.4)).toBe(1);
    expect(activeStopIndex(1.6)).toBe(2);
    expect(activeStopIndex(-3)).toBe(0);
    expect(activeStopIndex(99)).toBe(LAST_STOP);
  });
});

describe('segmentOf', () => {
  it('rests exactly on a stop', () => expect(segmentOf(2)).toEqual({ from: 2, to: 3, t: 0 }));
  it('is halfway at the midpoint', () => expect(segmentOf(2.5).t).toBeCloseTo(0.5));
  it('holds near a stop', () => expect(segmentOf(2.1).t).toBe(0));
  it('clamps at the end', () => expect(segmentOf(10)).toEqual({ from: LAST_STOP, to: LAST_STOP, t: 0 }));
  it('clamps below zero', () => expect(segmentOf(-1)).toEqual({ from: 0, to: 1, t: 0 }));
});
```

- [ ] Run → FAIL; implement (piecewise-linear between centers; `segmentOf` with hold zones + smoothstep); run → PASS.
- [ ] `world.ts`: nodes at `(0,0,0) (9,1.6,-5) (18,-1.2,-10) (27,1,-15) (36,0,-20)`; `mainCurve` CatmullRom through them; `NODE_US` from closest-point sampling; camera stops: hero looks at knot, node stops offset so node sits right of a left card (desktop) / above a bottom card (mobile), game = wide overview, contact = OUTPUT.
- [ ] Commit `feat: add scroll track math and world layout`.

### Task 5: Design system, layout, state, scroll driver

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`; Create `src/lib/sceneState.ts`, `src/lib/store.ts`, `src/lib/useEnvironment.ts`, `src/components/ScrollDriver.tsx`

**Produces:** `sceneState { track: number; untangle: number; pointer: {x,y}; velocity: number }`; `useStore` with `optimized: boolean`, `optimize(): void`, `activeStop: number`, `setActiveStop(i)`, `booted: boolean`, `setBooted()`; hooks `useReducedMotion()`, `useIsMobile()`, `useWebGLSupport()`. `ScrollDriver` measures every `[data-stop]` panel center, updates `sceneState.track` on Lenis scroll, sets `activeStop` only when it changes, calls `optimize()` once track > 0.15.

- [ ] Tokens as CSS variables + Tailwind `@theme`; blueprint grid via CSS background on body; fonts via `next/font`; metadata + JSON-LD Person.
- [ ] `optimize()` tweens `sceneState.untangle` 0→1 with GSAP (`power3.inOut`, 1.4 s; instant when reduced motion).
- [ ] `npm run build` passes. Commit `feat: add design tokens, layout, state and scroll driver`.

### Task 6: HTML sections

**Files:** Create `src/components/sections/{Boot,Hero,Journey,NodeCard,Contact}.tsx`; Modify `src/app/page.tsx`

- [ ] Each section is a `<section data-stop={i}>` panel (min-h-svh). Hero: name, role, pitch, OPTIMIZE ME (amber) button → `optimize()`; scroll cue. Journey: 4 panels with `NodeCard` (mono node ID, title, period, summary, bullets, skill chips, metrics/projects) revealed with Motion `whileInView`. Contact: OUTPUT label, links, résumé download. Boot: typed line + node progress bar, ≤ 1.2 s, skippable, skipped on reduced motion, sets `booted`.
- [ ] Build passes; check page renders without the canvas. Commit `feat: add page sections`.

### Task 7: 3D world — pipes, pulses, nodes, camera

**Files:** Create `src/components/scene/{Experience,ProcessPipes,DataPulses,NodeStations,CameraRig}.tsx`, `src/components/scene/pipeMaterial.ts`

- [ ] `Experience`: fixed full-screen `<Canvas dpr={[1, isMobile ? 1 : 1.75]} gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}>` with fog matching bg, drei `PerformanceMonitor` → lowers quality, `frameloop` 'never' when `document.hidden`. Loaded via `next/dynamic({ ssr: false })` only when WebGL is supported.
- [ ] `ProcessPipes`: 5 tubes. Clean = `mainCurve` offset by small radial offsets; tangled = torus-knot variants around the hero origin; both sampled to the same point count, `TubeGeometry(tubular=desktop 400 / mobile 200, radial 6)`; clean positions/normals stored as `aClean`/`aCleanNormal`; ShaderMaterial mixes by `uUntangle`, fresnel cyan rim, amber pulses `fract(uv.x * k - time)`.
- [ ] `DataPulses`: ~60 additive sprite points (30 mobile) moving along `mainCurve` LUT, visible only after untangle.
- [ ] `NodeStations`: per node ring + core + glyph (`</>` from boxes, neural net from instanced spheres + line segments, gateway diamonds), ignite intensity from distance to active stop.
- [ ] `CameraRig`: lerp between `cameraStops[from]` and `[to]` by `segmentOf(track).t`, damped; pointer parallax ±0.3.
- [ ] Browser check: untangle on click and on scroll; camera visits each node. Commit `feat: add 3D process world`.

### Task 8: Mini-Mahdi

**Files:** Create `src/components/scene/MiniMahdi.tsx`

- [ ] Chibi primitives per spec §5 (flat-shaded `MeshStandardMaterial`), hair as stacked rotated boxes swept to one side, beard as a jaw shell + mustache, brows, blinking eyes, gray tee, dark pants.
- [ ] Placement: at `mainCurve.getPointAt(u)` where `u` interpolates `NODE_US` by segment; hidden (scale 0) until untangle > 0.8 then pops in; faces the camera with head clamped toward pointer; leg/arm swing proportional to scroll velocity; wave at contact; props (cap, laptop, brain, clipboard) swap by active stop with a pop.
- [ ] Browser check. Commit `feat: add Mini-Mahdi avatar`.

### Task 9: Optimize-your-day game UI

**Files:** Create `src/components/game/OptimizeGame.tsx`; Modify `src/app/page.tsx`

- [ ] States `idle → playing → done`. Board from `shuffleSteps()` (client-only, after mount to avoid hydration mismatch). Motion `Reorder.Group`; items drag only via handle (`useDragControls`, handle `touch-action: none`); ↑/↓ and ✕ buttons for keyboard/touch. 20 s timer via `requestAnimationFrame` with wall-clock delta; `finished` ref prevents double finish. Result card: score count-up, rank, broken-process note, punchline, Play again.
- [ ] Build passes; play through manually. Commit `feat: add optimize-your-day mini-game`.

### Task 10: Fallbacks, SEO, assets

**Files:** Create `src/components/fallback/StaticDiagram.tsx`, `src/app/opengraph-image.tsx`, `src/app/icon.svg`, `public/resume.pdf`

- [ ] StaticDiagram: SVG flow of the 5 nodes in brand colors, rendered behind content when no WebGL.
- [ ] OG image (static, `dynamic = 'force-static'`), favicon, placeholder résumé PDF.
- [ ] Commit `feat: add no-WebGL fallback, OG image and assets`.

### Task 11: Verification & polish

- [ ] `npm test`, `npm run lint`, `npm run build` all green.
- [ ] Serve `out/`; browser pass at 1440 px and 390 px, reduced motion; Lighthouse desktop.
- [ ] Fix findings; commit `chore: polish and performance fixes`.
