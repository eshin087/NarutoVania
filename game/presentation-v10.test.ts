import {describe,it,expect} from 'vitest';
import {ReturningSword} from './returning-sword';
import {ZABUZA_MOVES} from './boss-ai';
import {StoryDirector} from './story-director';
describe('returning sword',()=>{
 it('travels fast, waits at turnaround, and catches the moving owner',()=>{const s=new ReturningSword(100,100,1,0,220);s.step(100,{x:100,y:100});expect(s.x).toBe(265);s.hit.add('player');s.step(100,{x:100,y:100});expect(s.phase).toBe('turnaround');s.step(119,{x:100,y:100});expect(s.phase).toBe('turnaround');s.step(1,{x:100,y:100});expect(s.hit.size).toBe(0);s.step(80,{x:150,y:100});expect(s.x).toBe(170);s.step(100,{x:160,y:105});expect(s.phase).toBe('caught');expect(s.x).toBe(160);expect(s.y).toBe(105);});
 it('deflection disables both remaining passes and returns immediately',()=>{const s=new ReturningSword(400,100,1,0,500);s.parry();expect(s.step(100,{x:100,y:100}).damaging).toBe(false);expect(s.x).toBe(212.5);s.step(200,{x:100,y:100});expect(s.phase).toBe('caught');});
 it('preserves the full 700ms anticipation and existing damage',()=>{const m=ZABUZA_MOVES.find(m=>m.id==='sword-throw')!;expect(m.events[0].at).toBe(700);expect(m.events[0].damage).toBe(13);expect(m.events[0].speed).toBe(1100);});
});
describe('scene handoff',()=>{it('keeps incoming scene creation behind the transition callback',()=>{let next:(()=>void)|undefined;let entries=0;const d=new StoryDirector('mist',{enter:()=>entries++,cinematic:()=>{},cue:()=>{},complete:()=>{},transition:n=>next=n});d.startScene('arrival');d.skip();expect(entries).toBe(0);expect(next).toBeTypeOf('function');next!();expect(entries).toBe(1);expect(d.mode).toBe('fight');});});
