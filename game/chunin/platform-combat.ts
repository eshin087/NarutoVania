import { clamp, type AttackDefinition, type AttackEvent } from '../combat-core';

export type AttackAim = 'neutral' | 'forward' | 'back' | 'up' | 'down';
export interface LaunchEvent extends AttackEvent {
  launchX?: number;
  launchY?: number;
  hitDirection?: 'front' | 'back' | 'both';
  offsetY?: number;
}
export interface PlatformAttack extends AttackDefinition {
  events: LaunchEvent[];
  aim: AttackAim;
  art:
    | 'jab'
    | 'forward'
    | 'up'
    | 'down'
    | 'neutral-air'
    | 'forward-air'
    | 'back-air'
    | 'up-air'
    | 'down-air';
  landingLag: number;
}

function attack(
  id: string,
  aim: AttackAim,
  art: PlatformAttack['art'],
  damage: number,
  contact: number,
  duration: number,
  range: number,
  height: number,
  launchX: number,
  launchY: number,
  offsetY = 0,
): PlatformAttack {
  const air = id.includes('air');
  return {
    id,
    aim,
    art,
    landingLag: air ? 100 : 0,
    action: air ? 'aerial' : 'light1',
    animation: air ? 'aerial' : 'light1',
    stamina: 0,
    duration,
    cancelAt: contact + 65,
    move: 0,
    events: [
      { at: Math.max(0, contact - 30), kind: 'effect', effect: 'swing' },
      {
        at: contact,
        kind: 'hit',
        damage,
        posture: damage * 0.24,
        range,
        height,
        offsetY,
        launchX,
        launchY,
        hitDirection:
          aim === 'back' ? 'back' : aim === 'neutral' && air ? 'both' : 'front',
      },
    ],
  };
}

export const NORMALS = {
  jab1: attack('pf-jab1', 'neutral', 'jab', 24, 85, 215, 102, 100, 95, 0),
  jab2: attack('pf-jab2', 'neutral', 'forward', 30, 100, 240, 116, 100, 120, 0),
  jab3: attack(
    'pf-jab3',
    'neutral',
    'forward',
    42,
    130,
    315,
    139,
    120,
    290,
    -270,
  ),
  forward: attack(
    'pf-tilt-forward',
    'forward',
    'forward',
    34,
    130,
    315,
    145,
    115,
    260,
    -180,
  ),
  up: attack('pf-tilt-up', 'up', 'up', 30, 115, 300, 96, 205, 85, -620, -15),
  down: attack(
    'pf-tilt-down',
    'down',
    'down',
    27,
    110,
    290,
    143,
    58,
    180,
    -390,
    0,
  ),
  dash: {
    ...attack(
      'pf-dash-attack',
      'forward',
      'forward',
      38,
      140,
      390,
      148,
      115,
      330,
      -300,
    ),
    move: 275,
  },
  neutralAir: attack(
    'pf-air-neutral',
    'neutral',
    'neutral-air',
    29,
    100,
    300,
    104,
    130,
    180,
    -250,
    0,
  ),
  forwardAir: attack(
    'pf-air-forward',
    'forward',
    'forward-air',
    35,
    140,
    370,
    152,
    135,
    360,
    -200,
  ),
  backAir: attack(
    'pf-air-back',
    'back',
    'back-air',
    38,
    140,
    380,
    159,
    130,
    410,
    -220,
  ),
  upAir: attack(
    'pf-air-up',
    'up',
    'up-air',
    28,
    110,
    285,
    96,
    200,
    65,
    -490,
    -25,
  ),
  downAir: attack(
    'pf-air-down',
    'down',
    'down-air',
    40,
    165,
    415,
    104,
    140,
    90,
    610,
    90,
  ),
} satisfies Record<string, PlatformAttack>;

export function directionalAim(
  x: number,
  y: number,
  facing: number,
): AttackAim {
  return y < 0
    ? 'up'
    : y > 0
      ? 'down'
      : x === 0
        ? 'neutral'
        : x * facing < 0
          ? 'back'
          : 'forward';
}
export function selectNormal(
  aim: AttackAim,
  grounded: boolean,
  combo: number,
  running: boolean,
): PlatformAttack {
  if (!grounded)
    return NORMALS[
      `${aim}Air` as
        | 'neutralAir'
        | 'forwardAir'
        | 'backAir'
        | 'upAir'
        | 'downAir'
    ];
  if (aim === 'up' || aim === 'down') return NORMALS[aim];
  if (aim === 'forward' || aim === 'back')
    return running ? NORMALS.dash : NORMALS.forward;
  return [NORMALS.jab1, NORMALS.jab2, NORMALS.jab3][combo % 3];
}
export function chargedSmash(aim: AttackAim): PlatformAttack {
  const up = aim === 'up',
    down = aim === 'down';
  const a = attack(
    `pf-smash-${up ? 'up' : down ? 'down' : 'forward'}`,
    aim,
    up ? 'up' : down ? 'down' : 'forward',
    62,
    170,
    560,
    up ? 105 : 168,
    up ? 225 : down ? 72 : 135,
    up ? 130 : 620,
    up ? -830 : down ? -330 : -380,
  );
  a.action = 'heavy';
  a.animation = 'heavy';
  a.cancelAt = 390;
  a.events[1].posture = 25;
  if (down) a.events[1].hitDirection = 'both';
  return a;
}
export function attackBox(
  x: number,
  y: number,
  facing: number,
  e: LaunchEvent,
) {
  const reach = e.range ?? 110,
    h = e.height ?? 110,
    bottom = y + (e.offsetY ?? 0);
  const direction = e.hitDirection === 'back' ? -facing : facing;
  return {
    x:
      e.hitDirection === 'both'
        ? x - reach
        : direction < 0
          ? x - reach
          : x - 20,
    y: bottom - h,
    width: e.hitDirection === 'both' ? reach * 2 : reach + 20,
    height: h,
  };
}
export function steerVelocity(
  current: number,
  desired: number,
  acceleration: number,
  dt: number,
) {
  return (
    current +
    clamp(
      desired - current,
      (-acceleration * dt) / 1000,
      (acceleration * dt) / 1000,
    )
  );
}

/** Impulses own velocity until expiry; normal input may steer, never erase them. */
export class LaunchState {
  vx = 0;
  vy = 0;
  until = 0;
  serial = 0;
  landedAt = -10000;
  reset() {
    this.vx = this.vy = this.until = 0;
    this.serial++;
    this.landedAt = -10000;
  }
  launch(x: number, y: number, now: number, duration = 270) {
    this.vx = x;
    this.vy = y;
    this.until = now + duration;
    this.serial++;
  }
  step(
    body: { x: number; y: number; grounded: boolean },
    now: number,
    dt: number,
    floor: number,
    left: number,
    right: number,
  ) {
    const wasAir = !body.grounded;
    if (body.grounded && !this.vy && Math.abs(this.vx) < 1) return;
    const seconds = dt / 1000;
    this.vy += 2200 * seconds;
    body.x += this.vx * seconds;
    body.y += this.vy * seconds;
    if (body.x < left || body.x > right) {
      body.x = clamp(body.x, left, right);
      this.vx *= -0.18;
    }
    body.grounded = body.y >= floor;
    if (body.grounded) {
      body.y = floor;
      this.vy = 0;
      this.vx = steerVelocity(this.vx, 0, 1900, dt);
      if (wasAir) this.landedAt = now;
    } else this.vx = steerVelocity(this.vx, 0, 130, dt);
    if (body.y < 270) {
      body.y = 270;
      this.vy = Math.max(0, this.vy);
    }
  }
}
