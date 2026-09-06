import {bossBridge as bridge} from './boss-bridge';
export type Action = 'left' | 'right' | 'down' | 'jump' | 'melee' | 'tool' | 'dash' | 'parry' | 'skill1' | 'skill2' | 'substitute' | 'ultimate';
export const KEYBOARD: Record<string, Action> = {KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyS: 'down', ArrowDown: 'down', Space: 'jump', KeyJ: 'melee', KeyK: 'tool', ShiftLeft: 'dash', ShiftRight: 'dash', KeyF: 'parry', KeyQ: 'skill1', KeyE: 'skill2', KeyL: 'substitute', KeyR: 'ultimate'};
export const PAD_BUTTONS: Record<number, Action> = {0: 'jump', 1: 'dash', 2: 'melee', 3: 'tool', 4: 'parry', 5: 'skill1', 6: 'substitute', 7: 'skill2', 11: 'ultimate', 13: 'down', 14: 'left', 15: 'right'};
export function mapGamepad(pad: Pick<Gamepad, 'axes' | 'buttons'>): Set<Action> {
  const actions = new Set<Action>();
  if ((pad.axes[0] || 0) < -.24) actions.add('left'); if ((pad.axes[0] || 0) > .24) actions.add('right'); if ((pad.axes[1] || 0) > .45) actions.add('down');
  for (const [index, action] of Object.entries(PAD_BUTTONS)) if (pad.buttons[Number(index)]?.pressed || pad.buttons[Number(index)]?.value > .55) actions.add(action);
  return actions;
}
export class BattleInput {
  keyboard = new Set<Action>(); pad = new Set<Action>(); virtual = new Set<Action>();
  edges = new Set<Action>(); releases = new Set<Action>(); device: 'keyboard' | 'gamepad' = 'keyboard'; padStart = false; padConfirm = false;
  down = (event: KeyboardEvent) => {
    if ((event.target as HTMLElement)?.closest('[role="dialog"],input,select,textarea')) return;
    const screen = bridge.get().screen;
    if (event.code === 'Escape') {event.preventDefault(); if (!event.repeat) bridge.command(screen === 'paused' ? 'resume' : 'pause'); return;}
    if (event.code === 'Enter') {event.preventDefault(); if (!event.repeat) this.confirm(); return;}
    const action = KEYBOARD[event.code]; if (!action) return;
    if (['playing', 'intro', 'dead', 'paused'].includes(screen)) event.preventDefault();
    this.device = 'keyboard'; if (!this.keyboard.has(action)) this.edges.add(action); this.keyboard.add(action);
  };
  up = (event: KeyboardEvent) => {const action = KEYBOARD[event.code]; if (action) {this.keyboard.delete(action); this.releases.add(action);}};
  blur = () => {this.clear(); if (['playing', 'intro'].includes(bridge.get().screen)) bridge.command('pause');};
  visibility = () => {if (document.hidden) this.blur();};
  disconnect = () => {for (const action of this.pad) this.releases.add(action); this.pad.clear(); this.padStart = false; this.padConfirm = false; this.device = 'keyboard';};
  constructor() {window.addEventListener('keydown', this.down); window.addEventListener('keyup', this.up); window.addEventListener('blur', this.blur); window.addEventListener('gamepaddisconnected', this.disconnect); document.addEventListener('visibilitychange', this.visibility);}
  confirm() {
    switch (bridge.get().screen) {case 'title': bridge.command(bridge.get().seen.length ? 'continue' : 'start'); break; case 'intro': bridge.command('skip'); break; case 'dead': bridge.command('retry'); break; case 'paused': bridge.command('resume'); break; case 'victory': bridge.command('start'); break;}
  }
  poll() {
    let pads: (Gamepad | null)[] = []; try {pads = Array.from(navigator.getGamepads?.() || []);} catch {}
    const pad = pads.find(p => p?.connected);
    if (!pad) {if (this.pad.size || this.device === 'gamepad') this.disconnect(); return;}
    const next = mapGamepad(pad);
    for (const action of next) if (!this.pad.has(action)) {this.edges.add(action); this.device = 'gamepad';}
    for (const action of this.pad) if (!next.has(action)) this.releases.add(action);
    const start = !!pad.buttons[9]?.pressed, confirm = !!pad.buttons[0]?.pressed;
    if (start && !this.padStart) {bridge.command(bridge.get().screen === 'paused' ? 'resume' : 'pause'); this.device = 'gamepad';}
    if (confirm && !this.padConfirm && bridge.get().screen !== 'playing') {this.confirm(); this.device = 'gamepad';}
    this.pad = next; this.padStart = start; this.padConfirm = confirm;
  }
  held(action: Action) {return this.keyboard.has(action) || this.pad.has(action) || this.virtual.has(action);}
  pressed(action: Action) {return this.edges.has(action);}
  released(action: Action) {return this.releases.has(action);}
  inject(actions: Action[]) {for (const action of actions) if (!this.virtual.has(action)) this.edges.add(action); for (const action of this.virtual) if (!actions.includes(action)) this.releases.add(action); this.virtual = new Set(actions);}
  endFrame() {this.edges.clear(); this.releases.clear();}
  clear() {this.keyboard.clear(); this.pad.clear(); this.virtual.clear(); this.edges.clear(); this.releases.clear();}
  destroy() {window.removeEventListener('keydown', this.down); window.removeEventListener('keyup', this.up); window.removeEventListener('blur', this.blur); window.removeEventListener('gamepaddisconnected', this.disconnect); document.removeEventListener('visibilitychange', this.visibility);}
}
