'use client';
import Link from 'next/link';
import {useCallback,useLayoutEffect,useRef,useState,type CSSProperties,type MouseEvent} from 'react';
import {motion,useReducedMotion} from 'framer-motion';

/** Shared spring for the nav capsule: settles quickly with no overshoot. */
export const NAV_SPRING={type:'spring',stiffness:420,damping:40,mass:.9} as const;

export type GlideItem={key:string;href:string;label:string;active:boolean;current?:'page'|'location';style?:CSSProperties;onClick?:(e:MouseEvent<HTMLAnchorElement>)=>void;route?:boolean};
type Box={x:number;w:number;h:number;y:number};
type Ghost={key:string;x:number;y:number;font:string;ls:string};

/**
 * Text navigation with one gliding charcoal capsule.
 *
 * Readability contract: the base labels are always dark ink. The capsule (#242622) is a single
 * element that slides between items and carries its own white copy of every label, counter-
 * translated so each copy sits exactly over its base label. Wherever the capsule overlaps text —
 * at rest or mid-glide — that text is white on charcoal; everywhere else it is dark on glass.
 * No colour tween ever passes through low contrast, and the nav's own size never changes.
 */
export function GlideNav({items,className,label,capsuleStyle}:{items:GlideItem[];className?:string;label:string;capsuleStyle?:CSSProperties}){
 const reduced=!!useReducedMotion();
 const nav=useRef<HTMLElement>(null);
 const [box,setBox]=useState<Box|null>(null);
 const [ghosts,setGhosts]=useState<Ghost[]>([]);
 const first=useRef(true);
 const activeKey=items.find(i=>i.active)?.key;

 const measure=useCallback(()=>{
  const n=nav.current;if(!n)return;
  // offsetLeft/Top ignore the per-item reveal transforms, so the capsule targets the resting slot.
  const links=[...n.querySelectorAll<HTMLAnchorElement>(':scope > a')];
  const g:Ghost[]=[];let b:Box|null=null;
  links.forEach(a=>{
   const t=a.querySelector<HTMLElement>('.nav-text');if(!t)return;
   const cs=getComputedStyle(a);
   g.push({key:a.dataset.key!,x:a.offsetLeft+t.offsetLeft,y:a.offsetTop+t.offsetTop,font:cs.font,ls:cs.letterSpacing});
   if(a.dataset.key===activeKey)b={x:a.offsetLeft,y:a.offsetTop,w:a.offsetWidth,h:a.offsetHeight};
  });
  setGhosts(g);setBox(b);
 },[activeKey]);

 useLayoutEffect(()=>{
  measure();
  const n=nav.current;if(!n)return;
  const ro=new ResizeObserver(measure);ro.observe(n);
  document.fonts?.ready.then(measure).catch(()=>{});
  return()=>ro.disconnect();
 },[measure]);
 useLayoutEffect(()=>{if(box)first.current=false;},[box]);

 const t=reduced||first.current?{duration:0}:NAV_SPRING;
 return <nav ref={nav} className={`nav-glide ${className??''}`} aria-label={label}>
  {items.map(i=>{
   const p={'data-key':i.key,className:i.active?'active':undefined,'aria-current':i.active?(i.current??'page'):undefined,style:i.style,onClick:i.onClick} as const;
   const inner=<span className="nav-text">{i.label}</span>;
   return i.route===false?<a key={i.key} href={i.href} {...p}>{inner}</a>:<Link key={i.key} href={i.href} {...p}>{inner}</Link>;
  })}
  {box && <motion.span className="nav-capsule" aria-hidden="true" style={{top:box.y,height:box.h,...capsuleStyle}} initial={false} animate={{x:box.x,width:box.w}} transition={t}>
   <motion.span className="nav-capsule-ink" initial={false} animate={{x:-box.x}} transition={t}>
    {ghosts.map(g=><span key={g.key} style={{left:g.x,top:g.y-box.y,font:g.font,letterSpacing:g.ls}}>{items.find(i=>i.key===g.key)?.label}</span>)}
   </motion.span>
  </motion.span>}
 </nav>;
}
