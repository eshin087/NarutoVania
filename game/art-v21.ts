import {makeEffect,animateEffect} from './effects-v14';
import type * as Phaser from 'phaser';
import manifest from '../public/art-v21/manifest.json';
type Sprite=Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;
export function preloadV21(scene:Phaser.Scene){for(const [name,a] of Object.entries(manifest.assets))scene.load.image(`v21-${name}`,`/art-v21/${a.file}`);}
export function registerV21(scene:Phaser.Scene){for(const [name,a]of Object.entries(manifest.assets))a.frames.forEach((f,i)=>{const[x,y,w,h]=f.rect;scene.textures.get(`v21-${name}`).add(String(i),0,x,y,w,h);});}
export function pose21(sprite:Sprite,row:number,col:number,facing:number){const i=row*6+Math.min(5,Math.max(0,col)),f=manifest.assets.characters.frames[i],[,,w,h]=f.rect;sprite.setTexture('v21-characters',String(i)).setFlipX(facing<0).setOrigin(facing<0?1-f.root[0]/w:f.root[0]/w,f.root[1]/h).setScale(f.scale);}
export function houndPose(sprite:Sprite,dog:number,frame:number,facing:number){const i=dog*8+Math.min(7,frame),f=manifest.assets.hounds.frames[i],[,,w,h]=f.rect;sprite.setTexture('v21-hounds',String(i)).setFlipX(facing<0).setOrigin(facing<0?1-f.root[0]/w:f.root[0]/w,f.root[1]/h).setScale(f.scale);return {x:(f.mouth[0]-f.root[0])*f.scale*facing,y:(f.mouth[1]-f.root[1])*f.scale};}
export function effect21(image:Phaser.GameObjects.Image,row:number,frame:number,width:number,height:number){const i=row*8+Math.max(0,Math.min(7,frame)),f=manifest.assets.effects.frames[i],[x,y,r,b]=f.contentBounds,[,,w,h]=f.rect;image.setTexture('v21-effects',String(i)).setOrigin((x+r)/2/w,(y+b)/2/h).setScale(width/(r-x),height/(b-y));return image;}
/** One primary contact, followed by visual bite/hold motion only. */
export class HoundPack{
 readonly dogs:Phaser.GameObjects.Image[];contact=false;done=false;
 constructor(private scene:Phaser.Scene,readonly started:number,readonly fromX:number,private floor:number,private holdMs=1000){this.dogs=[0,1,2].map(()=>scene.add.image(fromX,floor,'v21-hounds','0').setDepth(6));}
 update(now:number,target:{x:number;y:number},release=false){const age=now-this.started,travel=440,holdEnd=travel+this.holdMs;
 for(const [i,dog]of this.dogs.entries()){const a=Math.max(0,age-i*45),facing=i===1?-1:1,frame=a<travel?(a<230?Math.floor(a/95)%2:2):release?6:a<holdEnd?(Math.floor((a-travel)/125)%3===0?3:4+Math.floor(a/170)%2):a<holdEnd+160?6:7;
 const mouth=houndPose(dog,i,frame,facing),bite={x:target.x+[-25,30,-14][i],y:target.y-[30,48,62][i]},u=Math.min(1,a/travel),endX=bite.x-mouth.x,endY=bite.y-mouth.y;
 dog.setPosition(this.fromX+(endX-this.fromX)*u,this.floor+(endY-this.floor)*u-Math.sin(u*Math.PI)*[30,40,50][i]);dog.setAlpha(release?0:a<holdEnd?1:Math.max(0,1-(a-holdEnd)/300));}
 if(age>=travel)this.contact=true;if(release||age>=holdEnd+400){this.done=true;this.dogs.forEach(d=>dismissHound(this.scene,d.x,d.y-20));this.destroy();}return this.contact;}
 destroy(){this.dogs.forEach(d=>d.destroy());}
}

export function dismissHound(scene:Phaser.Scene,x:number,y:number){const smoke=makeEffect(scene,'smoke',x,y,90,70).setDepth(7);scene.tweens.add({targets:smoke,alpha:0,duration:320,onUpdate:t=>animateEffect(smoke,'smoke',t.progress*320,320),onComplete:()=>smoke.destroy()});}
