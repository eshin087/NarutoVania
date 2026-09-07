import type {StoryPhaseId} from './chapter';
export const HOSTILE_SPEED=1.2;
export function ultimateGain(phase:StoryPhaseId,damage:number,ultimate:boolean){return ultimate?0:Math.max(0,damage)*(phase==='rescue'?.4:.16);}
/** Stable selection for the entire anticipation/contact sequence. */
export function mirrorOrigins(occupied:number,intact:number[],serial:number,count=2){
 if(occupied<0||!intact.includes(occupied))return [];
 const others=intact.filter(i=>i!==occupied);const result=[occupied];
 for(let n=0;n<Math.min(count-1,others.length);n++)result.push(others[(serial+n)%others.length]);
 return [...new Set(result)];
}
export const DIVE={gather:900,lock:1800,descend:2450,impact:2900,recover:3150,end:3950,width:250};
export function diveTarget(playerX:number,min:number,max:number){return Math.max(min+150,Math.min(max-150,playerX));}
