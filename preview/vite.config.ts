/**
 * Builds ONE self-contained HTML file of the 3D experience for quick phone previews.
 * Not a deployment target. Images are inlined as data URIs; the logo is embedded byte-for-byte.
 */
import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import {viteSingleFile} from 'vite-plugin-singlefile';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(__dirname,'..');
// Lighter delivery files for the preview (same provenance; see docs/SOURCE_POLICY.md).
const swap:Record<string,string>={
 '/assets/earth/nasa-blue-marble-5400.jpg':'/assets/earth/nasa-blue-marble-2048.jpg',
 '/assets/project/review-required/IMG_0810_peyzaj.jpg':'/assets/project/review-required/IMG_0810_peyzaj-1600.jpg',
};
const mime=(f:string)=>f.endsWith('.png')?'image/png':f.endsWith('.webp')?'image/webp':'image/jpeg';
const PREFIX='\0bym-asset:';
const CURATED_IMPORT="import {__bymResolve} from 'bym-curated';";
/** Each referenced image becomes ONE virtual module, so a file used twice is embedded once. */
function inlineAssets():Plugin{
 return {name:'inline-public-assets',enforce:'pre',
  resolveId(id){return id.startsWith('bym-asset:')||id==='bym-curated'?'\0'+id:null;},
  load(id){
   if(id==='\0bym-curated'){
    const dir=path.join(root,'public/assets/bym-portfolio-curated');const map:Record<string,string>={};
    for(const slug of fs.readdirSync(dir))for(const f of fs.readdirSync(path.join(dir,slug)))
     map[`/assets/bym-portfolio-curated/${slug}/${f}`]=`data:image/webp;base64,${fs.readFileSync(path.join(dir,slug,f)).toString('base64')}`;
    return `const M=${JSON.stringify(map)};export function __bymResolve(p){return M[p]||p;}`;
   }
   if(!id.startsWith(PREFIX))return null;
   const p=id.slice(PREFIX.length);
   const file=path.join(root,'public',swap[p]||p);
   return `export default ${JSON.stringify(`data:${mime(file)};base64,${fs.readFileSync(file).toString('base64')}`)};`;
  },
  transform(code,id){
   if(!/\.(tsx?|jsx?)$/.test(id)||id.includes('node_modules')||id.startsWith('\0'))return null;
   const imports:string[]=[];
   // `src="/assets/x.png"` (JSX attribute) needs braces; plain string literals do not.
   let out=code.replace(/(=\s*)?(['"`])(\/assets\/[^'"`]+\.(?:png|jpe?g|webp))\2/g,(_m,attr:string|undefined,_q,p:string)=>{
    const name=`__bymAsset${imports.length}`;
    imports.push(`import ${name} from ${JSON.stringify('bym-asset:'+(swap[p]||p))};`);
    return attr?`${attr}{${name}}`:name;
   });
   // Template paths built at runtime (e.g. `${BASE_PATH}/assets/bym-portfolio-curated/${slug}/${key}.webp`)
   // resolve through one virtual map of every curated image.
   let out2=out.replace(/`\$\{BASE_PATH\}(\/assets\/[^`]+)`/g,(_m,rest:string)=>{if(!imports.includes(CURATED_IMPORT))imports.push(CURATED_IMPORT);return `__bymResolve(\`${rest}\`)`;});
   return out2===code?null:{code:imports.join('\n')+'\n'+out2,map:null};
  }};
}

export default defineConfig({
 root:__dirname,
 base:'./',
 define:{'process.env.NEXT_PUBLIC_BASE_PATH':JSON.stringify('')},
 plugins:[inlineAssets(),react(),viteSingleFile()],
 resolve:{alias:[
  {find:'@',replacement:path.join(root,'src')},
  {find:/^next\/link$/,replacement:path.join(__dirname,'shims/next-link.tsx')},
  {find:/^next\/image$/,replacement:path.join(__dirname,'shims/next-image.tsx')},
  {find:/^next\/navigation$/,replacement:path.join(__dirname,'shims/next-navigation.ts')},
 ]},
 build:{outDir:path.join(root,'preview-dist'),emptyOutDir:true,assetsInlineLimit:100_000_000,chunkSizeWarningLimit:5000},
});
