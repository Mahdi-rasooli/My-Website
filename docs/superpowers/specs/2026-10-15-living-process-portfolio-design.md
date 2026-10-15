# The Living Process — Portfolio Design Spec

**Owner:** Mahdi Rasouli · **Date:** 2026-10-15 · **Status:** Draft for review

## 1. Goal

A single-page, client-only portfolio that works as Mahdi's résumé *and* personal presentation. It must be short (~7 viewport-heights of scroll), visually breathtaking, highly interactive, and still fast.

**Audience:** a mix — recruiters (AI / process / ML roles), potential clients, and his personal network. Personality hooks first; résumé facts convince second.

**Success criteria**
- A first-time visitor understands *who Mahdi is and what he does* within 5 seconds of the hero.
- The "Optimize me" moment and the mini-game are memorable enough to share.
- Lighthouse Performance ≥ 90 (desktop), LCP < 2 s, ≤ ~400 KB gzipped JS, smooth 60 fps on a mid-range laptop; graceful on mid-range phones.
- All personal content is edited in one typed file.

## 2. Concept

Mahdi's career is drawn as a **living 3D process diagram** floating in a blueprint void. Scrolling moves the camera along the flow, node by node. The metaphor *is* his job: he turns messy processes into clean systems.

**Story arc:** `INPUT (born 2003)` → `CS degree` → `Web developer` → `Machine learning` → `Avitec — Systems & Methods` → `OUTPUT (contact)`.

## 3. Page sequence

| # | Section | Scroll length | What happens |
|---|---|---|---|
| 0 | **Boot** | overlay, < 1.5 s | Mono line types `initializing process: mahdi_rasouli.exe`; progress bar wires up node-by-node while the 3D chunk loads. Skippable; never blocks HTML content. |
| 1 | **Hero — Chaos** | 1 vh | A tangled knot of glowing pipes. Name, role line, pitch ("I turn messy processes into elegant systems."), **OPTIMIZE ME** button. Click *or* first scroll → pipes untangle into a straight flow (~1.2 s), Mini-Mahdi pops out at node 01, amber data pulses start. |
| 2 | **Journey** | 4 vh (pinned canvas) | Camera follows a spline through 4 node stations. An HTML card slides in per node. Mini-Mahdi walks along the pipe synced to scroll and swaps a prop per node. |
| 3 | **Optimize-your-day game** | 1 vh | DOM mini-game (see §6). The 3D scene dims and slows behind it. |
| 4 | **Output — Contact** | 1 vh | Final node `OUTPUT → you + me`. Email, LinkedIn, GitHub, **Download résumé (PDF)**. Mini-Mahdi waves. |

### Journey nodes

| Node | Card content | 3D detail at node | Mini-Mahdi prop |
|---|---|---|---|
| 01 · BOOT | Born 03.09.2003 · B.Sc. Computer Science (university: placeholder) | Node ignites | Graduation cap |
| 02 · WEB DEV | Previous role, stack, 1–3 placeholder projects | Floating `</>` bracket glyphs | Laptop |
| 03 · ML | ML course, skills (placeholder list) | Small pulsing neural-net (instanced spheres + lines) | Glowing tiny brain |
| 04 · AVITEC | Systems & Methods: process modeling & optimization with AI; 2–3 placeholder impact metrics | BPMN-style gateway diamonds and swim-lane planes | Clipboard |

Skills live inside node cards — no separate skills section.

## 4. Visual system — "Midnight Blueprint"

**Color tokens**

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A1628` | Page / scene background |
| `--bg-deep` | `#060E1A` | Vignette, card backs |
| `--grid` | `rgba(120,170,255,0.08)` | Blueprint grid lines |
| `--line` | `#E8F1FF` | Primary linework, headings |
| `--cyan` | `#5CE1E6` | Pipes, node rims, links |
| `--amber` | `#FFB547` | The single hot accent: data pulses, CTA, score |
| `--muted` | `#7F93B2` | Secondary text, annotations |

Dark-only by design (the concept is a lit diagram in a void); contrast ≥ 4.5:1 for all body text.

**Type** (via `next/font`, self-hosted at build): **Unbounded** (display, names/headings), **Inter** (body), **JetBrains Mono** (labels, node IDs, annotations like `// node 03`).

**Motifs:** dimension lines and coordinate labels as decoration, dashed connectors, node IDs in mono, subtle scan-line shimmer on cards. Glow is faked (additive sprites + fresnel), no full-screen bloom.

## 5. Mini-Mahdi (procedural avatar)

Built from Three.js primitives in code (no GLB), low-poly, flat-shaded, ~1.5 k triangles.

- **Proportions:** chibi — large head (~40% of height), small body.
- **Hair:** dark brown `#2A1E17`; short faded sides; longer textured top swept up and to one side (stacked, slightly rotated low-poly chunks).
- **Beard:** short, trimmed, connected to mustache, fuller along jaw/chin — same dark brown, slightly lower opacity on cheeks to read as stubble-into-beard.
- **Face:** thick straight dark eyebrows (two slim boxes), dark eyes (spheres) that blink; skin light-warm `#E9C4A6`. No glasses.
- **Outfit:** heather-gray crew-neck t-shirt `#8A8D91`, dark pants.
- **Behavior:** idle bob, random blinks, head turns toward cursor (clamped), walk cycle while scroll moves, wave at contact node, prop swap with a pop scale per node.
- Reference photo kept outside the repo; the photo is **not** shown on the site.

