"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  LatheGeometry,
  MathUtils,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type Group,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { activeStopIndex } from "@/lib/track";
import { sceneState } from "@/lib/sceneState";
import { useStore } from "@/lib/store";
import { createRider, rideFlow } from "./flowRider";
import { Brain, Cap, PROP_AT_STOP, animateProps, type PropName } from "./AvatarProps";
import { clipShape, headProfile, taperTop, uvByHeight } from "./lego/shapes";
import { LEGO, faceTexture, torsoTexture } from "./lego/prints";
import { ARM, HAND, HAND_REST, RING_OFFSET, gripRotation, ringCenter, slotAngle } from "./lego/rig";
import LegoLaptop, { LAPTOP } from "./lego/LegoLaptop";
import LegoTablet from "./lego/LegoTablet";

/** The figure is modelled in real minifig millimetres; ~37 mm stands ~1.2 units tall. */
const K = 0.0325;
const HEAD_R = 5;
const HEAD_H = 8.8;
const HEAD_Y = 31.4;
const HIP = { x: 3.9, y: 11.5 };
/** Arms raised forward (x) and swung in (in) to hold a prop. */
const HOLD = { tablet: { x: -0.75, in: 0.1 }, laptop: { x: -0.7, in: 0.1 } };

/**
 * The laptop is fitted to his hands rather than the other way round: in the laptop pose
 * the hands turn to grip a flat edge, and the base's side edges sit 0.4 mm inside each
 * hand's hole. The hands hold its back half, so the lid clears his chest and chin.
 */
const laptopArm = new Euler(HOLD.laptop.x, 0, -HOLD.laptop.in);
const LAPTOP_GRIP = ringCenter(1, laptopArm, gripRotation(1, laptopArm, new Quaternion()));
const LAPTOP_WIDTH = 2 * (LAPTOP_GRIP.x + 0.4);
const LAPTOP_POSITION: [number, number, number] = [0, LAPTOP_GRIP.y, LAPTOP_GRIP.z + LAPTOP.depth / 2 - 1.6];

/**
 * The tablet is held the same way, by its side edges: it leans back a little toward him,
 * so the hands turn until their holes run along those tilted edges.
 */
const TABLET_TILT = 0.3;
const TABLET_EDGE = new Vector3(0, Math.cos(TABLET_TILT), -Math.sin(TABLET_TILT));
const tabletArm = new Euler(HOLD.tablet.x, 0, -HOLD.tablet.in);
const TABLET_GRIP = ringCenter(1, tabletArm, gripRotation(1, tabletArm, new Quaternion(), TABLET_EDGE));
const TABLET_WIDTH = 2 * (TABLET_GRIP.x + 0.4);
const TABLET_POSITION: [number, number, number] = [0, TABLET_GRIP.y, TABLET_GRIP.z];

