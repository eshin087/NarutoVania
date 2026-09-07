import {pose22,attachment22} from './art-v22';
import {poseRepair} from './art-v15';
import {StagedContacts} from './cinematic-v15';
import * as Phaser from 'phaser';
import {CinematicMotionV13,type CinemaMotion} from './cinematic-v13';
import {TargetedCinemaShot} from './cinematic-motion';
import {poseCinema} from './art-cinema-v14';
import {namedArt,poseBattle} from './battle-art';
import type {AnimationName} from './combat-core';
import type {RecordedAudio} from './recorded-audio';
interface Actor{sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;animation:AnimationName;animationAt:number;facing:-1|1;settleAt?:number;}
export class CinematicMotionV14{
 private contacts:StagedContacts;private legacy:CinematicMotionV13;private clock=0;private teamworkAt:number|null=null;private snowAt:number|null=null;
 private leading?:{model:TargetedCinemaShot;image:Phaser.GameObjects.Image};private hidden?:{model:TargetedCinemaShot;image:Phaser.GameObjects.Image};
 private leadContact:number|null=null;private revealed:number|null=null;private rescued=false;private released=false;private caught?:Phaser.GameObjects.Image;
 private teamStarts:{nx:number;sx:number;zx:number}|null=null;private heldTool?:Phaser.GameObjects.Image;private pair?:Phaser.GameObjects.Sprite;private snowX=1450;private snowDone=false;
 private reactions=new Map<string,{at:number;start:number;count:number;duration:number;height:number}>();
 constructor(private scene:Phaser.Scene,private actors:ReadonlyMap<string,Actor>,private floor:number,private sounds:RecordedAudio,private releasePrison:()=>void,shake:()=>void,speak?:(id:string,text:string)=>void){this.legacy=new CinematicMotionV13(scene,actors,floor,sounds,releasePrison,shake,speak);this.contacts=new StagedContacts(scene,actors,floor,sounds,(a,age)=>{if(age<1200)poseRepair(a.sprite,4+Math.min(3,Math.floor(age/300)),-1);else poseBattle(a.sprite as Phaser.GameObjects.Sprite,'sasuke','defeat',1400,-1);});}
 start(kind:CinemaMotion,at:number){
  if(kind==='arrival-sword'||kind==='shield-needles'){this.contacts.start(kind,at);return;}
  if(kind==='teamwork'){this.teamworkAt=at;return;}
  if(kind==='snow-carry'){this.snowAt=at;const z=this.actors.get('zabuza');this.snowX=z?.sprite.x||1450;return;}
  const reaction=kind==='sasuke-fall'?{id:'sasuke',start:0,count:6,duration:1200,height:135}:kind==='awakening'?{id:'naruto',start:6,count:6,duration:2000,height:132}:kind==='unmask'?{id:'haku',start:12,count:3,duration:1100,height:146}:kind==='intercept'?{id:'haku',start:16,count:2,duration:900,height:146}:null;
  if(reaction){this.reactions.set(reaction.id,{...reaction,at});return;}
  this.legacy.start(kind,at);
 }
 update(clock:number){const dt=Math.max(0,clock-this.clock);this.clock=clock;this.legacy.update(clock);this.contacts.update(clock);
  if(this.teamworkAt!==null)this.teamwork(clock-this.teamworkAt,dt);
  if(this.snowAt!==null)this.snow(clock-this.snowAt);
  for(const[id,r]of this.reactions){const a=this.actors.get(id);if(!a)continue;const age=clock-r.at;
   if(id==='naruto'&&age>r.duration){poseBattle(a.sprite as Phaser.GameObjects.Sprite,'naruto','idle',age-r.duration,a.facing,undefined,'awakened');continue;}
   if(id==='haku'&&r.start===12&&age>r.duration){this.reactions.delete(id);continue;}
   poseCinema(a.sprite,'reactions',r.start+Math.min(r.count-1,Math.floor(age/r.duration*r.count)),r.height,a.facing);
  }
 }
 private teamwork(age:number,dt:number){
  const n=this.actors.get('naruto')!,s=this.actors.get('sasuke')!,z=this.actors.get('zabuza')!;
  if(!this.teamStarts)this.teamStarts={nx:n.sprite.x,sx:s.sprite.x,zx:z.sprite.x};const base=this.teamStarts,zx=base.zx,nx=Math.max(170,zx-590),sx=Math.max(300,zx-450);
  if(this.leadContact===null){const prisoner=this.actors.get('prisoner');pose22(z.sprite,'characters-a',2,5,(prisoner?.sprite.x??zx+120)>zx?1:-1);}
  if(age<1200){for(const [a,id,from,to]of [[n,'naruto',base.nx,nx],[s,'sasuke',base.sx,sx]] as const){a.facing=to>=from?1:-1;poseBattle(a.sprite as Phaser.GameObjects.Sprite,id,Math.abs(from-to)>20?'run':'idle',age,a.facing);a.sprite.setPosition(Phaser.Math.Linear(from,to,Math.min(1,age/1100)),this.floor);}return;}
  const t=age-1200;
  if(t<1300){poseCinema(n.sprite,'teamwork',Math.min(5,Math.floor(t/220)),132,1);n.sprite.setPosition(nx,this.floor);}
  else if(this.revealed===null)n.sprite.setAlpha(0);
  if(t>1100&&t<3000){poseCinema(s.sprite,'teamwork',6+Math.min(5,Math.floor((t-1100)/320)),135,1);s.sprite.setPosition(sx,this.floor);s.facing=1;}
  if(t>=2450&&!this.released){this.released=true;const x=sx+45,y=this.floor-83;
   this.leading={model:new TargetedCinemaShot(x,y,zx-35,this.floor-86,900),image:namedArt(this.scene,'props','windmill-shuriken',x,y,80).setDepth(7)};
   this.hidden={model:new TargetedCinemaShot(x-28,y+12,zx+195,this.floor-73,880),image:namedArt(this.scene,'props','windmill-shuriken',x-28,y+12,70).setDepth(6)};this.sounds.effect('swing',.65);
  }
  for(const which of ['leading','hidden'] as const){const shot=this[which];if(!shot)continue;const contact=shot.model.tick(dt);shot.image.setPosition(shot.model.x,shot.model.y).setRotation(shot.model.rotation);
   if(contact&&which==='leading'){this.leadContact=t;this.caught=shot.image;this.sounds.effect('guard',.65);}
   if(contact&&which==='hidden'){this.revealed=t;shot.image.destroy();this.hidden=undefined;this.sounds.effect('smoke',.55);}
  }
  if(this.leadContact!==null){const a=t-this.leadContact;
   if(a<950){const jump=Phaser.Math.Clamp((a-130)/760,0,1);poseCinema(z.sprite,'teamwork',12+Math.min(5,Math.floor(a/175)),167,-1,-1);z.sprite.setPosition(zx,this.floor-Math.sin(jump*Math.PI)*105);}
   else if(!this.rescued)z.sprite.y=this.floor;
   if(this.caught){this.caught.setPosition(z.sprite.x-37,z.sprite.y-85+Math.max(0,a-900)*.12).setRotation(a>900?(a-900)*.009:0).setAlpha(a<900?1:Math.max(0,1-(a-900)/500));if(a>=1400){this.caught.destroy();this.caught=undefined;this.leading=undefined;}}
  }
  if(this.revealed!==null){const a=t-this.revealed;n.sprite.setAlpha(1);n.facing=-1;
   if(a<1300){pose22(n.sprite,'characters-a',0,Math.min(5,Math.floor(a/205)),-1);n.sprite.setPosition(zx+195,this.floor-Math.max(0,1-a/850)*72);}
   else{n.sprite.setPosition(zx+195,this.floor);poseBattle(n.sprite as Phaser.GameObjects.Sprite,'naruto','idle',a-1300,-1);}
   if(a<610){if(!this.heldTool)this.heldTool=namedArt(this.scene,'props','shuriken',0,0,26).setDepth(7);const hand=attachment22(n.sprite,'hand');this.heldTool.setPosition(hand.x,hand.y);}
   if(a>=610&&!this.rescued){this.rescued=true;const hand=attachment22(n.sprite,'hand');n.sprite.y+=(z.sprite.y-86)-hand.y;this.heldTool?.destroy();this.heldTool=undefined;this.legacy.start('rescue-shot',this.clock);}
  }
 }
 private snow(age:number){const k=this.actors.get('kakashi')!,z=this.actors.get('zabuza')!;
  if(age<1500){k.facing=1;poseBattle(k.sprite as Phaser.GameObjects.Sprite,'kakashi','run',age,1);k.sprite.x=Phaser.Math.Linear(930,this.snowX-30,age/1500);poseCinema(z.sprite,'reactions',21,167,-1,-1);return;}
  if(!this.pair){this.pair=this.scene.add.sprite(this.snowX-30,this.floor,'v14-carry','0').setDepth(5);}
  const a=age-1500;let x:number;
  if(a<1800){x=this.snowX-30;}
  else if(a<4200){x=Phaser.Math.Linear(this.snowX-30,1240,(a-1800)/2400);}
  else{x=1240;}
  const repairFrame=a<1800?(a<550?15:a<1150?14:12):a<4200?12+Math.floor((a-1800)/200)%2:a<5100?14:15;
  poseRepair(this.pair,repairFrame,a<1800?1:-1);this.pair.setPosition(x,this.floor);k.sprite.setAlpha(0).setPosition(x,this.floor);z.sprite.setAlpha(0).setPosition(x-30,this.floor);
  if(a>=6500){this.pair.setVisible(false);k.sprite.setAlpha(1);k.facing=-1;poseBattle(k.sprite as Phaser.GameObjects.Sprite,'kakashi',a<7100?'run':'idle',a-6500,a<7100?1:-1);k.sprite.x=1240+Math.min(1,(a-6500)/600)*95;z.sprite.setAlpha(1).setPosition(1230,this.floor);poseCinema(z.sprite,'reactions',23,167,-1,-1);}
  this.snowDone=a>=10500;
 }
 get ready(){return this.contacts.ready&&this.legacy.ready&&(this.teamworkAt===null||this.rescued&&this.clock-this.teamworkAt>8500)&&(this.snowAt===null||this.snowDone);}
 status(){return{...this.legacy.status(),contacts:this.contacts.status(),teamwork:this.teamworkAt===null?null:{released:this.released,caught:this.leadContact!==null,revealed:this.revealed!==null,rescued:this.rescued},snowCarrying:this.snowAt!==null,snowDone:this.snowDone};}
}
