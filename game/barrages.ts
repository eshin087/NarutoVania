import {clamp} from './combat-core';
export const BARRAGE_IDS=['water-spirits','water-encirclement','needle-curtain','mirror-crossfire','diving-dragon'] as const;
export type BarrageId=typeof BARRAGE_IDS[number];
export type BarrageStyle='pairs'|'streams'|'crossing'|'surge'|'eruption'|'inward'|'central'|'curtain'|'diagonal'|'fan'|'mirror-fan'|'opposed'|'lunge'|'dive';
export interface BarrageDefinition{id:BarrageId;name:string;boss:'zabuza'|'haku';times:number[];duration:number;recovery:number;}
export const BARRAGES:Record<BarrageId,BarrageDefinition>={
 'diving-dragon':{id:'diving-dragon',name:'Skyfall Water Dragon',boss:'zabuza',times:[2450],duration:3950,recovery:3150},
 'water-spirits':{id:'water-spirits',name:'Ten Water Spirits',boss:'zabuza',times:[900,1560,2220,2880,3540,4700],duration:6600,recovery:5800},
 'water-encirclement':{id:'water-encirclement',name:'Water Dragon Encirclement',boss:'zabuza',times:[900,2100,3300,4700],duration:6600,recovery:5800},
 'needle-curtain':{id:'needle-curtain',name:'Crystal Needle Curtain',boss:'haku',times:[900,2100,3300,4700],duration:6600,recovery:5800},
 'mirror-crossfire':{id:'mirror-crossfire',name:'Mirror Crossfire',boss:'haku',times:[900,1900,2900,3900,5000],duration:6600,recovery:5800},
};
export const VARIANT_NAMES:Record<BarrageId,[string,string]>={
 'diving-dragon':['Ascending dragon · left arc','Ascending dragon · right arc'],
 'water-spirits':['Dragon pairs + crossing fan','Alternating streams + surge'],
 'water-encirclement':['Rising dragons + wave','Closing jaws + central dragon'],
 'needle-curtain':['Shifting curtains + diagonals','Diagonal curtains + falling fan'],
 'mirror-crossfire':['Four mirrors + lunge','Opposing mirrors + lunge'],
};
export function seededRandom(seed:number){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function chooseVariant(seed:number,previous?:number):0|1{return previous===undefined?(seededRandom(seed)()<.5?0:1):previous===0?1:0;}
export interface PreparedVolley{releaseTarget?:{x:number;y:number};handOrigin?:{x:number;y:number};secured?:boolean;omit?:boolean;index:number;at:number;targetX:number;gap:{left:number;right:number};lanes:number[];style:BarrageStyle;leftFirst:boolean;spread:number;seed:number;}
/** A224px corridor leaves a180px route after the player's44px body is considered.
 * Its center moves at most170px during a650ms buildup (416px/s running).
 * Emission discards old shots that could enter the new corridor before releasing it. */
export function prepareVolley(index:number,at:number,playerX:number,min:number,max:number,seed=1):PreparedVolley{
 const random=seededRandom(seed),center=clamp(playerX+(index%2?-170:170),min+130,max-130),gap={left:center-112,right:center+112},lanes:number[]=[];
 for(let x=min+38;x<=max-38;x+=76){const lane=x+(random()-.5)*14;if(lane<gap.left-52||lane>gap.right+52)lanes.push(lane);}
 return{index,at,targetX:playerX,gap,lanes,style:'curtain',leftFirst:random()<.5,spread:.85+random()*.3,seed};
}
function styles(id:BarrageId,variant:number):BarrageStyle[]{
 switch(id){case'diving-dragon':return ['dive'];case'water-spirits':return variant?['streams','streams','streams','streams','streams','surge']:['pairs','pairs','pairs','pairs','pairs','crossing'];
 case'water-encirclement':return variant?['inward','inward','inward','central']:['eruption','eruption','eruption','surge'];
 case'needle-curtain':return variant?['diagonal','diagonal','diagonal','fan']:['curtain','curtain','curtain','diagonal'];
 default:return variant?['opposed','opposed','opposed','opposed','lunge']:['mirror-fan','mirror-fan','mirror-fan','mirror-fan','lunge'];}
}
export class BarrageTimeline{
 age=0;prepared=new Map<number,PreparedVolley>();emitted=new Set<number>();readonly schedule:{at:number;style:BarrageStyle}[];
 constructor(public id:BarrageId,public min:number,public max:number,public escapeDirection=-1,public variant:0|1=0,public seed=173){
  const random=seededRandom(seed),pattern=styles(id,variant);this.schedule=this.definition.times.map((at,i)=>({at:at+(i?Math.round((random()-.5)*70):0),style:pattern[i]}));
 }
 get definition(){return BARRAGES[this.id];}
 tick(dt:number,playerX:number){this.age+=dt;const ready:PreparedVolley[]=[];
 this.schedule.forEach(({at,style},index)=>{if(this.age>=at-650&&!this.prepared.has(index))this.prepared.set(index,{...prepareVolley(this.id==='water-spirits'?(this.escapeDirection<0?1:0):index,at,playerX,this.min,this.max,this.seed+index*101),index,style});if(this.age>=at&&!this.emitted.has(index)){this.emitted.add(index);ready.push(this.prepared.get(index)!);}});return ready;}
 get warnings(){return [...this.prepared.values()].filter(v=>!this.emitted.has(v.index));}
 get recovering(){return this.age>=this.definition.recovery;}
 get done(){return this.age>=this.definition.duration;}
}
/** Cull a residual shot only if its remaining descent would occupy the next ground route. */
export function conflictsWithCorridor(p:{x:number;y:number;vx:number;vy:number;rx:number;ry:number},gap:{left:number;right:number},floor:number){
 const top=floor-150,bottom=floor+20;
 for(let ms=0;ms<=700;ms+=25){const x=p.x+p.vx*ms/1000,y=p.y+p.vy*ms/1000;if(y+p.ry>=top&&y-p.ry<=bottom&&x+p.rx>=gap.left&&x-p.rx<=gap.right)return true;}
 return false;
}
