'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {PerformanceMonitor} from '@react-three/drei';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import {Scene,type Quality} from '@/components/three/Scene';
import {SiteHud} from '@/components/ui/SiteHud';
import {chapterAt} from '@/lib/chapters';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export default function Experience(){
 const wrap=useRef<HTMLElement>(null);
 const progressRef=useRef(0);
 const cloudRef=useRef<HTMLDivElement>(null);
 const [progress,setProgress]=useState(0);
 const [chapter,setChapter]=useState(0);
 const [webgl,setWebgl]=useState(true);
 const [quality,setQuality]=useState<Quality|null>(null);
 const [mobile,setMobile]=useState(false);
 // Adaptive resolution: start at the device ratio (capped), step down when the frame rate
 // drops and back up when it recovers. Particle counts/textures stay as chosen at start-up.
 const [dpr,setDpr]=useState(1);
 const dprCap=useRef(1.5);
 // Pause rendering while the 3D stage is (mostly) scrolled out of view.
 const stageRef=useRef<HTMLDivElement>(null);
 const [stageVisible,setStageVisible]=useState(true);
 // Start measuring only after start-up (texture decode/upload stalls read as a slow device:
 // measured a false step-down to DPR 1 at a steady 60 fps without this warm-up).
 const [perfReady,setPerfReady]=useState(false);
 useEffect(()=>{
  const el=stageRef.current;
  if(!el||!('IntersectionObserver' in window))return;
  // The sticky stage never fully leaves the viewport at the end of the page (the closing
  // section is shorter than the screen), so pause once less than half of it is visible.
  // By then the journey is at p=1, where every 3D layer has faded out anyway.
  const io=new IntersectionObserver(([e])=>setStageVisible(e.intersectionRatio>=0.5),{threshold:[0,0.5,1]});
  io.observe(el);
  return ()=>io.disconnect();
 },[]);
 useEffect(()=>{
  // Real capability probe instead of assuming WebGL: no context → static fallback stage.
  const probe=document.createElement('canvas');
  const gl=(probe.getContext('webgl2')||probe.getContext('webgl')) as WebGLRenderingContext|null;
  if(!gl){setWebgl(false);return;}
  const maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  const isMobile=window.matchMedia('(max-width: 860px), (pointer: coarse)').matches;
  const lowCore=(navigator.hardwareConcurrency||8)<=4;
  setMobile(isMobile);
  dprCap.current=isMobile?1.5:1.75;
  window.setTimeout(()=>setPerfReady(true),3000);
  setDpr(Math.min(window.devicePixelRatio||1,dprCap.current));
  setQuality({
   particles:isMobile?(lowCore?5000:7500):12000,
   // Many phone GPUs cap textures at 4096px; the 5400px original would fail to upload there.
   earthTexture:!isMobile&&maxTexture>=8192?'/assets/earth/nasa-blue-marble-5400.jpg':'/assets/earth/nasa-blue-marble-2048.jpg',
   projectPhoto:isMobile?'/assets/project/review-required/IMG_0810_peyzaj-1600.jpg':'/assets/project/review-required/IMG_0810_peyzaj.jpg',
  });
 },[]);
 const [isReducedMotion,setReducedMotion]=useState(false);
 useEffect(()=>{
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  setReducedMotion(mq.matches);
  // Mobile browsers resize the viewport when the URL bar shows/hides; do not re-measure on that.
  ScrollTrigger.config({ignoreMobileResize:true});
  const section=wrap.current;
  if(!section)return;
  // Use a single deterministic progress source. Do not tween the same properties with two engines.
  const ctx=gsap.context(()=>{
   ScrollTrigger.create({
    trigger:section,
    start:'top top',end:'bottom bottom',
    invalidateOnRefresh:true,
    onUpdate:self=>{
      progressRef.current=self.progress;
      const index=Math.max(0,chapterAt(self.progress));
      setChapter(old=>old===index?old:index);
      const rounded=Math.round(self.progress*100);
      setProgress(old=>old===rounded/100?old:rounded/100);
    }
   });
  },section);
  // This component mounts client-side after hydration (next/dynamic, ssr:false), so the first
  // measurement can run before layout settles (observed: end < start, progress stuck at 0%).
  // Re-measure after the first frames, after web fonts load and whenever the journey resizes.
  const refresh=()=>ScrollTrigger.refresh();
  const raf=requestAnimationFrame(()=>requestAnimationFrame(refresh));
  document.fonts?.ready.then(refresh).catch(()=>{});
  const ro=new ResizeObserver(refresh);
  ro.observe(section);
  return ()=>{cancelAnimationFrame(raf);ro.disconnect();ctx.revert();};
 },[]);
 const goTo=useCallback((p:number)=>{
  const target=wrap.current;
  if(!target)return;
  const start=target.getBoundingClientRect().top+window.scrollY;
  const distance=target.offsetHeight-window.innerHeight;
  window.scrollTo({top:start+distance*p,behavior:isReducedMotion?'instant':'smooth'});
 },[isReducedMotion]);
 return <>
  <main className="landing-shell" aria-label="BYM İnşaat sinematik deneyim">
   <section className="scroll-journey" ref={wrap}>
    <div className="stage-sticky" ref={stageRef}>
     {webgl && !isReducedMotion ?
       (quality && <Canvas dpr={dpr} frameloop={stageVisible?'always':'never'} camera={{position:[0,0,16],fov:48,near:0.1,far:120}} gl={{antialias:!mobile,alpha:false,powerPreference:'high-performance'}} onCreated={({gl})=>gl.setClearColor('#080d19')}>
         {perfReady && <PerformanceMonitor
           // [decline below, incline at or above]. 60 Hz screens top out at ~60 fps, so the
           // incline bound must sit below that or a stepped-down device never recovers.
           bounds={rate=>rate>100?[70,110]:[45,57]}
           onDecline={()=>setDpr(d=>Math.max(1,+(d-0.25).toFixed(2)))}
           onIncline={()=>setDpr(d=>Math.min(dprCap.current,window.devicePixelRatio||1,+(d+0.25).toFixed(2)))}
           // drei counts every incline as a "flip", so a fast device already at the cap trips the
           // fallback after a few cycles. On fallback keep the current DPR (stop adapting);
           // forcing DPR 1 there dropped a steady 60 fps phone to the lowest quality.
           flipflops={6}/>}
         <Scene progress={progressRef} quality={quality} cloud={cloudRef}/>
       </Canvas>)
       : <div className="fallback-stage" aria-label="Sadeleştirilmiş deneyim"><div className="fallback-orb"/></div>
     }
     {/* Opacity is written every frame by <Scene> from the same eased progress as the camera,
         so the cloud cover and the Earth pull-back can never drift apart (incl. rapid reversal). */}
     <div className="cloud-bridge" ref={cloudRef} style={{opacity:0}} aria-hidden="true"/>
     <SiteHud chapter={chapter} progress={progress} goTo={goTo}/>
     <a className="skip-link" href="#sonraki-adim">3D anlatımı atla ↓</a>
     {isReducedMotion && <p className="reduced-note">Hareket azaltma tercihiniz nedeniyle hafif görünüm açıldı.</p>}
    </div>
   </section>
   <section className="after-story" id="sonraki-adim">
    <p className="eyebrow">PROJEYE DEVAM ET</p>
    <h2>Mimarinin ötesinde bir hikâye.</h2>
    <p>Bu çalışma BYM İnşaat için etkileşimli bir prototiptir. Gerçek Rüya Şehir GLB modeli henüz eklenmedi; doğrulanmamış içerik yayınlanmaz.</p>
    <div className="end-links"><Link href="/projeler">Projeleri keşfet ↗</Link><Link href="/hakkimizda">BYM İnşaat'ı tanı ↗</Link></div>
   </section>
  </main>
 </>;
}
