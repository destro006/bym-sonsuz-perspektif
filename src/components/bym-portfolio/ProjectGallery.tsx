'use client';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import type {BYMProject} from '@/data/bym-portfolio';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {Icon} from './Icon';

const EASE=[0.22,1,0.36,1] as const;

/** Mosaic gallery with a keyboard-accessible lightbox (Escape / ← / →, focus restored on close). */
export function ProjectGallery({project}:{project:BYMProject}){
 const [selected,setSelected]=useState<number|null>(null);
 const reduced=!!useReducedMotion();
 const items=project.images;
 const opener=useRef<HTMLButtonElement|null>(null);
 const closeBtn=useRef<HTMLButtonElement>(null);
 const step=(d:number)=>setSelected(s=>s===null?null:(s+d+items.length)%items.length);
 useEffect(()=>{
  if(selected===null)return;
  closeBtn.current?.focus();
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==='Escape')setSelected(null);
   else if(e.key==='ArrowRight')step(1);
   else if(e.key==='ArrowLeft')step(-1);
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[selected===null]);
 useEffect(()=>{if(selected===null)opener.current?.focus();},[selected]);
 return <>
  <div className="st-gallery">{items.map((item,i)=><motion.button type="button" key={item.src} className={`g-${i%5}`}
    onClick={e=>{opener.current=e.currentTarget;setSelected(i);}} aria-label={`${item.alt} — büyüt`}
    initial={reduced?false:{opacity:0,y:50}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.2}} transition={{duration:.9,delay:(i%3)*.08,ease:EASE}}>
   <Image src={item.src} alt={item.alt} fill sizes="(max-width: 860px) 100vw, 66vw" quality={85} style={{objectPosition:item.pos??"center"}}/>
   <span className="st-gallery-zoom">BÜYÜT ↗</span>
  </motion.button>)}</div>
  <AnimatePresence>{selected!==null && <motion.div className="st-lightbox" role="dialog" aria-modal="true" aria-label={`${project.name} görselleri`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.35}} onClick={()=>setSelected(null)}>
   <button ref={closeBtn} type="button" className="st-icon-btn st-lb-close" onClick={()=>setSelected(null)} aria-label="Kapat"><Icon name="close" size={16}/></button>
   <button type="button" className="st-icon-btn st-lb-prev" aria-label="Önceki görsel" onClick={e=>{e.stopPropagation();step(-1);}}><Icon name="prev" size={16}/></button>
   <AnimatePresence mode="wait"><motion.figure key={selected} onClick={e=>e.stopPropagation()} initial={reduced?{opacity:0}:{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.45,ease:EASE}}>
    <Image src={items[selected].src} alt={items[selected].alt} fill sizes="92vw"/>
   </motion.figure></AnimatePresence>
   <button type="button" className="st-icon-btn st-lb-next" aria-label="Sonraki görsel" onClick={e=>{e.stopPropagation();step(1);}}><Icon name="next" size={16}/></button>
   <span className="st-lb-count">{selected+1} / {items.length}</span>
  </motion.div>}</AnimatePresence>
 </>;
}
