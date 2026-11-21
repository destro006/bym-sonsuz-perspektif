'use client';
import {asset} from '@/lib/asset';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {COMPANY} from '@/data/bym-portfolio';
import {viaSharedTransition} from '@/lib/viewTransition';
import {NAV,isActive} from './Stage';
import {Icon} from './Icon';
import {ArrowSwap} from './ArrowSwap';
import {ExhibitNav} from '@/components/ui/ExhibitNav';

/**
 * Inner-page frame. The primary navigation lives inside each page's Stage (notched pills + rail);
 * once the stage scrolls out of view a compact floating pill takes over.
 */
export function SiteShell({children}:{children:React.ReactNode}){
 const path=usePathname();
 return <div className="bym-site st-site">
  <a className="skip-link" href="#icerik">İçeriğe atla</a>
  {!viaSharedTransition() && <motion.div className="st-curtain" aria-hidden="true" initial={{clipPath:'inset(0% 0% 0% 0%)'}} animate={{clipPath:'inset(0% 0% 100% 0%)'}} transition={{duration:1.1,delay:.25,ease:[.77,0,.18,1]}}>
   <motion.span initial={{opacity:1,y:0}} animate={{opacity:0,y:-24}} transition={{duration:.5,delay:.15,ease:[.22,1,.36,1]}}><Image src={asset("/assets/brand/bym-logo-original.png")} alt="" width={150} height={60} unoptimized priority/></motion.span>
  </motion.div>}
  <ExhibitNav mode="route"/>
  <main id="icerik" className="st-main">{children}</main>
  <footer className="st-footer">
   <motion.div className="st-footer-stage" initial={{clipPath:'inset(10% 6% 0% 6% round 64px)',y:60}} whileInView={{clipPath:'inset(0% 0% 0% 0% round 44px)',y:0}} viewport={{once:true,amount:.15}} transition={{duration:1.4,ease:[.16,1,.3,1]}}>
    <div className="st-footer-top">
     <div><span className="st-kicker st-kicker-light">BYM İNŞAAT / BİRLİKTE</span><p className="st-footer-title">Bir sonraki hikâyeyi<br/><em>birlikte inşa edelim.</em></p></div>
     <Link className="st-btn st-btn-light" href="/iletisim">İletişime geçin<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
    </div>
    <div className="st-footer-bottom">
     <Image src={asset("/assets/brand/bym-logo-original.png")} alt="BYM İnşaat" width={110} height={44} unoptimized/>
     <nav aria-label="Alt menü">{NAV.map(n=><Link key={n.href} href={n.href}>{n.label}</Link>)}</nav>
     <div className="st-footer-meta"><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><a href={COMPANY.originalWebsite} target="_blank" rel="noreferrer">byminsaat.com.tr ↗</a><span>© {new Date().getFullYear()} BYM İnşaat</span></div>
    </div>
   </motion.div>
  </footer>
 </div>;
}
