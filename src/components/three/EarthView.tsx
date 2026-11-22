'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {mix, smooth} from '@/lib/math';
import {earthCenter, zoom, zoomLog} from './descent/journey';
import {NOISE} from './cosmos/glsl';

/**
 * Planet surface: physically-motivated look without extra assets.
 * - NASA Blue Marble albedo (linear), Lambert day side, near-black night side
 * - ocean mask derived from the albedo → sun glint (Blinn-Phong) + Fresnel sky reflection
 * - warm scattering band along the terminator
 * - procedural, domain-warped cloud deck (weather only: implies no location)
 */
const SURFACE_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec3 vObj; varying vec2 vUv;
void main(){
  vUv=uv; vObj=position;
  vec4 wp=modelMatrix*vec4(position,1.0); vW=wp.xyz;
  vN=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const SURFACE_FRAG = (oct:number) => NOISE + /* glsl */ `
uniform sampler2D map; uniform vec3 uSun; uniform float uOpacity; uniform float uCloud; uniform float uTime;
varying vec3 vN; varying vec3 vW; varying vec3 vObj; varying vec2 vUv;
float fbm(vec3 p){ float s=0.0,a=0.5; for(int i=0;i<${oct};i++){ s+=a*snoise(p); p=p*2.03+vec3(1.7,-3.1,2.3); a*=0.5; } return s; }
void main(){
  vec3 n=normalize(vN); vec3 v=normalize(cameraPosition-vW); vec3 l=normalize(uSun);
  vec3 albedo=texture2D(map,vUv).rgb;
  float lum=dot(albedo,vec3(0.333));
  float ocean=smoothstep(0.004,0.03,albedo.b-albedo.r)*(1.0-smoothstep(0.08,0.22,lum));
  float ndl=dot(n,l);
  float diff=max(ndl,0.0);
  float wrap=smoothstep(-0.12,0.3,ndl);
  vec3 col=albedo*(diff*1.55)*mix(1.12,0.9,ocean);
  float term=smoothstep(-0.1,0.06,ndl)*(1.0-smoothstep(0.06,0.38,ndl));
  col+=albedo*vec3(1.0,0.5,0.22)*term*0.7;
  vec3 h=normalize(l+v);
  float spec=pow(max(dot(n,h),0.0),260.0)*ocean*diff;
  float fres=pow(1.0-max(dot(n,v),0.0),5.0);
  col+=vec3(1.0,0.88,0.7)*spec*0.85+vec3(0.18,0.36,0.75)*fres*ocean*wrap*0.5;
  // Cloud deck: domain-warped fbm on the sphere, slow ambient drift.
  // Stretched along latitude bands (jet-stream look), soft-edged with fine wisps.
  vec3 dirn=normalize(vObj);
  vec3 q=dirn*vec3(2.0,4.2,2.0)+vec3(uTime*0.004,0.0,0.0);
  vec3 w=vec3(fbm(q*1.1),fbm(q*1.1+5.2),fbm(q*1.1-3.7));
  float c=fbm(q*2.0+w*1.4)+0.35*fbm(q*7.0+w*2.0);
  float lat=abs(dirn.y);
  float cover=smoothstep(0.02,0.62,c+0.1*smoothstep(0.5,0.85,lat));
  cover=pow(cover,1.6)*uCloud;
  vec3 cloud=vec3(1.0,0.99,0.97)*(diff*1.1+0.01)+vec3(1.0,0.55,0.3)*term*0.45;
  col=mix(col*(1.0-cover*0.3),cloud,cover*0.62);
  col+=vec3(0.004,0.007,0.016)*(1.0-wrap);
  gl_FragColor=vec4(col,uOpacity);
  #include <colorspace_fragment>
}`;

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
/**
 * Cheap single-scattering look: limb brightening weighted by sun angle, with a warm
 * forward-scatter fringe when the planet is back-lit (the silhouette / crescent moment).
 */
const atmosphereFragment = /* glsl */ `
uniform float uOpacity;
uniform vec3 uColor;
uniform vec3 uSun;
uniform float uInner;
varying vec3 vNormal;
varying vec3 vWorldPos;
void main(){
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float ndv = abs(dot(n, viewDir));
  // Inner shell: limb brightening across the disc. Outer shell (back faces): halo that is
  // brightest exactly at the planet limb (ndv = sqrt(1-(2.4/2.56)^2) = 0.348) and fades to space,
  // so there is no dark gap between surface and glow.
  // Outer halo: rises to the limb and falls off quickly inside it. (It used to stay at full
  // strength across the whole disc — invisible behind an opaque surface, but while the planet
  // fades in that showed as a flat light-blue Earth.)
  float rim = uInner > 0.5 ? pow(1.0 - ndv, 2.2)
    : (ndv <= 0.348 ? pow(ndv / 0.348, 2.6) : exp(-(ndv - 0.348) * 14.0));
  float lit = clamp(dot(n, uSun) + (uInner > 0.5 ? 0.35 : 0.55), 0.0, 1.0);
  float forward = pow(clamp(dot(-viewDir, uSun), 0.0, 1.0), 6.0);
  vec3 col = uColor * rim * (0.12 + 1.35 * lit) + vec3(1.0, 0.72, 0.45) * rim * forward * 1.4 * lit;
  gl_FragColor = vec4(col, rim * uOpacity * (uInner > 0.5 ? 0.55 : 0.7));
}
`;

export function EarthView({progress,texture,sun,octaves=5}:{progress:React.MutableRefObject<number>;texture:string;sun?:React.RefObject<THREE.DirectionalLight|null>;octaves?:number}){
  const tex = useTexture(texture);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const group = useRef<THREE.Group>(null);
  const surface = useRef<THREE.ShaderMaterial>(null);
  const atmosphere = useRef<THREE.ShaderMaterial>(null);
  const inner = useRef<THREE.ShaderMaterial>(null);
  const sunDir = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const uniformsOuter = useMemo(() => ({uOpacity:{value:0},uColor:{value:new THREE.Color('#6ab7ef')},uSun:{value:sunDir},uInner:{value:0}}), [sunDir]);
  const uniformsInner = useMemo(() => ({uOpacity:{value:0},uColor:{value:new THREE.Color('#78b4ff')},uSun:{value:sunDir},uInner:{value:1}}), [sunDir]);
  const uniformsSurface = useMemo(() => ({map:{value:tex},uSun:{value:sunDir},uOpacity:{value:0},uCloud:{value:1},uTime:{value:0}}), [tex, sunDir]);
  const surfaceFrag = useMemo(() => SURFACE_FRAG(octaves), [octaves]);
  useFrame((state)=>{
    const p = progress.current;
    // Appears as a distant silhouette while the camera exits the galactic core (flash-covered),
    // fills the composition, then dissolves into the atmosphere/city as the descent zoom passes
    // Z≈15–60 (texture magnification would read as mush beyond that). Pure function of p.
    const Z = zoom(p), lz = zoomLog(p);
    const alpha = smooth(0.268,0.345,p) * (1 - smooth(Math.log(15), Math.log(60), lz));
    // A fully transparent sphere still writes depth and would hide the project photo behind it.
    if (group.current) group.current.visible = alpha > 0.002;
    if (surface.current) {
      surface.current.uniforms.uOpacity.value = alpha; surface.current.depthWrite = alpha > 0.98;
      surface.current.uniforms.uTime.value = state.clock.elapsedTime;
      // The camera descends through the cloud deck: thin it out as the zoom passes Z≈3–12.
      surface.current.uniforms.uCloud.value = 1 - smooth(Math.log(3), Math.log(12), lz);
    }
    if (sun?.current) sunDir.copy(sun.current.position).normalize();
    if (inner.current) inner.current.uniforms.uOpacity.value = alpha * smooth(0.3, 0.42, p) * (1 - smooth(Math.log(3), Math.log(12), lz));
    // Outer halo hands over to the particle atmosphere + sky scattering once the camera dips into it.
    if (atmosphere.current) atmosphere.current.uniforms.uOpacity.value = alpha * (1 - smooth(Math.log(2), Math.log(8), lz));
    if(group.current){
      // Scale about the fixed descent point P0 (centre moves away as the planet grows).
      const scale = mix(0.34,0.95,smooth(0.28,0.48,p)) * Z;
      group.current.scale.setScalar(scale);
      earthCenter(Z, group.current.position);
      // Rotation is a pure function of p and settles before the zoom starts, so the surface under the
      // descent point never slides. (The former time-based spin made the descent non-deterministic.)
      group.current.rotation.y = -0.75 + smooth(0.30,0.53,p) * 0.34;
      group.current.rotation.x = -0.16 + smooth(0.38,0.53,p) * 0.10;
      group.current.rotation.z = 0.06 * smooth(0.3,0.53,p);
    }
  });
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[2.4,128,96]}/>
        <shaderMaterial ref={surface} vertexShader={SURFACE_VERT} fragmentShader={surfaceFrag} uniforms={uniformsSurface} transparent/>
      </mesh>
      {/* Inner haze: thin scattering shell over the day side. */}
      <mesh>
        <sphereGeometry args={[2.404,96,64]}/>
        <shaderMaterial ref={inner} vertexShader={atmosphereVertex} fragmentShader={atmosphereFragment}
          uniforms={uniformsInner} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.FrontSide}/>
      </mesh>
      <mesh>
        <sphereGeometry args={[2.56,96,64]}/>
        <shaderMaterial ref={atmosphere} vertexShader={atmosphereVertex} fragmentShader={atmosphereFragment}
          uniforms={uniformsOuter} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide}/>
      </mesh>
    </group>
  );
}
