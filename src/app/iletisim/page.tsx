import {asset} from '@/lib/asset';
import Link from 'next/link';
import type {Metadata} from 'next';
import {SiteShell} from '@/components/bym-portfolio/SiteShell';
import {Stage,StageImage,StageMeta} from '@/components/bym-portfolio/Stage';
import {Rise} from '@/components/bym-portfolio/Layered';
import {ContactForm} from '@/components/bym-portfolio/ContactForm';
import {Icon} from '@/components/bym-portfolio/Icon';
import {Lines} from '@/components/bym-portfolio/Lines';
import {ArrowSwap} from '@/components/bym-portfolio/ArrowSwap';
import {COMPANY} from '@/data/bym-portfolio';

export const metadata:Metadata={title:'İletişim | BYM İnşaat',description:'BYM İnşaat ile proje ve iş birliği hakkında iletişim kurun.'};

const meta=[{icon:'mail',label:'E-posta',value:COMPANY.email},{icon:'arrow',label:'Web',value:'byminsaat.com.tr'}];

export default function Contact(){
 return <SiteShell>
  <Stage label="BYM İnşaat iletişim"
   media={<StageImage src={asset("/assets/bym-portfolio-curated/gaziantep-villalari/villa-hero.webp")} alt="Gaziantep villa projesinin dış mimari görünümü" priority/>}
   title={<Lines l={['Geleceği birlikte','*inşa edelim.*']}/>}
   lead={<p>Yeni bir proje, yeni bir yaşam alanı ya da iş birliği için bizimle iletişime geçin.</p>}
   top={<StageMeta items={meta}/>}
   left={<>
    <h2 className="st-card-title">Doğrudan e-posta</h2>
    <p className="st-card-text">Mesajınız doğrudan BYM İnşaat ekibine ulaşır.</p>
    <div className="st-card-row"><a href={`mailto:${COMPANY.email}`} className="st-mail">{COMPANY.email}</a><a href="#form" className="st-round" aria-label="Forma in"><ArrowSwap size={16}/></a></div>
   </>}
   right={<>
    <span className="st-small">PROJE GÖRÜŞMESİ</span>
    <h2 className="st-card-title" style={{marginTop:10}}>Bir fikrin varsa, konuşalım.</h2>
    <p className="st-card-text">Formu doldurun; e-posta uygulamanızda mesajınız hazır olarak açılsın.</p>
    <div className="st-card-foot"><a href="#form" className="st-next-link">Forma git<span className="st-round st-round-light"><ArrowSwap size={14}/></span></a></div>
   </>}
   scrollTarget="#form"
  />

  <section id="form" className="st-section st-contact">
   <Rise className="st-contact-info">
    <span className="st-kicker st-kicker-light">BYM İNŞAAT / İLETİŞİM</span>
    <h2 className="st-h3">Birlikte <em>başlayalım.</em></h2>
    <span className="st-small" style={{color:'rgba(247,244,238,.6)'}}>DOĞRUDAN E-POSTA</span>
    <a className="big" href={`mailto:${COMPANY.email}`}>{COMPANY.email} ↗</a>
    <span className="st-small" style={{color:'rgba(247,244,238,.6)'}}>RESMÎ WEB SİTESİ</span>
    <a className="big" href={COMPANY.originalWebsite} target="_blank" rel="noreferrer">byminsaat.com.tr ↗</a>
    <Link href="/projeler" className="st-btn st-btn-light" style={{marginTop:'auto',alignSelf:'flex-start'}}>Projelerimizi inceleyin<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
   </Rise>
   <Rise className="st-contact-form" delay={.12}>
    <span className="st-kicker">MESAJINIZI BIRAKIN</span>
    <h2 className="st-h3">Projenizi <em>anlatın.</em></h2>
    <ContactForm/>
   </Rise>
  </section>
 </SiteShell>;
}
