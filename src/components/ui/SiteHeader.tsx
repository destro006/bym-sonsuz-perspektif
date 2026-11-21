'use client';
import {asset} from '@/lib/asset';
import Image from 'next/image';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {HOME_CHAPTERS,type ChapterId} from './HomeChapters';
import {GlideNav} from '@/components/bym-portfolio/GlideNav';
import {ArrowSwap} from '@/components/bym-portfolio/ArrowSwap';

const PAGES=[{href:'/',label:'Deneyim'},{href:'/projeler',label:'Projeler'},{href:'/hakkimizda',label:'Hakkımızda'},{href:'/hizmetler',label:'Hizmetler'},{href:'/basinda-biz',label:'Basında Biz'},{href:'/iletisim',label:'İletişim'}];

/** Shared header for the 3D experience and the content pages. The logo file is shown unmodified. */
export function SiteHeader({variant='stage',active,onNav}:{variant?:'stage'|'page';active?:ChapterId;onNav?:(id:ChapterId)=>void}){
 const path=usePathname();
 const [open,setOpen]=useState(false);
 const button=useRef<HTMLButtonElement>(null);
 const first=useRef<HTMLAnchorElement>(null);
 useEffect(()=>{
  if(!open)return;
  first.current?.focus();
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);button.current?.focus();}};
  window.addEventListener('keydown',onKey);
  return ()=>window.removeEventListener('keydown',onKey);
 },[open]);
 return <>
  {/* Each control sits in an ivory notch carved out of the stage frame (see .jn-notch). */}
  <header className={`topbar topbar-${variant}`} aria-label="Ana gezinme">
   <div className="jn-notch jn-tl">
    <Link href="/" className="brand-lockup" aria-label="BYM İnşaat — Ana sayfa">
     <Image src={asset("/assets/brand/bym-logo-original.png")} alt="BYM İnşaat" width={128} height={52} priority unoptimized/>
    </Link>
   </div>
   <div className={onNav?'jn-notch jn-tc jn-tc-chapters':'jn-notch jn-tc'}>
   {onNav
    ? /* Homepage: chapter navigation. Items reveal one by one from scroll vars (--n0…--n5). */
      <GlideNav className="nav-pill nav-chapters" label="Bölümler"
       capsuleStyle={{opacity:'var(--n'+Math.max(0,HOME_CHAPTERS.findIndex(c=>c.id===active))+')'} as React.CSSProperties}
       items={HOME_CHAPTERS.map((c,i)=>({key:c.id,href:c.id==='deneyim'?'#':'#bolum-'+c.id,label:c.label,active:active===c.id,current:'location',route:false,
        style:{['--ni' as string]:'var(--n'+i+')'} as React.CSSProperties,onClick:e=>{e.preventDefault();onNav(c.id);}}))}/>
    : <GlideNav className="nav-pill" label="Sayfalar" items={PAGES.map(p=>({key:p.href,href:p.href,label:p.label,active:path===p.href}))}/>}
   </div>
   <div className="jn-notch jn-tr">
    <Link href="/iletisim" className="cta-pill"><span>Proje Görüşmesi</span><span className="cta-arrow" aria-hidden="true"><ArrowSwap size={14}/></span></Link>
    <button ref={button} type="button" className="menu-btn" aria-expanded={open} aria-controls="mobil-menu" onClick={()=>setOpen(o=>!o)}>
     <span className="menu-icon" aria-hidden="true"><i/><i/></span>{open?'Kapat':'Menü'}
    </button>
   </div>
  </header>
  {/* Framer Motion owns only this independent UI panel; GSAP/scroll never touches it. */}
  <AnimatePresence>
   {open && <motion.nav id="mobil-menu" className="mobile-menu" aria-label="Sayfalar (mobil)"
     initial={{opacity:0,y:-12,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.98}} transition={{duration:.32,ease:[.22,1,.36,1]}}>
     {PAGES.map((p,i)=><Link key={p.href} ref={i===0?first:undefined} href={p.href} aria-current={path===p.href?'page':undefined} onClick={()=>setOpen(false)}>{p.label}</Link>)}
     <Link href="/iletisim" className="mobile-menu-cta" onClick={()=>setOpen(false)}>Proje Görüşmesi ↗</Link>
   </motion.nav>}
  </AnimatePresence>
 </>;
}
