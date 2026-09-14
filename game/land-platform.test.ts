import {describe,it,expect} from 'vitest';
import {Combatant} from './combat-core';
import {LandPlatformControls,LandLaunch,launchAllowed} from './land-platform';
import {NORMALS} from './platform-combat';
import {keyboardAction,mapGamepad,type Action} from './battle-input';

function setup(){
 const p=new Combatant('naruto');p.grounded=true;
 const body={velocity:{x:0,y:0},setVelocityX(x:number){this.velocity.x=x;},setVelocityY(y:number){this.velocity.y=y;},setVelocity(x:number,y:number){this.velocity={x,y};}};
 let held:Action[]=[],edges:Action[]=[],releases:Action[]=[];
 const input={held:(a:Action)=>held.includes(a),pressed:(a:Action)=>edges.includes(a),released:(a:Action)=>releases.includes(a)};
 const set=(h:Action[],e:Action[]=h,r:Action[]=[])=>{held=h;edges=e;releases=r;};
 return{p,body,input,set,c:new LandPlatformControls()};
}
describe('Land of Waves platform controls',()=>{
 it('uses free directional normals and keeps the stationary jab',()=>{
  const {p,body,input,set,c}=setup();p.stamina=0;set(['up','melee']);c.actions(p,body,input,1000);
  expect(p.action?.definition.id).toBe('pf-tilt-up');expect(p.stamina).toBe(0);
  p.action=null;set(['melee']);c.actions(p,body,input,2000);c.move(p,body,input,2000,16);
  expect((p as Combatant).action?.definition.id).toBe('pf-jab1');expect(body.velocity.x).toBe(0);
 });
 it('keeps facing when drifting backward and selects a back aerial',()=>{
  const {p,body,input,set,c}=setup();p.grounded=false;p.facing=1;set(['left','melee']);c.actions(p,body,input,1000);
  expect(p.facing).toBe(1);expect(p.action?.definition.id).toBe('pf-air-back');
 });
 it('charges K then releases exactly once without consuming chakra or stamina',()=>{
  const {p,body,input,set,c}=setup();set(['tool','up']);c.actions(p,body,input,1000);expect(p.chargeStarted).toBe(1000);
  set([],[],['tool']);c.actions(p,body,input,1700);expect(p.action?.definition.id).toBe('pf-smash-up');expect(p.action?.charge).toBeCloseTo(1.56);
  const serial=p.action?.serial;c.actions(p,body,input,1710);expect(p.action?.serial).toBe(serial);expect(p.stamina).toBe(100);
 });
 it('permits one double jump and one directional air dodge',()=>{
  const {p,body,input,set,c}=setup();set(['jump']);c.actions(p,body,input,1000);expect(body.velocity.y).toBeLessThan(-500);
  set([],[],['jump']);c.actions(p,body,input,1100);set(['jump']);c.actions(p,body,input,1200);const vy=body.velocity.y;
  set(['jump']);c.actions(p,body,input,1400);expect(body.velocity.y).toBe(vy);
  set(['right','up','dash']);c.actions(p,body,input,1600);c.move(p,body,input,1600,16);
  expect(body.velocity.x).toBeGreaterThan(400);expect(body.velocity.y).toBeLessThan(-400);expect(p.airDashUsed).toBe(true);
 });
 it('ends aerial attacks on landing and clears buffered state at handoffs',()=>{
  const {p,body,input,set,c}=setup();p.grounded=false;set(['melee']);c.actions(p,body,input,1000);
  p.grounded=true;set([]);c.actions(p,body,input,1100);expect(p.action).toBeNull();expect(c.landingUntil).toBeGreaterThan(1100);
  c.reset();expect(c.landingUntil).toBe(0);expect(c.buffered).toBeNull();
 });
 it('maps I and L3 to the preserved ranged tool independently of K/Y smash',()=>{
  expect(keyboardAction({code:'KeyI',key:'i'})).toBe('ranged');expect(keyboardAction({code:'KeyK',key:'k'})).toBe('tool');
  const buttons=Array.from({length:16},(_,i)=>({pressed:i===10,value:i===10?1:0,touched:false}));
  expect(mapGamepad({axes:[0,0],buttons})).toEqual(new Set(['ranged']));
 });
});
describe('Launch ownership and escape',()=>{
 it.each(['mirror','barrage','sword','restraint','committedRed'] as const)('preserves %s choreography ownership',key=>{
  expect(launchAllowed({mirror:false,barrage:false,sword:false,restraint:false,committedRed:false,[key]:true})).toBe(false);
 });
 it('keeps boss airborne until landing and bounds repeated launch chains',()=>{
  const l=new LandLaunch(),e=NORMALS.up.events[1];expect(l.hit(e,1,1000)?.y).toBeLessThan(0);
  expect(l.tick(1400,false)).toBe(true);expect(l.tick(1500,true)).toBe(true);expect(l.active).toBe(false);expect(l.tick(1721,true)).toBe(false);
  l.hit(e,1,1600);l.hit(e,1,1800);expect(l.hit(e,1,2000)?.y).toBe(380);expect(l.hit(e,1,2200)).toBeNull();
  l.reset();expect(l.active).toBe(false);expect(l.escapeUntil).toBe(0);
 });
});
