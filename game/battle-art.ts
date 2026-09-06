import type * as Phaser from 'phaser';
import {animationFrame, type SpriteSheet} from './animation-data';
import {CHARACTER} from './chapter';
import type {AnimationName, CharacterId} from './combat-core';
export const CHARACTERS: CharacterId[] = ['kakashi', 'naruto', 'sasuke', 'sakura', 'zabuza', 'haku'];
export const SHEETS: SpriteSheet[] = ['locomotion', 'melee', 'techniques'];
export interface AssetFrame {rect: number[]; footAnchor?: number[]; contentBounds?: number[];}
export interface AtlasMetadata {file: string; width: number; height: number; frames: AssetFrame[];}
export interface NamedFrame {rect: number[]; anchor?: number[];}
export interface BossArtManifest {
  version: number; characters: Record<CharacterId, {baseHeight: number; sheets: Record<SpriteSheet, AtlasMetadata>}>;
  variants: {awakened: AtlasMetadata & {baseHeight: number}; ending: AtlasMetadata & {baseHeight: number}; unmasked: {baseHeight: number; sheets: Record<SpriteSheet, AtlasMetadata>}};
  props: Record<string, NamedFrame>; effects: Record<string, NamedFrame>;
}
export function preloadBattleArt(scene: Phaser.Scene) {
  scene.load.json('battle-manifest', '/art-v2/manifest.json');
  scene.load.json('combat-art-manifest','/art-v3/manifest.json');
  scene.load.image('v3-kakashi-melee','/art-v3/kakashi-melee.png');
  scene.load.image('v3-ultimates','/art-v3/ultimate-cutins.png');
  scene.load.image('v3-water','/art-v3/water-attacks.png');
  for (const id of CHARACTERS) for (const sheet of SHEETS) scene.load.image(`${id}-${sheet}`, `/art-v2/${id}-${sheet}.png`);
  for (const sheet of SHEETS) scene.load.image(`haku-unmasked-${sheet}`, `/art-v2/haku-unmasked-${sheet}.png`);
  for (const name of ['lakeside-background', 'bridge-background', 'lakeside-ground', 'bridge-ground', 'props', 'effects', 'naruto-awakened', 'ending-zabuza', 'zabuza-sword']) scene.load.image(`v2-${name}`, `/art-v2/${name}.png`);
}
export function artManifest(scene: Phaser.Scene) {return scene.cache.json.get('battle-manifest') as BossArtManifest;}
export function registerBattleArt(scene: Phaser.Scene) {
  const manifest = artManifest(scene);
  const revision=scene.cache.json.get('combat-art-manifest') as {kakashi:{frames:AssetFrame[]};ultimates:{frames:Record<string,number[]>};water:{frames:AssetFrame[]}};
  revision.kakashi.frames.forEach((f,i)=>{const [x,y,w,h]=f.rect;scene.textures.get('v3-kakashi-melee').add(String(i),0,x,y,w,h);});
  revision.water.frames.forEach((f,i)=>{const [x,y,w,h]=f.rect;scene.textures.get('v3-water').add(String(i),0,x,y,w,h);});
  for(const [id,rect]of Object.entries(revision.ultimates.frames)){const [x,y,w,h]=rect;scene.textures.get('v3-ultimates').add(id,0,x,y,w,h);}
  for (const id of CHARACTERS) for (const sheet of SHEETS) {
    const texture = scene.textures.get(`${id}-${sheet}`);
    manifest.characters[id].sheets[sheet].frames.forEach((frame, i) => {
      const [x, y, w, h] = frame.rect; if (!texture.has(String(i))) texture.add(String(i), 0, x, y, w, h);
    });
  }
  for (const category of ['props', 'effects'] as const) {
    const texture = scene.textures.get(`v2-${category}`);
    for (const [name, frame] of Object.entries(manifest[category])) {const [x, y, w, h] = frame.rect; if (!texture.has(name)) texture.add(name, 0, x, y, w, h);}
  }
  for (const sheet of SHEETS) manifest.variants.unmasked.sheets[sheet].frames.forEach((frame, i) => {const [x, y, w, h] = frame.rect; scene.textures.get(`haku-unmasked-${sheet}`).add(String(i), 0, x, y, w, h);});
  manifest.variants.awakened.frames.forEach((frame, i) => {const [x, y, w, h] = frame.rect; scene.textures.get('v2-naruto-awakened').add(String(i), 0, x, y, w, h);});
  manifest.variants.ending.frames.forEach((frame, i) => {const [x, y, w, h] = frame.rect; scene.textures.get('v2-ending-zabuza').add(String(i), 0, x, y, w, h);});
}
export function poseBattle(sprite: Phaser.GameObjects.Sprite, id: CharacterId, animation: AnimationName, elapsed: number, facing: number, duration?: number, variant?: 'awakened' | 'unmasked' | 'final-stand') {
  const frame = animationFrame(animation, elapsed, duration), metadata = artManifest(sprite.scene).characters[id];
  const unmasked = id === 'haku' && variant === 'unmasked';
  const data = (unmasked ? artManifest(sprite.scene).variants.unmasked : metadata).sheets[frame.sheet].frames[frame.index], [, , width, height] = data.rect;
  const [anchorX, anchorY] = data.footAnchor || [width / 2, height * .8];
  sprite.setTexture(`${id}${unmasked ? '-unmasked' : ''}-${frame.sheet}`, String(frame.index)).setOrigin(facing < 0 ? 1 - anchorX / width : anchorX / width, anchorY / height).setFlipX(facing < 0);
  sprite.setScale(CHARACTER[id].height / (unmasked ? artManifest(sprite.scene).variants.unmasked.baseHeight : metadata.baseHeight));
  if(id==='kakashi'&&frame.sheet==='melee')sprite.setTexture('v3-kakashi-melee',String(frame.index)).setOrigin(.5,307/384).setScale(CHARACTER.kakashi.height/232);
  if (id === 'naruto' && variant === 'awakened' && animation === 'idle') {
    sprite.setTexture('v2-naruto-awakened', String(Math.floor(elapsed / 600) % 2)).setOrigin(.5, 307 / 384).setScale(CHARACTER.naruto.height / artManifest(sprite.scene).variants.awakened.baseHeight);
  }
  if (id === 'zabuza' && variant === 'final-stand' && animation !== 'defeat') {
    const index = animation === 'run' || animation === 'dash' ? Math.floor(elapsed / 95) % 6 : animation === 'heavy' ? 6 + Math.min(5, Math.floor(elapsed / 130)) : 11;
    sprite.setTexture('v2-ending-zabuza', String(index)).setOrigin(.5, 307 / 384).setScale(CHARACTER.zabuza.height / artManifest(sprite.scene).variants.ending.baseHeight);
  }
}
export function namedArt(scene: Phaser.Scene, category: 'props' | 'effects', name: string, x: number, y: number, width: number) {
  const frame = artManifest(scene)[category][name];
  if (!frame) throw new Error(`Missing generated ${category} frame: ${name}`);
  const [, , w, h] = frame.rect;
  return scene.add.image(x, y, `v2-${category}`, name).setDisplaySize(width, width * h / w);
}
