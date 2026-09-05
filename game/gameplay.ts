import * as Phaser from 'phaser';
import {bridge,type Checkpoint,type Command} from './bridge';
import {assets,pose,prop,type ArtKey} from './art';
import {Inputs} from './input';
import {Soundscape} from './audio';
import {TUNE,SURFACES,WAVES,STAGES,canSpend,damageResult,gainUltimate,intersects,meleeBounds,safeSubstituteX,type Bounds} from './rules';
type BodyObject=Phaser.GameObjects.Rectangle&{body:Phaser.Physics.Arcade.Body};
type Kind='naruto'|'bandit'|'shinobi'|'zabuza'|'haku'|'clone';
type Actor={id:number;kind:Kind;key:ArtKey;body:BodyObject;art:Phaser.GameObjects.Sprite;shadow:Phaser.GameObjects.Ellipse;hp:number;max:number;face:number;state:string;until:number;invulnerable:number;hurtUntil:number;frame:number;born:number;next:number;attack:string;attackStarted:number;targets:Set<number>;warning?:Phaser.GameObjects.Rectangle;label?:Phaser.GameObjects.Text;alive:boolean;scale:number};
type Projectile={image:Phaser.GameObjects.Image;x:number;y:number;vx:number;vy:number;ttl:number;damage:number;friendly:boolean;kind:'shuriken'|'needle'|'water';owner:number};
type Mirror={image:Phaser.GameObjects.Image;reflection:Phaser.GameObjects.Sprite;x:number;y:number;hp:number};
type Effect={image:Phaser.GameObjects.Image;expires:number;start:number;duration:number;scale:number;spin:number};
type Decoy={image:Phaser.GameObjects.Image;x:number;y:number;expires:number;id:number};
const ARENAS={zabuza:{left:3900,right:5160,spawn:4010,boss:4810},haku:{left:6780,right:8060,spawn:6900,boss:7790}};
let nextId=1;
export class GameScene extends Phaser.Scene{
 inputs!:Inputs;soundscape!:Soundscape;player!:Actor;enemies:Actor[]=[];clones:Actor[]=[];projectiles:Projectile[]=[];effects:Effect[]=[];decoys:Decoy[]=[];mirrors:Mirror[]=[];
 floors!:Phaser.Physics.Arcade.StaticGroup;now=0;elapsed=0;chakra=100;ultimate=0;cloneReady=0;subReady=0;throwReady=0;attackReady=0;combo=0;comboExpires=0;jumpQueued=-10000;lastGround=-10000;lastSafeX=160;
 boss:Actor|null=null;bossStage:'zabuza'|'haku'|null=null;zabuzaDefeated=false;hakuDefeated=false;waves=new Set<number>();waveActive=-1;kills=0;checkpoint:Checkpoint='forest';hint='';hintUntil=0;hitStop=0;lastEmit=0;phaseCounter=0;
 backgrounds:Phaser.GameObjects.Image[]=[];mist:Phaser.GameObjects.Image[]=[];mirrorActive=-1;mirrorSwap=0;mirrorVolley=0;mirrorEnd=0;nextMirror=0;mirrorsFired=false;gameOver=false;
 constructor(){super('Gameplay');}
 init(data:{checkpoint?:Checkpoint;elapsed?:number;inputs:Inputs;soundscape:Soundscape}){
  this.inputs=data.inputs;this.soundscape=data.soundscape;this.checkpoint=data.checkpoint||'forest';
  this.enemies=[];this.clones=[];this.projectiles=[];this.effects=[];this.decoys=[];this.mirrors=[];this.backgrounds=[];this.mist=[];
  this.now=0;this.elapsed=data.elapsed||0;this.chakra=100;this.ultimate=0;this.cloneReady=0;this.subReady=0;this.throwReady=0;this.attackReady=0;this.combo=0;this.comboExpires=0;this.jumpQueued=-10000;this.lastGround=-10000;this.lastSafeX=160;
  this.boss=null;this.bossStage=null;this.zabuzaDefeated=this.checkpoint==='haku';this.hakuDefeated=false;this.waves=new Set(this.checkpoint==='forest'?[]:this.checkpoint==='zabuza'?[0,1]:[0,1,2]);this.waveActive=-1;this.kills=this.checkpoint==='forest'?0:this.checkpoint==='zabuza'?6:10;
  this.hint='';this.hintUntil=0;this.hitStop=0;this.lastEmit=0;this.phaseCounter=0;this.mirrorActive=-1;this.nextMirror=0;this.gameOver=false;
 }
 create(){
  this.physics.world.setBounds(0,-300,8120,1300);this.floors=this.physics.add.staticGroup();
  for(const name of ['forest','river','bridge'])this.backgrounds.push(this.add.image(640,360,name).setDisplaySize(1280,732).setScrollFactor(0).setDepth(-20));
  this.backgrounds[1].setAlpha(0);this.backgrounds[2].setAlpha(0);
  for(const s of SURFACES){
   const floor=this.add.rectangle(s.x,s.y+14,s.w,28,0,0);this.physics.add.existing(floor,true);this.floors.add(floor);
   const elevated=s.y<590;
   for(let left=s.x-s.w/2;left<s.x+s.w/2;left+=260){const width=Math.min(262,s.x+s.w/2-left+2);const tile=prop(this,s.x>5150?1:0,left+width/2,s.y+20,width).setOrigin(.5,0).setDepth(elevated?1:-2);tile.y=s.y-5;tile.setDisplaySize(width,elevated?55:125);}
  }
  for(const [left,right] of [[1160,1300],[1760,1880],[2720,2800],[5160,5280],[5660,5780]]){
   this.add.rectangle((left+right)/2,664,right-left,150,0x092b3d).setDepth(-1);prop(this,10,(left+right)/2,636,right-left+12).setDepth(0).setAlpha(.62);
  }
  for(let x=380;x<3800;x+=610)prop(this,12,x,605,85).setOrigin(.5,1).setDepth(2);
  for(const x of [90,1450,3090,5510])prop(this,13,x,628,190).setOrigin(.5,1).setDepth(-3).setAlpha(.55);
  for(let i=0;i<3;i++)this.mist.push(prop(this,5,i*570,390+i*110,800).setScrollFactor(0).setAlpha(0).setDepth(8));
  this.player=this.actor('naruto',this.checkpoint==='forest'?160:ARENAS[this.checkpoint].spawn,602);this.lastSafeX=this.player.body.x;
  this.cameras.main.setBounds(0,0,8120,720);this.cameras.main.scrollX=Math.max(0,this.player.body.x-420);
  bridge.patch({screen:'playing',health:100,chakra:100,ultimate:0,boss:null,hint:'',checkpoint:this.checkpoint,elapsed:this.elapsed,kills:this.kills});
  this.inputs.clear();this.soundscape.unlock();
  if(this.checkpoint==='forest')this.tip('A / D to move · SPACE to jump · Hold J to chain melee attacks',9000);else this.beginBoss(this.checkpoint);
  this.events.once('shutdown',()=>{this.inputs.clear();this.soundscape.sync(false);this.enemies=[];this.clones=[];this.projectiles=[];this.mirrors=[];this.effects=[];this.decoys=[];});
 }
 actor(kind:Kind,x:number,feet:number):Actor{
  const key:ArtKey=kind==='clone'?'naruto':kind==='bandit'||kind==='shinobi'?'enemy':kind;
  const boss=kind==='zabuza'||kind==='haku',height=boss?136:108;
  const obj=this.add.rectangle(x,feet-height/2,boss?50:40,height,0xffffff,0) as BodyObject;
  this.physics.add.existing(obj);obj.body.setCollideWorldBounds(false).setMaxVelocity(900,1050);
  const base=kind==='shinobi'?8:0,art=this.add.sprite(x,feet,key,String(base)).setDepth(4);
  const displayHeight=kind==='zabuza'?187:kind==='haku'?166:kind==='naruto'||kind==='clone'?141:154;
  const scale=displayHeight/assets[key].frames[base].h;art.setScale(scale);pose(art,key,base);
  const shadow=this.add.ellipse(x,feet+2,boss?85:58,13,0x04121b,.3).setDepth(0);
  const hp=kind==='clone'?1:kind==='naruto'?100:kind==='zabuza'?TUNE.zabuzaHealth:kind==='haku'?TUNE.hakuHealth:TUNE.enemyHealth;
  const actor:Actor={id:nextId++,kind,key,body:obj,art,shadow,hp,max:hp,face:kind==='naruto'||kind==='clone'?1:-1,state:'idle',until:0,invulnerable:0,hurtUntil:0,frame:base,born:this.now,next:this.now+800,attack:'',attackStarted:0,targets:new Set(),alive:true,scale};
  if(kind==='clone')art.setAlpha(.65).setTint(0xb2e4ee);
  this.physics.add.collider(obj,this.floors,undefined,(moving,fixed)=>{const b=(moving as unknown as BodyObject).body,platform=fixed as unknown as Phaser.GameObjects.Rectangle;return b.velocity.y>=0&&b.prev.y+b.height<=platform.y-platform.height/2+14;});
  return actor;
 }
 feet(a:Actor){return a.body.y+a.body.height/2;}
 box(a:Actor):Bounds{return{x:a.body.x,y:a.body.y-12,w:a.body.width+14,h:a.body.height+20};}
 tip(text:string,duration=3200){this.hint=text;this.hintUntil=this.now+duration;bridge.patch({hint:text});}
 drawActor(a:Actor){
  if(!a.art.active)return;let frame=a.frame;
  const moving=Math.abs(a.body.body.velocity.x)>30,air=!a.body.body.blocked.down&&!a.body.body.touching.down;
  if(a.alive&&this.now>=a.until&&a.state!=='mirror'){
   if(a.kind==='naruto'||a.kind==='clone')frame=air?(a.body.body.velocity.y<0?6:7):moving?2+Math.floor(this.now/95)%4:Math.floor(this.now/800)%2;
   else if(a.kind==='bandit'||a.kind==='shinobi'){const base=a.kind==='shinobi'?8:0;frame=base+(moving?1+Math.floor(this.now/120)%2:0);}
   else frame=moving?2+Math.floor(this.now/105)%4:Math.floor(this.now/900)%2;
  }
  if(a.alive&&this.now<a.hurtUntil)frame=a.kind==='naruto'||a.kind==='clone'?14:a.kind==='bandit'?5:a.kind==='shinobi'?13:a.kind==='zabuza'?13:12;
  pose(a.art,a.key,frame,a.face<0);a.art.setPosition(a.body.x,this.feet(a)+2);
  if(a.alive){a.art.setAlpha(a.state==='mirror'?0:a.kind==='clone'?.64:this.now<a.invulnerable&&Math.floor(this.now/75)%2===0?.42:1);if(this.now<a.hurtUntil)a.art.setTint(0xffba91);else if(a.kind==='clone')a.art.setTint(0xbce9ed);else a.art.clearTint();}
  const landing=SURFACES.filter(s=>a.body.x>s.x-s.w/2&&a.body.x<s.x+s.w/2&&s.y>=this.feet(a)-5).sort((p,q)=>p.y-q.y)[0];
  a.shadow.setPosition(a.body.x,landing?.y||602).setVisible(a.alive&&a.state!=='mirror').setAlpha(landing?Math.max(.06,.27-(landing.y-this.feet(a))*.001):0);
 }
 animate(a:Actor,frame:number,duration:number,state='acting'){a.frame=frame;a.until=this.now+duration;a.state=state;}
 effect(frame:number,x:number,y:number,width:number,duration=350,spin=0){
  if(this.effects.length>90)this.effects.shift()?.image.destroy();const image=prop(this,frame,x,y,width).setDepth(7);
  if([6,7,9,10,11,14,15].includes(frame))image.setBlendMode(Phaser.BlendModes.ADD);
  this.effects.push({image,expires:this.now+duration,start:this.now,duration,scale:image.scaleX,spin});
 }
 shake(power=.003,duration=120){if(!bridge.settings().reducedShake)this.cameras.main.shake(duration,power);}
 impact(x:number,y:number,large=false){this.effect(large?7:15,x,y,large?180:64,large?420:160);this.shake(large?.006:.0017,large?230:75);this.hitStop=this.now+(large?85:35);this.soundscape.play(large?'ultimate':'hit');}
 target():{x:number;y:number;id:number;actor?:Actor;decoy?:Decoy}{
  const log=this.decoys.find(d=>d.expires>this.now);if(log)return{x:log.x,y:log.y,id:log.id,decoy:log};
  const clone=this.clones.find(c=>c.alive);if(clone)return{x:clone.body.x,y:clone.body.y,id:clone.id,actor:clone};
  return{x:this.player.body.x,y:this.player.body.y,id:this.player.id,actor:this.player};
 }
 update(_time:number,delta:number){
  this.inputs.poll();if(bridge.get().screen!=='playing'){this.inputs.endFrame();return;}
  const dt=Math.min(delta,40)/1000;this.now+=dt*1000;this.elapsed+=dt;
  if(this.now<this.hitStop){this.physics.world.pause();return;}if(this.physics.world.isPaused)this.physics.world.resume();
  this.chakra=Math.min(100,this.chakra+TUNE.chakraRegen*dt);this.movePlayer();this.progressLevel();
  for(const enemy of this.enemies)if(enemy.alive)this.enemyAI(enemy);
  for(const clone of this.clones)if(clone.alive)this.cloneAI(clone);
  this.updateMirrors();this.updateProjectiles(dt);this.updateEffects(dt);
  for(const actor of [this.player,...this.enemies,...this.clones])this.drawActor(actor);
  this.clones=this.clones.filter(c=>c.alive);this.enemies=this.enemies.filter(e=>e.alive);
  this.decoys=this.decoys.filter(d=>{if(d.expires<=this.now){d.image.destroy();return false;}return true;});
  if(this.player.body.y>835){this.player.body.body.reset(this.lastSafeX,440);this.hurtPlayer(14);this.tip('Watch the gaps. Hold SPACE for a higher jump.');}
  const x=this.player.body.x,river=Phaser.Math.Clamp((x-3140)/900,0,1),bridgeAlpha=Phaser.Math.Clamp((x-5050)/520,0,1);
  this.backgrounds[1].setAlpha(river*(1-bridgeAlpha));this.backgrounds[2].setAlpha(bridgeAlpha);
  const targetCamera=this.bossStage?ARENAS[this.bossStage].left:Phaser.Math.Clamp(x-440,0,6840);this.cameras.main.scrollX=Phaser.Math.Linear(this.cameras.main.scrollX,targetCamera,.09);
  for(let i=0;i<this.mist.length;i++){this.mist[i].x=((this.now*.009+i*540)%1700)-200;this.mist[i].setAlpha(this.bossStage==='zabuza'&&this.boss&&this.boss.hp<this.boss.max*.5?.085:0);}
  if(this.hint&&this.now>this.hintUntil){this.hint='';bridge.patch({hint:''});}
  if(this.now-this.lastEmit>90){this.publish();this.lastEmit=this.now;}this.inputs.endFrame();
 }
 movePlayer(){
  const p=this.player,b=p.body.body,grounded=b.blocked.down||b.touching.down;
  if(grounded){this.lastGround=this.now;if(SURFACES.some(s=>p.body.x>s.x-s.w/2+28&&p.body.x<s.x+s.w/2-28&&Math.abs(s.y-this.feet(p))<10))this.lastSafeX=p.body.x;}
  if(this.inputs.pressed('jump'))this.jumpQueued=this.now;
  if(this.jumpQueued>this.now-TUNE.jumpBuffer&&this.lastGround>this.now-TUNE.coyote){b.setVelocityY(-TUNE.jump);this.jumpQueued=-10000;this.lastGround=-10000;this.soundscape.play('jump');}
  if(!this.inputs.held('jump')&&b.velocity.y<-290)b.setVelocityY(b.velocity.y*.77);
  const direction=(this.inputs.held('right')?1:0)-(this.inputs.held('left')?1:0);
  if(direction&&p.state!=='ultimate')p.face=direction;
  if(p.state==='ultimate'&&this.now<p.until){b.setVelocityX(p.face*790);b.setVelocityY(0);p.invulnerable=this.now+100;this.playerStrike(TUNE.ultimateDamage,true);if(Math.floor(this.now/55)%2===0)this.effect(6,p.body.x+p.face*42,p.body.y-18,44,140);}
  else if(this.now>=p.until||p.state==='idle'||p.state==='hurt'){b.setVelocityX(direction*TUNE.speed);if(direction)p.face=direction;p.state='idle';}
  else b.setVelocityX(direction*TUNE.speed*.36);
  if((this.inputs.held('melee')||this.inputs.pressed('melee'))&&this.now>=this.attackReady&&p.state!=='ultimate'){
   if(this.now>this.comboExpires)this.combo=0;const combo=this.combo;this.combo=(this.combo+1)%3;this.comboExpires=this.now+1150;
   this.animate(p,8+combo,TUNE.meleeDuration[combo]);this.attackReady=this.now+TUNE.meleeDuration[combo]+65;p.targets.clear();
   this.playerStrike(TUNE.meleeDamage[combo],false,combo===2);this.effect(11,p.body.x+p.face*64,p.body.y-14,combo===2?125:88,180,p.face*3);this.soundscape.play('hit');
  }
  if((this.inputs.held('shuriken')||this.inputs.pressed('shuriken'))&&this.now>=this.throwReady&&p.state!=='ultimate'){
   this.throwReady=this.now+TUNE.shurikenCooldown;this.animate(p,11,170);this.fire(p.body.x+p.face*37,p.body.y-23,p.face*790,0,true,'shuriken',12,p.id);this.soundscape.play('throw');
  }
  if(this.inputs.pressed('clones')){
   if(canSpend(this.chakra,this.cloneReady-this.now,TUNE.cloneCost)){
    this.chakra-=TUNE.cloneCost;this.cloneReady=this.now+TUNE.cloneCooldown*1000;this.animate(p,12,330);this.soundscape.play('clone');
    this.clones.forEach(c=>this.despawnClone(c));this.clones=[];
    for(const offset of [-62,62]){const c=this.actor('clone',Phaser.Math.Clamp(p.body.x+offset,this.arenaMin()+32,this.arenaMax()-32),this.feet(p));c.face=p.face;this.clones.push(c);this.effect(5,c.body.x,c.body.y,130,450);}
    this.tip('Shadow clones! They attack and draw enemy attention.',2600);
   }else this.tip(this.chakra<30?'You need 30 chakra for shadow clones.':'Shadow clones are recharging.',1500);
  }
  if(this.inputs.pressed('substitute')){
   if(canSpend(this.chakra,this.subReady-this.now,TUNE.subCost)){
    this.chakra-=TUNE.subCost;this.subReady=this.now+TUNE.subCooldown*1000;const x=p.body.x,feet=this.feet(p);this.effect(5,x,p.body.y,150,420);
    const image=prop(this,2,x,feet-42,39).setDepth(4);this.decoys.push({image,x,y:feet-42,id:nextId++,expires:this.now+2100});
    const next=safeSubstituteX(x,feet,p.face,SURFACES,this.arenaMin(),this.arenaMax());b.reset(next,p.body.y);p.invulnerable=this.now+TUNE.subImmunity;this.animate(p,14,100);this.soundscape.play('sub');
   }else this.tip(this.chakra<25?'You need 25 chakra to substitute.':'Substitution is recharging.',1500);
  }
  if(this.inputs.pressed('rasengan')){
   if(this.ultimate>=100){this.ultimate=0;this.animate(p,13,470,'ultimate');p.targets.clear();this.effect(6,p.body.x+p.face*40,p.body.y-12,92,450,5);this.soundscape.play('ultimate');this.tip('RASENGAN!',1400);}
   else this.tip('Hit enemies to charge Rasengan.',1500);
  }
  p.body.x=Phaser.Math.Clamp(p.body.x,this.arenaMin()+25,this.arenaMax()-25);
 }
 arenaMin(){return this.bossStage?ARENAS[this.bossStage].left:0;}
 arenaMax(){if(this.bossStage)return ARENAS[this.bossStage].right;return this.waveActive>=0?WAVES[this.waveActive].end+105:8110;}
 playerStrike(damage:number,ultimate=false,finisher=false){
  const p=this.player,area=ultimate?{x:p.body.x+p.face*70,y:p.body.y,w:170,h:150}:meleeBounds(p.body.x,p.body.y,p.face,finisher);
  for(const enemy of this.enemies){if(!enemy.alive||enemy.state==='mirror'||p.targets.has(enemy.id))continue;if(intersects(area,this.box(enemy))){p.targets.add(enemy.id);this.damageEnemy(enemy,damage,ultimate);if(!ultimate&&enemy.kind!=='zabuza'&&enemy.kind!=='haku')enemy.body.body.setVelocityX(p.face*(finisher?230:95));}}
  this.mirrors.forEach((m,index)=>{if(m.hp>0&&intersects(area,{x:m.x,y:m.y,w:95,h:184})&&!p.targets.has(-index-1)){p.targets.add(-index-1);this.damageMirror(index,damage,ultimate);}});
 }
 hurtPlayer(damage:number,sourceX?:number){
  const p=this.player,result=damageResult(p.hp,p.invulnerable,this.now,damage);if(!result.damage||this.gameOver)return;
  p.hp=result.health;p.invulnerable=this.now+TUNE.damageImmunity;p.hurtUntil=this.now+220;p.until=this.now+140;p.state='hurt';this.ultimate=Math.min(100,this.ultimate+result.damage*.4);
  if(sourceX!==undefined)p.body.body.setVelocity((p.body.x<sourceX?-1:1)*160,-135);
  this.effect(15,p.body.x,p.body.y-25,64,210);this.shake(.004,170);this.soundscape.play('hurt');
  if(p.hp<=0){this.gameOver=true;this.animate(p,15,100000,'dead');p.body.body.setVelocity(0);this.drawActor(p);this.clearSupport();this.physics.pause();bridge.patch({screen:'dead',health:0});}else bridge.patch({health:p.hp});
 }
 damageEnemy(enemy:Actor,damage:number,ultimate=false,clone=false){
  if(!enemy.alive||enemy.state==='mirror')return;const actual=Math.min(enemy.hp,damage);enemy.hp-=actual;enemy.hurtUntil=this.now+105;
  if(!clone)this.ultimate=gainUltimate(this.ultimate,actual);
  if(ultimate||!clone)this.impact(enemy.body.x,enemy.body.y-18,ultimate);else this.effect(15,enemy.body.x,enemy.body.y-15,40,120);
  if(enemy.kind!=='zabuza'&&enemy.kind!=='haku'){this.clearWarning(enemy);enemy.state='stunned';enemy.next=this.now+360;enemy.until=this.now+170;}
  if(enemy.hp<=0){
   enemy.alive=false;enemy.body.body.enable=false;enemy.shadow.setVisible(false);this.clearWarning(enemy);
   this.animate(enemy,enemy.kind==='bandit'?7:15,100000,'dead');this.drawActor(enemy);this.kills++;
   this.tweens.add({targets:enemy.art,alpha:0,duration:500,delay:450,onComplete:()=>{enemy.art.destroy();enemy.body.destroy();enemy.shadow.destroy();}});
   if(enemy.kind==='zabuza'||enemy.kind==='haku')this.finishBoss(enemy.kind);
   else{this.player.hp=Math.min(100,this.player.hp+4);this.chakra=Math.min(100,this.chakra+6);this.effect(14,enemy.body.x,enemy.body.y,24,450);}
  }
 }
 cloneAI(c:Actor){
  if(this.now-c.born>=TUNE.cloneLife*1000||c.body.y>800){this.despawnClone(c);return;}
  const target=this.enemies.filter(e=>e.alive&&e.state!=='mirror').sort((a,b)=>Math.abs(a.body.x-c.body.x)-Math.abs(b.body.x-c.body.x))[0];
  if(!target){c.body.body.setVelocityX(0);return;}const dx=target.body.x-c.body.x;c.face=dx>=0?1:-1;c.body.body.setVelocityX(Math.abs(dx)>85?c.face*290:0);
  if(c.body.body.blocked.down&&target.body.y<c.body.y-70)c.body.body.setVelocityY(-590);
  if(Math.abs(dx)<112&&Math.abs(target.body.y-c.body.y)<110&&this.now>=c.next){this.animate(c,8+Math.floor(this.now/800)%3,290);c.next=this.now+780;this.damageEnemy(target,8,false,true);}
 }
 despawnClone(c:Actor){if(!c.alive)return;c.alive=false;this.effect(5,c.body.x,c.body.y,100,350);c.art.destroy();c.body.destroy();c.shadow.destroy();}
 clearSupport(){this.clones.forEach(c=>this.despawnClone(c));this.clones=[];this.decoys.forEach(d=>d.image.destroy());this.decoys=[];this.projectiles.forEach(p=>p.image.destroy());this.projectiles=[];}
 clearWarning(a:Actor){a.warning?.destroy();a.label?.destroy();a.warning=undefined;a.label=undefined;}
 warn(a:Actor,width:number,label:string){
  this.clearWarning(a);a.warning=this.add.rectangle(a.body.x+a.face*width*.45,a.body.y,width,105,0xffa360,.1).setStrokeStyle(1,0xffb25a,.65).setDepth(2);
  a.label=this.add.text(a.body.x,this.feet(a)-220,label,{fontFamily:'Arial',fontSize:'14px',color:'#ffe0b5',backgroundColor:'#172d36',padding:{x:8,y:4}}).setOrigin(.5).setDepth(9);
 }
 enemyAI(a:Actor){
  if(a.body.y>840){this.damageEnemy(a,a.hp);return;}if(a.state==='mirror')return;
  if(a.kind==='haku'&&a.hp<a.max*.67&&this.now>=this.nextMirror&&a.state!=='windup'&&a.state!=='strike'){this.beginMirrors();return;}
  const target=this.target(),dx=target.x-a.body.x,distance=Math.abs(dx),isBoss=a.kind==='zabuza'||a.kind==='haku';
  a.body.x=Phaser.Math.Clamp(a.body.x,this.bossStage?this.arenaMin()+60:30,this.bossStage?this.arenaMax()-60:8100);
  if(a.state==='windup'){
   a.body.body.setVelocityX(0);if(this.now<a.next)return;this.clearWarning(a);a.state='strike';a.attackStarted=this.now;a.targets.clear();a.next=this.now+(a.attack==='slash'?650:a.attack==='lunge'?440:260);
   if(a.attack==='water'){this.animate(a,10,350,'strike');const sign=target.x>=a.body.x?1:-1;this.fire(a.body.x+sign*75,548,sign*410,0,false,'water',18,a.id);this.effect(10,a.body.x+sign*85,560,170,440);this.soundscape.play('clone');}
   else if(a.attack==='needles'){this.animate(a,a.kind==='haku'?7:12,300,'strike');const angle=Math.atan2(target.y-20-a.body.y,target.x-a.body.x);for(const offset of a.kind==='haku'?[-.11,0,.11]:[0])this.fire(a.body.x,a.body.y-20,Math.cos(angle+offset)*570,Math.sin(angle+offset)*570,false,'needle',a.kind==='haku'?11:10,a.id);this.soundscape.play('throw');}
   else{this.animate(a,a.kind==='zabuza'?(a.attack==='lunge'?12:7):4,a.next-this.now,'strike');a.body.body.setVelocityX(a.face*(a.attack==='lunge'?600:isBoss?145:120));}return;
  }
  if(a.state==='strike'){
   if(a.attack==='slash'||a.attack==='lunge'||a.attack==='melee'){
    const range=a.kind==='zabuza'?a.attack==='lunge'?195:210:100;const area={x:a.body.x+a.face*range*.44,y:a.body.y-4,w:range,h:123};
    if(a.kind==='zabuza'&&a.attack==='slash'&&this.now-a.attackStarted>300)a.frame=8;this.hitAllies(a,area,a.kind==='zabuza'?12:12);
   }
   if(this.now>=a.next){a.state='recover';a.body.body.setVelocityX(0);a.until=this.now+160;a.next=this.now+(isBoss?1550:700);a.frame=a.kind==='shinobi'?8:0;}return;
  }
  if((a.state==='recover'||a.state==='stunned')&&this.now<a.next){a.body.body.setVelocityX(a.state==='stunned'?a.body.body.velocity.x*.9:0);return;}
  a.face=dx>=0?1:-1;if(a.body.body.blocked.down&&target.y<a.body.y-70)a.body.body.setVelocityY(-600);
  const ranged=a.kind==='shinobi'||a.kind==='haku',approach=ranged?distance>490:distance>(a.kind==='zabuza'?205:100);
  if(approach){a.state='approach';a.until=0;a.body.body.setVelocityX(a.face*(a.kind==='zabuza'?200:a.kind==='haku'?260:125));
   if(a.body.body.blocked.down){const ahead=a.body.x+a.face*75;if(!SURFACES.some(s=>ahead>s.x-s.w/2&&ahead<s.x+s.w/2&&s.y>this.feet(a)-20&&s.y<this.feet(a)+30))a.body.body.setVelocityY(-630);}
   if(!isBoss||distance<650)return;
  }
  if(this.now<a.next)return;a.state='windup';a.body.body.setVelocityX(0);a.face=dx>=0?1:-1;
  if(a.kind==='zabuza'){
   this.phaseCounter++;const mist=a.hp<a.max*.5;a.attack=this.phaseCounter%3===0?'water':this.phaseCounter%2===0||distance>320?'lunge':'slash';
   if(mist&&this.phaseCounter%3===1){const next=Phaser.Math.Clamp(this.player.body.x-this.player.face*235,this.arenaMin()+80,this.arenaMax()-80);this.effect(5,a.body.x,a.body.y,180,600);a.body.body.reset(next,534);a.face=this.player.body.x>=next?1:-1;a.attack='lunge';this.tip('Mist ambush! Watch the silhouette and substitute.',2200);}
   this.animate(a,a.attack==='water'?9:6,mist?950:1100,'windup');a.next=this.now+(mist?950:1100);this.warn(a,a.attack==='water'?220:240,a.attack==='water'?'WATER STYLE':a.attack==='lunge'?'LUNGE':'SWORD SWEEP');
  }else if(ranged){a.attack='needles';this.animate(a,a.kind==='haku'?6:11,700,'windup');a.next=this.now+(a.kind==='haku'?730:1000);this.warn(a,100,a.kind==='haku'?'SENBON VOLLEY':'THROW');}
  else{a.attack='melee';this.animate(a,3,630,'windup');a.next=this.now+630;this.warn(a,115,'!');}
 }
 hitAllies(source:Actor,area:Bounds,damage:number){
  for(const a of [this.player,...this.clones])if(a.alive&&!source.targets.has(a.id)&&intersects(area,this.box(a))){source.targets.add(a.id);if(a===this.player)this.hurtPlayer(damage,source.body.x);else this.despawnClone(a);}
  for(const d of this.decoys)if(d.expires>this.now&&!source.targets.has(d.id)&&intersects(area,{x:d.x,y:d.y,w:42,h:85})){source.targets.add(d.id);d.expires=this.now;this.effect(5,d.x,d.y,95,350);}
 }
 fire(x:number,y:number,vx:number,vy:number,friendly:boolean,kind:Projectile['kind'],damage:number,owner:number){
  if(this.projectiles.length>=70)return;
  if(friendly&&this.mirrors.length){const target=this.mirrors[this.mirrorActive];if(target?.hp>0&&(target.x-x)*vx>0){const angle=Phaser.Math.Clamp(Math.atan2(target.y-y,Math.abs(target.x-x)),-.75,.75);vy=Math.sin(angle)*790;vx=Math.sign(vx)*Math.cos(angle)*790;}}
  const image=kind==='needle'?this.add.image(x,y,'props','needle').setDisplaySize(46,3):prop(this,kind==='shuriken'?3:10,x,y,kind==='shuriken'?27:128);
  image.setDepth(6);if(kind==='needle')image.setRotation(Math.atan2(vy,vx));if(kind==='water'){image.setFlipX(vx<0);image.setBlendMode(Phaser.BlendModes.ADD);}
  this.projectiles.push({image,x,y,vx,vy,friendly,kind,damage,owner,ttl:this.now+3500});
 }
 updateProjectiles(dt:number){
  this.projectiles=this.projectiles.filter(p=>{
   if(!p.image.active)return false;
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.image.setPosition(p.x,p.y);if(p.kind==='shuriken')p.image.rotation+=dt*20;
   let consumed=p.ttl<this.now||p.y<0||p.y>760||p.x<0||p.x>8150;
   const area={x:p.x,y:p.y,w:p.kind==='water'?106:28,h:p.kind==='water'?70:16};
   if(!consumed&&p.friendly){
    const mi=this.mirrors.findIndex(m=>m.hp>0&&intersects(area,{x:m.x,y:m.y,w:88,h:190}));
    if(mi>=0){this.damageMirror(mi,p.damage,false);consumed=true;}
    if(!consumed)for(const a of this.enemies)if(a.alive&&a.state!=='mirror'&&intersects(area,this.box(a))){this.damageEnemy(a,p.damage);consumed=true;break;}
   }else if(!consumed){
    for(const c of this.clones)if(c.alive&&intersects(area,this.box(c))){this.despawnClone(c);consumed=true;break;}
    if(!consumed)for(const d of this.decoys)if(d.expires>this.now&&intersects(area,{x:d.x,y:d.y,w:44,h:85})){d.expires=this.now;consumed=true;this.effect(5,d.x,d.y,90,300);break;}
    if(!consumed&&intersects(area,this.box(this.player))){this.hurtPlayer(p.damage,p.x-p.vx*.1);consumed=true;}
   }
   if(!consumed&&p.kind!=='water')consumed=SURFACES.some(s=>p.x>s.x-s.w/2&&p.x<s.x+s.w/2&&p.y>s.y+3&&p.y<s.y+28);
   if(consumed)p.image.destroy();return!consumed;
  });
 }
 updateEffects(dt:number){this.effects=this.effects.filter(e=>{const age=(this.now-e.start)/e.duration;if(this.now>e.expires){e.image.destroy();return false;}e.image.setAlpha(1-age).setScale(e.scale*(1+age*.38));e.image.rotation+=e.spin*dt;return true;});}
 progressLevel(){
  const x=this.player.body.x;
  if(x>320&&x<500&&this.now>1800&&this.hintUntil<this.now+3000)this.tip('J: melee combo · K: shuriken · Q: shadow clones',5500);
  for(let i=0;i<WAVES.length;i++)if(!this.waves.has(i)&&x>=WAVES[i].trigger&&!this.bossStage&&(i!==2||this.zabuzaDefeated)){
   this.waves.add(i);this.waveActive=i;WAVES[i].spawns.forEach((at,j)=>this.enemies.push(this.actor(j===2?'shinobi':'bandit',at,602)));this.tip(i===0?'Ambush! Clear the enemies to open the path.':'Enemy shinobi ahead. Mix ranged attacks and clones.',4000);break;
  }
  if(this.waveActive>=0&&!this.enemies.some(e=>e.alive&&e.kind!=='zabuza'&&e.kind!=='haku')){this.waveActive=-1;this.tip('Path cleared. Keep moving →',2500);this.soundscape.play('checkpoint');}
  if(x>3800&&!this.zabuzaDefeated&&!this.bossStage)this.beginBoss('zabuza');
  if(x>6760&&this.zabuzaDefeated&&!this.hakuDefeated&&!this.bossStage)this.beginBoss('haku');
 }
 beginBoss(kind:'zabuza'|'haku'){
  this.clearSupport();this.bossStage=kind;this.checkpoint=kind;this.phaseCounter=0;bridge.checkpoint(kind);
  const arena=ARENAS[kind];this.player.body.body.reset(arena.spawn,548);this.player.hp=100;this.chakra=100;this.lastSafeX=arena.spawn;this.player.face=1;
  const boss=this.actor(kind,arena.boss,602);this.boss=boss;this.enemies.push(boss);this.cameras.main.scrollX=arena.left;
  this.nextMirror=this.now+6500;this.physics.pause();this.hint='';this.publish();bridge.patch({screen:'intro',hint:'',checkpoint:kind});this.soundscape.play('checkpoint');
 }
 finishBoss(kind:'zabuza'|'haku'){
  this.clearSupport();this.destroyMirrors();this.boss=null;this.bossStage=null;this.player.hp=100;this.chakra=100;this.soundscape.play('checkpoint');this.shake(.003,450);
  if(kind==='zabuza'){this.zabuzaDefeated=true;this.tip('Zabuza defeated. Cross the bridge — Haku is waiting. →',6000);bridge.patch({boss:null,health:100,chakra:100});}
  else{this.hakuDefeated=true;this.gameOver=true;this.player.body.body.setVelocity(0);this.physics.pause();this.publish();this.scene.launch('Results');bridge.patch({screen:'victory',boss:null});}
 }
 beginMirrors(){
  const boss=this.boss;if(!boss||boss.kind!=='haku')return;
  this.clearWarning(boss);boss.state='mirror';boss.body.body.setVelocity(0);boss.body.body.setAllowGravity(false);boss.art.setAlpha(0);boss.shadow.setVisible(false);
  this.destroyMirrors();const left=ARENAS.haku.left,positions=[[130,467],[330,379],[525,312],[755,312],[950,379],[1150,467]];
  for(const [dx,y]of positions){const x=left+dx,image=prop(this,8,x,y,106).setDepth(3).setAlpha(.72);const reflection=this.add.sprite(x,y+62,'haku','0').setScale(.41).setAlpha(.3).setDepth(4);pose(reflection,'haku',0);this.mirrors.push({image,reflection,x,y,hp:TUNE.mirrorHealth});this.effect(9,x,y,125,650);}
  this.mirrorEnd=this.now+14500;this.mirrorActive=-1;this.mirrorSwap=this.now;this.soundscape.play('ice');this.tip('Ice mirrors! The shining mirror reveals Haku. K aims toward it.',6500);
 }
 updateMirrors(){
  if(!this.boss||this.boss.state!=='mirror')return;
  if(this.now>=this.mirrorEnd||!this.mirrors.some(m=>m.hp>0)){this.endMirrors();return;}
  if(this.now>=this.mirrorSwap){
   let next=(this.mirrorActive+1)%6;for(let i=0;i<6;i++)if(this.mirrors[next].hp>0)break;else next=(next+1)%6;
   this.mirrorActive=next;this.mirrorVolley=this.now+1050;this.mirrorSwap=this.now+2100;this.mirrorsFired=false;
   this.mirrors.forEach((m,i)=>{m.reflection.setAlpha(m.hp>0?i===next?.88:.23:0);m.image.setAlpha(m.hp>0?i===next?1:.5:0);if(i===next)m.image.setTint(0xc8faff);else m.image.clearTint();});
  }
  const active=this.mirrors[this.mirrorActive];if(!active||active.hp<=0)return;active.image.setAlpha(.82+Math.sin(this.now*.02)*.18);
  if(this.now>=this.mirrorVolley&&!this.mirrorsFired){this.mirrorsFired=true;pose(active.reflection,'haku',7,this.player.body.x<active.x);const target=this.target(),angle=Math.atan2(target.y-active.y,target.x-active.x);for(const offset of [-.1,0,.1])this.fire(active.x,active.y,Math.cos(angle+offset)*590,Math.sin(angle+offset)*590,false,'needle',10,this.boss.id);this.soundscape.play('ice');}
 }
 damageMirror(index:number,damage:number,ultimate:boolean){
  const mirror=this.mirrors[index];if(!mirror||mirror.hp<=0)return;mirror.hp-=damage;this.effect(9,mirror.x,mirror.y,ultimate?150:60,240);this.soundscape.play('ice');if(!ultimate)this.ultimate=gainUltimate(this.ultimate,damage*.55);
  if(mirror.hp<=0){mirror.image.setVisible(false);mirror.reflection.setVisible(false);this.effect(9,mirror.x,mirror.y,190,500);this.shake(.003,170);
   if(index===this.mirrorActive){this.endMirrors(index);const boss=this.boss;if(boss)this.damageEnemy(boss,ultimate?TUNE.ultimateDamage:105,ultimate);this.tip('Mirror shattered! Haku is exposed — close in!',3300);}
  }
 }
 endMirrors(index=this.mirrorActive){
  const boss=this.boss;if(!boss)return;const at=this.mirrors[index]?.x||boss.body.x;this.destroyMirrors();boss.body.body.setAllowGravity(true);boss.body.body.reset(Phaser.Math.Clamp(at,this.arenaMin()+120,this.arenaMax()-120),534);boss.art.setAlpha(1);boss.state='stunned';boss.next=this.now+3000;boss.until=this.now+500;boss.frame=13;this.nextMirror=this.now+11500;
 }
 destroyMirrors(){this.mirrors.forEach(m=>{m.image.destroy();m.reflection.destroy();});this.mirrors=[];this.mirrorActive=-1;}
 publish(){
  const key=this.bossStage||(this.zabuzaDefeated?'bridge':'forest'),info=STAGES[key];
  const phase=this.boss?.state==='mirror'?'ICE MIRRORS':this.boss?.state==='stunned'?'EXPOSED':this.boss?.state==='recover'?'RECOVERING':this.boss?.kind==='zabuza'&&this.boss.hp<this.boss.max*.5?'HIDDEN MIST':'BOSS ENCOUNTER';
  bridge.patch({health:this.player.hp,chakra:this.chakra,ultimate:this.ultimate,cloneCooldown:Math.max(0,(this.cloneReady-this.now)/1000),subCooldown:Math.max(0,(this.subReady-this.now)/1000),cloneCount:this.clones.length,elapsed:this.elapsed,kills:this.kills,device:this.inputs.device,stage:info.label,objective:info.objective,checkpoint:this.checkpoint,boss:this.boss?{name:this.boss.kind==='zabuza'?'ZABUZA MOMOCHI':'HAKU',health:this.boss.hp,max:this.boss.max,phase}:null,fps:Math.round(this.game.loop.actualFps)});
 }
 command(command:Command){
  if(command==='pause'&&bridge.get().screen==='playing'){this.physics.pause();this.scene.pause();this.inputs.clear();this.publish();bridge.patch({screen:'paused'});this.soundscape.sync(false);}
  else if(command==='resume'&&bridge.get().screen==='paused'){this.scene.resume();this.physics.resume();this.inputs.clear();bridge.patch({screen:'playing'});}
  else if(command==='skip'&&bridge.get().screen==='intro'){this.physics.resume();this.inputs.clear();bridge.patch({screen:'playing'});this.tip(this.bossStage==='zabuza'?'Dodge the sword. Q draws attention · L substitutes.':'Watch the senbon windup. Strike between volleys.',4500);}
 }
}
