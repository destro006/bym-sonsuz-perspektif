// Watches the project and redeploys to Vercel production after each burst of changes.
// The production alias (…vercel.app) stays the same, so the client link never changes.
// Run: npm run deploy:watch   (needs a prior `npx vercel login`)
import {watch} from 'node:fs';
import {spawn} from 'node:child_process';

const WATCH=['src','public','data','next.config.ts','package.json'];
const QUIET_MS=45_000;          // wait for 45 s without changes before deploying
const IGNORE=/(^|[\\/])(\.next|\.next-build|node_modules|\.vercel)([\\/]|$)|~$|\.tmp$/;

let timer=null, running=false, pending=false;
const stamp=()=>new Date().toLocaleTimeString('tr-TR');

function deploy(){
 if(running){pending=true;return;}
 running=true;
 console.log(`[${stamp()}] Değişiklikler yükleniyor…`);
 const p=spawn('npx',['--yes','vercel','deploy','--prod','--yes'],{shell:true,stdio:['ignore','pipe','pipe']});
 let out='';
 p.stdout.on('data',d=>{out+=d;});
 p.stderr.on('data',d=>{out+=d;});
 p.on('close',code=>{
  running=false;
  const url=(out.match(/https:\/\/[^\s]+\.vercel\.app/g)||[]).pop();
  console.log(code===0?`[${stamp()}] Yayında: ${url??'(URL çıktıda bulunamadı)'}`:`[${stamp()}] Yükleme başarısız (kod ${code}):\n${out.slice(-1500)}`);
  if(pending){pending=false;schedule();}
 });
}
function schedule(){clearTimeout(timer);timer=setTimeout(deploy,QUIET_MS);}

for(const target of WATCH){
 watch(target,{recursive:true},(_e,file)=>{
  if(file&&IGNORE.test(String(file)))return;
  schedule();
 });
}
console.log(`[${stamp()}] İzleniyor: ${WATCH.join(', ')} — her değişiklikten ${QUIET_MS/1000} sn sonra Vercel'e yüklenir.`);
