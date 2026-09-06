import type * as Phaser from 'phaser';
import haku from '../public/art-v13/haku-manifest.json';
import water from '../public/art-v13/water-manifest.json';
export function preloadV13(scene:Phaser.Scene){for(const [key,t]of Object.entries(haku.textures))scene.load.image(key,`/art-v13/${t.file}`);for(const [key,t]of Object.entries(water))scene.load.image(`v13-${key}`,`/art-v13/${t.file}`);}
export function registerV13(scene:Phaser.Scene){for(const [key,t]of Object.entries(haku.textures))for(const f of t.frames){const[x,y,w,h]=f.rect;scene.textures.get(key).add(String(f.frame),0,x,y,w,h);}for(const [key,t]of Object.entries(water))for(const f of t.frames){const[x,y,w,h]=f.rect;scene.textures.get(`v13-${key}`).add(String(f.index),0,x,y,w,h);}}
export type HakuSequence='senbon'|'mirror-knockdown'|'carry-zabuza';
export function poseHakuV13(sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image,sequence:HakuSequence,index:number,facing:number){
 const key=`v13-haku-${sequence}` as keyof typeof haku.textures,t=haku.textures[key],frame=t.frames[Math.min(index,t.frames.length-1)];
 sprite.setTexture(key,String(frame.frame)).setScale(146*frame.pixelsToLogicalBody).setOrigin(facing<0?1-frame.anchorPixels[0]/512:frame.anchorPixels[0]/512,frame.anchorPixels[1]/512).setFlipX(facing<0);
}
export function dragonFrame(age:number){return age<700?Math.min(3,Math.floor(age/175)):4+Math.floor((age-700)/100)%4;}
export function dragonHead(frame:number,facing:number){const point=water.dragon.frames[frame].headContact;return{x:(facing>0?point[0]-650:650-point[0])*.5,y:(point[1]-300)*.5};}

export function hakuThrowHand(x:number,y:number,facing:number){const t=haku.textures['v13-haku-senbon'],point=t.animation.releaseAttachmentPixels,anchor=t.frames[3].anchorPixels,scale=146*t.frames[3].pixelsToLogicalBody;return{x:x+(point[0]-anchor[0])*scale*facing,y:y+(point[1]-anchor[1])*scale};}
