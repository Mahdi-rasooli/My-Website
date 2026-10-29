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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Laptop deck: a dark keyboard and trackpad, seen from above. 330 × 210 ≈ the deck's proportions. */
export function keyboardTexture() {
  const [c, ctx] = canvas(330, 210);
  ctx.fillStyle = "#2a303b";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#454e5e";
  const cols = 12;
  const key = (c.width - 30) / cols;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < cols; col++) roundRect(ctx, 15 + col * key + 2, 14 + row * 24, key - 4, 19, 4);
  }
  roundRect(ctx, 15 + 3 * key + 2, 14 + 4 * 24, key * 6 - 4, 19, 4); // space bar
  ctx.fillStyle = "#353c49";
  roundRect(ctx, c.width / 2 - 55, 140, 110, 58, 8); // trackpad
  return texture(c);
}

/**
 * Laptop screen: a code editor in the site's palette, its lines drawn as syntax-coloured
 * bars so it reads as code at minifig scale. 380 × 200 ≈ the screen's proportions.
 */
export function codeTexture() {
  const [c, ctx] = canvas(380, 200);
  ctx.fillStyle = "#0b1626";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#13233a";
  ctx.fillRect(0, 0, c.width, 26);
  [LEGO.amber, LEGO.cyan, "#5b6f8c"].forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(16 + i * 16, 13, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });

  const kw = LEGO.amber;
  const fn = LEGO.cyan;
  const tx = "#c9d6ea";
  const cm = "#4f6380";
  // [indent, [width, colour]...] per line
  const lines: [number, ...[number, string][]][] = [
    [0, [70, cm], [120, cm]],
    [0, [44, kw], [96, fn], [60, tx]],
    [1, [40, kw], [54, tx], [80, fn]],
    [1, [60, tx], [30, kw], [70, tx]],
    [2, [52, fn], [90, tx]],
    [1, [36, kw], [110, tx]],
    [0, [14, tx]],
  ];
  lines.forEach(([indent, ...tokens], i) => {
    const y = 40 + i * 22;
    ctx.fillStyle = "#3a4d68";
    roundRect(ctx, 12, y, 14, 9, 3);
    let x = 40 + indent * 24;
    for (const [w, color] of tokens) {
      ctx.fillStyle = color;
      roundRect(ctx, x, y, w, 9, 4);
      x += w + 8;
    }
  });
  ctx.fillStyle = LEGO.cyan;
  ctx.fillRect(40 + 24 + 36 + 110 + 16, 40 + 5 * 22 - 2, 3, 13); // caret
  return texture(c);
}

/**
 * Tablet screen at Avitec: a process diagram running down the screen, ISO's
 * Plan → Do → Check → Act cycle drawn as BPMN (start, tasks, a decision, end).
 * 260 × 340 ≈ the screen's proportions; FLOW_POINTS are the stops a token rides through.
 */
export const FLOW_POINTS: [number, number][] = [
  [130, 52],
  [130, 102],
  [130, 152],
  [130, 204],
  [130, 256],
  [130, 300],
];

export function processTexture() {
  const [c, ctx] = canvas(260, 340);
  ctx.fillStyle = "#0b1626";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#3a5878";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(130, 52);
  ctx.lineTo(130, 300);
  ctx.stroke();

  ctx.font = "bold 17px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const task = (y: number, label: string) => {
    ctx.fillStyle = "#13233a";
    ctx.strokeStyle = LEGO.cyan;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(70, y - 17, 120, 34, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e8f1ff";
    ctx.fillText(label, 130, y + 1);
  };

  // start event, tasks, a decision diamond, end event
  ctx.strokeStyle = LEGO.cyan;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(130, 52, 13, 0, Math.PI * 2);
  ctx.fillStyle = "#0b1626";
  ctx.fill();
  ctx.stroke();
  task(102, "PLAN");
  task(152, "DO");
  ctx.beginPath();
  ctx.moveTo(130, 178);
  ctx.lineTo(160, 204);
  ctx.lineTo(130, 230);
  ctx.lineTo(100, 204);
  ctx.closePath();
  ctx.fillStyle = "#13233a";
  ctx.fill();
  ctx.strokeStyle = LEGO.amber;
  ctx.stroke();
  ctx.fillStyle = LEGO.amber;
  ctx.font = "bold 13px monospace";
  ctx.fillText("✓?", 130, 205);
  ctx.font = "bold 17px monospace";
  task(256, "ACT");
  ctx.beginPath();
  ctx.arc(130, 300, 14, 0, Math.PI * 2);
  ctx.fillStyle = LEGO.amber;
  ctx.fill();

  // The loop back from the decision, and an ISO badge.
  ctx.strokeStyle = "#3a5878";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(160, 204);
  ctx.lineTo(214, 204);
  ctx.lineTo(214, 102);
  ctx.lineTo(192, 102);
  ctx.stroke();
  ctx.fillStyle = LEGO.cyan;
  ctx.beginPath();
  ctx.roundRect(16, 312, 64, 20, 10);
  ctx.fill();
  ctx.fillStyle = "#060e1a";
  ctx.font = "bold 12px monospace";
  ctx.fillText("ISO ✓", 48, 323);
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
