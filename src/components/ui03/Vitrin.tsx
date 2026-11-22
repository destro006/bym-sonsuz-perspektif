'use client';
import Link from 'next/link';
import {motion,useMotionValue,useReducedMotion,useSpring,useTransform,type Variants} from 'framer-motion';
import {COMPANY} from '@/data/bym-portfolio';
import {U3_HERO,U3_PROJECTS} from '@/data/ui03';
import {asset} from '@/lib/asset';
import {ProjectCarousel} from './ProjectCarousel';

const EASE=[0.22,1,0.36,1] as const;
const go=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
const seq:Variants={hidden:{},show:{transition:{staggerChildren:.11,delayChildren:.1}}};
const rise:Variants={hidden:{opacity:0,y:24},show:{opacity:1,y:0,transition:{duration:1,ease:EASE}}};
const line:Variants={hidden:{y:'110%'},show:{y:'0%',transition:{duration:1.1,ease:EASE}}};

const FEATURES=[
 {t:'Sınırsız Vizyon',d:'Geleceği bugünden tasarlarız.',i:'M6 12c0-2 1.6-3.5 3.4-3.5 3.2 0 4 7 7.2 7 1.8 0 3.4-1.5 3.4-3.5S18.4 8.5 16.6 8.5c-3.2 0-4 7-7.2 7C7.6 15.5 6 14 6 12Z'},
 {t:'Bütüncül Tasarım',d:'Mimari, mühendislik ve yaşam bir bütün.',i:'M12 4 3 8.5l9 4.5 9-4.5L12 4ZM3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5'},
 {t:'Sürdürülebilir Yapılar',d:'Çevreye duyarlı, kalıcı çözümler.',i:'M5 19c0-8 5-13 14-14-1 9-6 14-14 14Zm0 0 8-8'},
 {t:'Güven ve Kalite',d:'Her yapıda uzun yıllar süren değer.',i:'M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4'},
];

/**
 * Concept 03 showcase — the approved reference composition, built with authentic BYM media:
 * header + glass nav, cosmic sky with Earth limb, Rüya Şehir photograph, feature strip,
 * "Öne Çıkan Projeler" with the spatial glass carousel on a lit platform, and the Hakkımızda band.
 */
