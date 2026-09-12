import { describe, it, expect, vi, afterEach } from 'vitest';
import { Duel, GAARA_HEALTH, PHASE_INFO } from './combat';
import { sceneSpacing } from './scene-spacing';
import { bridge } from './bridge';
import { readChapters, writeChapter, SAVE_KEY } from '../chapter-registry';
afterEach(() => vi.unstubAllGlobals());
describe('One continuous Lee/Gaara duel', () => {
  it('preserves damage beyond each threshold and never refills the boss on power-up', () => {
    const d = new Duel();
    d.gaara.health = PHASE_INFO.speed.health + 100;
    d.lee.health = 42;
    d.lee.ultimate = 31;
    d.ultimateImpact();
    const hp = d.gaara.health;
    expect(d.pendingStory).toBe('weights');
    d.advancePower('speed');
    expect(d.gaara.maxHealth).toBe(GAARA_HEALTH);
    expect(d.gaara.health).toBe(hp);
    expect(d.pendingStory).toBe(null);
    expect(d.lee.health).toBe(62);
    expect(d.lee.ultimate).toBe(100);
    d.gaara.health = PHASE_INFO.gates.health - 25;
    expect(d.pendingStory).toBe('gates');
    d.advancePower('gates');
    expect(d.gaara.health).toBe(PHASE_INFO.gates.health - 25);
    expect(d.pendingStory).toBe(null);
    d.gaara.health = 0;
    expect(d.pendingStory).toBe('ending');
  });
  it('restores phase checkpoint HP as a fraction of the same maximum', () => {
    for (const phase of ['shield', 'speed', 'gates'] as const) {
      const d = new Duel(phase);
      expect(d.gaara.maxHealth).toBe(GAARA_HEALTH);
      expect(d.gaara.health).toBe(PHASE_INFO[phase].health);
    }
  });
  it('persists exact checkpoint-entry HP and leaves normal progress alone in debug', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => data.set(k, v),
    });
    writeChapter('lee-gaara', {
      checkpoint: 'speed',
      checkpointBossHealth: 4123,
      seen: ['shield', 'speed'],
    });
    bridge.load();
    expect(bridge.get().checkpointBossHealth).toBe(4123);
    const before = data.get(SAVE_KEY);
    bridge.patch({ debugEntry: 'gates' });
    bridge.checkpoint('gates', false, 2050);
    expect(data.get(SAVE_KEY)).toBe(before);
    bridge.load();
    expect(readChapters().chapters['lee-gaara'].checkpointBossHealth).toBe(
      4123,
    );
    writeChapter('lee-gaara', { checkpointBossHealth: NaN });
    expect(
      readChapters().chapters['lee-gaara'].checkpointBossHealth,
    ).toBeUndefined();
  });
  it('leaves room around both actors before close-range story choreography', () => {
    for (const gx of [90, 250, 640, 1100, 1190])
      for (const dir of [-1, 1]) {
        const p = sceneSpacing(gx - dir * 45, gx);
        expect((p.gx - p.lx) * dir).toBeGreaterThanOrEqual(250);
        expect(p.lx).toBeGreaterThanOrEqual(90);
        expect(p.lx).toBeLessThanOrEqual(1190);
      }
  });
});
