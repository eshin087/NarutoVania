import type * as Phaser from 'phaser';
import data from './assets.json';
export type ArtKey=keyof typeof data;
export const assets=data;
export const files:Record<ArtKey,string>={naruto:'naruto-sprites.png',zabuza:'zabuza-sprites.png',haku:'haku-sprites.png',enemy:'enemy-sprites.png',props:'props-effects.png'};
export function preloadArt(scene:Phaser.Scene){
 for(const key of Object.keys(files) as ArtKey[])scene.load.image(key,`/art/${files[key]}`);
 for(const name of ['forest','river','bridge'])scene.load.image(name,`/art/${name}-background.png`);
}
export function registerArt(scene:Phaser.Scene){
 for(const key of Object.keys(files) as ArtKey[])assets[key].frames.forEach((f,i)=>{if(!scene.textures.get(key).has(String(i)))scene.textures.get(key).add(String(i),0,f.x,f.y,f.w,f.h);});
 // The generated needle has a handle; this frame selects its long steel blade.
 scene.textures.get('props').add('needle',0,130,464,161,9);
}
export function pose(sprite:Phaser.GameObjects.Sprite,key:ArtKey,frame:number,flip=false){
 const f=assets[key].frames[frame];sprite.setTexture(key,String(frame)).setOrigin(f.ox,1).setFlipX(flip);
 // Phaser mirrors pixels around the sprite center; mirror the anchor as well.
 if(flip)sprite.setOrigin(1-f.ox,1);
}
export function prop(scene:Phaser.Scene,frame:number,x:number,y:number,width:number){
 const f=assets.props.frames[frame];return scene.add.image(x,y,'props',String(frame)).setDisplaySize(width,width*f.h/f.w);
}
