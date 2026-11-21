import {asset} from '@/lib/asset';
import Link from 'next/link';
import type {Metadata} from 'next';
import {SiteShell} from '@/components/bym-portfolio/SiteShell';
import {Stage,StageImage,StageMeta} from '@/components/bym-portfolio/Stage';
import {LayeredFeature,Rise} from '@/components/bym-portfolio/Layered';
import {Icon} from '@/components/bym-portfolio/Icon';
import {Lines} from '@/components/bym-portfolio/Lines';
import {ArrowSwap} from '@/components/bym-portfolio/ArrowSwap';
import {SERVICES} from '@/data/bym-portfolio';
import {ServiceJourney} from '@/components/bym-portfolio/ServiceJourney';

export const metadata:Metadata={title:'Hizmetler | BYM İnşaat',description:'BYM İnşaat inşaat, mimari hizmetler, peyzaj, danışmanlık ve kentsel dönüşüm alanları.'};

const meta=[{icon:'layers',label:'Uzmanlık',value:`${SERVICES.length} alan`},{icon:'building',label:'Kapsam',value:'Tasarım → Yapım'},{icon:'spark',label:'Odak',value:'Yaşam kalitesi'}];

export default function Services(){
 return <SiteShell>
  <Stage label="BYM İnşaat hizmetleri"
   media={<StageImage src={asset("/assets/bym-portfolio-curated/burak-manzara-evleri/burak-hero.webp")} alt="Burak Manzara Evleri dış cephe görünümü" pos="center 32%" priority/>}
   title={<Lines l={['Fikirden','*yapıya.*']}/>}
   lead={<p>Tasarımdan uygulamaya, yaşamın ihtiyaçlarını odağına alan disiplinler tek bir ekipte buluşur.</p>}
   top={<StageMeta items={meta}/>} below={<StageMeta items={meta}/>}
   left={<>
    <h2 className="st-card-title">Bütüncül süreç</h2>
    <p className="st-card-text">Proje fikrinden anahtar teslimine kadar her aşama aynı disiplinle yönetilir.</p>
    <div className="st-card-row"><div className="st-count"><strong>{String(SERVICES.length).padStart(2,'0')}</strong><span>Uzmanlık alanı</span></div><a href="#alanlar" className="st-round" aria-label="Hizmetlere in" style={{marginLeft:'auto'}}><ArrowSwap size={16}/></a></div>
   </>}
   right={<>
    <span className="st-small">HİZMETLERİMİZ</span>
    <ul className="st-list">{SERVICES.map(s=><li key={s.num}><span>{s.num}</span>{s.title}</li>)}</ul>
   </>}
   scrollTarget="#alanlar"
  />

  <ServiceJourney id="alanlar" kicker="UZMANLIK ALANLARI" cta={{href:'/projeler',label:'Projeleri keşfedin'}}/>

  <LayeredFeature src={asset("/assets/bym-portfolio-curated/gaziantep-villalari/villa-pool.webp")} alt="Gaziantep villa projesi havuz ve teras alanı" side="right" tall>
   <span className="st-kicker">İŞ BİRLİĞİ</span>
   <h2 className="st-h3">Projeniz için <em>yanınızdayız.</em></h2>
   <p className="st-card-text">Arsanız, fikriniz ya da dönüşüm ihtiyacınız için ilk görüşmeyi birlikte planlayalım.</p>
   <Link href="/iletisim" className="st-btn">İletişime geçin<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
  </LayeredFeature>
 </SiteShell>;
}
