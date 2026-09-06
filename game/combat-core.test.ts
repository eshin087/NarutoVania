import {describe, expect, it} from 'vitest';
import {COMBAT, Combatant, UNIVERSAL, hurtbox, overlaps, safeSubstitution} from './combat-core';
import {PLAYABLE_PHASE_IDS, PHASES, kit, nextPhase, stateForPhase} from './chapter';
const ordinary = {damage: 12, posture: 18, red: false, fromX: 200};
const guard = (time = 1000) => {const f = new Combatant('kakashi'); f.stamina = 60; f.setGuard(true, true, time); return f;};
describe('timed defense', () => {
  it.each([0, 1, 139])('deflects at %i ms inside the fresh window', offset => {
    const f = guard(); expect(f.receive(ordinary, 1000 + offset).result).toBe('parry'); expect(f.health).toBe(100); expect(f.stamina).toBe(70);
  });
  it('blocks at exactly 140 ms, not a perfect parry', () => {const f = guard(); expect(f.receive(ordinary, 1140).result).toBe('block'); expect(f.stamina).toBe(30);});
  it('does not refresh on held input or repeated early tapping', () => {
    const f = guard(); f.setGuard(true, true, 1100); expect(f.parryAt).toBe(1000);
    f.setGuard(false, false, 1150); f.setGuard(true, true, 1200); expect(f.parryAt).toBe(1000);
    f.setGuard(false, false, 1250); f.setGuard(true, true, 1300); expect(f.parryAt).toBe(1300);
  });
  it('a successful parry permits the next deliberate deflection, but never a held automatic chain', () => {
    const f = guard(); f.receive(ordinary, 1050); expect(f.receive(ordinary, 1060).result).toBe('block');
    f.setGuard(false, false, 1070); f.setGuard(true, true, 1100); expect(f.receive(ordinary, 1110).result).toBe('parry');
  });
  it('rear and red attacks bypass both guard and parry', () => {
    expect(guard().receive({...ordinary, fromX: -100}, 1050).result).toBe('damage');
    expect(guard().receive({...ordinary, red: true}, 1050).result).toBe('damage');
  });
  it('insufficient guard stamina causes damage and an 800 ms break', () => {
    const f = guard(); f.stamina = 29; expect(f.receive(ordinary, 1150).result).toBe('guardbreak');
    expect(f.health).toBe(88); expect(f.stamina).toBe(0); expect(f.guardBrokenUntil).toBe(1950);
    expect(f.start(UNIVERSAL.dash, 1800)).toBe(false);
  });
  it('zero stamina cannot parry and guarding cannot regenerate stamina', () => {
    const f = new Combatant('sakura'); f.stamina = 0; f.setGuard(true, true, 1000); f.update(2000, 1000);
    expect(f.stamina).toBe(0); expect(f.receive(ordinary, 2001).result).toBe('guardbreak');
  });
  it('boss exhaustion is a punish window, not health loss or phase completion', () => {
    const f = new Combatant('zabuza', 1500, true); f.stamina = 20; f.exhaust(24, 1000);
    expect(f.health).toBe(1500); expect(f.guardBrokenUntil).toBe(2550);
    f.update(2549, 0); expect(f.stamina).toBe(0); f.update(2550, 0); expect(f.stamina).toBe(100);
  });
});
describe('movement resources and hitboxes', () => {
  it('requires full dash cost and never produces negative stamina', () => {
    const f = new Combatant('naruto'); f.stamina = 21.99; expect(f.start(UNIVERSAL.dash, 0)).toBe(false);
    f.stamina = 22; expect(f.start(UNIVERSAL.dash, 0)).toBe(true); expect(f.stamina).toBe(0);
    f.update(221, 0); expect(f.start(UNIVERSAL.dash, 221)).toBe(false);
  });
  it('ground dash immunity expires at 140 ms and slide has none', () => {
    const f = new Combatant('naruto'); f.start(UNIVERSAL.dash, 1000);
    expect(f.receive({...ordinary, red: true}, 1139).result).toBe('immune'); expect(f.receive(ordinary, 1140).result).toBe('damage');
    const slider = new Combatant('naruto'); slider.start(UNIVERSAL.slide, 1000); expect(slider.receive(ordinary, 1010).result).toBe('damage');
  });
  it('limits air dash to one per airborne cycle', () => {
    const f = new Combatant('sasuke'); f.grounded = false; expect(f.start(UNIVERSAL.airdash, 1000)).toBe(true);
    f.update(1300, 0); expect(f.start(UNIVERSAL.airdash, 1400)).toBe(false);
    f.grounded = true; f.update(1500, 0); f.grounded = false; expect(f.start(UNIVERSAL.airdash, 1600)).toBe(true);
  });
  it('allows a slide beneath a chest-height projectile but not a low projectile', () => {
    expect(overlaps(hurtbox(100, 590, false), {x: 90, y: 519, width: 40, height: 8})).toBe(true);
    expect(overlaps(hurtbox(100, 590, true), {x: 90, y: 519, width: 40, height: 8})).toBe(false);
    expect(overlaps(hurtbox(100, 590, true), {x: 90, y: 575, width: 40, height: 8})).toBe(true);
  });
  it('delays regeneration then restores 35 per second', () => {
    const f = new Combatant('kakashi'); f.spend(60, 1000); f.update(1649, 100); expect(f.stamina).toBe(40);
    f.update(1650, 1000); expect(f.stamina).toBe(75);
  });
  it('substitution stays inside the arena and avoids the boss', () => {
    for (const x of [75, 300, 700, 1480]) for (const direction of [-1, 1] as const) {
      const result = safeSubstitution(x, direction, 70, 1490, 400);
      expect(result).toBeGreaterThanOrEqual(100); expect(result).toBeLessThanOrEqual(1460); expect(Math.abs(result - 400)).toBeGreaterThanOrEqual(76);
    }
  });
});
describe('action scheduler', () => {
  it('uses anticipation and emits an active event only once even across long frames', () => {
    const f = new Combatant('kakashi'); f.start(UNIVERSAL.light1, 1000);
    expect(f.update(1169, 169).filter(e => e.event.kind === 'hit')).toHaveLength(0);
    expect(f.update(1170, 1).filter(e => e.event.kind === 'hit')).toHaveLength(1);
    expect(f.update(1200, 40)).toHaveLength(0);
  });
  it('prevents tools and casts overwriting melee, and permits only recovery defense cancels', () => {
    const f = new Combatant('sasuke'); f.start(UNIVERSAL.light1, 0);
    expect(f.start(UNIVERSAL.tool, 200)).toBe(false); expect(f.start(UNIVERSAL.dash, UNIVERSAL.light1.cancelAt! - 1)).toBe(false);
    expect(f.start(UNIVERSAL.dash, UNIVERSAL.light1.cancelAt!)).toBe(true);
  });
  it('buffers the next strike for 240 ms and does not turn holding melee into infinite combos', () => {
    const f = new Combatant('naruto'); f.bufferMelee(0); expect(f.consumeMelee(0)).toBe(true);
    f.bufferMelee(280); f.update(390, 390); expect(f.consumeMelee(390)).toBe(true); expect(f.action?.definition.id).toBe('light2');
    f.update(820, 430); expect(f.consumeMelee(820)).toBe(false);
  });
  it('expires an old input buffer and scales heavy damage by charge time', () => {
    const f = new Combatant('sakura'); f.bufferMelee(0); expect(f.consumeMelee(COMBAT.inputBuffer + 1)).toBe(false);
    expect(f.beginCharge(1000)).toBe(true); expect(f.releaseCharge(1700)).toBe(true); expect(f.action?.charge).toBe(1);
  });
  it('cannot spend chakra twice or cast during a cooldown', () => {
    const f = new Combatant('naruto'); const clone = kit('rescue')[0].attack;
    expect(f.start(clone, 0)).toBe(true); expect(f.chakra).toBe(70); f.update(1000, 0);
    expect(f.start(clone, 1001)).toBe(false); expect(f.chakra).toBe(70);
  });
});
describe('canonical checkpoint state', () => {
  it('has four controlled phases and no traversal waves', () => {
    expect(PLAYABLE_PHASE_IDS.map(id => PHASES[id].character)).toEqual(['kakashi', 'naruto', 'sasuke', 'naruto']);
    expect(nextPhase('lightning')).toBeNull();
  });
  it('restores the complete handoff state from any checkpoint', () => {
    expect(stateForPhase('rescue').kakashiCaptured).toBe(true);
    expect(stateForPhase('copy').kakashiCaptured).toBe(false);
    expect(stateForPhase('seal')).toMatchObject({narutoInMirrors: true, sasukeFallen: true, sharinganAwakened: true, sealBroken: true});
    expect(stateForPhase('lightning')).toMatchObject({hakuDefeated: true, hakuIntercepted: false});
  });
  it('gives Kakashi his own kit throughout and keeps the other characters arc appropriate', () => {
    for(const phase of ['mist','copy','lightning'] as const)expect(kit(phase).map(a=>a.attack.id)).toEqual(['reading','hounds','lightning']);
    expect(kit('mist')[2].label).toBe('Chidori');
    expect(JSON.stringify(['rescue','protect','mirrors','seal'].map(p=>kit(p as 'rescue')))).not.toMatch(/Rasengan|Chidori|healing|Kamui/);
  });
});

