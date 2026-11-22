'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {AnimatePresence,motion,useMotionValue,useReducedMotion,useSpring,useTransform,type Variants} from 'framer-motion';
import {U3_FACTS,U3_PROJECTS,type U3Project} from '@/data/ui03';

const EASE=[0.22,1,0.36,1] as const;
const N=U3_PROJECTS.length;
const wrap=(i:number)=>((i%N)+N)%N;

/**
 * Concept 03 spatial carousel. Framer Motion owns every transform here (cards, track tilt, detail view);
 * GSAP/ScrollTrigger is never pointed at these elements, so the two controllers never share a property.
 */
export function ProjectCarousel(){
 const reduced=!!useReducedMotion();
 const [i,setI]=useState(0);
 const [open,setOpen]=useState<U3Project|null>(null);
 const [mobile,setMobile]=useState(false);
 const [mounted,setMounted]=useState(false);
 const lastCard=useRef<HTMLButtonElement|null>(null);
 const drag=useRef<number|null>(null);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{const mq=window.matchMedia('(max-width: 760px)');const f=()=>setMobile(mq.matches);f();mq.addEventListener('change',f);return()=>mq.removeEventListener('change',f);},[]);

 // Pointer parallax for the whole stage: a few degrees at most, springs back to rest.
 const px=useMotionValue(0),py=useMotionValue(0);
 const sx=useSpring(px,{stiffness:90,damping:20,mass:.6}),sy=useSpring(py,{stiffness:90,damping:20,mass:.6});
 const tiltY=useTransform(sx,v=>v*5),tiltX=useTransform(sy,v=>-v*3);

 // The page behind the detail view recedes (CSS reads html[data-u3detail]); origin = viewport centre.
 useEffect(()=>{
  const root=document.documentElement;const el=document.querySelector<HTMLElement>('.u3.home-chapters');
  if(open){if(el)el.style.transformOrigin=`50% ${innerHeight/2-el.getBoundingClientRect().top}px`;root.dataset.u3detail='1';}
  else delete root.dataset.u3detail;
  return()=>{delete root.dataset.u3detail;};
 },[open]);

 // Deep link / history: ?proje=<id> opens that project; Back and refresh are honoured.
 const openProject=useCallback((p:U3Project)=>{
  setOpen(p);setI(U3_PROJECTS.indexOf(p));
  const u=new URL(location.href);u.searchParams.set('proje',p.id);history.pushState({proje:p.id},'',u);
 },[]);
 const close=useCallback(()=>{
  if(history.state?.proje)history.back();                 // opened here → one step back
  else{const u=new URL(location.href);u.searchParams.delete('proje');history.replaceState(null,'',u);setOpen(null);} // arrived via link
 },[]);
 useEffect(()=>{
  const sync=(first:boolean)=>{const id=new URL(location.href).searchParams.get('proje');const p=U3_PROJECTS.find(x=>x.id===id);
   if(p){setOpen(p);setI(U3_PROJECTS.indexOf(p));if(first)document.getElementById('bolum-projeler')?.scrollIntoView({block:'start'});}
   else setOpen(null);};
  sync(true);const on=()=>sync(false);window.addEventListener('popstate',on);return()=>window.removeEventListener('popstate',on);
 },[]);
 // Focus returns to the card the visitor opened (or the front card after a deep link).
 const wasOpen=useRef(false);
 useEffect(()=>{
  if(open){wasOpen.current=true;return;}
  if(wasOpen.current){wasOpen.current=false;setTimeout(()=>(lastCard.current??document.querySelector<HTMLElement>('.is-front .u3-card'))?.focus({preventScroll:true}),400);}
 },[open]);

 const go=(d:number)=>setI(x=>wrap(x+d));
 const pose=(d:number)=>{
  const a=Math.abs(d);
  if(mobile)return {x:`${d*106}%`,z:0,rotateY:0,scale:d===0?1:.88,opacity:a>1?0:d===0?1:.4};
  // Concave gallery wall (reference): sides smaller, outer edges turned toward the viewer, no overlap.
  const X=[0,98,182][Math.min(a,2)]??200;
  return {x:`${Math.sign(d)*X}%`,z:-a*60,rotateY:-Math.sign(d)*(a===0?0:a===1?22:30),scale:[1,.82,.68][Math.min(a,2)]??.6,opacity:a>2?0:1};
 };
 return <div className="u3-carousel">
  <div className="u3-stage" onKeyDown={e=>{if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1);}}
   onPointerMove={e=>{if(reduced||e.pointerType!=='mouse')return;const r=e.currentTarget.getBoundingClientRect();px.set((e.clientX-r.left)/r.width*2-1);py.set((e.clientY-r.top)/r.height*2-1);}}
   onPointerLeave={()=>{px.set(0);py.set(0);}}
   onPointerDown={e=>{drag.current=e.clientX;}} onPointerUp={e=>{if(drag.current!==null){const dx=e.clientX-drag.current;if(Math.abs(dx)>50)go(dx<0?1:-1);drag.current=null;}}}>
   <div className="u3-floor" aria-hidden="true"/>
   <motion.div className="u3-track" role="list" aria-label="Projeler" style={{rotateX:tiltX,rotateY:tiltY}}>
    {U3_PROJECTS.map((p,k)=>{
     let d=k-i;if(d>N/2)d-=N;if(d<-N/2)d+=N;
     const front=d===0;
     return <motion.div key={p.id} role="listitem" className={`u3-card-wrap${front?' is-front':''}`} style={{zIndex:20-Math.abs(d)}}
      initial={false} animate={pose(d)} transition={reduced?{duration:0}:{type:'spring',stiffness:70,damping:18,mass:1}}>
      {!front && <span className="u3-card-ghost" aria-hidden="true"/>}
      <button type="button" className="u3-card" aria-label={front?`${p.name} projesini aç`:`${p.name} projesine geç`} tabIndex={front?0:-1}
       onClick={e=>{if(!front){setI(k);return;}lastCard.current=e.currentTarget;openProject(p);}}
       onPointerMove={e=>{if(e.pointerType!=='mouse'||!front||reduced)return;const r=e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx',((e.clientX-r.left)/r.width).toFixed(3));e.currentTarget.style.setProperty('--my',((e.clientY-r.top)/r.height).toFixed(3));}}
       onPointerLeave={e=>{e.currentTarget.style.removeProperty('--mx');e.currentTarget.style.removeProperty('--my');}}>
       {open?.id!==p.id && <motion.span className="u3-card-img" layoutId={`u3-img-${p.id}`} transition={{duration:reduced?0:.8,ease:EASE}}><img src={p.card} alt="" loading={Math.abs(d)<=1?'eager':'lazy'} draggable={false}/></motion.span>}
       <span className="u3-card-sheen" aria-hidden="true"/>
       <span className="u3-card-cap"><span><b>{p.name}</b><small>{p.category} · {p.gallery.length} görsel</small></span><i className="u3-arrow" aria-hidden="true">→</i></span>
      </button>
     </motion.div>;
    })}
   </motion.div>
  </div>
  <div className="u3-controls">
   <button type="button" className="u3-round" onClick={()=>go(-1)} aria-label="Önceki proje">←</button>
   <div className="u3-dots" role="group" aria-label="Proje seçimi">{U3_PROJECTS.map((p,k)=><button key={p.id} type="button" aria-pressed={k===i} aria-label={p.name} className={k===i?'on':''} onClick={()=>setI(k)}/>)}</div>
   <button type="button" className="u3-round" onClick={()=>go(1)} aria-label="Sonraki proje">→</button>
  </div>
  <p className="sr-only" aria-live="polite">{U3_PROJECTS[i].name}</p>
  {mounted && createPortal(<AnimatePresence>{open && <ProjectDetail key={open.id} project={open} onClose={close} reduced={reduced}/>}</AnimatePresence>,document.body)}
 </div>;
}

const seq:Variants={hidden:{},show:{transition:{staggerChildren:.09,delayChildren:.45}},exit:{}};
const item:Variants={hidden:{opacity:0,y:18},show:{opacity:1,y:0,transition:{duration:.7,ease:EASE}},exit:{opacity:0,transition:{duration:.2}}};

/** Full-screen project presentation: shared-element expand from the card, then title → facts → navigation. */
function ProjectDetail({project:p,onClose,reduced}:{project:U3Project;onClose:()=>void;reduced:boolean}){
 const [k,setK]=useState(0);
 const [dir,setDir]=useState(1);
 const panel=useRef<HTMLDivElement>(null);
 const touch=useRef<number|null>(null);
 const n=p.gallery.length;
 const facts=U3_FACTS[p.id];
 const go=(d:number)=>{setDir(d);setK(x=>(x+d+n)%n);};
 const mx=useMotionValue(0),my=useMotionValue(0);
 const smx=useSpring(mx,{stiffness:60,damping:20}),smy=useSpring(my,{stiffness:60,damping:20});
 const ix=useTransform(smx,v=>`${v*-1.2}%`),iy=useTransform(smy,v=>`${v*-1.2}%`);
 useEffect(()=>{
  const prev=document.body.style.overflow;document.body.style.overflow='hidden';
  const t=setTimeout(()=>panel.current?.querySelector<HTMLElement>('.u3-d-close')?.focus({preventScroll:true}),reduced?0:500);
  return()=>{clearTimeout(t);document.body.style.overflow=prev;};
 },[reduced]);
 useEffect(()=>{[1,-1].forEach(d=>{const im=new Image();im.src=p.gallery[(k+d+n)%n].src;});},[k,p,n]);
 const onKey=(e:React.KeyboardEvent)=>{
  if(e.key==='Escape'){e.stopPropagation();onClose();}
  if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1);
  if(e.key==='Tab'){
   const f=[...panel.current!.querySelectorAll<HTMLElement>('button,a[href]')];const a=f[0],z=f[f.length-1];
   if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
  }
 };
 const img=p.gallery[k];
 const wipe=reduced?{}:{initial:{clipPath:dir>0?'inset(0% 0% 0% 100%)':'inset(0% 100% 0% 0%)'},animate:{clipPath:'inset(0% 0% 0% 0%)'},exit:{opacity:.999}};
 return <motion.div className="u3-d" role="dialog" aria-modal="true" aria-labelledby="u3-d-title" ref={panel} onKeyDown={onKey}
  initial={{opacity:1}} animate={{opacity:1}} exit={{opacity:0,transition:{duration:.35,delay:.3}}}>
  <motion.div className="u3-d-bg" aria-hidden="true" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.5}}/>
  <div className="u3-d-media"
   onPointerMove={e=>{if(reduced||e.pointerType!=='mouse')return;mx.set(e.clientX/innerWidth*2-1);my.set(e.clientY/innerHeight*2-1);}}
   onTouchStart={e=>{touch.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touch.current!==null){const dx=e.changedTouches[0].clientX-touch.current;if(Math.abs(dx)>40)go(dx<0?1:-1);touch.current=null;}}}>
   {/* Shared element: the card's image box expands into this frame. */}
   <motion.div className="u3-d-frame" layoutId={`u3-img-${p.id}`} transition={{duration:reduced?0:.8,ease:EASE}}>
    <motion.div className="u3-d-par" style={{x:ix,y:iy}}>
     <AnimatePresence initial={false}>
      <motion.img key={img.src} src={img.src} alt={`${p.name} — görsel ${k+1} / ${n}`} draggable={false}
       {...wipe} transition={{duration:.9,ease:[0.76,0,0.24,1]}}/>
     </AnimatePresence>
    </motion.div>
   </motion.div>
   <motion.div className="u3-d-shade" aria-hidden="true" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.6,delay:.3}}/>
  </div>

  <motion.div className="u3-d-ui" variants={seq} initial="hidden" animate="show" exit="exit">
   <motion.header className="u3-d-top" variants={item}>
    <span className="u3-d-badge">Arşiv görselleri · yayın onayı bekliyor</span>
    <button type="button" className="u3-round u3-d-close" onClick={onClose} aria-label="Projeyi kapat ve projelere dön">✕</button>
   </motion.header>
   <div className="u3-d-info">
    <motion.span className="u3-kicker" variants={item}>{p.category}</motion.span>
    <div className="u3-d-mask"><motion.h2 id="u3-d-title" className="u3-display" variants={{hidden:{y:'105%'},show:{y:'0%',transition:{duration:.9,ease:EASE}},exit:{opacity:0}}}>{p.name}</motion.h2></div>
    {facts && <motion.div className="u3-d-facts u3-glass" variants={item}>
     <dl>{facts.stats.map(s=><div key={s.l}><dt>{s.l}</dt><dd>{s.v}</dd></div>)}</dl>
     <ul>{facts.tags.map(t=><li key={t}>{t}</li>)}</ul>
     <small>Proje bilgileri müşteri onayı beklemektedir.</small>
    </motion.div>}
   </div>
   <motion.nav className="u3-d-nav" variants={item} aria-label="Görsel gezinme">
    <button type="button" className="u3-round" onClick={()=>go(-1)} aria-label="Önceki görsel">←</button>
    <span className="u3-d-count" aria-live="polite"><b>{String(k+1).padStart(2,'0')}</b> / {String(n).padStart(2,'0')}</span>
    <button type="button" className="u3-round" onClick={()=>go(1)} aria-label="Sonraki görsel">→</button>
    <div className="u3-d-rail">
     {p.gallery.map((g,j)=><button key={g.src} type="button" className={j===k?'on':''} aria-label={`Görsel ${j+1}`} aria-current={j===k} onClick={()=>{setDir(j>k?1:-1);setK(j);}}><img src={g.src} alt="" loading="lazy"/></button>)}
    </div>
   </motion.nav>
  </motion.div>
 </motion.div>;
}
