import { describe, it, expect } from 'vitest';
import { traceSandFlight } from './sand-flight';
import { Duel, FLOOR } from './combat';
describe('Finite sand ricochets', () => {
  it('splits a floor impact and harmless rebound tell instead of sweeping a chord', () => {
    const r = traceSandFlight(
      { x: 500, y: 550, vx: 100, vy: 600, bounces: 1 },
      400,
    );
    expect(r.bounced).toBe(true);
    expect(r.bounces).toBe(0);
    expect(r.segments).toHaveLength(3);
    expect(r.segments[1].damaging).toBe(false);
    expect(r.segments[1].endMs - r.segments[1].startMs).toBeCloseTo(180);
    expect(r.vy).toBeLessThan(0);
    expect(r.y).toBeLessThan(550);
  });
  it('has the same path at 8/16/40ms steps with exactly one bounce', () => {
    const from = {
      x: 300,
      y: 175,
      vx: 150,
      vy: 520,
      bounces: 1,
      bounceWait: 0,
    };
    const expected = traceSandFlight(from, 1600);
    for (const dt of [8, 16, 40]) {
      let p = { ...from },
        count = 0;
      for (let t = 0; t < 1600; t += dt) {
        const r = traceSandFlight(p, Math.min(dt, 1600 - t));
        p = r;
        if (r.bounced) count++;
      }
      expect(count).toBe(1);
      expect(p.x).toBeCloseTo(expected.x);
      expect(p.y).toBeCloseTo(expected.y);
    }
  });
  it('can parry the rebound and clears further bounce ownership', () => {
    const d = new Duel();
    d.lee.x = 500;
    d.lee.y = FLOOR - 140;
    d.lee.grounded = false;
    d.lee.setGuard(true, true, 0);
    d.spawn(505, d.lee.y - 85, 490, d.lee.y - 85, 'spike', 42);
    d.shots[0].bounces = 1;
    d.updateProjectiles(16);
    expect(d.parries).toBe(1);
    expect(d.shots[0].returned).toBe(true);
    expect(d.shots[0].bounces).toBe(0);
    expect(d.shots[0].bounceWait).toBe(0);
    d.cancelAttack();
    expect(d.shots).toHaveLength(0);
  });
});
