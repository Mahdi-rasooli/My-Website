"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, Euler, Matrix4, TubeGeometry, Vector3, type Mesh, type ShaderMaterial } from "three";
import { KNOT_CENTER, mainCurve } from "@/lib/world";
import { sceneState } from "@/lib/sceneState";
import { useStore } from "@/lib/store";
import { createPipeMaterial } from "./pipeMaterial";

const CONTROL_POINTS = 160;

interface PipeSpec {
  /** Torus-knot winding numbers for the tangled shape. */
  p: number;
  q: number;
  tilt: [number, number, number];
  /** Offset from the main flow in the clean shape (0 = the main pipe). */
  offset: number;
  angle: number;
  radius: number;
  opacity: number;
}

const PIPES: PipeSpec[] = [
  { p: 2, q: 3, tilt: [0.3, 0.2, 0], offset: 0, angle: 0, radius: 0.075, opacity: 1 },
  { p: 3, q: 4, tilt: [1.1, 0.4, 0.3], offset: 0.42, angle: 0, radius: 0.026, opacity: 0.8 },
  { p: 2, q: 5, tilt: [-0.6, 1.2, 0.2], offset: 0.42, angle: (Math.PI * 2) / 3, radius: 0.026, opacity: 0.8 },
  { p: 3, q: 5, tilt: [0.2, -0.9, 1.0], offset: 0.42, angle: (Math.PI * 4) / 3, radius: 0.026, opacity: 0.8 },
  { p: 4, q: 3, tilt: [1.4, -0.3, -0.7], offset: 0.8, angle: Math.PI / 2, radius: 0.016, opacity: 0.5 },
];

function knotPoints({ p, q, tilt }: PipeSpec): Vector3[] {
  const m = new Matrix4().makeRotationFromEuler(new Euler(...tilt));
  const R = 2.1;
  const r = 0.85;
  return Array.from({ length: CONTROL_POINTS }, (_, i) => {
    const phi = (i / CONTROL_POINTS) * Math.PI * 2;
    const ring = R + r * Math.cos(q * phi);
    return new Vector3(ring * Math.cos(p * phi), ring * Math.sin(p * phi), r * Math.sin(q * phi))
      .applyMatrix4(m)
      .add(KNOT_CENTER);
  });
}

function cleanPoints({ offset, angle }: PipeSpec): Vector3[] {
  const frames = mainCurve.computeFrenetFrames(CONTROL_POINTS - 1, false);
  return Array.from({ length: CONTROL_POINTS }, (_, i) => {
    const point = mainCurve.getPointAt(i / (CONTROL_POINTS - 1));
    if (offset === 0) return point;
    return point
      .addScaledVector(frames.normals[i], Math.cos(angle) * offset)
      .addScaledVector(frames.binormals[i], Math.sin(angle) * offset);
  });
}

/** Tangled geometry carrying the clean shape as extra attributes for the shader to blend. */
function buildPipe(spec: PipeSpec, tubular: number): TubeGeometry {
  const tangled = new TubeGeometry(new CatmullRomCurve3(knotPoints(spec)), tubular, spec.radius, 6, false);
  const clean = new TubeGeometry(new CatmullRomCurve3(cleanPoints(spec)), tubular, spec.radius, 6, false);
  tangled.setAttribute("aClean", clean.getAttribute("position"));
  tangled.setAttribute("aCleanNormal", clean.getAttribute("normal"));
  clean.dispose();
  return tangled;
}

export default function ProcessPipes({ isMobile }: { isMobile: boolean }) {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const meshes = useRef<(Mesh | null)[]>([]);
  const pipes = useMemo(
    () =>
      PIPES.map((spec, i) => ({
        geometry: buildPipe(spec, isMobile ? 220 : 420),
        material: createPipeMaterial(spec.opacity, i === 0 ? 18 : 9),
      })),
    [isMobile],
  );

  useFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    const u = sceneState.untangle;
    for (const mesh of meshes.current) {
      if (!mesh) continue;
      const { uniforms } = mesh.material as ShaderMaterial;
      uniforms.uTime.value = t;
      uniforms.uUntangle.value = u;
      uniforms.uSpin.value = t * 0.12 * (1 - u);
    }
  });

  // The clean shape spans the whole world, so the pipes are never frustum-culled.
  return (
    <group>
      {pipes.map(({ geometry, material }, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          geometry={geometry}
          material={material}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
