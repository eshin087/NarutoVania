import {poseUltimate} from './art-cinema-v14';
import * as Phaser from 'phaser';
import type {PlayerId} from './combat-core';
import {poseBattle} from './battle-art';
import {makeEffect,animateEffect} from './effects-v14';
import {ULTIMATE_END} from './presentation-v14';
export const ULTIMATE_TIMING={cutIn:300,first:880,second:1100,impact:1330,end:ULTIMATE_END} as const;
const palette:Record<PlayerId,number>={kakashi:0x8fedff,naruto:0xff7041,sasuke:0xb2edff,sakura:0xffd6e6};
/** Arena choreography owns presentation time. Its caller emits combat damage exactly once. */
export class UltimateBurst{
 age=0;impacted=false;private beat=0;readonly color:number;
 private objects:Phaser.GameObjects.GameObject[]=[];private actors:Phaser.GameObjects.Sprite[]=[];
 private shatters:{image:Phaser.GameObjects.Image;born:number}[]=[];
 private effects:Phaser.GameObjects.Image[]=[];private dim:Phaser.GameObjects.Rectangle;
 private flash:Phaser.GameObjects.Rectangle;private label:Phaser.GameObjects.Text;
 readonly cloneBarrage:boolean;readonly fury:boolean;
 constructor(private scene:Phaser.Scene,readonly character:PlayerId,readonly name:string,readonly fromX:number,readonly toX:number,readonly floor:number,readonly facing:-1|1,private sound:(beat:'charge'|'strike'|'finish')=>void,private reduced=false){
  this.cloneBarrage=character==='naruto'&&name==='Clone Barrage';this.fury=character==='naruto'&&!this.cloneBarrage;this.color=this.cloneBarrage?0xb4eeff:palette[character];
  const keep=<T extends Phaser.GameObjects.GameObject>(v:T)=>{this.objects.push(v);return v;};
  this.dim=keep(scene.add.rectangle(640,360,1280,720,0x02121c,.18).setScrollFactor(0).setDepth(0));
  for(const y of [18,702])keep(scene.add.rectangle(640,y,1280,36,0x021018).setScrollFactor(0).setDepth(29));
  this.label=keep(scene.add.text(640,80,name.toUpperCase(),{fontFamily:'Arial',fontStyle:'bold',fontSize:'25px',color:'#effaff',stroke:'#092033',strokeThickness:5,letterSpacing:4}).setOrigin(.5).setScrollFactor(0).setDepth(29));
  this.flash=keep(scene.add.rectangle(640,360,1280,720,0xc9edff,0).setScrollFactor(0).setDepth(25));
  for(let i=0;i<3;i++)this.actors.push(keep(scene.add.sprite(fromX,floor,`${character}-melee`,'0').setDepth(6+i*.05).setAlpha(0)));
  for(let i=0;i<5;i++)this.effects.push(keep(makeEffect(scene,'smoke',fromX,floor-65,150).setDepth(i===0?3:9).setAlpha(0)));
  sound('charge');
 }
 shatterMirror(x:number,y:number){const image=makeEffect(this.scene,'ice-shards',x,y,185,230).setDepth(8);this.objects.push(image);this.shatters.push({image,born:this.age});}
 get x(){const t=Phaser.Math.Clamp((this.age-300)/650,0,1);return Phaser.Math.Linear(this.fromX,this.toX-this.facing*65,Phaser.Math.Easing.Cubic.InOut(t));}
 pose(sprite:Phaser.GameObjects.Sprite){
  const age=this.age;poseUltimate(sprite,this.character,this.fury,age,this.facing);
  sprite.setPosition(this.x,this.floor+(this.character==='sasuke'&&age>450&&age<950?-Math.sin((age-450)/500*Math.PI)*32:0)).clearTint().setAlpha(1);
 }
 update(dt:number){
  this.age+=dt;for(const shard of this.shatters){const age=this.age-shard.born;animateEffect(shard.image,'ice-shards',age,600);shard.image.setAlpha(Math.max(0,1-age/600));}
  const a=this.age,x=this.x;this.label.setAlpha(Math.max(0,1-(a-500)/350));this.dim.setAlpha(a<1650?.18:.18*(2000-a)/350);
  const kind=this.character==='kakashi'?'lightning':this.fury?'chakra-aura':this.cloneBarrage?'smoke':'parry';
  const charge=this.effects[0];animateEffect(charge,kind,a%650,650);charge.setPosition(x+this.facing*30,this.floor-85).setDisplaySize(this.fury?230:125,this.fury?210:125).setAlpha(a<1600?.95:Math.max(0,(2000-a)/400));
  for(let i=0;i<3;i++){
   const actor=this.actors[i],local=a-(360+i*160),active=local>=0&&a<1570;
   poseBattle(actor,this.character,local<280?'dash':(['light1','light2','light3'] as const)[i],Math.max(0,local-280),this.facing,470,this.fury?'awakened':undefined);
   const t=Phaser.Math.Clamp(local/480,0,1),destination=this.toX-this.facing*(i===1?-48:90+i*20);
   actor.setPosition(Phaser.Math.Linear(this.fromX-this.facing*i*35,destination,t),this.floor-(i===1?Math.sin(t*Math.PI)*65:0)).setAlpha(active?(this.cloneBarrage?.9:this.reduced?0:.22):0);
   if(!this.cloneBarrage)actor.setTint(this.color);else actor.clearTint();
   const impact=this.effects[i+1],since=a-[880,1100,1330][i];animateEffect(impact,kind==='smoke'?'parry':kind,Math.max(0,since),400);
   impact.setPosition(this.toX+this.facing*(i-1)*18,this.floor-85).setDisplaySize(i===2?320:170,i===2?260:150).setAlpha(since>=0&&since<400?1:0);
  }
  const trail=this.effects[4];animateEffect(trail,this.fury?'chakra-aura':this.character==='kakashi'?'lightning':'smoke',a%500,500);trail.setPosition(x-this.facing*80,this.floor-65).setDisplaySize(200,90).setFlipX(this.facing<0).setAlpha(a>350&&a<1200?.55:0);
  const beats=[880,1100,1330];while(this.beat<beats.length&&a>=beats[this.beat]){this.sound(this.beat===2?'finish':'strike');this.beat++;}
  const final=a-1330;this.flash.setAlpha(!this.reduced&&final>=0&&final<90?.18*(1-final/90):0);
  return{x,impact:a>=1330&&!this.impacted,complete:a>=ULTIMATE_END};
 }
 destroy(){for(const object of this.objects)object.destroy();this.objects=[];}
}
