"use client";

import { MathUtils, type Group } from "three";

const CYAN = "#5ce1e6";
const AMBER = "#ffb547";

/** Which prop the avatar shows at each stop: hero, boot, web, ml, avitec, game, contact. */
export const PROP_AT_STOP = ["cap", "cap", "laptop", "brain", "clipboard", "none", "none"] as const;
export type PropName = Exclude<(typeof PROP_AT_STOP)[number], "none">;

export function Flat({ color, emissive }: { color: string; emissive?: string }) {
  return (
    <meshStandardMaterial
      color={color}
      flatShading
      roughness={0.85}
      metalness={0}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={emissive ? 1.4 : 0}
    />
  );
}

/** Graduation cap, centered on the crown of the head. */
export function Cap() {
  return (
    <group>
      <mesh position={[0, 0.04, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.36, 0.02, 0.36]} />
        <Flat color="#141b2b" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.15, 0.17, 0.07, 8]} />
        <Flat color="#141b2b" />
      </mesh>
      <mesh position={[0.16, -0.03, 0.12]}>
        <boxGeometry args={[0.015, 0.12, 0.015]} />
        <Flat color={AMBER} emissive={AMBER} />
      </mesh>
    </group>
  );
}

/** Glowing wireframe "brain" that floats above the head. */
export function Brain() {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.11, 1]} />
        <meshBasicMaterial color={AMBER} wireframe />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.07, 1]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/** Clipboard with a process checklist. */
export function Clipboard() {
  return (
    <group rotation={[-0.3, -0.3, 0]}>
      <mesh>
        <boxGeometry args={[0.17, 0.23, 0.015]} />
        <Flat color="#7b5b3a" />
      </mesh>
      <mesh position={[0, -0.01, 0.009]}>
        <planeGeometry args={[0.14, 0.18]} />
        <meshBasicMaterial color="#e8f1ff" />
      </mesh>
      {[0.04, 0.0, -0.04].map((y) => (
        <mesh key={y} position={[0, y, 0.011]}>
          <planeGeometry args={[0.1, 0.012]} />
          <meshBasicMaterial color={CYAN} />
        </mesh>
      ))}
    </group>
  );
}

/** Pops the current stop's prop in and the others out. */
export function animateProps(props: [PropName, Group | null][], current: string, delta: number) {
  for (const [name, obj] of props) {
    if (!obj) continue;
    obj.scale.setScalar(MathUtils.damp(obj.scale.x, current === name ? 1 : 0, 9, delta));
    obj.visible = obj.scale.x > 0.01;
  }
}
