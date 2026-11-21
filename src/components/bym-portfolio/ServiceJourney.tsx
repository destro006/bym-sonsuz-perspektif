'use client';
import {BASE_PATH} from '@/lib/asset';
import Link from 'next/link';
import {useScroll} from 'framer-motion';
import {BuildingWrap} from './BuildingWrap';
import Image from 'next/image';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SERVICES} from '@/data/bym-portfolio';
import {ArrowSwap} from './ArrowSwap';

gsap.registerPlugin(ScrollTrigger);
const useIso=typeof window==='undefined'?useEffect:useLayoutEffect;
const img=(slug:string,key:string)=>`${BASE_PATH}/assets/bym-portfolio-curated/${slug}/${key}.webp`;

type Scene={src:string;pos:string;alt:string;project:string;slug:string;kind:'Fotoğraf'|'Görselleştirme';py:number};

/*
 * Each service is paired with an authentic BYM image from the curated set, credited to its own
 * project. The scenes are different projects, never one building's construction progress; the
 * panel says so. Nothing is drawn over the photographs (v3: the client asked for a clean image).
 */
const SCENES:Scene[]=[
 {src:img('burak-manzara-evleri','burak-hero'),pos:'center 26%',alt:'Burak Manzara Evleri konut bloğunun dış cephesi',project:'Burak Manzara Evleri',slug:'burak-manzara-evleri',kind:'Fotoğraf',py:0},
 {src:img('gaziantep-villalari','villa-hero'),pos:'center 40%',alt:'Gaziantep villa projesinin dış mimari görselleştirmesi',project:'Gaziantep Villaları',slug:'gaziantep-villalari',kind:'Görselleştirme',py:-26},
 {src:img('ruya-sehir','ruya-garden'),pos:'center 60%',alt:'Rüya Şehir blokları ve peyzaj alanı, gün batımında',project:'Rüya Şehir',slug:'ruya-sehir',kind:'Fotoğraf',py:-10},
 {src:img('ruya-sehir','ruya-entrance'),pos:'center 45%',alt:'Rüya Şehir tanıtım ofisi girişi ve isim tabelası',project:'Rüya Şehir',slug:'ruya-sehir',kind:'Fotoğraf',py:-38},
 {src:img('ruya-sehir','ruya-hero'),pos:'center 30%',alt:'Rüya Şehir konut bloklarının cephesi',project:'Rüya Şehir',slug:'ruya-sehir',kind:'Fotoğraf',py:-18},
];

const N_SC=SCENES.length;

/**
 * "Fikirden Yapıya" — a pinned, full-width architectural stage. Scroll (desktop) or the floating
 * selector moves through the five services; each change is one directed GSAP moment: the new
 * photograph opens through a circular mask born at the selected control, a light ring travels
 * out from it, the panel copy rises through masks and the glass panel glides to its new height.
 * No numbering is shown anywhere (the index lives in code only). Everything here is GSAP (no Framer Motion), and each
 * transform has one owner: .fj-scene = clip, .fj-par = scroll parallax, .fj-kb = entrance zoom.
 */