## 6. Optimize-your-day game

**Setup:** 11 shuffled cards of a messy morning:
- Essential (7, correct order): Wake up → Shower → Make coffee → Breakfast → Check email → Commute → Start work
- Waste (4): Snooze alarm, Scroll social media, Check phone again, Re-read same email

**Play:** 20 s timer starts on first interaction. Drag to reorder (Motion `Reorder`); tap ✕ to delete a card. Keyboard: ↑/↓ buttons + Delete on focused card. Ends on **Ship it** or timeout.

**Scoring (0–100), pure function in `gameLogic.ts`:**
- Order (60): fraction of essential-step pairs in correct relative order (pairwise agreement among kept essentials).
- Waste removed (30): 7.5 per waste card deleted.
- Time bonus (10): proportional to seconds remaining (0 on timeout).
- Deleting an essential step: −15 each, floor 0, and a "broken process" note.

**Ranks:** < 40 *Chaos Agent* · 40–69 *Process Apprentice* · 70–89 *Flow Engineer* · ≥ 90 *Systems Architect*.
**Result line:** score, rank, and "Not bad. Imagine what I'd do with your company's processes." + Play again.

## 7. Architecture

**Stack:** Next.js (latest stable at scaffold time), App Router, TypeScript strict, `output: 'export'` (static). Tailwind CSS. three + @react-three/fiber + @react-three/drei (tree-shaken imports). GSAP + ScrollTrigger (scroll timeline, untangle). Lenis (smooth scroll). Motion (game + card transitions only). zustand (shared state).

**Layering:** one fixed `<Canvas>` behind a normal scrolling HTML document. HTML owns content and accessibility; the canvas is decorative (`aria-hidden`).

```
src/
  app/            layout.tsx (fonts, metadata, JSON-LD Person), page.tsx, globals.css, opengraph-image
  content/
    profile.ts    typed single source of truth (identity, nodes, skills, links, game copy)
  components/
    scene/        Experience.tsx (Canvas, lazy), ProcessPipes.tsx, DataPulses.tsx,
                  MiniMahdi.tsx, NodeStation.tsx, CameraRig.tsx, BlueprintBackdrop.tsx
    sections/     Boot.tsx, Hero.tsx, Journey.tsx, NodeCard.tsx, Contact.tsx
    game/         OptimizeGame.tsx, gameLogic.ts
    fallback/     StaticDiagram.tsx (SVG, no-WebGL)
  lib/            store.ts (zustand), useDeviceTier.ts, useReducedMotion.ts, curves.ts
public/           resume.pdf (placeholder)
```

**Data flow:** GSAP ScrollTrigger writes `progress` (0–1) and `optimized` into the zustand store → scene components read it in `useFrame` (no React re-renders per frame) → camera position = `cameraCurve.getPointAt(progress)`; Mini-Mahdi position = `pipeCurve.getPointAt(progress)`; active node index derived from progress drives HTML cards.

**Untangle technique:** each pipe has two `TubeGeometry` builds with identical segment counts — tangled (noisy control points) and clean (straight spline). Clean positions are stored as a second attribute; a custom vertex shader mixes them by `uProgress`. Data pulses: one `InstancedMesh`, positions computed along the curve in the vertex shader.

## 8. Performance & resilience

- Hero text is static HTML (LCP element); 3D bundle loaded via `next/dynamic({ ssr: false })` after first paint.
- `dpr={[1, 1.75]}`; drei `PerformanceMonitor` steps down particle count/segments on low FPS; `frameloop` paused when tab hidden or canvas off-screen.
- **Device tiers:** desktop full; mobile = ~50% particles, fewer tube segments, portrait camera offsets, DPR 1.
- **`prefers-reduced-motion`:** no autoplay motion, untangle instant, camera cuts between nodes instead of gliding, Lenis disabled.
- **No WebGL:** `StaticDiagram` SVG renders the same flow; site fully usable.
- No backend, no analytics, no cookies.

## 9. Content model

`profile.ts` exports a typed `Profile` object: `name`, `role`, `pitch`, `birthDate` (ISO `2003-09-03`), `education`, `nodes[]` (id, title, period, summary, bullets, skills, projects?, metrics?), `links` (email, linkedin, github, resumeUrl), `game` copy. Unknown facts use visible placeholders marked `TODO(mahdi)` so they're easy to find.

## 10. Testing

- **Unit (Vitest, test-first):** `gameLogic` (scoring, ranks, essential-deletion penalty, timeout), age derivation from `birthDate`, curve helpers (progress → node index).
- **Build:** `next build` static export passes with zero type errors.
- **Manual/automated browser pass:** desktop 1440 px and mobile 390 px; reduced-motion; WebGL-disabled fallback; Lighthouse run.

## 11. Out of scope

Backend, CMS, contact form (mailto link instead), blog, i18n, analytics, AI chatbot, hidden terminal, live age counter.

## 12. Open items for Mahdi (placeholders until provided)

University name & years · previous web-dev employer/period/projects · ML course name & projects · Avitec start date & anonymized metrics · LinkedIn/GitHub URLs & contact email to publish · résumé PDF.
