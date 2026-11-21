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
 {id:'projeler',label:'Projeler',href:'/projeler'},
 {id:'hakkimizda',label:'Hakkımızda',href:'/hakkimizda'},
 {id:'hizmetler',label:'Hizmetler',href:'/hizmetler'},
 {id:'basinda-biz',label:'Basında Biz',href:'/basinda-biz'},
 {id:'iletisim',label:'İletişim',href:'/iletisim'},
] as const;
export type ChapterId=(typeof HOME_CHAPTERS)[number]['id'];

export function scrollToChapter(id:ChapterId,reduced:boolean){
 if(id==='deneyim'){window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});return;}
 document.getElementById(`bolum-${id}`)?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
}

function Head({n,kicker,lines,href,cta}:{n:string;kicker:string;lines:string[];href:string;cta:string}){
 return <div className="st-section-head hc-head">
  <div><Rise><span className="st-kicker">{n} / {kicker}</span></Rise><h2 className="st-h2"><Lines l={lines} inView delay={.1}/></h2></div>
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
 const [compact,setCompact]=useState(false);
 useEffect(()=>{
  const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)onActive((e.target as HTMLElement).dataset.chapter as ChapterId);},{rootMargin:'-48% 0px -48% 0px'});
  document.querySelectorAll('[data-chapter]').forEach(el=>io.observe(el));
  const journey=document.querySelector('.scroll-journey');
  const jo=new IntersectionObserver(([e])=>setCompact(!e.isIntersecting));
  if(journey)jo.observe(journey);
  return()=>{io.disconnect();jo.disconnect();};
 },[onActive]);
 const projects=BYM_PROJECTS.slice(0,4);
 return <div className="st-site home-chapters">
  <AnimatePresence>{compact && <motion.header className="st-compact" initial={{opacity:0,y:-30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-30}} transition={{duration:.6,ease:[.16,1,.3,1]}}>
   <a href="#" className="st-compact-logo" aria-label="BYM İnşaat — başa dön" onClick={e=>{e.preventDefault();scrollToChapter('deneyim',reduced);}}><Image src={asset("/assets/brand/bym-logo-original.png")} alt="BYM İnşaat" width={96} height={39} unoptimized/></a>
   <GlideNav label="Bölümler" items={HOME_CHAPTERS.slice(1).map(c=>({key:c.id,href:`#bolum-${c.id}`,label:c.label,active:active===c.id,current:'location',route:false,onClick:e=>{e.preventDefault();scrollToChapter(c.id,reduced);}}))}/>
   <Link href="/iletisim" className="st-compact-cta" aria-label="İletişim sayfası"><ArrowSwap size={14}/></Link>
  </motion.header>}</AnimatePresence>

  <section id="bolum-projeler" data-chapter="projeler" className="st-section hc-chapter" aria-label="Projeler">
   <Head n="02" kicker="PROJELER" lines={['İz bırakan','*projeler.*']} href="/projeler" cta="Tüm projeler"/>
   <div className="st-tiles hc-tiles">{projects.map((p,i)=><ProjectTile key={p.slug} project={p} index={i} reduced={reduced}/>)}</div>
  </section>

  <section id="bolum-hakkimizda" data-chapter="hakkimizda" className="hc-chapter" aria-label="Hakkımızda">
   <LayeredFeature src={asset("/assets/bym-portfolio-curated/ruya-sehir/ruya-hero.webp")} alt="Rüya Şehir konut bloklarının cephesi" tall>
    <span className="st-kicker">03 / HAKKIMIZDA</span>
    <h2 className="st-h3"><Lines l={['Güven, tutarlılıkla','*inşa edilir.*']} inView delay={.2}/></h2>
    <p className="st-card-text">{COMPANY.about}</p>
    <ul className="st-list">{COMPANY.values.map((v,i)=><li key={v.title}><span>0{i+1}</span>{v.title}</li>)}</ul>
    <Link href="/hakkimizda" className="st-btn">Hikâyemiz<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
   </LayeredFeature>
  </section>

  <ServiceJourney id="bolum-hizmetler" chapter="hizmetler" kicker="04 / HİZMETLER"/>

  <section id="bolum-basinda-biz" data-chapter="basinda-biz" className="hc-chapter" aria-label="Basında Biz">
   <LayeredFeature src={asset("/assets/bym-portfolio-curated/ruya-sehir/ruya-entrance.webp")} alt="Rüya Şehir tanıtım ofisi girişi ve isim tabelası" side="right">
    <span className="st-kicker">05 / BASINDA BİZ</span>
    <h2 className="st-h3"><Lines l={['Bir yapının','*ardındaki hikâye.*']} inView delay={.2}/></h2>
    <ul className="st-list">{PRESS.map((a,i)=><li key={a.href}><a href={a.href} target="_blank" rel="noreferrer"><span>0{i+1}</span><strong className="hc-press">{a.title}</strong><ArrowSwap size={14}/></a></li>)}</ul>
    <Link href="/basinda-biz" className="st-btn">Haber arşivi<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
   </LayeredFeature>
  </section>

  <section id="bolum-iletisim" data-chapter="iletisim" className="st-section hc-chapter" aria-label="İletişim">
   <motion.div className="hc-contact" initial={reduced?false:{clipPath:'inset(12% 8% 12% 8% round 64px)'}} whileInView={{clipPath:'inset(0% 0% 0% 0% round 44px)'}} viewport={{once:true,amount:.25}} transition={{duration:1.5,ease:[.16,1,.3,1]}}>
    <div className="hc-contact-img"><Image src={asset("/assets/bym-portfolio-curated/gaziantep-villalari/villa-hero.webp")} alt="" fill sizes="100vw" quality={80}/></div>
    <div className="hc-contact-body lux-glass-dark">
     <span className="st-kicker st-kicker-light">06 / İLETİŞİM</span>
     <h2 className="hc-contact-title"><Lines l={['Geleceği birlikte','*inşa edelim.*']} inView delay={.3}/></h2>
     <a className="hc-mail" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
     <Link href="/iletisim" className="st-btn st-btn-light">İletişime geçin<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
    </div>
   </motion.div>
  </section>
 </div>;
}
