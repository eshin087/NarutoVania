import {actorHead} from './presentation-v16';
import * as Phaser from 'phaser';
import {CHARACTER} from './chapter';
import type {CharacterId} from './combat-core';
import type {CinemaCue} from './story-director';
import {dialogueDuration} from './presentation-v14';
/** Timed dialogue belongs to staged actors; there are no fullscreen art panels. */
export class CinemaPresentation{
 private bubble:Phaser.GameObjects.Container;private ink:Phaser.GameObjects.Graphics;private name:Phaser.GameObjects.Text;private line:Phaser.GameObjects.Text;private caption:Phaser.GameObjects.Text;
 private until=0;private captionUntil=0;private speaker?:CinemaCue['actor'];
 constructor(private scene:Phaser.Scene){
  const ui=scene.scene.get('HUD');this.ink=ui.add.graphics();this.name=ui.add.text(12,10,'',{fontFamily:'Arial',fontSize:'14px',fontStyle:'bold',color:'#56717b'});
  this.line=ui.add.text(12,10,'',{fontFamily:'Arial',fontSize:'22px',color:'#102d38',wordWrap:{width:390},lineSpacing:4});
  this.bubble=ui.add.container(0,0,[this.ink,this.name,this.line]).setScrollFactor(0).setDepth(101).setVisible(false);
  this.caption=ui.add.text(640,113,'',{fontFamily:'Arial',fontSize:'17px',color:'#ffffff',backgroundColor:'#0b202ee8',padding:{x:20,y:10}}).setOrigin(.5).setScrollFactor(0).setDepth(102).setVisible(false);
 }
 cue(cue:CinemaCue,now:number){
  if(cue.speech){this.speaker=cue.actor;this.until=now+dialogueDuration(cue.speech);const names:Record<string,string>={prisoner:'Kakashi',tazuna:'Tazuna',gato:'Gato'};this.name.setText(CHARACTER[cue.actor as CharacterId]?.short||names[cue.actor||'']||'');this.line.setText(cue.speech);}
  if(cue.caption){this.caption.setText(cue.caption);this.captionUntil=now+(cue.hold||3000);}
 }
 update(now:number,position:(id:CinemaCue['actor'])=>Phaser.GameObjects.Sprite|Phaser.GameObjects.Image|undefined){
  this.caption.setVisible(now<this.captionUntil);this.bubble.setVisible(now<this.until);if(now>=this.until)return;
  const sprite=position(this.speaker),actor=sprite?actorHead(sprite):undefined,camera=this.scene.cameras.main,anchor=new Phaser.Math.Vector2();
  const origin=camera.getWorldPoint(0,0);anchor.set(((actor?.x??640)-origin.x)*camera.zoom,((actor?.y??590)-origin.y)*camera.zoom);
  const nameHeight=this.name.text?this.name.height+4:0;this.name.setVisible(!!this.name.text);this.line.setY(10+nameHeight);
  const width=Math.min(414,Math.max(this.name.text?this.name.width:0,...this.line.getWrappedText().map(line=>this.line.context.measureText(line).width))+24),height=this.line.height+nameHeight+20;
  const x=Phaser.Math.Clamp(anchor.x-width/2,22,1258-width),y=Phaser.Math.Clamp(anchor.y-18-height,120,570-height);
  this.bubble.setPosition(x,y);this.ink.clear().fillStyle(0xfaf7ed,.98).lineStyle(2,0x153c4a,1);this.ink.fillRoundedRect(0,0,width,height,12);this.ink.strokeRoundedRect(0,0,width,height,12);
  const tail=Phaser.Math.Clamp(anchor.x-x,18,width-18);this.ink.fillTriangle(tail-9,height-2,tail+9,height-2,tail,height+13);
 }
 destroy(){this.bubble.destroy(true);this.caption.destroy();}
}

