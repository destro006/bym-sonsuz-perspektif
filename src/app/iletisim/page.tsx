import type {Metadata} from 'next';
import {PageShell} from '@/components/ui/PageShell';

export const metadata:Metadata={title:'İletişim | BYM İnşaat',description:'BYM İnşaat ile iletişim.'};

export default function Contact(){
 return <PageShell eyebrow="BYM İNŞAAT / İLETİŞİM" title="Geleceği birlikte inşa edelim." lead="İletişim bilgileri ve çalışan form, şirket yetkililerinin onayının ardından eklenecektir. Bilinmeyen telefon, adres veya e-posta burada yazılmaz.">
  <a className="primary-link" href="https://byminsaat.com.tr/" target="_blank" rel="noreferrer">Resmî web sitesi ↗</a>
 </PageShell>;
}
