'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {mix,pulse,smooth} from '@/lib/math';

/**
 * This is an honest 2.5D bridge while BYM's actual 3D architecture is missing.
 * DO NOT replace this with a made-up apartment geometry. Images are REVIEW REQUIRED.
 */
export function ProjectImage({progress}:{progress:React.MutableRefObject<number>}){
 const texture=useTexture('/assets/project/review-required/IMG_0810_peyzaj.jpg');
 const group=useRef<THREE.Group>(null);
 const mat=useRef<THREE.MeshBasicMaterial>(null);
 useFrame(()=>{
  const p=progress.current;
  const opacity=pulse(.69,.79,.94,.99,p)*.87;
  if(mat.current)mat.current.opacity=opacity;
  if(group.current)group.current.visible=opacity>0.002;
  if(group.current){
   const s=mix(.53,1.17,smooth(.70,.9,p));
   group.current.scale.set(s,s,s);
   group.current.position.z=mix(-2,1,smooth(.7,.84,p));
  }
 });
 return <group ref={group}>
  <mesh>
   <planeGeometry args={[11.4,7.6]}/>
   <meshBasicMaterial ref={mat} map={texture} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} depthWrite={false}/>
  </mesh>
 </group>;
}
