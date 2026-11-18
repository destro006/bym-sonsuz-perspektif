'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import {Scene} from '@/components/three/Scene';
import {SiteHud} from '@/components/ui/SiteHud';
import {chapterAt} from '@/lib/chapters';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export default function Experience(){
 const wrap=useRef<HTMLElement>(null);
 const progressRef=useRef(0);
 const [progress,setProgress]=useState(0);
 const [chapter,setChapter]=useState(0);
 const [webgl,setWebgl]=useState(true);
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
    <div className="stage-sticky">
     {webgl && !isReducedMotion ?
       <Canvas dpr={[1,1.6]} camera={{position:[0,0,16],fov:48,near:0.1,far:120}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} onCreated={({gl})=>gl.setClearColor('#080d19')} onError={()=>setWebgl(false)}>
         <Scene progress={progressRef}/>
       </Canvas>
       : <div className="fallback-stage" aria-label="Sadeleştirilmiş deneyim"><div className="fallback-orb"/></div>
     }
     <div className="cloud-bridge" style={{opacity: progress >.58 && progress<.83 ? Math.min((progress-.58)*12,(.83-progress)*12,.94):0}}/>
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
