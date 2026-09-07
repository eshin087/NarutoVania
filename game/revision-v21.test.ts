import {describe,it,expect} from 'vitest';
import {ultimateGain,mirrorOrigins,HOSTILE_SPEED,diveTarget} from './revision-v21';
import {MirrorExit} from './cinematic-motion';
import {PHASES} from './chapter';
import {BARRAGES} from './barrages';
import {outroClip} from './story-director';
import manifest from '../public/art-v21/manifest.json';
describe('V21 combat and presentation contracts',()=>{
 it('earns a second ultimate without charging from ultimate damage',()=>{expect(ultimateGain('mist',625,false)).toBe(100);expect(ultimateGain('rescue',250,false)).toBe(100);expect(ultimateGain('seal',500,true)).toBe(0);expect(ultimateGain('rescue',-5,false)).toBe(0);expect(PHASES.rescue.hp).toBe(550);expect(HOSTILE_SPEED).toBe(1.2);});
 it('selects distinct intact mirrors consistently through anticipation and release',()=>{for(let serial=0;serial<20;serial++){const a=mirrorOrigins(2,[0,1,2,3,4,5],serial,3);expect(a).toHaveLength(3);expect(new Set(a).size).toBe(3);expect(a[0]).toBe(2);expect(mirrorOrigins(2,[0,1,2,3,4,5],serial,3)).toEqual(a);}expect(mirrorOrigins(-1,[0,1,2],0)).toEqual([]);expect(mirrorOrigins(2,[2],0,3)).toEqual([2]);});
 it('lands once from every mirror height and retains full grounded recovery',()=>{for(const y of [260,335,490,590]){const e=new MirrorExit(600,y,590,true);for(let i=0;i<180;i++){const old=e.y;e.tick(16);expect(e.y).toBeGreaterThanOrEqual(old);expect(e.y).toBeLessThanOrEqual(590);if(e.landedAt!==null&&e.age-e.landedAt<650)expect(e.done).toBe(false);}expect(e.done).toBe(true);expect(e.y).toBe(590);}});
 it('leaves ground dodge space and an 800ms punish window for the dive',()=>{for(const x of [70,780,1590]){const t=diveTarget(x,70,1590);expect(t-125).toBeGreaterThanOrEqual(70);expect(t+125).toBeLessThanOrEqual(1590);expect(Math.max(t-125-70,1590-t-125)).toBeGreaterThanOrEqual(180);}expect(BARRAGES['diving-dragon'].duration-BARRAGES['diving-dragon'].recovery).toBe(800);});
 it('does not scare mercenaries before Zabuza begins charging and dismisses dogs on interception',()=>{const cues=outroClip('lightning').cues;const fear=cues.filter(c=>c.actor?.startsWith('henchman')&&c.animation==='hurt');expect(fear).toHaveLength(3);expect(fear.every(c=>c.at>=19800)).toBe(true);const gone=cues.filter(c=>c.actor?.startsWith('hound')&&c.alpha===0);expect(gone.every(c=>c.at===7400)).toBe(true);});
 it('has complete padded art and distinct hound sequences',()=>{expect(manifest.assets.hounds.frames).toHaveLength(24);expect(manifest.assets.characters.frames).toHaveLength(24);for(const a of Object.values(manifest.assets))for(const f of a.frames){const[x,y,r,b]=f.contentBounds;expect(x).toBeGreaterThan(2);expect(y).toBeGreaterThan(2);expect(r).toBeLessThan(f.rect[2]-2);expect(b).toBeLessThan(f.rect[3]-2);expect(f.scale).toBeGreaterThan(0);}});
});
