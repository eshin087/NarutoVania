import {presentBody} from './presentation-v16';
import type * as Phaser from 'phaser';
import reactions from '../public/art-v10/reactions-manifest.json';
import sword from '../public/art-v10/sword-manifest.json';
import ending from '../public/art-v10/ending-manifest.json';
import {CHARACTER} from './chapter';
import type {CharacterId} from './combat-core';
type Sprite=Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;
export function preloadV10(scene:Phaser.Scene){
 for(const [key,t] of Object.entries(reactions.textures))scene.load.image(key,`/art-v10/${t.file}`);
 scene.load.image('v10-sword',`/art-v10/${sword.atlas}`);
 for(const [key,t] of Object.entries(ending))scene.load.image(`v10-ending-${key}`,`/art-v10/${t.file}`);
}
export function registerV10(scene:Phaser.Scene){
 for(const [key,t] of Object.entries(reactions.textures))for(const f of t.frames){const [x,y,w,h]=f.rect;scene.textures.get(key).add(String(f.frame),0,x,y,w,h);}
 for(const f of sword.frames){const [x,y,w,h]=f.rect;scene.textures.get('v10-sword').add(String(f.index),0,x,y,w,h);}
 for(const [key,t] of Object.entries(ending))for(const f of t.frames){const [x,y,w,h]=f.rect;scene.textures.get(`v10-ending-${key}`).add(String(f.index),0,x,y,w,h);}
}
export function reactionPose(sprite:Sprite,id:CharacterId,kind:string,age:number,facing:number){
 const table=reactions.textures as Record<string,{frames:{frame:number;anchorPixels:number[];pixelsToLogicalBody:number}[]}>;const key=`v10-${id}-${kind}`,t=table[key];if(!t)return false;
 const index=Math.min(3,Math.floor(Math.max(0,age)/160)),f=t.frames[index];sprite.setTexture(key,String(index)).setFlipX(facing<0).setOrigin(facing<0?1-f.anchorPixels[0]/512:f.anchorPixels[0]/512,f.anchorPixels[1]/384).setScale(CHARACTER[id].height*f.pixelsToLogicalBody);presentBody(sprite,id);return true;
}
export function swordPose(sprite:Sprite,index:number,facing:number){sprite.setTexture('v10-sword',String(index)).setFlipX(facing<0).setOrigin(.5,320/384).setScale(CHARACTER.zabuza.height/sword.baseHeight);presentBody(sprite,'zabuza');}
export function swordHand(x:number,y:number,index:number,facing:number){const h=sword.frames[index].handRelativeToFeet,scale=CHARACTER.zabuza.height/sword.baseHeight*.92;return{x:x+h[0]*scale*facing,y:y+h[1]*scale};}
export function endingPose(sprite:Sprite,id:'zabuza'|'mercenary'|'gato',animation:string,age:number,facing:number){
 const index=id==='zabuza'?(animation==='run'||animation==='dash'?Math.floor(age/85)%6:animation==='heavy'?6+Math.min(5,Math.floor(age/100)):12+Math.min(5,Math.floor(age/150))):Math.min(5,Math.floor(age/130));
 const t=ending[id],height=id==='zabuza'?CHARACTER.zabuza.height:id==='gato'?124:158;
 sprite.setTexture(`v10-ending-${id}`,String(index)).setFlipX(facing<0).setRotation(0).setOrigin(.5,320/384).setScale(height*t.pixelsToLogicalBody);
}
