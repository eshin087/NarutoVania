import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import ts from 'typescript';

const source = process.argv[2];
if (!source) throw new Error('Pass the generated boss-rush-art directory.');
const output = path.resolve('public/art-v2');
const archive = path.resolve('art/boss-rush');
await fs.mkdir(output, {recursive: true});
await fs.mkdir(path.join(output, 'portraits'), {recursive: true});
await fs.mkdir(archive, {recursive: true});
const read = async file => JSON.parse(await fs.readFile(path.join(source, file), 'utf8'));
const ids = ['kakashi', 'naruto', 'sasuke', 'sakura', 'zabuza', 'haku'];
const sheets = ['locomotion', 'melee', 'techniques'];
const manifest = {version: 2, generation: 'Built-in image_gen; background cleanup authorized by the user', characters: {}, variants: {}, props: {}, effects: {}, animations: {}, combat: {}, attachments: {feet: [0, 0], hand: [42, -74], impact: [72, -64], head: [0, -106]}};
const selected = [];
async function copy(file, clean = false) {
  const bytes = await fs.readFile(path.join(source, file));
  if (clean) {
    const {data, info} = await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Remove only the explicitly authorized magenta key remnants; preserve drawn pixels.
      if (r > 100 && b > 85 && r > g * 1.6 && b > g * 1.5 && Math.abs(r - b) < 115) data[i + 3] = 0;
    }
    await sharp(data, {raw: info}).png().toFile(path.join(output, file));
  } else await fs.copyFile(path.join(source, file), path.join(output, file));
  selected.push(file);
}
for (const id of ids) {
  const metadata = {};
  for (const sheet of sheets) {metadata[sheet] = await read(`${id}-${sheet}.json`); await copy(`${id}-${sheet}.png`);}
  const bounds = metadata.locomotion.frames[6].contentBounds;
  manifest.characters[id] = {baseHeight: bounds[3] - bounds[1], sheets: metadata};
  const f = metadata.locomotion.frames[6];
  const local = bounds;
  const headSize = Math.round((bounds[3] - bounds[1]) * .42);
  const center = Math.round((local[0] + local[2]) / 2);
  await sharp(path.join(output, `${id}-locomotion.png`)).extract({left: f.rect[0] + Math.max(0, center - Math.round(headSize / 2)), top: f.rect[1] + Math.max(0, local[1]), width: headSize, height: headSize}).resize(160, 160).png().toFile(path.join(output, 'portraits', `${id}.png`));
}
for (const category of ['props', 'effects']) {manifest[category] = (await read(`${category}.json`)).items; await copy(`${category}.png`, true);}
for (const name of ['lakeside-background', 'bridge-background', 'lakeside-ground', 'bridge-ground', 'naruto-awakened']) await copy(`${name}.png`, !name.includes('background'));
const awakened = await read('naruto-awakened.json');
manifest.variants.awakened = {...awakened, baseHeight: 264};
for (const sheet of sheets) await copy(`haku-unmasked-${sheet}.png`);
await copy('ending-zabuza.png', true); await copy('zabuza-sword.png', true);
manifest.variants.ending = {...await read('ending-zabuza.json'), baseHeight: 230};
manifest.variants.unmasked = {baseHeight: 179, sheets: Object.fromEntries(sheets.map(sheet => [sheet, {frames: Array.from({length: 24}, (_, index) => ({rect: [(index % 6) * 256, Math.floor(index / 6) * 384, 256, 384], footAnchor: [128, 307]}))}]))};
async function loadTs(file) {const js = ts.transpileModule(await fs.readFile(file, 'utf8'), {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}}).outputText; return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));}
manifest.animations = (await loadTs('game/animation-data.ts')).ANIMATIONS;
manifest.combat = (await loadTs('game/combat-core.ts')).UNIVERSAL;
manifest.eventDefinitions = ['game/chapter.ts', 'game/boss-ai.ts'];
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
await fs.cp(path.join(source, 'prompts'), path.join(archive, 'prompts'), {recursive: true});
await fs.cp(path.join(source, 'qa'), path.join(archive, 'qa'), {recursive: true});
for (const file of ['00-character-reference.png', 'art-manifest.json', 'animation-map.json', 'README.md']) await fs.copyFile(path.join(source, file), path.join(archive, file));
await fs.writeFile(path.join(archive, 'selected-assets.json'), JSON.stringify({files: selected, manifest: 'public/art-v2/manifest.json', cleanup: 'Props, effects and ground strips had remaining magenta key pixels removed. Runtime uses generated pixels only.'}, null, 2));
console.log(JSON.stringify({files: selected.length, frames: 432, props: Object.keys(manifest.props).length, effects: Object.keys(manifest.effects).length, heights: Object.fromEntries(ids.map(id => [id, manifest.characters[id].baseHeight]))}));
