import { describe, it, expect } from 'vitest';
import {
  NORMALS,
  selectNormal,
  directionalAim,
  chargedSmash,
  attackBox,
  LaunchState,
  steerVelocity,
} from '../platform-combat';
import { Duel, FLOOR, LEFT, RIGHT } from './combat';
import { Combatant, overlaps, UNIVERSAL } from '../combat-core';

describe('HP platform fighter', () => {
  it('selects every air direction without turning a backward drift into a forward attack', () => {
    for (const face of [-1, 1]) {
      expect(directionalAim(-face, 0, face)).toBe('back');
      expect(selectNormal('back', false, 0, false)).toBe(NORMALS.backAir);
      expect(directionalAim(face, -1, face)).toBe('up');
      expect(directionalAim(face, 1, face)).toBe('down');
    }
    expect(selectNormal('neutral', true, 2, false)).toBe(NORMALS.jab3);
    expect(selectNormal('forward', true, 0, true)).toBe(NORMALS.dash);
  });
  it('uses directional geometry above, below, behind and on both sides', () => {
    const event = (a: typeof NORMALS.backAir) => a.events[1];
    const target = (x: number, y: number) => ({ x, y, width: 20, height: 20 });
    expect(
      overlaps(
        attackBox(500, 400, 1, event(NORMALS.backAir)),
        target(360, 350),
      ),
    ).toBe(true);
    expect(
      overlaps(
        attackBox(500, 400, 1, event(NORMALS.backAir)),
        target(560, 350),
      ),
    ).toBe(false);
    expect(
      overlaps(attackBox(500, 400, 1, event(NORMALS.upAir)), target(520, 200)),
    ).toBe(true);
    expect(
      overlaps(
        attackBox(500, 400, 1, event(NORMALS.downAir)),
        target(520, 460),
      ),
    ).toBe(true);
    expect(
      overlaps(
        attackBox(500, 400, 1, event(NORMALS.downAir)),
        target(520, 200),
      ),
    ).toBe(false);
    expect(
      overlaps(
        attackBox(500, 400, 1, event(NORMALS.neutralAir)),
        target(420, 340),
      ),
    ).toBe(true);
  });
  it('free normals still commit until recovery and emit one contact across coarse updates', () => {
    const l = new Combatant('lee');
    l.stamina = 0;
    expect(l.start(NORMALS.up, 0)).toBe(true);
    expect(l.start(NORMALS.jab1, 30)).toBe(false);
    expect(l.start(UNIVERSAL.dash, 30)).toBe(false);
    expect(
      l.update(100, 40).filter((x) => x.event.kind === 'hit'),
    ).toHaveLength(0);
    expect(
      l.update(140, 40).filter((x) => x.event.kind === 'hit'),
    ).toHaveLength(1);
    expect(
      l.update(180, 40).filter((x) => x.event.kind === 'hit'),
    ).toHaveLength(0);
    expect(l.canAct(180, true)).toBe(true);
    expect(UNIVERSAL.light1.stamina).toBeGreaterThan(0);
  });
  it('captures charged smash direction and gives a both-sided down smash', () => {
    const a = chargedSmash('down');
    expect(a.aim).toBe('down');
    expect(a.events[1].hitDirection).toBe('both');
    expect(chargedSmash('up').events[1].launchY).toBeLessThan(-700);
    expect(a.stamina).toBe(0);
  });
  it('steers with acceleration and cannot overshoot the requested velocity', () => {
    expect(steerVelocity(0, 400, 1800, 20)).toBe(36);
    expect(steerVelocity(395, 400, 1800, 20)).toBe(400);
  });
  it('lands a launch inside the arena at both frame rates', () => {
    for (const dt of [16, 40]) {
      const state = new LaunchState(),
        body = { x: RIGHT - 5, y: FLOOR, grounded: false };
      state.launch(500, -800, 0);
      for (let now = dt; now < 1800; now += dt)
        state.step(body, now, dt, FLOOR, LEFT, RIGHT);
      expect(body.y).toBe(FLOOR);
      expect(body.grounded).toBe(true);
      expect(body.x).toBeGreaterThanOrEqual(LEFT);
      expect(body.x).toBeLessThanOrEqual(RIGHT);
      expect(state.landedAt).toBeGreaterThan(0);
    }
  });
  it('launches through ordinary preparation while retaining already visible shots', () => {
    const d = new Duel();
    d.gaara.x = d.lee.x + 65;
    d.chooseMove();
    if (d.move) d.move.id = 'hand';
    d.playerEvent(NORMALS.up.events[1], 1);
    expect(d.gaara.grounded).toBe(false);
    expect(d.move).toBeNull();
    const y = d.gaara.y;
    d.update(40);
    expect(d.gaara.y).toBeLessThan(y);
  });
  it('major sand casting keeps launch armor; actual hit still deals damage', () => {
    const d = new Duel();
    d.gaara.x = d.lee.x + 65;
    d.chooseMove();
    d.move!.id = 'storm';
    const hp = d.gaara.health;
    d.playerEvent(NORMALS.up.events[1], 1);
    expect(d.gaara.health).toBeLessThan(hp);
    expect(d.gaara.grounded).toBe(true);
    expect(d.move?.id).toBe('storm');
  });
  it('bounds repeated launch pressure and allows a boss escape', () => {
    const d = new Duel();
    for (let i = 0; i < 4; i++) {
      d.now = i * 200;
      d.gaara.x = d.lee.x + 65;
      d.gaara.y = d.lee.y;
      d.playerEvent(NORMALS.up.events[1], 1);
    }
    expect(d.escapeUntil).toBeGreaterThan(d.now);
    expect(d.bossLaunch.vy).toBeGreaterThan(0);
    const serial = d.bossLaunch.serial;
    d.now += 200;
    d.playerEvent(NORMALS.up.events[1], 1);
    expect(d.bossLaunch.serial).toBe(serial);
  });
  it('keeps parry/block separate from damaging launch', () => {
    const d = new Duel();
    d.lee.setGuard(true, true, 0);
    expect(d.hitLee(10, 12, false, d.lee.x + 100, true).result).toBe('parry');
    expect(d.playerLaunch.vx).toBe(0);
    d.now = 200;
    expect(d.hitLee(10, 12, false, d.lee.x + 100, true).result).toBe('block');
    d.lee.setGuard(false, false, 200);
    d.now = 300;
    expect(d.hitLee(10, 12, false, d.lee.x + 100, true).damage).toBeGreaterThan(
      0,
    );
    expect(d.playerLaunch.vx).toBeLessThan(0);
    expect(d.playerLaunch.vy).toBeLessThan(0);
  });
  it('power-up clears motion without resetting continuous boss health', () => {
    const d = new Duel();
    d.gaara.health = 4100;
    d.bossLaunch.launch(100, -600, 0);
    d.advancePower('speed');
    expect(d.gaara.health).toBe(4100);
    expect(d.bossLaunch.vy).toBe(0);
    d.reset('speed');
    expect(d.gaara.health).toBe(4200);
    expect(d.playerLaunch.vx).toBe(0);
  });
});
