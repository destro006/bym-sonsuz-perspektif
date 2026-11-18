import type {Metadata} from 'next';
import {PageShell} from '@/components/ui/PageShell';
import facts from '../../../data/project-facts.json';

export const metadata:Metadata={title:'Projeler | BYM İnşaat',description:'BYM İnşaat projeleri. Rüya Şehir proje bilgileri müşteri onayı sürecindedir.'};

const v=facts.reportedValues;
const rows:[string,string][]=[
 ['Blok sayısı',`${v.blocks} blok`],
 ['Kat sayısı',`Her blokta ${v.floorsPerBlock} kat`],
 ['Daire',`${v.apartments4plus1} adet 4+1`],
 ['Arsa',`${v.landDecares} dönüm`],
 ['İnşaat alanı',`${v.constructionAreaM2.toLocaleString('tr-TR')} m²`],
 ['İnşaat süresi',`${v.constructionYears} yıl`],
];

export default function Projects(){
 return <PageShell eyebrow="BYM İNŞAAT / PROJELER" title="Projelerimiz." lead="Proje arşivi, müşteri tarafından onaylanmış görseller ve doğrulanmış bilgilerle tamamlanacaktır.">
  <article className="project-card" aria-labelledby="ruya-sehir">
   <div className="project-card-head">
    <h2 id="ruya-sehir">Rüya Şehir</h2>
    <span className="status-chip">Bilgiler onay bekliyor</span>
   </div>
   <p>Aşağıdaki değerler BYM kaynak dosyasından aktarılmıştır ve yayına çıkmadan önce müşteri tarafından doğrulanacaktır.</p>
   <dl className="fact-grid">
    {rows.map(([k,val])=><div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}
   </dl>
   <h3>Sosyal olanaklar</h3>
   <ul className="amenities">{v.amenities.map(a=><li key={a}>{a}</li>)}</ul>
   <p className="note">3D mimari model, proje konumu ve onaylı görseller henüz eklenmedi; bu nedenle bu sayfada proje fotoğrafı gösterilmez.</p>
  </article>
 </PageShell>;
}