describe('close-combat rebalance',()=>{
  it('a perfect parry damages boss guard without cancelling the entire string',()=>{
    const defender=guard();defender.chakra=20;
    const boss=new Combatant('zabuza',1600,true);boss.start(UNIVERSAL.light1,1000);
    const result=defender.receive(ordinary,1070);boss.deflected(result.attackerPosture,1070);
    expect(boss.stamina).toBe(72);expect(boss.action).not.toBeNull();expect(boss.hurtUntil).toBe(0);
    expect(defender.chakra).toBe(24);expect(defender.ultimate).toBe(12);
  });
  it('broken boss guard takes 60% extra damage and hits never extend its punish window',()=>{
    const boss=new Combatant('zabuza',1000,true);boss.exhaust(100,1000);
    const hit=boss.receive({...ordinary,damage:100},1100);expect(hit.damage).toBe(160);expect(boss.health).toBe(840);
    boss.exhaust(90,2000);expect(boss.guardBrokenUntil).toBe(2550);
    boss.update(3400,0);expect(boss.receive({...ordinary,damage:100},3401).damage).toBe(100);
  });
  it('armor preserves a committed boss attack, but ordinary recoveries can flinch without a stun lock',()=>{
    const boss=new Combatant('haku',1000,true);boss.start({...UNIVERSAL.heavy,events:[{at:800,kind:'hit',damage:20,red:true}]},0);
    boss.receive(ordinary,200);expect(boss.hurtUntil).toBe(0);expect(boss.action).not.toBeNull();
    boss.action=null;boss.receive(ordinary,900);expect(boss.hurtUntil).toBe(1050);
    boss.receive(ordinary,1200);expect(boss.hurtUntil).toBe(1050);
    boss.receive(ordinary,1600);expect(boss.hurtUntil).toBe(1050);
    boss.receive(ordinary,2100);expect(boss.hurtUntil).toBe(2250);
  });
  it('shurikens require four chakra, spending delays regen, and empty chakra leaves melee available',()=>{
    const player=new Combatant('naruto');player.chakra=4;expect(player.start(UNIVERSAL.tool,0)).toBe(true);expect(player.chakra).toBe(0);
    player.update(400,400);expect(player.start(UNIVERSAL.tool,400)).toBe(false);
    player.update(1399,999);expect(player.chakra).toBe(0);
    player.update(2400,1000);expect(player.chakra).toBeCloseTo(1.8);
    expect(player.start(UNIVERSAL.light1,2400)).toBe(true);
  });
  it('a deliberate early tap carries into the kick, then sweep, without overwriting the active strike',()=>{
    const p=new Combatant('kakashi');p.bufferMelee(0);p.consumeMelee(0);
    p.bufferMelee(180);expect(p.consumeMelee(180)).toBe(false);p.update(390,0);expect(p.consumeMelee(390)).toBe(true);
    expect(p.action?.definition.animation).toBe('light2');p.bufferMelee(610);p.update(815,0);p.consumeMelee(815);expect(p.action?.definition.animation).toBe('light3');
  });
});


describe('guard recovery resilience', () => {
  it('recovery prevents repeated guard breaks without preventing health damage', () => {
    const boss = new Combatant('zabuza', 1600, true); boss.exhaust(100, 0); boss.update(1550, 0);
    boss.exhaust(60, 1600); expect(boss.stamina).toBe(79);
    expect(boss.receive({damage: 40, posture: 10, red: false, fromX: 0}, 1610).damage).toBe(40);
    expect(boss.hurtUntil).toBe(0); expect(boss.guardBrokenUntil).toBe(0);
    boss.exhaust(80, 3400); expect(boss.guardBrokenUntil).toBeGreaterThan(3400);
  });
});
