import Link from 'next/link';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {SiteShell} from '@/components/bym-portfolio/SiteShell';
import {Stage,StageImage,StageMeta} from '@/components/bym-portfolio/Stage';
import {LayeredFeature,Rise} from '@/components/bym-portfolio/Layered';
import {ProjectGallery} from '@/components/bym-portfolio/ProjectGallery';
import {Icon} from '@/components/bym-portfolio/Icon';
import {Lines} from '@/components/bym-portfolio/Lines';
import {ArrowSwap} from '@/components/bym-portfolio/ArrowSwap';
import {BYM_PROJECTS} from '@/data/bym-portfolio';

type Props={params:Promise<{slug:string}>};
const pad=(n:number)=>String(n).padStart(2,'0');
export function generateStaticParams(){return BYM_PROJECTS.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;const p=BYM_PROJECTS.find(x=>x.slug===slug);
 return {title:p?`${p.name} | BYM İnşaat`:'Proje bulunamadı',description:p?.intro};
}

export default async function ProjectDetail({params}:Props){
 const {slug}=await params;
 const project=BYM_PROJECTS.find(p=>p.slug===slug);
 if(!project)notFound();
 const idx=BYM_PROJECTS.indexOf(project);
 const next=BYM_PROJECTS[(idx+1)%BYM_PROJECTS.length];
 const second=project.images[1]??project.images[0];
 return <SiteShell>
  <Stage label={`${project.name} projesi`}
   media={<StageImage src={project.hero} alt={project.images[0].alt} pos={project.heroPos} priority vt={`proje-${project.slug}`}/>}
   title={<Lines l={[project.name]}/>}
   lead={<p>{project.intro}</p>}
   top={<StageMeta items={[{icon:'grid',label:'Kategori',value:project.category},{icon:'pin',label:'Konum',value:project.location},{icon:'image',label:'Görsel',value:`${project.images.length} görünüm`}]}/>}
   below={<StageMeta items={[{icon:'grid',label:'Kategori',value:project.category},{icon:'pin',label:'Konum',value:project.location},{icon:'image',label:'Görsel',value:`${project.images.length}`}]}/>}
   left={<>
    <Link href="/projeler" className="st-back"><Icon name="prev" size={14}/>Tüm projeler</Link>
    <h2 className="st-card-title">Proje görselleri</h2>
    <div className="st-card-row">
     <div className="st-count"><strong>{project.images.length}</strong><span>Görünüm</span></div>
     <div className="st-avatars" aria-hidden="true">{project.images.slice(1,4).map(x=><span key={x.src}><Image src={x.src} alt="" fill sizes="44px"/></span>)}</div>
     <a href="#galeri" className="st-round" aria-label="Galeriye in"><ArrowSwap size={16}/></a>
    </div>
   </>}
   right={<>
    <div className="st-card-head">
     <div><span className="st-small">{project.kicker}</span><h2 className="st-card-title" style={{marginTop:8}}>{project.name}</h2><p className="st-card-loc"><Icon name="pin" size={13}/>{project.location}</p></div>
    </div>
    <p className="st-card-text">{project.description}</p>
    <ul className="st-specs">{project.notes.map(n=><li key={n}><Icon name="spark" size={14}/>{n}</li>)}</ul>
    <div className="st-card-foot"><Link href={`/projeler/${next.slug}`} className="st-next-link">Sonraki proje · {next.name}<span className="st-round st-round-light"><ArrowSwap size={14}/></span></Link></div>
   </>}
   scrollTarget="#galeri"
  />

  <section id="galeri" className="st-section" aria-labelledby="galeri-baslik">
   <div className="st-section-head"><Rise><span className="st-kicker">PROJE GÖRSELLERİ</span><h2 id="galeri-baslik" className="st-h2">{project.name} <em>yakından.</em></h2></Rise><p className="st-section-note">{project.images.length} görünüm · büyütmek için seçin</p></div>
   <ProjectGallery project={project}/>
  </section>

  <LayeredFeature src={second.src} alt={second.alt} side="right">
   <span className="st-kicker">PROJEYE BAKIŞ</span>
   <h2 className="st-h3">{project.intro}</h2>
   <p className="st-card-text">{project.description}</p>
   <Link href="/iletisim" className="st-btn">Bu proje hakkında görüşelim<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
  </LayeredFeature>

  <section className="st-section">
   <Link href={`/projeler/${next.slug}`} className="st-next" aria-label={`Sonraki proje: ${next.name}`}>
    <Image src={next.hero} alt="" fill sizes="100vw" style={{objectPosition:next.heroPos??"center"}}/>
    <span className="st-next-shade" aria-hidden="true"/>
    <span className="st-next-copy"><span className="st-kicker st-kicker-light">SONRAKİ PROJE</span><span className="st-next-title">{next.name}</span></span>
    <span className="st-next-arrow"><ArrowSwap size={22}/></span>
   </Link>
  </section>
 </SiteShell>;
}
