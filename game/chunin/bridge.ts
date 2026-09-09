import { readChapters, writeChapter } from '../chapter-registry';
import { bossBridge, type Settings } from '../boss-bridge';
import { PHASES, type Phase } from './combat';
export type Screen =
  | 'loading'
  | 'title'
  | 'intro'
  | 'playing'
  | 'paused'
  | 'dead'
  | 'victory'
  | 'error';
export type Command =
  | 'start'
  | 'continue'
  | 'pause'
  | 'resume'
  | 'retry'
  | 'title'
  | 'skip'
  | 'advance'
  | 'debug-replay'
  | { type: 'debug'; phase: Phase; scene?: string };
export interface Snapshot {
  modalOpen: boolean;
  screen: Screen;
  phase: Phase;
  health: number;
  stamina: number;
  ultimate: number;
  bossHealth: number;
  bossMax: number;
  bossStamina: number;
  bossMove: string;
  exposed: boolean;
  guardBroken: boolean;
  stunned: boolean;
  device: 'keyboard' | 'gamepad';
  elapsed: number;
  phaseElapsed: number;
  progress: number;
  error: string;
  seen: string[];
  debugEntry: string | null;
  dialogue: string;
  speaker: string;
  skill1: number;
  skill2: number;
  backstep: number;
  ultimateName: string;
  parries: number;
  fps: number;
}
const initial: Snapshot = {
  modalOpen: false,
  screen: 'loading',
  phase: 'shield',
  health: 100,
  stamina: 100,
  ultimate: 100,
  bossHealth: 1800,
  bossMax: 1800,
  bossStamina: 100,
  bossMove: '',
  exposed: false,
  guardBroken: false,
  stunned: false,
  device: 'keyboard',
  elapsed: 0,
  phaseElapsed: 0,
  progress: 0,
  error: '',
  seen: [],
  debugEntry: null,
  dialogue: '',
  speaker: '',
  skill1: 0,
  skill2: 0,
  backstep: 0,
  ultimateName: '',
  parries: 0,
  fps: 60,
};
let snapshot = { ...initial };
const listeners = new Set<() => void>();
let handler: (c: Command) => void = () => {};
export const bridge = {
  get: () => snapshot,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  patch: (p: Partial<Snapshot>) => {
    snapshot = { ...snapshot, ...p };
    listeners.forEach((fn) => fn());
  },
  command: (c: Command) => handler(c),
  handle: (fn: (c: Command) => void) => {
    handler = fn;
  },
  settings: bossBridge.settings,
  setSettings: (p: Partial<Settings>) => {
    bossBridge.setSettings(p);
    bridge.patch({});
  },
  load: () => {
    bossBridge.load();
    const p = readChapters().chapters['lee-gaara'];
    snapshot = {
      ...initial,
      phase: PHASES.includes(p.checkpoint as Phase)
        ? (p.checkpoint as Phase)
        : 'shield',
      seen: p.seen,
    };
  },
  checkpoint: (phase: Phase, completed = false) => {
    if (snapshot.debugEntry) return;
    const seen = [...new Set([...snapshot.seen, phase])];
    writeChapter('lee-gaara', { checkpoint: phase, seen, completed });
    bridge.patch({ phase, seen });
  },
};
