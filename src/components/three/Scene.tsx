'use client';
import {Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {PerformanceMonitor} from '@react-three/drei';
import * as THREE from 'three';
import {EarthView} from './EarthView';
import {ProjectImage} from './ProjectImage';
import {PostFX} from './PostFX';
import {CosmicIntro,createShared} from './cosmos/CosmicIntro';
import {BUDGET,type Tier} from './cosmos/build';
import {cameraDerivative,cameraUp,sampleCamera,type CameraSample} from './cosmos/cameraPath';
import {DescentField} from './descent/DescentField';
import {EAST,N as SURFACE_N} from './descent/journey';
import {clamp, mix, pulse, smooth} from '@/lib/math';

export type Quality = {tier:Tier;earthTexture:string;projectPhoto:string};

/** Max eased-progress speed (progress units / second): a fling or a rail jump becomes a directed
 * flight (accelerate → glide → decelerate) instead of a teleport through the scale domains. */
const MAX_SPEED=0.5;
/** Motion-blur "shutter" for star streaks (seconds) and the longest streak allowed (world units). */
const SHUTTER=0.045, MAX_STREAK=7;
const BASE_FOV=48;

const SUN_BACK=new THREE.Vector3(-9.5,2.4,-2.6), SUN_FRONT=new THREE.Vector3(7.5,2.6,3.2);
/** Evening light for the descent: the descent point sits near the terminator (warm grazing light). */
const SUN_DUSK=EAST.clone().multiplyScalar(9).addScaledVector(SURFACE_N,2.2);

/** onFrame receives the eased camera progress every frame so the HTML interface follows the
 * camera's narrative position (not the raw scroll value) and stays in sync during a damped glide. */
export function Scene({progress,quality,onFrame}:{progress:React.MutableRefObject<number>;quality:Quality;onFrame?:(p:number)=>void}){
 // Visual progress eases toward the single ScrollTrigger progress. It is still a pure function of
 // scroll position (no independent timeline), so scrubbing up/down/jumping stays reversible,
 // but touch-scroll steps on mobile no longer snap the camera frame-to-frame.
 const visual=useRef(progress.current);
 const prev=useRef(progress.current);
 const speed=useRef(0);
 const pointer=useRef(new THREE.Vector2());
 const shared=useMemo(createShared,[]);
 const tmp=useMemo(()=>({
  s:{pos:new THREE.Vector3(),target:new THREE.Vector3(),roll:0} as CameraSample,
  d:new THREE.Vector3(), m:new THREE.Matrix4(), q:new THREE.Quaternion(), rq:new THREE.Quaternion(),
  z:new THREE.Vector3(0,0,1), up:new THREE.Vector3(0,1,0), buf:new THREE.Vector2(),
 }),[]);
 const sun=useRef<THREE.DirectionalLight>(null);
 const amb=useRef<THREE.AmbientLight>(null);
 const setDpr=useThree(s=>s.setDpr);
 const dprRange=useMemo(()=>quality.tier==='high'?[1,1.75]:quality.tier==='medium'?[1,1.5]:[0.85,1.25],[quality.tier]);
 const dprNow=useRef(dprRange[1]);
 // Start measuring only after start-up: shader pre-compile and texture upload stalls read as a
 // slow device (measured: a false step-down at a steady 60 fps without this warm-up).
 const [perfReady,setPerfReady]=useState(false);
 useEffect(()=>{const id=window.setTimeout(()=>setPerfReady(true),3000);return ()=>window.clearTimeout(id);},[]);
 // Pre-compile every material once (incl. layers that are hidden at p=0), so the first time the
 // galaxy, rings or Earth appear mid-scroll there is no shader-compile hitch.
 const gl=useThree(s=>s.gl), scene=useThree(s=>s.scene), camera=useThree(s=>s.camera);
 useEffect(()=>{
  const id=requestAnimationFrame(()=>{
   const hidden:THREE.Object3D[]=[];
   scene.traverse(o=>{if(!o.visible){hidden.push(o);o.visible=true;}});
   try{gl.compile(scene,camera);}finally{hidden.forEach(o=>{o.visible=false;});}
  });
  return ()=>cancelAnimationFrame(id);
 },[gl,scene,camera]);

 useFrame((state,delta)=>{
  const {camera,size,gl}=state;
  // Dev-only inspection hook for visual QA (layer toggles, progress, timings).
  if(process.env.NODE_ENV!=='production')(window as unknown as {__r3f?:unknown}).__r3f={scene:state.scene,gl,camera,visual};
  const cam=camera as THREE.PerspectiveCamera;
  const dt=Math.min(delta,0.1);
  const eased=THREE.MathUtils.damp(visual.current,progress.current,6,dt);
  // The cosmic flight covers ~250 world units per progress unit: a slower cap there keeps a
  // fling cinematic (accelerate → glide → decelerate) instead of a teleport.
  const cap=mix(0.3,MAX_SPEED,smooth(0.32,0.38,visual.current)*(1-smooth(0.5,0.56,visual.current)));
  visual.current+=clamp(eased-visual.current,-cap*dt,cap*dt);
  if(Math.abs(visual.current-progress.current)<1e-4)visual.current=progress.current;
  const p=visual.current;
  // Progress velocity (smoothed) → star streak acceleration/deceleration. Zero when scrolling stops.
  const dpdt=dt>0?(p-prev.current)/dt:0;
  prev.current=p;
  speed.current=THREE.MathUtils.damp(speed.current,dpdt,7,dt);

  const {s,d,m,q,rq,z,up,buf}=tmp;
  sampleCamera(p,s);
  const aspect=size.width/Math.max(1,size.height);
  // Composition: the opening target is offset so the luminous region sits right of the type.
  s.target.x*=Math.min(1,aspect);
  // Subtle idle drift before scrolling (ambient only; vanishes as the journey begins).
  const idle=1-smooth(0,0.05,p);
  const t=state.clock.elapsedTime;
  s.pos.x+=Math.sin(t*0.17)*0.9*idle; s.pos.y+=Math.cos(t*0.13)*0.55*idle;
  // Pointer parallax (damped), only during the cosmic chapters.
  pointer.current.lerp(state.pointer,1-Math.pow(0.04,dt));
  const par=(1-smooth(0.28,0.36,p))*0.9;
  s.target.x+=pointer.current.x*1.6*par; s.target.y+=pointer.current.y*0.9*par;

  // Portrait framing: widen the FOV inside the cosmos (path geometry stays intact), then hand over
  // to the original "step back" behaviour for the Earth/architecture chapters.
  // Over the city the FOV widens again (stepping back would push the camera into buildings).
  const f=clamp(0.95/aspect,1,1.5);
  const w=smooth(.34,.46,p)*(1-smooth(.56,.64,p));
  const distScale=mix(1,f,w), fovScale=mix(f,1,w);
  s.pos.sub(s.target).multiplyScalar(distScale).add(s.target);
  const fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV/2))*fovScale));
  if(Math.abs(cam.fov-fov)>1e-3){cam.fov=fov;cam.updateProjectionMatrix();}

  // Orientation: look-at quaternion + banking roll around the view axis.
  camera.position.copy(s.pos);
  m.lookAt(s.pos,s.target,cameraUp(p,up));
  q.setFromRotationMatrix(m);
  rq.setFromAxisAngle(z,s.roll);
  camera.quaternion.copy(q.multiply(rq));
  camera.updateMatrixWorld();

  // Shared uniforms.
  shared.uTime.value+=dt;
  gl.getDrawingBufferSize(buf);
  shared.uHalfH.value=buf.y*0.5;
  shared.uMaxPx.value=Math.min(72,40*gl.getPixelRatio());
  cameraDerivative(p,d).multiplyScalar(speed.current*SHUTTER);
  // Warp section adds a little guaranteed streaking while moving through the arms.
  if(d.length()>MAX_STREAK)d.setLength(MAX_STREAK);
  shared.uVel.value.copy(d);
  shared.uStreak.value=clamp(d.length()/1.2)*(1-smooth(0.3,0.36,p))*(0.75+0.25*pulse(0.18,0.22,0.26,0.29,p));

  // Earth lighting: back-lit crescent silhouette first, then the sun swings round to reveal the day side.
  if(sun.current){
   sun.current.position.lerpVectors(SUN_BACK,SUN_FRONT,smooth(0.3,0.46,p)).lerp(SUN_DUSK,smooth(0.5,0.6,p));
   sun.current.intensity=mix(2.8,2.2,smooth(0.3,0.46,p));
  }
  if(amb.current)amb.current.intensity=mix(0.03,0.75,smooth(0.36,0.5,p));
  onFrame?.(p);
 });
 const budget=BUDGET[quality.tier];
 return <>
  <color attach="background" args={['#080d19']}/>
  {perfReady && <PerformanceMonitor
   // [decline below, incline at or above]. A 60 Hz screen tops out at ~60 fps, so drei's default
   // incline bound (60) is almost never met and a stepped-down device would never recover.
   bounds={rate=>rate>100?[70,110]:[45,57]}
   onDecline={()=>{dprNow.current=Math.max(dprRange[0],dprNow.current-0.25);setDpr(dprNow.current);}}
   onIncline={()=>{dprNow.current=Math.min(dprRange[1],dprNow.current+0.25);setDpr(dprNow.current);}}/>}
  <ambientLight ref={amb} intensity={0.03}/>
  <directionalLight ref={sun} color="#fff1cb" intensity={2.8} position={SUN_BACK.toArray()}/>
  <CosmicIntro progress={visual} shared={shared} tier={quality.tier}/>
  <DescentField progress={visual} shared={shared} tier={quality.tier}/>
  {/* Textures stream in separately so the particle chapters render immediately. */}
  <Suspense fallback={null}><EarthView progress={visual} texture={quality.earthTexture} sun={sun} octaves={budget.skyOctaves}/></Suspense>
  <Suspense fallback={null}><ProjectImage progress={visual} src={quality.projectPhoto}/></Suspense>
  {budget.post && <PostFX progress={visual} bloomScale={budget.bloomScale}/>}
 </>;
}
