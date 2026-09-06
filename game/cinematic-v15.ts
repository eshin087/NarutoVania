import * as Phaser from 'phaser';
import {TargetedCinemaShot} from './cinematic-motion';
import {poseBattle} from './battle-art';
import {swordPose,swordHand} from './art-v10';
import {makeEffect} from './effects-v14';
import type {RecordedAudio} from './recorded-audio';
import type {AnimationName} from './combat-core';
interface Actor{sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;animation:AnimationName;animationAt:number;facing:-1|1;settleAt?:number;}
export class StagedContacts{
 private swordAt:number|null=null;private sword?:Phaser.GameObjects.Image;private flight?:TargetedCinemaShot;private returning=false;private caught:number|null=null;
 private shieldAt:number|null=null;private shieldHit:number|null=null;private needles:{image:Phaser.GameObjects.Image;flight:TargetedCinemaShot}[]=[];private fired=false;private clock=0;
 constructor(private scene:Phaser.Scene,private actors:ReadonlyMap<string,Actor>,private floor:number,private sound:RecordedAudio,private reaction:(actor:Actor,age:number)=>void){}
 start(kind:string,at:number){if(kind==='arrival-sword')this.swordAt=at;if(kind==='shield-needles')this.shieldAt=at;}
 update(clock:number){const dt=Math.max(0,clock-this.clock);this.clock=clock;
  if(this.swordAt!==null){const age=clock-this.swordAt,z=this.actors.get('zabuza')!,k=this.actors.get('kakashi')!;
   if(age<300)swordPose(z.sprite,Math.min(2,Math.floor(age/100)),z.facing);
   if(age>=300&&!this.sword){const h=swordHand(z.sprite.x,z.sprite.y,3,z.facing);this.sword=this.scene.add.image(h.x,h.y,'v2-zabuza-sword').setDisplaySize(166,28).setDepth(7);this.flight=new TargetedCinemaShot(h.x,h.y,k.sprite.x+26,k.sprite.y-92,1400);this.sound.swordRelease();}
   if(this.flight&&this.caught===null){swordPose(z.sprite,6+Math.floor(age/150)%6,z.facing);if(this.returning){const h=swordHand(z.sprite.x,z.sprite.y,14,z.facing);this.flight.targetX=h.x;this.flight.targetY=h.y;}
    const contact=this.flight.tick(dt);this.sword!.setPosition(this.flight.x,this.flight.y).setRotation(this.flight.rotation);
    if(contact&&!this.returning){k.animation='parry';k.animationAt=clock;k.settleAt=clock+350;this.sound.effect('parry',.65);this.returning=true;const h=swordHand(z.sprite.x,z.sprite.y,14,z.facing);this.flight=new TargetedCinemaShot(this.flight.x,this.flight.y,h.x,h.y,1550);}
    else if(contact){this.caught=clock;this.sword!.setVisible(false);this.sound.swordCatch();}
   }
   if(this.caught!==null){const a=clock-this.caught;if(a<500)swordPose(z.sprite,14+Math.min(3,Math.floor(a/125)),z.facing);else this.swordAt=null;}
  }
  if(this.shieldAt!==null){const age=clock-this.shieldAt,s=this.actors.get('sasuke')!,h=this.actors.get('haku')!;
   if(age<350){s.facing=-1;s.sprite.x=Phaser.Math.Linear(710,510,age/350);poseBattle(s.sprite as Phaser.GameObjects.Sprite,'sasuke','run',age,-1);}
   else if(!this.fired){s.sprite.x=510;s.facing=-1;this.fired=true;h.animation='cast';h.animationAt=clock;for(let i=0;i<3;i++){const y=this.floor-96+i*9,x=h.sprite.x+30;this.needles.push({image:makeEffect(this.scene,'needle',x,y,78,15).setDepth(7),flight:new TargetedCinemaShot(x,y,498,y,780,false)});}this.sound.effect('ice',.35);}
   for(const n of this.needles){if(n.flight.tick(dt)&&this.shieldHit===null){this.shieldHit=clock;this.sound.strike('palm',.6);}n.image.setPosition(n.flight.x,n.flight.y).setRotation(n.flight.rotation).setAlpha(n.flight.contact?Math.max(0,1-n.flight.contactAge/180):1);}
   if(this.shieldHit!==null)this.reaction(s,clock-this.shieldHit);
  }
 }
 get ready(){return this.swordAt===null&&(this.shieldAt===null||this.shieldHit!==null&&this.clock-this.shieldHit>1300);}
 status(){return{sword:this.swordAt===null?'held':this.caught!==null?'catch':this.returning?'returning':'outbound',shieldContact:this.shieldHit!==null};}
}
