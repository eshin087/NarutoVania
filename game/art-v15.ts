import type * as Phaser from 'phaser';
import water from '../public/art-v15/water-manifest.json';
export function preloadV15(scene:Phaser.Scene){scene.load.image('v15-water','/art-v15/water.webp');scene.load.image('v15-reactions','/art-v15/reactions.webp');}
export function registerV15(scene:Phaser.Scene){for(let i=0;i<16;i++)scene.textures.get('v15-reactions').add(String(i),0,i%4*256,Math.floor(i/4)*256,256,256);for(let i=0;i<16;i++)scene.textures.get('v15-water').add(String(i),0,i%4*320,Math.floor(i/4)*320,320,320);}
export const waveGroundAnchor=(index:number)=>water.waveGroundAnchors[index]||.92;
export function waterImpact(image:Phaser.GameObjects.Image,x:number,y:number,age:number,ground:boolean){image.setTexture('v15-water',String(8+Math.min(7,Math.floor(age/60)))).setPosition(x,y).setRotation(0).setOrigin(.5,ground?282/320:.5).setDisplaySize(210,180).setAlpha(Math.min(1,Math.max(0,(480-age)/100)));}

export function poseRepair(sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image,frame:number,facing:number){sprite.setTexture('v15-reactions',String(frame)).setOrigin(.5,224/256).setScale(1).setFlipX(facing<0);}
