import {asset} from '@/lib/asset';
import Link from 'next/link';
import type {Metadata} from 'next';
import {SiteShell} from '@/components/bym-portfolio/SiteShell';
import {Stage,StageImage,StageMeta} from '@/components/bym-portfolio/Stage';
import {LayeredFeature,Rise} from '@/components/bym-portfolio/Layered';
import {Icon} from '@/components/bym-portfolio/Icon';
import {Lines} from '@/components/bym-portfolio/Lines';
import {ArrowSwap} from '@/components/bym-portfolio/ArrowSwap';
import {COMPANY,SERVICES} from '@/data/bym-portfolio';

export const metadata:Metadata={title:'Hakkımızda | BYM İnşaat',description:'BYM İnşaat kurumsal yaklaşımı, değerleri ve çalışma alanları.'};

const meta=[{icon:'spark',label:'Deneyim',value:'20 yılı aşkın'},{icon:'layers',label:'Alanlar',value:'İnşaat · Mimari'},{icon:'info',label:'İlke',value:'Güven'}];

export default function About(){
 return <SiteShell>
  <Stage label="BYM İnşaat hakkında"
   media={<StageImage src={asset("/assets/bym-portfolio-curated/ruya-sehir/ruya-hero.webp")} alt="Rüya Şehir konut bloklarının cephesi" pos="center 30%" priority/>}
   title={<Lines l={['Güven, tutarlılıkla','*inşa edilir.*']}/>}
   lead={<p>Yapıyı bir bina olarak değil, insanların yıllarca içinde yaşayacağı bir dünya olarak ele alıyoruz.</p>}
   top={<StageMeta items={meta}/>} below={<StageMeta items={meta}/>}
   left={<>
    <h2 className="st-card-title">Yaklaşımımız</h2>
    <p className="st-card-text">İnsanın huzurunu, estetiği ve doğa dostu çözümleri tasarımın merkezine yerleştiriyoruz.</p>
    <div className="st-card-row">
     <div className="st-count"><strong>20+</strong><span>Yıllık deneyim</span></div>
     <a href="#hikaye" className="st-round" aria-label="Hikâyemize in" style={{marginLeft:'auto'}}><ArrowSwap size={16}/></a>
    </div>
   </>}
   right={<>
    <span className="st-small">DEĞERLERİMİZ</span>
    <ul className="st-list">{COMPANY.values.map((v,i)=><li key={v.title}><span>0{i+1}</span><div><strong>{v.title}</strong><p className="st-card-text" style={{marginTop:4}}>{v.text}</p></div></li>)}</ul>
   </>}
   scrollTarget="#hikaye"
  />

  <section id="hikaye" className="st-section st-split">
   <Rise><span className="st-kicker">BİRLİKTE İNŞA EDİLEN DEĞER</span><h2 className="st-h2">Yılların deneyimiyle <em>yarına bakıyoruz.</em></h2></Rise>
   <Rise delay={.12} className="st-split-copy"><p className="st-body">{COMPANY.about}</p><p className="st-body">Konuttan villaya, rezidanstan ticari mekânlara uzanan projelerde mimarlık ve mühendislik hizmetlerini, müşteri memnuniyetini öncelikleyen bir yapım süreciyle bir araya getiriyoruz.</p></Rise>
  </section>

  <section className="st-section">
   <div className="st-cards">{COMPANY.values.map((v,i)=><Rise key={v.title} delay={i*.1} as="article" className="st-card"><span className="st-num">0{i+1}</span><h3>{v.title}</h3><p>{v.text}</p></Rise>)}</div>
  </section>

  <LayeredFeature src={asset("/assets/bym-portfolio-curated/gaziantep-villalari/villa-facade.webp")} alt="Gaziantep villa projesi cephe ve bahçe görseli" tall>
   <span className="st-kicker">ÇALIŞMA ALANLARIMIZ</span>
   <h2 className="st-h3">Tasarım ve yapım, <em>tek bir bakışta.</em></h2>
   <ul className="st-list">{SERVICES.slice(0,4).map(s=><li key={s.num}><span>{s.num}</span>{s.title}</li>)}</ul>
   <Link href="/hizmetler" className="st-btn">Bütün hizmetler<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
  </LayeredFeature>
 </SiteShell>;
}
