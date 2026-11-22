'use client';
import {asset} from '@/lib/asset';
import Link from 'next/link';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {BYM_PROJECTS,COMPANY,PRESS} from '@/data/bym-portfolio';
import {ProjectTile} from '@/components/bym-portfolio/ProjectTile';
import {LayeredFeature,Rise} from '@/components/bym-portfolio/Layered';
import {Lines} from '@/components/bym-portfolio/Lines';
import {ArrowSwap} from '@/components/bym-portfolio/ArrowSwap';
import {GlideNav} from '@/components/bym-portfolio/GlideNav';
import {ServiceJourney} from '@/components/bym-portfolio/ServiceJourney';

/** Homepage chapters, in the same order as the top navigation. */
export const HOME_CHAPTERS=[
 {id:'deneyim',label:'Deneyim',href:'/'},
 {id:'fikirden-yapiya',label:'Fikirden Yapıya',href:'/hizmetler'},
 {id:'projeler',label:'Projeler',href:'/projeler'},
 {id:'hakkimizda',label:'Hakkımızda',href:'/hakkimizda'},
 {id:'iletisim',label:'İletişim',href:'/iletisim'},
] as const;
export type ChapterId=(typeof HOME_CHAPTERS)[number]['id'];

export function scrollToChapter(id:ChapterId,reduced:boolean){
 if(id==='deneyim'){window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});return;}
 document.getElementById(`bolum-${id}`)?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
}

function Head({kicker,lines,href,cta}:{kicker:string;lines:string[];href:string;cta:string}){
 return <div className="st-section-head hc-head">
  <div><Rise><span className="st-kicker">{kicker}</span></Rise><h2 className="st-h2"><Lines l={lines} inView delay={.1}/></h2></div>
  <Rise delay={.2}><Link href={href} className="st-btn">{cta}<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link></Rise>
 </div>;
}

/**
 * Chapters after the cosmic journey (Projeler → İletişim). One IntersectionObserver reports the
 * chapter crossing the viewport centre; the journey section itself reports "deneyim".
 * A compact floating nav takes over once the sticky stage has scrolled away.
 */
export function HomeChapters({active,onActive}:{active:ChapterId;onActive:(id:ChapterId)=>void}){
 const reduced=!!useReducedMotion();
 useEffect(()=>{
  const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)onActive((e.target as HTMLElement).dataset.chapter as ChapterId);},{rootMargin:'-48% 0px -48% 0px'});
  document.querySelectorAll('[data-chapter]').forEach(el=>io.observe(el));
  return()=>io.disconnect();
 },[onActive]);
 const projects=BYM_PROJECTS.slice(0,4);
 return <div className="st-site home-chapters">
  <ServiceJourney id="bolum-fikirden-yapiya" chapter="fikirden-yapiya" kicker="FİKİRDEN YAPIYA"/>

  <section id="bolum-projeler" data-chapter="projeler" className="st-section hc-chapter" aria-label="Projeler">
   <Head kicker="PROJELER" lines={['İz bırakan','*projeler.*']} href="/projeler" cta="Tüm projeler"/>
   <div className="st-tiles hc-tiles">{projects.map((p,i)=><ProjectTile key={p.slug} project={p} index={i} reduced={reduced}/>)}</div>
  </section>

  <section id="bolum-hakkimizda" data-chapter="hakkimizda" className="hc-chapter" aria-label="Hakkımızda">
   <LayeredFeature src={asset("/assets/bym-portfolio-curated/ruya-sehir/ruya-hero.webp")} alt="Rüya Şehir konut bloklarının cephesi" tall>
    <span className="st-kicker">HAKKIMIZDA</span>
    <h2 className="st-h3"><Lines l={['Güven, tutarlılıkla','*inşa edilir.*']} inView delay={.2}/></h2>
    <p className="st-card-text">{COMPANY.about}</p>
    <ul className="st-list">{COMPANY.values.map(v=><li key={v.title}>{v.title}</li>)}</ul>
    <Link href="/hakkimizda" className="st-btn">Hikâyemiz<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
   </LayeredFeature>
  </section>

  <section id="bolum-iletisim" data-chapter="iletisim" className="st-section hc-chapter" aria-label="İletişim">
   <motion.div className="hc-contact" initial={reduced?false:{clipPath:'inset(12% 8% 12% 8% round 64px)'}} whileInView={{clipPath:'inset(0% 0% 0% 0% round 44px)'}} viewport={{once:true,amount:.25}} transition={{duration:1.5,ease:[.16,1,.3,1]}}>
    <div className="hc-contact-img"><Image src={asset("/assets/bym-portfolio-curated/gaziantep-villalari/villa-hero.webp")} alt="" fill sizes="100vw" quality={80}/></div>
    <div className="hc-contact-body lux-glass-dark">
     <span className="st-kicker st-kicker-light">İLETİŞİM</span>
     <h2 className="hc-contact-title"><Lines l={['Geleceği birlikte','*inşa edelim.*']} inView delay={.3}/></h2>
     <a className="hc-mail" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
     <Link href="/iletisim" className="st-btn st-btn-light">İletişime geçin<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
    </div>
   </motion.div>
  </section>
 </div>;
}
