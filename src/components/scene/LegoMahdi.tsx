"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, ExtrudeGeometry, LatheGeometry, MathUtils, MeshStandardMaterial, type Group } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { activeStopIndex } from "@/lib/track";
import { sceneState } from "@/lib/sceneState";
import { useStore } from "@/lib/store";
import { createRider, rideFlow } from "./flowRider";
import { Brain, Cap, Clipboard, Laptop, PROP_AT_STOP, animateProps, type PropName } from "./AvatarProps";
import { clipShape, headProfile, taperTop, uvByHeight } from "./lego/shapes";
import { LEGO, faceTexture, shirtTexture } from "./lego/prints";

/** The figure is modelled in real minifig millimetres; ~37 mm stands ~1.2 units tall. */
const K = 0.0325;
const HEAD_R = 5;
const HEAD_H = 8.8;
const HEAD_Y = 31.4;
const SHOULDER = { x: 6.6, y: 24.6 };
const HIP = { x: 3.9, y: 11.5 };
/** Arms raised forward to hold a prop; lower for the laptop so its screen clears his face. */
const HOLD = { clipboard: -1.0, laptop: -0.7 };
const HOLD_IN = 0.28;
/**
 * Hand clip, sized like the real part: after the 0.3 mm bevel the hole is 3.2 mm
 * across (it grips a LEGO bar), the hand 5 mm wide and 3.1 mm tall, and the slot
 * about 1.6 mm, narrower than the hole so a bar snaps in.
 */
const HAND = { inner: 1.9, outer: 2.2, depth: 2.4, bevel: 0.3, bevelHeight: 0.35, gap: 1.3 };
const HAND_OUTER = HAND.outer + HAND.bevel;
/** Undo the forearm's forward bend so the hole runs top to bottom, as on a real minifig. */
const HAND_UPRIGHT = 0.45;
/** Slot faces forward and a little inward, in the shape's plane before it is stood upright. */
const slotAngle = (side: 1 | -1) => Math.atan2(-0.88, -side * 0.48);

function useLegoParts() {
  const parts = useMemo(() => {
    const plastic = (color: string, extra: Partial<MeshStandardMaterial> = {}) =>
      new MeshStandardMaterial({ color, roughness: 0.32, metalness: 0, ...extra });
    const face = faceTexture();
    const print = shirtTexture();
    const materials = {
      skin: plastic(LEGO.skin),
      hair: plastic(LEGO.hair, { roughness: 0.45 }),
      hairShell: plastic(LEGO.hair, { roughness: 0.45, side: DoubleSide }),
      shirt: plastic(LEGO.shirt),
      jeans: plastic(LEGO.jeans),
      shoes: plastic(LEGO.shoes),
      face: plastic("#ffffff", { map: face }),
      print: plastic("#ffffff", { map: print, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }),
    };
    const geometries = {
      leg: new RoundedBoxGeometry(7.4, 9, 5.8, 3, 0.7),
      shoe: new RoundedBoxGeometry(7.4, 2.4, 8.4, 3, 0.7),
      hip: new RoundedBoxGeometry(15.6, 2.6, 6.2, 3, 0.7),
      torso: taperTop(new RoundedBoxGeometry(15.6, 12.4, 7.8, 3, 0.9), 12 / 15.6),
      // phiStart = π puts u = 0.5 (the face print's center) at the front.
      head: uvByHeight(new LatheGeometry(headProfile(HEAD_R, HEAD_H, 0.9), 48, Math.PI), HEAD_H),
      hand: new ExtrudeGeometry(clipShape(HAND.inner, HAND.outer, HAND.gap), {
        depth: HAND.depth,
        bevelEnabled: true,
        bevelThickness: HAND.bevelHeight,
        bevelSize: HAND.bevel,
        bevelSegments: 4,
        curveSegments: 28,
      }).translate(0, 0, -HAND.depth / 2),
    };
    return { materials, geometries, textures: [face, print] };
  }, []);

  useEffect(
    () => () => {
      Object.values(parts.materials).forEach((m) => m.dispose());
      Object.values(parts.geometries).forEach((g) => g.dispose());
      parts.textures.forEach((t) => t.dispose());
    },
    [parts],
  );
  return parts;
}

