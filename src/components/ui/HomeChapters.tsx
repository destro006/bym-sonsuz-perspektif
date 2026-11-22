'use client';
import {useEffect,useRef} from 'react';
import {U3_STARS} from '@/data/ui03';
import {ProjectCarousel} from '@/components/ui03/ProjectCarousel';
import {AboutBand,ContactBand,HeroBridge,PendingProjects,PhaseStory,useChapterScroll,useGlassTilt} from '@/components/ui03/Sections';

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

function Head({kicker,title,lead}:{kicker:string;title:React.ReactNode;lead?:string}){
 return <div className="u3-wrap u3-head"><span className="u3-kicker">{kicker}</span><h2 className="u3-h2">{title}</h2>{lead&&<p className="u3-body">{lead}</p>}</div>;
}

/**
 * Chapters after the cosmic journey (Concept 03, navy glass). One IntersectionObserver reports the
 * chapter crossing the viewport centre; the journey section itself reports "deneyim".
 */
export function HomeChapters({onActive}:{active:ChapterId;onActive:(id:ChapterId)=>void}){
 const root=useRef<HTMLDivElement>(null);
 useChapterScroll(root);
 useGlassTilt(root);
 useEffect(()=>{
  const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)onActive((e.target as HTMLElement).dataset.chapter as ChapterId);},{rootMargin:'-48% 0px -48% 0px'});
  document.querySelectorAll('[data-chapter]').forEach(el=>io.observe(el));
  return()=>io.disconnect();
 },[onActive]);
 // Show the floating nav whenever the chapters are on screen, independent of 3D frames being rendered
 // (a deep link or jump can land here without the intro scene ever drawing its final frame).
 useEffect(()=>{
  const el=document.querySelector<HTMLElement>('.u3.home-chapters');if(!el)return;
  const io=new IntersectionObserver(([e])=>{document.documentElement.dataset.u3post=e.isIntersecting?'1':'0';},{rootMargin:'0px 0px -60% 0px'});
  io.observe(el);return()=>{io.disconnect();delete document.documentElement.dataset.u3post;};
 },[]);
 return <div className="u3 home-chapters" ref={root}>
  <div className="u3-stars" aria-hidden="true" style={{backgroundImage:`url(${U3_STARS})`}}/>
  <HeroBridge/>

  <section id="bolum-fikirden-yapiya" data-chapter="fikirden-yapiya" className="u3-section" aria-label="Fikirden Yapıya">
   <Head kicker="FİKİRDEN YAPIYA" title={<>Bir fikrin<br/><em>yapıya dönüşümü.</em></>} lead="Dört aşamada, tek bir bütün: her adım bir sonrakinin zeminini hazırlar."/>
   <PhaseStory/>
  </section>

  <section id="bolum-projeler" data-chapter="projeler" className="u3-section" aria-label="Projeler">
   <div className="u3-orbit u3-sc-orbit" aria-hidden="true"/>
   <Head kicker="ÖNE ÇIKAN PROJELER" title={<>İz bırakan<br/><em>projeler.</em></>} lead="Bir projeye dokunun; yalnızca o projeye ait görsellerle galerisi açılır."/>
   <div className="u3-wrap"><ProjectCarousel/><PendingProjects/></div>
  </section>

  <section id="bolum-hakkimizda" data-chapter="hakkimizda" className="u3-section" aria-label="Hakkımızda"><AboutBand/></section>
  <section id="bolum-iletisim" data-chapter="iletisim" className="u3-section u3-last" aria-label="İletişim"><ContactBand/></section>
 </div>;
}
