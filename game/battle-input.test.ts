import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BattleInput, KEYBOARD, PAD_BUTTONS, mapGamepad, keyboardAction, type Action} from './battle-input';
import {bossBridge, readCheckpoint, readSettings} from './boss-bridge';
function pad(actions: Action[], axes = [0, 0]): Gamepad {
  const buttons = Array.from({length: 17}, (_, i) => ({pressed: actions.includes(PAD_BUTTONS[i]), value: actions.includes(PAD_BUTTONS[i]) ? 1 : 0, touched: false}));
  return {buttons, axes, connected: true, mapping: 'standard', id: 'test-standard-controller', index: 0, timestamp: 0, vibrationActuator: null} as unknown as Gamepad;
}
describe('controller parity and lifecycle', () => {
  let pads: (Gamepad | null)[] = [], input: BattleInput;
  beforeEach(() => {
    vi.stubGlobal('window', {addEventListener: vi.fn(), removeEventListener: vi.fn()}); vi.stubGlobal('document', {addEventListener: vi.fn(), removeEventListener: vi.fn(), hidden: false});
    vi.stubGlobal('navigator', {getGamepads: () => pads}); bossBridge.reset(); input = new BattleInput();
  });
  afterEach(() => {input.destroy(); vi.unstubAllGlobals(); pads = [];});
  it('maps every keyboard gameplay action to a controller input', () => {
    for (const action of new Set(Object.values(KEYBOARD))) expect(Object.values(PAD_BUTTONS)).toContain(action);
    expect(mapGamepad(pad(['dash', 'parry', 'skill1', 'skill2', 'substitute', 'ultimate']))).toEqual(new Set(['dash', 'parry', 'skill1', 'skill2', 'substitute', 'ultimate']));
  });
  it('switches prompts and clears held inputs on controller disconnection', () => {
    pads = [pad(['right', 'parry'])]; input.poll(); expect(input.device).toBe('gamepad'); expect(input.held('parry')).toBe(true);
    pads = []; input.poll(); expect(input.device).toBe('keyboard'); expect(input.held('parry')).toBe(false); expect(input.released('parry')).toBe(true);
  });
  it('has a stick dead zone and separates trigger techniques', () => {
    expect(mapGamepad(pad([], [.12, .2])).size).toBe(0); expect(mapGamepad(pad([], [-.8, .8]))).toEqual(new Set(['left', 'down']));
    expect(mapGamepad(pad(['skill2', 'substitute']))).toEqual(new Set(['skill2', 'substitute']));
  });
  it('focus loss pauses fights and cutscenes and clears all held actions', () => {
    const commands: string[] = []; bossBridge.handle(c => commands.push(typeof c==='string'?c:c.type)); bossBridge.patch({screen: 'intro'});
    input.inject(['right', 'melee', 'parry']); input.blur(); expect(input.held('melee')).toBe(false); expect(commands).toEqual(['pause']);
  });
  it('held Enter and controller confirmation cannot dismiss a newly entered panel',()=>{
    const commands:unknown[]=[];bossBridge.handle(c=>commands.push(c));bossBridge.patch({screen:'intro'});
    const e={code:'Enter',key:'Enter',target:null,preventDefault:vi.fn(),repeat:false} as unknown as KeyboardEvent;
    input.down(e);expect(commands).toEqual(['advance']);input.clear();input.down(e);expect(commands).toHaveLength(1);input.up(e);input.down(e);expect(commands).toHaveLength(2);
    pads=[pad(['jump'])];input.poll();expect(commands).toHaveLength(3);input.clear();input.poll();expect(commands).toHaveLength(3);pads=[pad([])];input.poll();pads=[pad(['jump'])];input.poll();expect(commands).toHaveLength(4);
  });
  it('virtual ordinary inputs have deliberate press/release edges', () => {
    input.inject(['parry']); expect(input.pressed('parry')).toBe(true); input.endFrame(); input.inject(['parry']); expect(input.pressed('parry')).toBe(false);
    input.inject([]); expect(input.released('parry')).toBe(true); input.endFrame(); input.inject(['parry']); expect(input.pressed('parry')).toBe(true);
  });
  it('supports browsers that provide logical keys without a physical code',()=>{
    expect(keyboardAction({code:'',key:'r'})).toBe('ultimate');expect(keyboardAction({code:'',key:'Shift'})).toBe('dash');
    expect(keyboardAction({code:'KeyJ',key:'x'})).toBe('melee');
    const event={code:'',key:'r',target:null,preventDefault:vi.fn(),repeat:false} as unknown as KeyboardEvent;
    input.down(event);expect(input.pressed('ultimate')).toBe(true);input.endFrame();input.up(event);expect(input.held('ultimate')).toBe(false);
  });
});
describe('save migration', () => {
  it('preserves old sound/shake preferences and gives the three buses valid defaults', () => {
    expect(readSettings({muted: true, reducedShake: true})).toMatchObject({muted: true, reducedShake: true, musicVolume: .55, effectsVolume: .8, voiceVolume: 0});
    expect(readSettings({musicVolume: -5, effectsVolume: 20, voiceVolume: NaN})).toMatchObject({musicVolume: 0, effectsVolume: 1, voiceVolume: 0});
  });
  it('starts legacy platformer saves at the chapter opening', () => {
    expect(readCheckpoint('haku')).toEqual({phase: 'mist', seen: []}); expect(readCheckpoint({phase: 'haku', version: 1})).toEqual({phase: 'mist', seen: []});
    expect(readCheckpoint({version: 2, phase: 'seal', seen: ['mist', 'seal', 'invalid']})).toEqual({phase: 'seal', seen: ['mist', 'seal']});
  });
});
