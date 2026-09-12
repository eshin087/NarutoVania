import { describe, expect, it } from 'vitest';
import { JumpState } from './jump-state';
import { Combatant } from './combat-core';
describe('Double jump and airborne defense', () => {
  it('requires fresh presses, limits the cycle to two jumps and restores on landing', () => {
    const j = new JumpState();
    j.observe(0, true, 0);
    j.press(0);
    expect(j.consume(0, true)).toBe('ground');
    j.observe(16, true, -840); // physics may retain the prior ground flag for a frame
    expect(j.consume(100, true)).toBe(null);
    j.press(140);
    expect(j.consume(140, true)).toBe('air');
    j.press(300);
    expect(j.consume(300, true)).toBe(null);
    j.observe(700, true, 0);
    j.press(700);
    expect(j.consume(700, true)).toBe('ground');
  });
  it('retains coyote/buffer behavior and cannot jump out of a forbidden action', () => {
    const j = new JumpState();
    j.observe(0, true, 0);
    j.press(60);
    expect(j.consume(60, false)).toBe(null);
    expect(j.consume(80, true)).toBe('ground');
    j.press(180);
    expect(j.consume(180, true)).toBe('air');
    j.press(600);
    j.observe(650, true, 0);
    expect(j.consume(650, true)).toBe('ground');
  });
  it('parries frontal airborne projectiles with the same window and no dash reset', () => {
    const p = new Combatant('lee');
    p.grounded = false;
    p.airDashUsed = true;
    p.setGuard(true, true, 100);
    expect(
      p.receive(
        { damage: 5, posture: 14, fromX: 50, red: false, projectile: true },
        220,
      ).result,
    ).toBe('parry');
    expect(p.health).toBe(100);
    expect(p.airDashUsed).toBe(true);
    p.setGuard(false, false, 250);
    p.setGuard(true, true, 300);
    expect(
      p.receive(
        { damage: 5, posture: 14, fromX: 50, red: false, projectile: true },
        450,
      ).result,
    ).toBe('block');
  });
});