export function ServiceJourney({id,kicker,chapter,cta={href:'/hizmetler',label:'Bütün hizmetler'}}:{id?:string;kicker:string;chapter?:string;cta?:{href:string;label:string}}){
 const root=useRef<HTMLElement>(null);
 const frame=useRef<HTMLDivElement>(null);
 const stageEl=useRef<HTMLDivElement>(null);
 const {scrollYProgress:wrapP}=useScroll({target:root,offset:['start end','start start']});
 const [active,setActive]=useState(0);
 const prev=useRef(0);
 const st=useRef<ScrollTrigger|null>(null);
 const lock=useRef<number|null>(null);
 const reduced=useRef(false);
 const intro=useRef(false);
 const tl=useRef<gsap.core.Timeline|null>(null);
 const origin=useRef<{x:number;y:number}|null>(null);

 // Pin + scroll mapping (desktop, motion allowed) and the one-off stage introduction.
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const mm=gsap.matchMedia();
  mm.add({motion:'(prefers-reduced-motion: no-preference)',pin:'(min-width: 861px) and (min-height: 600px)'},c=>{
   const {motion,pin}=c.conditions as {motion:boolean;pin:boolean};
   reduced.current=!motion;
   if(process.env.NODE_ENV!=='production'){const g=window as unknown as {__fj?:{runs:number;st?:()=>ScrollTrigger|null}};g.__fj={runs:(g.__fj?.runs??0)+1,st:()=>st.current,gsap} as never;}
   if(!motion)return;
   const q=gsap.utils.selector(el);
   // Introduction: frame opens out of a smaller rounded mask, notches slide in from their edges,
   // the headline rises word by word, the selector and panel arrive in a layered sequence.
   const first=q('.fj-scene')[0];
   gsap.set(q('.fj-frame'),{clipPath:'inset(9% 7% 9% 7% round 120px)'});
   gsap.set(first?.querySelector('.fj-kb')??[],{scale:1.28});
   gsap.set(q('.fj-n-tl'),{yPercent:-110});gsap.set(q('.fj-n-tr'),{yPercent:-130});gsap.set(q('.fj-n-bl'),{yPercent:110});
   gsap.set(q('.fj-w>span'),{yPercent:115,rotate:3});
   gsap.set(q('.fj-tab'),{x:-26,opacity:0});
   gsap.set(q('.fj-panel'),{opacity:0,y:90,rotateX:12,transformPerspective:1400,transformOrigin:'50% 100%'});
   ScrollTrigger.create({trigger:el,start:'top 72%',once:true,onEnter:()=>{
    intro.current=true;
    const t=gsap.timeline({defaults:{ease:'expo.out'}});
    t.to(q('.fj-frame'),{clipPath:'inset(0% 0% 0% 0% round 0px)',duration:2})
     .to(first?.querySelector('.fj-kb')??[],{scale:1,duration:2.6},0)
     .to(q('.fj-n-tl'),{yPercent:0,duration:1.5},.35)
     .to(q('.fj-n-tr'),{yPercent:0,duration:1.5},.45)
     .to(q('.fj-n-bl'),{yPercent:0,duration:1.5},.55)
     .to(q('.fj-w>span'),{yPercent:0,rotate:0,duration:1.3,stagger:.08},.75)
     .to(q('.fj-tab'),{x:0,opacity:1,duration:1,stagger:.07},1)
     .to(q('.fj-panel'),{opacity:1,y:0,rotateX:0,duration:1.5},1.05);
   }});
   if(pin){
    st.current=ScrollTrigger.create({
     trigger:el,start:'top top',end:()=>'+='+Math.round(window.innerHeight*.62*N_SC),pin:true,pinSpacing:true,anticipatePin:1,invalidateOnRefresh:true,
     onUpdate:self=>{
      const v=self.progress*N_SC;
      const i=Math.min(N_SC-1,Math.floor(v));
      const local=Math.min(1,Math.max(0,v-i));
      // Scroll-scrubbed depth inside the current scene (transform only).
      const sc=q('.fj-scene')[i];
      if(sc){gsap.set(sc.querySelector('.fj-par'),{yPercent:(local-.5)*-5,scale:1.06-local*.04});}
      gsap.set(q('.fj-ind-bar'),{scaleX:local});
      if(lock.current!==null){if(Math.abs(window.scrollY-lock.current)<4)lock.current=null;else return;}
      setActive(a=>a===i?a:i);
     },
    });
   }
   return()=>{st.current=null;};
  });
  return()=>mm.revert();
 },[]);

 // One directed transition per service change.
 useIso(()=>{
  const el=root.current;if(!el)return;
  const from=prev.current,to=active;prev.current=to;
  const q=gsap.utils.selector(el);
  const scenes=q('.fj-scene');
  const row=q('.fj-tab')[to] as HTMLElement|undefined;
  const ind=q('.fj-ind')[0] as HTMLElement|undefined;
  if(ind&&row)gsap.to(ind,{y:row.offsetTop,height:row.offsetHeight,duration:reduced.current?0:.9,ease:'expo.out'});
  // Mobile: the horizontal chip row keeps the active chip in view (container scroll only, never the page).
  const bar=row?.parentElement;
  if(row&&bar&&bar.scrollWidth>bar.clientWidth+1)bar.scrollTo({left:Math.max(0,row.offsetLeft-14),behavior:reduced.current?'auto':'smooth'});
  if(from===to)return;
  tl.current?.progress(1).kill();
  scenes.forEach((s,i)=>gsap.set(s,i===from?{zIndex:2,visibility:'visible',clipPath:'none'}:{zIndex:i===to?3:1,visibility:i===to?'visible':'hidden'}));
  const next=scenes[to],old=scenes[from];
  if(reduced.current||!next){gsap.set(next,{clipPath:'none'});gsap.set(old,{visibility:'hidden'});return;}
  // Mask origin: the selected control's centre, in frame coordinates.
  const fr=frame.current!.getBoundingClientRect();
  const o=origin.current??(row?(()=>{const r=row.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})():{x:fr.left,y:fr.bottom});
  origin.current=null;
  const ox=((o.x-fr.left)/fr.width*100).toFixed(2)+'%',oy=((o.y-fr.top)/fr.height*100).toFixed(2)+'%';
  const ring=q('.fj-ring')[0];
  const diag=Math.hypot(fr.width,fr.height)*1.15;
  const t=gsap.timeline({defaults:{ease:'expo.inOut'},onComplete:()=>{gsap.set(old,{visibility:'hidden'});gsap.set(next,{clipPath:'none'});}});
  t.fromTo(next,{clipPath:`circle(0px at ${ox} ${oy})`},{clipPath:`circle(${diag}px at ${ox} ${oy})`,duration:1.5},0)
   .fromTo(next.querySelector('.fj-kb'),{scale:1.22,rotate:.6},{scale:1,rotate:0,duration:2.4,ease:'expo.out'},0)
   .to(old.querySelector('.fj-kb'),{scale:1.08,duration:1.5,ease:'power2.in'},0)
   .fromTo(old.querySelector('.fj-dim'),{opacity:0},{opacity:.55,duration:1.2,ease:'power2.in'},0)
   .set(old.querySelector('.fj-dim'),{opacity:0},1.6)
   .set(old.querySelector('.fj-kb'),{scale:1},1.6);
  if(ring)t.fromTo(ring,{left:ox,top:oy,width:diag*2,height:diag*2,xPercent:-50,yPercent:-50,scale:0,opacity:1},{scale:1,opacity:0,duration:1.6,ease:'expo.inOut'},0);
  // Panel copy rises through its masks; the panel glides to its new height.
  t.fromTo(q('.fj-pm>span'),{yPercent:110},{yPercent:0,duration:1.1,stagger:.06,ease:'expo.out'},.3)
   .fromTo(q('.fj-p-fade'),{opacity:0,y:12},{opacity:1,y:0,duration:.9,stagger:.06,ease:'expo.out'},.55)
   .to(q('.fj-panel-wrap'),{y:SCENES[to].py,duration:1.3,ease:'expo.inOut'},0);
  tl.current=t;
 },[active]);

 const select=useCallback((i:number,e?:{clientX:number;clientY:number})=>{
  if(e&&e.clientX)origin.current={x:e.clientX,y:e.clientY};
  const s=st.current;
  if(s){
   const y=Math.round(s.start+(s.end-s.start)*((i+.5)/N_SC));
   lock.current=y;
   window.scrollTo({top:y,behavior:'smooth'});
   window.setTimeout(()=>{lock.current=null;},1600);
  }
  setActive(i);
 },[]);
 const onKey=(e:React.KeyboardEvent)=>{
  const d=e.key==='ArrowDown'||e.key==='ArrowRight'?1:e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:0;
  if(!d)return;e.preventDefault();
  const i=(active+d+N_SC)%N_SC;select(i);
  (root.current?.querySelectorAll<HTMLButtonElement>('.fj-tab')[i])?.focus();
 };

 const s=SCENES[active],svc=SERVICES[active];
 return <section ref={root} id={id} data-chapter={chapter} className="fj" aria-label="Fikirden yapıya: hizmetler">
  <div className="fj-stage" ref={stageEl}>
   {/* Particles: born from "Fikirden yapıya", wrap the active scene's building; complete as the
       section settles at the top, then glide to each newly selected scene. */}
   <BuildingWrap progress={wrapP} stage={stageEl} title=".fj-title" img=".fj-scene[data-active='1'] img"/>
   <div ref={frame} className="fj-frame">
    {SCENES.map((x,i)=><div key={i} className="fj-scene" data-active={i===active?'1':undefined} style={{zIndex:i===0?3:1,visibility:i===0?'visible':'hidden'}} aria-hidden={i!==active}>
     <div className="fj-par"><div className="fj-kb">
      <Image src={x.src} alt={i===active?x.alt:''} fill sizes="92vw" quality={86} style={{objectFit:'cover',objectPosition:x.pos}} priority={false}/>
     </div></div>
     <div className="fj-shade" aria-hidden="true"/>
     <div className="fj-dim" aria-hidden="true"/>
    </div>)}
    <span className="fj-ring" aria-hidden="true"/>
    <div className="fj-grid" aria-hidden="true"/>
   </div>

   {/* Title notch: carved out of the frame's top-left corner (concave ears = page colour). */}
   <div className="fj-n fj-n-tl">
    <span className="st-kicker">{kicker}</span>
    <h2 className="fj-title"><span className="fj-w"><span>Fikirden</span></span> <span className="fj-w"><span><em>yapıya.</em></span></span></h2>
   </div>
   <div className="fj-n fj-n-tr">
    <Link href={cta.href} className="st-btn">{cta.label}<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
   </div>

   {/* Floating service selector, notched into the bottom-left corner. */}
   <div className="fj-n fj-n-bl">
    <span className="st-small fj-sel-label">Hizmet seçin</span>
    <div className="fj-tabs" role="tablist" aria-label="Hizmetler" aria-orientation="vertical" onKeyDown={onKey}>
     <span className="fj-ind" aria-hidden="true"><span className="fj-ind-bar"/></span>
     {SERVICES.map((x,i)=><button key={x.num} type="button" role="tab" id={`fj-tab-${i}`} aria-selected={i===active} aria-controls="fj-panel" tabIndex={i===active?0:-1}
      className={i===active?'fj-tab is-on':'fj-tab'} onClick={e=>select(i,e)}>
      <span className="fj-tab-t">{x.title}</span><span className="fj-tab-arrow"><ArrowSwap size={13}/></span>
     </button>)}
    </div>
   </div>

   {/* Floating descriptive glass panel (the active service's richer presentation). */}
   <div className="fj-panel-wrap">
    <div id="fj-panel" role="tabpanel" aria-labelledby={`fj-tab-${active}`} className="fj-panel lux-glass">
     <h3 className="fj-p-title"><span className="fj-pm"><span>{svc.title}</span></span></h3>
     <p className="fj-p-desc fj-p-fade">{svc.desc}</p>
     <div className="fj-p-src fj-p-fade"><span>{s.kind}</span><Link href={`/projeler/${s.slug}`}>{s.project}<ArrowSwap size={12}/></Link></div>
     <p className="fj-p-note fj-p-fade">Görseller farklı BYM projelerine aittir; hizmetin ya da tek bir yapının yapım aşamalarının belgesi değildir.</p>
     <div className="fj-p-cta fj-p-fade">
      <Link href="/iletisim" className="st-btn">Bu hizmeti konuşalım<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
     </div>
    </div>
   </div>
  </div>
 </section>;
}
