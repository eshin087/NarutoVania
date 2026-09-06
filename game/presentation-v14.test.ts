import {describe,it,expect} from 'vitest';
import art from '../public/art-v14/character-manifest.json';
import effects from '../public/art-v14/fx-manifest.json';
import {Combatant,UNIVERSAL} from './combat-core';
import {StoryDirector} from './story-director';
import {STORY_SCENES} from './scene-catalog';
import {dialogueDuration,flowFrame,ULTIMATE_END} from './presentation-v14';
describe('V14 animation and story invariants',()=>{
 it('has complete movement and alternate melee sheets with valid grounded anchors',()=>{
  expect(art.assets).toHaveLength(16);let count=0;
  for(const a of art.assets){expect(a.frames).toHaveLength(a.key.endsWith('melee')?36:16);for(const f of a.frames){count++;const[x,y,w,h]=f.rect;expect(x+w).toBeLessThanOrEqual(a.width);expect(y+h).toBeLessThanOrEqual(a.height);expect(f.footAnchor[0]).toBeGreaterThan(0);expect(f.footAnchor[1]).toBeLessThanOrEqual(h);expect(f.standingBodyHeight).toBe(a.standingBodyHeight);}}
  expect(count).toBe(416);
 });
 it('locks a choreography for all three strikes and changes only at the next combo',()=>{
  const p=new Combatant('naruto');p.start(UNIVERSAL.light1,0);const initial=p.choreography;p.update(500,500);p.start(UNIVERSAL.light2,500);expect(p.choreography).toBe(initial);p.update(1000,500);p.start(UNIVERSAL.light3,1000);expect(p.choreography).toBe(initial);p.update(1700,700);p.start(UNIVERSAL.light1,1700);expect(p.choreography).not.toBe(initial);
 });
 it.each(STORY_SCENES)('%s contains automatic dialogue and no art-panel gates',id=>{
  const d=new StoryDirector('mist',{enter:()=>{},cinematic:()=>{},cue:()=>{},complete:()=>{}});d.startScene(id);expect(d.clip?.cues.every(c=>!c.awaitAdvance&&c.manga===undefined&&c.moment===undefined)).toBe(true);d.update(500);expect(d.waiting).toBe(false);
 });
 it('retains eight travel frames and four distinct impact frames',()=>{
  const travel=new Set(Array.from({length:8},(_,i)=>flowFrame(180+i*65,2000)));expect(travel.size).toBe(8);expect(flowFrame(1761,2000)).toBe(12);expect(flowFrame(1999,2000)).toBe(15);for(const a of Object.values(effects.textures))for(const f of a.frames){expect(f.rect[0]+f.rect[2]).toBeLessThanOrEqual(a.width);expect(f.rect[1]+f.rect[3]).toBeLessThanOrEqual(a.height);}
 });
 it('bounds reading time and ultimate presentation without changing combat damage',()=>{expect(dialogueDuration('Go!')).toBe(2500);expect(dialogueDuration('word '.repeat(50))).toBe(5500);expect(ULTIMATE_END).toBe(2000);});
});
