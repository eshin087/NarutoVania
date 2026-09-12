import {
  Combatant,
  clamp,
  type AttackDefinition,
  type AttackEvent,
  type DefenseOutcome,
} from '../combat-core';
import { planSandVolley } from './sand-fairness';
import { traceSandFlight } from './sand-flight';
export type Phase = 'shield' | 'speed' | 'gates';
export const PHASES: Phase[] = ['shield', 'speed', 'gates'];
export const GAARA_HEALTH = 6000;
export const PHASE_INFO = {
  shield: { title: 'The Shield of Sand', health: GAARA_HEALTH, speed: 390 },
  speed: { title: 'Weights Released', health: GAARA_HEALTH * 0.7, speed: 460 },
  gates: { title: 'The Fifth Gate', health: GAARA_HEALTH * 0.35, speed: 500 },
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
  bounces?: number;
  bounceWait?: number;
  expiresAt?: number;
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
  variant: number;
  retryAt: number;
  retries: number;
}
export interface CombatCue {
  id: number;
  kind:
    | 'hit'
    | 'armor'
    | 'parry'
    | 'block'
    | 'break'
    | 'cast'
    | 'impact'
    | 'bounce'
    | 'tell'
    | 'step';
  x: number;
  y: number;
  at: number;
  defender?: 'lee' | 'gaara';
  damage?: number;
}
/** Approach only until a planted kick can connect; never cross through the opponent. */
export function hurricaneVelocity(
  x: number,
  targetX: number,
  facing: number,
  age: number,
  dt: number,
) {
  if (age >= 290) return 0;
  const remaining = (targetX - x) * facing - 66;
  return (
    facing * Math.min(430, Math.max(0, remaining) / Math.max(0.001, dt / 1000))
  );
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
  punishUntil = 0;
  parriedVolleys = new Map<number, number>();
  returnedVolleys = new Set<number>();
  constructor(phase: Phase = 'shield') {
    this.reset(phase);
  }
  reset(phase: Phase) {
    this.phase = phase;
    this.lee = new Combatant('lee');
    this.gaara = new Combatant('gaara', GAARA_HEALTH, true);
    this.gaara.health = PHASE_INFO[phase].health;
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
    this.cues = [];
    this.punishUntil = 0;
    this.parriedVolleys.clear();
    this.returnedVolleys.clear();
  }
  get pendingStory(): 'weights' | 'gates' | 'ending' | null {
    if (this.phase === 'shield' && this.gaara.health <= PHASE_INFO.speed.health)
      return 'weights';
    if (this.phase === 'speed' && this.gaara.health <= PHASE_INFO.gates.health)
      return 'gates';
    return this.phase === 'gates' && this.gaara.health <= 0 ? 'ending' : null;
  }
  /** Same duel and health pool. A power-up clears actions, not accumulated damage. */
  advancePower(phase: Phase) {
    if (phase === this.phase) return;
    this.phase = phase;
    this.phaseTime = 0;
    this.cancelAttack();
    this.lastMajor = this.now;
    this.ordinary = 0;
    for (const fighter of [this.lee, this.gaara]) {
      fighter.action = null;
      fighter.guard = false;
      fighter.chargeStarted = null;
      fighter.hurtUntil = fighter.guardBrokenUntil = 0;
      fighter.stamina = 100;
      fighter.grounded = true;
      fighter.airDashUsed = false;
    }
    // Keep the established ready-Lotus reward, while carrying Lee's injuries forward.
    this.lee.health = Math.min(100, this.lee.health + 20);
    this.lee.ultimate = 100;
    this.lee.immuneUntil = this.now + 650;
    this.cues = [];
  }
  random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  cue(
    kind: CombatCue['kind'],
    x: number,
    y: number,
    defender?: CombatCue['defender'],
    damage?: number,
  ) {
    this.cues.push({
      id: ++this.serial,
      kind,
      x,
      y,
      at: this.now,
      defender,
      damage,
    });
    if (this.cues.length > 64) this.cues.shift();
  }
  get exposed() {
    return (
      this.now < this.gaara.guardBrokenUntil ||
      this.now < this.punishUntil ||
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
    // Cinematic contact owns one hit; combat-time immunity must not freeze through it.
    if (ultimate)
      this.gaara.immuneUntil = Math.min(this.gaara.immuneUntil, this.now);
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
        'gaara',
        outcome.damage,
      );
    }
    if (!wasBroken && this.now < this.gaara.guardBrokenUntil) {
      this.cancelAttack();
      this.cue('break', this.gaara.x, this.gaara.y - 90, 'gaara');
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
      this.cue('parry', this.lee.x, this.lee.y - 70, 'lee');
      if (this.now < this.gaara.guardBrokenUntil) this.cancelAttack();
    } else if (out.result === 'block')
      this.cue('block', this.lee.x, this.lee.y - 70, 'lee');
    else if (out.damage) {
      this.bossHits++;
      this.cue(
        out.result === 'guardbreak' ? 'break' : 'hit',
        this.lee.x,
        this.lee.y - 70,
        'lee',
        out.damage,
      );
    }
    return out;
  }
  cancelAttack() {
    this.attackGeneration++;
    this.move = null;
    this.zones = [];
    this.shots = [];
    this.parriedVolleys.clear();
    this.returnedVolleys.clear();
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
      hand: ['Sand Hand', 780, 2050, 1200],
      fan: ['Sand Shuriken', 850, 3400, 2450],
      sweep: ['Sand Wave', 850, 2250, 1300],
      coffin: ['Sand Coffin', 1050, 2450, 1450],
      storm: ['Sand Shower', 1100, 7200, 6200],
      walls: ['Sand Coffin · Pursuit', 1100, 7000, 6000],
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
      variant: this.random() < 0.5 ? 0 : 1,
      retryAt: 0,
      retries: 0,
    };
    this.gaara.spend(canMajor ? 25 : 12, this.now);
    this.gaara.facing = this.lee.x < this.gaara.x ? -1 : 1;
    this.cue('tell', this.gaara.x + this.gaara.facing * 42, this.gaara.y - 96);
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
    this.shots.push({
      ...this.makeShot(x, y, targetX, targetY, kind, volley, offset),
      id: ++this.serial,
    });
  }
  makeShot(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    kind: SandShot['kind'],
    volley: number,
    offset = 0,
  ): SandShot {
    const a = Math.atan2(targetY - y, targetX - x) + offset;
    const speed =
      kind === 'hand' ? 560 : 520 + (this.phase === 'gates' ? 50 : 0);
    return {
      id: 0,
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
    };
  }
  releaseBarrage(proposed: SandShot[], m: Move) {
    const action = this.lee.action;
    const lockMs = Math.max(
      0,
      this.lee.hurtUntil - this.now,
      this.lee.guardBrokenUntil - this.now,
      action ? action.started + action.definition.duration - this.now : 0,
    );
    const plan = planSandVolley({
      player: {
        x: clamp(this.lee.x, LEFT, RIGHT),
        speed: PHASE_INFO[this.phase].speed,
        lockMs,
      },
      desiredGap: m.gap + (m.emitted % 2 ? 120 : -120),
      proposed,
      existing: this.shots.filter((p) => !p.returned),
      zones: this.zones.filter((z) => !z.hit),
      now: this.now,
    });
    if (!plan) {
      if (++m.retries <= 4) {
        m.retryAt = this.now + 120;
        return false;
      }
      m.retries = 0;
      m.retryAt = 0;
      return true; // Omit an unsafe future volley, never erase an existing one.
    }
    m.gap = plan.gap;
    m.retries = 0;
    m.retryAt = 0;
    const allowance = Math.max(0, 48 - this.shots.length);
    const ids = plan.retainedIndices;
    const retained =
      ids.length <= allowance
        ? ids
        : Array.from(
            { length: allowance },
            (_, i) => ids[Math.floor((i * ids.length) / allowance)],
          );
    for (const index of retained)
      this.shots.push({ ...proposed[index], id: ++this.serial });
    if (retained.length)
      this.cue('cast', this.gaara.x + this.gaara.facing * 38, FLOOR - 100);
    return true;
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
      this.spawn(handX, handY, m.target, FLOOR - 65, 'hand', m.serial);
      this.cue('cast', handX, handY);
    }
    if (m.id === 'fan' && m.emitted < 3 && age >= m.windup + m.emitted * 650) {
      m.emitted++;
      for (const offset of [-0.36, -0.18, 0, 0.18, 0.36])
        this.spawn(
          handX,
          handY,
          m.target,
          FLOOR - 64,
          'pellet',
          m.serial * 100 + m.emitted,
          offset,
        );
      this.cue('cast', handX, handY);
      // Subsequent releases commit their next target one visible beat in advance.
      m.target = this.lee.x;
    }
    if (
      m.id === 'storm' &&
      m.emitted < 7 &&
      this.now >= m.retryAt &&
      age >= m.windup + m.emitted * 780
    ) {
      const volley = m.serial * 100 + m.emitted + 1;
      const drift = m.variant
        ? m.emitted % 2
          ? 210
          : -210
        : m.emitted % 2
          ? 50
          : -50;
      const shots = Array.from({ length: 15 }, (_, i) => {
        const x = 110 + i * 76;
        const shot = this.makeShot(
          x,
          175,
          x + drift,
          FLOOR + 80,
          m.variant ? 'spike' : 'pellet',
          volley,
        );
        if (m.variant && i % 2 === 0) {
          shot.bounces = 1;
          shot.expiresAt = this.now + 1800;
        }
        return shot;
      });
      if (this.releaseBarrage(shots, m)) m.emitted++;
    }
    if (
      m.id === 'walls' &&
      m.emitted < 4 &&
      age >= m.windup - 950 + m.emitted * 1400
    ) {
      m.emitted++;
      m.gap = clamp(m.gap + (m.emitted % 2 ? 170 : -170), 280, 1000);
      for (const x of [160, 350, 540, 730, 920, 1110])
        if (Math.abs(x - m.gap) > 230)
          this.zones.push({
            x,
            width: 100,
            warnAt: this.now,
            hitAt: this.now + 950,
            end: this.now + 1320,
            hit: false,
          });
      this.cue('cast', this.gaara.x, FLOOR);
      // A later diagonal shower adds pressure only if the existing floor zones leave a route.
      const shots = Array.from({ length: 12 }, (_, i) => {
        const x = 125 + i * 93;
        return this.makeShot(
          x,
          165,
          x + (m.variant ? -90 : 90),
          FLOOR + 80,
          'spike',
          m.serial * 100 + m.emitted,
        );
      });
      this.releaseBarrage(shots, m);
    }
    if (age >= m.recovery && Math.abs(this.lee.x - this.gaara.x) < 95) {
      this.gaara.x = clamp(
        this.gaara.x + (this.gaara.x > 640 ? -1 : 1) * ((dt / 1000) * 15),
        LEFT + 40,
        RIGHT - 40,
      );
    }
    if (this.now >= m.end) {
      this.punishUntil = this.now + 350;
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
      const span = Math.min(
        dt,
        Math.max(0, (p.expiresAt ?? Infinity) - (this.now - dt)),
      );
      const flight = traceSandFlight(p, span, FLOOR - 18);
      const paths = flight.segments.filter((s) => s.damaging);
      p.x = flight.x;
      p.y = flight.y;
      p.vx = flight.vx;
      p.vy = flight.vy;
      p.bounces = flight.bounces;
      p.bounceWait = flight.bounceWait;
      if (flight.bounced) this.cue('bounce', flight.x, FLOOR - 18);
      if (p.returned) {
        if (
          paths.some((s) =>
            segmentHits(
              s.x1,
              s.y1,
              s.x2,
              s.y2,
              this.gaara.x - 28,
              FLOOR - 130,
              56,
              130,
            ),
          )
        ) {
          if (!this.returnedVolleys.has(p.volley)) {
            this.returnedVolleys.add(p.volley);
            this.hitGaara(35, 16);
          }
          this.cue('impact', p.x, p.y);
          continue;
        }
      } else {
        const h = this.lee.action?.definition.action === 'slide' ? 28 : 106;
        if (
          paths.some((s) =>
            segmentHits(
              s.x1,
              s.y1,
              s.x2,
              s.y2,
              this.lee.x - 23 - p.radius,
              this.lee.y - h - p.radius,
              46 + p.radius * 2,
              h + p.radius * 2,
            ),
          )
        ) {
          // A tightly grouped volley is one deliberate deflection beat, not five stamina charges.
          const grouped =
            !p.red &&
            this.lee.guard &&
            this.lee.stamina > 0 &&
            this.now <= (this.parriedVolleys.get(p.volley) ?? -1);
          const fromX =
            Math.abs(p.vy) > Math.abs(p.vx) * 1.5
              ? this.lee.x + this.lee.facing * 50
              : p.oldX;
          const out = grouped
            ? { result: 'parry' as const, damage: 0, attackerPosture: 0 }
            : this.hitLee(p.damage, 14, p.red, fromX, true);
          if (generation !== this.attackGeneration) break;
          if (out.result === 'parry') {
            if (!grouped) this.parriedVolleys.set(p.volley, this.now + 70);
            p.returned = true;
            p.bounces = 0;
            p.bounceWait = 0;
            p.expiresAt = this.now + 4000;
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
      if (flight.grounded) {
        this.cue('impact', p.x, FLOOR);
        continue;
      }
      if (
        p.x < -140 ||
        p.x > 1420 ||
        p.y < -160 ||
        this.now - p.born > 10000 ||
        this.now >= (p.expiresAt ?? Infinity)
      )
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
    for (const [volley, until] of this.parriedVolleys)
      if (this.now > until) this.parriedVolleys.delete(volley);
    const liveVolleys = new Set(this.shots.map((p) => p.volley));
    for (const volley of this.returnedVolleys)
      if (!liveVolleys.has(volley)) this.returnedVolleys.delete(volley);
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
