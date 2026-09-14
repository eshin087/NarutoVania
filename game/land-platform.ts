import {COMBAT, UNIVERSAL, clamp, type Combatant} from './combat-core';
import {JumpState} from './jump-state';
import {chargedSmash, directionalAim, selectNormal, steerVelocity, type AttackAim, type PlatformAttack, type LaunchEvent} from './platform-combat';
import type {Action} from './battle-input';

interface Controls {held(a:Action):boolean;pressed(a:Action):boolean;released(a:Action):boolean;}
interface Motion {velocity:{x:number;y:number};setVelocityX(x:number):unknown;setVelocityY(y:number):unknown;setVelocity(x:number,y:number):unknown;}

/** Input state belongs to one fight, never to a cutscene or an ultimate. */
export class LandPlatformControls {
  jumps=new JumpState();
  buffered:{aim:AttackAim;at:number;running:boolean}|null=null;
  combo=0;comboUntil=0;landingUntil=0;wasGrounded=true;
  smashAim:AttackAim='forward';airDodge={x:0,y:0};
  reset(){this.jumps.reset();this.buffered=null;this.combo=0;this.comboUntil=0;this.landingUntil=0;this.wasGrounded=true;this.airDodge={x:0,y:0};}
  actions(p:Combatant,body:Motion,input:Controls,now:number){
    const x=Number(input.held('right'))-Number(input.held('left'));
    const y=Number(input.held('down'))-Number(input.held('up'));
    if(!this.wasGrounded&&p.grounded&&p.action?.definition.action==='aerial'){
      this.landingUntil=now+((p.action.definition as PlatformAttack).landingLag||100);p.action=null;
    }
    this.wasGrounded=p.grounded;
    const ready=now>=this.landingUntil;
    if(x&&p.grounded&&!p.action&&p.chargeStarted===null&&p.canAct(now))p.facing=x as -1|1;
    if(x&&input.held('parry')&&p.canAct(now,true))p.facing=x as -1|1;
    const aim=directionalAim(x,y,p.facing);
    p.setGuard(ready&&input.held('parry'),input.pressed('parry'),now);
    this.jumps.observe(now,p.grounded,body.velocity.y);
    if(input.pressed('jump'))this.jumps.press(now);
    const jump=this.jumps.consume(now,ready&&p.canAct(now)&&!p.guard&&p.chargeStarted===null);
    if(jump){body.setVelocityY(-COMBAT.jump*(jump==='air'?.76:1));p.grounded=false;}
    if(input.released('jump')&&body.velocity.y< -280)body.setVelocityY(body.velocity.y*.55);
    if(input.pressed('dash')&&ready){
      const kind=!p.grounded?'airdash':input.held('down')&&x?'slide':'dash';
      if(x&&p.grounded)p.facing=x as -1|1;
      if(p.start(UNIVERSAL[kind],now)&&kind==='airdash'){
        const length=Math.hypot(x,y)||1;this.airDodge={x:x/length*620,y:y/length*620};
      }
    }
    if(input.pressed('melee'))this.buffered={aim,at:now,running:Math.abs(body.velocity.x)>COMBAT.speed*.72};
    if(input.pressed('tool')&&ready&&p.grounded&&p.canAct(now)&&!p.guard){this.smashAim=aim;p.chargeStarted=now;}
    if(p.chargeStarted!==null&&(input.released('tool')||now-p.chargeStarted>=1000)){
      const charge=1+clamp((now-p.chargeStarted)/1000,0,1)*.8;p.chargeStarted=null;p.start(chargedSmash(this.smashAim),now,charge);
    }
    if(this.buffered&&now-this.buffered.at>150)this.buffered=null;
    if(this.buffered&&ready&&p.canAct(now)&&!p.guard&&p.chargeStarted===null){
      const b=this.buffered;if(now>this.comboUntil)this.combo=0;
      const selected=selectNormal(b.aim,p.grounded,this.combo,b.running);
      const animation=selected.id==='pf-jab2'?'light2':selected.id==='pf-jab3'?'light3':selected.animation;
      if(p.start({...selected,animation},now)){
        this.combo=b.aim==='neutral'&&p.grounded?(this.combo+1)%3:0;this.comboUntil=now+650;this.buffered=null;
      }
    }
    return ready;
  }
  move(p:Combatant,body:Motion,input:Controls,now:number,dt:number){
    const x=Number(input.held('right'))-Number(input.held('left'));
    const y=Number(input.held('down'))-Number(input.held('up'));
    let vx=p.action?(p.action.definition.move||0)*p.action.facing:x*(p.guard?COMBAT.guardSpeed:COMBAT.speed);
    if(!p.grounded&&p.action?.definition.action!=='airdash')vx=steerVelocity(body.velocity.x,x*COMBAT.speed*.85,1800,dt);
    else if(!p.action)vx=steerVelocity(body.velocity.x,vx,x?5800:7000,dt);
    if(now<p.hurtUntil||now<p.guardBrokenUntil)vx=steerVelocity(body.velocity.x,x*75,500,dt);
    if(p.chargeStarted!==null||now<this.landingUntil)vx=0;
    body.setVelocityX(vx);
    if(p.action?.definition.action==='airdash')body.setVelocity(this.airDodge.x,this.airDodge.y);
    else if(!p.grounded&&y>0&&body.velocity.y>0&&now>=p.hurtUntil)body.setVelocityY(Math.max(1100,body.velocity.y));
  }
}

export interface LaunchOwnership {mirror:boolean;barrage:boolean;sword:boolean;restraint:boolean;committedRed:boolean;}
export function launchAllowed(owner:LaunchOwnership){return !Object.values(owner).some(Boolean);}

/** Arcade owns integration; this owns interrupt/landing time and bounded combo escape. */
export class LandLaunch {
  active=false;until=0;landingUntil=0;hits=0;lastHit=-Infinity;escapeUntil=0;
  reset(){this.active=false;this.until=0;this.landingUntil=0;this.hits=0;this.lastHit=-Infinity;this.escapeUntil=0;}
  hit(event:LaunchEvent,direction:number,now:number){
    if(event.launchY===undefined||now<this.escapeUntil)return null;
    this.hits=now-this.lastHit<1000?this.hits+1:1;this.lastHit=now;
    const escape=this.hits>=4;if(escape){this.escapeUntil=now+1300;this.hits=0;}
    this.active=true;this.until=now+280;this.landingUntil=0;
    return {x:direction*(escape?480:event.launchX||0),y:escape?380:event.launchY};
  }
  tick(now:number,grounded:boolean){
    if(this.active&&grounded&&now>=this.until){this.active=false;this.landingUntil=now+220;}
    return this.active||now<this.landingUntil;
  }
}
