import { traceSandFlight } from './sand-flight';
/** Chapter 2 only. Inputs are a snapshot at `now`; all supplied shots are hostile. */
export interface SandTrajectory {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  expiresAt?: number;
  bounces?: number;
  bounceWait?: number;
}
export interface SandZone {
  x: number;
  width: number;
  hitAt: number;
}
export interface SandVolleyPlanInput {
  player: { x: number; speed: number; lockMs: number };
  desiredGap: number;
  existing: readonly SandTrajectory[];
  proposed: readonly SandTrajectory[];
  zones: readonly SandZone[];
  now: number;
  left?: number;
  right?: number;
  floor?: number;
  horizonMs?: number;
}
export interface SandVolleyPlan {
  /** Original proposal indices, in original order. Entity allowance belongs to the caller. */
  retainedIndices: number[];
  /** A 180px-wide interval of player centers is safe after the planned arrival. */
  gap: number;
}
const CORRIDOR_HALF = 90,
  BODY_HALF = 23,
  BODY_HEIGHT = 106;
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** Closed intersection: grazing a damaging core is conservatively unsafe. */
function segmentBox(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
) {
  let lo = 0,
    hi = 1;
  for (const [origin, delta, min, max] of [
    [x1, x2 - x1, left, right],
    [y1, y2 - y1, top, bottom],
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (origin < min || origin > max) return false;
    } else {
      const a = (min - origin) / delta,
        b = (max - origin) / delta;
      lo = Math.max(lo, Math.min(a, b));
      hi = Math.min(hi, Math.max(a, b));
      if (lo > hi) return false;
    }
  }
  return true;
}

/** Never mutates/deletes existing threats. Null means delay or omit the new emission. */
export function planSandVolley(
  input: SandVolleyPlanInput,
): SandVolleyPlan | null {
  const { player, existing, proposed, zones, now } = input;
  const left = input.left ?? 90,
    right = input.right ?? 1190,
    floor = input.floor ?? 586;
  const horizon = clamp(input.horizonMs ?? 1800, 0, 1800) / 1000;
  const hold = (Math.max(0, player.lockMs) + 260) / 1000;
  const speed = Math.max(0, player.speed) * 0.8;
  // Runtime sweeps shots against the receiver's current frame position. Reserve
  // one maximum (40ms) walking displacement so a safe continuous route stays safe.
  const frameMargin = speed * 0.04;
  if (
    right - left < CORRIDOR_HALF * 2 ||
    player.x < left ||
    player.x > right ||
    !horizon
  )
    return null;
  const fit = (x: number) =>
    clamp(x, left + CORRIDOR_HALF, right - CORRIDOR_HALF);
  const candidates = [
    ...new Set(
      [
        input.desiredGap,
        player.x,
        input.desiredGap - 120,
        input.desiredGap + 120,
        player.x - 120,
        player.x + 120,
        left + CORRIDOR_HALF,
        right - CORRIDOR_HALF,
      ].map(fit),
    ),
  ];
  let best: SandVolleyPlan | null = null;
  for (const gap of candidates) {
    const distance = Math.abs(gap - player.x);
    const arrival = distance === 0 ? hold : hold + distance / speed;
    if (!Number.isFinite(arrival) || arrival > horizon) continue;
    const direction = Math.sign(gap - player.x);
    const playerX = (t: number) =>
      player.x + direction * Math.min(distance, Math.max(0, t - hold) * speed);
    const collides = (shot: SandTrajectory) => {
      const end = Math.min(
        horizon,
        ((shot.expiresAt ?? Infinity) - now) / 1000,
      );
      if (end < 0) return false;
      const flight = traceSandFlight(shot, end * 1000, floor - 18);
      for (const segment of flight.segments) {
        if (!segment.damaging) continue;
        const begin = segment.startMs / 1000,
          finish = segment.endMs / 1000;
        const cuts = [
          ...new Set([
            begin,
            finish,
            clamp(hold, begin, finish),
            clamp(arrival, begin, finish),
          ]),
        ].sort((a, b) => a - b);
        const point = (t: number) => {
          const f = finish === begin ? 0 : (t - begin) / (finish - begin);
          return {
            x: segment.x1 + (segment.x2 - segment.x1) * f,
            y: segment.y1 + (segment.y2 - segment.y1) * f,
          };
        };
        for (let i = 0; i < cuts.length - 1; i++) {
          const a = cuts[i],
            b = cuts[i + 1],
            p = point(a),
            q = point(b);
          const half =
            BODY_HALF +
            shot.radius +
            frameMargin +
            (a >= arrival ? CORRIDOR_HALF : 0);
          if (
            segmentBox(
              p.x - playerX(a),
              p.y,
              q.x - playerX(b),
              q.y,
              -half,
              floor - BODY_HEIGHT - shot.radius,
              half,
              floor + shot.radius,
            )
          )
            return true;
        }
      }
      return false;
    };
    if (existing.some(collides)) continue;
    if (
      zones.some((zone) => {
        const t = (zone.hitAt - now) / 1000;
        return (
          t >= 0 &&
          t <= horizon &&
          Math.abs(zone.x - playerX(t)) <=
            zone.width / 2 +
              BODY_HALF +
              frameMargin +
              (t >= arrival ? CORRIDOR_HALF : 0)
        );
      })
    )
      continue;
    const retainedIndices = proposed.flatMap((shot, index) =>
      collides(shot) ? [] : [index],
    );
    // Stable candidate order is the tie-breaker; zero-shot plans do not count as emissions.
    if (
      retainedIndices.length &&
      (!best || retainedIndices.length > best.retainedIndices.length)
    )
      best = { gap, retainedIndices };
  }
  return best;
}
