"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type DieResult = { sides: number; value: number };

function bipyramidGeometry(radius = 1, height = 1.2, segments = 5) {
  const positions: number[] = [];
  const top = [0, height, 0];
  const bottom = [0, -height, 0];
  const ring = Array.from({ length: segments * 2 }, (_, index) => {
    const angle = (index / (segments * 2)) * Math.PI * 2;
    const y = index % 2 ? -0.13 : 0.13;
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
  });
  const pushFace = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c);
  ring.forEach((point, index) => {
    const next = ring[(index + 1) % ring.length];
    pushFace(top, point, next);
    pushFace(bottom, next, point);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function geometryFor(sides: number) {
  if (sides === 4) return new THREE.TetrahedronGeometry(1.05);
  if (sides === 6) return new THREE.BoxGeometry(1.45, 1.45, 1.45);
  if (sides === 8) return new THREE.OctahedronGeometry(1.15);
  if (sides === 10 || sides === 100) return bipyramidGeometry(1.05, 1.2, 5);
  if (sides === 12) return new THREE.DodecahedronGeometry(1.02);
  if (sides === 20) return new THREE.IcosahedronGeometry(1.08);
  return new THREE.IcosahedronGeometry(1.08);
}

function numberSprite(value: number, gold: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 90;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#120b1ccc";
  context.roundRect(12, 12, 136, 66, 24);
  context.fill();
  context.strokeStyle = gold ? "#f0c65c" : "#9a77bd";
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = gold ? "#f5d36f" : "#ffffff";
  context.font = "700 42px Georgia";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(value), 80, 46);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.18, 0.66, 1);
  sprite.position.y = 1.45;
  return { sprite, texture, material };
}

export default function ThreeDice({
  total,
  dice,
}: {
  total: number;
  dice: DieResult[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (!host.current || !dice.length) return;
    const container = host.current;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    try {
      const width = Math.min(1100, Math.max(360, window.innerWidth - 16));
      const height = Math.min(760, Math.max(420, window.innerHeight * 0.76));
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setSize(width, height, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
      scene.add(new THREE.HemisphereLight(0xe8d8ff, 0x110818, 2.7));
      const key = new THREE.DirectionalLight(0xffd56c, 5);
      key.position.set(4, 5, 7);
      scene.add(key);
      const rim = new THREE.PointLight(0x9d52ff, 9, 18);
      rim.position.set(-5, -2, 5);
      scene.add(rim);
      const shown = dice.slice(0, 24);
      camera.position.set(0, 0.6, shown.length === 1 ? 7 : shown.length <= 4 ? 9.5 : 12.5);
      const columns = Math.ceil(Math.sqrt(shown.length * 1.45));
      const rows = Math.ceil(shown.length / columns);
      const spacing = shown.length > 12 ? 2.05 : shown.length > 4 ? 2.45 : 2.85;
      const groups = shown.map((dieResult, index) => {
        const group = new THREE.Group();
        const geometry = geometryFor(dieResult.sides);
        geometries.push(geometry);
        const material = new THREE.MeshStandardMaterial({
          color: index % 2 ? 0x4f2b6b : 0x39204f,
          roughness: 0.3,
          metalness: 0.38,
          flatShading: true,
        });
        materials.push(material);
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: dieResult.value === dieResult.sides ? 0xffe07c : 0xd9ae4d,
          transparent: true,
          opacity: 0.9,
        });
        materials.push(edgeMaterial);
        group.add(
          new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            edgeMaterial,
          ),
        );
        const label = numberSprite(
          dieResult.value,
          dieResult.value === dieResult.sides,
        );
        textures.push(label.texture);
        materials.push(label.material);
        group.add(label.sprite);
        const column = index % columns;
        const row = Math.floor(index / columns);
        group.position.set(
          (column - (Math.min(columns, shown.length) - 1) / 2) * spacing,
          ((rows - 1) / 2 - row) * spacing,
          0,
        );
        group.userData.startX = group.position.x;
        group.userData.startY = group.position.y;
        group.userData.seed = dieResult.value + index * 7;
        scene.add(group);
        return group;
      });
      const started = performance.now();
      function animate(now: number) {
        const elapsed = Math.min(1, (now - started) / 2200);
        const settle = 1 - Math.pow(1 - elapsed, 4);
        groups.forEach((group, index) => {
          const seed = group.userData.seed as number;
          const spin = (1 - settle) * (11 + (seed % 5));
          group.rotation.x = spin * 0.73 + (seed % 7) * 0.22 * settle;
          group.rotation.y = spin + (seed % 11) * 0.19 * settle;
          group.rotation.z = spin * 0.31 + (seed % 3) * 0.2 * settle;
          group.position.x =
            group.userData.startX +
            Math.sin(elapsed * Math.PI * 2 + index) * (1 - settle) * 0.65;
          group.position.y =
            group.userData.startY +
            Math.sin(elapsed * Math.PI) * (1.2 + (index % 3) * 0.12);
          const finalScale = shown.length === 1 ? 1.55 : shown.length <= 4 ? 1.25 : shown.length <= 9 ? 1 : 0.82;
          group.scale.setScalar(finalScale * (0.48 + settle * 0.52));
        });
        renderer!.render(scene, camera);
        if (elapsed < 1) frame = requestAnimationFrame(animate);
      }
      frame = requestAnimationFrame(animate);
      return () => {
        cancelAnimationFrame(frame);
        geometries.forEach((item) => item.dispose());
        materials.forEach((item) => item.dispose());
        textures.forEach((item) => item.dispose());
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch {
      setFallback(true);
      return () => {
        cancelAnimationFrame(frame);
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    }
  }, [dice, total]);
  return (
    <div className="three-dice-overlay dice-pool-overlay" aria-live="polite">
      <div
        ref={host}
        className={`three-dice-canvas dice-pool-canvas ${fallback ? "webgl-fallback" : ""}`}
      >
        {fallback && (
          <div className="fallback-results">
            {dice.map((die, index) => (
              <b key={index}>
                d{die.sides}: {die.value}
              </b>
            ))}
          </div>
        )}
      </div>
      <div className="three-dice-result">
        <span>{dice.length} DICE · ROLL TOTAL</span>
        <strong>{total}</strong>
      </div>
    </div>
  );
}
