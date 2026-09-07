/** One owner, two damaging passes, and a harmless deflection return. */
export class ReturningSword {
  phase: 'outbound'|'turnaround'|'returning'|'caught'='outbound';
  harmless=false; hit=new Set<string>(); turnAge=0;
  constructor(public x:number,public y:number,public dx:number,public dy:number,public remaining:number){}
  parry(){this.harmless=true;this.phase='returning';this.hit.clear();}
  step(dt:number,hand:{x:number;y:number}){
    const from={x:this.x,y:this.y};
    if(this.phase==='outbound'){
      const distance=Math.min(this.remaining,1650*dt/1000);this.x+=this.dx*distance;this.y+=this.dy*distance;this.remaining-=distance;
      if(this.remaining<=0){this.phase='turnaround';this.turnAge=0;}
    }else if(this.phase==='turnaround'){
      this.turnAge+=dt;if(this.turnAge>=120){this.phase='returning';this.hit.clear();}
    }else if(this.phase==='returning'){
      const dx=hand.x-this.x,dy=hand.y-this.y,d=Math.hypot(dx,dy),step=1875*dt/1000;
      if(d<=step){this.x=hand.x;this.y=hand.y;this.phase='caught';}
      else{this.x+=dx/d*step;this.y+=dy/d*step;}
    }
    return {from,to:{x:this.x,y:this.y},damaging:!this.harmless&&this.phase!=='turnaround'&&this.phase!=='caught'};
  }
}
