import {asset} from '@/lib/asset';
import Link from 'next/link';
import type {Metadata} from 'next';
import {SiteShell} from '@/components/bym-portfolio/SiteShell';
import {ProjectsExperience} from '@/components/bym-portfolio/ProjectsExperience';
import {LayeredFeature} from '@/components/bym-portfolio/Layered';
import {Icon} from '@/components/bym-portfolio/Icon';
import {ArrowSwap} from '@/components/bym-portfolio/ArrowSwap';

export const metadata:Metadata={title:'Projeler | BYM İnşaat',description:'BYM İnşaat proje arşivi: Rüya Şehir, Gaziantep Villaları, Burak Manzara Evleri, Bilal Kafe ve Nisa Apartmanı.'};

export default function Projects(){
 return <SiteShell>
  <ProjectsExperience/>
  <LayeredFeature src={asset("/assets/bym-portfolio-curated/ruya-sehir/ruya-landscape.webp")} alt="Rüya Şehir peyzaj görselleştirmesi" side="right">
   <span className="st-kicker">YAŞAMA DEĞER</span>
   <h2 className="st-h3">Mekânın her ayrıntısı, <em>insan için var.</em></h2>
   <p className="st-card-text">Projelerimizin ardında bir tasarım yaklaşımı, bir yapım süreci ve geleceğe dönük bir sorumluluk bulunur.</p>
   <Link href="/hakkimizda" className="st-btn">Hikâyemiz<span className="st-btn-dot"><ArrowSwap size={14}/></span></Link>
  </LayeredFeature>
 </SiteShell>;
}
