import type {AttackEvent} from './combat-core';
export interface Point{x:number;y:number}
export interface HitRect{x:number;y:number;width:number;height:number}
/** One outline is used by both anticipation rendering and active damage. */
export function redOutline(id:string,x:number,feet:number,facing:number,event:AttackEvent):Point[]{
 if(id==='great-waterfall')return [{x:x-95,y:feet},{x:x-95,y:feet-65},{x:x-58,y:feet-122},{x:x+5,y:feet-145},{x:x+66,y:feet-113},{x:x+95,y:feet-48},{x:x+95,y:feet}];
 const range=event.range||190,height=event.height||140,cy=feet-height/2;
 if(id.includes('lunge')||id.includes('rush')){const r=Math.min(35,height/2),a=x+facing*(8+r),b=x+facing*(range-r),pts:Point[]=[];
  for(let i=0;i<=8;i++){const t=-Math.PI/2+i*Math.PI/8;pts.push({x:b+facing*Math.cos(t)*r,y:cy+Math.sin(t)*height/2});}
  for(let i=0;i<=8;i++){const t=Math.PI/2+i*Math.PI/8;pts.push({x:a+facing*Math.cos(t)*r,y:cy+Math.sin(t)*height/2});}return pts;
 }
 const pts:Point[]=[{x:x+facing*8,y:cy}];for(let i=0;i<=16;i++){const a=-Math.PI/2+i*Math.PI/16;pts.push({x:x+facing*(8+Math.cos(a)*range),y:cy+Math.sin(a)*height/2});}return pts;
}
function inside(p:Point,poly:Point[]){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
function cross(a:Point,b:Point,c:Point){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function intersect(a:Point,b:Point,c:Point,d:Point){return cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))<=Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))&&Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y))<=Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y));}
export function outlineHits(poly:Point[],r:HitRect){const corners=[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
 return corners.some(p=>inside(p,poly))||poly.some(p=>p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height)||poly.some((a,i)=>corners.some((c,j)=>intersect(a,poly[(i+1)%poly.length],c,corners[(j+1)%4])));
}
