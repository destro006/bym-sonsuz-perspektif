'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {navigateShared} from '@/lib/viewTransition';
import Image from 'next/image';
import {useRef} from 'react';
import {motion,useMotionValue,useScroll,useSpring,useTransform} from 'framer-motion';
import type {BYMProject} from '@/data/bym-portfolio';
import {Icon} from './Icon';
import {ArrowSwap} from './ArrowSwap';

const pad=(n:number)=>String(n).padStart(2,'0');
const GLIDE=[0.16,1,0.3,1] as const;

/**
 * Portfolio tile: masked photo reveal with inner scroll parallax, pointer tilt, and a frosted-glass
 * title panel that hangs over the photo's lower edge on its own parallax layer.
 * Opacity is only animated on the glass elements themselves — an ancestor with opacity < 1 would
 * become a backdrop root and switch the blur off.
 */
export function ProjectTile({project:x,index:i,reduced}:{project:BYMProject;index:number;reduced:boolean}){
 const ref=useRef<HTMLElement>(null);
 const router=useRouter();
 const href=`/projeler/${x.slug}`;
 const vt=`proje-${x.slug}`;
 const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
 const imgY=useTransform(scrollYProgress,[0,1],['-6%','6%']);
 const panelY=useTransform(scrollYProgress,[0,1],[46,-46]);
 const rx=useMotionValue(0),ry=useMotionValue(0);
 const srx=useSpring(rx,{stiffness:140,damping:18}),sry=useSpring(ry,{stiffness:140,damping:18});
 const onMove=(e:React.PointerEvent<HTMLDivElement>)=>{
  if(reduced||e.pointerType!=='mouse')return;
  const r=e.currentTarget.getBoundingClientRect();
  ry.set(((e.clientX-r.left)/r.width-.5)*6);
  rx.set(-((e.clientY-r.top)/r.height-.5)*4);
 };
 const d=(i%2)*.12;
 const t=(extra:number,duration=1.3)=>({duration,ease:GLIDE,delay:d+extra});
 // One viewport trigger per tile; every layer animates from it through variants, so no layer can
 // miss its own trigger on a fast scroll or a deep link.
 const V={
  frame:{hidden:{clipPath:'inset(34% 14% 0% 14% round 56px)'},show:{clipPath:'inset(0% 0% 0% 0% round 36px)',transition:t(0,1.6)}},
  badge:{hidden:{opacity:0,y:-12},show:{opacity:1,y:0,transition:t(.5)}},
  arrow:{hidden:{opacity:0,scale:.6},show:{opacity:1,scale:1,transition:t(.6)}},
  panel:{hidden:{opacity:0,y:60,rotateX:16},show:{opacity:1,y:0,rotateX:0,transition:t(.35,1.4)}},
 };
 const vp={once:true,amount:.08 as const};
 return <motion.article ref={ref} layout={!reduced} className={`st-tile st-tile-${i%5}`}
  initial={reduced?false:'hidden'} whileInView='show' viewport={vp} exit={{scale:.96}}
  variants={{hidden:{y:110,scale:.94},show:{y:0,scale:1,transition:t(0)}}}>
  <motion.div className="st-tile-tilt" style={reduced?undefined:{rotateX:srx,rotateY:sry,transformPerspective:1600}} onPointerMove={onMove} onPointerLeave={()=>{rx.set(0);ry.set(0);}}>
   <Link href={href} className="st-tile-link" aria-label={`${x.name} projesini incele`}
    onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0)return;e.preventDefault();navigateShared(h=>router.push(h),href,vt);}}>
    <motion.div className="st-tile-frame" variants={V.frame} style={{viewTransitionName:vt} as React.CSSProperties}>
     <motion.div className="st-tile-img" style={reduced?undefined:{y:imgY}}>
      <Image src={x.hero} alt={`${x.name} proje görseli`} fill sizes="(max-width: 860px) 100vw, 60vw" quality={85} style={{objectPosition:x.heroPos??'center'}}/>
     </motion.div>
     <span className="st-tile-sheen" aria-hidden="true"/>
    </motion.div>
    <motion.span className="st-tile-badge lux-glass" variants={V.badge}><i/>{x.category}</motion.span>
    <motion.span className="st-tile-arrow lux-glass" variants={V.arrow}><ArrowSwap size={18}/></motion.span>
    <motion.div className="st-tile-panel-wrap" style={reduced?undefined:{y:panelY}}>
     <motion.div className="st-tile-panel lux-glass" variants={V.panel} style={{transformPerspective:1200,transformOrigin:'50% 100%'}}>
      <div className="st-tile-txt">
       <span className="st-small">{x.kicker}</span>
       <h3>{x.name}</h3>
       <span className="st-tile-loc"><Icon name="pin" size={12}/>{x.location}<i/>{x.images.length} görsel</span>
      </div>
     </motion.div>
    </motion.div>
   </Link>
  </motion.div>
 </motion.article>;
}
