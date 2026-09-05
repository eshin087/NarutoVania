import {bridge} from './bridge';
export class Soundscape{
 context:AudioContext|null=null;ambient:GainNode|null=null;oscillators:OscillatorNode[]=[];
 unlock(){
  try{
   if(!this.context){this.context=new AudioContext();this.ambient=this.context.createGain();this.ambient.gain.value=.011;this.ambient.connect(this.context.destination);
    for(const frequency of [73.42,110,146.83]){const osc=this.context.createOscillator();osc.type='sine';osc.frequency.value=frequency;osc.connect(this.ambient);osc.start();this.oscillators.push(osc);}
   }if(this.context.state==='suspended')void this.context.resume();
  }catch{}
 }
 sync(active:boolean){if(this.context&&this.ambient)this.ambient.gain.setTargetAtTime(active&&!bridge.settings().muted?.009:0,this.context.currentTime,.2);}
 play(kind:'hit'|'throw'|'jump'|'clone'|'sub'|'ultimate'|'ice'|'hurt'|'checkpoint'){
  if(!this.context||bridge.settings().muted)return;
  const ctx=this.context,t=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
  const specs={hit:[120,45,.08],throw:[650,230,.09],jump:[160,340,.11],clone:[320,70,.23],sub:[580,90,.2],ultimate:[80,680,.55],ice:[1200,370,.2],hurt:[95,40,.18],checkpoint:[440,880,.5]}[kind];
  osc.type=['hit','hurt'].includes(kind)?'triangle':'sine';osc.frequency.setValueAtTime(specs[0],t);osc.frequency.exponentialRampToValueAtTime(specs[1],t+specs[2]);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(kind==='ultimate'?.14:.055,t+.009);gain.gain.exponentialRampToValueAtTime(.0001,t+specs[2]);osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+specs[2]+.03);osc.onended=()=>{osc.disconnect();gain.disconnect();};
 }
 destroy(){this.oscillators.forEach(o=>o.stop());if(this.context)void this.context.close();this.context=null;}
}
