'use client';
import { forwardRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { pointFragment, pointVertex } from './pointShader';

export type PointData = { positions: Float32Array; sizes: Float32Array; colors: Float32Array };

/** One draw call per particle layer: BufferGeometry + custom shader, additive, no depth writes. */
export const Points = forwardRef<THREE.ShaderMaterial, { data: PointData }>(function Points({ data }, ref) {
  const dpr = useThree(s => s.viewport.dpr);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uSize: { value: 1 }, uPixelRatio: { value: 1 } }), []);
  // Point sizes are in device pixels; keep apparent size constant across DPRs (mobile is usually 2–3x).
  uniforms.uPixelRatio.value = Math.min(dpr, 2) / 1.3;
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[data.colors, 3]} />
      </bufferGeometry>
      <shaderMaterial ref={ref} vertexShader={pointVertex} fragmentShader={pointFragment} uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
});
