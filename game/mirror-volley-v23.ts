import {entersCorridor,type MovingCore} from './presentation-v15';
/** Thin an unsafe fan before release; already-visible projectiles are never removed. */
export function selectMirrorVolley<T extends MovingCore & {i:number}>(playerX:number,min:number,max:number,floor:number,shots:T[],existing:MovingCore[],canDash:boolean){
 const required=Math.min(2,new Set(shots.map(s=>s.i)).size),reach=canDash?315:235;
 for(const offset of [170,-170,255,-255]){const center=Math.max(min+112,Math.min(max-112,playerX+offset)),gap={left:center-112,right:center+112};
  if(Math.abs(center-playerX)>reach||existing.some(p=>entersCorridor(p,gap,floor)))continue;
  const safe=shots.filter(p=>!entersCorridor(p,gap,floor));if(safe.length&&new Set(safe.map(p=>p.i)).size>=required)return{shots:safe,gap};
 }
 return null;
}
