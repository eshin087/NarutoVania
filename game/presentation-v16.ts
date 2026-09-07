import opaque from '../public/art-v16/visible-bounds.json';
import {entersCorridor,type MovingCore} from './presentation-v15';
import type * as Phaser from 'phaser';
import frames from '../public/art-v16/body-frames.json';
import {COMBAT,type CharacterId} from './combat-core';
export const VISUAL_RATIO:Record<CharacterId,number>={naruto:.95,sasuke:.95,kakashi:1,zabuza:1,haku:1,sakura:1};
export function presentBody(sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image,id:CharacterId){
 const key=sprite.texture.key,index=Number(sprite.frame.name),record=(frames as Record<string,{scale:number;foot:number[];head:number[];hand:number[]}[]>)[key]?.[index];
 const signature=`${key}:${index}:${sprite.scaleX}:${sprite.scaleY}`;
 if(sprite.getData('presentation16')===signature)return;
 if(record){sprite.setScale(record.scale*VISUAL_RATIO[id]);const [x,y]=record.foot;sprite.setOrigin(sprite.flipX?1-x/sprite.frame.width:x/sprite.frame.width,y/sprite.frame.height);}
 else sprite.setScale(sprite.scaleX*VISUAL_RATIO[id],sprite.scaleY*VISUAL_RATIO[id]);
 sprite.setData('presentation16',`${key}:${index}:${sprite.scaleX}:${sprite.scaleY}`);
}
export function actorHead(sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image){
 const record=(frames as Record<string,{head:number[]}[]>)[sprite.texture.key]?.[Number(sprite.frame.name)];
 if(record){const [x,y]=record.head;return{x:sprite.x+(sprite.flipX?-1:1)*(x-sprite.frame.width*(sprite.flipX?1-sprite.originX:sprite.originX))*sprite.scaleX,y:sprite.y+(y-sprite.frame.height*sprite.originY)*sprite.scaleY};}
 const bounds=visibleBodyBounds(sprite);return{x:bounds.centerX,y:bounds.top+8};
}
export const CAST_HANDS=[[254,200],[290,143],[327,177],[295,195],[271,246],[252,244]];
export function waterCastFrame(age:number){return age<350?0:age<700?1:age<3200?2:age<3600?3:age<4000?4:5;}
export function waterHand(x:number,y:number,facing:number,frame=2){const p=CAST_HANDS[frame],scale=167/211;return{x:x+(p[0]-256)*scale*facing,y:y+(p[1]-320)*scale};}
export function launchFromHand(hand:{x:number;y:number},target:{x:number;y:number},separation=0){const d=Math.max(1,Math.hypot(target.x-hand.x,target.y-hand.y)),dx=(target.x-hand.x)/d,dy=(target.y-hand.y)/d;return{x:hand.x+dx*24-dy*separation,y:hand.y+dy*24+dx*separation};}

export function aimedWaterRoute(playerX:number,hand:{x:number;y:number},min:number,max:number,shots:MovingCore[],floor:number,canDash=true){
 const reach=Math.min(510,Math.hypot(playerX-hand.x,floor-65-hand.y)/850*COMBAT.speed+(canDash?75:0));
 for(const offset of [170,-170,255,-255,340,-340,425,-425,510,-510]){
  const center=Math.max(min+112,Math.min(max-112,playerX+offset)),gap={left:center-112,right:center+112};
  if(Math.abs(center-playerX)<=reach&&!shots.some(p=>entersCorridor(p,gap,floor,0)))return gap;
 }
 return null;
}

export function visibleBodyBounds(sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image){
 const b=(opaque as Record<string,number[][]>)[sprite.texture.key]?.[Number(sprite.frame.name)];
 if(!b)return sprite.getBounds();const w=sprite.frame.width,h=sprite.frame.height;
 const x=sprite.x+((sprite.flipX?w-b[2]:b[0])-sprite.originX*w)*sprite.scaleX,y=sprite.y+(b[1]-sprite.originY*h)*sprite.scaleY,width=(b[2]-b[0])*sprite.scaleX,height=(b[3]-b[1])*sprite.scaleY;
 return{x,y,width,height,left:x,right:x+width,top:y,bottom:y+height,centerX:x+width/2,centerY:y+height/2};
}
