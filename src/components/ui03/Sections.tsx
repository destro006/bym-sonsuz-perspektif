'use client';
import Link from 'next/link';
import {useEffect,useRef} from 'react';
import {motion,useMotionValue,useReducedMotion,useSpring,useTransform,type Variants} from 'framer-motion';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {COMPANY} from '@/data/bym-portfolio';
import {U3_HERO,U3_PENDING,U3_PROJECTS} from '@/data/ui03';
import {asset} from '@/lib/asset';

if(typeof window!=='undefined')gsap.registerPlugin(ScrollTrigger);
const EASE=[0.22,1,0.36,1] as const;
const go=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
const noMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
 * Controller split (no shared properties):
 *  - GSAP ScrollTrigger (scrub): `.u3-sc-*` wrappers only — scroll-linked parallax and progress lines.
 *  - Framer Motion: reveal variants, pointer parallax and everything interactive, on inner/other elements.
 *  - CSS variables (pointer): glass tilt via `.u3-tilt`.
 */
function Reveal({children,delay=0,className}:{children:React.ReactNode;delay?:number;className?:string}){
 const r=!!useReducedMotion();
 return <motion.div className={className} initial={r?false:{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.3}} transition={{duration:.9,delay,ease:EASE}}>{children}</motion.div>;
}

/** Interactive frosted glass: pointer sets --rx/--ry (tilt, ≤4°) and --gx/--gy (highlight). Fine pointers only. */
export function useGlassTilt(root:React.RefObject<HTMLElement|null>){
 useEffect(()=>{
  const el=root.current;if(!el||noMotion()||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  let cur:HTMLElement|null=null;
  const reset=(t:HTMLElement)=>{t.style.setProperty('--rx','0deg');t.style.setProperty('--ry','0deg');t.classList.remove('is-lit');};
  const move=(e:PointerEvent)=>{
   const t=(e.target as HTMLElement).closest<HTMLElement>('.u3-tilt');
   if(cur&&cur!==t)reset(cur);cur=t;if(!t)return;
   const r=t.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
   const k=Math.min(1,320/Math.max(r.width,r.height)); // large panels tilt less
   t.style.setProperty('--ry',`${((x-.5)*8*k).toFixed(2)}deg`);t.style.setProperty('--rx',`${((.5-y)*6*k).toFixed(2)}deg`);
   t.style.setProperty('--gx',`${(x*100).toFixed(1)}%`);t.style.setProperty('--gy',`${(y*100).toFixed(1)}%`);t.classList.add('is-lit');
  };
  const leave=()=>{if(cur)reset(cur);cur=null;};
  el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);
  return()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);};
 },[root]);
}

/** Scroll-linked parallax / progress for the chapters, one gsap.context, reverted on unmount. */
export function useChapterScroll(root:React.RefObject<HTMLElement|null>){
 useEffect(()=>{
  const el=root.current;if(!el||noMotion())return;
  const ctx=gsap.context(()=>{
   if(el.querySelector('.u3-sc-hero'))gsap.fromTo('.u3-sc-hero',{yPercent:-6},{yPercent:14,ease:'none',scrollTrigger:{trigger:'.u3-vitrin',start:'top bottom',end:'bottom top',scrub:.6}});
   gsap.utils.toArray<HTMLElement>('.u3-sc-ph').forEach(ph=>gsap.fromTo(ph,{yPercent:-7},{yPercent:7,ease:'none',scrollTrigger:{trigger:ph.closest('.u3-phase'),start:'top bottom',end:'bottom top',scrub:.6}}));
   gsap.fromTo('.u3-sc-rail',{scaleY:0},{scaleY:1,ease:'none',scrollTrigger:{trigger:'.u3-phases',start:'top 65%',end:'bottom 65%',scrub:.4}});
   if(el.querySelector('.u3-sc-orbit'))gsap.fromTo('.u3-sc-orbit',{rotate:-8,yPercent:10},{rotate:8,yPercent:-10,ease:'none',scrollTrigger:{trigger:'#bolum-projeler',start:'top bottom',end:'bottom top',scrub:.8}});
  },el);
  // Content heights settle after images decode; keep trigger positions honest.
  const id=requestAnimationFrame(()=>ScrollTrigger.refresh());
  return()=>{cancelAnimationFrame(id);ctx.revert();};
 },[root]);
}

const heroSeq:Variants={hidden:{},show:{transition:{staggerChildren:.12,delayChildren:.15}}};
const rise:Variants={hidden:{opacity:0,y:26},show:{opacity:1,y:0,transition:{duration:1,ease:EASE}}};
const line:Variants={hidden:{y:'110%'},show:{y:'0%',transition:{duration:1.1,ease:EASE}}};

