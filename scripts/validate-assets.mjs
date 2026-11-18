import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const required=[
 'public/assets/brand/bym-logo-original.png',
 'public/assets/earth/nasa-blue-marble-5400.jpg',
 'public/assets/project/review-required/IMG_0810_peyzaj.jpg',
 'data/chapters.json',
 'data/project-facts.json'
];
const forbidden=/IMG_4358|IMG_3345|burak.*ruya|fake|generated-building/i;
let fail=0;
for(const relative of required){
 const p=path.join(root,relative);
 if(!fs.existsSync(p)){console.error('MISSING:',relative);fail++;continue;}
 const raw=fs.readFileSync(p);console.log('OK',relative,(raw.length/1048576).toFixed(2)+' MB','SHA256',crypto.createHash('sha256').update(raw).digest('hex').slice(0,16));
}
for(const file of fs.readdirSync(path.join(root,'public/assets/project/review-required'))){
 if(forbidden.test(file)){console.error('FORBIDDEN OR MIXED PROJECT FILE:',file);fail++;}
}
if(fail)process.exit(1);
console.log('ASSET VALIDATION PASSED. Note: human visual and architectural approval is STILL required.');
