import {describe,it,expect} from 'vitest';
import sharp from 'sharp/lib/index';
import assets from './assets.json';
import {TUNE,SURFACES,canSpend,damageResult,gainUltimate,intersects,meleeBounds,safeSubstituteX,gamepadActions} from './rules';
describe('combat rules',()=>{
 it('prevents repeated contact damage during immunity and clamps lethal damage',()=>{
  expect(damageResult(100,1000,999,18)).toEqual({health:100,damage:0});
  expect(damageResult(100,1000,1000,18)).toEqual({health:82,damage:18});
  expect(damageResult(7,0,1000,18)).toEqual({health:0,damage:7});
  expect(damageResult(0,0,1000,18)).toEqual({health:0,damage:0});
 });
 it('requires both chakra and completed cooldown for ninjutsu',()=>{
  expect(canSpend(29,0,TUNE.cloneCost)).toBe(false);expect(canSpend(100,.01,TUNE.cloneCost)).toBe(false);
  expect(canSpend(30,0,TUNE.cloneCost)).toBe(true);expect(canSpend(25,-1,TUNE.subCost)).toBe(true);
 });
 it('charges the ultimate only from positive damage and caps it',()=>{
  expect(gainUltimate(90,200)).toBe(100);expect(gainUltimate(10,-100)).toBe(10);expect(gainUltimate(0,100)).toBe(15);
 });
 it('hits in the facing direction and gives finishers longer reach',()=>{
  const right=meleeBounds(500,500,1),left=meleeBounds(500,500,-1);
  expect(intersects(right,{x:570,y:500,w:30,h:100})).toBe(true);
  expect(intersects(left,{x:570,y:500,w:30,h:100})).toBe(false);
  expect(meleeBounds(500,500,1,true).w).toBeGreaterThan(right.w);
 });
});
describe('traversal and substitution',()=>{
 it('finds safe ground instead of substituting into a gap',()=>{
  const x=safeSubstituteX(1335,602,1,SURFACES,0,8120);
  expect(x).toBe(1335); // Every backward candidate falls inside the gap or too near its edge.
 });
 it('keeps substitution within both boss arena bounds',()=>{
  for(const facing of [-1,1])for(const x of [3920,4010,5130]){
   const next=safeSubstituteX(x,602,facing,SURFACES,3900,5160);expect(next).toBeGreaterThanOrEqual(3930);expect(next).toBeLessThanOrEqual(5130);
  }
 });
 it('can reach every raised platform with a fully held jump',()=>{
  const rise=TUNE.jump*TUNE.jump/(2*TUNE.gravity);for(const platform of SURFACES.filter(s=>s.y<590))expect(602-platform.y).toBeLessThan(rise);
 });
});
describe('standard gamepad mapping',()=>{
 const pad=(buttons:number[],axis=0)=>({axes:[axis,0],buttons:Array.from({length:16},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0}))});
 it('maps every attack and jump without conflicts',()=>{expect([...gamepadActions(pad([0,1,2,3,4,5]))].sort()).toEqual(['clones','jump','melee','rasengan','shuriken','substitute'].sort());});
 it('filters stick drift and supports the d-pad',()=>{
  expect(gamepadActions(pad([],.2)).size).toBe(0);expect(gamepadActions(pad([],-.5)).has('left')).toBe(true);expect(gamepadActions(pad([15])).has('right')).toBe(true);
 });
});
describe('generated sprite contract',()=>{
 for(const [name,atlas]of Object.entries(assets))it(`${name} has 16 bounded frames and real transparency`,async()=>{
  const file=name==='props'?'props-effects.png':`${name}-sprites.png`,meta=await sharp(`public/art/${file}`).metadata();
  expect(meta.hasAlpha).toBe(true);expect(atlas.alphaRatio).toBeGreaterThan(.25);expect(atlas.frames).toHaveLength(16);
  for(const f of atlas.frames){expect(f.x).toBeGreaterThanOrEqual(0);expect(f.y).toBeGreaterThanOrEqual(0);expect(f.x+f.w).toBeLessThanOrEqual(meta.width!);expect(f.y+f.h).toBeLessThanOrEqual(meta.height!);expect(f.ox).toBeGreaterThanOrEqual(0);expect(f.ox).toBeLessThanOrEqual(1);}
 });
});
