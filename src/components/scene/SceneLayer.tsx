"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { useIsMobile, useWebGLSupport } from "@/lib/useEnvironment";
import StaticDiagram from "@/components/fallback/StaticDiagram";

const Experience = dynamic(() => import("./Experience"), { ssr: false });

/** Fixed background layer: the 3D scene when WebGL works, a flat diagram otherwise. */
export default function SceneLayer() {
  const webgl = useWebGLSupport();
  const isMobile = useIsMobile();
  const dimmed = useStore((s) => s.activeStop === 5);

  if (webgl === null) return null;
  if (!webgl) return <StaticDiagram />;
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ${dimmed ? "opacity-30" : "opacity-100"}`}
    >
      <Experience isMobile={isMobile} />
    </div>
  );
}
