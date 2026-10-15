"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Quaternion,
  Vector3,
  type Group,
  type LineBasicMaterial,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { NODE_POSITIONS, NODE_US, mainCurve } from "@/lib/world";
import { sceneState } from "@/lib/sceneState";

const CYAN = new Color("#5ce1e6");
const AMBER = new Color("#ffb547");
/** Which page stop lights up each node (journey 1–4, OUTPUT at contact). */
const NODE_STOPS = [1, 2, 3, 4, 6];
const GLYPH_LIFT = 1.45;

function lineGeometry(segments: [Vector3, Vector3][]): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(segments.flatMap(([a, b]) => [a.x, a.y, a.z, b.x, b.y, b.z]), 3));
  return g;
}

const v = (x: number, y: number, z = 0) => new Vector3(x, y, z);

/** `</>` drawn as line strokes. */
const CODE_GLYPH = lineGeometry([
  [v(-0.55, 0.25), v(-0.8, 0)],
  [v(-0.8, 0), v(-0.55, -0.25)],
  [v(0.12, 0.32), v(-0.12, -0.32)],
  [v(0.55, 0.25), v(0.8, 0)],
  [v(0.8, 0), v(0.55, -0.25)],
]);

/** A tiny 3-4-2 neural network: neuron positions and fully connected layers. */
const NEURONS: Vector3[][] = [
  [v(-0.7, 0.35), v(-0.7, 0), v(-0.7, -0.35)],
  [v(0, 0.5), v(0, 0.17), v(0, -0.17), v(0, -0.5)],
  [v(0.7, 0.2), v(0.7, -0.2)],
];
const NEURAL_LINKS = lineGeometry(
  NEURONS.slice(0, -1).flatMap((layer, l) => layer.flatMap((a) => NEURONS[l + 1].map((b) => [a, b] as [Vector3, Vector3]))),
);

/** Process-diagram gateways: three diamonds on a flow line inside a swim-lane frame. */
const GATEWAYS = [v(-0.75, 0), v(0, 0), v(0.75, 0)];
const LANES = lineGeometry([
  [v(-1.2, 0.5), v(1.2, 0.5)],
  [v(-1.2, -0.5), v(1.2, -0.5)],
  [v(-1.2, 0.5), v(-1.2, -0.5)],
  [v(-1.2, 0), v(1.2, 0)],
]);

type Tintable = MeshBasicMaterial | LineBasicMaterial;

/** Line glyph above each node. Every material registers itself so the station can tint it. */
function Glyph({ index, register }: { index: number; register: (m: Tintable | null, weight: number) => void }) {
  const solid = (weight: number) => (
    <meshBasicMaterial ref={(m) => register(m, weight)} color={CYAN} transparent opacity={0} />
  );
  const line = (weight: number) => (
    <lineBasicMaterial ref={(m) => register(m, weight)} color={CYAN} transparent opacity={0} />
  );

  if (index === 1) return <lineSegments geometry={CODE_GLYPH}>{line(1)}</lineSegments>;
  if (index === 2) {
    return (
      <group>
        <lineSegments geometry={NEURAL_LINKS}>{line(0.4)}</lineSegments>
        {NEURONS.flat().map((p, i) => (
          <mesh key={i} position={p}>
            <icosahedronGeometry args={[0.06, 0]} />
            {solid(1)}
          </mesh>
        ))}
      </group>
    );
  }
  if (index === 3) {
    return (
      <group>
        <lineSegments geometry={LANES}>{line(0.35)}</lineSegments>
        {GATEWAYS.map((p, i) => (
          <mesh key={i} position={p} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.2, 0.2, 0.02]} />
            {solid(1)}
          </mesh>
        ))}
      </group>
    );
  }
  return null;
}

function Station({ index }: { index: number }) {
  const group = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const ringMat = useRef<MeshBasicMaterial>(null);
  const coreMat = useRef<MeshBasicMaterial>(null);
  const glyphMats = useRef(new Map<Tintable, number>());

  // Orient each gate ring so the flow passes straight through it.
  const quaternion = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), mainCurve.getTangentAt(NODE_US[index])),
    [index],
  );

  const register = (m: Tintable | null, weight: number) => {
    if (m) glyphMats.current.set(m, weight);
  };

  useFrame((state, delta) => {
    if (!ringMat.current || !coreMat.current || !ring.current || !group.current) return;
    const ignite = Math.max(0, 1 - Math.abs(sceneState.track - NODE_STOPS[index]));
    const appear = Math.min(1, Math.max(0, (sceneState.untangle - 0.55) / 0.45));
    const k = 1 - Math.exp(-delta * 6);

    const r = ringMat.current;
    r.opacity += (appear * (0.35 + 0.65 * ignite) - r.opacity) * k;
    r.color.lerpColors(CYAN, AMBER, ignite);
    coreMat.current.opacity = r.opacity;
    coreMat.current.color.lerpColors(CYAN, AMBER, ignite);
    for (const [m, weight] of glyphMats.current) {
      m.opacity = appear * (0.4 + 0.6 * ignite) * weight;
      m.color.lerpColors(CYAN, AMBER, ignite);
    }

    const pulse = Math.sin(state.clock.elapsedTime * 2 + index) * 0.03 * ignite;
    ring.current.scale.setScalar(Math.max(0.0001, (1 + ignite * 0.25 + pulse) * appear));
    group.current.visible = appear > 0.01;
  });

  return (
    <group ref={group} position={NODE_POSITIONS[index]} visible={false}>
      <mesh ref={ring} quaternion={quaternion}>
        <torusGeometry args={[index === 4 ? 0.9 : 0.62, 0.022, 8, 56]} />
        <meshBasicMaterial ref={ringMat} color={CYAN} transparent opacity={0} />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.16, 0]} />
        <meshBasicMaterial ref={coreMat} color={CYAN} transparent opacity={0} />
      </mesh>
      <group position={[0, GLYPH_LIFT, 0]}>
        <Glyph index={index} register={register} />
      </group>
    </group>
  );
}

export default function NodeStations() {
  return (
    <group>
      {NODE_POSITIONS.map((_, i) => (
        <Station key={i} index={i} />
      ))}
    </group>
  );
}
