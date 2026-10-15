# Mahdi Rasouli · The Living Process

My portfolio and résumé as one interactive page. My career is drawn as a 3D process diagram: it starts as a tangled knot, gets optimized into a clean flow, and a low-poly Mini-Mahdi walks along it from node to node.

Static Next.js site, no backend.

## Edit the content

Everything personal lives in **`src/content/profile.ts`**. Search it for `TODO(mahdi)`: each placeholder shows on the site as a dashed amber slot until you replace it.

Also replace **`public/resume.pdf`** with your real résumé.

Links (email, LinkedIn, GitHub) stay disabled on the page while they are still placeholders.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (game scoring, scroll math, layout)
npm run lint
npm run build    # static site in out/
```

## Deploy

`npm run build` writes a fully static site to `out/`. Host it anywhere that serves static files.

- **Vercel**: import the repo; no settings needed.
- **Netlify / GitHub Pages / any static host**: publish the `out/` folder.

Set `NEXT_PUBLIC_SITE_URL` to your final URL (for example `https://mahdirasouli.dev`) before building, so the share image and metadata use absolute links.

The share image is generated at build time as `out/opengraph-image` (a PNG without a file extension). Vercel serves it correctly. If another host serves it with the wrong type, add a rule that sends it as `image/png`.

## How it works

| Piece | Where |
| --- | --- |
| Scroll position → `track` (0 hero … 6 contact) | `src/lib/track.ts`, `src/components/ScrollDriver.tsx` |
| 3D layout: nodes, flow curve, camera framings | `src/lib/world.ts` |
| Knot ↔ clean flow (two tube shapes blended on the GPU) | `src/components/scene/ProcessPipes.tsx`, `pipeMaterial.ts` |
| Mini-Mahdi | `src/components/scene/MiniMahdi.tsx` |
| Mini-game and scoring | `src/components/game/` |
| No-WebGL fallback | `src/components/fallback/StaticDiagram.tsx` |

The 3D scene loads after the page's text, renders only while the tab is visible, and lowers its resolution if the frame rate drops. With "reduce motion" turned on, nothing animates on its own.
