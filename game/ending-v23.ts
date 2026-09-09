import {interceptionPositions} from './ending-timing-v23';
import type * as Phaser from 'phaser';
import type {CinemaClip,CinemaActor,CinemaCue,ActorId} from './story-director';
import type {CharacterId,AnimationName} from './combat-core';
import type {RecordedAudio} from './recorded-audio';
import {poseBattle} from './battle-art';
import {pose22} from './art-v22';
import {pose23,anchor23} from './art-v23';
import {poseCinema} from './art-cinema-v14';
import {poseRepair} from './art-v15';
import {endingPose} from './art-v10';
import {effect21,dismissHound} from './art-v21';
interface Actor{sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;animation:AnimationName;animationAt:number;facing:-1|1;settleAt?:number;}
const mix=(a:number,b:number,t:number)=>a+(b-a)*Math.max(0,Math.min(1,t));
export const ENDING_IDS=['haku-interception','gatos-betrayal','snowy-rest'];
export function endingClip(index:number):CinemaClip{
 const a=(id:ActorId,x:number,animation:AnimationName='idle',facing:1|-1=1,alpha=1):CinemaActor=>({id,x,y:592,animation,facing,alpha});
 const actors=[a('kakashi',110),a('zabuza',700,'idle',-1),a('haku',1200,'idle',-1),a('naruto',1330,'idle',-1),a('sasuke',1065,'defeat',-1),a('sakura',-220),a('gato',1940,'idle',-1),a('henchman1',1710,'idle',-1),a('henchman2',1810,'idle',-1),a('henchman3',1900,'idle',-1),a('hound1',110,'idle',1,0),a('hound2',110,'idle',1,0),a('hound3',110,'idle',1,0)];
 if(index>0){actors.find(a=>a.id==='haku')!.x=605;actors.find(a=>a.id==='haku')!.animation='defeat';actors.find(a=>a.id==='kakashi')!.x=540;actors.find(a=>a.id==='sakura')!.x=1140;}
 if(index===2){actors.find(a=>a.id==='zabuza')!.x=1450;actors.find(a=>a.id==='zabuza')!.animation='guardbreak';actors.filter(a=>a.id==='gato'||a.id.startsWith('henchman')).forEach(a=>a.alpha=0);}
 return{id:ENDING_IDS[index],arena:'bridge',authored:true,duration:[13200,18000,14700][index],actors,cues:index===2?[{at:0,effect:'snow'}]:[]};
}
/** One owner drives the ending; poses, contact, and movement cannot race legacy cues. */
export class EndingStory{
 readonly active:boolean;private starts=new Map<string,{x:number;y:number}>();private propPoses=new Map<string,{texture:string;frame:string;scale:number;originX:number;originY:number}>();private flags=new Set<string>();private clock=0;private lightning?:Phaser.GameObjects.Image;private pair?:Phaser.GameObjects.Sprite;private contact:number|null=null;
 constructor(private scene:Phaser.Scene,private clip:string,private actors:ReadonlyMap<string,Actor>,private floor:number,private sound:RecordedAudio,private cue:(c:CinemaCue)=>void){this.active=ENDING_IDS.includes(clip);for(const[id,a]of actors){this.starts.set(id,{x:a.sprite.x,y:a.sprite.y});if(id.startsWith('henchman')||id==='gato')this.propPoses.set(id,{texture:a.sprite.texture.key,frame:a.sprite.frame.name,scale:a.sprite.scaleX,originX:a.sprite.originX,originY:a.sprite.originY});}}
 private a(id:string){return this.actors.get(id)!;}
 private once(id:string,fn:()=>void){if(!this.flags.has(id)){this.flags.add(id);fn();}}
 private say(id:string,who:ActorId,speech:string){this.once(id,()=>this.cue({at:this.clock,actor:who,speech}));}
 private pose(id:CharacterId,animation:AnimationName,age=0,facing:1|-1=1){const a=this.a(id);a.animation=animation;a.facing=facing;poseBattle(a.sprite as Phaser.GameObjects.Sprite,id,animation,age,facing,undefined,id==='haku'?'unmasked':undefined);}
 private fixed(id:string){const a=this.a(id),p=this.starts.get(id)!;a.sprite.setPosition(p.x,p.y);}
 update(age:number){if(!this.active)return;this.clock=age;if(this.clip===ENDING_IDS[0])this.intercept(age);else if(this.clip===ENDING_IDS[1])this.gato(age);else this.snow(age);}
 private intercept(a:number){const k=this.a('kakashi'),h=this.a('haku'),sakura=this.a('sakura'),ks=this.starts.get('kakashi')!,zs=this.starts.get('zabuza')!,hs=this.starts.get('haku')!;
  const sx=this.a('sasuke').sprite.x+75;this.once('sakura-origin',()=>{this.starts.set('sakura',{x:Math.min(-180,this.scene.cameras.main.worldView.left-200),y:this.floor});});
  this.pose('sakura',a<2600?'run':'idle',a,1);sakura.sprite.setPosition(mix(this.starts.get('sakura')!.x,sx,a/2600),this.floor).setAlpha(1);
  this.pose('naruto','idle',0,-1);pose22(this.a('sasuke').sprite,'characters-b',1,5,-1);
  this.fixed('zabuza');this.pose('zabuza',a<3000?'idle':'hurt',a<3000?0:180,-1);
  if(a<3000){this.pose('kakashi',a<900?'idle':'cast',a-900,1);k.sprite.setPosition(ks.x,this.floor);}
  else if(a<6300){this.pose('kakashi','cast',a-3000,1);k.sprite.setPosition(ks.x,this.floor);}
  const motion=interceptionPositions(a,ks.x,zs.x,hs.x),stopX=zs.x-155,interceptX=motion.contactX;
  if(a>=6300&&this.contact===null){this.pose('kakashi','dash',a-6300,1);k.sprite.setPosition(motion.kakashiX,this.floor);if(motion.contact)this.contact=a;}
  if(a<6100){h.sprite.setPosition(hs.x,this.floor).setAlpha(1);this.pose('haku','idle',0,-1);}
  else if(this.contact===null){const t=Math.min(1,(a-6100)/1000);pose23(h.sprite,'actors',1,t<.75?0:1,-1);h.sprite.setPosition(motion.hakuX,this.floor-Math.sin(t*Math.PI)*28);}
  if(this.contact!==null){const t=a-this.contact;k.sprite.setPosition(stopX,this.floor);this.pose('kakashi',t<550?'light3':'idle',t<550?220:0,1);pose23(h.sprite,'actors',1,t<220?2:t<600?3:t<1000?4:5,-1);h.sprite.setPosition(interceptX,this.floor);if(t>=1100){h.animation='defeat';h.sprite.setDepth(2);}this.once('interception-contact',()=>{this.sound.effect('parry',.5);for(let i=0;i<3;i++){const d=this.a('hound'+(i+1));dismissHound(this.scene,d.sprite.x,d.sprite.y-15);d.sprite.setAlpha(0);}});}
  if(a>=3100&&(this.contact===null||a-this.contact<500)){if(!this.lightning)this.lightning=this.scene.add.image(0,0,'v21-effects','8').setDepth(9);const impact=this.contact!==null;effect21(this.lightning,1,impact?6:a<6300?1+Math.floor(a/120)%2:3+Math.floor(a/80)%2,impact?180:a<6300?115:165,impact?160:110);this.lightning.setPosition(k.sprite.x+(a<6300?29:60),this.floor-80).setAlpha(impact?Math.max(0,1-(a-this.contact!)/500):1);this.once('chidori-audio',()=>this.sound.effect('lightning',.5));}else this.lightning?.setVisible(false);
  for(let i=0;i<3;i++){const d=this.a('hound'+(i+1)).sprite,age=a-2700-i*150;if(age<0||this.contact!==null){d.setAlpha(0);continue;}const t=Math.min(1,age/750),face=i===1?-1:1;pose23(d,'support',i+1,t<.6?Math.floor(age/100)%2:t<1?2:3+Math.floor(age/180)%3,face);const mouth=anchor23(d,'mouth'),dx=mouth.x-d.x,tx=zs.x+[-22,23,0][i]-dx,ty=this.floor;d.setPosition(mix(ks.x+i*20,tx,t),mix(this.floor,ty,t)-Math.sin(t*Math.PI)*20).setAlpha(1).setDepth(6);}
  if(a>=11200)pose23(this.a('zabuza').sprite,'actors',2,0,1);
  if(a>=3300)this.say('hound-line','kakashi','The hounds have your scent. This ends now.');if(a>=8200)this.say('haku-last','haku','Zabuza… I will protect you.');
  const camera=this.scene.cameras.main;camera.setZoom(mix(camera.zoom,.83,.035));camera.centerOn(mix(camera.worldView.centerX,(ks.x+zs.x)/2,.035),360);
 }
 private gato(a:number){const z=this.a('zabuza'),n=this.a('naruto'),h=this.a('haku'),zs=this.starts.get('zabuza')!,ns=this.starts.get('naruto')!;const target=[1300,1400,1490];
  pose23(h.sprite,'actors',1,5,-1);this.fixed('haku');this.pose('kakashi','idle',0,1);pose22(this.a('sasuke').sprite,'characters-b',1,5,-1);this.pose('sakura','idle',0,-1);
  for(const[id,x]of [['gato',1490],['henchman1',1300],['henchman2',1400],['henchman3',1580]] as const){const e=this.a(id);if(a<10700){e.sprite.setPosition(x,this.floor).setAlpha(1);const p=this.propPoses.get(id)!;e.sprite.setTexture(p.texture,p.frame).setScale(p.scale).setOrigin(p.originX,p.originY).setFlipX(true);}}
  if(a<10700){pose23(z.sprite,'actors',2,a<8400?0:3,1);z.sprite.setPosition(zs.x,this.floor);}
  if(a<6200){this.pose('naruto','idle',0,-1);n.sprite.setPosition(ns.x,this.floor);}else if(a<7600){this.pose('naruto','run',a-6200,ns.x>zs.x?-1:1);n.sprite.setPosition(mix(ns.x,zs.x+80,(a-6200)/1400),this.floor);}else if(a<9800){pose23(n.sprite,'actors',3,a>=8400?5:Math.min(3,1+Math.floor((a-7600)/270)),-1);n.sprite.setPosition(zs.x+80,this.floor);}
  else{this.pose('naruto',a<10600?'run':'idle',a-9800,a<10600?1:-1);n.sprite.setPosition(mix(zs.x+80,zs.x+170,(a-9800)/800),this.floor);}
  if(a>=10700){const t=a-10700;
   if(t<3400){const x=t<1600?mix(zs.x,1280,t/1600):t<2400?mix(1280,1380,(t-1600)/800):mix(1380,1470,(t-2400)/1000);z.sprite.setPosition(x,this.floor);endingPose(z.sprite,'zabuza',t<1500?'run':'heavy',t<1500?t:(t-1500)%600,1);}
   else{z.sprite.setPosition(1470,this.floor);pose23(z.sprite,'actors',2,Math.min(5,3+Math.floor((t-3400)/350)),1);}
   for(const [i,id]of ['henchman1','henchman2','gato'].entries()){const e=this.a(id),hit=[12300,13100,13900][i];if(a<hit){endingPose(e.sprite,id==='gato'?'gato':'mercenary','defeat',a>=10700+i*130?70:0,-1);}else{endingPose(e.sprite,id==='gato'?'gato':'mercenary','defeat',a-hit,-1);e.sprite.setPosition(target[i],this.floor);this.once('hit-'+id,()=>this.sound.strike('kick',.5));}}
   const flee=this.a('henchman3');pose23(flee.sprite,'support',0,Math.floor(t/85)%8,1);flee.sprite.setPosition(1580+t*.30,this.floor);
  }
  if(a>=100)this.say('gato-taunt','gato','You failed. I have no reason to pay you.');if(a>=3300)this.say('naruto-grief','naruto','Haku gave everything for you!');if(a>=6400)this.say('kunai-request','zabuza','Boy… lend me your kunai.');if(a>=14800)this.say('gato-end','zabuza','This is the end of our contract.');
  const c=this.scene.cameras.main;c.setZoom(mix(c.zoom,.84,.035));c.centerOn(mix(c.worldView.centerX,a<10700?(zs.x+1000)/2:Math.min(1200,z.sprite.x),.035),360);
 }
 private snow(a:number){const k=this.a('kakashi'),z=this.a('zabuza'),h=this.a('haku'),ks=this.starts.get('kakashi')!,zs=this.starts.get('zabuza')!,hx=this.starts.get('haku')!.x,dest=hx+130,dir:1|-1=dest>zs.x?1:-1;
  pose23(h.sprite,'actors',1,5,-1);this.fixed('haku');pose22(this.a('sasuke').sprite,'characters-b',1,5,-1);this.pose('sakura','idle',0,-1);this.pose('naruto','idle',0,-1);
  if(a<3000){this.pose('kakashi',a<700?'idle':'run',a-700,zs.x>ks.x?1:-1);k.sprite.setPosition(mix(ks.x,zs.x-35,(a-700)/2300),this.floor);pose23(z.sprite,'actors',2,5,1);z.sprite.setPosition(zs.x,this.floor);}
  else{if(!this.pair)this.pair=this.scene.add.sprite(zs.x-35,this.floor,'v15-reactions','12').setDepth(5);const t=a-3000,x=t<1800?zs.x-35:t<4800?mix(zs.x-35,dest,(t-1800)/3000):dest;
   const frame=t<1800?t<500?15:t<1050?14:12:t<4800?12+Math.floor(t/180)%2:t<5600?14:15;poseRepair(this.pair,frame,t<1800?1:dir);this.pair.setPosition(x,this.floor);k.sprite.setAlpha(0).setPosition(x,this.floor);z.sprite.setAlpha(0).setPosition(x,this.floor);
   if(t>=6800){this.pair.setVisible(false);k.sprite.setAlpha(1);this.pose('kakashi',t<7600?'run':'idle',t-6800,t<7600?1:-1);k.sprite.setPosition(dest+mix(0,100,(t-6800)/800),this.floor);z.sprite.setAlpha(1).setPosition(dest-10,this.floor);poseCinema(z.sprite,'reactions',23,167,-1,-1);z.animation='defeat';}
  }
  if(a>=200)this.say('snow-request','zabuza','Kakashi… take me to Haku.');if(a>=10200)this.say('snow-rest','zabuza','Let me rest beside you, Haku.');
  const c=this.scene.cameras.main;c.setZoom(mix(c.zoom,.84,.035));c.centerOn(mix(c.worldView.centerX,a<7500?(z.sprite.x+hx)/2:hx+90,.025),360);
 }
 get ready(){return !this.active||this.clip!==ENDING_IDS[0]||this.contact!==null;}
 status(){return{active:this.active,clip:this.clip,contact:this.contact,beats:[...this.flags]};}
 destroy(){this.lightning?.destroy();this.pair?.destroy();}
}
