'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'framer-motion';

/** The four exhibition rooms. `chapter` = homepage section id, `href` = standalone page. */
export const EXHIBIT_NAV=[
 {key:'fikirden-yapiya',label:'Fikirden Yapıya',href:'/hizmetler'},
 {key:'projeler',label:'Projeler',href:'/projeler'},
 {key:'hakkimizda',label:'Hakkımızda',href:'/hakkimizda'},
 {key:'iletisim',label:'İletişim',href:'/iletisim'},
] as const;
export type ExhibitKey=(typeof EXHIBIT_NAV)[number]['key'];

const SPRING={type:'spring',stiffness:380,damping:36,mass:.9} as const;

/**
 * Floating top-centre navigation (bottom-centre on phones). Light frosted glass, dark labels,
 * one notched ivory indicator that glides between tabs (Framer Motion layoutId).
 * - mode "home": items scroll to homepage sections; `active` follows the section in view.
 * - mode "route": items are page links; active = current route.
 */
export function ExhibitNav({mode,active,onSelect,className}:{mode:'home'|'route';active?:ExhibitKey|null;onSelect?:(k:ExhibitKey)=>void;className?:string}){
 const path=usePathname();
 const reduced=!!useReducedMotion();
 const current=mode==='route'?EXHIBIT_NAV.find(i=>path===i.href||path.startsWith(i.href+'/'))?.key??null:active??null;
 const [open,setOpen]=useState(false);
 const btn=useRef<HTMLButtonElement>(null);
 const id=`exnav-list-${mode}`;
 useEffect(()=>{if(!open)return;const k=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);btn.current?.focus();}};addEventListener('keydown',k);return()=>removeEventListener('keydown',k);},[open]);
 const label=EXHIBIT_NAV.find(i=>i.key===current)?.label??'Menü';
 return <nav className={`exnav ${open?'is-open ':''}${className??''}`} aria-label="Ana menü">
  {/* Phones: a real collapsed menu (button + list); wider screens show the list inline. */}
  <button ref={btn} type="button" className="exnav-toggle" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(o=>!o)}>
   <span>{label}</span><span className="exnav-burger" aria-hidden="true"><i/><i/></span><span className="sr-only">{open?'Menüyü kapat':'Menüyü aç'}</span>
  </button>
  <div className="exnav-glass" id={id}>
   {EXHIBIT_NAV.map(i=>{
    const on=current===i.key;
    const inner=<>
     {on && <motion.span layoutId={`exnav-ind-${mode}`} className="exnav-ind" transition={reduced?{duration:0}:SPRING} aria-hidden="true"/>}
     <span className="exnav-label">{i.label}</span>
    </>;
    return mode==='home'
     ? <a key={i.key} href={`#bolum-${i.key}`} className={on?'exnav-item on':'exnav-item'} aria-current={on?'location':undefined}
        onClick={e=>{e.preventDefault();setOpen(false);onSelect?.(i.key);}}>{inner}</a>
     : <Link key={i.key} href={i.href} className={on?'exnav-item on':'exnav-item'} aria-current={on?'page':undefined} onClick={()=>setOpen(false)}>{inner}</Link>;
   })}
  </div>
 </nav>;
}
