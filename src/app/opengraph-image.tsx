import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const alt = `${profile.name}: ${profile.pitch}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Rendered once at build time for the static export.
export const dynamic = "force-static";

/** Share card: the name over the blueprint grid with the optimized flow underneath. */
export default function OpengraphImage() {
  const nodes = [140, 420, 700, 980];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0a1628",
          backgroundImage:
            "linear-gradient(rgba(120,170,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(120,170,255,0.09) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#e8f1ff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, color: "#5ce1e6", fontFamily: "monospace" }}>
            process mahdi_rasouli.exe / state: optimized
          </div>
          <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -2, marginTop: 24, lineHeight: 1 }}>
            {profile.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 40, marginTop: 28, color: "#e8f1ff" }}>{profile.pitch}</div>
          <div style={{ fontSize: 28, marginTop: 12, color: "#7f93b2" }}>{profile.role}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", position: "relative", height: 40 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 19, height: 3, background: "#5ce1e6", opacity: 0.6 }} />
          {nodes.map((x) => (
            <div
              key={x}
              style={{
                position: "absolute",
                left: x,
                top: 6,
                width: 28,
                height: 28,
                transform: "rotate(45deg)",
                background: x === 980 ? "#ffb547" : "#0a1628",
                border: "3px solid #5ce1e6",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
