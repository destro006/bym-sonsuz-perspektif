'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useEffect,useMemo,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {BYM_CATEGORIES,BYM_PROJECTS,type BYMProject} from '@/data/bym-portfolio';
import {Stage,StageImage} from './Stage';
import {Icon} from './Icon';
import {Lines} from './Lines';
import {ProjectTile} from './ProjectTile';
import {ArrowSwap} from './ArrowSwap';

const EASE=[0.22,1,0.36,1] as const;
const AUTOPLAY_MS=7000;
const pad=(n:number)=>String(n).padStart(2,'0');

function Select({icon,label,value,onChange,options}:{icon:string;label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){
 return <label className="st-field st-field-select">
  <span className="st-field-ico"><Icon name={icon} size={15}/></span>
  <span className="st-field-txt"><span className="st-field-label">{label}</span>
  <span className="st-select"><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><Icon name="chevron" size={14}/></span></span>
 </label>;
}

/** Projects page: a project-switching stage (selectors share state with the portfolio grid). */
export function ProjectsExperience(){
 const reduced=!!useReducedMotion();
 const [cat,setCat]=useState<string>('Tümü');
 const list=useMemo(()=>BYM_PROJECTS.filter(p=>cat==='Tümü'||p.category===cat),[cat]);
 const [idx,setIdx]=useState(0);
 const [paused,setPaused]=useState(false);
 const p:BYMProject=list[Math.min(idx,list.length-1)];
 const step=(d:number)=>setIdx(i=>(i+d+list.length)%list.length);
 useEffect(()=>{setIdx(0);},[cat]);
 useEffect(()=>{
  if(reduced||paused||list.length<2)return;
  const t=setTimeout(()=>step(1),AUTOPLAY_MS);
  return()=>clearTimeout(t);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[idx,paused,reduced,list.length]);
 const locations=[...new Set(list.map(x=>x.location))];

 const selectors=<div className="st-meta">
  <Select icon="grid" label="Kategori" value={cat} onChange={setCat} options={BYM_CATEGORIES.map(c=>({value:c,label:c}))}/>
  <Select icon="pin" label="Konum" value={p.location} onChange={v=>setIdx(list.findIndex(x=>x.location===v))} options={locations.map(l=>({value:l,label:l}))}/>
  <Select icon="building" label="Proje" value={p.slug} onChange={v=>setIdx(list.findIndex(x=>x.slug===v))} options={list.map(x=>({value:x.slug,label:x.name}))}/>
 </div>;

 const swap={initial:{opacity:0,y:14},animate:{opacity:1,y:0},exit:{opacity:0,y:-10},transition:{duration:.55,ease:EASE}};

 return <div onPointerEnter={()=>setPaused(true)} onPointerLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
  <Stage label="Öne çıkan BYM projeleri"
   media={<StageImage src={p.hero} alt={p.images[0].alt} pos={p.heroPos} priority/>}
   title={<Lines l={['Yaşama değer','katan yapılar']}/>}
   lead={<p>Konuttan villaya, sosyal mekândan iç mimariye; BYM İnşaat'ın yaşamı merkeze alan projelerini keşfedin.</p>}
   top={selectors}
   below={selectors}
   scrollTarget="#portfoy"
   left={<>
    <h2 className="st-card-title">Portföyü keşfedin</h2>
    <p className="st-card-text">Her proje; bağlamı, malzemesi ve yaşam kurgusuyla kendi hikâyesini anlatır.</p>
    <div className="st-card-row">
     <div className="st-count"><strong>{pad(BYM_PROJECTS.length)}</strong><span>Proje</span></div>
     <div className="st-avatars" aria-hidden="true">{BYM_PROJECTS.slice(0,3).map(x=><span key={x.slug}><Image src={x.hero} alt="" fill sizes="44px"/></span>)}</div>
     <a href="#portfoy" className="st-round" aria-label="Portföye in"><ArrowSwap size={16}/></a>
    </div>
   </>}
   right={<AnimatePresence mode="wait" initial={false}><motion.div key={p.slug} {...swap}>
    <div className="st-card-head">
     <div><h2 className="st-card-title">{p.name}</h2><p className="st-card-loc"><Icon name="pin" size={13}/>{p.location}</p></div>
     <Link href={`/projeler/${p.slug}`} className="st-round st-round-light" aria-label={`${p.name} projesini incele`}><ArrowSwap size={16}/></Link>
    </div>
    <p className="st-card-text">{p.intro} {p.description.split('. ')[0]}.</p>
    <ul className="st-specs">
     <li><Icon name="building" size={14}/>{p.category}</li>
     <li><Icon name="image" size={14}/>{p.images.length} görsel</li>
     <li><Icon name="spark" size={14}/>{p.kicker}</li>
    </ul>
    <div className="st-thumbs" aria-hidden="true">{p.images.slice(0,4).map((im,k)=><span key={im.src} style={{zIndex:4-k}}><Image src={im.src} alt="" fill sizes="64px" style={{objectPosition:im.pos??"center"}}/></span>)}<em>{p.images.length} görünüm</em></div>
    <div className="st-card-foot">
     <button type="button" className="st-icon-btn" onClick={()=>step(-1)} aria-label="Önceki proje"><Icon name="prev" size={16}/></button>
     <span className="st-counter" aria-live="polite">{pad(idx+1)} / {pad(list.length)}</span>
     <span className="st-progress" aria-hidden="true"><motion.i key={`${p.slug}-${paused}`} initial={{scaleX:0}} animate={{scaleX:paused||reduced?0:1}} transition={{duration:AUTOPLAY_MS/1000,ease:'linear'}}/></span>
     <button type="button" className="st-icon-btn" onClick={()=>step(1)} aria-label="Sonraki proje"><Icon name="next" size={16}/></button>
    </div>
   </motion.div></AnimatePresence>}
  />

  <section id="portfoy" className="st-section" aria-labelledby="portfoy-baslik">
   <div className="st-section-head">
    <div><span className="st-kicker">02 / PORTFÖY</span><h2 id="portfoy-baslik" className="st-h2">İz bırakan <em>projeler.</em></h2></div>
    <div className="st-chips" role="group" aria-label="Proje kategorisi">{BYM_CATEGORIES.map(c=><button key={c} type="button" aria-pressed={cat===c} className={cat===c?'active':undefined} onClick={()=>setCat(c)}>{c}{cat===c && <motion.span layoutId="st-chip" className="st-chip-bg" transition={{type:'spring',stiffness:380,damping:32}}/>}</button>)}</div>
   </div>
   <motion.div layout={!reduced} className="st-tiles">
    <AnimatePresence mode="popLayout">{list.map((x,i)=><ProjectTile key={x.slug} project={x} index={i} reduced={reduced}/>)}</AnimatePresence>
   </motion.div>
  </section>
 </div>;
}
