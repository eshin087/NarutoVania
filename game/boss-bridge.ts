import {PHASE_IDS, PHASES, type StoryPhaseId, type Ability} from './chapter';
import {clamp, type PlayerId} from './combat-core';
export type Screen = 'loading' | 'title' | 'preview' | 'playing' | 'paused' | 'intro' | 'dead' | 'victory' | 'error';
export type Command = 'start' | 'continue' | 'pause' | 'resume' | 'retry' | 'title' | 'skip' | 'advance' | 'debug-replay' | 'debug-exit' | {type:'debug';entry:string} | {type:'audition';id:string};
export interface Settings {muted: boolean; reducedShake: boolean; musicVolume: number; effectsVolume: number; voiceVolume: number;}
export interface Snapshot {
  debugEntry:string|null;panelWaiting:boolean;canAdvance:boolean;screen: Screen; progress: number; character: PlayerId; health: number; stamina: number; chakra: number; ultimate: number;
  guardBroken: boolean; guarding: boolean; checkpoint: StoryPhaseId; stage: string; objective: string; phaseProgress: number;
  abilities: {id: string; label: string; description: string; icon: Ability['icon']; cooldown: number; cost: number; ready: boolean}[];
  subCooldown: number; cloneCount: number; elapsed: number; phaseElapsed: number; device: 'keyboard' | 'gamepad';
  boss: null | {name: string; health: number; max: number; stamina: number; guardBroken: boolean; phase: string; stunned: boolean; postureFlash: boolean; recovery: number};
  reading: number; counter: boolean; stunned: boolean; recovery: number; ultimateCinematic: string;
  protection: number | null; retries: number; parries: number; error: string; fps: number; cinematic: string; seen: StoryPhaseId[];
}
const initial: Snapshot = {debugEntry:null,panelWaiting:false,canAdvance:false,screen: 'loading', progress: 0, character: 'kakashi', health: 100, stamina: 100, chakra: 100, ultimate: 0,
  guardBroken: false, guarding: false, checkpoint: 'mist', stage: PHASES.mist.title, objective: '', phaseProgress: 0, abilities: [],
  subCooldown: 0, cloneCount: 0, elapsed: 0, phaseElapsed: 0, device: 'keyboard', boss: null, protection: null, retries: 0,
  parries: 0, error: '', fps: 60, cinematic: '', seen: [], stunned:false,recovery:0,ultimateCinematic:'',reading:0,counter:false};
const defaults: Settings = {muted: false, reducedShake: false, musicVolume: .55, effectsVolume: .8, voiceVolume: 0};
let snapshot = {...initial}, settings = {...defaults};
let normalCheckpoint:Pick<Snapshot,'checkpoint'|'seen'|'elapsed'|'parries'|'retries'>|null=null;
const listeners = new Set<() => void>(); let handler: (command: Command) => void = () => {};
const validPhase = (value: unknown): value is StoryPhaseId => PHASE_IDS.includes(value as StoryPhaseId);
export function readSettings(raw: unknown): Settings {
  const saved = raw && typeof raw === 'object' ? raw as Partial<Settings> : {};
  const level = (v: unknown, fallback: number) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, 0, 1) : fallback;
  return {muted: saved.muted === true, reducedShake: saved.reducedShake === true, musicVolume: level(saved.musicVolume, defaults.musicVolume), effectsVolume: level(saved.effectsVolume, defaults.effectsVolume), voiceVolume: level(saved.voiceVolume, defaults.voiceVolume)};
}
export function readCheckpoint(raw: unknown): {phase: StoryPhaseId; seen: StoryPhaseId[]} {
  const saved = raw && typeof raw === 'object' ? raw as {version?: number; phase?: unknown; seen?: unknown[]} : {};
  return saved.version === 2 && validPhase(saved.phase) ? {phase: saved.phase, seen: Array.isArray(saved.seen) ? saved.seen.filter(validPhase) : []} : {phase: 'mist', seen: []};
}
function emit() {listeners.forEach(listener => listener());}
export const bossBridge = {
  get: () => snapshot,
  subscribe: (listener: () => void) => {listeners.add(listener); return () => {listeners.delete(listener);};},
  patch: (patch: Partial<Snapshot>) => {snapshot = {...snapshot, ...patch}; emit();},
  command: (command: Command) => handler(command), handle: (fn: (command: Command) => void) => {handler = fn;},
  settings: () => settings,
  setSettings: (patch: Partial<Settings>) => {settings = readSettings({...settings, ...patch}); try {localStorage.setItem('narutovania.settings.v2', JSON.stringify(settings));} catch {} emit();},
  load: () => {
    try {settings = readSettings(JSON.parse(localStorage.getItem('narutovania.settings.v2') || localStorage.getItem('narutovania.settings.v1') || '{}'));} catch {settings = {...defaults};}
    try {if(localStorage.getItem('narutovania.audio.v11')!=='1'){settings={...settings,voiceVolume:0};localStorage.setItem('narutovania.settings.v2',JSON.stringify(settings));localStorage.setItem('narutovania.audio.v11','1');}}catch{}
    try {const cp = readCheckpoint(JSON.parse(localStorage.getItem('narutovania.checkpoint.v2') || '{}')); snapshot = {...snapshot, checkpoint: cp.phase, seen: cp.seen};} catch {}
  },
  beginDebug:(entry:string)=>{if(!snapshot.debugEntry)normalCheckpoint={checkpoint:snapshot.checkpoint,seen:[...snapshot.seen],elapsed:snapshot.elapsed,parries:snapshot.parries,retries:snapshot.retries};bossBridge.patch({debugEntry:entry});},
  endDebug:()=>{if(normalCheckpoint){snapshot={...snapshot,...normalCheckpoint};normalCheckpoint=null;}bossBridge.patch({debugEntry:null,panelWaiting:false,canAdvance:false});},
  checkpoint: (phase: StoryPhaseId) => {
    if(snapshot.debugEntry){bossBridge.patch({checkpoint:phase});return;}
    const seen = [...new Set([...snapshot.seen, phase])];
    try {localStorage.setItem('narutovania.checkpoint.v2', JSON.stringify({version: 2, phase, seen}));} catch {}
    bossBridge.patch({checkpoint: phase, seen});
  },
  newRun: () => {normalCheckpoint=null;snapshot = {...initial, screen: snapshot.screen}; try {localStorage.setItem('narutovania.checkpoint.v2', JSON.stringify({version: 2, phase: 'mist', seen: []}));} catch {} emit();},
  reset: () => {normalCheckpoint=null;snapshot = {...initial}; emit();},
};
