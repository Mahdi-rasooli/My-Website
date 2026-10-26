"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import CameraRig from "./CameraRig";
import ProcessPipes from "./ProcessPipes";
import DataPulses from "./DataPulses";
import NodeStations from "./NodeStations";
import LegoMahdi from "./LegoMahdi";

/** The full-screen 3D layer. Decorative only: all content lives in the HTML. */
export default function Experience({ isMobile }: { isMobile: boolean }) {
  const maxDpr = isMobile ? 1 : 1.75;
  const [dpr, setDpr] = useState(maxDpr);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Canvas
      dpr={dpr}
      frameloop={hidden ? "never" : "always"}
      camera={{ fov: 45, near: 0.1, far: 120, position: [0, 0.6, 9.5] }}
      gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
    >
      <fog attach="fog" args={["#0a1628", 16, 55]} />
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(maxDpr)} />
      <CameraRig isMobile={isMobile} />
      <ProcessPipes isMobile={isMobile} />
      <DataPulses count={isMobile ? 28 : 56} />
      <NodeStations />
      <hemisphereLight args={["#cfe8ff", "#0a1628", 1.4]} />
      <directionalLight position={[4, 6, 8]} intensity={2.2} />
      <directionalLight position={[-6, 2, -4]} intensity={1.2} color="#5ce1e6" />
      <LegoMahdi />
    </Canvas>
  );
}
