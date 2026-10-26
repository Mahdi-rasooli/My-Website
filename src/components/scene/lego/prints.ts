import { CanvasTexture, SRGBColorSpace } from "three";

export const LEGO = {
  skin: "#f0c9a2",
  hair: "#2b1d15",
  shirt: "#8b9096",
  collar: "#6b7078",
  jeans: "#41608f",
  shoes: "#e3e7ee",
  cyan: "#5ce1e6",
  amber: "#ffb547",
};

/** Small deterministic PRNG so the stubble looks the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function texture(c: HTMLCanvasElement) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Mirrors a right-half outline (dx from the face center, y) into a closed path. */
function mirrored(ctx: CanvasRenderingContext2D, cx: number, half: [number, number][]) {
  ctx.beginPath();
  half.forEach(([dx, y], i) => (i === 0 ? ctx.moveTo(cx + dx, y) : ctx.lineTo(cx + dx, y)));
  for (let i = half.length - 1; i >= 0; i--) ctx.lineTo(cx - half[i][0], half[i][1]);
  ctx.closePath();
}

/**
 * Mahdi's face print, wrapped once around the head (u = 0.5 is the front).
 * 1024 × 288 matches the head's circumference-to-height ratio, ~33 px per mm.
 */
export function faceTexture() {
  const [c, ctx] = canvas(1024, 288);
  const cx = 512;
  ctx.fillStyle = LEGO.skin;
  ctx.fillRect(0, 0, c.width, c.height);

  // Short stubble beard and mustache: one clean printed shape with speckle inside.
  const beard: [number, number][] = [
    [0, 168], [58, 172], [96, 198], [150, 186], [204, 140], [262, 150],
    [262, 288], [0, 288],
  ];
  mirrored(ctx, cx, beard);
  ctx.fillStyle = "rgba(60, 41, 31, 0.5)";
  ctx.fill();
  ctx.save();
  ctx.clip();
  const rand = rng(7);
  ctx.fillStyle = "rgba(36, 24, 18, 0.45)";
  for (let i = 0; i < 1600; i++) {
    ctx.beginPath();
    ctx.arc(cx - 270 + rand() * 540, 140 + rand() * 150, 0.8 + rand() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Heavy, straight brows.
  ctx.fillStyle = LEGO.hair;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 26, 96);
    ctx.quadraticCurveTo(cx + s * 62, 80, cx + s * 104, 86);
    ctx.lineTo(cx + s * 102, 96);
    ctx.quadraticCurveTo(cx + s * 62, 92, cx + s * 28, 108);
    ctx.closePath();
    ctx.fill();
  }

  // Classic minifig eyes with a highlight.
  for (const s of [-1, 1]) {
    ctx.fillStyle = "#1a120e";
    ctx.beginPath();
    ctx.ellipse(cx + s * 62, 128, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx + s * 62 - 5, 120, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // A hint of nose, and a calm half-smile.
  ctx.strokeStyle = "rgba(90, 50, 35, 0.45)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, 150, 13, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = "#3a1f17";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx - 46, 214);
  ctx.quadraticCurveTo(cx + 4, 230, cx + 50, 208);
  ctx.stroke();

  return texture(c);
}

/**
 * Tee print for the torso front: neck showing through the crew collar and a tiny
 * process-flow logo on the chest. Clipped to the torso's trapezoid, 20 px per mm.
 */
export function shirtTexture() {
  const [c, ctx] = canvas(312, 248);
  const inset = 36; // the torso is 1.8 mm narrower on each side at the top
  ctx.beginPath();
  ctx.moveTo(0, c.height);
  ctx.lineTo(c.width, c.height);
  ctx.lineTo(c.width - inset, 0);
  ctx.lineTo(inset, 0);
  ctx.closePath();
  ctx.clip();

  const cx = c.width / 2;
  ctx.fillStyle = LEGO.skin;
  ctx.beginPath();
  ctx.moveTo(cx - 52, 0);
  ctx.quadraticCurveTo(cx, 64, cx + 52, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = LEGO.collar;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(cx - 56, -2);
  ctx.quadraticCurveTo(cx, 70, cx + 56, -2);
  ctx.stroke();

  // Chest logo: input ring → node → amber result.
  const y = 104;
  ctx.strokeStyle = LEGO.cyan;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx + 34, y + 14);
  ctx.lineTo(cx + 54, y - 6);
  ctx.lineTo(cx + 76, y + 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 30, y + 18, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = LEGO.amber;
  ctx.beginPath();
  ctx.arc(cx + 82, y + 14, 8, 0, Math.PI * 2);
  ctx.fill();

  // Hem shadow where the tee meets the hips.
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.fillRect(0, c.height - 10, c.width, 10);

  return texture(c);
}
