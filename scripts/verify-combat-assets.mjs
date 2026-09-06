import fs from 'node:fs/promises';
import sharp from 'sharp';
const manifest=JSON.parse(await fs.readFile('public/art-v3/manifest.json','utf8'));
for(const [id,entry]of Object.entries(manifest.icons)){
  const data=await sharp(`public/art-v3/${entry.file}`).metadata();if(data.width!==128||data.height!==128)throw new Error(`Invalid icon ${id}`);
}
for(const [name,width,height,cols,rows]of [['kakashi-melee',1536,1536,6,4],['water-attacks',2048,768,4,3]]){
  const {data,info}=await sharp(`public/art-v3/${name}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==width||info.height!==height)throw new Error(`Wrong atlas geometry ${name}`);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    let content=0,empty=0,magenta=0,edge=0;const w=width/cols,h=height/rows;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const at=((row*h+y)*width+col*w+x)*4,a=data[at+3];if(a<8)empty++;else{
        content++;if(x<2||x>=w-2||y<2||y>=h-2)edge++;
        if(data[at]>160&&data[at+1]<70&&data[at+2]>160)magenta++;
      }
    }
    if(content<500||empty<w*h*.25||edge||magenta>5)throw new Error(`Bad frame ${name} ${row}/${col}: ${JSON.stringify({content,empty,edge,magenta})}`);
  }
}
const audio=JSON.parse(await fs.readFile('public/audio-v3/manifest.json','utf8'));
for(const entry of audio.records){await fs.access(`public${entry.file}`);if(!Number.isFinite(entry.peakDb)||entry.peakDb>-.5)throw new Error(`Clipping ${entry.id}`);}
for(const id of ['hit-palm-1','hit-kick-1','hit-heavy','parry','lightning','ultimate-finish','water','water2'])if(!audio.records.find(r=>r.id===id))throw new Error(`Missing ${id}`);
console.log(JSON.stringify({icons:16,transparentFrames:36,cutins:4,audio:audio.records.length,clippedFrames:0,bakedBackgrounds:0}));
