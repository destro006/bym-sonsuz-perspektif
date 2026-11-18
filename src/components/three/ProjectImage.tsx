'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {mix,pulse,smooth} from '@/lib/math';

const PLANE_W=11.4, PLANE_H=7.6;

/**
 * This is an honest 2.5D bridge while BYM's actual 3D architecture is missing.
 * DO NOT replace this with a made-up apartment geometry. Images are REVIEW REQUIRED.
 */
export function ProjectImage({progress,src}:{progress:React.MutableRefObject<number>;src:string}){
 const texture=useTexture(src);
 texture.colorSpace=THREE.SRGBColorSpace;
 const group=useRef<THREE.Group>(null);
 const mat=useRef<THREE.MeshBasicMaterial>(null);
 useFrame(({camera,size})=>{
  const p=progress.current;
  const opacity=pulse(.69,.79,.94,.99,p)*.87;
  if(mat.current)mat.current.opacity=opacity;
  if(!group.current)return;
  group.current.visible=opacity>0.002;
  const z=mix(-2,1,smooth(.7,.84,p));
  group.current.position.z=z;
  // "object-fit: cover" for the plane at its current distance, on any aspect ratio,
  // then a slow push-in from slightly inside the frame to slightly beyond it.
  const fov=(camera as THREE.PerspectiveCamera).fov*Math.PI/180;
  const visibleH=2*Math.max(0.5,camera.position.z-z)*Math.tan(fov/2);
  const visibleW=visibleH*size.width/Math.max(1,size.height);
  const cover=Math.max(visibleW/PLANE_W,visibleH/PLANE_H);
  const s=cover*mix(.62,1.06,smooth(.70,.9,p));
  group.current.scale.set(s,s,s);
 });
 return <group ref={group}>
  <mesh>
   <planeGeometry args={[PLANE_W,PLANE_H]}/>
   <meshBasicMaterial ref={mat} map={texture} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} depthWrite={false}/>
  </mesh>
 </group>;
}
