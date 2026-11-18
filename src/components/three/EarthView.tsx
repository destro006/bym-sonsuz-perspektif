'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {mix, pulse, smooth} from '@/lib/math';

const atmosphereVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
const atmosphereFragment = /* glsl */ `
uniform float uOpacity;
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vWorldPos;
void main(){
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rim = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 3.5);
  gl_FragColor = vec4(uColor, rim * uOpacity * 0.75);
}
`;

export function EarthView({progress,texture}:{progress:React.MutableRefObject<number>;texture:string}){
  const tex = useTexture(texture);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const group = useRef<THREE.Group>(null);
  const surface = useRef<THREE.MeshStandardMaterial>(null);
  const atmosphere = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, delta)=>{
    const p = progress.current;
    const alpha = pulse(0.31,0.43,0.66,0.79,p);
    // A fully transparent sphere still writes depth and would hide the project photo behind it.
    if (group.current) group.current.visible = alpha > 0.002;
    if (surface.current) { surface.current.opacity = alpha; surface.current.depthWrite = alpha > 0.98; }
    if (atmosphere.current) atmosphere.current.uniforms.uOpacity.value = alpha;
    if(group.current){
      const scale = mix(0.34,0.95,smooth(0.28,0.48,p)) * mix(1,2.3,smooth(0.48,0.72,p));
      group.current.scale.setScalar(scale);
      group.current.rotation.y = -0.75 + smooth(0.38,0.70,p) * 0.22;
      group.current.rotation.x = -0.16 + smooth(0.38,0.7,p) * 0.10;
      group.current.rotation.z += delta * 0.006 * (1 - smooth(0.43,0.65,p));
    }
  });
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[2.4,96,64]}/>
        <meshStandardMaterial ref={surface} map={tex} roughness={1} metalness={0} transparent opacity={0}/>
      </mesh>
      <mesh>
        <sphereGeometry args={[2.52,96,64]}/>
        <shaderMaterial ref={atmosphere} vertexShader={atmosphereVertex} fragmentShader={atmosphereFragment}
          uniforms={{uOpacity:{value:0},uColor:{value:new THREE.Color('#6ab7ef')}}}
          transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide}/>
      </mesh>
    </group>
  );
}
