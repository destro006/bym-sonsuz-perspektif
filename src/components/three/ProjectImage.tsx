'use client';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {mix,smooth} from '@/lib/math';
import {NOISE} from './cosmos/glsl';

const PLANE_W=11.4, PLANE_H=7.6, DIST=2;

/**
 * This is an honest 2.5D bridge while BYM's actual 3D architecture is missing.
 * DO NOT replace this with a made-up apartment geometry. Images are REVIEW REQUIRED.
 *
 * Reveal (no blur, no crossfade): the photo is uncovered by a noise-shaped front that expands
 * from the featured mass the camera has locked onto, with a thin warm light trace on the front —
 * the particle city "resolves" into the real image. Pure function of p, so it reverses exactly.
 * The plane rides with the camera (screen-space framing at any aspect ratio).
 */
const VERT=/* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const FRAG=NOISE+/* glsl */`
uniform sampler2D map; uniform float uReveal; uniform float uOpacity; uniform float uTime; uniform vec2 uFocus;
varying vec2 vUv;
void main(){
  vec2 q=(vUv-uFocus)*vec2(PLANE_ASPECT,1.0);
  float d=length(q);
  float n=snoise(vec3(vUv*vec2(5.0,3.4),0.7))*0.5+snoise(vec3(vUv*vec2(13.0,9.0),2.1))*0.22;
  // High-frequency grain makes the front particulate (assembling points), never a soft blur.
  float grain=snoise(vec3(vUv*vec2(260.0,170.0),1.3))*0.035;
  // Vertical bias: structure resolves bottom-up, like the buildings did.
  float th=uReveal*2.3-d*1.15-n*0.38-(1.0-vUv.y)*0.12+grain;
  float m=step(0.0,th);
  float edge=step(-0.022,th)*(1.0-m);
  float spark=step(0.55,snoise(vec3(vUv*vec2(300.0,200.0),uTime*0.8)))*edge;
  vec4 tex=texture2D(map,vUv);
  vec3 col=tex.rgb*m+vec3(1.0,0.8,0.52)*(edge*0.35+spark*1.6);
  gl_FragColor=vec4(col,clamp(m+edge*(0.35+spark*0.65),0.0,1.0)*uOpacity);
  #include <colorspace_fragment>
}`.replace('PLANE_ASPECT',(PLANE_W/PLANE_H).toFixed(4));

export function ProjectImage({progress,src}:{progress:React.MutableRefObject<number>;src:string}){
 const texture=useTexture(src);
 texture.colorSpace=THREE.SRGBColorSpace;
 const group=useRef<THREE.Group>(null);
 const mat=useMemo(()=>new THREE.ShaderMaterial({
  uniforms:{map:{value:texture},uReveal:{value:0},uOpacity:{value:0},uTime:{value:0},uFocus:{value:new THREE.Vector2(0.52,0.42)}},
  vertexShader:VERT,fragmentShader:FRAG,transparent:true,depthWrite:false,depthTest:false,toneMapped:false,
 }),[texture]);
 useEffect(()=>()=>mat.dispose(),[mat]);
 const fwd=useMemo(()=>new THREE.Vector3(),[]);
 useFrame(({camera,size,clock})=>{
  const p=progress.current;
  const reveal=smooth(0.795,0.865,p);
  mat.uniforms.uReveal.value=reveal;
  // Full opacity: the photograph is the hero of the architectural chapter and stays to the end.
  mat.uniforms.uOpacity.value=1;
  mat.uniforms.uTime.value=clock.elapsedTime;
  if(!group.current)return;
  group.current.visible=reveal>0.001;
  // Camera-attached framing: "object-fit: cover" at a fixed distance in front of the lens,
  // with a slow push-in across the structure chapter.
  camera.getWorldDirection(fwd);
  group.current.position.copy(camera.position).addScaledVector(fwd,DIST);
  group.current.quaternion.copy(camera.quaternion);
  const fov=(camera as THREE.PerspectiveCamera).fov*Math.PI/180;
  const visibleH=2*DIST*Math.tan(fov/2);
  const visibleW=visibleH*size.width/Math.max(1,size.height);
  const cover=Math.max(visibleW/PLANE_W,visibleH/PLANE_H);
  const k=cover*mix(1.0,1.07,smooth(.82,1.0,p));
  group.current.scale.setScalar(k);
  // Portrait screens only see a narrow vertical slice: slide the photo so its towers
  // (around u≈0.56) stay in frame, never exposing the plane's edge.
  const slack=Math.max(0,(PLANE_W*k-visibleW)/2);
  const shift=Math.min(slack,(0.56-0.5)*PLANE_W*k);
  if(shift>0)group.current.translateX(-shift);
 });
 return <group ref={group}>
  <mesh renderOrder={20} frustumCulled={false} material={mat}>
   <planeGeometry args={[PLANE_W,PLANE_H]}/>
  </mesh>
 </group>;
}
