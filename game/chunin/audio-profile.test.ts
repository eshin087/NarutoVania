import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import profile from '../../public/audio-chunin/manifest.json';

it('ships the inspected single-source PCM clips with quiet boundaries and no clipped samples', () => {
  expect(profile.records).toHaveLength(21);
  for (const record of profile.records) {
    const file = readFileSync(`public${record.file}`);
    expect(createHash('sha256').update(file).digest('hex'), record.id).toBe(
      record.sha256,
    );
    expect(file.toString('ascii', 0, 4)).toBe('RIFF');
    expect(file.toString('ascii', 8, 12)).toBe('WAVE');
    let samples: Buffer | undefined;
    for (let pos = 12; pos + 8 <= file.length;) {
      const name = file.toString('ascii', pos, pos + 4);
      const size = file.readUInt32LE(pos + 4);
      if (name === 'fmt ') {
        expect(file.readUInt16LE(pos + 8)).toBe(1);
        expect(file.readUInt16LE(pos + 10)).toBe(1);
        expect(file.readUInt32LE(pos + 12)).toBe(44100);
        expect(file.readUInt16LE(pos + 22)).toBe(16);
      }
      if (name === 'data') samples = file.subarray(pos + 8, pos + 8 + size);
      pos += 8 + size + (size % 2);
    }
    expect(samples, record.id).toBeDefined();
    const data = samples!;
    expect(Math.abs(data.readInt16LE(0)) / 32768, record.id).toBeLessThan(
      0.0002,
    );
    expect(
      Math.abs(data.readInt16LE(data.length - 2)) / 32768,
      record.id,
    ).toBeLessThan(0.0002);
    let peak = 0;
    for (let i = 0; i < data.length; i += 2)
      peak = Math.max(peak, Math.abs(data.readInt16LE(i)));
    expect(peak / 32768, record.id).toBeLessThan(0.5);
    expect(record.recipe.layerCount).toBe(1);
    expect(record.recipe.playbackRate).toBe(1);
    expect(record.listened).toBe(false); // Measurements cannot establish a listening sign-off.
  }
});

it('has real variants and source/licensing records for every active Chapter 2 pool', () => {
  const ids = new Set(profile.records.map((r) => r.id));
  for (const pool of Object.values(profile.pools)) {
    expect(new Set(pool).size).toBe(pool.length);
    expect(pool.length).toBeGreaterThanOrEqual(2);
    for (const id of pool) expect(ids.has(id), id).toBe(true);
  }
  for (const record of profile.records) {
    const source =
      profile.sources[record.source as keyof typeof profile.sources];
    expect(source.url).toMatch(/^https:\/\//);
    expect(source.license.length).toBeGreaterThan(3);
    expect(source.attribution.length).toBeGreaterThan(10);
  }
});
