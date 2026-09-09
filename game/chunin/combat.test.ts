import { describe, it, expect } from 'vitest';
import { Duel, curtainOrigins, segmentHits, FLOOR, LEE_SKILLS } from './combat';
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
