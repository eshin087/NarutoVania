import { expect, it } from 'vitest';
import { Duel, FLOOR, LEFT, RIGHT, LEE_SKILLS, PHASE_INFO } from './combat';

it('keeps bouncing-volley routes safe through remaining action locks', () => {
  for (const phase of ['shield', 'speed', 'gates'] as const)
    for (const dt of [8, 16, 40])
      for (const x of [LEFT, 640, RIGHT])
        for (const lockMs of [0, 160, 520])
          for (const drift of [-210, 210]) {
            const label = JSON.stringify({ phase, dt, x, lockMs, drift });
            const d = new Duel(phase);
            d.now = 20000;
            d.lee.x = x;
            if (lockMs)
              expect(
                d.lee.start(
                  {
                    ...LEE_SKILLS.skill2,
                    duration: lockMs + 200,
                    cancelAt: 0, // Walking waits for duration, even after cancel opens.
                    events: [],
                  },
                  d.now - 200,
                ),
                label,
              ).toBe(true);
            d.chooseMove();
            const move = d.move!;
            move.gap = x;
            const shots = Array.from({ length: 15 }, (_, i) => {
              const origin = 110 + i * 76;
              const shot = d.makeShot(
                origin,
                175,
                origin + drift,
                FLOOR + 80,
                'spike',
                999,
              );
              if (i % 2 === 0) {
                shot.bounces = 1;
                shot.expiresAt = d.now + 1800;
              }
              return shot;
            });
            expect(d.releaseBarrage(shots, move), label).toBe(true);
            expect(
              d.shots.some((s) => s.bounces === 1),
              label,
            ).toBe(true);
            const start = d.now;
            const distance = Math.abs(move.gap - x);
            const direction = Math.sign(move.gap - x);
            const speed = PHASE_INFO[phase].speed * 0.8;
            let sawBounce = false,
              sawAscent = false;
            for (let time = 0; time < 1800;) {
              const step = Math.min(dt, 1800 - time);
              time += step;
              d.now = start + time;
              d.lee.update(d.now, step); // Expire the actual action; no boss AI.
              d.lee.x =
                x +
                direction *
                  Math.min(
                    distance,
                    (Math.max(0, time - lockMs - 260) / 1000) * speed,
                  );
              d.cues = [];
              d.updateProjectiles(step);
              sawBounce ||= d.cues.some((c) => c.kind === 'bounce');
              sawAscent ||= d.shots.some(
                (s) => s.bounces === 0 && s.bounceWait === 0 && s.vy < 0,
              );
              expect(d.lee.health, label + ' time=' + time).toBe(100);
            }
            expect(sawBounce, label).toBe(true);
            expect(sawAscent, label).toBe(true);
            expect(d.shots, label).toHaveLength(0);
          }
});
