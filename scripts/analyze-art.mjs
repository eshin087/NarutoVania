import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Reads the original generated pixels; never rewrites or retouches artwork.
export async function inspectAtlas(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const cw = width / 4, ch = height / 4;
  const alpha = (x, y) => data[(y * width + x) * channels + 3];
  let transparent = 0;
  for (let i = 3; i < data.length; i += channels) if (data[i] < 8) transparent++;
  if (transparent / (width * height) < 0.25) throw new Error(`Atlas lacks transparent background: ${file}`);
  if (!file.includes('props')) {
    const visited = new Uint8Array(width*height), components = [];
    const stack = new Int32Array(width*height);
    for (let start = 0; start < visited.length; start++) {
      if (visited[start] || data[start*channels+3] < 64) continue;
      let top=0,count=0,x0=width,y0=height,x1=0,y1=0;
      stack[top++]=start;visited[start]=1;
      while(top) {
        const p=stack[--top], x=p%width,y=Math.floor(p/width);
        count++; x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
          const nx=x+dx,ny=y+dy, n=ny*width+nx;
          if(nx<0||nx>=width||ny<0||ny>=height||visited[n]||data[n*channels+3]<64)continue;
          visited[n]=1;stack[top++]=n;
        }
      }
      if(count>500)components.push({x0,y0,x1,y1,count});
    }
    const characters=components.sort((a,b)=>b.count-a.count).slice(0,16).sort((a,b)=>(a.y0+a.y1)-(b.y0+b.y1));
    if(characters.length!==16)throw new Error(`Expected 16 separated character silhouettes; found ${characters.length}: ${file}`);
    const frames=[];
    for(let row=0;row<4;row++)for(const c of characters.slice(row*4,row*4+4).sort((a,b)=>a.x0-b.x0)) {
      const x=Math.max(0,c.x0-2),y=Math.max(0,c.y0-2),w=Math.min(width,c.x1+3)-x,h=Math.min(height,c.y1+3)-y;
      let sum=0,count=0;
      for(let yy=c.y1-Math.round((c.y1-c.y0)*.13);yy<=c.y1;yy++)for(let xx=c.x0;xx<=c.x1;xx++)if(alpha(xx,yy)>128){sum+=xx;count++;}
      frames.push({x,y,w,h,ox:+(count?(sum/count-x)/w:.5).toFixed(4),oy:1});
    }
    return {width,height,alphaRatio:+(transparent/(width*height)).toFixed(3),frames};
  }
  const frames = [];
  for (let f = 0; f < 16; f++) {
    const sx = Math.round(f % 4 * cw), sy = Math.round(Math.floor(f / 4) * ch);
    const ex = Math.round((f % 4 + 1) * cw), ey = Math.round((Math.floor(f / 4) + 1) * ch);
    let x0 = ex, y0 = ey, x1 = sx, y1 = sy;
    for (let y = sy; y < ey; y++) for (let x = sx; x < ex; x++) {
      if (alpha(x,y) > 20) { x0 = Math.min(x0,x); x1 = Math.max(x1,x); y0 = Math.min(y0,y); y1 = Math.max(y1,y); }
    }
    if (x0 > x1) throw new Error(`Empty frame ${f} in ${file}`);
    let sum = 0, count = 0;
    for (let y = Math.max(y0, y1 - Math.round((y1-y0)*0.035)); y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (alpha(x,y) > 120) {sum += x; count++;}
    }
    const footX = count ? sum/count : (x0+x1)/2;
    frames.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,ox:+((footX-x0)/(x1-x0+1)).toFixed(4),oy:1});
  }
  return {width,height,alphaRatio:+(transparent/(width*height)).toFixed(3),frames};
}

if (process.argv[2]) {
  const input = path.resolve(process.argv[2]);
  const result = await inspectAtlas(input);
  if (process.argv[3]) await fs.writeFile(process.argv[3],JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({file:input,...result},null,2));
}
