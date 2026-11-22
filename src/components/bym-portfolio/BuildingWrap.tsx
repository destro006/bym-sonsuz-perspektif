'use client';
import {useEffect,useRef} from 'react';
import type {MotionValue} from 'framer-motion';

/**
 * Scroll-driven "title → building" architectural drawing (2D canvas, no extra WebGL scene).
 *
 *  1. A few light grains lift out of the headline glyphs; four fine draft lines extend from under
 *     the headline on soft curves towards the building's corners, the grains riding their tips.
 *  2. The outline is traced from both lower corners and meets at the roof centre.
 *  3. Floor hairlines draw bottom → top, three bay axes top → bottom, crop marks mark the corners.
 *  4. The connectors fade; the grains rest as evenly spaced beads on the outline.
 *
 * Crisp 1px strokes (no blur, no glow), each with a faint dark underlay so it reads on bright skies.
 * Palette from the design system: ivory lines, champagne beads, rose-gold accents.
 * Everything is a pure function of scroll progress, so it reverses exactly. No idle animation.
 */

type Box={x0:number;y0:number;x1:number;y1:number};
/** Focal building per hero photograph, normalised to the image, keyed by the original size and
 *  matched by aspect ratio (works for optimised copies and for the preview's data URIs). */
const FOCAL:Record<string,Box>={
 '2000x1333':{x0:.45,y0:.15,x1:.63,y1:.62},  // Rüya Şehir — bahçe ve kule
 '2000x1173':{x0:.38,y0:.03,x1:.58,y1:.92},  // Rüya Şehir — bloklar
 '2000x1380':{x0:.36,y0:.3,x1:.96,y1:.88},   // Rüya Şehir — tanıtım ofisi
 '2000x1200':{x0:.1,y0:.03,x1:.84,y1:.78},   // Gaziantep villası
 '2000x1110':{x0:.27,y0:.22,x1:.73,y1:.84},  // Nisa Apartmanı — iç mekân (kapı açıklığı)
 '1936x2592':{x0:.31,y0:.22,x1:.95,y1:.96},  // Burak Manzara Evleri
 '2048x1126':{x0:.42,y0:.3,x1:.88,y1:.62},   // Bilal Kafe
};
const FALLBACK:Box={x0:.3,y0:.15,x1:.7,y1:.9};
const IVORY='244,241,235', CHAMP='219,200,167', ROSE='197,165,138', SHADOW='16,18,22';
const sm=(a:number,b:number,v:number)=>{const x=Math.min(1,Math.max(0,(v-a)/(b-a)));return x*x*(3-2*x);};
const ease=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;          // cubic in-out
type Pt={x:number;y:number};
const bez=(a:Pt,b:Pt,c:Pt,d:Pt,t:number):Pt=>{const u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};};

