// Preview-only stand-in for next/link: subpages are not part of the single-file preview.
import {forwardRef} from 'react';
type P=React.AnchorHTMLAttributes<HTMLAnchorElement>&{href:string};
const Link=forwardRef<HTMLAnchorElement,P>(function Link({href,onClick,...rest},ref){
 const internal=href.startsWith('/');
 return <a ref={ref} href={internal?'#':href} {...rest} onClick={e=>{
  if(internal){e.preventDefault();if(href==='/')window.scrollTo({top:0});else alert('Bu sayfa önizleme dosyasında yer almıyor; tam sitede açılır.');}
  onClick?.(e);
 }}/>;
});
export default Link;
