import type * as Phaser from 'phaser';
import {pose21,effect21,houndPose,dismissHound} from './art-v21';
import {poseBattle} from './battle-art';
import type {AnimationName} from './combat-core';
import type {RecordedAudio} from './recorded-audio';
interface Actor{sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;animation:AnimationName;animationAt:number;facing:-1|1;settleAt?:number;}
/** Presentation-only choreography; no combat damage or timer-driven actor replacement. */
export class StoryRepairs{
 private prison?:Phaser.GameObjects.Image;private clone?:Phaser.GameObjects.Sprite;private lightning?:Phaser.GameObjects.Image;private dismissed=false;private contact=false;
 constructor(private scene:Phaser.Scene,private actors:ReadonlyMap<string,Actor>,private floor:number,private sounds:RecordedAudio){}
 update(clip:string,clock:number,storyClock:number){
 if(clip==='water-prison')this.capture(clock);
 if(clip==='haku-interception'||clip==='a-demon-in-the-snow')this.interception(storyClock);
 }
 private capture(clock:number){const k=this.actors.get('kakashi')!,z=this.actors.get('zabuza')!,a=Math.max(0,clock-500);
 const lerp=(x:number,y:number,t:number)=>x+(y-x)*Math.max(0,Math.min(1,t));
 if(a<600){poseBattle(k.sprite as Phaser.GameObjects.Sprite,'kakashi','dash',a,1);k.sprite.setPosition(lerp(560,840,a/600),this.floor);z.sprite.setPosition(950,this.floor);}
 else if(a<1250){
  if(!this.clone){this.clone=this.scene.add.sprite(950,this.floor,'zabuza-locomotion','6').setTint(0x80d8ee).setDepth(4);this.sounds.softWater();}
  poseBattle(this.clone,'zabuza','hurt',a-600,-1);this.clone.setAlpha(Math.max(0,1-(a-600)/650));
  pose21(k.sprite,1,1,1);k.sprite.setPosition(lerp(840,890,(a-600)/650),this.floor);
  pose21(z.sprite,2,0,1);z.sprite.setPosition(lerp(680,730,(a-600)/650),this.floor).setAlpha(Math.min(1,(a-600)/250));
 }else{
  if(!this.contact){this.contact=true;this.clone?.destroy();this.clone=undefined;this.prison=this.scene.add.image(890,this.floor-78,'v21-effects','24').setDepth(3.5);this.sounds.softWater();}
  k.facing=-1;z.facing=1;const age=a-1250;pose21(z.sprite,2,age<300?1:age<650?2:3,1);z.sprite.setPosition(730,this.floor).setAlpha(1);
  pose21(k.sprite,1,age<350?2:3,-1);k.sprite.setPosition(890,this.floor).setAlpha(1);
  const frame=age<850?Math.min(5,Math.floor(age/170)):5+Math.floor(age/550)%2;
  effect21(this.prison!,3,frame,194,196);this.prison!.setPosition(k.sprite.x,k.sprite.y-78).setAlpha(.68);
 }
 }
 private interception(clock:number){const k=this.actors.get('kakashi')!,z=this.actors.get('zabuza')!;
 for(let i=0;i<3;i++){const dog=this.actors.get(`hound${i+1}`);if(!dog)continue;const age=clock-(1700+i*50),facing=i===1?-1:1;
  if(age<0||clock>=7400){dog.sprite.setAlpha(0);continue;}
  const t=Math.min(1,age/1000),frame=t<1?(t<.55?Math.floor(age/100)%2:2):4+Math.floor(age/180)%2,mouth=houndPose(dog.sprite,i,frame,facing),tx=z.sprite.x+[-25,30,-14][i]-mouth.x,ty=z.sprite.y-[30,48,62][i]-mouth.y;
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
