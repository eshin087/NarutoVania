import type {BossGameScene} from './boss-gameplay';
import {bossBridge as bridge} from './boss-bridge';
import {kit} from './chapter';
import type {Action, BattleInput} from './battle-input';

/** Development-only input pilot. It presses the same actions as a keyboard;
 * it never changes health, positions, clocks, boss choices, or story outcomes. */
export async function driveCombat(scene: BossGameScene, inputs: BattleInput, milliseconds: number, noUltimate = false, casual = false) {
  if (bridge.get().screen === 'paused') bridge.command('resume');
  const end = performance.now() + milliseconds;
  let previous: Action[] = [], holdUntil = 0, held: Action[] = [], heavyRelease = 0, lastJump = -9999, lastAttack = -9999;
  const trace: {time: number; actions: Action[]}[] = [];
  while (performance.now() < end && ['playing', 'intro'].includes(bridge.get().screen)) {
    if (bridge.get().screen === 'intro') {await new Promise(resolve => setTimeout(resolve, 24)); continue;}
    const now = scene.now, p = scene.player.model, b = scene.boss.model;
    let actions: Action[] = [];
    const occupied = scene.formation.active ? scene.formation.mirrors[scene.formation.occupied] : null;
    const target = occupied && now >= scene.mirrorInterruptUntil ? occupied : b;
    const distance = Math.abs(target.x - p.x), direction: Action = target.x > p.x ? 'right' : 'left';
    const away: Action = b.x > p.x ? 'left' : 'right';
    const future = b.action?.definition.events.filter(e => b.action!.started + e.at > now);
    const melee = future?.find(e => e.kind === 'hit');
    const nextDamage = future?.find(e => e.kind === 'hit' || e.kind === 'projectile' || e.kind === 'technique' && e.red);
    const delay = nextDamage && b.action ? b.action.started + nextDamage.at - now : 9999;
    const meleeDelay = melee && b.action ? b.action.started + melee.at - now : 9999;
    const floorWarning = b.action?.definition.id === 'great-waterfall' && nextDamage?.red && Math.abs(p.x - scene.targetX) < 125 && delay < 650;
    // React to the visible leading edge, rather than the center of a wide water projectile.
    const incoming = scene.projectiles.filter(q => !q.friendly && q.expires > now && (p.x - q.x) * q.vx > 0).map(q => ({q, seconds: (p.x - q.x) / q.vx - (q.rx + 22) / Math.abs(q.vx)})).filter(({q, seconds}) => seconds > 0 && seconds < .4 && Math.abs(q.y + q.vy * seconds - (p.y - 70)) < q.ry + 62).sort((a, b) => a.seconds - b.seconds)[0];
    const redThreat = !!melee?.red && meleeDelay < 270 && Math.abs(b.x - p.x) < (melee.range || 200) + 80 || !!incoming?.q.red && incoming.seconds < .12;
    // Casual mode deliberately guards early on alternate boss attacks. It never
    // changes combat rules and does not use perfect defense to justify huge HP.
    const guardEarly=casual&&scene.brain.attacks%2===0;
    const parryThreat = !!melee && !melee.red && meleeDelay < (guardEarly?310:105) && Math.abs(b.x - p.x) < (melee.range || 180) + 28 || !!incoming && !incoming.q.red && incoming.seconds < (guardEarly?.3:.1);
    if (now < holdUntil) actions = held;
    else if (floorWarning && p.canAct(now, true)) {
      const evade: Action = scene.targetX < 250 ? 'right' : scene.targetX > scene.arenaMax - 250 ? 'left' : p.x < scene.targetX ? 'left' : 'right';
      actions = delay < 270 && p.stamina >= 22 ? [evade, 'dash'] : [evade];
    }
    else if (redThreat && p.canAct(now, true) && p.stamina >= 22) {
      const evade = incoming?.q.red ? incoming.q.x > p.x ? 'right' : 'left' : p.x < 230 ? 'right' : p.x > scene.arenaMax - 230 ? 'left' : away;
      actions = [evade, 'dash']; held = actions; holdUntil = now + 220;
    } else if (parryThreat && p.canAct(now, true) && p.stamina > 0) {
      const face: Action = incoming ? incoming.q.x > p.x ? 'right' : 'left' : b.x > p.x ? 'right' : 'left';
      actions = [face, 'parry']; held = actions; holdUntil = now + (guardEarly?340:145);
    } else if (p.chargeStarted !== null) {
      actions = now < heavyRelease ? ['down', 'melee'] : [];
    } else if (p.action) {
      if (p.action.definition.action.startsWith('light') && now - p.action.started > p.action.definition.duration - 95 && delay > 550 && p.stamina > 28 && distance < 140) actions = ['melee'];
    } else if (p.stamina < 27) {
      actions = [p.x < 170 ? 'right' : p.x > scene.arenaMax - 170 ? 'left' : away];
    } else if (scene.phase === 'protect' && Math.abs(p.x - 260) > 100) actions = [p.x > 260 ? 'left' : 'right'];
    else if (delay < 520 && Math.abs(p.x - b.x) < 290) actions = [direction];
    else if (!noUltimate && p.ultimate>=100 && delay>780 && (scene.phase!=='mirrors'||scene.sharingan)) {actions=[direction,'ultimate'];lastAttack=now;}
    else if (p.chakra >= 30 && delay > 780 && now - lastAttack > 400 && !previous.some(a => a.startsWith('skill'))) {
      const abilities = kit(scene.phase);
      let choice = noUltimate ? -1 : p.ultimate >= 100 && delay > 1200 && (scene.phase !== 'mirrors' || scene.sharingan) ? 2 : -1;
      if (choice < 0) {
        const order = scene.phase === 'rescue' || scene.phase === 'seal' ? [0, 1] : scene.phase === 'mirrors' || scene.phase === 'protect' ? [0, 1] : [1, 0];
        choice = order.find(i => p.cooldown(abilities[i].attack.id, now) === 0 && (i === 1 || scene.phase !== 'mist' && scene.phase !== 'copy' && scene.phase !== 'lightning') && p.stamina >= abilities[i].attack.stamina) ?? -1;
      }
      if (choice >= 0 && (distance < 700 || occupied)) {actions = [direction, ['skill1', 'skill2', 'ultimate'][choice] as Action]; lastAttack = now;}
    }
    if (!actions.length && !p.action && p.chargeStarted === null && p.stamina >= 30 && !(delay < 520 && Math.abs(p.x - b.x) < 290)) {
      if (occupied && occupied.y < scene.floor - 180) {
        if (distance > 115) actions = [direction];
        else if (p.grounded && now - lastJump > 1100) {actions = [direction, 'jump']; held = actions; holdUntil = now + 330; lastJump = now;}
        else if (!p.grounded) actions = [direction, 'tool'];
      } else if (distance > 102) actions = [direction];
      else if (now - lastAttack > 200 && !previous.includes('melee')) {
        if (b.guardBrokenUntil > now + 1050 && p.stamina > 55) {actions = ['down', 'melee']; heavyRelease = now + 470;}
        else actions = [direction, 'melee'];
        lastAttack = now;
      }
    }
    if (actions.join() !== previous.join()) {inputs.inject(actions); if (trace.length < 90) trace.push({time: Math.round(now), actions}); previous = actions;}
    await new Promise(resolve => setTimeout(resolve, 24));
  }
  inputs.inject([]); if (['playing', 'intro'].includes(bridge.get().screen)) bridge.command('pause');
  return {trace, status: scene.status(), snapshot: bridge.get()};
}
