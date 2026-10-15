"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { cameraStops } from "@/lib/world";
import { segmentOf } from "@/lib/track";
import { sceneState } from "@/lib/sceneState";

/** Glides the camera between per-stop framings as the visitor scrolls. */
export default function CameraRig({ isMobile }: { isMobile: boolean }) {
  const camera = useThree((s) => s.camera);
  const stops = useMemo(() => cameraStops(isMobile), [isMobile]);
  const target = useRef({ pos: new Vector3(), look: new Vector3() });
  const look = useRef<Vector3 | null>(null);

  useFrame((_, delta) => {
    const { from, to, t } = segmentOf(sceneState.track);
    const { pos, look: wantLook } = target.current;
    pos.lerpVectors(stops[from].pos, stops[to].pos, t);
    wantLook.lerpVectors(stops[from].look, stops[to].look, t);
    pos.x += sceneState.pointer.x * 0.35;
    pos.y += sceneState.pointer.y * 0.2;

    if (!look.current) {
      camera.position.copy(pos);
      look.current = wantLook.clone();
    }
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 3.5);
    camera.position.lerp(pos, k);
    look.current.lerp(wantLook, k);
    camera.lookAt(look.current);
  });

  return null;
}
