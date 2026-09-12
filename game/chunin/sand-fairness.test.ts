import { describe, expect, it } from 'vitest';
import {
  planSandVolley,
  type SandTrajectory,
  type SandVolleyPlanInput,
} from './sand-fairness';

const floor = 586;
const curtain = (): SandTrajectory[] =>
  Array.from({ length: 18 }, (_, i) => ({
    x: 110 + i * 62,
    y: 150,
    vx: 0,
    vy: 700,
    radius: 9,
  }));
function input(x = 640): SandVolleyPlanInput {
  return {
    player: { x, speed: 390, lockMs: 0 },
    desiredGap: x + 120,
    existing: [],
    proposed: curtain(),
    zones: [],
    now: 1000,
  };
}

describe('Chapter 2 proposed sand-volley fairness', () => {
  it('does not mutate any original array or trajectory', () => {
    const source = input();
    source.existing = [{ x: 110, y: 200, vx: 0, vy: 700, radius: 9 }];
    source.zones = [{ x: 110, width: 50, hitAt: 1400 }];
    const before = JSON.stringify(source);
    for (const list of [source.existing, source.proposed, source.zones]) {
      list.forEach(Object.freeze);
      Object.freeze(list);
    }
    Object.freeze(source.player);
    Object.freeze(source);
    expect(planSandVolley(source)).not.toBeNull();
    expect(JSON.stringify(source)).toBe(before);
  });

  for (const x of [90, 640, 1190])
    it(`reserves a reachable ground route and corridor from x=${x}`, () => {
      const source = input(x);
      source.player.lockMs = 160;
      const result = planSandVolley(source)!;
      expect(result).not.toBeNull();
      expect(result.gap).toBeGreaterThanOrEqual(180);
      expect(result.gap).toBeLessThanOrEqual(1100);
      expect(result.retainedIndices.length).toBeGreaterThan(5);
      const hold = (160 + 260) / 1000,
        speed = 390 * 0.8;
      const distance = Math.abs(result.gap - x),
        direction = Math.sign(result.gap - x);
      const arrival = hold + distance / speed;
      expect(arrival).toBeLessThanOrEqual(1.8);
      // Independent sampled trajectory check, including the broad corridor after arrival.
      for (let t = 0; t <= 1.8; t += 0.002) {
        const px =
          x + direction * Math.min(distance, Math.max(0, t - hold) * speed);
        for (const index of result.retainedIndices) {
          const shot = source.proposed[index],
            sy = shot.y + shot.vy * t;
          if (sy < floor - 106 - shot.radius || sy > floor - 18)
            continue;
          expect(Math.abs(shot.x + shot.vx * t - px)).toBeGreaterThan(
            23 + shot.radius + (t >= arrival ? 90 : 0),
          );
        }
      }
    });

  it('rejects every route when an existing shot arrives during the reaction/action lock', () => {
    const source = input();
    source.player.lockMs = 500;
    source.existing = [{ x: 640, y: floor - 220, vx: 0, vy: 700, radius: 9 }];
    const before = JSON.stringify(source.existing);
    expect(planSandVolley(source)).toBeNull();
    expect(JSON.stringify(source.existing)).toBe(before);
  });

  it('accounts for a pending zone during the movement lock', () => {
    const source = input();
    source.player.lockMs = 500;
    source.zones = [{ x: 640, width: 80, hitAt: source.now + 400 }];
    expect(planSandVolley(source)).toBeNull();
  });

  it('leaves entity-cap allowance to the caller', () => {
    const source = input(1100);
    source.proposed = Array.from({ length: 60 }, () => ({
      x: 110,
      y: 150,
      vx: 0,
      vy: 700,
      radius: 9,
    }));
    const result = planSandVolley(source)!;
    expect(result.retainedIndices).toEqual(
      Array.from({ length: 60 }, (_, i) => i),
    );
  });

  it('is deterministic and preserves original proposed order', () => {
    const source = input();
    const first = planSandVolley(source)!;
    for (let i = 0; i < 5; i++) expect(planSandVolley(source)).toEqual(first);
    expect(first.retainedIndices).toEqual(
      [...first.retainedIndices].sort((a, b) => a - b),
    );
  });

  it('clips spent trajectories at the floor and lifetime', () => {
    const source = input();
    source.existing = [
      { x: 640, y: floor + 40, vx: 0, vy: 700, radius: 9 },
      {
        x: 640,
        y: floor - 50,
        vx: 0,
        vy: 0,
        radius: 9,
        expiresAt: source.now - 1,
      },
    ];
    expect(planSandVolley(source)).not.toBeNull();
  });

  it('does not accept an arrival beyond the bounded 1800ms horizon', () => {
    const source = input(90);
    source.player.lockMs = 1800;
    source.horizonMs = 10000;
    expect(planSandVolley(source)).toBeNull();
  });
});
