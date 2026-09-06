/** Pure kinematics used by the cinematic renderer. Contact is emitted once, even after a long frame. */
export class TargetedCinemaShot{
 x:number;y:number;rotation=0;contact=false;age=0;contactAge=0;
 constructor(x:number,y:number,public targetX:number,public targetY:number,public speed=980,public spinning=true){this.x=x;this.y=y;if(!spinning)this.rotation=Math.atan2(targetY-y,targetX-x);}
 tick(dt:number){this.age+=dt;if(this.contact){this.contactAge+=dt;return false;}const dx=this.targetX-this.x,dy=this.targetY-this.y,d=Math.hypot(dx,dy),step=this.speed*dt/1000;
  if(step>=d){this.x=this.targetX;this.y=this.targetY;this.contact=true;return true;}
  this.x+=dx/d*step;this.y+=dy/d*step;if(this.spinning)this.rotation+=dt*.025;else this.rotation=Math.atan2(dy,dx);return false;
 }
 get done(){return this.contact&&this.contactAge>=480;}
}
export class MirrorExit{
 age=0;vy=0;landedAt:number|null=null;readonly startY:number;
 constructor(public x:number,public y:number,public floor:number,public stunned:boolean){this.startY=y;}
 tick(dt:number){const prior=this.age;this.age+=dt;const release=this.stunned?180:120;
  if(this.landedAt!==null)return;
  const fallingMs=Math.max(0,this.age-Math.max(prior,release)),seconds=fallingMs/1000;
  this.y+=this.vy*seconds+900*seconds*seconds;this.vy+=1800*seconds;
  if(this.y>=this.floor){this.y=this.floor;this.vy=0;this.landedAt=this.age;}
 }
 get frame(){if(this.landedAt!==null){const age=this.age-this.landedAt;return age<120?4:age<320?5:age<550?6:7;}return this.age<100?0:this.age<180?1:this.vy<380?2:3;}
 get done(){return this.landedAt!==null&&this.age-this.landedAt>=(this.stunned?650:250);}
}
export function clashStage(age:number){return age<700?'formation':age<1400?'surge':age<1620?'contact':age<2350?'collapse':age<3000?'spray':'done';}
