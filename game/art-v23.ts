import type * as Phaser from 'phaser';
import data from '../public/art-v23/manifest.json';
type Sprite=Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;
interface Frame{rect:number[];contentBounds:number[];root:number[];head:number[];hand:number[];mouth:number[];scale:number;authoredFacing:number;}
const assets=data.assets as Record<string,{file:string;columns:number;frames:Frame[]}>;
export function preloadV23(scene:Phaser.Scene){for(const[name,a]of Object.entries(assets))scene.load.image(`v23-${name}`,`/art-v23/${a.file}`);}
export function registerV23(scene:Phaser.Scene){for(const[name,a]of Object.entries(assets))a.frames.forEach((f,i)=>{const[x,y,w,h]=f.rect;scene.textures.get(`v23-${name}`).add(String(i),0,x,y,w,h);});}
export function pose23(s:Sprite,name:string,row:number,col:number,facing:number){const a=assets[name],i=row*a.columns+Math.max(0,Math.min(a.columns-1,col)),f=a.frames[i],[,,w,h]=f.rect,flip=facing!==f.authoredFacing;s.setTexture(`v23-${name}`,String(i)).setOrigin(flip?1-f.root[0]/w:f.root[0]/w,f.root[1]/h).setScale(f.scale).setFlipX(flip).setRotation(0).setData('v22Frame',f);}
export function anchor23(s:Sprite,kind:'head'|'hand'|'mouth'){const f=s.getData('v22Frame') as Frame;return{x:s.x+(f[kind][0]-f.root[0])*s.scaleX*(s.flipX?-1:1),y:s.y+(f[kind][1]-f.root[1])*s.scaleY};}
