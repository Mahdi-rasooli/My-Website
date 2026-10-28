"use client";

import { useEffect, useMemo } from "react";
import { MeshBasicMaterial, MeshStandardMaterial } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { codeTexture, keyboardTexture } from "./prints";

/** Laptop depth, lid height and the lid's lean back toward its owner. */
export const LAPTOP = { depth: 7.2, base: 1.0, lid: 6.6, lidThickness: 0.7, lean: 0.2 };

/**
 * A minifig-scale laptop in millimetres, origin at the center of its base. Open, with
 * the screen (a code editor in the site's palette) turned toward the viewer and the
 * hinge on the side nearest the figure.
 */
export default function LegoLaptop({ width }: { width: number }) {
  const parts = useMemo(() => {
    const keys = keyboardTexture();
    const code = codeTexture();
    return {
      textures: [keys, code],
      shell: new MeshStandardMaterial({ color: "#4a5262", roughness: 0.35, metalness: 0.15 }),
      hinge: new MeshStandardMaterial({ color: "#2a303b", roughness: 0.5 }),
      deck: new MeshStandardMaterial({ map: keys, roughness: 0.6 }),
      screen: new MeshBasicMaterial({ map: code, toneMapped: false }),
      base: new RoundedBoxGeometry(width, LAPTOP.base, LAPTOP.depth, 2, 0.35),
      lid: new RoundedBoxGeometry(width, LAPTOP.lid, LAPTOP.lidThickness, 2, 0.3),
    };
  }, [width]);

  useEffect(
    () => () => {
      parts.textures.forEach((t) => t.dispose());
      [parts.shell, parts.hinge, parts.deck, parts.screen, parts.base, parts.lid].forEach((x) => x.dispose());
    },
    [parts],
  );

  const top = LAPTOP.base / 2;
  const back = -LAPTOP.depth / 2 + 0.4;
  return (
    <group>
      <mesh geometry={parts.base} material={parts.shell} />
      <mesh material={parts.deck} position={[0, top + 0.01, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 1.2, LAPTOP.depth - 1.6]} />
      </mesh>
      <mesh material={parts.hinge} position={[0, top, back]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, width - 2, 12]} />
      </mesh>
      <group position={[0, top, back]} rotation={[-LAPTOP.lean, 0, 0]}>
        <mesh geometry={parts.lid} material={parts.shell} position={[0, LAPTOP.lid / 2, 0]} />
        <mesh material={parts.screen} position={[0, LAPTOP.lid / 2 + 0.15, LAPTOP.lidThickness / 2 + 0.01]}>
          <planeGeometry args={[width - 1.1, LAPTOP.lid - 1.3]} />
        </mesh>
      </group>
    </group>
  );
}
