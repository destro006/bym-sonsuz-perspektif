'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
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
 return <nav className={`exnav ${className??''}`} aria-label="Ana menü">
  <div className="exnav-glass">
   {EXHIBIT_NAV.map(i=>{
    const on=current===i.key;
    const inner=<>
     {on && <motion.span layoutId={`exnav-ind-${mode}`} className="exnav-ind" transition={reduced?{duration:0}:SPRING} aria-hidden="true"/>}
     <span className="exnav-label">{i.label}</span>
    </>;
    return mode==='home'
     ? <a key={i.key} href={`#bolum-${i.key}`} className={on?'exnav-item on':'exnav-item'} aria-current={on?'location':undefined}
        onClick={e=>{e.preventDefault();onSelect?.(i.key);}}>{inner}</a>
     : <Link key={i.key} href={i.href} className={on?'exnav-item on':'exnav-item'} aria-current={on?'page':undefined}>{inner}</Link>;
   })}
  </div>
 </nav>;
}
