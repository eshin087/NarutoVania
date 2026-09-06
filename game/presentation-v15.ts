export const BODY_HEIGHT={kakashi:157,naruto:132,sasuke:135,sakura:135,zabuza:167,haku:146} as const;
export function quietIdleFrame(age:number,offset=0){const t=(Math.max(0,age)+offset)%4800;return t<4200?6:7;}
export const MIRROR_LAYOUT={prison:{width:130,height:230,interiorWidth:100,interiorHeight:180},crossfire:{width:100,height:184,interiorWidth:84,interiorHeight:160}};
export function mirrorLayout(x:number,y:number,floor:number,kind:keyof typeof MIRROR_LAYOUT='prison'){
 const size=MIRROR_LAYOUT[kind],cy=Math.min(y,floor-size.height/2);
 return{x,y:cy,...size,feet:cy+size.interiorHeight/2-6};
}
export type WaterEndReason='ground'|'fighter'|'cancel';
export interface WaterPresentation{phase:'travel'|'impact'|'dissipate';at:number;reason?:WaterEndReason;}
export function waterFrame(age:number){return 4+Math.floor(Math.max(0,age)/65)%8;}
export function groundContact(x:number,y:number,nx:number,ny:number,floor:number,radius:number){
 if(ny+radius<floor||ny<=y)return null;const t=Math.max(0,Math.min(1,(floor-radius-y)/(ny-y)));return{x:x+(nx-x)*t,y:floor-radius};
}
export interface MovingCore{x:number;y:number;vx:number;vy:number;rx:number;ry:number;}
export function entersCorridor(p:MovingCore,gap:{left:number;right:number},floor:number,delay=0){
 for(let ms=delay;ms<=delay+900;ms+=20){const x=p.x+p.vx*ms/1000,y=p.y+p.vy*ms/1000;if(y+p.ry>=floor-150&&y-p.ry<=floor&&x+p.rx>=gap.left&&x-p.rx<=gap.right)return true;}return false;
}
/** Choose a reachable route against existing flight paths before warning/launch. */
export function chooseCorridor(playerX:number,preferred:{left:number;right:number},min:number,max:number,shots:MovingCore[],floor:number){
 const centers=[(preferred.left+preferred.right)/2,playerX,playerX-85,playerX+85,playerX-170,playerX+170];
 for(const candidate of centers){const center=Math.max(min+130,Math.min(max-130,candidate)),gap={left:center-112,right:center+112};if(Math.abs(center-playerX)<=210&&!shots.some(p=>entersCorridor(p,gap,floor,400)))return gap;}return null;
}

/** First contact of a moving projectile core against a fighter or mirror. */
export function sweptContact(x:number,y:number,nx:number,ny:number,rx:number,ry:number,box:{x:number;y:number;width:number;height:number}){
 let entry=0,exit=1;
 for(const [start,delta,min,max] of [[x,nx-x,box.x-rx,box.x+box.width+rx],[y,ny-y,box.y-ry,box.y+box.height+ry]]){
  if(Math.abs(delta)<.000001){if(start<min||start>max)return null;continue;}
  const a=(min-start)/delta,b=(max-start)/delta;entry=Math.max(entry,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));if(entry>exit)return null;
 }
 return{x:x+(nx-x)*entry,y:y+(ny-y)*entry};
}
