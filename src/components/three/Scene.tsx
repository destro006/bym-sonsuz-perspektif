'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {GalaxyField} from './GalaxyField';
import {EarthView} from './EarthView';
import {ProjectImage} from './ProjectImage';
import {mix,smooth} from '@/lib/math';

const target = new THREE.Vector3(0,0,0);
export function Scene({progress}:{progress:React.MutableRefObject<number>}){
 // Visual progress eases toward the single ScrollTrigger progress. It is still a pure function of
 // scroll position (no independent timeline), so scrubbing up/down/jumping stays reversible,
 // but touch-scroll steps on mobile no longer snap the camera frame-to-frame.
 const visual=useRef(progress.current);
 useFrame(({camera},delta)=>{
  visual.current=THREE.MathUtils.damp(visual.current,progress.current,6,Math.min(delta,0.1));
  if(Math.abs(visual.current-progress.current)<1e-4)visual.current=progress.current;
  const p=visual.current;
  // Spatial continuity is an illusion across scale domains; never astronomic world coordinates.
  let z=16;
  if(p<.31) z=mix(16,7,smooth(0,.31,p));
  else if(p<.70) z=mix(8.5,5.0,smooth(.31,.7,p));
  else z=mix(8.8,6.6,smooth(.70,1,p));
  camera.position.set(mix(1.2,0,smooth(.1,.3,p)),mix(.65,0,smooth(.26,.4,p)),z);
  camera.lookAt(target);
 });
 return <>
  <color attach="background" args={['#080d19']}/>
  <ambientLight intensity={0.75}/>
  <directionalLight color="#fff1cb" intensity={2.2} position={[5,2,7]}/>
  <GalaxyField progress={visual}/>
  <EarthView progress={visual}/>
  <ProjectImage progress={visual}/>
 </>;
}
