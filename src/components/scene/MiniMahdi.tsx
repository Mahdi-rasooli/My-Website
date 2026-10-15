"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Vector3, type Group, type Mesh } from "three";
import { avatarU, mainCurve } from "@/lib/world";
import { activeStopIndex } from "@/lib/track";
import { sceneState } from "@/lib/sceneState";
import { useStore } from "@/lib/store";

const SKIN = "#e9c4a6";
const HAIR = "#2a1e17";
const TEE = "#8a8d91";
const TEE_DARK = "#73767a";
const PANTS = "#1c2433";
const SHOES = "#0f141d";
const CYAN = "#5ce1e6";
const AMBER = "#ffb547";

const HEAD_R = 0.27;
const AVATAR_SCALE = 1.25;
/** Stand just before each node ring so he never clips through it. */
const U_BEHIND_NODE = 0.02;
/** Which prop he holds at each stop: hero, boot, web, ml, avitec, game, contact. */
const PROP_AT_STOP = ["cap", "cap", "laptop", "brain", "clipboard", "none", "none"] as const;
type PropName = Exclude<(typeof PROP_AT_STOP)[number], "none">;

function Flat({ color, emissive }: { color: string; emissive?: string }) {
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

function Head({ eyesRef }: { eyesRef: React.RefObject<Group | null> }) {
  return (
    <group>
      {/* skull */}
      <mesh scale={[1, 1.08, 0.98]}>
        <icosahedronGeometry args={[HEAD_R, 2]} />
        <Flat color={SKIN} />
      </mesh>
      {/* ears */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * HEAD_R * 0.98, -0.01, 0]} scale={[0.5, 1, 0.7]}>
          <icosahedronGeometry args={[0.06, 0]} />
          <Flat color={SKIN} />
        </mesh>
      ))}
      {/* hair: close-cropped faded shell over the top, sides and back */}
      <mesh position={[0, 0.012, -0.005]} scale={[1.04, 1.1, 1.03]}>
        <sphereGeometry args={[HEAD_R, 14, 10, 0, Math.PI * 2, 0, 1.25]} />
        <Flat color={HAIR} />
      </mesh>
      <mesh position={[0, 0.0, -0.02]} scale={[1.03, 1.06, 1.04]} rotation={[-0.35, 0, 0]}>
        <sphereGeometry args={[HEAD_R, 14, 10, Math.PI * 0.95, Math.PI * 1.1, 0.6, 1.3]} />
        <Flat color={HAIR} />
      </mesh>
      {/* the longer textured top, swept up and to one side */}
      {[
        { p: [-0.07, 0.27, 0.1], r: [0.5, 0.2, 0.35], s: [0.2, 0.09, 0.15] },
        { p: [0.04, 0.29, 0.06], r: [0.45, -0.1, 0.25], s: [0.22, 0.1, 0.17] },
        { p: [0.12, 0.25, 0.1], r: [0.55, -0.3, 0.1], s: [0.15, 0.08, 0.13] },
        { p: [-0.02, 0.29, -0.06], r: [0.1, 0, 0.2], s: [0.26, 0.08, 0.2] },
      ].map((h, i) => (
        <mesh key={i} position={h.p as [number, number, number]} rotation={h.r as [number, number, number]}>
          <boxGeometry args={h.s as [number, number, number]} />
          <Flat color={HAIR} />
        </mesh>
      ))}
      {/* beard: trimmed shell along the jaw and chin, joined to the mustache */}
      <mesh position={[0, -0.015, 0.006]} scale={[1.02, 1.05, 1.01]}>
        <sphereGeometry args={[HEAD_R, 16, 10, 0, Math.PI, 2.05, 0.8]} />
        <Flat color={HAIR} />
      </mesh>
      <mesh position={[0, -0.075, HEAD_R * 0.93]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.13, 0.03, 0.04]} />
        <Flat color={HAIR} />
      </mesh>
      {/* mouth */}
      <mesh position={[0, -0.112, HEAD_R * 1.0]}>
        <boxGeometry args={[0.06, 0.012, 0.02]} />
        <Flat color="#b0675c" />
      </mesh>
      {/* thick straight brows */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.088, 0.085, HEAD_R * 0.9]} rotation={[0, 0, s * -0.06]}>
          <boxGeometry args={[0.085, 0.022, 0.03]} />
          <Flat color={HAIR} />
        </mesh>
      ))}
      {/* eyes */}
      <group ref={eyesRef} position={[0, 0.03, HEAD_R * 0.9]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.085, 0, 0]} scale={[1, 1.15, 0.6]}>
            <sphereGeometry args={[0.026, 8, 6]} />
            <meshBasicMaterial color="#1a120e" />
          </mesh>
        ))}
      </group>
      {/* nose */}
      <mesh position={[0, -0.025, HEAD_R * 0.97]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.025, 0.06, 4]} />
        <Flat color="#ddb294" />
      </mesh>
    </group>
  );
}

