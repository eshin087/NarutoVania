import type {AnimationName} from './combat-core';
export type SpriteSheet = 'locomotion' | 'melee' | 'techniques';
export interface AnimationFrame {sheet: SpriteSheet; index: number; weight: number;}
export interface AnimationSequence {frames: AnimationFrame[]; duration: number; loop: boolean; events?: {at: number; event: string; attachment: [number, number]}[];}
const frames = (sheet: SpriteSheet, indices: number[], weights?: number[]) => indices.map((index, i) => ({sheet, index, weight: weights?.[i] || 1}));
const sequence = (sheet: SpriteSheet, indices: number[], duration: number, loop = false, weights?: number[]): AnimationSequence => ({frames: frames(sheet, indices, weights), duration, loop});
export const ANIMATIONS: Record<AnimationName, AnimationSequence> = {
  idle: sequence('locomotion', [6, 7], 1200, true), run: {...sequence('locomotion', [0, 1, 2, 3, 4, 5], 510, true), events: [{at: 85, event: 'step', attachment: [0, 0]}, {at: 340, event: 'step', attachment: [0, 0]}]},
  jump: sequence('locomotion', [8, 9], 650), land: sequence('locomotion', [10, 11], 145),
  dash: sequence('locomotion', [12, 13, 14, 15], 220), airdash: sequence('locomotion', [18, 19, 20, 21], 220),
  slide: {frames: [...frames('locomotion', [22, 23]), ...frames('techniques', [4, 5])], duration: 350, loop: false},
  block: sequence('techniques', [6, 7], 580, true), parry: sequence('techniques', [0, 1, 2, 3], 240),
  guardbreak: sequence('techniques', [8, 9], 600, true), hurt: sequence('techniques', [10, 11], 200), defeat: sequence('techniques', [22, 23], 1200),
  light1: sequence('melee', [0, 1, 2, 3, 4, 5], 390, false, [1, 1, .5, 1, 1, 1.5]),
  light2: sequence('melee', [6, 7, 8, 9, 10, 11], 425, false, [1, 1, .7, 1, 1, 1.3]),
  light3: sequence('melee', [12, 13, 14, 15, 16, 17], 520, false, [1, 1, .8, 1, 1, 1.2]),
  heavy: sequence('melee', [18, 19, 20, 21, 22, 23], 770, false, [1.1, 1.2, .6, 1.2, 1, 1.3]),
  cast: sequence('techniques', [12, 13, 14, 15, 16, 17], 620), ultimate: sequence('techniques', [18, 19, 20, 21], 1100),
};
export function animationFrame(name: AnimationName, elapsed: number, duration?: number) {
  const definition = ANIMATIONS[name], period = duration || definition.duration;
  const progress = definition.loop ? (Math.max(0, elapsed) % period) / period : Math.min(.99999, Math.max(0, elapsed) / period);
  const total = definition.frames.reduce((sum, frame) => sum + frame.weight, 0); let weight = progress * total;
  return definition.frames.find(frame => (weight -= frame.weight) < 0) || definition.frames.at(-1)!;
}
