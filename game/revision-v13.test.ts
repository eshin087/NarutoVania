import {describe,it,expect} from 'vitest';
import {BARRAGE_IDS,BarrageTimeline,chooseVariant,conflictsWithCorridor} from './barrages';
import {MirrorExit,TargetedCinemaShot,clashStage} from './cinematic-motion';
import {StoryDirector} from './story-director';
import {ZABUZA_MOVES,HAKU_MOVES,MirrorFormation} from './boss-ai';
import {COMBAT} from './combat-core';
describe('v13 contact choreography',()=>{
 it('hits the staged target once, stops spinning, and expires after its attachment',()=>{const shot=new TargetedCinemaShot(1260,450,1013,485,1000);expect(shot.tick(200)).toBe(false);expect(shot.tick(200)).toBe(true);const angle=shot.rotation;expect([shot.x,shot.y]).toEqual([1013,485]);expect(shot.tick(200)).toBe(false);expect(shot.rotation).toBe(angle);expect(shot.done).toBe(false);shot.tick(280);expect(shot.done).toBe(true);});
 it('three needles keep their distinct contact points with a long frame',()=>{const shots=[-6,0,6].map(d=>new TargetedCinemaShot(1450,470+d,1288,451+d,1150,false));expect(shots.map(s=>s.tick(300))).toEqual([true,true,true]);expect(new Set(shots.map(s=>s.y)).size).toBe(3);expect(shots.map(s=>s.tick(50))).toEqual([false,false,false]);});
 it('opposing dragon surges end at the contact stage before dissipation',()=>{expect(clashStage(1399)).toBe('surge');expect(clashStage(1400)).toBe('contact');expect(clashStage(1620)).toBe('collapse');expect(clashStage(2350)).toBe('spray');expect(clashStage(3000)).toBe('done');});
 it('departure completion waits for the whole carrying sprite',()=>{let ready=false;const d=new StoryDirector('copy',{enter:()=>{},cinematic:()=>{},cue:()=>{},complete:()=>{},ready:()=>ready});d.play({id:'carry-test',duration:100,arena:'lakeside',actors:[],cues:[]},()=>d.mode='fight');d.update(500);expect(d.mode).toBe('cinematic');ready=true;d.update(16);expect(d.mode).toBe('fight');});
});
describe('mirror descent',()=>{
 const formation=new MirrorFormation();formation.create(830,590);
 for(const mirror of formation.mirrors)it(`falls from mirror ${mirror.x}/${mirror.y} with exactly650ms of grounded stagger`,()=>{const fall=new MirrorExit(mirror.x,Math.min(590,mirror.y+62),590,true);let last=fall.y;for(let i=0;i<200&&!fall.done;i++){fall.tick(16);expect(fall.y).toBeGreaterThanOrEqual(last);expect(fall.y).toBeLessThanOrEqual(590);last=fall.y;}expect(fall.landedAt).not.toBeNull();expect(fall.done).toBe(true);expect(fall.age-fall.landedAt!).toBeGreaterThanOrEqual(650);expect(fall.age-fall.landedAt!).toBeLessThan(666);});
 it('natural expiry lands without a stun duration',()=>{const fall=new MirrorExit(100,300,590,false);while(fall.landedAt===null)fall.tick(10);fall.tick(249);expect(fall.done).toBe(false);fall.tick(1);expect(fall.done).toBe(true);expect(fall.stunned).toBe(false);});
});
describe('seeded barrage safety',()=>{
 for(const id of BARRAGE_IDS)for(const variant of [0,1] as const)it(`${id}/${variant} is deterministic and leaves a reachable ground route`,()=>{
  for(let seed=1;seed<=40;seed++)for(const playerX of [70,830,1590]){
   const a=new BarrageTimeline(id,70,1590,-1,variant,seed),b=new BarrageTimeline(id,70,1590,-1,variant,seed),seen:number[]=[];
   for(let t=0;t<6800;t+=25){seen.push(...a.tick(25,playerX).map(v=>v.index));b.tick(25,playerX);for(const v of a.warnings){expect(v.gap.right-v.gap.left-44).toBeGreaterThanOrEqual(180);expect(Math.abs((v.gap.left+v.gap.right)/2-playerX)).toBeLessThanOrEqual(COMBAT.speed*.65);expect(v.lanes.every(x=>x<v.gap.left-52||x>v.gap.right+52)).toBe(true);}}
   expect([...a.prepared]).toEqual([...b.prepared]);expect(new Set(seen).size).toBe(a.schedule.length);expect(a.done).toBe(true);expect(a.definition.duration-a.definition.recovery).toBe(800);
  }
 });
 it('never repeats a family variant and detects conflicting residual shots',()=>{for(let seed=0;seed<50;seed++){expect(chooseVariant(seed,0)).toBe(1);expect(chooseVariant(seed,1)).toBe(0);}expect(conflictsWithCorridor({x:600,y:100,vx:0,vy:800,rx:18,ry:3},{left:500,right:720},590)).toBe(true);expect(conflictsWithCorridor({x:200,y:100,vx:0,vy:800,rx:18,ry:3},{left:500,right:720},590)).toBe(false);});
 it('preserves ordinary, combo and red reaction floors',()=>{for(const move of [...ZABUZA_MOVES,...HAKU_MOVES])move.events.forEach((event,i)=>{const prior=move.events[i-1]?.at||0;expect(event.at-prior).toBeGreaterThanOrEqual(event.red?600:i?250:400);});});
});