function Props({ capRef, laptopRef, brainRef, clipboardRef }: Record<`${PropName}Ref`, React.RefObject<Group | null>>) {
  return (
    <>
      <group ref={capRef} position={[0, 1.1, 0]} scale={0}>
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

      <group ref={laptopRef} position={[0, 0.3, 0.22]} scale={0}>
        <mesh>
          <boxGeometry args={[0.3, 0.015, 0.2]} />
          <Flat color="#a9b1bd" />
        </mesh>
        <mesh position={[0, 0.1, -0.1]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.012]} />
          <Flat color="#a9b1bd" />
        </mesh>
        <mesh position={[0, 0.1, -0.092]} rotation={[-0.25, 0, 0]}>
          <planeGeometry args={[0.26, 0.16]} />
          <meshBasicMaterial color={CYAN} />
        </mesh>
      </group>

      <group ref={brainRef} position={[0, 1.36, 0]} scale={0}>
        <mesh>
          <icosahedronGeometry args={[0.11, 1]} />
          <meshBasicMaterial color={AMBER} wireframe />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.07, 1]} />
          <meshBasicMaterial color={AMBER} transparent opacity={0.5} />
        </mesh>
      </group>

      <group ref={clipboardRef} position={[0.21, 0.27, 0.12]} rotation={[-0.3, -0.3, 0]} scale={0}>
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
    </>
  );
}

