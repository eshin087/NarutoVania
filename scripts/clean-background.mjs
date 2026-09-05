import sharp from 'sharp';

// User-authorized cleanup: remove only border-connected neutral checkerboard.
// Enclosed pale costume details remain intact; source pixels are preserved.
const [source, destination] = process.argv.slice(2);
if(!source || !destination || source===destination) throw new Error('Provide different source and destination PNG paths.');
const {data,info} = await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width,height}=info, visited=new Uint8Array(width*height), stack=new Int32Array(width*height);
const isBackground=(p)=>{const o=p*4,r=data[o],g=data[o+1],b=data[o+2];return Math.min(r,g,b)>208 && Math.max(r,g,b)-Math.min(r,g,b)<24;};
let top=0;
const push=(p)=>{if(!visited[p]&&isBackground(p)){visited[p]=1;stack[top++]=p;}};
for(let x=0;x<width;x++){push(x);push((height-1)*width+x);}
for(let y=0;y<height;y++){push(y*width);push(y*width+width-1);}
let removed=0;
while(top){const p=stack[--top],x=p%width,y=Math.floor(p/width);data[p*4+3]=0;removed++;
 if(x)push(p-1);if(x<width-1)push(p+1);if(y)push(p-width);if(y<height-1)push(p+width);
}
await sharp(data,{raw:{width,height,channels:4}}).png().toFile(destination);
console.log(JSON.stringify({source,destination,width,height,backgroundPixelsRemoved:removed}));
