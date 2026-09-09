import {
  Combatant,
  clamp,
  type AttackDefinition,
  type AttackEvent,
  type DefenseOutcome,
} from '../combat-core';
export type Phase = 'shield' | 'speed' | 'gates';
export const PHASES: Phase[] = ['shield', 'speed', 'gates'];
export const PHASE_INFO = {
  shield: { title: 'The Shield of Sand', health: 3000, speed: 390 },
  speed: { title: 'Weights Released', health: 3900, speed: 460 },
  gates: { title: 'The Fifth Gate', health: 4600, speed: 500 },
};
export const FLOOR = 586,
  LEFT = 90,
  RIGHT = 1190;
export const LEE_SKILLS: Record<string, AttackDefinition> = {
  skill1: {
    id: 'hurricane',
    action: 'skill1',
    animation: 'light3',
    duration: 650,
    cancelAt: 480,
    stamina: 18,
    move: 430,
    cooldown: 3400,
    events: [
      { at: 180, kind: 'effect', effect: 'swing' },
      {
        at: 290,
        kind: 'hit',
        damage: 68,
        posture: 22,
        range: 155,
        height: 135,
      },
    ],
  },
  skill2: {
    id: 'rising-wind',
    action: 'skill2',
    animation: 'aerial',
    duration: 720,
    cancelAt: 490,
    stamina: 24,
    cooldown: 5200,
    events: [
      {
        at: 250,
        kind: 'hit',
        damage: 84,
        posture: 34,
        range: 138,
        height: 210,
      },
    ],
  },
  tool: {
    id: 'palm',
    action: 'tool',
    animation: 'light1',
    duration: 300,
    cancelAt: 215,
    stamina: 6,
    cooldown: 480,
    events: [
      {
        at: 125,
        kind: 'hit',
        damage: 23,
        posture: 12,
        range: 106,
        height: 110,
      },
    ],
  },
  substitute: {
    id: 'backstep',
    action: 'substitute',
    animation: 'dash',
    duration: 310,
    cancelAt: 310,
    stamina: 20,
    move: -620,
    invulnerable: 170,
    cooldown: 2200,
    events: [{ at: 0, kind: 'effect', effect: 'dash' }],
  },
};
export interface SandShot {
  id: number;
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  vx: number;
  vy: number;
  radius: number;
  born: number;
  kind: 'pellet' | 'hand' | 'spike';
  damage: number;
  red: boolean;
  returned: boolean;
  volley: number;
}
export interface Zone {
  x: number;
  width: number;
  warnAt: number;
  hitAt: number;
  end: number;
  hit: boolean;
}
export type MoveId = 'hand' | 'fan' | 'sweep' | 'coffin' | 'storm' | 'walls';
export interface Move {
  id: MoveId;
  name: string;
  start: number;
  windup: number;
  end: number;
  recovery: number;
  target: number;
  emitted: number;
  serial: number;
  gap: number;
}
export interface CombatCue {
  kind:
    | 'hit'
    | 'armor'
    | 'parry'
    | 'block'
    | 'break'
    | 'cast'
    | 'impact'
    | 'step';
  x: number;
  y: number;
  at: number;
}
export function segmentHits(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  let lo = 0,
    hi = 1;
  const dx = x2 - x1,
    dy = y2 - y1;
  for (const [p, q] of [
    [-dx, x1 - x],
    [dx, x + w - x1],
    [-dy, y1 - y],
    [dy, y + h - y1],
  ]) {
    if (Math.abs(p) < 1e-8) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) lo = Math.max(lo, r);
      else hi = Math.min(hi, r);
      if (lo > hi) return false;
    }
  }
  return true;
}
/** Exclude complete damaging cores plus player half-width, not just projectile centers. */
export function curtainOrigins(gap: number, width = 240) {
  return Array.from({ length: 14 }, (_, i) => 110 + i * 81).filter(
    (x) => Math.abs(x - gap) > width / 2 + 35,
  );
}
export class Duel {
  lee = new Combatant<'lee'>('lee');
  gaara = new Combatant<'gaara'>('gaara', 1800, true);
  now = 0;
  elapsed = 0;
  phase: Phase = 'shield';
  phaseTime = 0;
  vx = 0;
  vy = 0;
  move: Move | null = null;
  nextMove = 1500;
  lastMajor = -20000;
  ordinary = 0;
  lastMove: MoveId = 'coffin';
  lastMajorId: MoveId = 'walls';
  attackGeneration = 0;
  shots: SandShot[] = [];
  zones: Zone[] = [];
  cues: CombatCue[] = [];
  serial = 0;
  seed = 23;
  parries = 0;
  ultimates = 0;
  comboHits = 0;
  bossHits = 0;
  constructor(phase: Phase = 'shield') {
    this.reset(phase);
  }
  reset(phase: Phase) {
    this.phase = phase;
    this.lee = new Combatant('lee');
    this.gaara = new Combatant('gaara', PHASE_INFO[phase].health, true);
    this.lee.ultimate = 100;
    this.lee.x = 350;
    this.gaara.x = 940;
    this.lee.y = this.gaara.y = FLOOR;
    this.lee.facing = 1;
    this.gaara.facing = -1;
    this.move = null;
    this.nextMove = this.now + 1800;
    this.lastMajor = this.now;
    this.ordinary = 0;
    this.phaseTime = 0;
    this.shots = [];
    this.zones = [];
    this.vx = this.vy = 0;
  }
  random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  cue(kind: CombatCue['kind'], x: number, y: number) {
    this.cues.push({ kind, x, y, at: this.now });
    if (this.cues.length > 64) this.cues.shift();
  }
  get exposed() {
    return (
      this.now < this.gaara.guardBrokenUntil ||
      (!!this.move && this.now - this.move.start >= this.move.recovery)
    );
  }
  get red() {
    return (
      !!this.move &&
      ['sweep', 'coffin', 'walls'].includes(this.move.id) &&
      this.now - this.move.start < this.move.recovery
    );
  }
  hitGaara(damage: number, posture: number, ultimate = false) {
    const wasBroken = this.now < this.gaara.guardBrokenUntil;
    const armor = this.exposed ? 1 : 0.3;
    const outcome = this.gaara.receive(
      {
        damage: damage * (ultimate ? 1 : armor),
        posture,
        red: false,
        fromX: this.lee.x,
      },
      this.now,
    );
    if (outcome.damage) {
      this.gaara.exhaust(posture, this.now);
      if (!ultimate)
        this.lee.ultimate = Math.min(
          100,
          this.lee.ultimate + outcome.damage * 0.22,
        );
      this.comboHits++;
      this.cue(
        armor === 1 || ultimate ? 'hit' : 'armor',
        this.gaara.x,
        this.gaara.y - 76,
      );
    }
    if (!wasBroken && this.now < this.gaara.guardBrokenUntil) {
      this.cancelAttack();
      this.cue('break', this.gaara.x, this.gaara.y - 90);
    }
    return outcome.damage;
  }
  hitLee(
    damage: number,
    posture: number,
    red: boolean,
    fromX: number,
    projectile = false,
  ): DefenseOutcome {
    const out = this.lee.receive(
      { damage, posture, red, fromX, projectile },
      this.now,
    );
    if (out.result === 'parry') {
      this.gaara.deflected(out.attackerPosture, this.now);
      this.parries++;
      this.cue('parry', this.lee.x, this.lee.y - 70);
      if (this.now < this.gaara.guardBrokenUntil) this.cancelAttack();
    } else if (out.result === 'block')
      this.cue('block', this.lee.x, this.lee.y - 70);
    else if (out.damage) {
      this.bossHits++;
      this.cue(
        out.result === 'guardbreak' ? 'break' : 'hit',
        this.lee.x,
        this.lee.y - 70,
      );
    }
    return out;
  }
  cancelAttack() {
    this.attackGeneration++;
    this.move = null;
    this.zones = [];
    this.shots = [];
    this.nextMove = this.now + 1800;
  }
  chooseMove() {
    const canMajor =
      this.phaseTime > 10000 &&
      this.now - this.lastMajor >= 14000 &&
      this.ordinary >= 2;
    const list: MoveId[] = canMajor
      ? [this.lastMajorId === 'storm' ? 'walls' : 'storm']
      : Math.abs(this.lee.x - this.gaara.x) < 220
        ? ['hand', 'sweep', 'coffin']
        : ['fan', 'hand', 'coffin'];
    const choices = list.filter((m) => m !== this.lastMove);
    const id = (choices.length ? choices : list)[
      Math.floor(this.random() * (choices.length || list.length))
    ];
    this.lastMove = id;
    const data = {
      hand: ['Sand Hand', 650, 1900, 1100],
      fan: ['Sand Shuriken', 700, 2900, 1950],
      sweep: ['Sand Wave', 850, 2250, 1300],
      coffin: ['Sand Coffin', 1050, 2450, 1450],
      storm: ['Sandstorm', 950, 6700, 5700],
      walls: ['Sand Burial', 1000, 6600, 5600],
    }[id] as [string, number, number, number];
    this.move = {
      id,
      name: data[0],
      start: this.now,
      windup: data[1],
      end: this.now + data[2],
      recovery: data[3],
      target: this.lee.x,
      emitted: 0,
      serial: ++this.serial,
      gap: clamp(this.lee.x, 280, 1000),
    };
    this.gaara.spend(canMajor ? 25 : 12, this.now);
    this.gaara.facing = this.lee.x < this.gaara.x ? -1 : 1;
    if (canMajor) {
      this.lastMajorId = id;
      this.lastMajor = this.now;
      this.ordinary = 0;
    } else this.ordinary++;
    if (id === 'coffin' || id === 'sweep')
      this.zones.push({
        x:
          id === 'coffin' ? this.lee.x : this.gaara.x + this.gaara.facing * 170,
        width: id === 'coffin' ? 155 : 260,
        warnAt: this.now,
        hitAt: this.now + data[1],
        end: this.now + data[1] + 420,
        hit: false,
      });
  }
  spawn(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    kind: SandShot['kind'],
    volley: number,
    offset = 0,
  ) {
    if (this.shots.length >= 48) return;
    const a = Math.atan2(targetY - y, targetX - x) + offset;
    const speed =
      kind === 'hand' ? 600 : 620 + (this.phase === 'gates' ? 80 : 0);
    this.shots.push({
      id: ++this.serial,
      x,
      y,
      oldX: x,
      oldY: y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      radius: kind === 'hand' ? 25 : 9,
      born: this.now,
      kind,
      damage: kind === 'hand' ? 10 : 5,
      red: false,
      returned: false,
      volley,
    });
  }
  updateBoss(dt: number) {
    if (
      this.gaara.health <= 0 ||
      this.now < this.gaara.guardBrokenUntil ||
      this.now < this.gaara.hurtUntil
    )
      return;
    if (!this.move) {
      if (this.now >= this.nextMove) this.chooseMove();
      return;
    }
    const m = this.move,
      age = this.now - m.start;
    const handX = this.gaara.x + this.gaara.facing * 48,
      handY = this.gaara.y - 92;
    if (m.id === 'hand' && age >= m.windup && !m.emitted) {
      m.emitted++;
      this.spawn(handX, handY, this.lee.x, this.lee.y - 65, 'hand', m.serial);
      this.cue('cast', handX, handY);
    }
    if (
      m.id === 'fan' &&
      m.emitted < (this.phase === 'shield' ? 2 : 3) &&
      age >= m.windup + m.emitted * 500
    ) {
      m.emitted++;
      for (const offset of this.phase === 'gates'
        ? [-0.3, -0.15, 0, 0.15, 0.3]
        : [-0.2, 0, 0.2])
        this.spawn(
          handX,
          handY,
          this.lee.x,
          this.lee.y - 64,
          'pellet',
          m.serial,
          offset,
        );
      this.cue('cast', handX, handY);
    }
    if (
      m.id === 'storm' &&
      m.emitted < 5 &&
      age >= m.windup + m.emitted * 900
    ) {
      const nextGap = clamp(m.gap + (m.emitted % 2 ? 160 : -160), 280, 1000);
      m.gap = nextGap;
      m.emitted++;
      // Every curtain uses parallel trajectories. Its broad lane shifts only 160px in 900ms.
      for (const x of curtainOrigins(nextGap, 260))
        this.spawn(x, 150, x, FLOOR + 80, 'pellet', m.serial + m.emitted);
      this.cue('cast', 640, 180);
    }
    if (
      m.id === 'walls' &&
      m.emitted < 4 &&
      age >= m.windup - 700 + m.emitted * 1200
    ) {
      m.emitted++;
      m.gap = clamp(m.gap + (m.emitted % 2 ? 170 : -170), 280, 1000);
      for (const x of [160, 350, 540, 730, 920, 1110])
        if (Math.abs(x - m.gap) > 230)
          this.zones.push({
            x,
            width: 100,
            warnAt: this.now,
            hitAt: this.now + 750,
            end: this.now + 1120,
            hit: false,
          });
      this.cue('cast', this.gaara.x, FLOOR);
    }
    if (age >= m.recovery && Math.abs(this.lee.x - this.gaara.x) < 95) {
      this.gaara.x = clamp(
        this.gaara.x + (this.gaara.x > 640 ? -1 : 1) * ((dt / 1000) * 15),
        LEFT + 40,
        RIGHT - 40,
      );
    }
    if (this.now >= m.end) {
      this.move = null;
      this.nextMove = this.now + 350;
    }
  }
  updateProjectiles(dt: number) {
    const remaining: SandShot[] = [];
    const generation = this.attackGeneration;
    for (const p of this.shots) {
      if (generation !== this.attackGeneration) break;
      p.oldX = p.x;
      p.oldY = p.y;
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      if (p.returned) {
        if (
          segmentHits(
            p.oldX,
            p.oldY,
            p.x,
            p.y,
            this.gaara.x - 28,
            FLOOR - 130,
            56,
            130,
          )
        ) {
          this.hitGaara(35, 16);
          this.cue('impact', p.x, p.y);
          continue;
        }
      } else {
        const h = this.lee.action?.definition.action === 'slide' ? 28 : 106;
        if (
          segmentHits(
            p.oldX,
            p.oldY,
            p.x,
            p.y,
            this.lee.x - 23 - p.radius,
            this.lee.y - h - p.radius,
            46 + p.radius * 2,
            h + p.radius * 2,
          )
        ) {
          const out = this.hitLee(p.damage, 14, p.red, p.oldX, true);
          if (generation !== this.attackGeneration) break;
          if (out.result === 'parry') {
            p.returned = true;
            const a = Math.atan2(FLOOR - 75 - p.y, this.gaara.x - p.x);
            p.vx = Math.cos(a) * 850;
            p.vy = Math.sin(a) * 850;
            remaining.push(p);
            continue;
          }
          if (out.result !== 'immune') {
            this.cue('impact', p.x, p.y);
            continue;
          }
        }
      }
      if (p.y >= FLOOR + 15) {
        this.cue('impact', p.x, FLOOR);
        continue;
      }
      if (p.x < -140 || p.x > 1420 || p.y < -160 || this.now - p.born > 10000)
        continue;
      remaining.push(p);
    }
    // A guard break can cancel the source while processing a deflection.
    this.shots = this.now < this.gaara.guardBrokenUntil ? [] : remaining;
    for (const z of this.zones) {
      if (!z.hit && this.now >= z.hitAt) {
        z.hit = true;
        this.cue('impact', z.x, FLOOR);
        if (
          Math.abs(this.lee.x - z.x) < z.width / 2 + 23 &&
          this.lee.y > FLOOR - 120
        )
          this.hitLee(10, 30, true, z.x);
      }
    }
    this.zones = this.zones.filter((z) => this.now < z.end);
  }
  update(dt: number) {
    this.now += dt;
    this.elapsed += dt;
    this.phaseTime += dt;
    this.cues = this.cues.filter((c) => this.now - c.at < 500);
    const hits = this.lee.update(this.now, dt);
    this.gaara.update(this.now, dt);
    for (const { event, charge } of hits) this.playerEvent(event, charge);
    this.updateBoss(dt);
    this.updateProjectiles(dt);
  }
  playerEvent(e: AttackEvent, charge: number) {
    if (e.kind === 'effect') {
      this.cue('step', this.lee.x, this.lee.y - 55);
      return;
    }
    if (
      e.kind === 'hit' &&
      Math.abs(this.gaara.x - this.lee.x) < (e.range || 100) &&
      Math.abs(this.gaara.y - this.lee.y) < (e.height || 100) &&
      (this.gaara.x - this.lee.x) * this.lee.facing >= -25
    )
      this.hitGaara(
        (e.damage || 0) * charge * (this.phase === 'gates' ? 1.3 : 1),
        e.posture || 8,
      );
  }
  ultimateImpact() {
    this.ultimates++;
    return this.hitGaara(this.phase === 'gates' ? 390 : 310, 45, true);
  }
}