export function BuildingWrap({progress,stage,title='.st-title',img='.st-img img'}:{progress:MotionValue<number>;stage:React.RefObject<HTMLElement|null>;title?:string;img?:string}){
 const cv=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=cv.current,host=stage.current;
  if(!canvas||!host||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const mobile=window.matchMedia('(max-width: 860px), (pointer: coarse)').matches;
  const G=mobile?48:90, dpr=Math.min(window.devicePixelRatio||1,2);
  let glyphs:Float32Array=new Float32Array(0), gTop=0, gLeft=0;
  let W=0,H=0,box:Box|null=null,visible=true,raf=0,lastKey='';

  // Grain sources: an even sample of the headline's glyph pixels, in stage space.
  const sample=()=>{
   const el=host.querySelector<HTMLElement>(title);if(!el)return;
   const hr=host.getBoundingClientRect(), tr=el.getBoundingClientRect();
   const off=document.createElement('canvas');off.width=Math.max(1,Math.ceil(tr.width));off.height=Math.max(1,Math.ceil(tr.height));
   const o=off.getContext('2d');if(!o)return;
   o.fillStyle='#fff';
   const words=[...el.querySelectorAll<HTMLElement>('.lux-word, .fj-w > span')];
   (words.length?words:[el]).forEach(w=>{
    const r=w.getBoundingClientRect(),cs=getComputedStyle(w);
    o.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m=o.measureText(w.textContent??'');
    const asc=m.fontBoundingBoxAscent||parseFloat(cs.fontSize)*.8, desc=m.fontBoundingBoxDescent||parseFloat(cs.fontSize)*.2;
    o.fillText((w.textContent??'').trimEnd(),r.left-tr.left,r.top-tr.top+(r.height-(asc+desc))/2+asc);
   });
   const d=o.getImageData(0,0,off.width,off.height).data, pts:number[]=[];
   for(let y=0;y<off.height;y+=2)for(let x=0;x<off.width;x+=2)if(d[(y*off.width+x)*4+3]>140)pts.push(x+tr.left-hr.left,y+tr.top-hr.top);
   if(!pts.length)return;
   // Deterministic, evenly spread pick of G grains across the glyph pixels.
   const n=pts.length/2, g=new Float32Array(G*2);
   for(let i=0;i<G;i++){const k=Math.floor(((i*0.6180339887)%1)*n);g[i*2]=pts[k*2];g[i*2+1]=pts[k*2+1];}
   glyphs=g;gTop=tr.top;gLeft=tr.left;lastKey='';
  };
  const resize=()=>{
   const r=host.getBoundingClientRect();W=r.width;H=r.height;
   canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=W+'px';canvas.style.height=H+'px';
   lastKey='';sample();
  };
  const measureBox=():Box|null=>{
   const imgs=host.querySelectorAll<HTMLImageElement>(img);const im=imgs[imgs.length-1];
   if(!im||!im.naturalWidth)return null;
   const hr=host.getBoundingClientRect(),r=im.getBoundingClientRect();
   const ar=im.naturalWidth/im.naturalHeight;let f=FALLBACK,best=.012;
   for(const k in FOCAL){const [w,h]=k.split('x').map(Number),dd=Math.abs(w/h-ar);if(dd<best){best=dd;f=FOCAL[k];}}
   const s=Math.max(r.width/im.naturalWidth,r.height/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;
   const [px,py]=getComputedStyle(im).objectPosition.split(' ').map(v=>parseFloat(v)/100);
   const ox=r.left-hr.left+(r.width-dw)*(isNaN(px)?.5:px), oy=r.top-hr.top+(r.height-dh)*(isNaN(py)?.5:py);
   const pad=6; // keep the drawing inside the visible stage
   return {x0:Math.max(pad,ox+f.x0*dw),y0:Math.max(pad,oy+f.y0*dh),x1:Math.min(W-pad,ox+f.x1*dw),y1:Math.min(H-pad,oy+f.y1*dh)};
  };

  /** Stroke a polyline (or its first `frac` of length): soft dark underlay, then the crisp line. */
  const stroke=(pts:Pt[],frac:number,col:string,alpha:number,width=1)=>{
   if(frac<=0||alpha<=0.004||pts.length<2)return;
   let total=0;const seg:number[]=[];
   for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);seg.push(l);total+=l;}
   let left=total*Math.min(1,frac);
   ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
   for(let i=1;i<pts.length&&left>0;i++){
    const l=seg[i-1],t=Math.min(1,left/l);
    ctx.lineTo(pts[i-1].x+(pts[i].x-pts[i-1].x)*t,pts[i-1].y+(pts[i].y-pts[i-1].y)*t);left-=l;
   }
   ctx.lineCap='round';ctx.lineJoin='round';
   // Ink + highlight: an anthracite edge keeps the ivory core sharp on bright façades and skies.
   ctx.strokeStyle=`rgba(${SHADOW},${(alpha*.62).toFixed(3)})`;ctx.lineWidth=width+2;ctx.stroke();
   ctx.strokeStyle=`rgba(${col},${alpha.toFixed(3)})`;ctx.lineWidth=width;ctx.stroke();
  };
  const dot=(p:Pt,r:number,col:string,alpha:number)=>{
   if(alpha<=0.004)return;
   ctx.fillStyle=`rgba(${SHADOW},${(alpha*.6).toFixed(3)})`;ctx.beginPath();ctx.arc(p.x,p.y,r+1.1,0,6.283);ctx.fill();
   ctx.fillStyle=`rgba(${col},${alpha.toFixed(3)})`;ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.283);ctx.fill();
  };
  /** Point on the outline, parameter L measured clockwise from the bottom-left corner. */
  const onOutline=(b:Box,L:number):Pt=>{
   const w=b.x1-b.x0,h=b.y1-b.y0,P=2*(w+h);L=((L%P)+P)%P;
   if(L<h)return {x:b.x0,y:b.y1-L};L-=h;
   if(L<w)return {x:b.x0+L,y:b.y0};L-=w;
   if(L<h)return {x:b.x1,y:b.y0+L};L-=h;
   return {x:b.x1-L,y:b.y1};
  };

  const draw=()=>{
   raf=requestAnimationFrame(draw);
   if(!visible||!glyphs.length)return;
   const p=progress.get();
   const m=measureBox();if(!m)return;
   box=box?{x0:box.x0+(m.x0-box.x0)*.14,y0:box.y0+(m.y0-box.y0)*.14,x1:box.x1+(m.x1-box.x1)*.14,y1:box.y1+(m.y1-box.y1)*.14}:m;
   const el=host.querySelector<HTMLElement>(title), tr=el?.getBoundingClientRect(), hr=host.getBoundingClientRect();
   // Redraw only when something moved: scroll-driven, no idle animation.
   const key=`${p.toFixed(4)}|${box.x0.toFixed(1)}|${box.y0.toFixed(1)}|${box.x1.toFixed(1)}|${box.y1.toFixed(1)}|${tr?.top.toFixed(1)}|${W}`;
   if(key===lastKey)return;lastKey=key;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
   if(p<=.002||!tr)return;
   const b=box, w=b.x1-b.x0, h=b.y1-b.y0, P=2*(w+h);
   const dx=tr.left-gLeft, dy=tr.top-gTop;
   const tb={l:tr.left-hr.left,r:tr.right-hr.left,b:tr.bottom-hr.top};

   // 1 — connectors from under the headline to the corners (bottom-left, top-left, top-right, bottom-right).
   const corners:Pt[]=[{x:b.x0,y:b.y1},{x:b.x0,y:b.y0},{x:b.x1,y:b.y0},{x:b.x1,y:b.y1}];
   const cornerL=[0,h,h+w,2*h+w];
   const conn=corners.map((c,k)=>{
    const a={x:tb.l+(tb.r-tb.l)*(.14+k*.24),y:tb.b+6};
    const c1={x:a.x,y:a.y+Math.max(40,(c.y-a.y)*.45)}, c2={x:c.x-(c.x-a.x)*.35,y:c.y};
    const pts:Pt[]=[];for(let i=0;i<=28;i++)pts.push(bez(a,c1,c2,c,i/28));
    return {a,c1,c2,c,pts,grow:ease(sm(.04+k*.035,.3+k*.035,p))};
   });
   const connFade=1-sm(.62,.86,p);
   conn.forEach(c=>stroke(c.pts,c.grow,IVORY,.85*connFade,1));

   // 2 — outline, traced from both lower corners and meeting at the roof centre.
   const o=ease(sm(.26,.62,p));
   stroke([{x:b.x0,y:b.y1},{x:b.x0,y:b.y0},{x:b.x0+w/2,y:b.y0}],o,IVORY,1,1.4);
   stroke([{x:b.x1,y:b.y1},{x:b.x1,y:b.y0},{x:b.x1-w/2,y:b.y0}],o,IVORY,1,1.4);
   stroke([{x:b.x0,y:b.y1},{x:b.x1,y:b.y1}],ease(sm(.5,.7,p)),IVORY,.8,1.2);

   // 3 — floor hairlines (bottom → top) and three bay axes (top → bottom).
   const floors=Math.max(4,Math.min(14,Math.round(h/Math.max(28,h/12))));
   for(let i=1;i<floors;i++){
    const y=b.y1-h*i/floors, t=ease(sm(.42+i/floors*.18,.6+i/floors*.18,p));
    stroke([{x:b.x0,y},{x:b.x1,y}],t,IVORY,.5,1);
   }
   for(let j=1;j<=3;j++){
    const x=b.x0+w*j/4, t=ease(sm(.5+j*.04,.74+j*.04,p));
    stroke([{x,y:b.y0},{x,y:b.y1}],t,IVORY,.34,1);
   }
   // Crop marks just outside each corner.
   const cm=ease(sm(.6,.78,p)), off=9, len=14*cm;
   if(cm>0){
    const marks:[Pt,number,number][]=[[corners[0],-1,1],[corners[1],-1,-1],[corners[2],1,-1],[corners[3],1,1]];
    marks.forEach(([c,sx,sy])=>stroke([{x:c.x+sx*off,y:c.y+sy*(off+len)},{x:c.x+sx*off,y:c.y+sy*off},{x:c.x+sx*(off+len),y:c.y+sy*off}],1,ROSE,cm,1.8));
   }

   // 4 — grains: out of the glyphs, along their connector, then along the outline to a bead slot.
   const born=sm(0,.06,p);
   for(let i=0;i<G;i++){
    const k=i%4,c=conn[k],lag=(i/G)*.5;
    const sx=glyphs[i*2]+dx, sy=glyphs[i*2+1]+dy;
    const lift=sm(.02+lag*.08,.08+lag*.08,p);                       // leave the letter
    const u=ease(sm(.05+k*.035+lag*.12,.3+k*.035+lag*.12,p));        // ride the connector
    let pt:Pt;
    if(u<=0)pt={x:sx+(c.a.x-sx)*lift,y:sy+(c.a.y-sy)*lift};
    else if(u<1)pt=bez(c.a,c.c1,c.c2,c.c,u);
    else{
     // Settle on the outline: evenly spaced slots, with a slow scroll-coupled drift.
     const slot=(i+.5)/G*P, from=cornerL[k];
     let d=slot-from;if(d>P/2)d-=P;if(d<-P/2)d+=P;
     const v=ease(sm(.32+lag*.1,.72+lag*.1,p));
     pt=onOutline(b,from+d*v+sm(.72,1,p)*P*.035);
    }
    const head=u>0&&u<1;
    dot(pt,head?2.2:1.7,head?IVORY:CHAMP,born);
   }
  };

  const ro=new ResizeObserver(resize);ro.observe(host);
  // Re-sample shortly after the host comes into view: in-view headlines rise into place on entry.
  let rs=0;
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;lastKey='';if(visible){clearTimeout(rs);rs=window.setTimeout(sample,1600);}});io.observe(host);
  const t=window.setTimeout(resize,2600);
  document.fonts?.ready.then(()=>sample()).catch(()=>{});
  raf=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(raf);clearTimeout(t);clearTimeout(rs);ro.disconnect();io.disconnect();};
 },[progress,stage,title,img]);
 return <canvas ref={cv} className="st-wrap-particles" aria-hidden="true"/>;
}
