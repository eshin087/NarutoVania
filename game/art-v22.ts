import type * as Phaser from 'phaser';
import data from '../public/art-v22/manifest.json';
type Sprite=Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;
interface Frame{rect:number[];contentBounds:number[];root:number[];head:number[];hand:number[];mouth:number[];scale:number;}
interface Asset{file:string;columns:number;frames:Frame[];}
const assets=data.assets as Record<string,Asset>;
export function preloadV22(scene:Phaser.Scene){for(const [name,a]of Object.entries(assets))scene.load.image(`v22-${name}`,`/art-v22/${a.file}`);}
export function registerV22(scene:Phaser.Scene){for(const [name,a]of Object.entries(assets))a.frames.forEach((f,i)=>{const[x,y,w,h]=f.rect;scene.textures.get(`v22-${name}`).add(String(i),0,x,y,w,h);});}
export function pose22(sprite:Sprite,name:string,row:number,col:number,facing:number){const a=assets[name];if(!a)return false;const i=row*a.columns+Math.min(a.columns-1,Math.max(0,col)),f=a.frames[i],[,,w,h]=f.rect;sprite.setTexture(`v22-${name}`,String(i)).setFlipX(facing<0).setOrigin(facing<0?1-f.root[0]/w:f.root[0]/w,f.root[1]/h).setScale(f.scale);sprite.setData('v22Frame',f);return true;}
export function attachment22(sprite:Sprite,kind:'head'|'hand'|'mouth'){const f=sprite.getData('v22Frame') as Frame|undefined;if(!f)return{x:sprite.x,y:sprite.y-75};return{x:sprite.x+(f[kind][0]-f.root[0])*sprite.scaleX*(sprite.flipX?-1:1),y:sprite.y+(f[kind][1]-f.root[1])*sprite.scaleY};}
/** Source cells are 256px plus 64px padding on every side: scale stays fixed across poses. */
export function fx22(image:Phaser.GameObjects.Image,row:number,frame:number,size:number){image.setTexture(row===1?'v22-chakra':'v22-effects',String((row===1?0:row*8)+Math.max(0,Math.min(7,frame)))).setOrigin(.5,.5).setScale(size/256);return image;}
export function chakraFrame(age:number,life:number){return age<180?Math.floor(age/90):age>life-220?7:age>life-500?6:2+Math.floor(age/140)%3;}
export class SharinganEye{
 readonly image:Phaser.GameObjects.Image;
 constructor(scene:Phaser.Scene){this.image=scene.add.image(0,0,'v22-effects','0').setDepth(12).setVisible(false);}
 update(age:number,head:{x:number;y:number},facing:number,reduced=false){const growing=age<500,frame=growing?Math.min(4,Math.floor(age/95)):5;fx22(this.image,0,frame,reduced?42:growing?160:34);this.image.setPosition(head.x+(growing?facing*55:facing*7),head.y+(growing?-10:3)).setFlipX(facing<0).setAlpha(growing?.9:.85).setVisible(true);}
 hide(){this.image.setVisible(false);}
 destroy(){this.image.destroy();}
}
