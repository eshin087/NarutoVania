import {clamp} from './combat-core';
export const BARRAGE_IDS=['water-spirits','water-encirclement','needle-curtain','mirror-crossfire'] as const;
export type BarrageId=typeof BARRAGE_IDS[number];
export interface BarrageDefinition{id:BarrageId;name:string;boss:'zabuza'|'haku';times:number[];duration:number;recovery:number;}
export const BARRAGES:Record<BarrageId,BarrageDefinition>={
 'water-spirits':{id:'water-spirits',name:'Ten Water Spirits',boss:'zabuza',times:[900,1260,1620,1980,2340],duration:5000,recovery:4200},
 'water-encirclement':{id:'water-encirclement',name:'Water Dragon Encirclement',boss:'zabuza',times:[900,1800,2700],duration:4300,recovery:3500},
 'needle-curtain':{id:'needle-curtain',name:'Crystal Needle Curtain',boss:'haku',times:[900,1800,2700],duration:4300,recovery:3500},
 'mirror-crossfire':{id:'mirror-crossfire',name:'Mirror Crossfire',boss:'haku',times:[900,1500,2100,2700,3900],duration:5000,recovery:4200},
};
export interface PreparedVolley{index:number;at:number;targetX:number;gap:{left:number;right:number};lanes:number[];}
/** A 180px corridor is at most200px away, reachable by foot during its600ms warning. */
export function prepareVolley(index:number,at:number,playerX:number,min:number,max:number):PreparedVolley{
 const center=clamp(playerX+(index%2?-200:200),min+110,max-110);
 const gap={left:center-90,right:center+90};const lanes:number[]=[];
 for(let x=min+35;x<=max-35;x+=75)if(x<gap.left-36||x>gap.right+36)lanes.push(x);
 return{index,at,targetX:playerX,gap,lanes};
}
export class BarrageTimeline{
 age=0;prepared=new Map<number,PreparedVolley>();emitted=new Set<number>();
 constructor(public id:BarrageId,public min:number,public max:number,public escapeDirection=-1){}
 get definition(){return BARRAGES[this.id];}
 tick(dt:number,playerX:number){this.age+=dt;const ready:PreparedVolley[]=[];
 this.definition.times.forEach((at,index)=>{if(this.age>=at-600&&!this.prepared.has(index))this.prepared.set(index,{...prepareVolley(this.id==='water-spirits'?(this.escapeDirection<0?1:0):index,at,playerX,this.min,this.max),index});if(this.age>=at&&!this.emitted.has(index)){this.emitted.add(index);ready.push(this.prepared.get(index)!);}});return ready;}
 get warnings(){return [...this.prepared.values()].filter(v=>!this.emitted.has(v.index));}
 get recovering(){return this.age>=this.definition.recovery;}
 get done(){return this.age>=this.definition.duration;}
}

export function spiritTarget(v:PreparedVolley,_originX:number,floor:number){return{x:(v.gap.left+v.gap.right)/2,y:floor+80};}