export function Vitrin(){
 const r=!!useReducedMotion();
 const mx=useMotionValue(0),my=useMotionValue(0);
 const sx=useSpring(mx,{stiffness:45,damping:18}),sy=useSpring(my,{stiffness:45,damping:18});
 const photoX=useTransform(sx,v=>v*-14),photoY=useTransform(sy,v=>v*-8);
 const skyX=useTransform(sx,v=>v*6),skyY=useTransform(sy,v=>v*4);
 const earthX=useTransform(sx,v=>v*10);
 const side=U3_PROJECTS.find(p=>p.id==='burak-manzara-evleri')?.cover;
 return <div className="u3-vitrin" onPointerMove={e=>{if(r||e.pointerType!=='mouse')return;mx.set(e.clientX/innerWidth*2-1);my.set(e.clientY/innerHeight*2-1);}} onPointerLeave={()=>{mx.set(0);my.set(0);}}>
  {/* ---- sky ---- */}
  <div className="u3-v-sky" aria-hidden="true">
   <motion.div className="u3-v-milky" style={{x:skyX,y:skyY}}/>
   <motion.div className="u3-v-earth" style={{x:earthX}}><div className="u3-sc-hero"><span style={{backgroundImage:`url(${asset('/assets/earth/nasa-blue-marble-2048.jpg')})`}}/></div></motion.div>
  </div>
  <motion.picture className="u3-v-photo" style={{x:photoX,y:photoY}} initial={r?false:{opacity:0,scale:1.08}} whileInView={{opacity:1,scale:1}} viewport={{once:true,amount:.2}} transition={{duration:1.8,ease:EASE}}>
   <source media="(max-width: 760px)" srcSet={U3_HERO.mobile}/>
   <img src={U3_HERO.desktop} alt="Rüya Şehir konut blokları, gün batımında" fetchPriority="high"/>
  </motion.picture>
  {side && <img className="u3-v-corner" src={side} alt="" loading="lazy"/>}
  <Arcs/>

  {/* ---- header ---- */}
  <header className="u3-v-head u3-wrap">
   <span className="u3-v-brand">
    <img src={asset('/assets/brand/bym-logo-original.png')} alt="BYM İnşaat" width={2048} height={826}/>
    <small>SONSUZ PERSPEKTİF</small>
   </span>
   <button type="button" className="u3-v-pill" onClick={()=>go('bolum-iletisim')}>Proje Görüşmesi</button>
  </header>

  {/* ---- hero ---- */}
  <motion.section className="u3-wrap u3-v-hero" aria-labelledby="u3-v-title" variants={seq} initial={r?'show':'hidden'} whileInView="show" viewport={{once:true,amount:.3}}>
   <motion.span className="u3-v-kicker" variants={rise}>MİMARİ <i>·</i> MÜHENDİSLİK <i>·</i> YAPI <i>·</i> YAŞAM</motion.span>
   <h2 id="u3-v-title" className="u3-v-title">
    <span className="u3-line"><motion.span variants={line}>BYM İnşaat</motion.span></span>
    <span className="u3-line"><motion.span variants={line}><em>Sonsuz Perspektif</em></motion.span></span>
   </h2>
   <motion.p className="u3-v-lead" variants={rise}>Fikirden yapıya uzanan yolculukta, mimariyi, mühendisliği ve yaşamı daha ileriye taşıyoruz.</motion.p>
   <motion.div className="u3-v-ctas" variants={rise}>
    <button type="button" className="u3-btn u3-v-cta" onClick={()=>go('bolum-fikirden-yapiya')}>Fikirden Yapıya <span aria-hidden="true">→</span></button>
    <button type="button" className="u3-v-play" onClick={()=>go('bolum-projeler')}><span className="u3-v-play-ring" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 6v12m0 0-5-5m5 5 5-5"/></svg></span>Projeleri Keşfet</button>
   </motion.div>
  </motion.section>

  <motion.ul className="u3-wrap u3-v-feats" aria-label="Yaklaşımımız" variants={seq} initial={r?'show':'hidden'} whileInView="show" viewport={{once:true,amount:.5}}>
   {FEATURES.map(f=><motion.li key={f.t} variants={rise}>
    <svg className="u3-v-ico" viewBox="0 0 24 24" aria-hidden="true"><path d={f.i}/></svg>
    <span><b>{f.t}</b><small>{f.d}</small></span>
   </motion.li>)}
  </motion.ul>

  {/* ---- projects ---- */}
  <section id="bolum-projeler" data-chapter="projeler" className="u3-v-projects" aria-labelledby="u3-v-proj">
   <div className="u3-v-projtext">
    <span className="u3-v-rule" aria-hidden="true"/>
    <h2 id="u3-v-proj">Öne Çıkan Projeler</h2>
    <p>Yaşamın farklı ölçeklerinde, kalıcı değer üreten projelerimizi keşfedin.</p>
    <Link href="/projeler" className="u3-v-link">Tüm Projeleri Gör <span aria-hidden="true">→</span></Link>
   </div>
   <ProjectCarousel/>
  </section>

  {/* ---- about band ---- */}
  <section id="bolum-hakkimizda" data-chapter="hakkimizda" className="u3-wrap u3-v-about" aria-labelledby="u3-v-about">
   <div className="u3-v-about-t">
    <span>Hakkımızda</span>
    <h2 id="u3-v-about">Daha Yaşanabilir<br/>Yarınlar <em>İnşa Ediyoruz</em></h2>
   </div>
   <p>{COMPANY.about}</p>
   <Link href="/hakkimizda" className="u3-btn u3-v-cta">BYM İnşaat’ı Tanıyın <span aria-hidden="true">→</span></Link>
  </section>
 </div>;
}

/** Rose-gold light trails (decorative SVG, drawn once on reveal). */
function Arcs(){
 const r=!!useReducedMotion();
 const paths=[
  'M-40 860 C 300 720, 700 780, 1000 800 S 1400 770, 1660 640',
  'M720 380 C 920 270, 1160 190, 1660 80',
  'M-60 1570 C 400 1630, 900 1620, 1660 1540',
 ];
 return <svg className="u3-v-arcs" viewBox="0 0 1600 1600" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="u3arc" x1="0" x2="1"><stop offset="0" stopColor="#D7A68F" stopOpacity="0"/><stop offset=".45" stopColor="#F3CDBB" stopOpacity=".95"/><stop offset="1" stopColor="#D7A68F" stopOpacity="0"/></linearGradient></defs>
  {paths.map((d,i)=><motion.path key={i} d={d} fill="none" stroke="url(#u3arc)" strokeWidth={i===1?1.2:1.8} vectorEffect="non-scaling-stroke"
   initial={r?false:{pathLength:0,opacity:0}} whileInView={{pathLength:1,opacity:1}} viewport={{once:true}} transition={{duration:2.4,delay:.3+i*.25,ease:EASE}}/>)}
 </svg>;
}
