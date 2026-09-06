import type {AttackDefinition} from './combat-core';

/** Contact is frame 3, exactly at the combat event. Every strike has its own windup. */
export function swordPresentation(attack: AttackDefinition, age: number) {
  const hits = attack.events.filter(e => e.kind === 'hit');
  if (!hits.length) return null;
  let index = hits.findIndex(e => age < e.at + 280);
  if (index < 0) index = hits.length - 1;
  const hit = hits[index], start = index ? hits[index - 1].at + 280 : 0;
  const row = hit.red ? 2 : attack.id === 'silent-killing' ? 1 : [0, 1, 3][index % 3];
  const remaining = hit.at - age;
  const frame = remaining > 0 ? Math.min(2, Math.floor(Math.max(0, age - start) / Math.max(1, hit.at - start - 180) * 3)) : age < hit.at + 80 ? 3 : age < hit.at + 190 ? 4 : 5;
  return {frame: row * 6 + frame, row, red: !!hit.red, remaining, contact: remaining <= 0 && remaining > -190};
}
