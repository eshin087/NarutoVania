import {bossBridge as bridge} from './boss-bridge';
import type {BattleInput, Action} from './battle-input';
import type {BossGameScene} from './boss-gameplay';
type Tool = {name: string; description: string; inputSchema: Record<string, unknown>; execute: (args: Record<string, unknown>) => unknown;};
type ModelContext = {registerTool: (tool: Tool & {annotations: {readOnlyHint: boolean}}, options?: {signal: AbortSignal}) => void | Promise<void>; unregisterTool?: (name: string) => void};
export function registerBossTools(inputs: BattleInput, scene: () => BossGameScene | undefined) {
  const modelContext = (document as unknown as {modelContext?: ModelContext}).modelContext || (navigator as unknown as {modelContext?: ModelContext}).modelContext;
  if (!modelContext?.registerTool) return () => {};
  const registered: string[] = []; const lifecycle = new AbortController(); let alive = true; let busy = false;
  const status = () => {const s = bridge.get(); return {screen: s.screen,debugEntry:s.debugEntry,panelWaiting:s.panelWaiting,canAdvance:s.canAdvance,cinematic:s.cinematic, character: s.character, phase: s.checkpoint, objective: s.objective, health: Math.round(s.health), stamina: Math.round(s.stamina), chakra: Math.round(s.chakra), ultimate: Math.round(s.ultimate), boss: s.boss, checkpoint: s.checkpoint, phaseProgress: s.phaseProgress, elapsedSeconds: Math.round(s.elapsed), ...(import.meta.env.DEV ? {details: scene()?.status()} : {})};};
  const result = (value: unknown) => value;
  const add = (tool: Tool) => {try {void Promise.resolve(modelContext.registerTool({...tool, annotations: {readOnlyHint: tool.name === 'read_game_status'}}, {signal: lifecycle.signal})).catch(() => {}); registered.push(tool.name);} catch {}};
  const empty = {type: 'object', properties: {}, additionalProperties: false};
  add({name: 'read_game_status', description: 'Read the current Naruto boss-rush phase, controlled character, resources, boss and checkpoint.', inputSchema: empty, execute: () => result(status())});
  add({name: 'start_chapter', description: 'Start the story chapter, or continue the saved phase, using the game’s normal start action.', inputSchema: {type: 'object', properties: {continue: {type: 'boolean'}}, additionalProperties: false}, execute: args => {
    if (!['title', 'victory'].includes(bridge.get().screen)) return result({error: 'Use the title menu to start a new run.'});
    bridge.command(args.continue ? 'continue' : 'start'); return result(status());
  }});
  add({name: 'set_game_paused', description: 'Pause or resume gameplay or the current skippable cinematic.', inputSchema: {type: 'object', properties: {paused: {type: 'boolean'}}, required: ['paused'], additionalProperties: false}, execute: args => {bridge.command(args.paused ? 'pause' : 'resume'); return result(status());}});
  add({name: 'retry_checkpoint', description: 'After defeat, retry the current story phase with starting resources and skip the viewed introduction.', inputSchema: empty, execute: () => {
    if (bridge.get().screen !== 'dead') return result({error: 'Retry is available after defeat.'}); bridge.command('retry'); return result(status());
  }});
  add({name:'advance_cinematic',description:'Continue the current held manga panel through the same Continue action as the menu.',inputSchema:empty,execute:()=>{bridge.command('advance');return result(status());}});
  add({name: 'skip_cinematic', description: 'Skip only the current scene and enter its next story beat, exactly like Skip scene.', inputSchema: empty, execute: () => {
    if (bridge.get().screen !== 'intro') return result({error: 'There is no active cinematic.'}); bridge.command('skip'); return result(status());
  }});
  if (import.meta.env.DEV) {
    add({name: 'run_combat_playtest', description: 'Development-only bounded browser input pilot for testing combat timing. Uses ordinary keyboard actions; never overrides resources, positions, time or story outcomes. Casual mode deliberately mistimes half its guards. Pauses after at most 30 seconds.', inputSchema: {type: 'object', properties: {milliseconds: {type: 'integer', minimum: 1000, maximum: 30000}, noUltimate: {type: 'boolean'},casual:{type:'boolean'}}, required: ['milliseconds'], additionalProperties: false}, execute: async args => {
      const game = scene(); if (busy || !game || !['playing', 'paused', 'intro'].includes(bridge.get().screen)) return {error: 'Start a fight first.'};
      busy = true; try {const {driveCombat} = await import('./playtest-driver'); return await driveCombat(game, inputs, Math.max(1000, Math.min(30000, Number(args.milliseconds))), args.noUltimate === true,args.casual===true);} finally {busy = false;}
    }});
    const actions: Action[] = ['left', 'right', 'down', 'jump', 'melee', 'tool', 'dash', 'parry', 'skill1', 'skill2', 'substitute', 'ultimate'];
    add({name: 'play_input_sequence', description: 'Development browser playtest: hold ordinary game inputs for bounded durations. No stat, phase or outcome overrides. Pauses after the sequence by default.',
      inputSchema: {type: 'object', properties: {steps: {type: 'array', minItems: 1, maxItems: 24, items: {type: 'object', properties: {actions: {type: 'array', items: {type: 'string', enum: actions}}, ms: {type: 'integer', minimum: 16, maximum: 3000}}, required: ['actions', 'ms'], additionalProperties: false}}, pauseAfter: {type: 'boolean'}}, required: ['steps'], additionalProperties: false},
      execute: async args => {
        if (busy) return result({error: 'An input sequence is already running.'});
        const steps = args.steps as {actions: Action[]; ms: number}[];
        if (!Array.isArray(steps) || steps.length > 24 || steps.reduce((n, s) => n + s.ms, 0) > 30000 || steps.some(s => !Array.isArray(s.actions) || s.actions.some(a => !actions.includes(a)) || !Number.isFinite(s.ms) || s.ms < 16 || s.ms > 3000)) return result({error: 'Invalid input sequence.'});
        busy = true; if (bridge.get().screen === 'paused') bridge.command('resume');
        try {for (const step of steps) {if (!alive || bridge.get().screen !== 'playing') break; inputs.inject(step.actions); await new Promise(resolve => setTimeout(resolve, step.ms));}}
        finally {inputs.inject([]); busy = false; if (alive && args.pauseAfter !== false && ['playing', 'intro'].includes(bridge.get().screen)) bridge.command('pause');}
        return result(status());
      }});
  }
  return () => {alive = false; lifecycle.abort(); inputs.clear(); for (const name of registered) try {modelContext.unregisterTool?.(name);} catch {}};
}
