import { Vector2, type BufferGeometry } from "three";

/**
 * Narrows the top of a geometry in x (the minifig torso's trapezoid), scaling
 * linearly from 1 at the bottom to `topScale` at the top. Depth is untouched.
 */
export function taperTop<T extends BufferGeometry>(geometry: T, topScale: number): T {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const pos = geometry.getAttribute("position");
  const h = max.y - min.y || 1;
  for (let i = 0; i < pos.count; i++) {
    const k = (pos.getY(i) - min.y) / h;
    pos.setX(i, pos.getX(i) * (1 + (topScale - 1) * k));
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** Lathe profile of a minifig head: a cylinder with rounded top and bottom edges. */
export function headProfile(radius: number, height: number, bevel: number, steps = 6): Vector2[] {
  const h = height / 2;
  const pts = [new Vector2(0, -h)];
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    pts.push(new Vector2(radius - bevel + bevel * Math.cos(a), -h + bevel + bevel * Math.sin(a)));
  }
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new Vector2(radius - bevel + bevel * Math.cos(a), h - bevel + bevel * Math.sin(a)));
  }
  pts.push(new Vector2(0, h));
  return pts;
}

/**
 * Re-maps a lathe's v coordinate to height so a face print lands undistorted on
 * the straight side (the caps sample the print's top and bottom rows).
 */
export function uvByHeight<T extends BufferGeometry>(geometry: T, height: number): T {
  const pos = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) uv.setY(i, Math.min(1, Math.max(0, pos.getY(i) / height + 0.5)));
  uv.needsUpdate = true;
  return geometry;
}
