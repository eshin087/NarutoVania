import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const source=process.argv[2];if(!source)throw new Error('Pass the generated combat-revision directory.');
const output=path.resolve('public/art-v3'),archive=path.resolve('art/combat-revision');
await fs.mkdir(path.join(output,'icons'),{recursive:true});await fs.mkdir(archive,{recursive:true});
const ids=['reading','hounds','lightning','clones','feint','barrage','red-rush','fury','fireball','windmill','focus','intercept','protect','resolve','tool','parry'];
for(const [index,id]of ids.entries())await sharp(path.join(source,'ability-icons.png')).extract({left:index%4*256,top:Math.floor(index/4)*256,width:256,height:256}).resize(128,128).webp({quality:91}).toFile(path.join(output,'icons',`${id}.webp`));
for(const name of ['kakashi-melee','water-attacks','ultimate-cutins'])await fs.copyFile(path.join(source,`${name}.png`),path.join(output,`${name}.png`));
const waterPixels=await sharp(path.join(source,'water-attacks.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let i=0;i<waterPixels.data.length;i+=4)if(waterPixels.data[i]>160&&waterPixels.data[i+1]<70&&waterPixels.data[i+2]>160)waterPixels.data[i+3]=0;
await sharp(waterPixels.data,{raw:waterPixels.info}).png().toFile(path.join(output,'water-attacks.png'));
for(const file of (await fs.readdir(source)).filter(f=>/prompt.*\.txt$|frames\.json$|qa\.png$/.test(f)))await fs.copyFile(path.join(source,file),path.join(archive,file));
const melee=JSON.parse(await fs.readFile(path.join(source,'kakashi-melee-frames.json'),'utf8'));
const water=JSON.parse(await fs.readFile(path.join(source,'water-attacks-frames.json'),'utf8'));
const manifest={version:3,generator:'Built-in imagegen',cleanup:'User-authorized background removal and frame alignment; generated character art retained',
  icons:Object.fromEntries(ids.map((id,i)=>[id,{file:`icons/${id}.webp`,sourceRect:[i%4*256,Math.floor(i/4)*256,256,256]}])),
  ultimates:{file:'ultimate-cutins.png',frames:Object.fromEntries(['kakashi','naruto','sasuke','sakura'].map((id,i)=>[id,[i%2*1024,Math.floor(i/2)*512,1024,512]])),timing:{cutIn:600,first:880,second:1100,impact:1330,end:1700}},
  water:{file:'water-attacks.png',frames:Array.from({length:12},(_,i)=>({rect:[i%4*512,Math.floor(i/4)*256,512,256],anchor:[256,128],row:Math.floor(i/4),duration:85})),source:water},
  kakashi:{file:'kakashi-melee.png',baseHeight:232,frames:Array.from({length:24},(_,i)=>({rect:[i%6*256,Math.floor(i/6)*384,256,384],footAnchor:[128,307]})),source:melee}};
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({icons:ids.length,melee:24,cutins:4,water:12,output}));
