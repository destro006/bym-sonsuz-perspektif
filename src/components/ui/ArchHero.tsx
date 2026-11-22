'use client';
import {BASE_PATH} from '@/lib/asset';
import Image from 'next/image';
import Link from 'next/link';
import {motion,AnimatePresence} from 'framer-motion';
import facts from '../../../data/project-facts.json';
import {Icon} from '@/components/bym-portfolio/Icon';
import {ArrowSwap} from '@/components/bym-portfolio/ArrowSwap';

const v=facts.reportedValues;
const THUMBS=['ruya-hero','ruya-entrance','ruya-landscape'];

/**
 * Architectural hero (end of the scroll journey) in the Stage design language: a very large
 * translucent headline over the project photo, a solid ivory card carved out of the frame at the
 * bottom-left, one glass card with the project figures on the right and the rotating brand seal
 * on its corner.
 *
 * Everything is choreographed by CSS custom properties written from the camera's eased progress
 * (--arch, --c1..--c3, --drift) — transform/opacity only, so it reverses exactly with scroll.
 * Framer Motion only swaps the headline text between chapters 06 and 07.
 *
 * All figures come from data/project-facts.json (transcribed, pending client approval) and the
 * photo is a review-required project image — both are labelled as such on screen.
 */
export function ArchHero({chapter,goTo}:{chapter:number;goTo:(p:number)=>void}){
 const late=chapter>=6;
 return <div className="arch-hero" inert>
  <div className="ah-shade" aria-hidden="true"/>

  <div className="ah-title-wrap">
   <AnimatePresence mode="wait" initial={false}>
    <motion.h2 key={late?'b':'a'} className="ah-title" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
     {late?<>Güven, tutarlılıkla<br/><em>inşa edilir.</em></>:<>Her katında emek,<br/><em>her detayında düşünce.</em></>}
    </motion.h2>
   </AnimatePresence>
  </div>

  <div className="ah-lead">
   <p>{v.landDecares} dönüm arsa üzerinde {v.blocks} blok ve {v.apartments4plus1} adet 4+1 daireden oluşan, sosyal olanaklarla çevrili bir yaşam projesi.</p>
   <button type="button" className="ah-replay" onClick={()=>goTo(0)}><span className="ah-replay-dot" aria-hidden="true"><svg viewBox="0 0 24 24" width="11" height="11"><path d="M8 5.5v13l10-6.5z" fill="currentColor"/></svg></span>Yolculuğu yeniden izle</button>
  </div>


  <div className="jn-notch jn-bl ah-notch">
   <article className="ah-card" aria-labelledby="ah-proje">
    <h3 id="ah-proje">Rüya Şehir</h3>
    <p>{v.landDecares} dönüm arsa üzerinde {v.blocks} blok. Kapalı havuz, hamam ve gölet çevresinde kurgulanan peyzaj.</p>
    <div className="ah-card-row">
     <div className="ah-count"><strong>{v.apartments4plus1}</strong><span>adet 4+1<br/>daire</span></div>
     <div className="ah-thumbs" aria-hidden="true">{THUMBS.map(t=><span key={t}><Image src={`${BASE_PATH}/assets/bym-portfolio-curated/ruya-sehir/${t}.webp`} alt="" fill sizes="48px"/></span>)}</div>
     <Link href="/projeler/ruya-sehir" className="ah-round" aria-label="Rüya Şehir projesini incele"><ArrowSwap size={16}/></Link>
    </div>
   </article>
  </div>

  <div className="ah-float">
   <article className="ah-glass" aria-labelledby="ah-veri">
    <div className="ah-glass-head">
     <div><span className="ah-small">PROJE VERİLERİ</span><h3 id="ah-veri">Sosyal olanaklarla çevrili bir yaşam</h3></div>
     <Link href="/iletisim" className="ah-round ah-round-light" aria-label="Proje görüşmesi için iletişime geçin"><ArrowSwap size={16}/></Link>
    </div>
    <dl className="ah-specs">
     <div><dt><Icon name="building" size={14}/>Blok</dt><dd>{v.blocks}</dd></div>
     <div><dt><Icon name="layers" size={14}/>Kat / blok</dt><dd>{v.floorsPerBlock}</dd></div>
     <div><dt><Icon name="pin" size={14}/>Dönüm arsa</dt><dd>{v.landDecares}</dd></div>
    </dl>
    <ul className="ah-tags" aria-label="Sosyal olanaklar">{v.amenities.slice(0,4).map(a=><li key={a}>{a}</li>)}</ul>
    <p className="ah-foot">{v.constructionAreaM2.toLocaleString('tr-TR')} m² inşaat alanı</p>
   </article>
  </div>

  <div className="ah-seal-wrap">
   <a href="#sonraki-adim" className="st-seal ah-seal" aria-label="Bölümlere geç">
    <svg viewBox="0 0 120 120" className="st-seal-ring" aria-hidden="true">
     <defs><path id="ah-seal-path" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs>
     <text><textPath href="#ah-seal-path">BYM İNŞAAT · GÜVEN · TUTARLILIK · YAŞAM ·</textPath></text>
    </svg>
    <span className="st-seal-core"><Icon name="down" size={20}/></span>
   </a>
  </div>
 </div>;
}
