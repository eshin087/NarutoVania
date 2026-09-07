import {animationFrame} from './animation-data';
import {type PreviewSpec} from './preview-catalog';
export {PREVIEWS} from './preview-catalog';
import * as Phaser from 'phaser';
import {bossBridge as bridge} from './boss-bridge';
import {poseBattle} from './battle-art';
import {UltimateBurst} from './ultimate-burst';
import type {PlayerId,AnimationName} from './combat-core';
import type {RecordedAudio} from './recorded-audio';
import {CHARACTER} from './chapter';
export class AnimationPreview extends Phaser.Scene{
 private frozen=false;private overlays:Phaser.GameObjects.Sprite[]=[];private overlayVisible=false;
 private spec!:PreviewSpec;private sounds!:RecordedAudio;private age=0;private actors:Phaser.GameObjects.Sprite[]=[];private burst:UltimateBurst|null=null;private caption!:Phaser.GameObjects.Text;
 constructor(){super('AnimationPreview');}
 init(data:{preview:PreviewSpec;sounds:RecordedAudio}){this.spec=data.preview;this.sounds=data.sounds;this.age=0;this.actors=[];this.burst=null;this.frozen=false;this.overlays=[];this.overlayVisible=false;}
 create(){
  this.add.image(640,350,'v2-bridge-background').setDisplaySize(1350,760);this.add.image(640,627,'v2-bridge-ground').setDisplaySize(1350,145);
  this.caption=this.add.text(640,110,this.spec.ultimate||`${CHARACTER[this.spec.character].name} · Motion study`,{fontFamily:'Arial',fontSize:'25px',color:'#ffffff',stroke:'#123545',strokeThickness:5}).setOrigin(.5);
  for(const [i,x]of (this.spec.ultimate?[460,950]:[330,640,950]).entries()){const sprite=this.add.sprite(x,590,`${this.spec.character}-locomotion`,'6').setDepth(4+i);sprite.setData('choreography',i===2?1:0);this.actors.push(sprite);if(!this.spec.ultimate)this.add.text(x,646,['REFERENCE','COMBO A','COMBO B'][i],{fontFamily:'Arial',fontSize:'18px',color:'#ffffff',stroke:'#123545',strokeThickness:4}).setOrigin(.5);}
  if(!this.spec.ultimate){
   const button=(x:number,label:string,action:()=>void)=>this.add.text(x,690,label,{fontFamily:'Arial',fontSize:'16px',color:'#e2edf0',backgroundColor:'#123747',padding:{x:12,y:7}}).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',action);
   button(390,'Play / freeze',()=>{this.frozen=!this.frozen;});
   button(555,'Previous frame',()=>this.stepFrame(-1));
   button(730,'Next frame',()=>this.stepFrame(1));
   button(925,'Reference overlay',()=>{this.overlayVisible=!this.overlayVisible;});
   for(const x of [640,950])this.overlays.push(this.add.sprite(x,590,`${this.spec.character}-locomotion`,'6').setDepth(12).setAlpha(.25).setTint(0x73f5ff).setVisible(false));
  }
  bridge.patch({screen:'preview',boss:null,cinematic:'',panelWaiting:false,canAdvance:false});this.sounds.stopEffects();this.events.once('shutdown',()=>{this.burst?.destroy();this.sounds.stopEffects();});
 }
 private stepFrame(direction:number){
  this.frozen=true;
  const token=(age:number)=>{const phase=Math.floor(age/1000)%5,animation:AnimationName=phase===0?'idle':phase===1?'run':(['light1','light2','light3'] as const)[phase-2];return `${phase}:${phase===0?0:animationFrame(animation,age%1000,phase===1?464:undefined).index}`;};
  const previous=token(this.age);for(let i=0;i<1100;i++){this.age=Math.max(0,this.age+direction);if(token(this.age)!==previous||this.age===0)break;}
 }
 update(_time:number,dt:number){
  if(bridge.get().screen!=='preview')return;if(!this.frozen)this.age+=Math.min(dt,50);const facing=Math.floor(this.age/10500)%2?-1:1;
  if(this.spec.ultimate){
   const a=this.actors[0],target=this.actors[1];
   if(!this.burst){a.setPosition(460,590);poseBattle(a,this.spec.character,'idle',0,1,undefined,this.spec.variant);target.setPosition(950,590);poseBattle(target,'zabuza','idle',0,-1);this.burst=new UltimateBurst(this,this.spec.character as PlayerId,this.spec.ultimate,460,950,590,1,beat=>{if(beat==='charge'||beat==='finish')this.sounds.ultimate(this.spec.character as PlayerId,beat);else this.sounds.effect('impact2',.6);},bridge.settings().reducedShake);}
   const state=this.burst.update(dt);this.burst.pose(a);if(state.impact){this.burst.impacted=true;poseBattle(target,'zabuza','hurt',80,-1);}
   if(this.burst.age>2700){this.burst.destroy();this.burst=null;this.frozen=false;this.overlays=[];this.overlayVisible=false;}return;
  }
  const phase=Math.floor(this.age/1000)%5,animation:AnimationName=phase===0?'idle':phase===1?'run':(['light1','light2','light3'] as const)[phase-2];
  for(let i=0;i<this.actors.length;i++)poseBattle(this.actors[i],this.spec.character,i===0?'idle':animation,this.age%1000,facing,animation==='run'?464:undefined,this.spec.variant);
  for(const ghost of this.overlays){ghost.setVisible(this.overlayVisible);poseBattle(ghost,this.spec.character,'idle',0,facing,undefined,this.spec.variant);}
  this.caption.setText(`${CHARACTER[this.spec.character].name} · ${animation.toUpperCase()} · ${facing>0?'RIGHT':'LEFT'}`);
 }
}
