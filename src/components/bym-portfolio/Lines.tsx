'use client';
import {motion,useReducedMotion,type Variants} from 'framer-motion';

const EASE=[0.19,1,0.22,1] as const;

/**
 * Display headline with a masked, word-staggered rise. Lines wrapped in *asterisks* get the emphasis class (.lux-em).
 * The viewport trigger sits on the (untransformed) line mask, not on the words: a word pushed
 * below its overflow-hidden mask is clipped, so observing it directly would never fire.
 * Usage: <Lines l={['Güven, tutarlılıkla','*inşa edilir.*']}/>
 */
export function Lines({l,delay=.35,stagger=.07,inView=false}:{l:string[];delay?:number;stagger?:number;inView?:boolean}){
 const reduced=useReducedMotion();
 let n=0;
 return <>{l.map((line,li)=>{
  const em=/^\*.*\*$/.test(line);
  const words=(em?line.slice(1,-1):line).split(' ');
  const style={transformOrigin:'0% 100%'};
  // Emphasis is a class, not an inline style, so each design language decides how it reads.
  const cls=em?'lux-word lux-em':'lux-word';
  if(reduced)return <span key={li} className="lux-line">{words.map((w,wi)=><span key={wi} className={cls} style={style}>{w}{wi<words.length-1?' ':''}</span>)}</span>;
  const trigger=inView?{whileInView:'show' as const,viewport:{once:true,amount:.4}}:{animate:'show' as const};
  return <motion.span key={li} className="lux-line" initial="hidden" {...trigger}>{words.map((w,wi)=>{
   const i=n++;
   const v:Variants={hidden:{y:'108%',rotate:2.5},show:{y:'0%',rotate:0,transition:{duration:1.1,delay:delay+i*stagger,ease:EASE}}};
   return <motion.span key={wi} className={cls} style={style} variants={v}>{w}{wi<words.length-1?' ':''}</motion.span>;
  })}</motion.span>;
 })}</>;
}
