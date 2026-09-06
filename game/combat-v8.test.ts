import {describe,it,expect} from 'vitest';
import {ZABUZA_MOVES} from './boss-ai';
import {swordPresentation} from './sword-presentation';
import {SupportBrain,type SupportSense} from './support-ai';
import {StoryDirector} from './story-director';
import {Combatant} from './combat-core';
import {kit} from './chapter';

describe('sword anticipation and parry rhythm',()=>{
 it('holds anticipation before each hit and shows contact only on the hit event',()=>{
  for(const attack of ZABUZA_MOVES){for(const hit of attack.events.filter(e=>e.kind==='hit')){
   expect(swordPresentation(attack,hit.at-1)!.frame%6).toBe(2);
   expect(swordPresentation(attack,hit.at)!.frame%6).toBe(3);
   expect(swordPresentation(attack,hit.at+100)!.frame%6).toBe(4);
  }}
 });
 it('varies the three-hit string and distinguishes red overheads',()=>{
  const attack=ZABUZA_MOVES.find(m=>m.id==='sword-string')!;
  expect(attack.events.map(e=>swordPresentation(attack,e.at)?.row)).toEqual([0,1,3]);
  expect(attack.events[0].at).toBeGreaterThanOrEqual(500);
  const red=ZABUZA_MOVES.find(m=>m.id==='delayed-cleave')!;
  expect(swordPresentation(red,red.events[0].at-1)).toMatchObject({row:2,red:true,frame:14});
 });
 it('rewards successive deliberate parries without prematurely cancelling the string',()=>{
  const boss=new Combatant('zabuza',1250,true),p=new Combatant('kakashi');boss.x=100;p.x=0;
  const attack=ZABUZA_MOVES.find(m=>m.id==='sword-string')!;boss.start(attack,0);const before=boss.stamina;
  for(const hit of attack.events){p.setGuard(false,false,hit.at-80);p.setGuard(true,true,hit.at-70);
   const out=p.receive({damage:hit.damage!,posture:hit.posture!,red:false,fromX:100},hit.at);
   expect(out.result).toBe('parry');boss.deflected(out.attackerPosture,hit.at);
  }
  expect(boss.stamina).toBeLessThan(before-60);expect(p.health).toBe(100);expect(p.ultimate).toBe(36);
 });
});
describe('Sasuke rescue support',()=>{
 const sense:SupportSense={now:5000,canAct:true,stamina:100,distance:300,redIn:Infinity,ordinaryIn:Infinity,recovering:false,spellReady:true};
 it('dodges red attacks and parries ordinary attacks with a bounded response cadence',()=>{
  const brain=new SupportBrain();expect(brain.decide({...sense,redIn:250,ordinaryIn:90})).toBe('dodge');
  expect(brain.decide({...sense,now:5050,ordinaryIn:90})).not.toBe('parry');
  expect(brain.decide({...sense,now:6100,ordinaryIn:90})).toBe('parry');
 });
 it('casts periodically, retreats from pressure, and waits during action recovery',()=>{
  const brain=new SupportBrain();expect(brain.decide(sense)).toBe('spell');
  expect(brain.decide({...sense,now:6000})).not.toBe('spell');
  expect(brain.decide({...sense,now:12000})).toBe('spell');
  expect(brain.decide({...sense,distance:130})).toBe('retreat');
  expect(brain.decide({...sense,canAct:false,redIn:50})).toBe('wait');
 });
 it('requires chakra for the new illusion and makes its one-second stagger expire',()=>{
  const p=new Combatant('naruto'),boss=new Combatant('zabuza',850,true),spell=kit('rescue')[1].attack;
  expect(spell.id).toBe('glamour');p.chakra=23;expect(p.start(spell,0)).toBe(false);
  p.chakra=24;expect(p.start(spell,0)).toBe(true);expect(p.chakra).toBe(0);
  boss.stagger(240,1000);expect(boss.canAct(1239)).toBe(false);expect(boss.canAct(1240)).toBe(true);
 });
});
describe('removed post-rescue duel',()=>{
 it('routes rescue through the hunter and bridge scenes directly to Sasuke',()=>{
  const entries:string[]=[],clips:string[]=[];const d=new StoryDirector('rescue',{enter:s=>entries.push(s.phase),cinematic:c=>clips.push(c.id),cue:()=>{},complete:()=>{}});
  d.start(false);d.finishObjective();for(let i=0;d.mode==='cinematic'&&i<100;i++){d.update(d.clip!.duration+1);if(d.waiting){d.update(400);d.advance();}}
  expect(entries).toEqual(['rescue','mirrors']);expect(clips).toEqual(['transformed-shuriken','hunter-nin-deception','simultaneous-bridge-battles']);
 });
 it('migrates old copy-duel saves to the same next playable phase',()=>{
  const entries:string[]=[];const d=new StoryDirector('copy',{enter:s=>entries.push(s.phase),cinematic:()=>{},cue:()=>{},complete:()=>{}});
  d.start(false);expect(entries).toEqual([]);d.skip();expect(d.clip?.id).toBe('simultaneous-bridge-battles');d.skip();expect(entries).toEqual(['mirrors']);expect(d.state.kakashiCaptured).toBe(false);
 });
});