/** Architectural reveal right after the (untouched) cosmic intro: masked title lines, ambient light, photo depth. */
export function HeroBridge(){
 const r=!!useReducedMotion();
 const mx=useMotionValue(0),my=useMotionValue(0);
 const sx=useSpring(mx,{stiffness:50,damping:18}),sy=useSpring(my,{stiffness:50,damping:18});
 const imgX=useTransform(sx,v=>`${v*-1.4}%`),imgY=useTransform(sy,v=>`${v*-1}%`);
 const glowX=useTransform(sx,v=>`${50+v*18}%`),glowY=useTransform(sy,v=>`${40+v*14}%`);
 const glow=useTransform([glowX,glowY],([x,y])=>`radial-gradient(42% 52% at ${x} ${y},rgba(231,187,167,.16),rgba(8,13,30,0) 70%)`);
 return <motion.section className="u3-hero" aria-labelledby="u3-hero-t" initial={r?'show':'hidden'} whileInView="show" viewport={{once:true,amount:.25}}
  onPointerMove={e=>{if(r||e.pointerType!=='mouse')return;mx.set(e.clientX/innerWidth*2-1);my.set(e.clientY/innerHeight*2-1);}}
  onPointerLeave={()=>{mx.set(0);my.set(0);}}>
  <div className="u3-hero-img u3-sc-hero">
   <motion.picture className="u3-hero-pic" style={{x:imgX,y:imgY}}
    variants={{hidden:{opacity:0,scale:1.12,clipPath:'inset(8% 0% 8% 30% round 28px)'},show:{opacity:1,scale:1.04,clipPath:'inset(0% 0% 0% 0% round 0px)',transition:{duration:1.8,ease:EASE}}}}>
    <source media="(max-width: 760px)" srcSet={U3_HERO.mobile}/>
    <img src={U3_HERO.desktop} alt="Rüya Şehir konut blokları, gün batımında" fetchPriority="high"/>
   </motion.picture>
  </div>
  <div className="u3-hero-shade" aria-hidden="true"/>
  <motion.div className="u3-hero-glow" aria-hidden="true" style={{background:glow}}/>
  <motion.div className="u3-wrap u3-hero-copy" variants={heroSeq}>
   <motion.span className="u3-kicker" variants={rise}>BYM İNŞAAT · 2003’TEN BU YANA</motion.span>
   <h2 id="u3-hero-t" className="u3-display">
    <span className="u3-line"><motion.span variants={line}>Fikirden yapıya,</motion.span></span>
    <span className="u3-line"><motion.span variants={line}><em>sonsuz perspektif.</em></motion.span></span>
   </h2>
   <motion.p className="u3-lead" variants={rise}>Taahhüt, danışmanlık ve yapı projelendirme alanlarında; planlamadan uygulamaya bütüncül bir yaklaşım.</motion.p>
   <motion.div className="u3-cta-row" variants={rise}>
    <button type="button" className="u3-btn" onClick={()=>go('bolum-projeler')}>Projeleri keşfet <span aria-hidden="true">→</span></button>
    <button type="button" className="u3-btn-ghost" onClick={()=>go('bolum-fikirden-yapiya')}>Hikâyemiz</button>
   </motion.div>
  </motion.div>
  <motion.ul className="u3-wrap u3-features" aria-label="Çalışma alanları" variants={heroSeq}>
   {[['İnşaat','Anahtar teslim yapım'],['Mimari Hizmetler','Tasarım ve projelendirme'],['Peyzaj','Dış mekân düzenlemesi'],['Danışmanlık','Maliyet ve süreç yönetimi']].map(([t,d],k)=>
    <motion.li key={t} variants={rise}><div className="u3-glass u3-tilt"><Icon k={k}/><span><b>{t}</b><small>{d}</small></span></div></motion.li>)}
  </motion.ul>
 </motion.section>;
}

function Icon({k}:{k:number}){
 const p=['M4 20V9l8-5 8 5v11M9 20v-6h6v6','M4 20 20 4M6 4h14v14M4 9v11h11','M12 20v-8M12 12c-4 0-6-3-6-7 4 0 6 3 6 7Zm0 0c4 0 6-3 6-7-4 0-6 3-6 7Z','M4 18h16M7 14l3-4 3 2 4-6'][k];
 return <svg className="u3-ico" viewBox="0 0 24 24" aria-hidden="true"><path d={p}/></svg>;
}

const PHASES=[
 {t:'Fikir',d:'Arazi, ihtiyaç ve kullanım amacı birlikte okunur; projenin çerçevesi çizilir.',img:null,cap:''},
 {t:'Tasarım',d:'Kavramsal tasarım, iç mekân ve yapı projelendirme tek bir bütün olarak ele alınır.',img:'/assets/bym-ui03/projects/villa-2020/gallery-05.webp',cap:'Villa 2020 · tasarım görselleştirmesi'},
 {t:'Uygulama',d:'Planlamadan şantiyeye disiplinli, sürdürülebilir bir yapım süreci yürütülür.',img:'/assets/bym-ui03/projects/villa-2020/gallery-06.webp',cap:'Villa 2020 · yapım aşaması'},
 {t:'Yaşam',d:'İnsanı, estetiği ve çevresini birlikte gözeten mekânlar teslim edilir.',img:'/assets/bym-ui03/projects/ruya-sehir/gallery-01.webp',cap:'Rüya Şehir · yerleşke'},
];

