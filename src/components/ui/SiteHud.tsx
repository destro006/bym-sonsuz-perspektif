'use client';
import Image from 'next/image';
import Link from 'next/link';
import {motion,AnimatePresence} from 'framer-motion';
import {CHAPTERS} from '@/lib/chapters';

export function SiteHud({chapter,progress,goTo}:{chapter:number,progress:number,goTo:(p:number)=>void}){
 const c=CHAPTERS[chapter]||CHAPTERS[0];
 const late=chapter>=4;
 return <>
  <header className="topbar" aria-label="Ana gezinme">
   <Link href="/" className="brand-lockup" aria-label="BYM İnşaat — Ana sayfa">
    <Image src="/assets/brand/bym-logo-original.png" alt="BYM İnşaat" width={128} height={52} priority unoptimized/>
   </Link>
   <nav className="nav-pill" aria-label="Sayfalar">
    <Link href="/">Deneyim</Link><Link href="/projeler">Projeler</Link><Link href="/hakkimizda">Hakkımızda</Link><Link href="/iletisim">İletişim</Link>
   </nav>
   <Link href="/iletisim" className="cta-pill">Proje Görüşmesi ↗</Link>
  </header>
  <aside className="side-rail" aria-label="Sahne seçimi">
   {CHAPTERS.map((item,index)=><button key={item.id} type="button" className={chapter===index?'rail-btn active':'rail-btn'} title={item.eyebrow} aria-label={item.eyebrow} aria-current={chapter===index?'step':undefined} onClick={()=>goTo(item.start)}>{String(index+1).padStart(2,'0')}</button>)}
  </aside>
  <div className={`narrative ${late?'narrative-late':''}`} aria-live="polite">
   <AnimatePresence mode="wait">
     <motion.div key={c.id} initial={{opacity:0,y:22,filter:'blur(7px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} exit={{opacity:0,y:-14,filter:'blur(5px)'}} transition={{duration:.55,ease:[.22,1,.36,1]}}>
       <div className="eyebrow">{c.eyebrow}</div><h1>{c.title}</h1><p>{c.body}</p>
     </motion.div>
   </AnimatePresence>
   {chapter===5?<div className="placeholder-message" role="note">3D kat seçimi, doğrulanmış mimari model eklendiğinde açılacak.</div>:null}
  </div>
  <div className="bottom-hud">
    <span className="tiny-label">SÜRÜKLEYEREK DEĞİL, KAYDIRARAK KEŞFEDİN</span>
    <div className="progress-track" role="progressbar" aria-label="Sinematik yolculuk ilerlemesi" aria-valuenow={Math.round(progress*100)} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${Math.round(progress*100)}%`}}/></div>
    <span className="tiny-label">{Math.round(progress*100)}%</span>
  </div>
  {late ? <div className="source-watermark">PROJE FOTOĞRAFI / MÜŞTERİ ONAYI BEKLİYOR</div>:null}
 </>;
}
