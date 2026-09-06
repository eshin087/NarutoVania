import {describe,it,expect,vi,afterEach} from 'vitest';
import {StoryDirector} from './story-director';
import {DEBUG_ENTRIES} from './scene-catalog';
import {bossBridge as bridge} from './boss-bridge';
import {bossParryEligible,BossBrain} from './boss-ai';
import {Combatant} from './combat-core';
import {redOutline,outlineHits} from './attack-geometry';
import {animationFrame} from './animation-data';
const make=()=>new StoryDirector('mist',{enter:()=>{},cinematic:()=>{},cue:()=>{},complete:()=>{}});
afterEach(()=>vi.unstubAllGlobals());
describe('held manga panels and isolated scene selection',()=>{
 it('freezes the story clock, refuses an early confirmation, and advances only one gate',()=>{
  const d=make();d.startScene('shuriken');d.update(20000);expect(d.clock).toBe(3500);expect(d.waiting).toBe(true);expect(d.advance()).toBe(false);
  d.update(349);expect(d.clock).toBe(3500);expect(d.advance()).toBe(false);d.update(1);expect(d.advance()).toBe(true);
  d.update(20000);expect(d.clock).toBe(10800);expect(d.waiting).toBe(true);
 });
 it('skips only the current transition',()=>{const d=make();d.startScene('shuriken');d.skip();expect(d.clip?.id).toBe('hunter-nin-deception');d.skip();expect(d.clip?.id).toBe('simultaneous-bridge-battles');});
 it('requires the snowy ending panel acknowledgment before completion',()=>{const d=make();d.startScene('snow');d.update(99999);expect(d.state.complete).toBe(false);expect(d.waiting).toBe(true);d.update(99999);expect(d.state.complete).toBe(false);d.advance();d.update(99999);expect(d.state.complete).toBe(true);});
 it.each(DEBUG_ENTRIES)('initializes $id through canonical state',e=>{const d=new StoryDirector(e.phase,{enter:()=>{},cinematic:()=>{},cue:()=>{},complete:()=>{}});if(e.scene)d.startScene(e.scene);else d.start(false);expect(d.mode).toBe(e.kind==='scene'?'cinematic':'fight');});
 it('never writes normal progress or viewed history during a debug run',()=>{const setItem=vi.fn();vi.stubGlobal('localStorage',{setItem});bridge.reset();bridge.checkpoint('rescue');bridge.patch({elapsed:73,parries:9,retries:2});const before=bridge.get().seen;setItem.mockClear();bridge.beginDebug('fight-seal');bridge.patch({elapsed:999,parries:44,retries:7});bridge.checkpoint('seal');bridge.beginDebug('snow');bridge.checkpoint('lightning');expect(setItem).not.toHaveBeenCalled();expect(bridge.get().seen).toEqual(before);bridge.endDebug();expect(bridge.get().checkpoint).toBe('rescue');expect(bridge.get()).toMatchObject({elapsed:73,parries:9,retries:2});});
});
describe('readable parries and geometry',()=>{
 it('uses a 140ms stance window with frontal light-only deflection',()=>{const can=(age:number,action='light1',red=false,from=100,stamina=100,used=false)=>bossParryEligible(age,action,red,from,0,1,stamina,used);expect(can(449)).toBe(false);expect(can(450)).toBe(true);expect(can(589,'aerial')).toBe(true);expect(can(590)).toBe(false);for(const action of ['heavy','technique','ultimate'])expect(can(500,action)).toBe(false);expect(can(500,'light1',true)).toBe(false);expect(can(500,'light1',false,-100)).toBe(false);expect(can(500,'light1',false,100,0)).toBe(false);expect(can(500,'light1',false,100,100,true)).toBe(false);});
 it('requires ten seconds and two offensive moves between independent stance commitments',()=>{const b=new Combatant('zabuza',1250,true),brain=new BossBrain(b,'mist',()=>0);brain.attacks=2;expect(brain.choose(10000,100,false)?.id).toBe('parry-stance');b.action=null;b.stamina=100;brain.attacks=4;expect(brain.choose(19000,100,false)?.id).not.toBe('parry-stance');b.action=null;brain.readyAt=0;b.stamina=100;brain.attacks=3;expect(brain.choose(21000,100,false)?.id).not.toBe('parry-stance');b.action=null;brain.readyAt=0;b.stamina=100;brain.attacks=4;expect(brain.choose(22000,100,false)?.id).toBe('parry-stance');});
 it('matches directional sweep and low wave footprints while preserving safe space',()=>{const event={kind:'hit' as const,at:800,range:190,height:140,red:true};for(const facing of [-1,1]){const p=redOutline('cleave',500,590,facing,event);expect(outlineHits(p,{x:500+facing*90-10,y:490,width:20,height:40})).toBe(true);expect(outlineHits(p,{x:500-facing*100,y:490,width:20,height:40})).toBe(false);}const wave=redOutline('great-waterfall',500,590,1,event);expect(outlineHits(wave,{x:490,y:500,width:20,height:30})).toBe(true);expect(outlineHits(wave,{x:490,y:350,width:20,height:40})).toBe(false);});
 it('lands the aerial contact on the third frame at the unchanged 145ms event',()=>{expect(animationFrame('aerial',144,430)).toMatchObject({sheet:'aerial',index:1});expect(animationFrame('aerial',145,430)).toMatchObject({sheet:'aerial',index:2});});
});
