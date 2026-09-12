import { describe, it, expect } from 'vitest';
import {
  Duel,
  curtainOrigins,
  segmentHits,
  FLOOR,
  LEE_SKILLS,
  hurricaneVelocity,
  LEFT,
  RIGHT,
} from './combat';
import { parseChapters } from '../chapter-registry';
describe('Chapter registry', () => {
  it('imports old checkpoints without inventing completion', () => {
    const s = parseChapters(null, {
      version: 2,
      phase: 'seal',
      seen: ['mist', 'seal', 'bad'],
    });
    expect(s.chapters['land-of-waves']).toEqual({
      checkpoint: 'seal',
      seen: ['mist', 'seal'],
      completed: false,
    });
    expect(s.chapters['lee-gaara'].checkpoint).toBe('shield');
  });
  it('rejects crossed chapter phases and malformed entries', () => {
    const s = parseChapters({
      version: 3,
      selectedChapter: 'lee-gaara',
      chapters: {
        'lee-gaara': {
          checkpoint: 'mist',
          seen: ['gates', 4],
          completed: true,
        },
      },
    });
    expect(s.selectedChapter).toBe('lee-gaara');
    expect(s.chapters['lee-gaara']).toEqual({
      checkpoint: 'shield',
      seen: ['gates'],
      completed: true,
    });
  });
});
describe('Lee versus Gaara', () => {
  it('keeps a planned diagonal-shower route safe under discrete swept collision', () => {
    for (const phase of ['shield', 'speed', 'gates'] as const)
      for (const dt of [8, 16, 40]) {
        const d = new Duel(phase);
        d.lee.x = 640;
        d.phaseTime = 20000;
        d.now = 20000;
        d.lastMajor = 0;
        d.ordinary = 2;
        d.chooseMove();
        const m = d.move!;
        m.gap = 640;
        const proposals = Array.from({ length: 18 }, (_, i) =>
          d.makeShot(
            110 + i * 62,
            150,
            110 + i * 62 - 120,
            FLOOR + 80,
            'pellet',
            999,
          ),
        );
        expect(d.releaseBarrage(proposals, m)).toBe(true);
        expect(d.shots.length).toBeGreaterThan(0);
        const start = d.now,
          speed = { shield: 390, speed: 460, gates: 500 }[phase] * 0.8;
        const gap = m.gap,
          direction = Math.sign(gap - 640),
          distance = Math.abs(gap - 640);
        for (let time = dt; time <= 1800; time += dt) {
          d.now = start + time;
          d.lee.x =
            640 +
            direction *
              Math.min(distance, (Math.max(0, time - 260) / 1000) * speed);
          d.updateProjectiles(dt);
        }
        expect(d.lee.health).toBe(100);
      }
  });
  it('connects Hurricane from close range without crossing Gaara, in both directions and at edges', () => {
    for (const facing of [-1, 1] as const)
      for (const distance of [50, 88, 140, 200])
        for (const target of [LEFT + 205, 640, RIGHT - 205]) {
          const d = new Duel();
          d.gaara.x = target;
          d.lee.x = target - facing * distance;
          d.lee.facing = facing;
          d.nextMove = 10000;
          d.lee.start(LEE_SKILLS.skill1, 0);
          for (let t = 0; t < 660; t += 10) {
            d.lee.x += hurricaneVelocity(d.lee.x, target, facing, t, 10) * 0.01;
            d.update(10);
          }
          expect(d.gaara.maxHealth - d.gaara.health).toBeCloseTo(68 * 0.3);
          expect((target - d.lee.x) * facing).toBeGreaterThanOrEqual(49.9);
          expect(d.comboHits).toBe(1);
        }
  });
  it('lands the cinematic ultimate even when combat-time immunity was just granted', () => {
    const d = new Duel();
    d.hitGaara(35, 0);
    const hp = d.gaara.health;
    expect(d.gaara.immuneUntil).toBeGreaterThan(d.now);
    expect(d.ultimateImpact()).toBe(310);
    expect(hp - d.gaara.health).toBe(310);
    expect(d.ultimates).toBe(1);
  });
  it('deflects an inseparable volley once without repeated stamina or posture rewards', () => {
    const d = new Duel();
    d.lee.ultimate = 0;
    d.lee.setGuard(true, true, 0);
    for (let i = 0; i < 5; i++)
      d.spawn(360, FLOOR - 70, 300, FLOOR - 70, 'pellet', 11);
    d.updateProjectiles(1);
    expect(d.parries).toBe(1);
    expect(d.lee.ultimate).toBe(16);
    expect(d.lee.health).toBe(100);
    expect(d.lee.stamina).toBe(100);
    expect(d.shots).toHaveLength(5);
    expect(d.shots.every((s) => s.returned)).toBe(true);
    for (let i = 0; i < 120; i++) d.update(10);
    expect(d.comboHits).toBe(1);
  });
  it('does not carry grouped parry protection into a different volley', () => {
    const d = new Duel();
    d.lee.setGuard(true, true, 0);
    d.spawn(360, FLOOR - 70, 300, FLOOR - 70, 'pellet', 1);
    d.spawn(360, FLOOR - 70, 300, FLOOR - 70, 'pellet', 2);
    d.updateProjectiles(1);
    expect(d.parries).toBe(1);
    expect(d.cues.filter((c) => c.kind === 'block')).toHaveLength(1);
  });
  it('allows overhead rain and large traveling hands to be parried', () => {
    for (const kind of ['pellet', 'hand', 'spike'] as const) {
      const d = new Duel();
      d.lee.facing = -1;
      d.lee.setGuard(true, true, 0);
      d.spawn(d.lee.x + 2, FLOOR - 110, d.lee.x + 2, FLOOR + 80, kind, 1);
      d.updateProjectiles(1);
      expect(d.parries).toBe(1);
    }
  });
  it('uses physical techniques without chakra costs', () => {
    for (const a of Object.values(LEE_SKILLS)) expect(a.chakra || 0).toBe(0);
    const d = new Duel('gates');
    d.lee.chakra = 0;
    expect(d.lee.start(LEE_SKILLS.skill1, 0)).toBe(true);
    expect(d.lee.stamina).toBe(82);
  });
  it('checks swept fast shots including edge intersections', () => {
    expect(segmentHits(0, 100, 900, 100, 350, 80, 46, 100)).toBe(true);
    expect(segmentHits(0, 10, 900, 10, 350, 80, 46, 100)).toBe(false);
  });
  it('reserves a full grounded corridor in every curtain', () => {
    for (let gap = 280; gap <= 1000; gap += 10) {
      const origins = curtainOrigins(gap, 260);
      expect(origins.every((x) => Math.abs(x - gap) > 165)).toBe(true);
      expect(origins.length).toBeLessThan(14);
    }
  });
  it('alternates majors across intervening ordinary attacks', () => {
    const d = new Duel();
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      d.phaseTime = 20000;
      d.now += 16000;
      d.ordinary = 2;
      d.chooseMove();
      ids.push(d.move!.id);
      d.ordinary = 0;
      d.move = null;
      d.lastMajor = d.now;
      d.chooseMove();
      d.move = null;
    }
    expect(ids).toEqual(['storm', 'walls', 'storm', 'walls', 'storm']);
  });
  it('cancels the entire current volley after a breaking parry', () => {
    const d = new Duel();
    d.gaara.stamina = 1;
    d.lee.x = 350;
    d.lee.setGuard(true, true, 0);
    for (let i = 0; i < 2; i++)
      d.spawn(360, FLOOR - 70, 300, FLOOR - 70, 'pellet', 1);
    d.updateProjectiles(1);
    expect(d.parries).toBe(1);
    expect(d.lee.stamina).toBe(100);
    expect(d.shots.length).toBe(0);
    expect(d.cues.filter((c) => c.kind === 'block').length).toBe(0);
  });
  it('emits one break event and preserves immunity against duplicate hits', () => {
    const d = new Duel();
    d.gaara.stamina = 1;
    d.hitGaara(24, 10);
    d.now += 200;
    d.hitGaara(24, 10);
    expect(d.cues.filter((c) => c.kind === 'break').length).toBe(1);
    const hp = d.gaara.health;
    d.hitGaara(24, 10);
    expect(d.gaara.health).toBe(hp);
  });
  it('cleans hazards and restores an ultimate at every phase checkpoint', () => {
    const d = new Duel();
    d.spawn(400, 150, 500, 500, 'pellet', 1);
    d.lee.health = 1;
    d.lee.ultimate = 0;
    d.reset('speed');
    expect(d.shots).toHaveLength(0);
    expect(d.zones).toHaveLength(0);
    expect(d.lee.health).toBe(100);
    expect(d.lee.ultimate).toBe(100);
  });
  it('has no damaging volley after cancellation', () => {
    const d = new Duel();
    d.chooseMove();
    d.cancelAttack();
    d.update(100);
    expect(d.shots).toHaveLength(0);
    expect(d.move).toBe(null);
  });
});
