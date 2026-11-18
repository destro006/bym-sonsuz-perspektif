'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pulse, smooth } from '@/lib/math';

const vertex = /* glsl */ `
attribute float aSize;
attribute vec3 aTint;
uniform float uTime;
uniform float uSize;
varying vec3 vTint;
void main(){
  vTint = aTint;
  vec3 p = position;
  float d = length(p.xy);
  p.xy += vec2(sin(uTime * 0.13 + d * 0.9), cos(uTime * 0.11 + d * 0.7)) * 0.018;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = clamp(aSize * uSize * (75.0 / max(2.0, -mvPosition.z)), 1.0, 48.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;
const fragment = /* glsl */ `
uniform float uOpacity;
varying vec3 vTint;
void main(){
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float halo = exp(-d * d * 21.0) * 0.35;
  float core = exp(-d * d * 190.0);
  float a = clamp(core + halo, 0.0, 1.0) * uOpacity;
  if (a < 0.015) discard;
  gl_FragColor = vec4(vTint * (1.1 + core * 0.5), a);
}
`;

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => { value = (1664525 * value + 1013904223) >>> 0; return value / 4294967296; };
}

export function GalaxyField({ progress }: { progress: React.MutableRefObject<number> }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const { positions, sizes, colors } = useMemo(() => {
    const random = seeded(20261118);
    const count = 12000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      // A galaxy-like spiral with a sparse distant starfield. Artistic, not a map of the Milky Way.
      if (i < 9400) {
        const radius = Math.pow(random(), 0.72) * 8.5;
        const arm = i % 4;
        const theta = arm * Math.PI * 0.5 + radius * 0.58 + (random() - 0.5) * (0.35 + radius * 0.1);
        positions[j] = Math.cos(theta) * radius + (random() - 0.5) * 0.28;
        positions[j+1] = Math.sin(theta) * radius * 0.52 + (random() - 0.5) * 0.32;
        positions[j+2] = (random() - 0.5) * (0.6 + radius * 0.11);
      } else {
        positions[j] = (random() - 0.5) * 46;
        positions[j+1] = (random() - 0.5) * 31;
        positions[j+2] = -11 - random() * 14;
      }
      sizes[i] = 0.35 + Math.pow(random(), 3) * 1.3;
      const warm = random();
      colors[j] = warm > 0.42 ? 1.0 : 0.5;
      colors[j+1] = warm > 0.42 ? 0.8 + random() * 0.16 : 0.65;
      colors[j+2] = warm > 0.42 ? 0.6 + random() * 0.18 : 1.0;
    }
    return {positions,sizes,colors};
  }, []);

  useFrame((_, delta) => {
    const p = progress.current;
    if (material.current) {
      material.current.uniforms.uTime.value += delta;
      const opacity = (1 - smooth(0.31, 0.43, p)) * (0.52 + 0.45 * pulse(0.0,0.16,0.33,0.42,p));
      material.current.uniforms.uOpacity.value = opacity;
      if (group.current) group.current.visible = opacity > 0.002;
      material.current.uniforms.uSize.value = 0.85 + p * 1.6;
    }
    if (group.current) {
      group.current.rotation.z = -p * 0.45;
      group.current.rotation.y = p * 0.21;
      const s = 1 + p * 1.25;
      group.current.scale.setScalar(s);
    }
  });
  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions,3]}/>
          <bufferAttribute attach="attributes-aSize" args={[sizes,1]}/>
          <bufferAttribute attach="attributes-aTint" args={[colors,3]}/>
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={{uTime:{value:0},uOpacity:{value:0.8},uSize:{value:1}}}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
