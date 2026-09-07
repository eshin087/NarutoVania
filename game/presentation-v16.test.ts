import {describe,it,expect} from 'vitest';
import {waterHand,launchFromHand,VISUAL_RATIO,presentBody,aimedWaterRoute} from './presentation-v16';
import type * as Phaser from 'phaser';
import frames from '../public/art-v16/body-frames.json';
describe('character scale and hand-bound water launches',()=>{
 it('only reduces the requested two visual profiles',()=>{expect(VISUAL_RATIO.naruto).toBe(.95);expect(VISUAL_RATIO.sasuke).toBe(.95);expect(VISUAL_RATIO.zabuza).toBe(1);expect(VISUAL_RATIO.kakashi).toBe(1);});
 it('does not compound visual scaling when nested renderers normalize the same pose',()=>{
  const data=new Map();const sprite={texture:{key:'naruto-locomotion'},frame:{name:'6'},scaleX:1,scaleY:1,getData:(k:string)=>data.get(k),setData:(k:string,v:unknown)=>data.set(k,v),setScale(x:number,y=x){this.scaleX=x;this.scaleY=y;return this;}};
  presentBody(sprite as unknown as Phaser.GameObjects.Sprite,'naruto');presentBody(sprite as unknown as Phaser.GameObjects.Sprite,'naruto');expect(sprite.scaleX).toBe(.95);sprite.scaleX=1;sprite.scaleY=1;presentBody(sprite as unknown as Phaser.GameObjects.Sprite,'naruto');expect(sprite.scaleX).toBe(.95);
 });
 it('keeps Zabuza sword body proportions within the idle reference instead of scaling to pose height',()=>{for(const f of frames['v14-zabuza-melee'])expect(f.scale*f.headDiameter!).toBeCloseTo(20.5);expect(frames['v14-zabuza-melee'][5].foot[1]).toBe(330);expect(frames['v10-sword']).toHaveLength(18);expect(frames['v11-zabuza-cast']).toHaveLength(6);});
 it('mirrors all six palm anchors around the fighter root',()=>{for(let i=0;i<6;i++){const r=waterHand(500,300,1,i),l=waterHand(500,300,-1,i);expect(r.x-500).toBeCloseTo(500-l.x);expect(r.y).toBe(l.y);}});
 it('starts each dragon outside the palm and aims through the sampled player position',()=>{
  for(const x of [92,780,1490]){const hand=waterHand(830,360,x<830?-1:1);const target={x,y:525};for(const offset of [-9,9]){const o=launchFromHand(hand,target,offset);expect(Math.hypot(o.x-hand.x,o.y-hand.y)).toBeGreaterThan(24);expect(Math.hypot(o.x-target.x,o.y-target.y)).toBeLessThan(Math.hypot(hand.x-target.x,hand.y-target.y));}}
 });
 it('finds a lateral route for a player-aimed descending dragon at both edges and center',()=>{
  for(const x of [92,780,1490]){const o=waterHand(830,360,x<830?-1:1),d=Math.hypot(x-o.x,525-o.y);const shot={...o,vx:(x-o.x)/d*850,vy:(525-o.y)/d*850,rx:20,ry:12};const gap=aimedWaterRoute(x,o,70,1520,[shot],590);expect(gap).not.toBeNull();expect(gap!.right-gap!.left).toBe(224);}
 });
 it('retains individual scale and attachment entries for both complete combo sets',()=>{for(const [key,list] of Object.entries(frames)){if(!key.startsWith('v14-'))continue;expect(list).toHaveLength(36);for(const f of list){expect(f.scale).toBeGreaterThan(0);expect(f.foot).toHaveLength(2);expect('head' in f && f.head).toHaveLength(2);expect(f.hand).toHaveLength(2);}}});
});
