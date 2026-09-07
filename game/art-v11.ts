import {presentBody} from './presentation-v16';
import type * as Phaser from 'phaser';
import reactions from '../public/art-v11/reactions-manifest.json';
import type {CharacterId} from './combat-core';
import barrage from '../public/art-v11/barrage-manifest.json';
import {CHARACTER} from './chapter';
const key=(id:string)=>id==='dragon'?'v11-spirit':id==='zabuza'?'v11-zabuza-cast':`v11-${id}`;
export function preloadV11(scene:Phaser.Scene){for(const [id,t]of Object.entries(reactions.textures))scene.load.image(id,`/art-v11/${t.file}`);for(const [id,t]of Object.entries(barrage))scene.load.image(key(id),`/art-v11/${t.file}`);}
export function registerV11(scene:Phaser.Scene){for(const [id,t]of Object.entries(reactions.textures))for(const f of t.frames){const[x,y,w,h]=f.rect;scene.textures.get(id).add(String(f.frame),0,x,y,w,h);}for(const [id,t]of Object.entries(barrage))for(const f of t.frames){const[x,y,w,h]=f.rect;scene.textures.get(key(id)).add(String(f.index),0,x,y,w,h);}}
export function poseWaterCast(sprite:Phaser.GameObjects.Sprite,age:number,facing:number){const index=age<350?0:age<700?1:age<3200?2:age<3600?3:age<4000?4:5;sprite.setTexture('v11-zabuza-cast',String(index)).setFlipX(facing<0).setOrigin(.5,320/384).setScale(CHARACTER.zabuza.height*barrage.zabuza.pixelsToLogicalBody);presentBody(sprite,'zabuza');}
export function waveFootprint(x:number,y:number,facing:number,frame:number){const f=barrage.wave.frames[frame],bounds=f.contentBounds,scale=.65;const left=(bounds[0]-320)*scale,right=(bounds[2]-320)*scale,top=(bounds[1]-224)*scale;return{x:x+(facing>0?left:-right),y:y+top,width:right-left,height:Math.max(4,-top)};}

export function normalizeV11(sprite:Phaser.GameObjects.Sprite,id:CharacterId,facing:number){const table=reactions.textures as Record<string,{cellSize:number[];frames:{frame:number;pixelsToLogicalBody:number;anchorPixels:number[]}[]}>;const t=table[sprite.texture.key],f=t?.frames.find(f=>String(f.frame)===sprite.frame.name);if(!f)return false;sprite.setScale(CHARACTER[id].height*f.pixelsToLogicalBody).setOrigin(facing<0?1-f.anchorPixels[0]/t.cellSize[0]:f.anchorPixels[0]/t.cellSize[0],f.anchorPixels[1]/t.cellSize[1]);presentBody(sprite,id);return true;}
export function poseHurt(sprite:Phaser.GameObjects.Sprite,id:CharacterId,age:number,direction:number,weaponless=false){const key=weaponless?'v11-zabuza-weaponless-hurt':`v11-${id}-hurt`;sprite.setTexture(key,String(age<75?0:age<175?1:age<300?2:3)).setFlipX(direction>0);normalizeV11(sprite,id,-direction);}
export function waveOutline(x:number,y:number,facing:number,frame:number){const r=waveFootprint(x,y,facing,frame);const pts=[[0,1],[.08,.65],[.35,.48],[.63,.05],[.83,0],[1,.4],[.94,1]];return pts.map(([u,v])=>({x:r.x+(facing>0?u:1-u)*r.width,y:r.y+v*r.height}));}
