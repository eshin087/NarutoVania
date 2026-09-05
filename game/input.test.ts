import {afterEach,describe,expect,it,vi} from 'vitest';
import {Inputs} from './input';
import {bridge} from './bridge';
describe('input lifecycle',()=>{
 let inputs:Inputs|undefined;
 afterEach(()=>{inputs?.destroy();bridge.handle(()=>{});vi.unstubAllGlobals();});
 function setup(){
  vi.stubGlobal('window',new EventTarget());vi.stubGlobal('document',new EventTarget());
  let connected=true;const buttons=Array.from({length:16},()=>({pressed:false,value:0}));
  vi.stubGlobal('navigator',{getGamepads:()=>connected?[{connected:true,axes:[0,0],buttons}]:[]});
  inputs=new Inputs();return {buttons,disconnect:()=>{connected=false;},input:inputs};
 }
 it('handles controller connection, held input, release and disconnection',()=>{
  const {buttons,disconnect,input}=setup();buttons[4]={pressed:true,value:1};input.poll();
  expect(input.held('clones')).toBe(true);expect(input.pressed('clones')).toBe(true);expect(input.device).toBe('gamepad');
  input.endFrame();input.poll();expect(input.pressed('clones')).toBe(false);
  disconnect();input.poll();expect(input.held('clones')).toBe(false);expect(input.device).toBe('keyboard');
 });
 it('debounces Start and routes confirm to the same menu actions',()=>{
  const {buttons,input}=setup(),commands:string[]=[];bridge.patch({screen:'playing'});bridge.handle(c=>commands.push(c));
  buttons[9]={pressed:true,value:1};input.poll();input.poll();expect(commands).toEqual(['pause']);
  buttons[9]={pressed:false,value:0};input.poll();bridge.patch({screen:'paused'});buttons[0]={pressed:true,value:1};input.poll();expect(commands).toEqual(['pause','resume']);
 });
 it('pauses on lost focus and clears every held source',()=>{
  const {input}=setup(),commands:string[]=[];bridge.patch({screen:'playing'});bridge.handle(c=>commands.push(c));
  input.keyboard.add('right');input.inject(['melee']);input.blur();
  expect(input.held('right')).toBe(false);expect(input.held('melee')).toBe(false);expect(commands).toEqual(['pause']);
 });
});
