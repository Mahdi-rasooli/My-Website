"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, type Points } from "three";
import { mainCurve } from "@/lib/world";
import { sceneState } from "@/lib/sceneState";
import { useStore } from "@/lib/store";

const LUT = mainCurve.getSpacedPoints(1024);

const vertexShader = /* glsl */ `
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (220.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor * (0.6 + a), a * a);
  }
`;

/** Glowing data packets riding the optimized flow. */
export default function DataPulses({ count }: { count: number }) {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const points = useRef<Points>(null);

  const { geometry, material, offsets } = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    const material = new ShaderMaterial({
      uniforms: { uColor: { value: new Color("#ffb547") }, uSize: { value: 0 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const offsets = Float32Array.from({ length: count }, (_, i) => (i + 0.3 + ((i * 7919) % 13) / 26) / count);
    return { geometry, material, offsets };
  }, [count]);

  useFrame((state) => {
    const p = points.current;
    if (!p) return;
    const u = sceneState.untangle;
    (p.material as ShaderMaterial).uniforms.uSize.value = u > 0.85 ? ((u - 0.85) / 0.15) * 0.55 : 0;
    if (u <= 0.85) return;
    const t = reducedMotion ? 0 : state.clock.elapsedTime * 0.018;
    const pos = p.geometry.getAttribute("position") as BufferAttribute;
    for (let i = 0; i < count; i++) {
      const point = LUT[Math.floor(((offsets[i] + t) % 1) * (LUT.length - 1))];
      pos.setXYZ(i, point.x, point.y, point.z);
    }
    pos.needsUpdate = true;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}
