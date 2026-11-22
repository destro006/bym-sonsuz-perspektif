'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {U3_PROJECTS,type U3Project} from '@/data/ui03';

const EASE=[0.22,1,0.36,1] as const;
const N=U3_PROJECTS.length;
const wrap=(i:number)=>((i%N)+N)%N;

/**
 * Concept 03 project gallery: one prominent glass card with neighbours receding in depth on a
 * glowing stage (desktop), one card per view with swipe (mobile). Framer Motion owns these
 * transforms only; nothing here is driven by the intro's scroll controller.
 */
export function ProjectCarousel(){
 const reduced=!!useReducedMotion();
 const [i,setI]=useState(0);
 const [open,setOpen]=useState<U3Project|null>(null);
 const [mobile,setMobile]=useState(false);
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 const lastCard=useRef<HTMLButtonElement|null>(null);
 const drag=useRef<number|null>(null);
 useEffect(()=>{const mq=window.matchMedia('(max-width: 760px)');const f=()=>setMobile(mq.matches);f();mq.addEventListener('change',f);return()=>mq.removeEventListener('change',f);},[]);

 // Deep link / history: ?proje=<id> opens that project's gallery; Back closes it.
 const openProject=useCallback((p:U3Project,push=true)=>{
  setOpen(p);setI(U3_PROJECTS.indexOf(p));
  if(push){const u=new URL(location.href);u.searchParams.set('proje',p.id);history.pushState({proje:p.id},'',u);}
 },[]);
 const close=useCallback((fromPop=false)=>{
  setOpen(null);
  if(!fromPop&&new URL(location.href).searchParams.has('proje'))history.back();
  requestAnimationFrame(()=>lastCard.current?.focus());
 },[]);
 useEffect(()=>{
  const sync=()=>{const id=new URL(location.href).searchParams.get('proje');const p=U3_PROJECTS.find(x=>x.id===id);
   if(p){setOpen(p);setI(U3_PROJECTS.indexOf(p));document.getElementById('bolum-projeler')?.scrollIntoView({block:'start'});} else setOpen(null);};
  sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);
 },[]);

 const go=(d:number)=>setI(x=>wrap(x+d));
 const pose=(d:number)=>{
  if(mobile)return {x:`${d*104}%`,z:0,rotateY:0,scale:d===0?1:.9,opacity:Math.abs(d)>1?0:d===0?1:.45};
  const a=Math.abs(d);
  return {x:`${d*58}%`,z:-a*260,rotateY:-d*22,scale:1-a*.06,opacity:a>2?0:1-a*.18};
 };
 return <div className="u3-carousel">
  <div className="u3-stage" onKeyDown={e=>{if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1);}}
   onPointerDown={e=>{drag.current=e.clientX;}} onPointerUp={e=>{if(drag.current!==null){const dx=e.clientX-drag.current;if(Math.abs(dx)>50)go(dx<0?1:-1);drag.current=null;}}}>
   <div className="u3-floor" aria-hidden="true"/>
   <div className="u3-track" role="list" aria-label="Projeler">
    {U3_PROJECTS.map((p,k)=>{
     let d=k-i;if(d>N/2)d-=N;if(d<-N/2)d+=N;
     const front=d===0;
     return <motion.div key={p.id} role="listitem" className={`u3-card-wrap${front?' is-front':''}`} style={{zIndex:20-Math.abs(d)}}
      initial={false} animate={pose(d)} transition={reduced?{duration:0}:{duration:.9,ease:EASE}}>
      <button type="button" className="u3-card" aria-label={`${p.name} projesinin galerisini aç`} tabIndex={front?0:-1}
       onClick={e=>{if(!front){setI(k);return;}lastCard.current=e.currentTarget;openProject(p);}}
       onPointerMove={e=>{if(e.pointerType!=='mouse'||!front)return;const r=e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx',((e.clientX-r.left)/r.width).toFixed(3));e.currentTarget.style.setProperty('--my',((e.clientY-r.top)/r.height).toFixed(3));}}
       onPointerLeave={e=>{e.currentTarget.style.removeProperty('--mx');e.currentTarget.style.removeProperty('--my');}}>
       <motion.span className="u3-card-img" layoutId={`u3-img-${p.id}`}><img src={p.card} alt="" loading={Math.abs(d)<=1?'eager':'lazy'} draggable={false}/></motion.span>
       <span className="u3-card-sheen" aria-hidden="true"/>
       <span className="u3-card-cap"><span><b>{p.name}</b><small>{p.category} · Galeriyi aç</small></span><i className="u3-arrow" aria-hidden="true">→</i></span>
      </button>
     </motion.div>;
    })}
   </div>
  </div>
  <div className="u3-controls">
   <button type="button" className="u3-round" onClick={()=>go(-1)} aria-label="Önceki proje">←</button>
   <div className="u3-dots" role="tablist" aria-label="Proje seçimi">{U3_PROJECTS.map((p,k)=><button key={p.id} type="button" role="tab" aria-selected={k===i} aria-label={p.name} className={k===i?'on':''} onClick={()=>setI(k)}/>)}</div>
   <button type="button" className="u3-round" onClick={()=>go(1)} aria-label="Sonraki proje">→</button>
  </div>
  {/* Portal: the dialog must sit above the fixed navigation, outside the chapters' stacking context. */}
  {mounted && createPortal(<AnimatePresence>{open && <ProjectGallery key={open.id} project={open} onClose={()=>close()}/>}</AnimatePresence>,document.body)}
 </div>;
}

/** Detail panel: only this project's own images, in manifest order. */
function ProjectGallery({project:p,onClose}:{project:U3Project;onClose:()=>void}){
 const [k,setK]=useState(0);
 const panel=useRef<HTMLDivElement>(null);
 const touch=useRef<number|null>(null);
 const n=p.gallery.length;
 const go=(d:number)=>setK(x=>(x+d+n)%n);
 useEffect(()=>{
  const prev=document.body.style.overflow;document.body.style.overflow='hidden';
  panel.current?.querySelector<HTMLElement>('.u3-g-close')?.focus();
  // Preload neighbours only.
  [1,-1].forEach(d=>{const im=new Image();im.src=p.gallery[(d+n)%n].src;});
  return()=>{document.body.style.overflow=prev;};
 },[p,n]);
 useEffect(()=>{[1,-1].forEach(d=>{const im=new Image();im.src=p.gallery[(k+d+n)%n].src;});},[k,p,n]);
 const onKey=(e:React.KeyboardEvent)=>{
  if(e.key==='Escape'){e.stopPropagation();onClose();}
  if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1);
  if(e.key==='Tab'){ // focus trap
   const f=[...panel.current!.querySelectorAll<HTMLElement>('button')];const a=f[0],z=f[f.length-1];
   if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
  }
 };
 const img=p.gallery[k];
 return <motion.div className="u3-g" role="dialog" aria-modal="true" aria-label={`${p.name} galerisi`} ref={panel} onKeyDown={onKey}
  initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.45,ease:EASE}}>
  <div className="u3-g-backdrop" onClick={onClose} aria-hidden="true"/>
  <div className="u3-g-shell u3-glass">
   <header className="u3-g-head">
    <div><span className="u3-kicker">{p.category}</span><h3>{p.name}</h3></div>
    <span className="u3-g-note">Arşiv görselleri · yayın onayı bekliyor</span>
    <button type="button" className="u3-round u3-g-close" onClick={onClose} aria-label="Galeriyi kapat">✕</button>
   </header>
   <div className="u3-g-body">
    <div className="u3-g-main" onTouchStart={e=>{touch.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touch.current!==null){const dx=e.changedTouches[0].clientX-touch.current;if(Math.abs(dx)>40)go(dx<0?1:-1);touch.current=null;}}}>
     <motion.span className="u3-g-frame" layoutId={k===0?`u3-img-${p.id}`:undefined}>
      <AnimatePresence mode="popLayout" initial={false}>
       <motion.img key={img.src} src={img.src} alt={`${p.name} — görsel ${k+1} / ${n}`} initial={{opacity:0,scale:1.03}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.5,ease:EASE}}/>
      </AnimatePresence>
     </motion.span>
     <button type="button" className="u3-round u3-g-prev" onClick={()=>go(-1)} aria-label="Önceki görsel">←</button>
     <button type="button" className="u3-round u3-g-next" onClick={()=>go(1)} aria-label="Sonraki görsel">→</button>
     <span className="u3-g-count" aria-live="polite">{k+1} / {n}</span>
    </div>
    <div className="u3-g-rail" aria-label="Küçük resimler">
     {p.gallery.map((g,j)=><button key={g.src} type="button" className={j===k?'on':''} aria-label={`Görsel ${j+1}`} aria-current={j===k} onClick={()=>setK(j)}><img src={g.src} alt="" loading="lazy"/></button>)}
    </div>
   </div>
  </div>
 </motion.div>;
}
