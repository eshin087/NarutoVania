import { afterEach, describe, expect, it, vi } from 'vitest';
import { BattleInput } from '../battle-input';
import { readChapters, writeChapter, SAVE_KEY } from '../chapter-registry';
import { bridge } from './bridge';
import { bossBridge } from '../boss-bridge';
import manifest from '../../public/art-chunin/manifest.json';
import sandalMeasurements from '../../tools/chunin-gaara-ankle-preservation.json';
afterEach(() => {
  vi.unstubAllGlobals();
  bossBridge.reset();
});
function storage() {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) || null,
    setItem: (k: string, v: string) => map.set(k, v),
  });
  return map;
}
describe('Chapter boundaries', () => {
  it('preserves both chapters across a new run and imported legacy progress', () => {
    const m = storage();
    m.set(
      'narutovania.checkpoint.v2',
      JSON.stringify({ version: 2, phase: 'seal', seen: ['mist', 'seal'] }),
    );
    writeChapter('lee-gaara', {
      checkpoint: 'speed',
      seen: ['shield', 'speed'],
    });
    expect(readChapters().chapters['land-of-waves'].checkpoint).toBe('seal');
    bossBridge.newRun();
    expect(readChapters().chapters['lee-gaara'].checkpoint).toBe('speed');
    expect(readChapters().chapters['land-of-waves'].checkpoint).toBe('mist');
  });
  it('debug completion cannot overwrite normal chapter progress', () => {
    const m = storage();
    writeChapter('lee-gaara', {
      checkpoint: 'speed',
      seen: ['shield', 'speed'],
    });
    bridge.load();
    const before = m.get(SAVE_KEY);
    bridge.patch({ debugEntry: 'ending' });
    bridge.checkpoint('gates', true);
    expect(m.get(SAVE_KEY)).toBe(before);
    bridge.load();
    expect(bridge.get().phase).toBe('speed');
    expect(bridge.get().debugEntry).toBe(null);
  });
  it('blocks keyboard and controller commands behind a modal, including held confirmation on close', () => {
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      hidden: false,
    });
    const buttons = Array.from({ length: 17 }, () => ({
      pressed: false,
      value: 0,
    }));
    buttons[0].pressed = buttons[9].pressed = true;
    vi.stubGlobal('navigator', {
      getGamepads: () => [{ connected: true, axes: [0, 0], buttons }],
    });
    let modalOpen = true;
    const command = vi.fn();
    const input = new BattleInput({
      get: () => ({ screen: 'paused', seen: [], debugEntry: null, modalOpen }),
      command,
    });
    input.down({
      code: 'Escape',
      key: 'Escape',
      target: null,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent);
    input.poll();
    expect(command).not.toHaveBeenCalled();
    modalOpen = false;
    input.poll();
    expect(command).not.toHaveBeenCalled();
    buttons[0].pressed = buttons[9].pressed = false;
    input.poll();
    buttons[9].pressed = true;
    input.poll();
    expect(command).toHaveBeenCalledExactlyOnceWith('resume');
    input.destroy();
  });
  it('every generated frame has stable root metadata within a padded atlas cell', () => {
    for (const a of Object.values(manifest.assets)) {
      for (const f of a.frames) {
        expect(f.root[0]).toBeGreaterThan(0);
        expect(f.root[0]).toBeLessThan(a.frameWidth);
        expect(f.root[1]).toBeGreaterThan(0);
        expect(f.root[1]).toBeLessThanOrEqual(a.frameHeight);
        expect(f.rect[2]).toBe(a.frameWidth);
        expect(f.rect[3]).toBe(a.frameHeight);
      }
    }
  });
  it('anchors Gaara between measured feet rather than the casting silhouette', () => {
    const a = manifest.assets['gaara-actions'];
    for (const frame of a.frames) {
      const shoes = sandalMeasurements.polygons.filter(
        (p) => p.frame === frame.index,
      );
      expect(shoes).toHaveLength(2);
      const center =
        shoes.reduce((sum, p) => sum + p.shoeBounds[0] + p.shoeBounds[2], 0) /
        4;
      const localCenter =
        frame.opaqueBounds[0] + center - frame.sourceBounds[0];
      expect(Math.abs(localCenter - frame.root[0]) * frame.scale).toBeLessThan(
        2,
      );
    }
  });
});
