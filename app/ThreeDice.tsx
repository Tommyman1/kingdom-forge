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

function faceNumber(value: number, sides: number, gold: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  if (gold) {
    const glow = context.createRadialGradient(64, 64, 8, 64, 64, 58);
    glow.addColorStop(0, "rgba(255, 225, 123, 0.42)");
    glow.addColorStop(0.55, "rgba(184, 113, 255, 0.2)");
    glow.addColorStop(1, "rgba(184, 113, 255, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 128, 128);
    context.shadowColor = "#ffd75f";
    context.shadowBlur = 18;
  }
  context.fillStyle = gold ? "#ffe17b" : "#fffaf0";
  context.strokeStyle = "#160d20";
  context.lineWidth = 10;
  context.font = `700 ${sides > 20 ? 46 : 58}px Georgia`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.strokeText(String(value), 64, 67);
  context.fillText(String(value), 64, 67);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  return { texture, material };
}

function addFaceNumbers(group: THREE.Group, geometry: THREE.BufferGeometry, sides: number, result: number, geometries: THREE.BufferGeometry[], materials: THREE.Material[], textures: THREE.Texture[]) {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const position = flat.getAttribute("position");
  const faces: Array<{ normal: THREE.Vector3; vertices: THREE.Vector3[] }> = [];
  for (let index = 0; index < position.count; index += 3) {
    const vertices = [0, 1, 2].map((offset) =>
      new THREE.Vector3(
        position.getX(index + offset),
        position.getY(index + offset),
        position.getZ(index + offset),
      ),
    );
    const triangleCenter = vertices.reduce((sum, vertex) => sum.add(vertex), new THREE.Vector3()).multiplyScalar(1 / 3);
    const normal = vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0])).normalize();
    if (normal.dot(triangleCenter) < 0) normal.multiplyScalar(-1);
    let face = faces.find((item) => item.normal.angleTo(normal) < 0.035);
    if (!face) {
      face = { normal, vertices: [] };
      faces.push(face);
    }
    vertices.forEach((vertex) => {
      if (!face!.vertices.some((item) => item.distanceToSquared(vertex) < 0.000001)) face!.vertices.push(vertex);
    });
  }
  faces.forEach(({ normal, vertices }, index) => {
    const isResultFace = index === 0;
    const value = index === 0 ? result : ((index - 1) % sides) + 1;
    const label = faceNumber(value, sides, isResultFace);
    materials.push(label.material); textures.push(label.texture);
    const baseScale = sides >= 20 ? 0.36 : sides >= 12 ? 0.42 : sides >= 8 ? 0.48 : 0.58;
    const scale = baseScale * (isResultFace ? 1.18 : 1);
    const planeGeometry = new THREE.PlaneGeometry(scale, scale);
    geometries.push(planeGeometry);
    const plane = new THREE.Mesh(planeGeometry, label.material);
    const faceCenter = vertices.reduce((sum, vertex) => sum.add(vertex), new THREE.Vector3()).multiplyScalar(1 / vertices.length);
    plane.position.copy(faceCenter).addScaledVector(normal, isResultFace ? 0.014 : 0.009);
    plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    plane.renderOrder = 4;
    group.add(plane);
  });
  if (flat !== geometry) flat.dispose();
  return faces[0]?.normal.clone() ?? new THREE.Vector3(0, 0, 1);
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
    let resizeObserver: ResizeObserver | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      const bounds = container.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      renderer.setSize(width, height, false);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
      const resize = () => {
        const next = container.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.round(next.width));
        const nextHeight = Math.max(1, Math.round(next.height));
        renderer!.setSize(nextWidth, nextHeight, false);
        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
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
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        });
        materials.push(material);
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: dieResult.value === dieResult.sides ? 0xffe07c : 0xd9ae4d,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        });
        materials.push(edgeMaterial);
        const edgeGeometry = new THREE.EdgesGeometry(geometry, 1);
        geometries.push(edgeGeometry);
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        edges.scale.setScalar(1.0015);
        edges.renderOrder = 3;
        group.add(edges);
        const resultFaceNormal = addFaceNumbers(group, geometry, dieResult.sides, dieResult.value, geometries, materials, textures);
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
        group.userData.resultRotation = new THREE.Quaternion().setFromUnitVectors(
          resultFaceNormal,
          new THREE.Vector3(0, 0, 1),
        );
        scene.add(group);
        return group;
      });
      const started = performance.now();
      function animate(now: number) {
        const elapsed = Math.min(1, (now - started) / 3900);
        const settle = 1 - Math.pow(1 - elapsed, 3);
        groups.forEach((group, index) => {
          const seed = group.userData.seed as number;
          const resultRotation = group.userData.resultRotation as THREE.Quaternion;
          const spinRotation = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
              elapsed * Math.PI * (8.5 + (seed % 3) * 0.35),
              elapsed * Math.PI * (11 + (seed % 5) * 0.3),
              elapsed * Math.PI * (4.2 + (seed % 2) * 0.25),
            ),
          );
          const lockProgress = THREE.MathUtils.smoothstep(elapsed, 0.58, 1);
          group.quaternion.copy(spinRotation).slerp(resultRotation, lockProgress);
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
        resizeObserver?.disconnect();
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
        resizeObserver?.disconnect();
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
