import {bridge} from './bridge';
import {gamepadActions,type Action} from './rules';
const keys:Record<string,Action>={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyJ:'melee',KeyK:'shuriken',KeyQ:'clones',KeyL:'substitute',KeyR:'rasengan'};
export class Inputs{
 keyboard=new Set<Action>();pad=new Set<Action>();virtual=new Set<Action>();edges=new Set<Action>();device:'keyboard'|'gamepad'='keyboard';padStart=false;padConfirm=false;
 down=(event:KeyboardEvent)=>{
  const screen=bridge.get().screen;
  if((event.target as HTMLElement)?.closest('[role="dialog"]'))return;
  if(event.code==='Escape'){event.preventDefault();bridge.command(screen==='paused'?'resume':'pause');return;}
  if(event.code==='Enter'){event.preventDefault();this.confirm();return;}
  const action=keys[event.code];if(!action)return;
  if(['playing','intro','dead','paused'].includes(screen))event.preventDefault();
  this.device='keyboard';if(!this.keyboard.has(action))this.edges.add(action);this.keyboard.add(action);
 };
 up=(event:KeyboardEvent)=>{const action=keys[event.code];if(action)this.keyboard.delete(action);};
 blur=()=>{this.clear();if(bridge.get().screen==='playing')bridge.command('pause');};
 visibility=()=>{if(document.hidden)this.blur();};
 constructor(){window.addEventListener('keydown',this.down);window.addEventListener('keyup',this.up);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);}
 confirm(){const s=bridge.get().screen;if(s==='title')bridge.command(bridge.get().checkpoint==='forest'?'start':'continue');else if(s==='intro')bridge.command('skip');else if(s==='dead')bridge.command('retry');else if(s==='paused')bridge.command('resume');else if(s==='victory')bridge.command('start');}
 poll(){
  let pads:(Gamepad|null)[]=[];try{pads=Array.from(navigator.getGamepads?.()||[]);}catch{}
  const pad=pads.find(p=>p?.connected);
  if(!pad){this.pad.clear();this.padStart=false;this.padConfirm=false;if(this.device==='gamepad')this.device='keyboard';return;}
  const next=gamepadActions(pad);for(const a of next)if(!this.pad.has(a)){this.edges.add(a);this.device='gamepad';}
  const start=!!pad.buttons[9]?.pressed,confirm=!!pad.buttons[0]?.pressed;
  if(start&&!this.padStart){bridge.command(bridge.get().screen==='paused'?'resume':'pause');this.device='gamepad';}
  if(confirm&&!this.padConfirm&&bridge.get().screen!=='playing'){this.confirm();this.device='gamepad';}
  this.pad=next;this.padStart=start;this.padConfirm=confirm;
 }
 held(action:Action){return this.keyboard.has(action)||this.pad.has(action)||this.virtual.has(action);}
 inject(actions:Action[]){for(const a of actions)if(!this.virtual.has(a))this.edges.add(a);this.virtual=new Set(actions);}
 pressed(action:Action){return this.edges.has(action);}
 endFrame(){this.edges.clear();}
 clear(){this.keyboard.clear();this.pad.clear();this.virtual.clear();this.edges.clear();}
 destroy(){window.removeEventListener('keydown',this.down);window.removeEventListener('keyup',this.up);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);}
}