/** Brand storytelling: Fikir → Tasarım → Uygulama → Yaşam. Mask reveals (Framer), scroll parallax + progress rail (GSAP). */
export function PhaseStory(){
 const r=!!useReducedMotion();
 return <div className="u3-phases">
  <span className="u3-rail" aria-hidden="true"><span className="u3-sc-rail"/></span>
  {PHASES.map((p,k)=><article key={p.t} className={`u3-phase${k%2?' is-alt':''}`}>
   <motion.div className="u3-phase-media" initial={r?false:{clipPath:'inset(18% 12% 18% 12% round 28px)',opacity:.4}} whileInView={{clipPath:'inset(0% 0% 0% 0% round 20px)',opacity:1}} viewport={{once:true,amount:.35}} transition={{duration:1.3,ease:EASE}}>
    <div className="u3-sc-ph">{p.img ? <img src={asset(p.img)} alt={p.cap} loading="lazy"/> : <PlanSketch reduced={r}/>}</div>
    {p.cap && <span className="u3-phase-cap">{p.cap}</span>}
   </motion.div>
   <div className="u3-phase-copy">
    <motion.span className="u3-phase-line" aria-hidden="true" initial={r?false:{scaleX:0}} whileInView={{scaleX:1}} viewport={{once:true,amount:.6}} transition={{duration:1.1,ease:EASE}}/>
    <Reveal><span className="u3-step">{String(k+1).padStart(2,'0')} / 04</span><h3 className="u3-h3">{p.t}</h3><p className="u3-body">{p.d}</p></Reveal>
   </div>
  </article>)}
 </div>;
}

/** Abstract line drawing for the "idea" stage — not a plan of any real building. */
function PlanSketch({reduced}:{reduced:boolean}){
 const d=['M40 260 H360 V60 H40 Z','M40 160 H200 V260','M200 60 V160 H360','M120 160 V60','M280 160 V260','M200 210 h40','M60 290 H340','M20 60 V260'];
 return <svg className="u3-sketch" viewBox="0 0 400 320" role="img" aria-label="Soyut çizgi eskiz">
  {d.map((p,i)=><motion.path key={i} d={p} initial={reduced?false:{pathLength:0}} whileInView={{pathLength:1}} viewport={{once:true}} transition={{duration:1.6,delay:i*.12,ease:EASE}}/>)}
 </svg>;
}

export function PendingProjects(){
 return <div className="u3-pending">
  <p className="u3-small">Görsel arşivi doğrulanmayı bekleyen projeler</p>
  <ul>{U3_PENDING.map(p=><li key={p.id} className="u3-glass u3-tilt"><span className="u3-pending-mark" aria-hidden="true"/>{p.name}<small>Görseller hazırlanıyor</small></li>)}</ul>
 </div>;
}

export function AboutBand(){
 return <div className="u3-wrap u3-about">
  <Reveal className="u3-about-copy">
   <span className="u3-kicker">HAKKIMIZDA</span>
   <h2 className="u3-h2">Güven, tutarlılıkla<br/><em>inşa edilir.</em></h2>
   <p className="u3-body">{COMPANY.about}</p>
   <Link href="/hakkimizda" className="u3-btn-ghost">Hikâyemiz <span aria-hidden="true">→</span></Link>
  </Reveal>
  <ul className="u3-values">{COMPANY.values.map((v,k)=><li key={v.title}><Reveal delay={k*.08}><div className="u3-glass u3-tilt"><b>{v.title}</b><p>{v.text}</p></div></Reveal></li>)}</ul>
 </div>;
}

export function ContactBand(){
 const cover=U3_PROJECTS.find(p=>p.id==='villa-2020')?.cover;
 return <div className="u3-wrap">
  <Reveal>
   <div className="u3-contact u3-glass u3-tilt">
    {cover && <img className="u3-contact-img" src={cover} alt="" loading="lazy"/>}
    <div className="u3-contact-body">
     <span className="u3-kicker">İLETİŞİM</span>
     <h2 className="u3-h2">Geleceği birlikte<br/><em>inşa edelim.</em></h2>
     <a className="u3-mail" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
     <div className="u3-cta-row">
      <Link href="/iletisim" className="u3-btn">İletişime geçin <span aria-hidden="true">→</span></Link>
      <a className="u3-btn-ghost" href={COMPANY.originalWebsite} target="_blank" rel="noreferrer">byminsaat.com.tr ↗</a>
     </div>
    </div>
   </div>
  </Reveal>
  <footer className="u3-foot">
   <span>© {new Date().getFullYear()} BYM İnşaat</span>
   <span>Görseller arşiv kaynaklıdır; yayın onayı beklemektedir.</span>
  </footer>
 </div>;
}
