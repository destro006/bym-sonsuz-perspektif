import Link from 'next/link';
import {SiteHeader} from './SiteHeader';

/** Ivory content-page frame shared by Projeler / Hakkımızda / İletişim. */
export function PageShell({eyebrow,title,lead,children}:{eyebrow:string;title:string;lead:string;children?:React.ReactNode}){
 return <div className="page-frame">
  <a className="skip-link" href="#icerik">İçeriğe atla</a>
  <SiteHeader variant="page"/>
  <main id="icerik" className="content-page">
   <p className="eyebrow">{eyebrow}</p>
   <h1>{title}</h1>
   <p className="lead">{lead}</p>
   {children}
   <footer className="page-footer">
    <Link href="/" className="backlink">← Deneyime dön</Link>
    <span>© BYM İnşaat · Konsept prototip — içerikler onay sürecindedir.</span>
   </footer>
  </main>
 </div>;
}
