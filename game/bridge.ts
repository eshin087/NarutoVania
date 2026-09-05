export type Checkpoint = 'forest' | 'zabuza' | 'haku';
export type Screen = 'loading' | 'title' | 'playing' | 'paused' | 'intro' | 'dead' | 'victory' | 'error';
export type Command = 'start' | 'continue' | 'pause' | 'resume' | 'retry' | 'title' | 'skip';
export type Settings = { muted:boolean; reducedShake:boolean };
export type Snapshot = {
  screen:Screen; progress:number; health:number; chakra:number; ultimate:number;
  cloneCooldown:number; subCooldown:number; cloneCount:number; elapsed:number;
  checkpoint:Checkpoint; stage:string; objective:string; hint:string; device:'keyboard'|'gamepad';
  boss:null | {name:string;health:number;max:number;phase:string};
  kills:number; error:string; fps:number;
};
const initial:Snapshot={screen:'loading',progress:0,health:100,chakra:100,ultimate:0,cloneCooldown:0,subCooldown:0,cloneCount:0,elapsed:0,checkpoint:'forest',stage:'THE MISTY PATH',objective:'Find the bridge',hint:'',device:'keyboard',boss:null,kills:0,error:'',fps:60};
let snapshot={...initial};
const listeners=new Set<()=>void>();
let handler:(command:Command)=>void=()=>{};
let settings:Settings={muted:false,reducedShake:false};
export const bridge={
 get:()=>snapshot,
 subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
 patch:(patch:Partial<Snapshot>)=>{snapshot={...snapshot,...patch};listeners.forEach(l=>l());},
 command:(command:Command)=>handler(command),
 handle:(fn:(command:Command)=>void)=>{handler=fn;},
 settings:()=>settings,
 setSettings:(patch:Partial<Settings>)=>{settings={...settings,...patch};try{localStorage.setItem('narutovania.settings.v1',JSON.stringify(settings));}catch{};listeners.forEach(l=>l());},
 load:()=>{try{const saved=JSON.parse(localStorage.getItem('narutovania.settings.v1')||'{}');settings={muted:saved.muted===true,reducedShake:saved.reducedShake===true};const cp=localStorage.getItem('narutovania.checkpoint.v1');if(cp==='zabuza'||cp==='haku')snapshot={...snapshot,checkpoint:cp};}catch{}},
 checkpoint:(cp:Checkpoint)=>{try{localStorage.setItem('narutovania.checkpoint.v1',cp);}catch{};bridge.patch({checkpoint:cp});},
 reset:()=>{snapshot={...initial,checkpoint:snapshot.checkpoint};listeners.forEach(l=>l());},
};