function useLegoParts() {
  const parts = useMemo(() => {
    const plastic = (color: string, extra: Partial<MeshStandardMaterial> = {}) =>
      new MeshStandardMaterial({ color, roughness: 0.32, metalness: 0, ...extra });
    const face = faceTexture();
    const print = torsoTexture();
    const materials = {
      skin: plastic(LEGO.skin),
      hair: plastic(LEGO.hair, { roughness: 0.45 }),
      hairShell: plastic(LEGO.hair, { roughness: 0.45, side: DoubleSide }),
      jacket: plastic(LEGO.jacket),
      rib: plastic(LEGO.rib, { roughness: 0.6 }),
      accent: plastic(LEGO.amber),
      jeans: plastic(LEGO.jeans),
      shoes: plastic(LEGO.shoes),
      face: plastic("#ffffff", { map: face }),
      print: plastic("#ffffff", { map: print, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }),
    };
    const geometries = {
      leg: new RoundedBoxGeometry(7.4, 9, 5.8, 3, 0.7),
      shoe: new RoundedBoxGeometry(7.4, 2.4, 8.4, 3, 0.7),
      sole: new RoundedBoxGeometry(7.7, 0.8, 8.7, 2, 0.35),
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
 * One arm on a shoulder pivot: a jacket sleeve bent forward at the elbow, ending in a
 * striped rib cuff, then a wrist peg into a solid C-clip hand.
 */
function Arm({
  side,
  pivot,
  wrist,
  parts,
}: {
  side: 1 | -1;
  pivot: React.Ref<Group>;
  wrist: React.Ref<Group>;
  parts: Parts;
}) {
  const { materials: m, geometries: g } = parts;
  return (
    <group ref={pivot} position={[side * ARM.shoulder.x, ARM.shoulder.y, 0]}>
      <mesh material={m.jacket}>
        <sphereGeometry args={[2.15, 16, 12]} />
      </mesh>
      <group rotation={[0, 0, side * ARM.splay]}>
        <mesh material={m.jacket} position={[0, -2.2, 0]}>
          <cylinderGeometry args={[2.25, 2.0, 4.4, 16]} />
        </mesh>
        <group position={[0, ARM.elbowY, 0]} rotation={[ARM.bend, 0, 0]}>
          <mesh material={m.jacket} position={[0, -1.6, 0]}>
            <cylinderGeometry args={[1.95, 1.8, 3.2, 20]} />
          </mesh>
          <mesh material={m.rib} position={[0, -3.55, 0]}>
            <cylinderGeometry args={[1.82, 1.75, 0.9, 20]} />
          </mesh>
          <mesh material={m.accent} position={[0, -3.55, 0]}>
            <cylinderGeometry args={[1.84, 1.84, 0.2, 20]} />
          </mesh>
          {/* Wrist peg, then the C-clip hand: its back wall takes the peg, the slot faces away. */}
          <mesh material={m.skin} position={[0, -4.5, 0]}>
            <cylinderGeometry args={[1.15, 1.15, 1.2, 16]} />
          </mesh>
          <group ref={wrist} position={[0, ARM.wristY, 0]} quaternion={HAND_REST}>
            <group position={RING_OFFSET} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh geometry={g.hand} material={m.skin} rotation={[0, 0, slotAngle(side)]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Mahdi as a LEGO minifigure: short quiff, heavy brows, stubble beard, an open coral bomber
 * over a cream tee, slim jeans and amber-soled sneakers. He walks the flow, turns his head
 * toward the cursor, hops at each new node,
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
  const wristL = useRef<Group>(null);
  const wristR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const cap = useRef<Group>(null);
  const laptop = useRef<Group>(null);
  const brain = useRef<Group>(null);
  const tablet = useRef<Group>(null);
  const rider = useRef(createRider());
  const motion = useRef({ stop: -1, hopStart: -10, grip: new Quaternion() });

  useFrame(({ camera, clock }, rawDelta) => {
    const r = root.current;
    if (!r || !body.current || !head.current || !armL.current || !armR.current || !legL.current || !legR.current)
      return;
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
    // Won the mini-game: a few seconds of arms-up bouncing at the game stop.
    const cheering = stop === 5 && performance.now() / 1000 - sceneState.celebratedAt < 3;
    const cheerArm = 2.7 + Math.sin(t * 10) * 0.25 * anim;
    body.current.position.y =
      cheering && anim ? Math.abs(Math.sin(t * 7)) * 3 : k < 1 ? Math.sin(k * Math.PI) * 3.5 : 0;
    body.current.rotation.x = MathUtils.damp(body.current.rotation.x, speed * 0.12 * anim, 6, delta);

    // Walk cycle: legs scissor, arms swing against them.
    const stride = Math.sin(t * 11) * 0.7 * speed * anim;
    legL.current.rotation.x = stride;
    legR.current.rotation.x = -stride;

    const prop = PROP_AT_STOP[stop];
    const holding = prop === "laptop" || prop === "tablet";
    const waving = (stop === 0 || stop === 6) && speed < 0.3;
    const hold = prop === "laptop" ? HOLD.laptop : HOLD.tablet;
    armL.current.rotation.x = MathUtils.damp(
      armL.current.rotation.x,
      holding ? hold.x : cheering ? 0 : -stride * 0.8,
      12,
      delta,
    );
    armR.current.rotation.x = MathUtils.damp(
      armR.current.rotation.x,
      holding ? hold.x : waving || cheering ? 0 : stride * 0.8,
      12,
      delta,
    );
    // Holding something, both arms swing in so its edges sit in the hand clips.
    armL.current.rotation.z = MathUtils.damp(
      armL.current.rotation.z,
      holding ? -hold.in : cheering ? cheerArm : 0,
      10,
      delta,
    );
    armR.current.rotation.z = MathUtils.damp(
      armR.current.rotation.z,
      holding ? hold.in : cheering ? -cheerArm : waving ? -2.6 + Math.sin(t * 9) * 0.35 * anim : 0,
      10,
      delta,
    );

    // For the laptop, the wrists turn so the base's edges slide into the hand clips.
    const ease = 1 - Math.exp(-14 * delta);
    for (const side of [1, -1] as const) {
      const arm = side === 1 ? armL.current : armR.current;
      const wrist = side === 1 ? wristL.current : wristR.current;
      if (!wrist) continue;
      const target =
        prop === "laptop"
          ? gripRotation(side, arm.rotation, s.grip)
          : prop === "tablet"
            ? gripRotation(side, arm.rotation, s.grip, TABLET_EDGE)
            : HAND_REST;
      wrist.quaternion.slerp(target, ease);
    }

    // The classic minifig head swivel, following the cursor.
    head.current.rotation.y = MathUtils.damp(head.current.rotation.y, sceneState.pointer.x * 0.6 * anim, 5, delta);
    head.current.rotation.z = MathUtils.damp(head.current.rotation.z, waving ? 0.08 : 0, 5, delta);

    if (brain.current) brain.current.rotation.y = t * anim;
    const props: [PropName, Group | null][] = [
      ["cap", cap.current],
      ["laptop", laptop.current],
      ["brain", brain.current],
      ["tablet", tablet.current],
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
              <mesh geometry={g.sole} material={m.accent} position={[0, -11.1, 1.2]} />
            </group>
          ))}
          <mesh geometry={g.hip} material={m.jeans} position={[0, 12.1, 0]} />
          <mesh geometry={g.torso} material={m.jacket} position={[0, 19.6, 0]} />
          <mesh material={m.print} position={[0, 19.6, 3.92]}>
            <planeGeometry args={[15.6, 12.4]} />
          </mesh>
          <mesh material={m.skin} position={[0, 26.4, 0]}>
            <cylinderGeometry args={[2.6, 2.6, 1.4, 20]} />
          </mesh>
          <Arm side={1} pivot={armL} wrist={wristL} parts={parts} />
          <Arm side={-1} pivot={armR} wrist={wristR} parts={parts} />

          <group ref={head} position={[0, HEAD_Y, 0]}>
            <mesh geometry={g.head} material={m.face} />
            {/* Hair: a dome, a shell over the back and sides, and a quiff swept to one side. */}
            <mesh material={m.hair} position={[0, 2.4, 0]} scale={[1, 0.85, 1]}>
              <sphereGeometry args={[5.45, 32, 16, 0, Math.PI * 2, 0, 1.5]} />
            </mesh>
            <mesh material={m.hairShell} position={[0, 1.3, 0]}>
              <cylinderGeometry args={[5.42, 5.42, 3.7, 32, 1, true, Math.PI / 2 - 0.5, Math.PI + 1]} />
            </mesh>
            <mesh material={m.hair} position={[0.9, 5.2, 3.2]} rotation={[0.35, 0, -0.18]} scale={[3.4, 1.6, 1.9]}>
              <sphereGeometry args={[1, 20, 14]} />
            </mesh>
            <mesh material={m.hair} position={[-2.2, 4.8, 3.2]} rotation={[0.3, 0.3, 0.1]} scale={[2.7, 1.4, 1.8]}>
              <sphereGeometry args={[1, 20, 14]} />
            </mesh>

            <group position={[0, 6.8, 0]} rotation={[-0.08, 0, 0.06]} scale={1.15 / K}>
              <group ref={cap} scale={0}>
                <Cap />
              </group>
            </group>
            <group position={[0, 11.6, 0]} scale={1.2 / K}>
              <group ref={brain} scale={0}>
                <Brain />
              </group>
            </group>
          </group>

          <group position={LAPTOP_POSITION}>
            <group ref={laptop} scale={0}>
              <LegoLaptop width={LAPTOP_WIDTH} />
            </group>
          </group>
          <group position={TABLET_POSITION} rotation={[-TABLET_TILT, 0, 0]}>
            <group ref={tablet} scale={0}>
              <LegoTablet width={TABLET_WIDTH} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
