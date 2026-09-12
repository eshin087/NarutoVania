import * as Phaser from 'phaser';
import source from '../../public/art-chunin/manifest.json';
import type { AnimationName } from '../combat-core';
interface Frame {
  index: number;
  rect: number[];
  root: number[];
  head: number[];
  hand: number[];
  scale?: number;
}
interface Asset {
  file: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frames: Frame[];
  scale?: number;
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
export function framePose(
  sprite: Phaser.GameObjects.Sprite,
  key: string,
  frame: number,
  facing = 1,
  scale?: number,
) {
  const a = assets[key];
  if (!a || !sprite.scene.textures.exists(`ch-${key}`)) return false;
  frame = Math.max(0, Math.min(a.frames.length - 1, frame));
  const meta = a.frames[frame];
  sprite
    .setTexture(`ch-${key}`, frame)
    .setOrigin(
      (facing < 0 ? a.frameWidth - meta.root[0] : meta.root[0]) / a.frameWidth,
      meta.root[1] / a.frameHeight,
    )
    .setFlipX(facing < 0)
    .setScale(scale ?? meta.scale ?? a.scale ?? 0.6)
    .setRotation(0);
  return true;
}
/** Frame 3 owns contact. Anticipation and recovery remain tied to gameplay event time. */
export function contactFrame(age: number, duration: number, hitAt: number) {
  return age < hitAt
    ? Math.min(2, Math.floor((Math.max(0, age) / Math.max(1, hitAt)) * 3))
    : Math.min(
        5,
        3 + Math.floor(((age - hitAt) / Math.max(1, duration - hitAt)) * 3),
      );
}
export function pose(
  sprite: Phaser.GameObjects.Sprite,
  id: 'lee' | 'gaara' | 'guy' | 'hayate',
  animation: AnimationName,
  time: number,
  facing: number,
  gates = false,
  duration = 400,
) {
  if (id === 'guy' && assets['guy-actions']) {
    framePose(
      sprite,
      'guy-actions',
      animation === 'run'
        ? Math.floor(time / 75) % 6
        : animation === 'block'
          ? 10
          : animation === 'land'
            ? 11
            : 6,
      facing,
    );
    return;
  }
  if (id === 'gaara' && assets['gaara-actions']) {
    const frame =
      animation === 'hurt'
        ? 19 + Math.min(3, Math.floor(time / 65) % 4)
        : animation === 'guardbreak' || animation === 'land'
          ? 22
          : animation === 'defeat'
            ? 22
            : animation === 'cast'
              ? contactFrame(time % 950, 950, 550)
              : animation === 'block' || animation === 'parry'
                ? 0
                : 5;
    framePose(sprite, 'gaara-actions', frame, facing);
    return;
  }
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
    .setOrigin(
      (facing < 0 ? a.frameWidth - meta.root[0] : meta.root[0]) / a.frameWidth,
      meta.root[1] / a.frameHeight,
    )
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
