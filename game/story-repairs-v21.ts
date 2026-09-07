import {pose22,attachment22} from './art-v22';
import type * as Phaser from 'phaser';
import {effect21,dismissHound} from './art-v21';
import {poseBattle} from './battle-art';
import type {AnimationName} from './combat-core';
import type {RecordedAudio} from './recorded-audio';
interface Actor{sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;animation:AnimationName;animationAt:number;facing:-1|1;settleAt?:number;}
/** Presentation-only choreography; no combat damage or timer-driven actor replacement. */
export class StoryRepairs{
 private lightning?:Phaser.GameObjects.Image;private dismissed=false;private contact=false;
 constructor(private scene:Phaser.Scene,private actors:ReadonlyMap<string,Actor>,private floor:number,private sounds:RecordedAudio){}
 update(clip:string,_clock:number,storyClock:number){
 if(clip==='haku-interception'||clip==='a-demon-in-the-snow')this.interception(storyClock);
 }
 private interception(clock:number){const k=this.actors.get('kakashi')!,z=this.actors.get('zabuza')!;
 for(let i=0;i<3;i++){const dog=this.actors.get(`hound${i+1}`);if(!dog)continue;const age=clock-(1700+i*50),facing=i===1?-1:1;
  if(age<0||clock>=7400){dog.sprite.setAlpha(0);continue;}
  const t=Math.min(1,age/1000),frame=t<1?(t<.55?Math.floor(age/100)%2:2):4+Math.floor(age/180)%2,mouth=(()=>{pose22(dog.sprite,t<1?'hounds':'hound-hold',i,t<1?Math.min(3,frame):Math.floor(age/150)%4,facing);const m=attachment22(dog.sprite,'mouth');return{x:m.x-dog.sprite.x,y:m.y-dog.sprite.y};})(),tx=z.sprite.x+[-25,30,-14][i]-mouth.x,ty=z.sprite.y-[30,48,62][i]-mouth.y;
  dog.sprite.setPosition(650+i*55+(tx-650-i*55)*t,this.floor+(ty-this.floor)*t-Math.sin(t*Math.PI)*40).setAlpha(1).setDepth(6);
 }
 if(clock>=4400&&clock<7950){
  if(!this.lightning){this.lightning=this.scene.add.image(k.sprite.x,k.sprite.y-80,'v21-effects','8').setDepth(9);this.sounds.effect('lightning',.55);}
  const rushing=clock>=6300,impact=clock>=7400;const frame=impact?Math.min(7,5+Math.floor((clock-7400)/170)):rushing?3+Math.floor(clock/85)%2:1+Math.floor(clock/140)%2;
  effect21(this.lightning,1,frame,impact?200:rushing?170:110,impact?180:rushing?100:105);this.lightning.setPosition(k.sprite.x+(rushing?60:29)*k.facing,k.sprite.y-(rushing?76:85)).setFlipX(k.facing<0);
  if(!impact){poseBattle(k.sprite as Phaser.GameObjects.Sprite,'kakashi',rushing?'dash':'cast',clock-4400,k.facing);}
 }else if(this.lightning){this.lightning.destroy();this.lightning=undefined;}
 if(clock>=7400&&!this.dismissed){this.dismissed=true;this.sounds.effect('smoke',.4);for(let i=0;i<3;i++){const dog=this.actors.get(`hound${i+1}`);if(dog){this.scene.tweens.killTweensOf(dog.sprite);dismissHound(this.scene,dog.sprite.x,dog.sprite.y-20);dog.sprite.setAlpha(0);}}}
 }
 status(){return{prisonContact:this.contact,houndsDismissed:this.dismissed,lightningVisible:!!this.lightning};}
}
