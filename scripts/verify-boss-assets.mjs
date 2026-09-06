import fs from 'node:fs/promises';
import sharp from 'sharp';
const manifest = JSON.parse(await fs.readFile('public/art-v2/manifest.json', 'utf8'));
let frames = 0;
for (const [id, character] of Object.entries(manifest.characters)) {
  for (const [name, sheet] of Object.entries(character.sheets)) {
    const {data, info} = await sharp(`public/art-v2/${id}-${name}.png`).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    if (info.width !== sheet.width || info.height !== sheet.height) throw new Error(`Wrong dimensions: ${id}-${name}`);
    for (const frame of sheet.frames) {
      const [x, y, w, h] = frame.rect, [ax, ay] = frame.footAnchor;
      if (x < 0 || y < 0 || x + w > info.width || y + h > info.height || ax < 0 || ax > w || ay < 0 || ay > h) throw new Error(`Invalid frame ${id}-${name}`);
      let opaque = 0, transparent = 0;
      for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {const i = ((y + dy) * info.width + x + dx) * 4; if (data[i + 3] > 200) opaque++; if (data[i + 3] === 0) transparent++;}
      if (opaque < 80 || transparent < w * h * .2) throw new Error(`Missing art or alpha ${id}-${name}`);
      frames++;
    }
  }
}
for (const kind of ['props', 'effects']) {
  const info = await sharp(`public/art-v2/${kind}.png`).metadata();
  if (!info.hasAlpha) throw new Error(`Missing alpha: ${kind}`);
  for (const [name, frame] of Object.entries(manifest[kind])) {const [x, y, w, h] = frame.rect; if (x < 0 || y < 0 || x + w > info.width || y + h > info.height) throw new Error(`Invalid ${name}`);}
}
for (const name of ['light1', 'light2', 'light3', 'heavy']) if (new Set(manifest.animations[name].frames.map(f => f.index)).size < 6) throw new Error(`Too few ${name} frames`);
for (const name of ['dash', 'airdash', 'slide', 'parry']) if (manifest.animations[name].frames.length < 4) throw new Error(`Too few ${name} frames`);
const audio = JSON.parse(await fs.readFile('public/audio/manifest.json', 'utf8'));
for (const entry of audio.records) {const stat = await fs.stat(`public${entry.file}`); if (stat.size < 1000) throw new Error(`Invalid audio ${entry.id}`);}
console.log(`${frames} core frames: dimensions, alpha, bounds and anchors passed. All melee/defense frame counts passed. ${audio.records.length} audio files present.`);
