/** Deterministic combat rules. Time is encounter time in milliseconds, never wall time. */
export type CharacterId = 'kakashi' | 'naruto' | 'sasuke' | 'sakura' | 'zabuza' | 'haku';
export type PlayerId = Exclude<CharacterId, 'zabuza' | 'haku'>;
export type Facing = -1 | 1;
export type CombatAction = 'light1' | 'light2' | 'light3' | 'heavy' | 'aerial' | 'tool' | 'skill1' | 'skill2' | 'ultimate' | 'dash' | 'airdash' | 'slide' | 'substitute' | 'boss';
export type AnimationName = 'idle' | 'run' | 'jump' | 'land' | 'dash' | 'airdash' | 'slide' | 'block' | 'parry' | 'guardbreak' | 'hurt' | 'defeat' | 'light1' | 'light2' | 'light3' | 'heavy' | 'cast' | 'ultimate';
export type EffectName = 'swing' | 'impact' | 'parry' | 'guard' | 'break' | 'dash' | 'water' | 'ice' | 'fire' | 'lightning' | 'smoke' | 'warning' | 'step';
export interface AttackEvent {
  at: number;
  kind: 'hit' | 'projectile' | 'effect' | 'technique' | 'step';
  damage?: number;
  posture?: number;
  range?: number;
  height?: number;
  red?: boolean;
  effect?: EffectName;
  speed?: number;
  count?: number;
  angle?: number;
}
export interface AttackDefinition {
  id: string;
  action: CombatAction;
  animation: AnimationName;
  duration: number;
  cancelAt: number;
  stamina: number;
  chakra?: number;
  ultimate?: number;
  move?: number;
  invulnerable?: number;
  cooldown?: number;
  events: AttackEvent[];
}
export const COMBAT = {
  enemyDamage: .5,
  stamina: 100, staminaRegen: 35, regenDelay: 650, parryWindow: 140, parryRearm: 300,
  parryRestore: 10, parryPosture: 32, guardBreak: 800, bossBreak: 2400, breakDamage: 1.75,
  chakraRegen: 1.8, chakraDelay: 1400, meleeChakra: 2, parryChakra: 4,
  inputBuffer: 240, damageImmunity: 650, speed: 315, guardSpeed: 100,
  jump: 840, gravity: 1800, coyote: 100, jumpBuffer: 130,
} as const;
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const defensive = (action: CombatAction) => ['dash', 'airdash', 'slide', 'substitute'].includes(action);
const strike = (index: number): AttackDefinition => ({
  id: `light${index}`, action: `light${index}` as CombatAction, animation: `light${index}` as AnimationName,
  duration: [0, 390, 425, 520][index], cancelAt: [0, 280, 310, 390][index],
  stamina: [0, 5, 6, 8][index], move: [0, 100, 125, 150][index],
  events: [{at: [0, 130, 150, 205][index], kind: 'effect', effect: 'swing'},
    {at: [0, 170, 195, 245][index], kind: 'hit', damage: [0, 24, 30, 42][index], posture: [0, 10, 14, 21][index], range: [0, 100, 122, 140][index], height: 100}],
});
export const UNIVERSAL: Record<string, AttackDefinition> = {
  light1: strike(1), light2: strike(2), light3: strike(3),
  heavy: {id: 'heavy', action: 'heavy', animation: 'heavy', duration: 770, cancelAt: 570, stamina: 18, move: 95,
    events: [{at: 270, kind: 'effect', effect: 'swing'}, {at: 355, kind: 'hit', damage: 62, posture: 38, range: 150, height: 115}]},
  aerial: {id: 'aerial', action: 'aerial', animation: 'light2', duration: 430, cancelAt: 300, stamina: 7, move: 55,
    events: [{at: 145, kind: 'hit', damage: 32, posture: 14, range: 125, height: 135}]},
  tool: {id: 'tool', action: 'tool', animation: 'cast', duration: 350, cancelAt: 255, stamina: 3, chakra: 4, cooldown: 390,
    events: [{at: 125, kind: 'projectile', damage: 16, posture: 4, speed: 770, effect: 'swing'}]},
  dash: {id: 'dash', action: 'dash', animation: 'dash', duration: 220, cancelAt: 220, stamina: 22, move: 820, invulnerable: 140, events: [{at: 0, kind: 'effect', effect: 'dash'}]},
  airdash: {id: 'airdash', action: 'airdash', animation: 'airdash', duration: 220, cancelAt: 220, stamina: 25, move: 740, invulnerable: 120, events: [{at: 0, kind: 'effect', effect: 'dash'}]},
  slide: {id: 'slide', action: 'slide', animation: 'slide', duration: 350, cancelAt: 280, stamina: 15, move: 690, events: [{at: 0, kind: 'effect', effect: 'dash'}]},
  substitute: {id: 'substitute', action: 'substitute', animation: 'cast', duration: 340, cancelAt: 270, stamina: 10, chakra: 25, invulnerable: 390, cooldown: 4200,
    events: [{at: 0, kind: 'technique', effect: 'smoke'}]},
};
export interface ScheduledAction {definition: AttackDefinition; started: number; serial: number; emitted: Set<number>; charge: number; facing: Facing;}
export interface IncomingHit {damage: number; posture: number; red: boolean; fromX: number; projectile?: boolean;}
export type DefenseResult = 'immune' | 'parry' | 'block' | 'guardbreak' | 'damage';
export interface DefenseOutcome {result: DefenseResult; damage: number; attackerPosture: number;}

