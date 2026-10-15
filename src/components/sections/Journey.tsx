"use client";

import { profile } from "@/content/profile";
import { useStore } from "@/lib/store";
import NodeCard from "./NodeCard";

/** Stops 1–4: one full-height panel per career node, card on the left (bottom on mobile). */
export default function Journey() {
  const activeStop = useStore((s) => s.activeStop);
  return (
    <div aria-label="Career journey">
      {profile.nodes.map((node, i) => (
        <section
          key={node.id}
          data-stop={i + 1}
          className="flex min-h-svh items-end px-5 py-16 md:items-center md:px-12 lg:px-20"
        >
          <NodeCard node={node} active={activeStop === i + 1} />
        </section>
      ))}
    </div>
  );
}
