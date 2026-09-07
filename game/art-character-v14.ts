import {presentBody} from './presentation-v16';
import type * as Phaser from 'phaser';
import manifest from '../public/art-v14/character-manifest.json';
import {CHARACTER} from './chapter';
import {animationFrame} from './animation-data';
import type {CharacterId,AnimationName} from './combat-core';
export function preloadCharacterArt(scene:Phaser.Scene){for(const a of manifest.assets)scene.load.image(`v14-${a.key}`,`/art-v14/${a.file}`);}
export function registerCharacterArt(scene:Phaser.Scene){for(const a of manifest.assets)for(const f of a.frames){const[x,y,w,h]=f.rect;scene.textures.get(`v14-${a.key}`).add(String(f.index),0,x,y,w,h);}}
export function poseCharacterFrame(sprite:Phaser.GameObjects.Sprite,id:CharacterId,sheet:string,index:number,facing:number,variant?:string){
 const appearance=id==='haku'?variant==='unmasked'?'haku-unmasked':'haku-masked':id==='naruto'&&variant==='awakened'?'naruto-awakened':id;
 const a=manifest.assets.find(a=>a.key===`${appearance}-${sheet}`);if(!a)return false;const f=a.frames[index];if(!f)return false;
 const[, ,w,h]=f.rect,[x,y]=f.footAnchor;
 sprite.setTexture(`v14-${a.key}`,String(index)).setOrigin(facing<0?1-x/w:x/w,y/h).setFlipX(facing<0).setScale(CHARACTER[id].height/a.standingBodyHeight);presentBody(sprite,id);return true;
}
export function poseCharacter(sprite:Phaser.GameObjects.Sprite,id:CharacterId,animation:AnimationName,age:number,facing:number,duration?:number,variant?:string){
 let sheet='locomotion',index=-1;
 if(animation==='land')index=14+Math.min(1,Math.floor(Math.max(0,age)/72.5));
 else if(['light1','light2','light3'].includes(animation)){sheet='melee';index=(Number(sprite.getData('choreography')||0)%2)*18+(Number(animation.at(-1))-1)*6+animationFrame(animation,age,duration).index%6;}
 return index>=0&&poseCharacterFrame(sprite,id,sheet,index,facing,variant);
}
