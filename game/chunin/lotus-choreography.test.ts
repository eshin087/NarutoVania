import { describe, it, expect } from 'vitest';
import { lotusStaging } from './lotus-choreography';
describe('Lotus choreography', () => {
  it('shows a bound inversion before Primary Lotus impact, not a standing aerial kick', () => {
    const from = { lx: 350, ly: 586, gx: 800, gy: 586 };
    expect(lotusStaging(0.55, from, false).pair).toBe(13);
    expect(lotusStaging(0.73, from, false).pair).toBe(15);
    expect(lotusStaging(0.85, from, false).pair).toBe(16);
    expect(lotusStaging(0.88, from, false).stage).toBe('impact');
  });
  it('keeps Reverse Lotus motion continuous at binding and descent handoffs', () => {
    for (const from of [
      { lx: 350, ly: 586, gx: 800, gy: 586 },
      { lx: 1000, ly: 586, gx: 400, gy: 586 },
    ])
      for (const edge of [0.3, 0.47, 0.68, 0.88]) {
        const before = lotusStaging(edge - 0.00001, from, true),
          after = lotusStaging(edge, from, true);
        expect(Math.abs(before.lx - after.lx)).toBeLessThan(6);
        expect(Math.abs(before.ly - after.ly)).toBeLessThan(1);
        expect(Math.abs(before.gy - after.gy)).toBeLessThan(1);
      }
  });
});
