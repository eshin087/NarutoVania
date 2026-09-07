import {describe,it,expect} from 'vitest';
import type * as Phaser from 'phaser';
import {poseCharacterFrame} from './art-character-v14';
import {swordPose,swordHand} from './art-v10';
import sword from '../public/art-v19/sword-manifest.json';
import {UNIVERSAL} from './combat-core';
function sprite(){const data=new Map<string,unknown>();return {texture:{key:''},frame:{name:'0',width:512,height:384},scaleX:1,scaleY:1,originX:0,originY:0,flipX:false,
setTexture(key:string,frame:string){this.texture.key=key;this.frame.name=frame;return this;},setScale(x:number,y=x){this.scaleX=x;this.scaleY=y;return this;},setOrigin(x:number,y:number){this.originX=x;this.originY=y;return this;},setFlipX(v:boolean){this.flipX=v;return this;},getData(k:string){return data.get(k);},setData(k:string,v:unknown){data.set(k,v);return this;}};}
describe('Zabuza consistent presentation',()=>{
it('uses the approved sword family with a stable root for both full combo sets and facings',()=>{for(const facing of [-1,1])for(let frame=0;frame<36;frame++){const s=sprite();poseCharacterFrame(s as unknown as Phaser.GameObjects.Sprite,'zabuza','melee',frame,facing);expect(s.texture.key).toBe('v8-sword');expect(s.scaleX).toBeCloseTo(167/211);expect(s.originX).toBe(.5);expect(s.originY).toBe(320/384);expect(s.flipX).toBe(facing<0);}});
it('keeps throw/catch scale and mirrored hand attachments consistent for all 18 frames',()=>{for(let i=0;i<18;i++){const s=sprite();swordPose(s as unknown as Phaser.GameObjects.Sprite,i,-1);expect(s.scaleX).toBeCloseTo(167/211);expect(s.originY).toBe(320/384);const l=swordHand(500,590,i,-1),r=swordHand(500,590,i,1);expect(l.x+r.x).toBeCloseTo(1000);expect(l.y).toBe(r.y);expect(sword.frames[i].weaponHeld).toBe(i<3||i>=14);}});
it('preserves stationary basic attacks',()=>{for(const id of ['light1','light2','light3'])expect(UNIVERSAL[id].move).toBe(0);});
});