export class Combatant {
  health: number; stamina = 100; chakra = 100; ultimate = 0;
  x = 0; y = 0; facing: Facing = 1; grounded = true; airDashUsed = false;
  guard = false; guardBrokenUntil = 0; immuneUntil = 0; hurtUntil = 0;
  parryAt = -Infinity; lastParryPress = -Infinity; parryReleased = true; deflectUntil = 0;
  lastSpend = -Infinity; action: ScheduledAction | null = null; serial = 0;
  lastChakraSpend = -Infinity; lastStagger = -Infinity; damagedAt = -Infinity; postureHitAt = -Infinity;
  cooldowns = new Map<string, number>(); hitTargets = new Set<string>();
  meleeBufferedAt = -Infinity; combo = 0; comboExpires = 0; chargeStarted: number | null = null;
  lastActionEnded: AttackDefinition | null = null;
  constructor(public id: CharacterId, public maxHealth = 100, public isBoss = false) {this.health = maxHealth;}
  spend(amount: number, now: number) {
    if (this.stamina + 1e-7 < amount) return false;
    this.stamina = Math.max(0, this.stamina - amount); this.lastSpend = now; return true;
  }
  canAct(now: number, defense = false) {
    if (this.health <= 0 || now < this.guardBrokenUntil || now < this.hurtUntil) return false;
    return !this.action || (defense && now - this.action.started >= this.action.definition.cancelAt);
  }
  start(definition: AttackDefinition, now: number, charge = 1) {
    if (!this.canAct(now, defensive(definition.action)) || (this.cooldowns.get(definition.id) || 0) > now) return false;
    if (this.chakra < (definition.chakra || 0) || this.ultimate < (definition.ultimate || 0)) return false;
    if (definition.action === 'airdash' && (this.grounded || this.airDashUsed)) return false;
    if (!this.spend(definition.stamina, now)) return false;
    this.chakra -= definition.chakra || 0; this.ultimate -= definition.ultimate || 0;
    if (definition.chakra) this.lastChakraSpend = now;
    this.guard = false; this.chargeStarted = null;
    if (definition.action === 'airdash') this.airDashUsed = true;
    this.action = {definition, started: now, serial: ++this.serial, emitted: new Set(), charge, facing: this.facing};
    this.hitTargets.clear();
    if (definition.invulnerable) this.immuneUntil = Math.max(this.immuneUntil, now + definition.invulnerable);
    if (definition.cooldown) this.cooldowns.set(definition.id, now + definition.cooldown);
    return true;
  }
  update(now: number, dt: number): {event: AttackEvent; key: string; charge: number}[] {
    const events: {event: AttackEvent; key: string; charge: number}[] = [];
    if (this.grounded) this.airDashUsed = false;
    if (this.health <= 0) return events;
    if (this.isBoss && this.guardBrokenUntil && now >= this.guardBrokenUntil) {this.stamina = 100; this.guardBrokenUntil = 0;}
    if (!this.guard && this.chargeStarted === null && now - this.lastSpend >= COMBAT.regenDelay && now >= this.guardBrokenUntil) {
      this.stamina = Math.min(100, this.stamina + (this.isBoss ? 16 : COMBAT.staminaRegen) * dt / 1000);
    }
    if (!this.guard && now - this.lastChakraSpend >= COMBAT.chakraDelay) this.chakra = Math.min(100, this.chakra + dt * COMBAT.chakraRegen / 1000);
    const action = this.action;
    if (action) {
      const age = now - action.started;
      action.definition.events.forEach((event, i) => {
        if (age >= event.at && !action.emitted.has(i)) {action.emitted.add(i); events.push({event, key: `${action.serial}:${i}`, charge: action.charge});}
      });
      if (age >= action.definition.duration) {this.lastActionEnded = action.definition; this.action = null;}
    }
    return events;
  }
  setGuard(held: boolean, fresh: boolean, now: number) {
    if (!held) {this.guard = false; this.parryReleased = true; return;}
    if (!this.canAct(now, true)) {this.guard = false; return;}
    this.action = null; this.chargeStarted = null; this.guard = true;
    if (fresh && this.stamina > 0 && this.parryReleased && now - this.lastParryPress >= COMBAT.parryRearm) {
      this.parryAt = now; this.lastParryPress = now; this.parryReleased = false;
    }
  }
  exhaust(amount: number, now: number) {
    if (this.isBoss && now < this.guardBrokenUntil) return;
    this.stamina = Math.max(0, this.stamina - amount); this.lastSpend = now;
    this.postureHitAt = now;
    if (this.stamina <= 0 && this.isBoss && now >= this.guardBrokenUntil) {
      this.guardBrokenUntil = now + COMBAT.bossBreak; this.action = null; this.guard = false;
    }
  }
  deflected(amount: number, now: number) {
    this.exhaust(amount, now);
    if (this.isBoss && now >= this.guardBrokenUntil) this.stagger(now, 300);
  }
  stagger(now: number, duration: number) {
    this.hurtUntil = Math.max(this.hurtUntil, now + duration); this.lastStagger = now;
    this.action = null; this.chargeStarted = null; this.guard = false;
  }
  receive(hit: IncomingHit, now: number): DefenseOutcome {
    if (this.health <= 0 || now < this.immuneUntil) return {result: 'immune', damage: 0, attackerPosture: 0};
    const frontal = (hit.fromX - this.x) * this.facing >= -3;
    if (!hit.red && frontal && this.guard && now >= this.guardBrokenUntil) {
      if (this.stamina > 0 && now >= this.parryAt && now - this.parryAt < COMBAT.parryWindow) {
        this.stamina = Math.min(100, this.stamina + COMBAT.parryRestore);
        this.ultimate = Math.min(100, this.ultimate + 12); this.chakra = Math.min(100, this.chakra + COMBAT.parryChakra);
        // One press deflects one hit. A release and new deliberate press can deflect the next.
        this.parryAt = -Infinity; this.lastParryPress = now - COMBAT.parryRearm; this.deflectUntil = now + 240;
        return {result: 'parry', damage: 0, attackerPosture: Math.max(COMBAT.parryPosture, hit.posture)};
      }
      const cost = clamp(hit.posture + 12, 20, 40);
      if (this.stamina >= cost) {this.spend(cost, now); return {result: 'block', damage: 0, attackerPosture: 3};}
      this.stamina = 0; this.lastSpend = now; this.guardBrokenUntil = now + COMBAT.guardBreak; this.guard = false;
      const damage = this.takeDamage(hit.damage, now, hit.posture, hit.projectile); return {result: 'guardbreak', damage, attackerPosture: 0};
    }
    const damage = this.takeDamage(hit.damage, now, hit.posture, hit.projectile);
    return {result: 'damage', damage, attackerPosture: 0};
  }
  takeDamage(amount: number, now: number, posture = 0, projectile = false) {
    const damage = amount * (this.isBoss && now < this.guardBrokenUntil ? COMBAT.breakDamage : 1);
    this.health = Math.max(0, this.health - damage); this.damagedAt = now;
    this.immuneUntil = now + (this.isBoss ? 95 : COMBAT.damageImmunity);
    // Committed boss attacks have armor. A parry or depleted guard interrupts them;
    // ordinary melee can stagger a recovery, with a rearm gap to prevent stun locks.
    const committed = this.action?.definition.events.some(e => e.at > now - this.action!.started && e.kind !== 'effect');
    if (!this.isBoss) this.stagger(now, 320);
    else if (!projectile && !committed && now - this.lastStagger >= 700 && now >= this.guardBrokenUntil) this.stagger(now, posture >= 30 ? 420 : 260);
    return damage;
  }
  bufferMelee(now: number) {this.meleeBufferedAt = now;}
  consumeMelee(now: number) {
    if (now - this.meleeBufferedAt > COMBAT.inputBuffer || !this.canAct(now)) return false;
    const index = this.grounded ? (now <= this.comboExpires ? this.combo % 3 + 1 : 1) : 0;
    if (!this.start(index ? UNIVERSAL[`light${index}`] : UNIVERSAL.aerial, now)) return false;
    this.combo = index; this.comboExpires = now + 1150; this.meleeBufferedAt = -Infinity; return true;
  }
  beginCharge(now: number) {if (!this.canAct(now) || this.guard || this.stamina < 18) return false; this.chargeStarted = now; return true;}
  releaseCharge(now: number) {
    if (this.chargeStarted === null) return false;
    const charge = clamp((now - this.chargeStarted) / 700, .45, 1.5); this.chargeStarted = null;
    return this.start(UNIVERSAL.heavy, now, charge);
  }
  cooldown(id: string, now: number) {return Math.max(0, (this.cooldowns.get(id) || 0) - now) / 1000;}
  animation(now: number): AnimationName {
    if (this.health <= 0) return 'defeat';
    if (now < this.guardBrokenUntil) return 'guardbreak';
    if (now < this.hurtUntil) return 'hurt';
    if (this.guard) return now < this.deflectUntil || now - this.parryAt < COMBAT.parryWindow ? 'parry' : 'block';
    if (this.chargeStarted !== null) return 'heavy';
    return this.action?.definition.animation || (this.grounded ? 'idle' : 'jump');
  }
}

export function safeSubstitution(x: number, facing: Facing, minX: number, maxX: number, bossX: number) {
  const desired = clamp(x - facing * 190, minX + 30, maxX - 30);
  if (Math.abs(desired - bossX) >= 76) return desired;
  const alternatives = [bossX - 94, bossX + 94].filter(p => p >= minX + 30 && p <= maxX - 30);
  return alternatives.sort((a, b) => Math.abs(a - desired) - Math.abs(b - desired))[0] ?? clamp(x, minX + 30, maxX - 30);
}
export function hurtbox(x: number, footY: number, sliding: boolean) {return {x: x - 23, y: footY - (sliding ? 32 : 104), width: 46, height: sliding ? 30 : 100};}
export function overlaps(a: {x: number; y: number; width: number; height: number}, b: {x: number; y: number; width: number; height: number}) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
