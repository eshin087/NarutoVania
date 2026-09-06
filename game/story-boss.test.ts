import {describe, expect, it} from 'vitest';
import {Combatant, COMBAT} from './combat-core';
import {BossBrain, HAKU_MOVES, MirrorFormation, ZABUZA_MOVES} from './boss-ai';
import {PHASE_IDS, PLAYABLE_PHASE_IDS, type StoryPhaseId} from './chapter';
import {StoryDirector} from './story-director';
describe('boss pacing', () => {
  it('unlocks transfer attacks as soon as mirrors form, including above 73 percent health', () => {
    const model = new Combatant('haku', 1500, true), brain = new BossBrain(model, 'mirrors', () => .99); model.health = 1150;
    const move = brain.choose(5000, 800, true);
    expect(brain.phase).toBe(1); expect(move?.mirror).toBe(true);
  });
  it('does not select the same two recent moves or spend unavailable stamina', () => {
    const model = new Combatant('zabuza', 1500, true), brain = new BossBrain(model, 'copy', () => .25);
    const moves: string[] = [];
    for (let i = 0; i < 20; i++) {
      const now = i * 8000 + 3000; model.action = null; model.stamina = 100;
      const m = brain.choose(now, 220, false); if (m) moves.push(m.id);
    }
    expect(new Set(moves).size).toBeGreaterThanOrEqual(4);
    moves.forEach((m, i) => expect(moves.slice(Math.max(0, i - 2), i)).not.toContain(m));
    model.action = null; model.stamina = 2; expect(brain.choose(300000, 220, false)).toBeNull();
  });
  it('gives every attack readable anticipation, recovery, explicit cost, and bounded event timing', () => {
    for (const move of [...ZABUZA_MOVES, ...HAKU_MOVES]) {
      expect(move.stamina).toBeGreaterThan(0); expect(move.recovery).toBeGreaterThanOrEqual(450);
      for (const event of move.events) {expect(event.at).toBeGreaterThanOrEqual(event.red ? 700 : 400); expect(event.at).toBeLessThan(move.duration);}
    }
  });
  it('does not summon mirror attacks outside a formation', () => {
    const model = new Combatant('haku', 1500, true), brain = new BossBrain(model, 'seal', () => .99); model.health = 400;
    for (let i = 0; i < 15; i++) {model.action = null; model.stamina = 100; expect(brain.choose(5000 + i * 10000, 300, false)?.mirror).not.toBe(true);}
  });
});
describe('ice mirrors', () => {
  it('lets Sasuke interrupt an exposed opening without shattering the ice', () => {
    const m = new MirrorFormation(); m.create(830, 590); m.transfer(1000, () => 0);
    expect(m.strike(m.occupied, 500, false, 1300)).toEqual({interrupt: true, broken: false}); expect(m.mirrors[m.occupied].hp).toBe(130);
  });
  it('allows ordinary awakened Naruto attacks to break every mirror with no ultimate', () => {
    const m = new MirrorFormation(); m.create(830, 590);
    for (let index = 0; index < m.mirrors.length; index++) for (let n = 0; n < 6; n++) m.strike(index, 27, true, 1000);
    expect(m.count()).toBe(0); expect(m.transfer(1200)).toBeNull();
  });
  it('never transfers into broken mirrors or the current occupied mirror', () => {
    const m = new MirrorFormation(); m.create(830, 590); m.mirrors[1].broken = true;
    for (let i = 0; i < 10; i++) {const previous = m.occupied; const target = m.transfer(i * 1000, () => .15);
      expect(target?.broken).toBe(false); expect(m.occupied).not.toBe(previous);}
  });
});
describe('story director skip and replay', () => {
  function make(phase: StoryPhaseId) {
    const enter: string[] = [], complete: string[] = [], cues: unknown[] = [];
    const director = new StoryDirector(phase, {enter: s => enter.push(s.phase), cinematic: () => {}, cue: c => cues.push(c), complete: () => complete.push('done')});
    return {director, enter, complete, cues};
  }
  it.each(PHASE_IDS)('%s skip and natural ending produce identical story states', phase => {
    const a = make(phase), b = make(phase); a.director.start(false); b.director.start(false);
    a.director.finishObjective(); b.director.finishObjective(); a.director.skip(); while (b.director.mode === 'cinematic') b.director.update(b.director.clip!.duration + 100);
    expect(a.director.state).toEqual(b.director.state); expect(a.enter).toEqual(b.enter); expect(a.complete).toEqual(b.complete);
    a.director.skip(); expect(a.complete.length).toBeLessThanOrEqual(1);
  });
  it('migrates a Sakura checkpoint directly through her cinematic to Sasuke', () => {
    const {director, enter} = make('protect'); director.start(false);
    expect(director.mode).toBe('cinematic'); expect(enter).toEqual([]);
    director.skip(); expect(enter).toEqual(['mirrors']);
  });
  it('migrates a final Kakashi checkpoint to the ending without a redundant duel', () => {
    const {director, enter, complete} = make('lightning'); director.start(false);
    expect(director.mode).toBe('cinematic'); director.skip();
    expect(enter).toEqual([]); expect(complete).toEqual(['done']);
  });
  it('completes the full five-phase chapter with canonical state and no forced deaths', () => {
    const {director, enter, complete} = make('mist'); director.start(true); director.skip();
    for (const phase of PLAYABLE_PHASE_IDS) {expect(director.state.phase).toBe(phase); director.finishObjective(); director.skip();}
    expect(enter).toEqual(PLAYABLE_PHASE_IDS); expect(complete).toEqual(['done']);
    expect(director.state).toMatchObject({complete: true, hakuIntercepted: true, sasukeFallen: true});
  });
  it('fires each cinematic cue once and ignores repeated objective completion during a cutscene', () => {
    const {director, cues} = make('mist'); director.start(false); director.finishObjective();
    director.finishObjective(); director.update(1000); const count = cues.length; director.update(0); expect(cues.length).toBe(count);
    expect(director.clip?.id).toBe('water-prison');
  });
});


describe('Sasuke mirror objective', () => {
  it('requires both sustained defense and two mirror guard breaks, never a deliberate death', () => {
    const d=new StoryDirector('mirrors',{enter:()=>{},cue:()=>{},cinematic:()=>{},complete:()=>{}});d.start(false);
    expect(d.objectiveComplete(1000,59.99,2)).toBe(false);
    expect(d.objectiveComplete(1000,90,1)).toBe(false);
    expect(d.objectiveComplete(1000,60,2)).toBe(true);
    d.finishObjective();d.skip();expect(d.state.phase).toBe('seal');expect(d.state.sasukeFallen).toBe(true);
  });
});


describe('upper mirror reachability', () => {
  it('lets a normal jump attack reach every upper mirror without an ultimate or air dash', () => {
    const formation=new MirrorFormation();formation.create(830,590);
    const apexFeet=590-COMBAT.jump**2/(2*COMBAT.gravity);
    const projectileY=apexFeet-76;
    for(const m of formation.mirrors.filter(m=>!m.foreground)) {
      if(m.y<590-180)expect(projectileY).toBeLessThan(m.y+89);
    }
  });
});
