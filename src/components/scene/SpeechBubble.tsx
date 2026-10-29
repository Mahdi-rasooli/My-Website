"use client";

import { Html } from "@react-three/drei";
import SplitText from "@/components/text/SplitText";

/**
 * A comic speech bubble whose tail points at the minifig's mouth. `mouth` is in the
 * figure's root space, on its vertical axis so the bubble stays put as he turns.
 * `left` puts it on his other side on wide screens, clear of the page's right edge.
 */
export default function SpeechBubble({
  text,
  mouth,
  left = false,
}: {
  text: string;
  mouth: [number, number, number];
  left?: boolean;
}) {
  return (
    <Html position={mouth} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
      <div className={`speech-bubble ${left ? "speech-bubble--left" : ""}`} role="status">
        <div className="speech-bubble-body">
          <SplitText key={text} text={text} />
        </div>
      </div>
    </Html>
  );
}
