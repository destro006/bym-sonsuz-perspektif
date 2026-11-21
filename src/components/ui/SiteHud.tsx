'use client';
import {SiteHeader} from './SiteHeader';
import {ArchHero} from './ArchHero';
import {motion,AnimatePresence} from 'framer-motion';
import {CHAPTERS} from '@/lib/chapters';
import type {ChapterId} from './HomeChapters';

/** 1.5px line icons for the chapter rail (one per chapter in data/chapters.json). */
const ICONS:React.ReactNode[]=[
 <path key="0" d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.2 2.2M15.3 15.3l2.2 2.2M17.5 6.5l-2.2 2.2M8.7 15.3l-2.2 2.2"/>,
 <path key="1" d="M12 12c0-2 1.6-3.2 3.2-2.7 2.3.7 2.5 4.1.2 5.8-2.9 2.1-7.6.5-8.2-3.4C6.6 7.2 10.6 4 14.8 4.6M12 12c0 2-1.6 3.2-3.2 2.7"/>,
 <g key="2"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.2 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.2-3.6-8.5S9.4 5.9 12 3.5z"/></g>,
 <g key="3"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></g>,
 <path key="4" d="M4 21V9l6-4v16M10 21V3l10 5v13M3 21h18M14 11h2M14 14h2M14 17h2"/>,
 <path key="5" d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5"/>,
 <path key="6" d="M4 20h16M6 20V10l6-5 6 5v10M10 20v-5h4v5"/>,
];

export function SiteHud({chapter,progress,goTo,navActive,onNav}:{chapter:number,progress:number,goTo:(p:number)=>void,navActive:ChapterId,onNav:(id:ChapterId)=>void}){
 const c=CHAPTERS[chapter]||CHAPTERS[0];
 const city=chapter===3||chapter===4;
 return <>
  <SiteHeader active={navActive} onNav={onNav}/>
  <aside className="side-rail jn-notch jn-rail" aria-label="Sahne seçimi">
   {CHAPTERS.map((item,index)=><button key={item.id} type="button" className={chapter===index?'rail-btn active':'rail-btn'} aria-label={item.eyebrow} aria-current={chapter===index?'step':undefined} onClick={()=>goTo(item.start)}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[index]}</svg>
    <span className="rail-tip" aria-hidden="true">{item.eyebrow}</span>
   </button>)}
  </aside>
  {/* Cosmic-chapter narrative. Its container fades out with --cos (camera-driven); Framer Motion
      only animates the inner text block when the chapter changes. */}
  <div className={`narrative ${chapter===0?'narrative-hero':''}`} aria-live="polite">
   <AnimatePresence mode="wait">
     <motion.div key={c.id} initial={{opacity:0,y:22}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:.6,ease:[.22,1,.36,1]}}>
       <div className="eyebrow">{c.eyebrow}</div><h1>{c.title}</h1><p>{c.body}</p>
     </motion.div>
   </AnimatePresence>
  </div>
  <ArchHero chapter={chapter} goTo={goTo}/>
  <div className="bottom-hud">
    <span className="tiny-label">SÜRÜKLEYEREK DEĞİL, KAYDIRARAK KEŞFEDİN</span>
    <div className="progress-track" role="progressbar" aria-label="Sinematik yolculuk ilerlemesi" aria-valuenow={Math.round(progress*100)} aria-valuemin={0} aria-valuemax={100}><span style={{transform:`scaleX(${progress})`}}/></div>
    <span className="tiny-label">{String(Math.round(progress*100)).padStart(2,'0')}%</span>
  </div>
  {city ? <div className="source-watermark">TEMSİLİ KENT DOKUSU · GERÇEK BİR KONUMU GÖSTERMEZ</div>:null}
 </>;
}
