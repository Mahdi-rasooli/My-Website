import { create } from "zustand";
import gsap from "gsap";
import { sceneState } from "./sceneState";

interface SiteState {
  /** The knot has been (or is being) untangled. */
  optimized: boolean;
  activeStop: number;
  booted: boolean;
  reducedMotion: boolean;
  optimize: () => void;
  setActiveStop: (index: number) => void;
  setBooted: () => void;
  setReducedMotion: (value: boolean) => void;
  /** The mini-game was won: the 3D figure cheers. */
  celebrate: () => void;
}

export const useStore = create<SiteState>((set, get) => ({
  optimized: false,
  activeStop: 0,
  booted: false,
  reducedMotion: false,
  optimize: () => {
    if (get().optimized) return;
    set({ optimized: true });
    if (get().reducedMotion) {
      sceneState.untangle = 1;
      return;
    }
    gsap.to(sceneState, { untangle: 1, duration: 1.8, ease: "power3.inOut" });
  },
  setActiveStop: (activeStop) => set({ activeStop }),
  setBooted: () => set({ booted: true }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  celebrate: () => {
    sceneState.celebratedAt = performance.now() / 1000;
  },
}));
