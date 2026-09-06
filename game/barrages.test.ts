import {describe,it,expect} from 'vitest';
import {BARRAGE_IDS,BARRAGES,BarrageTimeline,prepareVolley} from './barrages';
import {animationFrame} from './animation-data';
import {UNIVERSAL,COMBAT} from './combat-core';
describe('signature barrages',()=>{
 for(const id of BARRAGE_IDS)it(`${id} locks aim, warns for 600ms and emits once`,()=>{const t=new BarrageTimeline(id,40,1500),seen:number[]=[];for(let ms=0;ms<5100;ms+=10){const before=new Map([...t.prepared].map(([i,v])=>[i,v.targetX]));seen.push(...t.tick(10,ms%2?100:1400).map(v=>v.index));for(const [i,x]of before)expect(t.prepared.get(i)?.targetX).toBe(x);for(const v of t.warnings)expect(v.at-t.age).toBeLessThanOrEqual(600);}expect(seen).toEqual(BARRAGES[id].times.map((_,i)=>i));expect(t.done).toBe(true);expect(BARRAGES[id].duration-BARRAGES[id].recovery).toBe(800);expect(BARRAGES[id].times[0]).toBeGreaterThanOrEqual(800);});
 it('keeps a reachable ground corridor at center and edges',()=>{for(const x of [40,80,770,1460,1500])for(let i=0;i<5;i++){const v=prepareVolley(i,900,x,40,1500);expect(v.gap.right-v.gap.left).toBeGreaterThanOrEqual(180);const center=(v.gap.left+v.gap.right)/2;expect(Math.abs(center-x)).toBeLessThan(COMBAT.speed*.6);expect(v.lanes.every(l=>l<v.gap.left-36||l>v.gap.right+36)).toBe(true);}});
 it('preserves player contact frames when recovery is shortened',()=>{for(const id of ['light1','light2','light3','aerial'] as const){const a=UNIVERSAL[id],at=a.events.find(e=>e.kind==='hit')!.at;expect(animationFrame(id,at,a.duration).index%6).toBe(id==='aerial'?2:3);expect(animationFrame(id,at-1,a.duration).index%6).toBe(id==='aerial'?1:2);}});
});
