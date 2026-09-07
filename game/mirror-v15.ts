import {visibleBodyBounds} from './presentation-v16';
import type * as Phaser from 'phaser';
import {poseBattle} from './battle-art';
import mirror from '../public/art-v16/mirror.json';
type Kind='prison'|'crossfire';
export function fitMirror(scene:Phaser.Scene,image:Phaser.GameObjects.Image,reflection:Phaser.GameObjects.Sprite,kind:Kind){
 const base=kind==='prison'?{width:130,height:230}:{width:100,height:184};
 const bounds=visibleBodyBounds(reflection),[ix,iy,iw,ih]=mirror.interior;
 const fixed=image.getData('layout') as {width:number;height:number;dx:number;dy:number}|undefined;
 const width=fixed?.width??Math.max(base.width,(bounds.width+6)/iw),height=fixed?.height??Math.max(base.height,(bounds.height+8)/ih);
 const camera=scene.cameras.main,top=camera.getWorldPoint(0,132).y,bottom=Math.min(Number(image.getData('floor')),camera.getWorldPoint(0,697).y);
 const y=Math.max(top+height/2,Math.min(Number(image.getData('homeY')),bottom-height/2));
 const left=camera.getWorldPoint(20,0).x,right=camera.getWorldPoint(1260,0).x,x=Math.max(left+width/2,Math.min(Number(image.getData('homeX')),right-width/2));
 image.setPosition(x,y).setDisplaySize(width,height);
 const innerLeft=image.x-width/2+ix*width,insideTop=y-height/2+iy*height;
 reflection.x=innerLeft+iw*width/2+(fixed?.dx??reflection.x-bounds.centerX);
 reflection.y=insideTop+ih*height-4+(fixed?.dy??reflection.y-bounds.bottom);
}
export function poseReflection(reflection:Phaser.GameObjects.Sprite,image:Phaser.GameObjects.Image,kind:Kind,tell:boolean,age:number,facing:number){
 poseBattle(reflection,'haku',tell?'cast':'idle',tell?120:age,facing);
 fitMirror(image.scene,image,reflection,kind);
}
export function fitAllMirrors(scene:Phaser.Scene){for(const child of scene.children.list){const image=child as Phaser.GameObjects.Image;if(!image.getData)continue;const reflection=image.getData('mirrorReflection') as Phaser.GameObjects.Sprite|undefined;if(reflection?.active)fitMirror(scene,image,reflection,image.getData('mirrorKind'));}}
export function mirrorVisual(scene:Phaser.Scene,x:number,y:number,floor:number,kind:Kind,depth=2){
 const image=scene.add.image(x,y,'v16-mirror').setDepth(depth).setAlpha(.82);
 const reflection=scene.add.sprite(x,y,'haku-locomotion','6').setDepth(depth+.1).setAlpha(.82);
 image.setData({mirrorReflection:reflection,mirrorKind:kind,homeX:x,homeY:y,floor});
 const facing=x>830?-1:1;poseBattle(reflection,'haku','idle',0,facing);const idle=visibleBodyBounds(reflection),dx=reflection.x-idle.centerX,dy=reflection.y-idle.bottom;poseBattle(reflection,'haku','cast',120,facing);const cast=visibleBodyBounds(reflection);
 image.setData('layout',{width:Math.max(kind==='prison'?130:100,(Math.max(idle.width,cast.width)+8)/mirror.interior[2]),height:Math.max(kind==='prison'?230:184,(Math.max(idle.height,cast.height)+10)/mirror.interior[3]),dx,dy});
 poseReflection(reflection,image,kind,false,0,facing);
 scene.tweens.add({targets:image,alpha:{from:0,to:.82},duration:400});
 return{image,reflection};
}
