import * as Phaser from 'phaser';
import source from '../../public/art-chunin/manifest.json';
import type { AnimationName } from '../combat-core';
interface Frame {
  index: number;
  rect: number[];
  root: number[];
  head: number[];
  hand: number[];
}
interface Asset {
  file: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frames: Frame[];
}
const assets = source.assets as unknown as Record<string, Asset>;
export function preloadArt(scene: Phaser.Scene) {
  for (const [id, a] of Object.entries(assets)) {
    if (id === 'reference') continue;
    if (a.columns === 1) scene.load.image(`ch-${id}`, a.file);
    else
      scene.load.spritesheet(`ch-${id}`, a.file, {
        frameWidth: a.frameWidth,
        frameHeight: a.frameHeight,
      });
  }
}
export function registerArt(_scene: Phaser.Scene) {}
export function pose(
  sprite: Phaser.GameObjects.Sprite,
  id: 'lee' | 'gaara' | 'guy' | 'hayate',
  animation: AnimationName,
  time: number,
  facing: number,
  gates = false,
  duration = 400,
) {
  let key = id === 'guy' || id === 'hayate' ? 'support' : id,
    frame = 0;
  if (id === 'lee') {
    if (animation === 'run') frame = 6 + (Math.floor(time / 76) % 6);
    else if (
      ['light1', 'light2', 'light3', 'heavy'].includes(animation) &&
      assets['lee-combo']
    ) {
      key = 'lee-combo';
      const row = animation === 'light1' ? 0 : animation === 'light2' ? 1 : 2;
      frame =
        row * 6 + Math.min(5, Math.floor((time / Math.max(1, duration)) * 6));
    } else if (animation === 'light1') frame = 12 + (Math.floor(time / 90) % 2);
    else if (animation === 'light2') frame = 14;
    else if (animation === 'light3' || animation === 'heavy') frame = 15;
    else if (animation === 'aerial') frame = 17;
    else if (animation === 'jump' || animation === 'airdash') frame = 20;
    else if (animation === 'dash' || animation === 'slide') frame = 10;
    else if (animation === 'hurt') frame = 18;
    else if (animation === 'block' || animation === 'parry') frame = 19;
    else if (animation === 'guardbreak' || animation === 'land') frame = 22;
    else if (animation === 'defeat') frame = 23;
    else if (animation === 'ultimate' || animation === 'cast') frame = 21;
    else
      frame = time % 5200 > 4600 ? 1 + (Math.floor((time % 600) / 200) % 3) : 0;
  } else if (id === 'gaara') {
    if (animation === 'cast') frame = 6 + (Math.floor(time / 145) % 6);
    else if (animation === 'hurt') frame = 14;
    else if (animation === 'guardbreak' || animation === 'land') frame = 20;
    else if (animation === 'defeat') frame = 22;
    else if (animation === 'block' || animation === 'parry') frame = 13;
    else
      frame = time % 5700 > 5100 ? 1 + (Math.floor((time % 600) / 200) % 3) : 0;
  } else if (id === 'guy')
    frame =
      animation === 'run'
        ? 1
        : animation === 'block'
          ? 2
          : animation === 'land'
            ? 3
            : 0;
  else frame = 4 + (animation === 'run' ? 2 : 0);
  const a = assets[key];
  if (!a || !sprite.scene.textures.exists(`ch-${key}`)) return;
  const meta = a.frames[Math.min(frame, a.frames.length - 1)];
  sprite
    .setTexture(`ch-${key}`, frame)
    .setOrigin(meta.root[0] / a.frameWidth, meta.root[1] / a.frameHeight)
    .setFlipX(facing < 0)
    .setScale(
      id === 'lee'
        ? key === 'lee-combo'
          ? 0.59
          : animation === 'run'
            ? 0.62
            : 0.66
        : id === 'gaara'
          ? 0.55
          : 0.39,
    )
    .setRotation(0);
  if (gates) sprite.setTint(0xeaffb2);
  else sprite.clearTint();
}
