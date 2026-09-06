import {makeEffect,animateEffect} from './effects-v14';
import type * as Phaser from 'phaser';
import {TargetedCinemaShot,clashStage} from './cinematic-motion';
import {poseHakuV13,hakuThrowHand} from './art-v13';
import {namedArt,poseBattle} from './battle-art';
import {poseHurt} from './art-v11';
import {reactionPose} from './art-v10';
import type {AnimationName} from './combat-core';
import type {RecordedAudio} from './recorded-audio';
export type CinemaMotion='rescue-shot'|'dragon-clash'|'counter-wave'|'hunter-throw'|'carry'|'teamwork'|'snow-carry'|'sasuke-fall'|'awakening'|'unmask'|'intercept';
interface Actor{sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;animation:AnimationName;animationAt:number;facing:-1|1;settleAt?:number;}
interface Shot{motion:TargetedCinemaShot;image:Phaser.GameObjects.Image;target:Actor;dx:number;dy:number;kind:'rescue'|'senbon'|'counter';}
/** Uses the story clock. Panel holds and pause therefore freeze every flight and carry step. */
export class CinematicMotionV13{
 shots:Shot[]=[];clock=0;counterAt:number|null=null;counterHitAt:number|null=null;throwAt:number|null=null;thrown=false;collapseAt:number|null=null;clashAt:number|null=null;clashed=false;
 dragons:Phaser.GameObjects.Image[]=[];clash?:Phaser.GameObjects.Image;carryAt:number|null=null;carryX=0;carryDone=false;pair?:Phaser.GameObjects.Sprite;
 constructor(private scene:Phaser.Scene,private actors:ReadonlyMap<string,Actor>,private floor:number,private sounds:RecordedAudio,private releasePrison:()=>void,private shake:()=>void){}
 start(kind:CinemaMotion,at:number){
  this.clock=at;const haku=this.actors.get('haku'),zabuza=this.actors.get('zabuza'),naruto=this.actors.get('naruto'),kakashi=this.actors.get('kakashi');
  if(kind==='rescue-shot'&&naruto&&zabuza){this.shot(naruto.sprite.x-28,naruto.sprite.y-77,zabuza,27,-105,'rescue');}
  if(kind==='dragon-clash'&&kakashi&&zabuza){this.clashAt=at;this.clashed=false;for(const actor of [kakashi,zabuza]){actor.animation='cast';actor.animationAt=at;actor.settleAt=at+3000;}
   this.dragons=[1,-1].map(dir=>makeEffect(this.scene,'water-dragon',0,0,650,300).setOrigin(dir>0?.89:.11,.5).setFlipX(dir<0).setDepth(5));
   this.clash=this.scene.add.image(780,this.floor-215,'v13-clash','0').setScale(.8).setDepth(6).setVisible(false);
   this.scene.tweens.add({targets:this.scene.cameras.main,zoom:.84,scrollX:0,scrollY:0,duration:650,ease:'Sine.easeInOut'});this.sounds.softWater();
  }
  if(kind==='counter-wave'&&kakashi&&zabuza){this.counterAt=at;kakashi.animation='cast';kakashi.settleAt=at+1800;}
  if(kind==='hunter-throw'&&haku){this.throwAt=at;this.thrown=false;haku.animation='cast';haku.animationAt=at;haku.settleAt=undefined;}
  if(kind==='carry'&&haku&&zabuza){this.carryAt=at;this.carryX=haku.sprite.x;this.scene.tweens.killTweensOf(haku.sprite);this.scene.tweens.killTweensOf(zabuza.sprite);
   haku.sprite.setAlpha(0);zabuza.sprite.setAlpha(0);this.pair=this.scene.add.sprite(this.carryX,this.floor,'v13-haku-carry-zabuza','0').setDepth(5);this.sounds.effect('step',.3);
  }
 }
 private shot(x:number,y:number,target:Actor,dx:number,dy:number,kind:Shot['kind']){
  const image=kind==='senbon'?makeEffect(this.scene,'needle',x,y,64,13).setOrigin(.85,.5):kind==='counter'?makeEffect(this.scene,'water-dragon',x,y,650,300).setOrigin(.89,.5):namedArt(this.scene,'props','shuriken',x,y,32);
  image.setDepth(7);const motion=new TargetedCinemaShot(x,y,target.sprite.x+dx,target.sprite.y+dy,kind==='counter'?850:kind==='senbon'?1150:1000,kind==='rescue');
  this.shots.push({image,motion,target,dx,dy,kind});
 }
 update(clock:number){
  const dt=Math.max(0,clock-this.clock);this.clock=clock;const zabuza=this.actors.get('zabuza'),haku=this.actors.get('haku');
  if(this.counterAt!==null&&clock-this.counterAt>=700&&zabuza){const k=this.actors.get('kakashi')!;this.shot(k.sprite.x+65,this.floor-85,zabuza,-35,-85,'counter');this.counterAt=null;this.sounds.softWater();}
  if(this.throwAt!==null&&haku){const age=clock-this.throwAt;poseHakuV13(haku.sprite,'senbon',age<85?0:age<145?1:age<205?2:age<300?3:age<430?4:5,haku.facing);
   if(age>=205&&!this.thrown&&zabuza){this.thrown=true;const hand=hakuThrowHand(haku.sprite.x,haku.sprite.y,haku.facing);for(const offset of [-6,0,6])this.shot(hand.x,hand.y+offset,zabuza,8,-141+offset,'senbon');this.sounds.effect('swing',.5);}
   if(age>650)this.throwAt=null;
  }
  this.shots=this.shots.filter(s=>{
   if(s.motion.tick(dt)){
    if(s.kind==='rescue'){s.target.animation='hurt';s.target.animationAt=clock;s.target.settleAt=clock+420;this.scene.tweens.add({targets:s.target.sprite,x:s.target.sprite.x-70,duration:300,ease:'Cubic.easeOut'});this.releasePrison();this.sounds.strike('palm',.5);}
    if(s.kind==='senbon'&&this.collapseAt===null){this.collapseAt=clock;s.target.animation='defeat';s.target.animationAt=clock;s.target.settleAt=undefined;this.sounds.strike('palm',.35);}
    if(s.kind==='counter'){s.target.animation='hurt';s.target.animationAt=clock;s.target.settleAt=undefined;this.counterHitAt=clock;this.scene.tweens.add({targets:s.target.sprite,x:1280,duration:450,ease:'Cubic.easeOut'});this.sounds.softWater();}
   }
   s.image.setPosition(s.motion.contact?s.target.sprite.x+s.dx:s.motion.x,s.motion.contact?s.target.sprite.y+s.dy:s.motion.y).setRotation(s.kind==='counter'?0:s.motion.rotation);
   if(s.kind==='counter'){animateEffect(s.image,'water-dragon',s.motion.age,3900);if(s.motion.contact)s.image.setFrame(String(12+Math.min(3,Math.floor(s.motion.contactAge/120))));s.image.setAlpha(s.motion.contact?Math.max(0,1-s.motion.contactAge/480):1);}
   if(s.kind==='senbon')animateEffect(s.image,'needle',s.motion.age,1000);
   if(s.kind==='senbon'&&s.motion.contact){s.image.setAlpha(Math.max(0,1-s.motion.contactAge/180));if(s.motion.contactAge>=180){s.image.destroy();return false;}}
   if(s.motion.done){s.image.destroy();return false;}return true;
  });
  if(this.counterHitAt!==null&&this.collapseAt===null&&zabuza&&clock-this.counterHitAt>250)reactionPose(zabuza.sprite,'zabuza','injured',clock-this.counterHitAt,zabuza.facing);
  if(this.collapseAt!==null&&zabuza&&this.carryAt===null){const age=clock-this.collapseAt;
   if(age<180)poseHurt(zabuza.sprite as Phaser.GameObjects.Sprite,'zabuza',age,-1);
   else if(age<460)reactionPose(zabuza.sprite,'zabuza','injured',age-180,-1);
   else poseBattle(zabuza.sprite as Phaser.GameObjects.Sprite,'zabuza','defeat',age-460,-1);
  }
  if(this.clashAt!==null){const age=clock-this.clashAt,stage=clashStage(age),center=780;
   if(stage==='formation'||stage==='surge')this.dragons.forEach((dragon,i)=>{const origin=i===0?430:1130,progress=Math.max(0,Math.min(1,(age-700)/700)),headX=origin+(center-origin)*progress;animateEffect(dragon,'water-dragon',age,3000);dragon.setPosition(headX,this.floor-215).setAlpha(Math.min(1,age/220));});
   else{this.dragons.forEach(d=>d.setVisible(false));if(!this.clashed){this.clashed=true;this.shake();this.sounds.softWater();}
    this.clash?.setVisible(stage!=='done').setFrame(String(Math.min(7,Math.floor((age-1400)/200)))).setAlpha(stage==='spray'?Math.max(0,(3000-age)/650):1);
    if(stage==='done'){this.dragons.forEach(d=>d.destroy());this.dragons=[];this.clash?.destroy();this.clash=undefined;this.clashAt=null;}
   }
  }
  if(this.carryAt!==null&&this.pair){const age=clock-this.carryAt,walking=age>=1800;
   const frame=walking?6+Math.floor((age-1800)/120)%6:Math.min(5,Math.floor(age/280));
   poseHakuV13(this.pair,'carry-zabuza',frame,walking?1:-1);this.pair.setPosition(this.carryX+Math.max(0,age-1800)*.245,this.floor);
   haku?.sprite.setAlpha(0);zabuza?.sprite.setAlpha(0);
   this.carryDone=this.pair.getBounds().left>this.scene.cameras.main.worldView.right+20;
  }
 }
 get ready(){return this.carryAt===null||this.carryDone;}
 status(){return{shots:this.shots.map(s=>({kind:s.kind,x:s.image.x,y:s.image.y,contact:s.motion.contact,rotation:s.image.rotation})),clash:this.clashAt!==null?clashStage(this.clock-this.clashAt):null,needlesReleased:this.thrown,carrying:this.carryAt!==null,carryDone:this.carryDone};}
}
