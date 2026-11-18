'use client';
import {Suspense,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {CosmicWeb} from './CosmicWeb';
import {GalaxyField} from './GalaxyField';
import {EarthView} from './EarthView';
import {ProjectImage} from './ProjectImage';
import {clamp, mix, smooth, track, type Key} from '@/lib/math';

/**
 * Camera path: p → [x, y, z]. One continuous track (no branches), so there is no jump anywhere.
 * Spatial continuity across scale domains is composed, never astronomical world coordinates.
 * The pull-back between 0.66 and 0.76 happens under the full cloud cover.
 */
const CAMERA: readonly Key[] = [
  [0.00, 1.2, 0.65, 16],
  [0.14, 1.0, 0.50, 12.5],
  [0.31, 0.0, 0.00, 7.4],
  [0.48, 0.0, 0.00, 6.9],
  [0.66, 0.0, 0.00, 5.7],
  [0.76, 0.0, 0.00, 8.6],
  [1.00, 0.0, 0.00, 6.6],
];
const target = new THREE.Vector3(0,0,0);
const cam = [0,0,0];

export type Quality = {particles:number;earthTexture:string;projectPhoto:string};

export function Scene({progress,quality}:{progress:React.MutableRefObject<number>;quality:Quality}){
 // Visual progress eases toward the single ScrollTrigger progress. It is still a pure function of
 // scroll position (no independent timeline), so scrubbing up/down/jumping stays reversible,
 // but touch-scroll steps on mobile no longer snap the camera frame-to-frame.
 const visual=useRef(progress.current);
 useFrame(({camera,size},delta)=>{
  visual.current=THREE.MathUtils.damp(visual.current,progress.current,6,Math.min(delta,0.1));
  if(Math.abs(visual.current-progress.current)<1e-4)visual.current=progress.current;
  const p=visual.current;
  track(CAMERA,p,cam);
  // Portrait phones: the horizontal field of view is much narrower, so step back during the
  // cosmic/galaxy/Earth chapters to keep the subject framed. Blended out under cloud cover.
  const aspect=size.width/Math.max(1,size.height);
  const portrait=mix(clamp(0.95/aspect,1,1.5),1,smooth(.66,.76,p));
  camera.position.set(cam[0]*Math.min(1,aspect),cam[1],cam[2]*portrait);
  camera.lookAt(target);
 });
 return <>
  <color attach="background" args={['#080d19']}/>
  <ambientLight intensity={0.75}/>
  <directionalLight color="#fff1cb" intensity={2.2} position={[5,2,7]}/>
  <CosmicWeb progress={visual} count={Math.round(quality.particles*0.75)}/>
  <GalaxyField progress={visual} count={quality.particles}/>
  {/* Textures stream in separately so the particle chapters render immediately. */}
  <Suspense fallback={null}><EarthView progress={visual} texture={quality.earthTexture}/></Suspense>
  <Suspense fallback={null}><ProjectImage progress={visual} src={quality.projectPhoto}/></Suspense>
 </>;
}
