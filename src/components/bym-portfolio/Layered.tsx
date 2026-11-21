'use client';
import Image from 'next/image';
import {useEffect,useRef,type ReactNode} from 'react';
import {motion,useReducedMotion,useScroll} from 'framer-motion';
import {BuildingWrap} from './BuildingWrap';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const EASE=[0.16,1,0.3,1] as const;

/** Scroll-entrance wrapper: glide up out of depth (Framer Motion, transform/opacity only). */
export function Rise({children,className,delay=0,as='div'}:{children:ReactNode;className?:string;delay?:number;as?:'div'|'article'|'li'}){
 const reduced=useReducedMotion();
 const M=as==='article'?motion.article:as==='li'?motion.li:motion.div;
 return <M className={className} initial={reduced?false:{opacity:0,y:70,rotateX:10}} whileInView={{opacity:1,y:0,rotateX:0}} viewport={{once:true,amount:.18}} transition={{duration:1.25,delay,ease:EASE}} style={{transformPerspective:1400,transformOrigin:'50% 100%'}}>{children}</M>;
}

/**
 * Secondary stage: large rounded photo with a floating frosted-glass card.
 * Motion split: Framer Motion owns the one-off mask reveal (frame) and card entrance (card);
 * GSAP ScrollTrigger scrubs the photo zoom (inner layer) and card drift (card wrapper) — each
 * library writes to a different element, so they never fight over a transform.
 */
export function LayeredFeature({src,alt,children,side='left',tall}:{src:string;alt:string;children:ReactNode;side?:'left'|'right';tall?:boolean}){
 const reduced=useReducedMotion();
 const root=useRef<HTMLElement>(null);
 // Particle wrap: born from the card headline as the section enters, complete when it is centred.
 const {scrollYProgress:wrapP}=useScroll({target:root,offset:['start end','center center']});
 useEffect(()=>{
  if(reduced||!root.current)return;
  const ctx=gsap.context(()=>{
   const st={trigger:root.current,start:'top bottom',end:'bottom top',scrub:.8};
   gsap.fromTo('.st-layer-zoom',{scale:1.2,yPercent:-6},{scale:1,yPercent:6,ease:'none',scrollTrigger:st});
   gsap.fromTo('.st-layer-drift',{y:90},{y:-60,ease:'none',scrollTrigger:st});
  },root);
  return()=>ctx.revert();
 },[reduced]);
 return <section ref={root} className={`st-layer st-layer-${side}${tall?' st-layer-tall':''}`}>
  <motion.div className="st-layer-img" initial={reduced?false:{clipPath:'inset(16% 12% 16% 12% round 64px)'}} whileInView={{clipPath:'inset(0% 0% 0% 0% round 44px)'}} viewport={{once:true,amount:.2}} transition={{duration:1.7,ease:EASE}}>
   <div className="st-layer-zoom"><Image src={src} alt={alt} fill sizes="(max-width: 860px) 100vw, 90vw" quality={85}/></div>
  </motion.div>
  <BuildingWrap progress={wrapP} stage={root} title=".st-h3" img=".st-layer-zoom img"/>
  <div className="st-layer-notch st-layer-drift">
   <motion.div className="st-card st-layer-card lux-glass" initial={reduced?false:{opacity:0,y:70,rotateX:14,scale:.95}} whileInView={{opacity:1,y:0,rotateX:0,scale:1}} viewport={{once:true,amount:.3}} transition={{duration:1.4,delay:.3,ease:EASE}} style={{transformPerspective:1400,transformOrigin:'50% 100%'}}>{children}</motion.div>
  </div>
 </section>;
}
