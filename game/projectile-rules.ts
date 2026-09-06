import {overlaps, type Facing} from './combat-core';
export interface Rect {x: number; y: number; width: number; height: number;}
/** Swept bounding region prevents fast needles passing through a hurtbox between frames. */
export function projectileSweep(x: number, y: number, nextX: number, nextY: number, radiusX: number, radiusY: number): Rect {
  return {x: Math.min(x, nextX) - radiusX, y: Math.min(y, nextY) - radiusY, width: Math.abs(nextX - x) + radiusX * 2, height: Math.abs(nextY - y) + radiusY * 2};
}
export function attackBounds(x: number, footY: number, facing: Facing, range: number, height: number): Rect {
  return {x: facing > 0 ? x + 8 : x - range - 8, y: footY - height, width: range, height};
}
export function attackReaches(attacker: {x: number; y: number; facing: Facing}, target: Rect, range: number, height: number) {
  return overlaps(attackBounds(attacker.x, attacker.y, attacker.facing, range, height), target);
}
export function fixedAim(from: {x: number; y: number}, to: {x: number; y: number}, speed: number, offset = 0) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x) + offset;
  return {vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle};
}