/** A low-poly chibi Mahdi who rides the process flow, follows the cursor and changes props per node. */
export default function MiniMahdi() {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const cap = useRef<Group>(null);
  const laptop = useRef<Group>(null);
  const brain = useRef<Group>(null);
  const clipboard = useRef<Group>(null);
  const motion = useRef({ pop: 0, speed: 0, nextBlink: 2.5, blinkUntil: 0, prev: new Vector3(), target: new Vector3(), placed: false });

  useFrame(({ clock, camera }, rawDelta) => {
    const g = root.current;
    if (!g || !body.current || !head.current || !eyes.current) return;
    const delta = Math.min(rawDelta, 0.1);
    const t = clock.elapsedTime;
    const m = motion.current;
    const anim = reducedMotion ? 0 : 1;

    // Pop in once the knot is (almost) untangled.
    m.pop = MathUtils.damp(m.pop, sceneState.untangle > 0.8 ? 1 : 0, 5, delta);
    const overshoot = 1 + 0.25 * Math.sin(Math.min(m.pop, 1) * Math.PI) * (1 - m.pop);
    g.scale.setScalar(m.pop * overshoot * AVATAR_SCALE);
    g.visible = m.pop > 0.001;
    if (!g.visible) return;

    // Ride the flow.
    const u = Math.max(0, avatarU(sceneState.track, reducedMotion) - U_BEHIND_NODE);
    mainCurve.getPointAt(u, m.target);
    m.target.y += 0.07;
    if (!m.placed || reducedMotion) {
      g.position.copy(m.target);
      m.placed = true;
    }
    m.prev.copy(g.position);
    g.position.set(
      MathUtils.damp(g.position.x, m.target.x, 6, delta),
      MathUtils.damp(g.position.y, m.target.y, 6, delta),
      MathUtils.damp(g.position.z, m.target.z, 6, delta),
    );
    const speed = m.prev.distanceTo(g.position) / delta;
    m.speed = MathUtils.damp(m.speed, Math.min(speed / 4, 1), 8, delta);

    // Face the camera, turning a little toward the direction of travel while walking.
    const faceCam = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z);
    const tangent = mainCurve.getTangentAt(u);
    g.rotation.y = MathUtils.lerp(faceCam, Math.atan2(tangent.x, tangent.z), m.speed * 0.45);

    const walk = Math.sin(t * 11) * 0.7 * m.speed * anim;
    body.current.position.y = (Math.sin(t * 2.2) * 0.012 + Math.abs(Math.sin(t * 11)) * 0.03 * m.speed) * anim;
    if (legL.current && legR.current) {
      legL.current.rotation.x = walk;
      legR.current.rotation.x = -walk;
    }

    const stop = activeStopIndex(sceneState.track);
    const prop = PROP_AT_STOP[stop];
    const waving = stop === 6 || (stop === 0 && m.pop > 0.95);
    if (armL.current && armR.current) {
      const holding = prop === "clipboard" || prop === "laptop";
      armL.current.rotation.x = prop === "laptop" ? -0.9 : -walk * 0.8;
      armL.current.rotation.z = 0.12;
      if (waving) {
        armR.current.rotation.x = 0;
        armR.current.rotation.z = MathUtils.damp(armR.current.rotation.z, -2.5 + Math.sin(t * 9) * 0.35 * anim, 10, delta);
      } else {
        armR.current.rotation.x = walk * 0.8 - (holding ? 0.9 : 0);
        armR.current.rotation.z = MathUtils.damp(armR.current.rotation.z, -0.12, 10, delta);
      }
    }

    // Look toward the visitor's cursor.
    head.current.rotation.y = MathUtils.damp(head.current.rotation.y, sceneState.pointer.x * 0.45, 6, delta);
    head.current.rotation.x = MathUtils.damp(head.current.rotation.x, -sceneState.pointer.y * 0.22, 6, delta);

    // Blink every few seconds.
    if (t > m.nextBlink) {
      m.blinkUntil = t + 0.12;
      m.nextBlink = t + 2.5 + Math.random() * 3;
    }
    eyes.current.scale.y = t < m.blinkUntil ? 0.1 : 1;

    // The prop for the current node pops in; the others pop out.
    const props: [PropName, Group | null][] = [
      ["cap", cap.current],
      ["laptop", laptop.current],
      ["brain", brain.current],
      ["clipboard", clipboard.current],
    ];
    for (const [name, obj] of props) {
      if (!obj) continue;
      obj.scale.setScalar(MathUtils.damp(obj.scale.x, prop === name ? 1 : 0, 9, delta));
      obj.visible = obj.scale.x > 0.01;
    }
    if (brain.current) brain.current.rotation.y = t * anim;
    if (shadow.current) shadow.current.scale.setScalar(1 - body.current.position.y * 4);
  });

  return (
    <group ref={root} visible={false}>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.18} />
      </mesh>
      <group ref={body}>
        {/* legs pivot at the hip */}
        {[
          { ref: legL, x: -0.065 },
          { ref: legR, x: 0.065 },
        ].map(({ ref, x }) => (
          <group key={x} ref={ref} position={[x, 0.22, 0]}>
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[0.1, 0.2, 0.11]} />
              <Flat color={PANTS} />
            </mesh>
            <mesh position={[0, -0.2, 0.025]}>
              <boxGeometry args={[0.1, 0.045, 0.16]} />
              <Flat color={SHOES} />
            </mesh>
          </group>
        ))}

        {/* heather-gray crew-neck tee */}
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[0.31, 0.29, 0.18]} />
          <Flat color={TEE} />
        </mesh>
        <mesh position={[0, 0.5, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.065, 0.014, 6, 12]} />
          <Flat color={TEE_DARK} />
        </mesh>
        <mesh position={[0, 0.53, 0]}>
          <cylinderGeometry args={[0.055, 0.06, 0.06, 8]} />
          <Flat color={SKIN} />
        </mesh>

        {/* arms pivot at the shoulder */}
        {[
          { ref: armL, x: -0.2 },
          { ref: armR, x: 0.2 },
        ].map(({ ref, x }) => (
          <group key={x} ref={ref} position={[x, 0.48, 0]}>
            <mesh position={[0, -0.06, 0]}>
              <boxGeometry args={[0.085, 0.12, 0.1]} />
              <Flat color={TEE} />
            </mesh>
            <mesh position={[0, -0.17, 0]}>
              <boxGeometry args={[0.065, 0.12, 0.075]} />
              <Flat color={SKIN} />
            </mesh>
          </group>
        ))}

        <group ref={head} position={[0, 0.78, 0]}>
          <Head eyesRef={eyes} />
        </group>

        <Props capRef={cap} laptopRef={laptop} brainRef={brain} clipboardRef={clipboard} />
      </group>
    </group>
  );
}
