import type * as Phaser from 'phaser';
import {pose21} from './art-v21';
import {poseBattle} from './battle-art';
import {pose22,fx22,SharinganEye,chakraFrame} from './art-v22';
import {makeEffect,animateEffect} from './effects-v14';
import {TargetedCinemaShot} from './cinematic-motion';
import {actorHead} from './presentation-v16';
import type {AnimationName,CharacterId} from './combat-core';
import type {CinemaClip,CinemaCue,ActorId} from './story-director';
import type {StoryPhaseId} from './chapter';
import type {RecordedAudio} from './recorded-audio';
interface Actor{sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;animation:AnimationName;animationAt:number;facing:-1|1;settleAt?:number;}
const actor=(id:ActorId,x:number,facing:1|-1=1,animation:AnimationName='idle')=>({id,x,y:592,facing,animation});
export function repairedClip(phase:StoryPhaseId):CinemaClip|null{
 const common={arena:'bridge' as const,authored:true,cues:[]};
 if(phase==='mist')return{...common,arena:'lakeside',id:'water-prison',duration:10800,actors:[actor('kakashi',700),actor('zabuza',910,-1),actor('naruto',400),actor('sasuke',300),actor('sakura',170),actor('tazuna',90)]};
 if(phase==='protect')return{...common,id:'simultaneous-bridge-battles',duration:12300,actors:[actor('sakura',210),actor('tazuna',110),actor('kakashi',90),actor('zabuza',510,-1),actor('sasuke',910),actor('haku',1310,-1)]};
 if(phase==='mirrors')return{...common,id:'sasuke-protects-naruto',duration:15400,actors:[actor('sasuke',750),actor('naruto',880,-1),actor('haku',1210,-1)]};
 if(phase==='seal')return{...common,id:'narutos-hesitation',duration:17400,actors:[actor('naruto',830),actor('haku',1060,-1),actor('sasuke',360,1,'defeat'),actor('kakashi',500),actor('zabuza',1080,-1)]};
 return null;
}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*Math.max(0,Math.min(1,t));
/** A staged actor has exactly one pose/movement owner until this sequence releases it. */
export class StagedStory{
 readonly active:boolean;private clock=0;private last=0;private flags=new Set<string>();private starts=new Map<string,{x:number;y:number}>();private effects=new Map<string,Phaser.GameObjects.Image>();private eye?:SharinganEye;private hitAt:number|null=null;
 private needles:{image:Phaser.GameObjects.Image;flight:TargetedCinemaShot;kind:'dodge'|'shield'|'intro'}[]=[];
 constructor(private scene:Phaser.Scene,private clip:string,private actors:ReadonlyMap<string,Actor>,private floor:number,private sound:RecordedAudio,private cue:(cue:CinemaCue)=>void,private prison:(actor:Actor,age:number)=>void,private reduced=false){
  this.active=['water-prison','simultaneous-bridge-battles','sasuke-protects-naruto','narutos-hesitation','hunter-nin-deception'].includes(clip);
  for(const [id,a]of actors)this.starts.set(id,{x:a.sprite.x,y:a.sprite.y});
 }
 owns(id:string){if(this.clip==='hunter-nin-deception')return this.clock<1900&&['kakashi','zabuza'].includes(id);return this.active&&!id.startsWith('reflection')&&(this.clip!=='water-prison'||['kakashi','zabuza'].includes(id));}
 private once(key:string,fn:()=>void){if(!this.flags.has(key)){this.flags.add(key);fn();}}
 private say(key:string,id:ActorId,speech:string){this.once(key,()=>this.cue({at:this.clock,actor:id,speech}));}
 private pose(id:CharacterId,animation:AnimationName,age=0,facing?:1|-1){const a=this.actors.get(id);if(!a)return;a.facing=facing??a.facing;a.animation=animation;a.settleAt=undefined;poseBattle(a.sprite as Phaser.GameObjects.Sprite,id,animation,Math.max(0,age),a.facing);}
 private sprite(id:string){return this.actors.get(id)!.sprite;}
 private fx(key:string,name:string,x:number,y:number,width:number,age:number,life:number,direction=1){let image=this.effects.get(key);if(!image){image=makeEffect(this.scene,name,x,y,width).setDepth(7);this.effects.set(key,image);}image.setVisible(true).setPosition(x,y).setFlipX(direction<0).setAlpha(Math.min(1,Math.max(0,(life-age)/200)));animateEffect(image,name,age,life);if(name==='chakra-aura')fx22(image,1,chakraFrame(age,life),width);return image;}
 private eyeAt(id:string,age:number){if(!this.eye)this.eye=new SharinganEye(this.scene);const a=this.actors.get(id)!;this.eye.update(age,actorHead(a.sprite),a.facing,this.reduced);}
 update(clock:number){if(!this.active)return;const dt=Math.max(0,clock-this.last);this.last=clock;this.clock=clock;for(const fx of this.effects.values())fx.setVisible(false);this.eye?.hide();
  if(this.clip==='hunter-nin-deception')this.hunterPrelude(clock);
  if(this.clip==='water-prison')this.capture(clock);
  if(this.clip==='simultaneous-bridge-battles')this.bridge(clock,dt);
  if(this.clip==='sasuke-protects-naruto')this.sacrifice(clock,dt);
  if(this.clip==='narutos-hesitation')this.hesitation(clock);
 }
 private hunterPrelude(a:number){if(a>1900)return;const k=this.sprite('kakashi'),z=this.sprite('zabuza'),ks=this.starts.get('kakashi')!,zs=this.starts.get('zabuza')!;const t=Math.min(1,a/1700);this.pose('kakashi',t<1?'jump':'land',t<1?300:80,1);k.setPosition(lerp(ks.x,430,t),lerp(ks.y,this.floor,t)-Math.sin(t*Math.PI)*145);this.pose('zabuza',t<1?'run':'idle',a,zs.x<1130?1:-1);z.setPosition(lerp(zs.x,1130,t),this.floor);if(t>=1)this.actors.get('zabuza')!.facing=-1;const camera=this.scene.cameras.main;camera.setZoom(lerp(camera.zoom,.84,.075));camera.centerOn(780,360);}
 private capture(a:number){const k=this.actors.get('kakashi')!,z=this.actors.get('zabuza')!,ks=this.starts.get('kakashi')!,zs=this.starts.get('zabuza')!,dir:1|-1=zs.x>=ks.x?1:-1;
  const x=Math.max(300,Math.min(1230,ks.x+dir*80));
  if(a<400){k.sprite.setPosition(ks.x,ks.y);z.sprite.setPosition(zs.x,zs.y);return;}
  if(a<1400){k.facing=dir;pose22(k.sprite,'characters-a',1,a<900?0:1,dir);k.sprite.setPosition(lerp(ks.x,x,(a-400)/1000),this.floor);
   this.pose('zabuza','hurt',a-400,-dir as 1|-1);z.sprite.setPosition(zs.x,zs.y).setTint(0x85d9ef).setAlpha(Math.max(0,1-(a-600)/800));this.fx('clone-water','waterfall',zs.x,this.floor-60,180,a-400,1100,dir);
  }else{const approach=Math.min(1,(a-1400)/550);z.sprite.clearTint().setAlpha(approach);z.facing=dir;
   pose22(z.sprite,'characters-a',2,approach<.5?0:approach<1?1:Math.min(5,2+Math.floor((a-1950)/260)),dir);z.sprite.setPosition(x-dir*lerp(190,134,approach),this.floor);
   k.facing=-dir as 1|-1;pose22(k.sprite,'characters-a',1,a<1950?2:a<2400?3:a<2800?4:5,k.facing);k.sprite.setPosition(x,this.floor);
   if(a>=1950){this.once('prison-contact',()=>this.sound.softWater());this.prison(k,a-1950);}
  }
  if(a>=1550)this.say('deception','kakashi','A water clone…!');if(a>=4700)this.say('caught','zabuza','You let your guard down.');if(a>=7900)this.say('rescue-plan','naruto','Sasuke! We can make him let go!');
 }
 private duel(a:number,kx:number,zx:number){const k=this.sprite('kakashi'),z=this.sprite('zabuza');k.setPosition(kx,this.floor);z.setPosition(zx,this.floor);const stage=Math.floor(a/650)%3,t=a%650;
  this.pose('kakashi',(['light1','light2','parry'] as AnimationName[])[stage],t,1);this.pose('zabuza',stage===2?'heavy':stage===1?'light2':'light1',Math.max(0,t-100),-1);
  if(t>260&&t<440)this.fx('duel-contact','parry',(kx+zx)/2,this.floor-88,90,t-260,180);
  if(t>=280)this.once('duel-sound-'+Math.floor(a/650),()=>this.sound.strike('sword',.45));
 }
 private bridge(a:number,_dt:number){const k=this.sprite('kakashi'),z=this.sprite('zabuza'),s=this.sprite('sasuke'),h=this.sprite('haku');
  this.pose('sakura','block',100,1);this.pose('sasuke','idle',0,1);this.pose('haku','idle',0,-1);
  if(a<1000){this.pose('kakashi','run',a,1);k.setPosition(lerp(90,345,a/1000),this.floor);this.pose('zabuza','heavy',Math.min(230,a/3),-1);z.setPosition(510,this.floor);}
  else if(a<3800)this.duel(a-1000,345,510);
  else{this.pose('kakashi',a<5100?'cast':'idle',a-3800,1);this.pose('zabuza',a<5100?'cast':'idle',a-3800,-1);k.setPosition(345,this.floor);z.setPosition(570,this.floor);
   if(a<5100){const t=(a-3800)/1300;this.fx('bridge-water','water-dragon',lerp(380,475,t),this.floor-92,260,a-3800,1300);this.fx('bridge-surge','waterfall',lerp(530,475,t),this.floor-75,220,a-3800,1300,-1);}}
  const camera=this.scene.cameras.main;camera.setZoom(lerp(1,.84,(a-4600)/1800));camera.centerOn(lerp(640,830,(a-4600)/1800),360);
  if(a>=4800&&a<7800){const t=a-4800;
   this.pose('sasuke',t<650?'parry':t<1150?'dash':t<2000?'light2':'land',t<650?t:t-650,1);s.setPosition(t<650?910:lerp(910,1110,(t-650)/500),this.floor);
   this.pose('haku',t<650?'cast':t<2000?'aerial':'airdash',t,-1);h.setPosition(t<2000?1260:lerp(1260,1350,(t-2000)/700),this.floor-(t>1900?Math.sin(Math.min(1,(t-1900)/1000)*Math.PI)*75:0));
   if(t<650)this.fx('intro-needle','needle',lerp(1240,945,t/600),this.floor-88,85,t,650,-1);if(t>=570&&t<760)this.fx('intro-parry','parry',948,this.floor-88,100,t-570,190);
  }else if(a>=7800){this.pose('sasuke',a<9000?'run':'idle',a-7800,-1);s.setPosition(lerp(1110,920,(a-7800)/1200),this.floor);this.pose('haku','cast',260,-1);h.setPosition(1350,this.floor);}
  if(a>=9300)this.once('bridge-mirrors',()=>this.cue({at:a,effect:'mirrors'}));if(a>=11000)h.setAlpha(Math.max(0,1-(a-11000)/500));
  if(a>=200)this.say('protect','sakura','Tazuna, stay behind me!');if(a>=3500)this.say('cover','kakashi','Sakura, protect him. Sasuke, take the masked one.');if(a>=7600)this.say('challenge','sasuke','I can keep up with you.');
 }
 private emitNeedles(kind:'dodge'|'shield',x:number,targetX:number){for(let i=0;i<3;i++){const y=this.floor-94+i*9;this.needles.push({kind,image:makeEffect(this.scene,'needle',x,y,90,15).setDepth(8),flight:new TargetedCinemaShot(x,y,targetX,y,kind==='dodge'?900:790,false)});}this.sound.effect('ice',.45);}
 private sacrifice(a:number,dt:number){const s=this.sprite('sasuke'),n=this.sprite('naruto'),h=this.sprite('haku');
  if(a<1200){for(const[id,x]of [['sasuke',750],['naruto',880],['haku',1210]] as const){const old=this.starts.get(id)!;this.pose(id,Math.abs(old.x-x)>20?'run':'idle',a,old.x>x?-1:1);this.sprite(id).setPosition(lerp(old.x,x,a/1200),lerp(old.y,this.floor,Math.min(1,a/500)**2)).setAlpha(1);if(id==='haku'&&old.y<this.floor-15&&a<600)pose21(this.sprite(id),3,a<140?0:a<450?2:4,old.x>x?-1:1);}}
  this.once('empty-prison',()=>this.cue({at:a,effect:'mirrors'}));const camera=this.scene.cameras.main;camera.setZoom(lerp(camera.zoom,.84,.08));camera.centerOn(830,360);
  if(a>=1200&&(this.hitAt===null||a-this.hitAt<1300)){this.pose('naruto','idle',0,-1);n.setPosition(880,this.floor);}
  if(a>=5000)this.pose('haku','idle',0,1);
  if(a>=1200&&a<3600){h.setPosition(1210,this.floor);this.pose('haku','cast',Math.min(450,a-1200),-1);this.once('dodge-needles',()=>this.emitNeedles('dodge',1180,615));
   pose22(s,'characters-b',0,Math.min(5,Math.floor((a-1200)/360)),1);s.setPosition(750+Math.sin((a-1200)/360)*20,this.floor);this.eyeAt('sasuke',a-1200);
   const bg=this.scene.children.list.find(o=>(o as Phaser.GameObjects.Image).texture?.key==='v2-bridge-background') as Phaser.GameObjects.Image|undefined;bg?.setTint(a<2850?0x758393:0xffffff);
  }
  if(a>=3600&&a<4200){this.pose('haku','airdash',a-3600,-1);h.setPosition(lerp(1210,440,(a-3600)/600),this.floor-Math.sin((a-3600)/600*Math.PI)*70);this.pose('sasuke','idle',0,-1);s.setPosition(750,this.floor);}
  if(a>=4200&&this.hitAt===null){h.setPosition(440,this.floor);this.pose('haku','cast',a-4200,1);this.once('shield-needles',()=>this.emitNeedles('shield',470,780));
   pose22(s,'characters-b',1,0,-1);s.setPosition(lerp(750,780,(a-4200)/240),this.floor);}
  for(const shot of this.needles){const slow=shot.kind==='dodge'&&a>=1300&&a<2800?.12:1;if(shot.flight.tick(dt*slow)&&shot.kind==='shield'&&this.hitAt===null){this.hitAt=a;this.sound.strike('palm',.7);}
   shot.image.setPosition(shot.flight.x,shot.flight.y).setRotation(shot.flight.rotation).setAlpha(shot.flight.contact?Math.max(0,1-shot.flight.contactAge/180):1);
   if(shot.flight.done)shot.image.destroy();
  }
  this.needles=this.needles.filter(shot=>!shot.flight.done);
  if(this.hitAt!==null){const fall=a-this.hitAt;pose22(s,'characters-b',1,Math.min(5,1+Math.floor(fall/230)),-1);s.setPosition(780,this.floor);if(fall<180)this.fx('sacrifice-impact','needle-impact',780,this.floor-84,120,fall,180);
   if(fall>=1300&&fall<2500){this.pose('naruto','run',fall-1300,-1);n.setPosition(lerp(880,855,(fall-1300)/800),this.floor);}else if(fall>=2500&&a<11100){pose22(n,'characters-b',3,Math.min(3,1+Math.floor((fall-2500)/1000)),-1);n.setPosition(855,this.floor);}
   if(fall>=500)this.say('body-moved','sasuke','My body moved before I could think.');if(fall>=3900)this.say('grief','naruto','Sasuke… You were supposed to keep chasing your dream.');
  }
  if(a>=11000){pose22(n,'characters-b',3,a<12100?4:5,-1);n.setPosition(855,this.floor);this.fx('awakening-chakra','chakra-aura',855,this.floor-85,355,a-11000,6000);if(a>=12100)this.say('rage','naruto','I will not let you hurt anyone else!');}
  if(a>=1250)this.say('awakening','sasuke','I can see them. Every needle.');
 }
 private hesitation(a:number){const n=this.sprite('naruto'),h=this.sprite('haku'),hs=this.starts.get('haku')!,ns=this.starts.get('naruto')!;
  const hx=Math.max(90,Math.min(1500,hs.x)),side:1|-1=ns.x>=hs.x?1:-1,nx=Math.max(70,Math.min(1590,hx+side*130)),center=hx>830?650:1220,kbase=center-170,zbase=center+170;
  h.setPosition(lerp(hs.x,hx,a/1200),lerp(hs.y,this.floor,Math.min(1,a/650)**2)).setAlpha(1);this.actors.get('haku')!.facing=side;
  pose22(h,'haku-kneel',0,a<650?0:a<1400?1:a<2200?2:a<2900?3:a<3700?4:5,side);
  n.setPosition(lerp(ns.x,nx,a/1200),this.floor).setAlpha(1);this.pose('naruto',a<1200&&Math.abs(ns.x-nx)>15?'run':'idle',a,-side as 1|-1);
  if(a<9800){this.sprite('kakashi').setPosition(kbase,this.floor);this.sprite('zabuza').setPosition(zbase,this.floor);this.pose('kakashi','idle',0,1);this.pose('zabuza','idle',0,-1);}
  if(a>=2000)this.say('recognition','naruto','You… the person from the forest?');if(a>=5200)this.say('precious','haku','I only wanted to protect someone precious.');if(a>=8500)this.say('danger','haku','Zabuza is in danger!');
  const camera=this.scene.cameras.main;camera.setZoom(lerp(camera.zoom,.88,.045));camera.centerOn(lerp((hx+nx)/2,center,(a-9000)/1300),360);
  if(a>=9800){const d=a-9800;if(d<2300)this.duel(d,kbase+75,zbase-95);
   else if(d<4400){this.pose('kakashi','cast',d-2300,1);this.pose('zabuza','cast',d-2300,-1);this.sprite('kakashi').setPosition(lerp(kbase+75,kbase,(d-2300)/900),this.floor);this.sprite('zabuza').setPosition(lerp(zbase-95,zbase,(d-2300)/900),this.floor);
    this.fx('last-water-k','water-dragon',lerp(kbase+55,center,(d-2300)/1500),this.floor-120,420,d-2300,2100);this.fx('last-water-z','water-dragon',lerp(zbase-55,center,(d-2300)/1500),this.floor-120,420,d-2300,2100,-1);
   }else{const t=d-4400;this.pose('kakashi',t<1300?'cast':t<2000?'dash':'parry',t,1);this.pose('zabuza',t<1300?'heavy':'light2',t,-1);this.sprite('kakashi').setPosition(t<1300?kbase:t<2000?lerp(kbase,zbase-110,(t-1300)/700):lerp(zbase-110,kbase,(t-2000)/700),this.floor);this.sprite('zabuza').setPosition(zbase,this.floor);
    if(t<2200){const k=this.sprite('kakashi');this.fx('chidori-duel','lightning',k.x+50,this.floor-85,t<1300?115:195,t,2300);}
   }
  }
 }
 get ready(){return !this.active||this.clip!=='sasuke-protects-naruto'||this.hitAt!==null&&this.clock-this.hitAt>6500;}
 status(){return{active:this.active,clip:this.clip,contact:this.hitAt,beats:[...this.flags],needles:this.needles.filter(n=>!n.flight.done).length};}
 destroy(){this.effects.forEach(e=>e.destroy());this.needles.forEach(n=>n.image.destroy());this.eye?.destroy();}
}
