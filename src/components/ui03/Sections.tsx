'use client';
import Link from 'next/link';
import {useRef} from 'react';
import {motion,useReducedMotion,useScroll,useTransform} from 'framer-motion';
import {COMPANY} from '@/data/bym-portfolio';
import {U3_HERO,U3_PENDING,U3_PROJECTS} from '@/data/ui03';
import {asset} from '@/lib/asset';

const EASE=[0.22,1,0.36,1] as const;
const go=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});

function Reveal({children,delay=0,className}:{children:React.ReactNode;delay?:number;className?:string}){
 const r=!!useReducedMotion();
 return <motion.div className={className} initial={r?false:{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.3}} transition={{duration:.9,delay,ease:EASE}}>{children}</motion.div>;
}

/** First screen after the protected intro: text on the dark cosmic side, Rüya Şehir photo on the right. */
export function HeroBridge(){
 const ref=useRef<HTMLElement>(null);
 const r=!!useReducedMotion();
 const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
 const y=useTransform(scrollYProgress,[0,1],r?['0%','0%']:['-6%','6%']);
 return <section ref={ref} className="u3-hero" aria-labelledby="u3-hero-t">
  <motion.picture className="u3-hero-img" style={{y}}>
   <source media="(max-width: 760px)" srcSet={U3_HERO.mobile}/>
   <img src={U3_HERO.desktop} alt="Rüya Şehir konut blokları, gün batımında" fetchPriority="high"/>
  </motion.picture>
  <div className="u3-hero-shade" aria-hidden="true"/>
  <div className="u3-wrap u3-hero-copy">
   <Reveal><span className="u3-kicker">BYM İNŞAAT · 2003’TEN BU YANA</span></Reveal>
   <Reveal delay={.1}><h2 id="u3-hero-t" className="u3-display">Fikirden yapıya,<br/><em>sonsuz perspektif.</em></h2></Reveal>
   <Reveal delay={.2}><p className="u3-lead">Taahhüt, danışmanlık ve yapı projelendirme alanlarında; planlamadan uygulamaya bütüncül bir yaklaşım.</p></Reveal>
   <Reveal delay={.3} className="u3-cta-row">
    <button type="button" className="u3-btn" onClick={()=>go('bolum-projeler')}>Projeleri keşfet <span aria-hidden="true">→</span></button>
    <button type="button" className="u3-btn-ghost" onClick={()=>go('bolum-fikirden-yapiya')}>Hikâyemiz</button>
   </Reveal>
  </div>
  <ul className="u3-wrap u3-features" aria-label="Çalışma alanları">
   {[['İnşaat','Anahtar teslim yapım'],['Mimari Hizmetler','Tasarım ve projelendirme'],['Peyzaj','Dış mekân düzenlemesi'],['Danışmanlık','Maliyet ve süreç yönetimi']].map(([t,d],k)=>
    <li key={t} className="u3-glass"><Icon k={k}/><span><b>{t}</b><small>{d}</small></span></li>)}
  </ul>
 </section>;
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

/** Fikir → Tasarım → Uygulama → Yaşam: mask reveals and a drawn gold line, no invented figures. */
export function PhaseStory(){
 const r=!!useReducedMotion();
 return <div className="u3-phases">
  {PHASES.map((p,k)=><article key={p.t} className={`u3-phase${k%2?' is-alt':''}`}>
   <motion.div className="u3-phase-media" initial={r?false:{clipPath:'inset(18% 12% 18% 12% round 28px)',opacity:.4}} whileInView={{clipPath:'inset(0% 0% 0% 0% round 20px)',opacity:1}} viewport={{once:true,amount:.35}} transition={{duration:1.3,ease:EASE}}>
    {p.img ? <img src={asset(p.img)} alt={p.cap} loading="lazy"/> : <PlanSketch reduced={r}/>}
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
  <ul>{U3_PENDING.map(p=><li key={p.id} className="u3-glass"><span className="u3-pending-mark" aria-hidden="true"/>{p.name}<small>Görseller hazırlanıyor</small></li>)}</ul>
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
  <ul className="u3-values">{COMPANY.values.map((v,k)=><li key={v.title} className="u3-glass"><Reveal delay={k*.08}><b>{v.title}</b><p>{v.text}</p></Reveal></li>)}</ul>
 </div>;
}

export function ContactBand(){
 const cover=U3_PROJECTS.find(p=>p.id==='villa-2020')?.cover;
 return <div className="u3-wrap">
  <div className="u3-contact u3-glass">
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
  <footer className="u3-foot">
   <span>© {new Date().getFullYear()} BYM İnşaat</span>
   <span>Görseller arşiv kaynaklıdır; yayın onayı beklemektedir.</span>
  </footer>
 </div>;
}
