import {bridge} from './bridge';
import type {Inputs} from './input';
import type {GameScene} from './gameplay';
import type {Action} from './rules';
type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown};
type Context={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
const actions=['left','right','jump','melee','shuriken','clones','substitute','rasengan'];
function object(input:unknown){if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected an object.');return input as Record<string,unknown>;}
export function registerTools(inputs:Inputs,getScene:()=>GameScene|undefined){
 const context=(document as Document&{modelContext?:Context}).modelContext;if(!context?.registerTool)return()=>{};
 const lifecycle=new AbortController();
 const add=(tool:Tool)=>{try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 const empty={type:'object',properties:{},additionalProperties:false};
 const emptyInput=(input:unknown)=>{if(Object.keys(object(input)).length)throw new Error('No arguments expected.');};
 const status=()=>{
  const s=bridge.get();const result={...s};
  if(import.meta.env.DEV){const game=getScene();if(game?.player)return{...result,player:{x:Math.round(game.player.body.x),y:Math.round(game.player.body.y),grounded:game.player.body.body.blocked.down,facing:game.player.face},enemies:game.enemies.filter(e=>e.alive).map(e=>({kind:e.kind,x:Math.round(e.body.x),y:Math.round(e.body.y),hp:e.hp,state:e.state,attack:e.attack,next:Math.round(e.next-game.now)})),mirrors:game.mirrors.map((m,i)=>({x:m.x,y:m.y,hp:m.hp,active:i===game.mirrorActive})),entities:{children:game.children.length,projectiles:game.projectiles.length,effects:game.effects.length,clones:game.clones.length,decoys:game.decoys.length}};}
  return result;
 };
 add({name:'read_game_status',description:'Read the current screen, resources, objective, boss health, and chapter progress.',inputSchema:empty,annotations:{readOnlyHint:true},execute:(input)=>{emptyInput(input);return status();}});
 add({name:'start_chapter',description:'Start a new chapter, or continue the saved checkpoint. Starting fresh resets chapter progress.',inputSchema:{type:'object',properties:{continue:{type:'boolean'}},additionalProperties:false},annotations:{readOnlyHint:false},execute:async(input)=>{const v=object(input);if(Object.keys(v).some(k=>k!=='continue')||(v.continue!==undefined&&typeof v.continue!=='boolean'))throw new Error('continue must be boolean.');bridge.command(v.continue?'continue':'start');await new Promise(r=>setTimeout(r,180));return status();}});
 add({name:'set_game_paused',description:'Pause or resume the current encounter through the same controls as the pause menu.',inputSchema:{type:'object',properties:{paused:{type:'boolean'}},required:['paused'],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input)=>{const v=object(input);if(typeof v.paused!=='boolean'||Object.keys(v).length!==1)throw new Error('paused must be boolean.');bridge.command(v.paused?'pause':'resume');return status();}});
 add({name:'retry_checkpoint',description:'Retry after defeat from the saved checkpoint, restoring health and chakra.',inputSchema:empty,annotations:{readOnlyHint:false},execute:async(input)=>{emptyInput(input);if(bridge.get().screen!=='dead')throw new Error('Retry is available after defeat.');bridge.command('retry');await new Promise(r=>setTimeout(r,180));return status();}});
 add({name:'continue_encounter',description:'Dismiss a boss introduction and begin the encounter, like pressing Enter.',inputSchema:empty,annotations:{readOnlyHint:false},execute:(input)=>{emptyInput(input);if(bridge.get().screen!=='intro')throw new Error('No boss introduction is open.');bridge.command('skip');return status();}});
 // Local playtest surface uses ordinary input actions. No teleport, damage, or resource overrides.
 if(import.meta.env.DEV)add({name:'play_input_sequence',description:'Local testing only: hold normal game input actions for bounded durations. Resumes a paused game; optionally pauses after the sequence. Does not change health, positions, enemies, or game rules directly.',inputSchema:{type:'object',properties:{steps:{type:'array',minItems:1,maxItems:16,items:{type:'object',properties:{actions:{type:'array',items:{type:'string',enum:actions}},ms:{type:'integer',minimum:30,maximum:2500}},required:['actions','ms'],additionalProperties:false}},pauseAfter:{type:'boolean'}},required:['steps'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(input)=>{
  const v=object(input);if(!Array.isArray(v.steps)||v.steps.length<1||v.steps.length>16||Object.keys(v).some(k=>!['steps','pauseAfter'].includes(k))||(v.pauseAfter!==undefined&&typeof v.pauseAfter!=='boolean'))throw new Error('Invalid input sequence.');
  let total=0;for(const s of v.steps){const step=object(s);if(!Array.isArray(step.actions)||step.actions.some(a=>!actions.includes(a))||typeof step.ms!=='number'||!Number.isInteger(step.ms)||step.ms<30||step.ms>2500)throw new Error('Invalid input step.');total+=step.ms;}if(total>20000)throw new Error('A sequence may last at most 20 seconds.');
  if(bridge.get().screen==='paused')bridge.command('resume');
  try{for(const s of v.steps){if(bridge.get().screen!=='playing')break;inputs.inject(s.actions as Action[]);await new Promise(r=>setTimeout(r,s.ms));}}finally{inputs.inject([]);if(v.pauseAfter!==false&&bridge.get().screen==='playing')bridge.command('pause');}
  return status();
 }});
 return()=>lifecycle.abort();
}

