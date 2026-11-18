import type {Metadata} from 'next';
import {PageShell} from '@/components/ui/PageShell';

export const metadata:Metadata={title:'Hakkımızda | BYM İnşaat',description:'BYM İnşaat hakkında. Kurumsal içerik onay sürecindedir.'};

export default function About(){
 return <PageShell eyebrow="BYM İNŞAAT / HAKKIMIZDA" title="Güven, tutarlılıkla inşa edilir." lead="Kurumsal tarihçe, değerler ve referanslar BYM İnşaat kurumsal kataloğundan doğrulandıktan sonra bu sayfada yayınlanacaktır.">
  <p className="note">Bu sayfada henüz doğrulanmamış kurumsal beyan, rakam veya ödül yer almaz.</p>
 </PageShell>;
}
