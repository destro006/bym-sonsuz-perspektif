'use client';
import {asset} from '@/lib/asset';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {AnimatePresence,motion,useMotionValue,useReducedMotion,useScroll,useSpring,useTransform} from 'framer-motion';
import {Icon} from './Icon';
import {ArrowSwap} from './ArrowSwap';
import {viaSharedTransition} from '@/lib/viewTransition';

export const NAV=[
 {href:'/',label:'Deneyim',icon:'orbit'},
 {href:'/projeler',label:'Projeler',icon:'grid'},
 {href:'/hakkimizda',label:'Hakkımızda',icon:'info'},
 {href:'/hizmetler',label:'Hizmetler',icon:'layers'},
 {href:'/basinda-biz',label:'Basında Biz',icon:'news'},
 {href:'/iletisim',label:'İletişim',icon:'mail'},
];
export const isActive=(path:string,href:string)=>href==='/'?path==='/':path===href||path.startsWith(href+'/');

const EASE=[0.22,1,0.36,1] as const;

/** Top-centre metadata trio, e.g. Kategori / Konum / Görsel (reference: Location / Type / Price). */
export function StageMeta({items}:{items:{icon:string;label:string;value:ReactNode}[]}){
 return <div className="st-meta">{items.map(i=><div key={i.label} className="st-field">
  <span className="st-field-ico"><Icon name={i.icon} size={15}/></span>
  <span className="st-field-txt"><span className="st-field-label">{i.label}</span><span className="st-field-value">{i.value}</span></span>
 </div>)}</div>;
}

/** Rotating circular brand seal (pure SVG + CSS; stops for reduced motion). */
function Seal({href}:{href:string}){
 return <a href={href} className="st-seal" aria-label="Aşağı kaydır">
  <svg viewBox="0 0 120 120" className="st-seal-ring" aria-hidden="true">
   <defs><path id="st-seal-path" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs>
   <text><textPath href="#st-seal-path">BYM İNŞAAT · GÜVEN · TUTARLILIK · YAŞAM ·</textPath></text>
  </svg>
  <span className="st-seal-core"><Icon name="down" size={20}/></span>
 </a>;
}

/**
 * Shared hero "stage": a large rounded photographic container whose edges are notched by
 * cream navigation pills and cards (inverse-radius corners), with a translucent serif headline,
 * a floating glass card and a rotating brand seal.
 *
 * Motion ownership (Framer Motion only, no GSAP here): wrappers carry scroll/pointer parallax,
 * their inner elements carry the one-off entrance — never the same element and property.
 */
