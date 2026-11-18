'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mix, seeded, smooth } from '@/lib/math';
import { Points, type PointData } from './Points';

/**
 * Chapter 01 — artistic cosmic-web filaments (NOT an astronomical dataset).
 * Random nodes are joined to their nearest neighbours; particles are scattered along each
 * segment with a gaussian-ish falloff, giving thin luminous filaments with bright knots.
 * The camera flies through the web while it dissolves into the galaxy.
 */
function buildWeb(count: number): PointData {
  const r = seeded(1977);
  const nodeCount = 30;
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < nodeCount; i++) nodes.push(new THREE.Vector3((r() - .5) * 30, (r() - .5) * 26, -16 + r() * 24));
  const edges: [number, number][] = [];
  nodes.forEach((n, i) => {
    nodes.map((m, j) => [n.distanceToSquared(m), j] as const).filter(([, j]) => j !== i)
      .sort((a, b) => a[0] - b[0]).slice(0, 2).forEach(([, j]) => { if (i < j || !edges.some(([a, b]) => a === j && b === i)) edges.push([i, j]); });
  });
  const positions = new Float32Array(count * 3), sizes = new Float32Array(count), colors = new Float32Array(count * 3);
  const gauss = () => (r() + r() + r() - 1.5) / 1.5;
  const tmp = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    const knot = r() < 0.22;
    if (knot) {
      const n = nodes[Math.floor(r() * nodeCount)];
      tmp.set(gauss(), gauss(), gauss()).multiplyScalar(0.9).add(n);
    } else {
      const [a, b] = edges[Math.floor(r() * edges.length)];
      tmp.lerpVectors(nodes[a], nodes[b], r()).add(new THREE.Vector3(gauss(), gauss(), gauss()).multiplyScalar(0.42));
    }
    positions[j] = tmp.x; positions[j + 1] = tmp.y; positions[j + 2] = tmp.z;
    sizes[i] = knot ? 0.5 + Math.pow(r(), 2) * 1.4 : 0.3 + Math.pow(r(), 3) * 0.8;
    const warm = knot && r() > 0.4;
    colors[j] = warm ? 1.0 : 0.55 + r() * 0.15;
    colors[j + 1] = warm ? 0.82 : 0.62 + r() * 0.12;
    colors[j + 2] = warm ? 0.62 : 1.0;
  }
  return { positions, sizes, colors };
}

export function CosmicWeb({ progress, count }: { progress: React.MutableRefObject<number>; count: number }) {
  const data = useMemo(() => buildWeb(count), [count]);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const p = progress.current;
    const opacity = smooth(0, 0.015, p + 0.015) * (1 - smooth(0.1, 0.22, p)) * 0.95;
    if (mat.current) {
      mat.current.uniforms.uTime.value += delta;
      mat.current.uniforms.uOpacity.value = opacity;
      mat.current.uniforms.uSize.value = 2.1;
    }
    if (group.current) {
      group.current.visible = opacity > 0.002;
      // Fly-through: the web streams past the camera as we move toward the galaxy.
      group.current.position.z = mix(0, 15, smooth(0, 0.22, p));
      group.current.rotation.z = p * 0.35;
    }
  });
  return <group ref={group}><Points ref={mat} data={data} /></group>;
}
