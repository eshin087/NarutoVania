import type * as Phaser from 'phaser';
import manifest from '../public/art-v14/fx-manifest.json';
import {flowFrame} from './presentation-v14';

export function preloadEffects(scene:Phaser.Scene){for(const [id,t]of Object.entries(manifest.textures))scene.load.image(`v14-${id}`,`/art-v14/${t.file}`);}
export function registerEffects(scene:Phaser.Scene){for(const [id,t]of Object.entries(manifest.textures))t.frames.forEach((f,i)=>{const[x,y,w,h]=f.rect;scene.textures.get(`v14-${id}`).add(String(i),0,x,y,w,h);});}
export function effectFrame(name:string,age:number,life:number):[string,number]{
  if(name==='water-dragon'||name==='spirit')return ['v14-dragon',flowFrame(age,life)];
  if(name==='waterfall'||name==='wave')return ['v14-wave',flowFrame(age,life)];
  if(name==='needle')return ['v14-ice',Math.floor(age/65)%4];
  if(name==='needle-impact')return ['v14-ice',4+Math.min(3,Math.floor(age/Math.max(1,life)*4))];
  if(name==='mirror')return ['v14-ice',12+Math.min(3,Math.floor(age/100))];
  const row=name==='lightning'?0:name==='chakra-aura'?1:name==='fireball'?2:name==='smoke'?3:name==='ice-shards'?5:4;
  return ['v14-chakra',row*8+Math.min(7,Math.floor(age/Math.max(1,life)*8))];
}
export function animateEffect(image:Phaser.GameObjects.Image,name:string,age:number,life:number){const[key,frame]=effectFrame(name,age,life);image.setTexture(key,String(frame));}
export function makeEffect(scene:Phaser.Scene,name:string,x:number,y:number,width:number,height=width){const[key,frame]=effectFrame(name,0,500);return scene.add.image(x,y,key,String(frame)).setDisplaySize(width,height);}
