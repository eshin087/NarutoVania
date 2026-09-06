import {poseRepair} from './art-v15';
import calibration from '../public/art-v15/body-calibration.json';
import type * as Phaser from 'phaser';
interface Frame{rect:number[];rootAnchor:number[];row:number;}
interface Atlas{name:string;file:string;frames:Frame[];standingReference?:{sourceBodyHeightPx:number};standingSourceBodyHeightPx?:Record<string,number>;bodyReferences?:number[];}
export function preloadCinemaArt(scene:Phaser.Scene){scene.load.json('v14-cinema','/art-v14/cinema-manifest.json');for(const id of ['teamwork','carry','reactions','ultimate-a','ultimate-b'])scene.load.image(`v14-${id}`,`/art-v14/${id}.webp`);}
export function registerCinemaArt(scene:Phaser.Scene){for(const a of scene.cache.json.get('v14-cinema').assets as Atlas[])for(let i=0;i<a.frames.length;i++){const[x,y,w,h]=a.frames[i].rect;scene.textures.get(`v14-${a.name}`).add(String(i),0,x,y,w,h);}}
export function poseCinema(sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image,name:string,index:number,height:number,facing:number,authoredFacing=1){
 const atlas=(sprite.scene.cache.json.get('v14-cinema').assets as Atlas[]).find(a=>a.name===name)!;const frame=atlas.frames[Math.min(index,atlas.frames.length-1)];
 const source=atlas.standingReference?.sourceBodyHeightPx||atlas.bodyReferences?.[frame.row]||220;
 const flip=facing!==authoredFacing,[, ,w,h]=frame.rect,[ax,ay]=frame.rootAnchor;
 sprite.setTexture(`v14-${name}`,String(index)).setOrigin(flip?1-ax/w:ax/w,ay/h).setScale(height/source*((calibration.cinema as Record<string,{bodyScale:number}[]>)[name]?.[index]?.bodyScale||1)).setFlipX(flip);
}
export function poseUltimate(sprite:Phaser.GameObjects.Sprite,character:string,fury:boolean,age:number,facing:number){
 if(character==='naruto'&&fury&&age>=300){poseRepair(sprite,age<820?8:age<1450?9:age<1700?10:11,facing);return;}
 const row=character==='kakashi'?0:character==='naruto'?fury?2:1:character==='sasuke'?3:4;
 const frame=age<820?Math.min(5,Math.floor(age/820*6)):age<1050?6:age<1160?7:age<1330?8:age<1650?9:age<1850?10:11;
 poseCinema(sprite,frame<6?'ultimate-a':'ultimate-b',row*6+frame%6,character==='kakashi'?157:character==='naruto'?132:135,facing);
}
