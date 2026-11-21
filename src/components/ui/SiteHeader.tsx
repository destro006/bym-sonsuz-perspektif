'use client';
import {asset} from '@/lib/asset';
import Image from 'next/image';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {motion,AnimatePresence} from 'framer-motion';

const PAGES=[{href:'/',label:'Deneyim'},{href:'/projeler',label:'Projeler'},{href:'/hakkimizda',label:'Hakkımızda'},{href:'/iletisim',label:'İletişim'}];

/** Shared header for the 3D experience and the content pages. The logo file is shown unmodified. */
export function SiteHeader({variant='stage'}:{variant?:'stage'|'page'}){
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
  <header className={`topbar topbar-${variant}`} aria-label="Ana gezinme">
   <Link href="/" className="brand-lockup" aria-label="BYM İnşaat — Ana sayfa">
    <Image src={asset('/assets/brand/bym-logo-original.png')} alt="BYM İnşaat" width={128} height={52} priority unoptimized/>
   </Link>
   <nav className="nav-pill" aria-label="Sayfalar">
    {PAGES.map(p=><Link key={p.href} href={p.href} className={path===p.href?'active':undefined} aria-current={path===p.href?'page':undefined}>{p.label}</Link>)}
   </nav>
   <Link href="/iletisim" className="cta-pill">Proje Görüşmesi ↗</Link>
   <button ref={button} type="button" className="menu-btn" aria-expanded={open} aria-controls="mobil-menu" onClick={()=>setOpen(o=>!o)}>
    <span className="menu-icon" aria-hidden="true"><i/><i/></span>{open?'Kapat':'Menü'}
   </button>
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
