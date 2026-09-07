import type * as Phaser from 'phaser';
import {pose22} from './art-v22';
import {effect21} from './art-v21';
import {visibleBodyBounds} from './presentation-v16';
/** One prison presentation for capture, rescue gameplay, and the transformed-shuriken scene. */
export class WaterPrison{
 private shell:Phaser.GameObjects.Image;private front:Phaser.GameObjects.Graphics;
 constructor(private scene:Phaser.Scene,readonly captive:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image,private floor:number){this.shell=scene.add.image(captive.x,floor-130,'v21-effects','24').setDepth(3.5);this.front=scene.add.graphics().setDepth(6);}
 update(age:number,forming=false){pose22(this.captive,'characters-a',1,5,this.captive.flipX?-1:1);const b=visibleBodyBounds(this.captive),radius=Math.max(130,Math.hypot(b.width,b.height)/2+20),cy=this.floor-radius;
   const shift=cy-(b.top+b.bottom)/2;this.captive.y+=shift;const x=this.captive.x,t=forming?Math.max(.03,Math.min(1,age/950)):1;
   effect21(this.shell,3,forming&&age<950?Math.min(5,Math.floor(age/160)):5+Math.floor(age/420)%2,radius*2,radius*2);this.shell.setPosition(x,cy).setAlpha(.5*t);
   const g=this.front;g.clear();g.lineStyle(2,0xbdf9ff,.5*t);g.beginPath();g.arc(x,cy,radius*t,-2.8,-.7);g.strokePath();g.lineStyle(2,0x7edeea,.25*t);g.strokeEllipse(x,cy+radius*.4*Math.sin(age/1400),radius*1.8*t,38*t);
 }
 destroy(){this.shell.destroy();this.front.destroy();}
}
