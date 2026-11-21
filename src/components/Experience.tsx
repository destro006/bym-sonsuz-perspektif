'use client';
import {asset} from '@/lib/asset';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import {Scene,type Quality} from '@/components/three/Scene';
import {SiteHud} from '@/components/ui/SiteHud';
import {HomeChapters,scrollToChapter,type ChapterId} from '@/components/ui/HomeChapters';
import {chapterAt} from '@/lib/chapters';
import {smooth} from '@/lib/math';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export default function Experience(){
 const wrap=useRef<HTMLElement>(null);
 const progressRef=useRef(0);
 const [progress,setProgress]=useState(0);
 const [chapter,setChapter]=useState(0);
 const [webgl,setWebgl]=useState(true);
 const [quality,setQuality]=useState<Quality|null>(null);
 const [mobile,setMobile]=useState(false);
 const stage=useRef<HTMLDivElement>(null);
 const lastVars=useRef(-1);
 // Interface choreography: the architectural UI is driven by the camera's eased progress (via
 // Scene.onFrame) through CSS custom properties. Only transform/opacity read these vars, so there
 // are no React re-renders or layout reflows per frame, and it reverses exactly with scroll.
 // Framer Motion never animates these elements' transforms (it only owns the text swap inside).
 const applyVars=useCallback((p:number)=>{
  const el=stage.current;
  if(!el||Math.abs(p-lastVars.current)<0.0004)return;
  lastVars.current=p;
  const arch=smooth(0.838,0.878,p);
  el.style.setProperty('--cos',(1-smooth(0.8,0.85,p)).toFixed(3));
  el.style.setProperty('--arch',arch.toFixed(3));
  el.style.setProperty('--c1',smooth(0.862,0.9,p).toFixed(3));
  el.style.setProperty('--c2',smooth(0.874,0.912,p).toFixed(3));
  el.style.setProperty('--c3',smooth(0.886,0.924,p).toFixed(3));
  el.style.setProperty('--drift',smooth(0.88,1,p).toFixed(3));
  // Top navigation emerges at the cosmos→architecture hand-off, items staggered left→right.
  const nav=smooth(0.8,0.83,p);
  el.style.setProperty('--nav',nav.toFixed(3));
  for(let k=0;k<6;k++)el.style.setProperty('--n'+k,smooth(0.806+k*0.009,0.836+k*0.009,p).toFixed(3));
  const navOn=nav>0.5;
  if((el.dataset.nav==='1')!==navOn)el.dataset.nav=navOn?'1':'0';
  const on=arch>0.5;
  if((el.dataset.arch==='1')!==on){
   el.dataset.arch=on?'1':'0';
   // Hidden architectural controls must not be reachable by keyboard / screen readers.
   el.querySelector('.arch-hero')?.toggleAttribute('inert',!on);
  }
 },[]);
 const sceneDriven=useRef(false);
 // Stop rendering while the 3D stage is completely scrolled out of view (the content chapters
 // below it). Not earlier: the architectural UI is driven from the scene's frame loop.
 const [stageVisible,setStageVisible]=useState(true);
 useEffect(()=>{
  const el=stage.current;
  if(!el||!('IntersectionObserver' in window))return;
  const io=new IntersectionObserver(([e])=>setStageVisible(e.isIntersecting),{threshold:0});
  io.observe(el);
  return ()=>io.disconnect();
 },[]);
 const [activeChapter,setActiveChapter]=useState<ChapterId>('deneyim');
 const onActive=useCallback((id:ChapterId)=>setActiveChapter(id),[]);
 useEffect(()=>{
  // Real capability probe instead of assuming WebGL: no context → static fallback stage.
  const probe=document.createElement('canvas');
  const gl=(probe.getContext('webgl2')||probe.getContext('webgl')) as WebGLRenderingContext|null;
  if(!gl){setWebgl(false);return;}
  const maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  // Software rasterisers (no GPU) get the lightweight tier without post-processing.
  const dbg=gl.getExtension('WEBGL_debug_renderer_info');
  const renderer=String(dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  const software=/swiftshader|llvmpipe|software|basic render/i.test(renderer);
  const isMobile=window.matchMedia('(max-width: 860px), (pointer: coarse)').matches;
  const lowCore=(navigator.hardwareConcurrency||8)<=4;
  // Manual override for testing: ?kalite=high|medium|low
  const q=new URLSearchParams(window.location.search).get('kalite');
  const forced=q==='high'||q==='medium'||q==='low'?q:null;
  setMobile(isMobile);
  setQuality({
   tier:forced??(software?'low':isMobile?(lowCore?'low':'medium'):'high'),
   // Many phone GPUs cap textures at 4096px; the 5400px original would fail to upload there.
   earthTexture:!isMobile&&maxTexture>=8192?asset('/assets/earth/nasa-blue-marble-5400.jpg'):asset('/assets/earth/nasa-blue-marble-2048.jpg'),
   // Curated golden-hour Rüya Şehir photograph (2000×1333, same 3:2 framing as the photo plane).
   projectPhoto:asset('/assets/bym-portfolio-curated/ruya-sehir/ruya-garden.webp'),
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
      if(!sceneDriven.current)applyVars(self.progress);
      const index=Math.max(0,chapterAt(self.progress));
      setChapter(old=>old===index?old:index);
      const rounded=Math.round(self.progress*100);
      setProgress(old=>old===rounded/100?old:rounded/100);
    }
   });
  },section);
  applyVars(0);
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
   <section className="scroll-journey" ref={wrap} data-chapter="deneyim">
    <div className="stage-sticky" ref={stage} data-arch="0" data-nav="0">
     {webgl && !isReducedMotion ?
       (quality && <Canvas dpr={quality.tier==='high'?[1,1.75]:quality.tier==='medium'?[1,1.5]:[0.85,1.25]} frameloop={stageVisible?'always':'never'} camera={{position:[15,8,131],fov:48,near:0.1,far:1400}} gl={{antialias:!mobile,alpha:false,powerPreference:'high-performance'}} onCreated={({gl})=>gl.setClearColor('#080d19')}>
         <Scene progress={progressRef} quality={quality} onFrame={p=>{sceneDriven.current=true;applyVars(p);}}/>
       </Canvas>)
       : <div className="fallback-stage" aria-label="Sadeleştirilmiş deneyim"><div className="fallback-orb"/></div>
     }
     <SiteHud chapter={chapter} progress={progress} goTo={goTo} navActive={activeChapter} onNav={id=>scrollToChapter(id,isReducedMotion)}/>
     <a className="skip-link" href="#sonraki-adim">3D anlatımı atla ↓</a>
     {isReducedMotion && <p className="reduced-note">Hareket azaltma tercihiniz nedeniyle hafif görünüm açıldı.</p>}
    </div>
   </section>
   <div id="sonraki-adim"><HomeChapters active={activeChapter} onActive={onActive}/></div>
  </main>
 </>;
}
