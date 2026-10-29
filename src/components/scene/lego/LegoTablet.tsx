"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshBasicMaterial, MeshStandardMaterial, type Mesh } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useStore } from "@/lib/store";
import { FLOW_POINTS, LEGO, processTexture } from "./prints";

/** Tablet size in minifig millimetres; its side edges sit at the hands in the holding pose. */
export const TABLET = { width: 10.4, height: 13.6, depth: 0.9 };
const SCREEN = { width: TABLET.width - 1.2, height: TABLET.height - 1.6 };
/** Canvas pixel → screen millimetres (the texture is 260 × 340). */
const toScreen = ([x, y]: [number, number]) =>
  [(x / 260 - 0.5) * SCREEN.width, (0.5 - y / 340) * SCREEN.height] as const;
const STOPS = FLOW_POINTS.map(toScreen);
const SECONDS_PER_STEP = 0.55;

/**
 * A minifig-scale tablet showing a live process diagram (Plan → Do → Check → Act),
 * with an amber token running through it. Origin at the tablet's center.
 */
export default function LegoTablet() {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const token = useRef<Mesh>(null);
  const parts = useMemo(() => {
    const map = processTexture();
    return {
      map,
      shell: new MeshStandardMaterial({ color: "#2a303b", roughness: 0.4, metalness: 0.1 }),
      screen: new MeshBasicMaterial({ map, toneMapped: false }),
      body: new RoundedBoxGeometry(TABLET.width, TABLET.height, TABLET.depth, 2, 0.45),
    };
  }, []);

  useEffect(
    () => () => {
      parts.map.dispose();
      parts.shell.dispose();
      parts.screen.dispose();
      parts.body.dispose();
    },
    [parts],
  );

  useFrame(({ clock }) => {
    const t = token.current;
    if (!t) return;
    if (reducedMotion) {
      t.position.set(STOPS[0][0], STOPS[0][1], t.position.z);
      return;
    }
    // Ride from stop to stop with a short pause at each, rest at the end, then start again.
    const steps = STOPS.length - 1;
    const p = (clock.elapsedTime / SECONDS_PER_STEP) % (steps + 1);
    const i = Math.min(Math.floor(p), steps - 1);
    const k = Math.min(1, (p - Math.floor(p)) * 1.6);
    const eased = p >= steps ? 1 : k * k * (3 - 2 * k);
    const [ax, ay] = STOPS[i];
    const [bx, by] = STOPS[i + 1];
    t.position.set(ax + (bx - ax) * eased, ay + (by - ay) * eased, t.position.z);
  });

  const front = TABLET.depth / 2;
  return (
    <group>
      <mesh geometry={parts.body} material={parts.shell} />
      <mesh material={parts.screen} position={[0, 0.1, front + 0.01]}>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
      </mesh>
      <mesh ref={token} position={[STOPS[0][0], STOPS[0][1], front + 0.25]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshBasicMaterial color={LEGO.amber} toneMapped={false} />
      </mesh>
    </group>
  );
}
