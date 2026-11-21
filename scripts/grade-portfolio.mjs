// Derive the curated, colour-graded delivery set from public/assets/bym-portfolio (originals untouched).
// Grade: gentle warm balance, slightly softer saturation, controlled contrast — no stylised looks.
// Run: node scripts/grade-portfolio.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC='public/assets/bym-portfolio', OUT='public/assets/bym-portfolio-curated';
// crop: fractions of the source to keep {top,bottom,left,right} trimmed; up: allowed upscale target width.
const SET=[
 ['ruya-sehir','ruya-garden',{}],
 ['ruya-sehir','ruya-hero',{bottom:.12}],
 ['ruya-sehir','ruya-entrance',{bottom:.08}],
 ['ruya-sehir','ruya-landscape',{}],
 ['burak-manzara-evleri','burak-hero',{}],
 ['burak-manzara-evleri','burak-night',{}],
 ['burak-manzara-evleri','burak-signage',{top:.08}],
 ['gaziantep-villalari','villa-hero',{}],
 ['gaziantep-villalari','villa-facade',{bottom:.24}],   // trims the red car
 ['gaziantep-villalari','villa-pool',{}],
 ['bilal-kafe','bilal-hero',{up:2048}],
 ['bilal-kafe','bilal-interior',{}],
 ['bilal-kafe','bilal-bar',{}],
 ['nisa-apartmani','nisa-hero',{}],
 ['nisa-apartmani','nisa-kitchen',{left:.06,right:.06}],
];
for(const [slug,key,o] of SET){
 const src=path.join(SRC,slug,key+'.webp');
 const m=await sharp(src).metadata();
 const left=Math.round(m.width*(o.left||0)), top=Math.round(m.height*(o.top||0));
 const width=Math.round(m.width*(1-(o.left||0)-(o.right||0))), height=Math.round(m.height*(1-(o.top||0)-(o.bottom||0)));
 let img=sharp(src).extract({left,top,width,height});
 if(o.up&&width<o.up) img=img.resize({width:o.up,kernel:'lanczos3'}).sharpen({sigma:.6,m1:.4,m2:1.2});
 img=img
  .recomb([[1.035,0.01,0],[0.005,1.0,0],[0,0.01,0.95]])   // warm, restrained
  .modulate({saturation:.93})
  .linear(1.05,-5);                                        // controlled contrast
 fs.mkdirSync(path.join(OUT,slug),{recursive:true});
 const out=path.join(OUT,slug,key+'.webp');
 const info=await img.webp({quality:86,effort:5}).toFile(out);
 console.log(out,info.width+'x'+info.height,(info.size/1024|0)+'KB');
}
