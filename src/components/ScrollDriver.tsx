"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { sceneState } from "@/lib/sceneState";
import { useStore } from "@/lib/store";
import { activeStopIndex, trackFromScroll } from "@/lib/track";

/** Smooth-scrolls to the panel for a stop (0 = hero … 6 = contact). */
export function scrollToStop(stop: number) {
  const el = document.querySelector<HTMLElement>(`[data-stop="${stop}"]`);
  if (!el) return;
  if (sceneState.lenis) sceneState.lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: "auto" });
}

/**
 * Turns scroll position into `sceneState.track`, keeps the active stop in the
 * store, and auto-optimizes the knot as soon as the visitor starts scrolling.
 */
export default function ScrollDriver() {
  useEffect(() => {
    const store = useStore.getState;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    store().setReducedMotion(reduced);

    let centers: number[] = [];
    const measure = () => {
      centers = Array.from(document.querySelectorAll<HTMLElement>("[data-stop]"))
        .sort((a, b) => Number(a.dataset.stop) - Number(b.dataset.stop))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return r.top + window.scrollY + r.height / 2;
        });
    };

    const update = () => {
      const track = trackFromScroll(window.scrollY + window.innerHeight / 2, centers);
      sceneState.velocity = track - sceneState.track;
      sceneState.track = track;
      const stop = activeStopIndex(track);
      if (stop !== store().activeStop) store().setActiveStop(stop);
      if (track > 0.15) store().optimize();
    };

    const onPointer = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    measure();
    update();
    const resize = new ResizeObserver(() => {
      measure();
      update();
    });
    resize.observe(document.body);
    window.addEventListener("pointermove", onPointer, { passive: true });

    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;
    if (reduced) {
      window.addEventListener("scroll", update, { passive: true });
    } else {
      lenis = new Lenis({ lerp: 0.09 });
      sceneState.lenis = lenis;
      lenis.on("scroll", update);
      tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    return () => {
      resize.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", update);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      sceneState.lenis = null;
    };
  }, []);

  return null;
}
