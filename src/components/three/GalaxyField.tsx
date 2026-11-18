'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mix, pulse, seeded, smooth } from '@/lib/math';
import { Points, type PointData } from './Points';

/** Artistic four-arm spiral with a warm core. Not a map of the Milky Way. */
function buildGalaxy(count: number): PointData {
  const random = seeded(20261118);
  const positions = new Float32Array(count * 3), sizes = new Float32Array(count), colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    const radius = Math.pow(random(), 0.72) * 8.5;
    const arm = i % 4;
    const theta = arm * Math.PI * 0.5 + radius * 0.58 + (random() - 0.5) * (0.35 + radius * 0.1);
    positions[j] = Math.cos(theta) * radius + (random() - 0.5) * 0.28;
    positions[j + 1] = Math.sin(theta) * radius * 0.52 + (random() - 0.5) * 0.32;
    positions[j + 2] = (random() - 0.5) * (0.6 + radius * 0.11);
    sizes[i] = 0.35 + Math.pow(random(), 3) * 1.3;
    // Core is warm/gold, arms drift to cool blue — this core glow becomes the seed of the Earth reveal.
    const core = 1 - smooth(0, 3.2, radius);
    const warm = random() < 0.42 + core * 0.5;
    colors[j] = warm ? 1.0 : 0.5;
    colors[j + 1] = warm ? 0.8 + random() * 0.16 : 0.65;
    colors[j + 2] = warm ? 0.6 + random() * 0.18 : 1.0;
  }
  return { positions, sizes, colors };
}

/** Sparse distant stars that stay behind the galaxy AND the Earth, so the handoff never cuts to a void. */
function buildStars(count: number): PointData {
  const random = seeded(4242);
  const positions = new Float32Array(count * 3), sizes = new Float32Array(count), colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    positions[j] = (random() - 0.5) * 60;
    positions[j + 1] = (random() - 0.5) * 40;
    positions[j + 2] = -14 - random() * 18;
    sizes[i] = 0.3 + Math.pow(random(), 4) * 1.4;
    const t = random();
    colors[j] = 0.75 + t * 0.25; colors[j + 1] = 0.8 + t * 0.12; colors[j + 2] = 1.0 - t * 0.25;
  }
  return { positions, sizes, colors };
}

export function GalaxyField({ progress, count }: { progress: React.MutableRefObject<number>; count: number }) {
  const galaxy = useMemo(() => buildGalaxy(count), [count]);
  const stars = useMemo(() => buildStars(Math.round(count * 0.28)), [count]);
  const material = useRef<THREE.ShaderMaterial>(null);
  const starMat = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const starGroup = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const p = progress.current;
    // Rises out of the cosmic web, peaks in chapter 02, dissolves into the Earth's core glow.
    const opacity = mix(0.18, 1, smooth(0.04, 0.18, p)) * (1 - smooth(0.3, 0.42, p)) * (0.55 + 0.42 * pulse(0.0, 0.16, 0.33, 0.42, p));
    const starOpacity = 0.55 * (1 - smooth(0.62, 0.72, p));
    if (material.current) {
      material.current.uniforms.uTime.value += delta;
      material.current.uniforms.uOpacity.value = opacity;
      material.current.uniforms.uSize.value = 0.85 + p * 1.6;
    }
    if (starMat.current) {
      starMat.current.uniforms.uTime.value += delta;
      starMat.current.uniforms.uOpacity.value = starOpacity;
      starMat.current.uniforms.uSize.value = 1;
    }
    if (group.current) {
      group.current.visible = opacity > 0.002;
      group.current.rotation.z = -p * 0.45;
      group.current.rotation.y = p * 0.21;
      group.current.scale.setScalar(1 + p * 1.25);
    }
    if (starGroup.current) {
      starGroup.current.visible = starOpacity > 0.002;
      starGroup.current.rotation.z = -p * 0.12;
    }
  });
  return (
    <>
      <group ref={starGroup}><Points ref={starMat} data={stars} /></group>
      <group ref={group}><Points ref={material} data={galaxy} /></group>
    </>
  );
}
