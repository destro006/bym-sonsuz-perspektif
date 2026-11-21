'use client';
import {useEffect,useRef} from 'react';
import type {MotionValue} from 'framer-motion';

/**
 * Scroll-driven "title → building" particles for a hero stage (2D canvas, no extra WebGL scene).
 * Particles are sampled from the page title's glyphs, lift out of the letters as the page scrolls,
 * fly along curved paths and wrap the focal building of the hero photograph: luminous edges plus
 * three helical ribbons coloured like the featured mass of the opening (ember → pink → magenta → violet).
 * Every position is a pure function of the stage's scroll progress, so it reverses exactly;
 * time only adds a faint twinkle.
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
 '1936x2592':{x0:.31,y0:.19,x1:.95,y1:.96},  // Burak Manzara Evleri
 '2048x1126':{x0:.42,y0:.3,x1:.88,y1:.62},   // Bilal Kafe
};
const FALLBACK:Box={x0:.3,y0:.15,x1:.7,y1:.9};
const AURA=[[255,92,51],[255,77,153],[219,56,199],[128,66,255]];
const GOLD=[219,200,167];
const sm=(a:number,b:number,v:number)=>{const x=Math.min(1,Math.max(0,(v-a)/(b-a)));return x*x*(3-2*x);};
const auraAt=(t:number)=>{const x=Math.min(.999,Math.max(0,t))*(AURA.length-1),i=Math.floor(x),f=x-i,a=AURA[i],b=AURA[i+1];return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];};
function seeded(s:number){return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}

type P={src:number;role:0|1;t:number;h:number;rib:number;d:number;size:number;tw:number;bend:number};

export function BuildingWrap({progress,stage,title='.st-title',img='.st-img img'}:{progress:MotionValue<number>;stage:React.RefObject<HTMLElement|null>;title?:string;img?:string}){
 const cv=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=cv.current,host=stage.current;
  if(!canvas||!host||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const mobile=window.matchMedia('(max-width: 860px), (pointer: coarse)').matches;
  const N=mobile?1000:2400, dpr=Math.min(window.devicePixelRatio||1,mobile?1.5:2);
  const rnd=seeded(20261121);
  const parts:P[]=Array.from({length:N},(_,i)=>{
   const role=(rnd()<.34?0:1) as 0|1, h=rnd();
   return {src:0,role,t:rnd(),h,rib:i%3,d:role?h*.4+rnd()*.04:rnd()*.4,size:(role?1.15:.95)+Math.pow(rnd(),3)*2.2,tw:rnd()*6.28,bend:(rnd()-.5)*1.1};
  });
  let glyphs:Float32Array=new Float32Array(0), gTop=0, gLeft=0;
  let W=0,H=0,box:Box|null=null,visible=true,raf=0;

  // Sample the title's glyphs (word by word, with each word's own computed font) in stage space.
  const sample=()=>{
   const el=host.querySelector<HTMLElement>(title);if(!el)return;
   const hr=host.getBoundingClientRect(), tr=el.getBoundingClientRect();
   const off=document.createElement('canvas');off.width=Math.max(1,Math.ceil(tr.width));off.height=Math.max(1,Math.ceil(tr.height));
   const o=off.getContext('2d');if(!o)return;
   o.fillStyle='#fff';o.textBaseline='alphabetic';
   const words=[...el.querySelectorAll<HTMLElement>('.lux-word, .fj-w > span')];
   (words.length?words:[el]).forEach(w=>{
    const r=w.getBoundingClientRect(),cs=getComputedStyle(w);
    o.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m=o.measureText(w.textContent??'');
    // Baseline from font metrics, centred in the word's line box.
    const asc=m.fontBoundingBoxAscent||parseFloat(cs.fontSize)*.8, desc=m.fontBoundingBoxDescent||parseFloat(cs.fontSize)*.2;
    o.fillText((w.textContent??'').trimEnd(),r.left-tr.left,r.top-tr.top+(r.height-(asc+desc))/2+asc);
   });
   const img=o.getImageData(0,0,off.width,off.height).data, step=mobile?3:2, pts:number[]=[];
   for(let y=0;y<off.height;y+=step)for(let x=0;x<off.width;x+=step)if(img[(y*off.width+x)*4+3]>128)pts.push(x+tr.left-hr.left,y+tr.top-hr.top);
   if(!pts.length)return;
   glyphs=new Float32Array(pts);gTop=tr.top;gLeft=tr.left;
   const n=pts.length/2;parts.forEach((p,i)=>{p.src=Math.floor(((i*7919)%N)/N*n);});
  };
  const resize=()=>{
   const r=host.getBoundingClientRect();W=r.width;H=r.height;
   canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=W+'px';canvas.style.height=H+'px';
   sample();
  };
  // Focal box in stage space from the visible hero <img> (object-fit: cover + object-position).
  const measureBox=():Box|null=>{
   const imgs=host.querySelectorAll<HTMLImageElement>(img);const im=imgs[imgs.length-1];
   if(!im||!im.naturalWidth)return null;
   const hr=host.getBoundingClientRect(),r=im.getBoundingClientRect();
   // Match by aspect ratio: the optimiser may serve a resized copy (e.g. 1440×844 for 2000×1173).
   const ar=im.naturalWidth/im.naturalHeight;let f=FALLBACK,best=.012;
   for(const k in FOCAL){const [w,h]=k.split('x').map(Number),d=Math.abs(w/h-ar);if(d<best){best=d;f=FOCAL[k];}}
   const s=Math.max(r.width/im.naturalWidth,r.height/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;
   const [px,py]=getComputedStyle(im).objectPosition.split(' ').map(v=>parseFloat(v)/100);
   const ox=r.left-hr.left+(r.width-dw)*(isNaN(px)?.5:px), oy=r.top-hr.top+(r.height-dh)*(isNaN(py)?.5:py);
   return {x0:ox+f.x0*dw,y0:oy+f.y0*dh,x1:ox+f.x1*dw,y1:oy+f.y1*dh};
  };

  const draw=(time:number)=>{
   raf=requestAnimationFrame(draw);
   if(!visible||!glyphs.length)return;
   const p=progress.get();
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
   if(p<=.001)return;
   const m=measureBox();if(!m)return;
   // Glide between photos (the projects stage autoplays) instead of snapping.
   box=box?{x0:box.x0+(m.x0-box.x0)*.12,y0:box.y0+(m.y0-box.y0)*.12,x1:box.x1+(m.x1-box.x1)*.12,y1:box.y1+(m.y1-box.y1)*.12}:m;
   const el=host.querySelector<HTMLElement>(title), tr=el?.getBoundingClientRect();
   const dy=tr?tr.top-gTop:0, dx=tr?tr.left-gLeft:0;      // title parallax since sampling
   const birth=sm(0,.07,p), cx=(box.x0+box.x1)/2, hw=(box.x1-box.x0)/2, bh=box.y1-box.y0, gap=Math.max(10,hw*.12);
   const spin=p*Math.PI*1.4;
   for(let i=0;i<N;i++){
    const q=parts[i];
    const sx=glyphs[q.src*2]+dx, sy=glyphs[q.src*2+1]+dy;
    let tx:number,ty:number,col:number[],depth=1;
    if(q.role===0){
     // Edges: left, roof, right (the façade outline), clockwise from the ground.
     let L=q.t*(2*bh+(box.x1-box.x0));
     if(L<bh){tx=box.x0;ty=box.y1-L;} else if((L-=bh)<box.x1-box.x0){tx=box.x0+L;ty=box.y0;} else {L-=box.x1-box.x0;tx=box.x1;ty=box.y0+L;}
     col=GOLD;
    } else {
     const th=q.h*Math.PI*2*2.2+q.rib*Math.PI*2/3+spin;
     tx=cx+(hw+gap)*Math.sin(th);ty=box.y1-q.h*bh*1.04;depth=Math.cos(th);
     col=auraAt(q.h);
    }
    const k=sm(.07+q.d,.07+q.d+.3,p);
    // Curved flight: control point swings out perpendicular to the path.
    const mx=(sx+tx)/2,my=(sy+ty)/2,vx=tx-sx,vy=ty-sy;
    const ctlx=mx-vy*q.bend*.35,cty=my+vx*q.bend*.35-Math.abs(vx)*.12;
    const u=1-k,x=u*u*sx+2*u*k*ctlx+k*k*tx,y=u*u*sy+2*u*k*cty+k*k*ty;
    const front=q.role===1?(depth>0?1:.38):1;
    const a=birth*(.55+.45*Math.sin(time*.0016+q.tw))*front*(k<1?.9:.85);
    const c=k<.5?[255,246,232]:col, mix=sm(.35,1,k);
    const r=Math.round(c[0]+(col[0]-c[0])*mix),g=Math.round(c[1]+(col[1]-c[1])*mix),b=Math.round(c[2]+(col[2]-c[2])*mix);
    const s=q.size*(q.role===1?(.8+.4*Math.max(0,depth)):1)*(1+.6*Math.sin(Math.PI*k));
    // Halo adds light (glow on dark areas); the core is painted normally so it still reads on
    // bright skies and pale façades.
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=`rgba(${r},${g},${b},${(a*.22).toFixed(3)})`;ctx.beginPath();ctx.arc(x,y,s*3.4,0,6.283);ctx.fill();
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle=`rgba(${r},${g},${b},${Math.min(1,a*1.15).toFixed(3)})`;ctx.beginPath();ctx.arc(x,y,s,0,6.283);ctx.fill();
   }
   ctx.globalCompositeOperation='source-over';
  };

  const ro=new ResizeObserver(resize);ro.observe(host);
  // Re-sample shortly after the host comes into view: in-view headlines rise into place on entry.
  let rs=0;
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible){clearTimeout(rs);rs=window.setTimeout(sample,1600);}});io.observe(host);
  // Sample once the title's entrance has settled and web fonts are ready.
  const t=window.setTimeout(()=>{resize();},2600);
  document.fonts?.ready.then(()=>sample()).catch(()=>{});
  raf=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(raf);clearTimeout(t);clearTimeout(rs);ro.disconnect();io.disconnect();};
 },[progress,stage,title,img]);
 return <canvas ref={cv} className="st-wrap-particles" aria-hidden="true"/>;
}