export function Stage({label,media,title,lead,top,left,right,below,scrollTarget='#icerik-devam'}:{
 label:string;media:ReactNode;title:ReactNode;lead?:ReactNode;top?:ReactNode;left?:ReactNode;right?:ReactNode;below?:ReactNode;scrollTarget?:string;
}){
 const path=usePathname();
 const ref=useRef<HTMLElement>(null);
 const reduced=!!useReducedMotion();
 const [menu,setMenu]=useState(false);
 const {scrollYProgress}=useScroll({target:ref,offset:['start start','end start']});
 const mediaY=useTransform(scrollYProgress,[0,1],['0%','12%']);
 const titleY=useTransform(scrollYProgress,[0,1],['0%','-55%']);
 const titleO=useTransform(scrollYProgress,[0,.55],[1,0]);
 // Pointer depth: cards drift a few px against each other (springs, transform only).
 const px=useMotionValue(0),py=useMotionValue(0);
 const sx=useSpring(px,{stiffness:60,damping:18}),sy=useSpring(py,{stiffness:60,damping:18});
 const rx=useTransform(sx,v=>v*-10),ry=useTransform(sy,v=>v*-8);
 const mx=useTransform(sx,v=>v*-14);
 useEffect(()=>{
  if(!menu)return;
  const k=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenu(false);};
  window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);
 },[menu]);
 const onMove=(e:React.PointerEvent)=>{
  if(reduced||e.pointerType!=='mouse')return;
  const r=e.currentTarget.getBoundingClientRect();
  px.set((e.clientX-r.left)/r.width*2-1);py.set((e.clientY-r.top)/r.height*2-1);
 };
 const enter=(d:number,from:{x?:number;y?:number})=>reduced?{}:{initial:{opacity:0,...from},animate:{opacity:1,x:0,y:0},transition:{duration:1,delay:d,ease:EASE}};
 // Notch bodies travel in from their stage edge with a long, soft deceleration.
 const edge=(d:number,from:{x?:string;y?:string})=>reduced?{}:{initial:from,animate:{x:'0%',y:'0%'},transition:{duration:1.5,delay:d,ease:[.16,1,.3,1] as const}};
 // Cards glide up out of depth (tilted back, slightly smaller) and settle — never a plain fade.
 const depth=(d:number)=>reduced?{}:{initial:{opacity:0,y:90,scale:.9,rotateX:14},animate:{opacity:1,y:0,scale:1,rotateX:0},transition:{duration:1.4,delay:d,ease:[.16,1,.3,1] as const},style:{transformPerspective:1400,transformOrigin:'50% 100%'}};

 return <div className="st-wrap">
  <section ref={ref} className="st-stage" data-stage aria-label={label} onPointerMove={onMove} onPointerLeave={()=>{px.set(0);py.set(0);}}>
   <motion.div className="st-media" style={reduced?undefined:{y:mediaY,x:mx}}>
    <motion.div className="st-media-reveal" {...(reduced||viaSharedTransition()?{}:{initial:{clipPath:'inset(14% 10% 14% 10% round 60px)',scale:1.18},animate:{clipPath:'inset(0% 0% 0% 0% round 0px)',scale:1.04},transition:{duration:1.9,ease:[.16,1,.3,1]}})}>{media}</motion.div>
   </motion.div>
   <div className="st-shade" aria-hidden="true"/>

   <motion.div className="st-title-wrap" style={reduced?undefined:{y:titleY,opacity:titleO}}>
    <h1 className="st-title">{title}</h1>
   </motion.div>
   {lead && <motion.div className="st-lead" {...enter(.6,{y:20})}>{lead}</motion.div>}

   {/* Frosted-glass notches: each body slides in from its own edge (transform only, so the
       backdrop blur stays live), then its content rises and a light sweep crosses the glass. */}
   <motion.div className="st-notch st-notch-tl" {...edge(.05,{y:'-115%'})}>
    <motion.div {...enter(.45,{y:-14})}><Link href="/" className="st-pill st-logo" aria-label="BYM İnşaat — Deneyime dön">
     <Image src={asset("/assets/brand/bym-logo-original.png")} alt="BYM İnşaat" width={120} height={48} priority unoptimized/>
    </Link></motion.div>
   </motion.div>
   {top && <motion.div className="st-notch st-notch-tc" {...edge(.15,{y:'-115%'})}><motion.div className="st-pill st-pill-wide st-shine" {...enter(.6,{y:-14})}>{top}</motion.div></motion.div>}
   <motion.div className="st-notch st-notch-tr" {...edge(.25,{y:'-115%'})}>
    <motion.div {...enter(.7,{y:-14})} className="st-tr-inner">
     <Link href="/iletisim" className="st-pill st-cta st-shine">Projenizi konuşalım<span className="st-cta-dot"><ArrowSwap size={14}/></span></Link>
     <button type="button" className="st-pill st-menu-btn" aria-expanded={menu} aria-controls="st-mobile-menu" onClick={()=>setMenu(m=>!m)}>
      <Icon name={menu?'close':'menu'} size={16}/>{menu?'Kapat':'Menü'}
     </button>
    </motion.div>
   </motion.div>

   <motion.nav className="st-notch st-notch-rail" aria-label="Ana menü" {...edge(.3,{x:'-115%'})}>
    <motion.div className="st-rail" {...enter(.75,{x:-14})}>
     {NAV.map((n,k)=>{const a=isActive(path,n.href);return <motion.span key={n.href} className="st-rail-item" {...enter(.85+k*.06,{x:-10})}><Link href={n.href} className={a?'st-rail-btn active':'st-rail-btn'} aria-current={a?'page':undefined} aria-label={n.label}>
      <Icon name={n.icon}/>{a && <motion.span layoutId="st-rail-dot" className="st-rail-active" transition={{type:'spring',stiffness:320,damping:30}}/>}<span className="st-tip">{n.label}</span>
     </Link></motion.span>;})}
    </motion.div>
   </motion.nav>

   {left && <motion.div className="st-notch st-notch-bl" {...edge(.55,{y:'115%'})}><motion.div className="st-card st-card-solid" {...enter(1,{y:24})}>{left}</motion.div></motion.div>}
   {right && <motion.div className="st-float" style={reduced?undefined:{x:rx,y:ry}}><motion.div className="st-card st-card-glass lux-glass" {...depth(.95)}>{right}</motion.div></motion.div>}
   <motion.div className="st-seal-wrap" {...enter(1.05,{y:30})}><Seal href={scrollTarget}/></motion.div>

   <AnimatePresence>{menu && <motion.nav id="st-mobile-menu" className="st-mobile-menu" aria-label="Mobil menü" initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.35,ease:EASE}}>
    {NAV.map(n=><Link key={n.href} href={n.href} onClick={()=>setMenu(false)} aria-current={isActive(path,n.href)?'page':undefined}><Icon name={n.icon}/>{n.label}<ArrowSwap size={14}/></Link>)}
   </motion.nav>}</AnimatePresence>
  </section>
  {below && <div className="st-below">{below}</div>}
 </div>;
}

/** Image layer for a stage. Changing `src` wipes the new photo in over the old one. */
export function StageImage({src,alt,priority,pos,vt}:{src:string;alt:string;priority?:boolean;pos?:string;vt?:string}){
 const reduced=useReducedMotion();
 const shared=viaSharedTransition();
 return <AnimatePresence initial={false}>
  <motion.div key={src} className="st-img" data-vt={vt} initial={shared?false:reduced?{opacity:0}:{clipPath:'inset(0% 0% 0% 100%)'}} animate={reduced?{opacity:1}:{clipPath:'inset(0% 0% 0% 0%)'}} exit={{zIndex:0,scale:.94,transition:{duration:1.4,ease:[.77,0,.18,1]}}} style={{zIndex:1,viewTransitionName:vt} as React.CSSProperties} transition={{duration:1.4,ease:[.77,0,.18,1]}}>
   <motion.div className="st-img-zoom" initial={reduced||shared?false:{scale:1.16}} animate={{scale:1}} transition={{duration:2.4,ease:[.16,1,.3,1]}}>
    <Image src={src} alt={alt} fill priority={priority} sizes="100vw" quality={88} style={{objectFit:'cover',objectPosition:pos??'center'}}/>
   </motion.div>
  </motion.div>
 </AnimatePresence>;
}
