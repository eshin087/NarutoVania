import {type AttackDefinition, type AttackEvent, Combatant} from './combat-core';
import type {StoryPhaseId} from './chapter';
export interface BossMove extends AttackDefinition {minRange: number; maxRange: number; weight: number; recovery: number; phase?: number; mist?: boolean; mirror?: boolean;}
const hit = (at: number, damage: number, range = 165, red = false): AttackEvent => ({at, kind: 'hit', damage, posture: red ? 40 : 21, range, height: red ? 170 : 110, red, effect: 'swing'});
const shot = (at: number, damage: number, effect: 'water' | 'ice', count = 1, red = false, speed = 440): AttackEvent => ({at, kind: 'projectile', damage, posture: 15, effect, count, red, speed});
function move(id: string, duration: number, stamina: number, events: AttackEvent[], options: Partial<BossMove> = {}): BossMove {
  return {id, action: 'boss', animation: 'light1', duration, cancelAt: duration, stamina, events,
    minRange: 0, maxRange: 230, weight: 1, recovery: 750, cooldown: 3500, ...options};
}
export const ZABUZA_MOVES: BossMove[] = [
  move('sword-string', 2150, 24, [hit(560, 9, 170), hit(1070, 10, 180), hit(1570, 13, 190)], {weight: 1.4, cooldown: 6800, move: 65}),
  move('delayed-cleave', 1810, 24, [hit(1030, 19, 205, true)], {animation: 'heavy', recovery: 1050, cooldown: 4800}),
  move('advancing-cut', 1440, 18, [hit(700, 13, 175)], {move: 330, maxRange: 570, minRange: 145, recovery: 850, cooldown: 4200}),
  move('sword-throw', 1550, 20, [shot(730, 13, 'ice', 1, false, 490)], {animation: 'cast', minRange: 210, maxRange: 1500, recovery: 850, cooldown: 6200}),
  move('water-bullets', 1880, 22, [shot(610, 9, 'water', 1), shot(1030, 9, 'water', 1)], {animation: 'cast', minRange: 170, maxRange: 1500, recovery: 760, cooldown: 6500}),
  move('water-clone', 1730, 23, [{at: 760, kind: 'technique', effect: 'water', damage: 12, posture: 22}], {animation: 'cast', maxRange: 1000, recovery: 1000, cooldown: 14000, phase: 1}),
  move('water-dragon', 2360, 32, [shot(1190, 22, 'water', 1, true, 405)], {animation: 'ultimate', minRange: 210, maxRange: 1500, recovery: 1250, cooldown: 10500, phase: 1}),
  move('great-waterfall', 2200, 30, [{at: 1130, kind: 'technique', effect: 'water', damage: 22, posture: 40, red: true}], {animation: 'ultimate', maxRange: 1500, recovery: 1200, cooldown: 12500, phase: 1}),
  move('silent-killing', 1740, 25, [hit(1030, 17, 220)], {animation: 'heavy', maxRange: 1500, recovery: 1100, cooldown: 10000, mist: true, phase: 1}),
  move('demon-of-the-mist', 3560, 44, [hit(650, 10, 180), shot(1250, 10, 'water'), hit(1920, 11, 195), hit(2790, 23, 250, true)], {animation: 'ultimate', maxRange: 900, recovery: 1550, cooldown: 22000, phase: 2, move: 100}),
];
export const HAKU_MOVES: BossMove[] = [
  move('senbon-fan', 1560, 17, [shot(620, 8, 'ice', 3, false, 440)], {animation: 'cast', maxRange: 1500, minRange: 155, recovery: 660, cooldown: 4200}),
  move('needle-string', 1810, 21, [hit(500, 8, 130), hit(920, 9, 145), hit(1370, 11, 160)], {weight: 1.4, maxRange: 190, recovery: 800, cooldown: 5700, move: 65}),
  move('water-needles', 2050, 24, [shot(780, 10, 'water', 3), shot(1250, 10, 'water', 2)], {animation: 'cast', maxRange: 1500, recovery: 800, cooldown: 8300}),
  move('counter-step', 1630, 18, [hit(920, 13, 160)], {animation: 'heavy', maxRange: 280, recovery: 940, cooldown: 5100, move: -80}),
  move('crimson-lunge', 1610, 25, [hit(880, 18, 155, true)], {animation: 'heavy', minRange: 150, maxRange: 710, recovery: 1040, cooldown: 6400, move: 410}),
  move('mirror-volley', 1890, 25, [shot(770, 9, 'ice', 3), shot(1230, 8, 'ice', 2)], {animation: 'cast', maxRange: 2000, mirror: true, phase: 1, recovery: 950, cooldown: 4900}),
  move('mirror-feint', 2040, 23, [shot(1170, 11, 'ice', 3)], {animation: 'cast', maxRange: 2000, mirror: true, phase: 1, recovery: 1040, cooldown: 6800}),
  move('ice-prison-rush', 4080, 46, [shot(700, 9, 'ice', 2), shot(1380, 9, 'ice', 2), shot(2060, 10, 'ice', 2), hit(3160, 23, 190, true)], {animation: 'ultimate', maxRange: 2000, mirror: true, phase: 2, recovery: 1600, cooldown: 23000}),
];
export class BossBrain {
  recent: string[] = []; readyAt = 1900; phase = 0; attacks = 0;
  constructor(public boss: Combatant, public story: StoryPhaseId, private random: () => number = Math.random) {}
  choose(now: number, distance: number, mirrors: boolean) {
    if (now < this.readyAt || !this.boss.canAct(now) || this.boss.guardBrokenUntil > now) return null;
    const health = this.boss.health / this.boss.maxHealth;
    this.phase = health < .36 ? 2 : mirrors || health < .73 || ['copy', 'lightning', 'seal'].includes(this.story) ? 1 : 0;
    const all = this.boss.id === 'haku' ? HAKU_MOVES : ZABUZA_MOVES;
    const eligible = all.filter(m => distance >= m.minRange && distance <= m.maxRange && (m.phase || 0) <= this.phase
      && m.stamina <= this.boss.stamina && (this.boss.cooldowns.get(m.id) || 0) <= now
      && (!m.mirror || mirrors)
      && !(this.story === 'rescue' && ['water-dragon', 'great-waterfall', 'demon-of-the-mist', 'water-clone'].includes(m.id)));
    const fresh = eligible.filter(m => !this.recent.slice(-3).includes(m.id));
    const pool = fresh.length ? fresh : eligible.filter(m => m.id !== this.recent.at(-1));
    if (!pool.length) return null;
    const total = pool.reduce((n, m) => n + m.weight, 0); let choice = this.random() * total;
    const selected = pool.find(m => (choice -= m.weight) <= 0) || pool[pool.length - 1];
    if (!this.boss.start(selected, now)) return null;
    this.recent.push(selected.id); if (this.recent.length > 5) this.recent.shift();
    this.attacks++; this.readyAt = now + selected.duration + selected.recovery;
    return selected;
  }
  stagger(now: number, duration = 1100) {this.readyAt = Math.max(this.readyAt, now + duration);}
}
export interface Mirror {x: number; y: number; hp: number; max: number; foreground: boolean; broken: boolean;}
export class MirrorFormation {
  mirrors: Mirror[] = []; occupied = -1; previous = -1; active = false;
  exposedUntil = 0; nextFormationAt = 0; transfers = 0;
  create(center: number, floor: number) {
    this.mirrors = [
      [-465, -68, false], [-340, -255, false], [-120, -358, false], [120, -358, false], [340, -255, false], [465, -68, false],
      [-365, 30, true], [365, 30, true],
    ].map(([x, y, foreground]) => ({x: center + Number(x), y: floor + Number(y), foreground: Boolean(foreground), hp: 130, max: 130, broken: false}));
    this.active = true; this.occupied = 0; this.previous = -1;
  }
  transfer(now: number, random: () => number = Math.random) {
    const candidates = this.mirrors.map((m, i) => ({m, i})).filter(({m, i}) => !m.broken && i !== this.occupied && !m.foreground);
    if (!candidates.length) return null;
    this.previous = this.occupied; this.occupied = candidates[Math.floor(random() * candidates.length)].i;
    this.exposedUntil = now + 2500; this.transfers++; return this.mirrors[this.occupied];
  }
  strike(index: number, damage: number, awakened: boolean, now: number) {
    const m = this.mirrors[index]; if (!m || m.broken || !this.active) return {interrupt: false, broken: false};
    const interrupt = index === this.occupied && now <= this.exposedUntil;
    if (awakened) {m.hp = Math.max(0, m.hp - damage); m.broken = m.hp === 0;}
    return {interrupt, broken: m.broken};
  }
  clear(now: number) {this.active = false; this.occupied = -1; this.nextFormationAt = now + 10500;}
  count() {return this.mirrors.filter(m => !m.broken).length;}
}
