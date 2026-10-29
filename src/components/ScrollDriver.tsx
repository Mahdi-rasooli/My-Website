"use client";

import { useEffect } from "react";
import { sceneState } from "@/lib/sceneState";
import { useStore } from "@/lib/store";
import { activeStopIndex, trackFromScroll } from "@/lib/track";

/** Scrolls so the panel for a stop (0 = hero … 6 = contact) is centered. */
export function scrollToStop(stop: number) {
  const el = document.querySelector<HTMLElement>(`[data-stop="${stop}"]`);
  if (!el) return;
  const reduced = useStore.getState().reducedMotion;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
}

/**
 * Turns native scroll position into `sceneState.track`, keeps the active stop
 * in the store, and auto-optimizes the knot as soon as the visitor scrolls.
 * The camera eases toward the track on its own, so native scrolling stays
 * smooth without hijacking the browser's scroll.
 */
export default function ScrollDriver() {
  useEffect(() => {
    const store = useStore.getState;
    store().setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    let centers: number[] = [];
    // Phone browsers resize the viewport by an address bar's height as it slides in and out.
    // Ignoring changes that small stops them from nudging the track mid-scroll.
    let viewWidth = window.innerWidth;
    let viewHeight = window.innerHeight;
    const measure = () => {
      if (window.innerWidth !== viewWidth || Math.abs(window.innerHeight - viewHeight) > 150) {
        viewWidth = window.innerWidth;
        viewHeight = window.innerHeight;
      }
      centers = Array.from(document.querySelectorAll<HTMLElement>("[data-stop]"))
        .sort((a, b) => Number(a.dataset.stop) - Number(b.dataset.stop))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return r.top + window.scrollY + r.height / 2;
        });
    };

    const update = () => {
      const track = trackFromScroll(window.scrollY + viewHeight / 2, centers);
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
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return null;
}
