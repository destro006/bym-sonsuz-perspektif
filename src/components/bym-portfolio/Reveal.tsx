'use client';
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
export function Reveal({children,className='',delay=0}:{children:ReactNode;className?:string;delay?:number}) {
  const reduced = useReducedMotion();
  return <motion.div className={className}
    initial={reduced?false:{opacity:0,y:38,filter:'blur(5px)'}}
    whileInView={{opacity:1,y:0,filter:'blur(0px)'}}
    viewport={{once:true,amount:0.12}}
    transition={{duration:reduced?0:0.85,delay:reduced?0:delay,ease:[0.22,1,0.36,1]}}>{children}</motion.div>;
}
