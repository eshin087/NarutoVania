import fs from 'node:fs/promises';
import path from 'node:path';
const directory = path.resolve('work/audio-v3');
await fs.mkdir(directory, {recursive:true});
const selections = {
  'attack01.html': ['punch2a','punch2b','punch2c','jab','straight_punch','heavy_punch1','heavy_punch2','kick1','turning_kick','defense1','KungFu_swish1','KungFu_swish2','KungFu_swish3','swish2_3','damaged2','scifi_attack5'],
  'jidaigeki01en.html': ['sword_attack1','sword_attack2','wow_katana1','shuriken_ninja_knifes1','extracting_a_sword1','samurai_shouting1a'],
  'magic01en.html': ['lightning','fire1','fire2','disappearance1','reflection','water_land','fall_in_water','bubble_attack1'],
  'nature01en.html': ['waterfall1','small_ice1','small_ice2','breaking_branchs1'],
};
const records=[];
for (const [page,names] of Object.entries(selections)) {
  const url=`https://taira-komori.net/${page}`;
  const response=await fetch(url); if(!response.ok)throw new Error(`${url}: ${response.status}`);
  const html=await response.text(); await fs.writeFile(path.join(directory,page),html);
  const links=[...html.matchAll(/(?:href|src)=["']([^"']+\.(?:mp3|wav|ogg))["']/gi)].map(m=>new URL(m[1],url).href);
  for(const name of names){
    const asset=links.find(u=>decodeURIComponent(u.split('/').at(-1)).replace(/\.[^.]+$/,'')===name);
    if(!asset)throw new Error(`Missing linked audio ${name} in ${page}`);
    const file=path.join(directory,`${name}${path.extname(new URL(asset).pathname)}`);
    try{await fs.access(file);}catch{const r=await fetch(asset);if(!r.ok)throw new Error(`${name}: ${r.status}`);await fs.writeFile(file,new Uint8Array(await r.arrayBuffer()));}
    records.push({name,file:path.relative(directory,file),page:url});
  }
}
await fs.writeFile(path.join(directory,'index.json'),JSON.stringify(records,null,2));
console.log(JSON.stringify({downloaded:records.length,directory}));
