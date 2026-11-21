'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence,motion,useReducedMotion } from 'framer-motion';
import { BYM_CATEGORIES, BYM_PROJECTS } from '@/data/bym-portfolio';
export function PortfolioGrid(){
 const [filter,setFilter]=useState<string>('Tümü');const reduced=useReducedMotion();
 const shown=BYM_PROJECTS.filter(p=>filter==='Tümü'||p.category===filter);
 return <section className="bym-project-section" aria-label="Proje portföyü">
  <div className="bym-section-head"><div><span className="bym-kicker">02 / PORTFÖY</span><h2>İz bırakan <em>projeler.</em></h2></div><div className="bym-filters" aria-label="Proje kategorisi">{BYM_CATEGORIES.map(x=><button type="button" aria-pressed={filter===x} className={filter===x?'active':''} key={x} onClick={()=>setFilter(x)}>{x}</button>)}</div></div>
  <motion.div layout={!reduced} className="bym-portfolio-grid">
   <AnimatePresence mode="popLayout">{shown.map((p,i)=><motion.article layout={!reduced} key={p.slug} className={'bym-project-card bym-project-card-'+(i%4)} initial={reduced?false:{opacity:0,y:35,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={reduced?{opacity:0}:{opacity:0,y:20,scale:.98}} transition={{duration:reduced?0:.58,ease:[.22,1,.36,1]}}>
    <Link href={'/projeler/'+p.slug} aria-label={p.name+' projesini incele'}>
     <div className="bym-project-visual"><img src={p.hero} alt={p.name+' proje görseli'} loading="lazy"/><span className="bym-image-arrow" aria-hidden>↗</span><span className="bym-image-cat">{p.category}</span></div>
     <div className="bym-project-card-caption"><div><span className="bym-small-label">{String(i+1).padStart(2,'0')} / {p.kicker}</span><h3>{p.name}</h3></div><span className="bym-project-location">{p.location}</span></div>
    </Link>
   </motion.article>)}</AnimatePresence>
  </motion.div>
 </section>
}
