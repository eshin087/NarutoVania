import {describe,it,expect} from 'vitest';
import {quietIdleFrame,mirrorLayout,groundContact,waterFrame,chooseCorridor,entersCorridor,sweptContact} from './presentation-v15';
describe('stable animation and explicit projectile presentation',()=>{
 it('holds the idle stance for four seconds without a rapid sway loop',()=>{for(let a=0;a<4200;a+=100)expect(quietIdleFrame(a)).toBe(6);expect(quietIdleFrame(4400)).toBe(7);expect(quietIdleFrame(4800)).toBe(6);});
 it.each(['prison','crossfire'] as const)('contains full-sized Haku within %s interiors',kind=>{for(const y of [235,275,522]){const m=mirrorLayout(500,y,590,kind);expect(m.feet-146).toBeGreaterThanOrEqual(m.y-m.interiorHeight/2);expect(m.feet).toBeLessThanOrEqual(m.y+m.interiorHeight/2);expect(m.y+m.height/2).toBeLessThanOrEqual(590);}});
 it('places impacts at the first fighter contact rather than the frame endpoint',()=>{expect(sweptContact(0,100,200,100,10,5,{x:120,y:50,width:30,height:100})?.x).toBeCloseTo(110);expect(sweptContact(0,10,200,10,10,5,{x:120,y:50,width:30,height:100})).toBeNull();});
 it('finds the exact swept floor contact even after a long frame',()=>{expect(groundContact(100,480,300,680,590,10)).toEqual({x:200,y:580});expect(groundContact(100,400,200,450,590,10)).toBeNull();});
 it('keeps every water travel frame alive without an arbitrary dissipation timer',()=>{for(const age of [0,3000,3900,10000,60000])expect(waterFrame(age)).toBeGreaterThanOrEqual(4);for(const age of [0,3000,3900,10000,60000])expect(waterFrame(age)).toBeLessThan(12);});
 it('chooses a reachable corridor without changing existing shots',()=>{const shots=[{x:700,y:350,vx:0,vy:400,rx:20,ry:12}],copy=JSON.stringify(shots);const route=chooseCorridor(600,{left:588,right:812},70,1520,shots,590);expect(route).not.toBeNull();expect(route!.right-route!.left).toBe(224);expect(shots.some(p=>entersCorridor(p,route!,590,400))).toBe(false);expect(JSON.stringify(shots)).toBe(copy);});
});