type Parts = ReturnType<typeof useLegoParts>;

/**
 * One arm on a shoulder pivot: grey sleeve, bare forearm bent forward, then a wrist
 * peg into a solid C-clip hand whose hole faces forward.
 */
function Arm({ side, pivot, parts }: { side: 1 | -1; pivot: React.Ref<Group>; parts: Parts }) {
  const { materials: m, geometries: g } = parts;
  return (
    <group ref={pivot} position={[side * SHOULDER.x, SHOULDER.y, 0]}>
      <mesh material={m.shirt}>
        <sphereGeometry args={[2.3, 16, 12]} />
      </mesh>
      <group rotation={[0, 0, side * 0.12]}>
        <mesh material={m.shirt} position={[0, -2.2, 0]}>
          <cylinderGeometry args={[2.25, 2.0, 4.4, 16]} />
        </mesh>
        <group position={[0, -4.2, 0]} rotation={[-0.5, 0, 0]}>
          <mesh material={m.skin} position={[0, -2.0, 0]}>
            <cylinderGeometry args={[1.8, 1.65, 4, 20]} />
          </mesh>
          {/* Wrist peg, then the C-clip hand: its back wall takes the peg, the slot faces away. */}
          <mesh material={m.skin} position={[0, -4.5, 0]}>
            <cylinderGeometry args={[1.15, 1.15, 1.2, 16]} />
          </mesh>
          <group position={[0, -5.1, 0]} rotation={[HAND_UPRIGHT, 0, 0]}>
            <group position={[0, -0.4, HAND_OUTER - 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh geometry={g.hand} material={m.skin} rotation={[0, 0, slotAngle(side)]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Mahdi as a LEGO minifigure: short quiff, heavy brows, stubble beard, grey tee and
 * jeans. He walks the flow, turns his head toward the cursor, hops at each new node,
 * waves hello and goodbye, and holds or wears each chapter's prop.
 */
export default function LegoMahdi() {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const parts = useLegoParts();
  const { materials: m, geometries: g } = parts;
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const cap = useRef<Group>(null);
  const laptop = useRef<Group>(null);
  const brain = useRef<Group>(null);
  const clipboard = useRef<Group>(null);
  const rider = useRef(createRider());
  const motion = useRef({ stop: -1, hopStart: -10 });

  useFrame(({ camera, clock }, rawDelta) => {
    const r = root.current;
    if (!r || !body.current || !head.current || !armL.current || !armR.current || !legL.current || !legR.current) return;
    const delta = Math.min(rawDelta, 0.1);
    const t = clock.elapsedTime;
    if (!rideFlow(r, camera, delta, rider.current, reducedMotion)) return;
    const anim = reducedMotion ? 0 : 1;
    const s = motion.current;
    const speed = rider.current.speed;

    // A little hop whenever a new stop is reached.
    const stop = activeStopIndex(sceneState.track);
    if (stop !== s.stop) {
      if (s.stop !== -1 && anim) s.hopStart = t;
      s.stop = stop;
    }
    const k = (t - s.hopStart) / 0.45;
    body.current.position.y = k < 1 ? Math.sin(k * Math.PI) * 3.5 : 0;
    body.current.rotation.x = MathUtils.damp(body.current.rotation.x, speed * 0.12 * anim, 6, delta);

    // Walk cycle: legs scissor, arms swing against them.
    const stride = Math.sin(t * 11) * 0.7 * speed * anim;
    legL.current.rotation.x = stride;
    legR.current.rotation.x = -stride;

    const prop = PROP_AT_STOP[stop];
    const holding = prop === "laptop" || prop === "clipboard";
    const waving = (stop === 0 || stop === 6) && speed < 0.3;
    const hold = prop === "laptop" ? HOLD.laptop : HOLD.clipboard;
    armL.current.rotation.x = MathUtils.damp(armL.current.rotation.x, holding ? hold : -stride * 0.8, 12, delta);
    armR.current.rotation.x = MathUtils.damp(
      armR.current.rotation.x,
      holding ? hold : waving ? 0 : stride * 0.8,
      12,
      delta,
    );
    // Holding something, both arms swing in so its edges sit in the hand clips.
    armL.current.rotation.z = MathUtils.damp(armL.current.rotation.z, holding ? -HOLD_IN : 0, 10, delta);
    armR.current.rotation.z = MathUtils.damp(
      armR.current.rotation.z,
      holding ? HOLD_IN : waving ? -2.6 + Math.sin(t * 9) * 0.35 * anim : 0,
      10,
      delta,
    );

    // The classic minifig head swivel, following the cursor.
    head.current.rotation.y = MathUtils.damp(head.current.rotation.y, sceneState.pointer.x * 0.6 * anim, 5, delta);
    head.current.rotation.z = MathUtils.damp(head.current.rotation.z, waving ? 0.08 : 0, 5, delta);

    if (brain.current) brain.current.rotation.y = t * anim;
    const props: [PropName, Group | null][] = [
      ["cap", cap.current],
      ["laptop", laptop.current],
      ["brain", brain.current],
      ["clipboard", clipboard.current],
    ];
    animateProps(props, prop, delta);
  });

  return (
    <group ref={root} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[0.36, 32]} />
        <meshBasicMaterial color={LEGO.cyan} transparent opacity={0.14} />
      </mesh>

      <group scale={K}>
        <group ref={body}>
          {([1, -1] as const).map((side) => (
            <group key={side} ref={side === 1 ? legL : legR} position={[side * HIP.x, HIP.y, 0]}>
              <mesh geometry={g.leg} material={m.jeans} position={[0, -5.2, 0]} />
              <mesh geometry={g.shoe} material={m.shoes} position={[0, -10.3, 1.2]} />
            </group>
          ))}
          <mesh geometry={g.hip} material={m.jeans} position={[0, 12.1, 0]} />
          <mesh geometry={g.torso} material={m.shirt} position={[0, 19.6, 0]} />
          <mesh material={m.print} position={[0, 19.6, 3.92]}>
            <planeGeometry args={[15.6, 12.4]} />
          </mesh>
          <mesh material={m.skin} position={[0, 26.4, 0]}>
            <cylinderGeometry args={[2.6, 2.6, 1.4, 20]} />
          </mesh>
          <Arm side={1} pivot={armL} parts={parts} />
          <Arm side={-1} pivot={armR} parts={parts} />

          <group ref={head} position={[0, HEAD_Y, 0]}>
            <mesh geometry={g.head} material={m.face} />
            {/* Hair: a dome, a shell over the back and sides, and a quiff swept to one side. */}
            <mesh material={m.hair} position={[0, 2.4, 0]} scale={[1, 0.62, 1]}>
              <sphereGeometry args={[5.45, 32, 16, 0, Math.PI * 2, 0, 1.5]} />
            </mesh>
            <mesh material={m.hairShell} position={[0, 1.3, 0]}>
              <cylinderGeometry args={[5.42, 5.42, 3.7, 32, 1, true, Math.PI / 2 - 0.5, Math.PI + 1]} />
            </mesh>
            <mesh material={m.hair} position={[0.9, 4.1, 3.2]} rotation={[0.35, 0, -0.18]} scale={[3.4, 1.35, 1.9]}>
              <sphereGeometry args={[1, 20, 14]} />
            </mesh>
            <mesh material={m.hair} position={[-2.2, 3.9, 3.2]} rotation={[0.3, 0.3, 0.1]} scale={[2.7, 1.2, 1.8]}>
              <sphereGeometry args={[1, 20, 14]} />
            </mesh>

            <group position={[0, 5.6, 0]} rotation={[-0.08, 0, 0.06]} scale={1.15 / K}>
              <group ref={cap} scale={0}>
                <Cap />
              </group>
            </group>
            <group position={[0, 10.5, 0]} scale={1.2 / K}>
              <group ref={brain} scale={0}>
                <Brain />
              </group>
            </group>
          </group>

          <group position={[0, 18.3, 9]} scale={1.4 / K}>
            <group ref={laptop} scale={0}>
              <Laptop />
            </group>
          </group>
          <group position={[0, 20.3, 8.5]} scale={2 / K}>
            <group ref={clipboard} scale={0}>
              <Clipboard />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
