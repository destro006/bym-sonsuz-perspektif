import {asset} from '@/lib/asset';
import Link from 'next/link';
import type {Metadata} from 'next';
import {SiteShell} from '@/components/bym-portfolio/SiteShell';
import {Stage,StageImage,StageMeta} from '@/components/bym-portfolio/Stage';
import {LayeredFeature,Rise} from '@/components/bym-portfolio/Layered';
import {Icon} from '@/components/bym-portfolio/Icon';
import {Lines} from '@/components/bym-portfolio/Lines';
import {ArrowSwap} from '@/components/bym-portfolio/ArrowSwap';
import {PRESS} from '@/data/bym-portfolio';

export const metadata:Metadata={title:'Basında Biz | BYM İnşaat',description:'BYM İnşaat resmî web sitesinde yayınlanan proje ve kentsel dönüşüm haberleri.'};

const meta=[{icon:'news',label:'Arşiv',value:`${PRESS.length} haber`},{icon:'grid',label:'Konu',value:'Proje · Dönüşüm'},{icon:'arrow',label:'Kaynak',value:'byminsaat.com.tr'}];

export default function Press(){
 const first=PRESS[0];
 return <SiteShell>
  <Stage label="Basında BYM İnşaat"
   media={<StageImage src={asset("/assets/bym-portfolio-curated/ruya-sehir/ruya-entrance.webp")} alt="Rüya Şehir tanıtım ofisi girişi ve isim tabelası" priority/>}
   title={<Lines l={['Bir yapının','*ardındaki hikâye.*']}/>}
   lead={<p>Projelerimizin yapım sürecine ve kente kattığı değere ilişkin, resmî BYM haber arşivinden seçili yayınlar.</p>}
   top={<StageMeta items={meta}/>} below={<StageMeta items={meta}/>}
   left={<>
    <h2 className="st-card-title">Haber arşivi</h2>
    <p className="st-card-text">Tüm yazılar BYM İnşaat'ın resmî web sitesinde yayımlanmıştır.</p>
    <div className="st-card-row"><div className="st-count"><strong>{String(PRESS.length).padStart(2,'0')}</strong><span>Haber</span></div><a href="#haberler" className="st-round" aria-label="Haberlere in" style={{marginLeft:'auto'}}><ArrowSwap size={16}/></a></div>
   </>}
   right={<>
    <span className="st-small">ÖNE ÇIKAN · {first.category}</span>
    <h2 className="st-card-title" style={{marginTop:10}}>{first.title}</h2>
    <p className="st-card-text">Keçiören'deki projeye ilişkin haber, BYM İnşaat'ın resmî haber arşivinde.</p>
    <div className="st-card-foot"><a href={first.href} target="_blank" rel="noreferrer" className="st-next-link">Haberi oku<span className="st-round st-round-light"><ArrowSwap size={14}/></span></a></div>
   </>}
   scrollTarget="#haberler"
  />

  <section id="haberler" className="st-section" aria-labelledby="haber-baslik">
   <div className="st-section-head"><Rise><span className="st-kicker">HABER ARŞİVİ</span><h2 id="haber-baslik" className="st-h2">Basından <em>seçmeler.</em></h2></Rise></div>
   <div className="st-rows">{PRESS.map((a,i)=><Rise key={a.href} delay={i*.06}><a href={a.href} target="_blank" rel="noreferrer" className="st-row st-row-press">
    <span className="st-row-num">{String(i+1).padStart(2,'0')}</span><h3>{a.title}</h3><p>{a.category} · byminsaat.com.tr</p><span className="st-round"><ArrowSwap size={16}/></span>
   </a></Rise>)}</div>
  </section>

  <LayeredFeature src={asset("/assets/bym-portfolio-curated/bilal-kafe/bilal-hero.webp")} alt="Bilal Kafe ve peyzajının gece havadan görünümü">
   <span className="st-kicker">PROJELERİMİZ</span>
   <h2 className="st-h3">Her proje yeni <em>bir başlangıç.</em></h2>
   <Link className="st-btn" href="/projeler">Projeleri inceleyin<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
  </LayeredFeature>
 </SiteShell>;
}
