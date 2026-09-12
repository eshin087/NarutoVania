export interface SandFlight {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces?: number;
  bounceWait?: number;
}
export interface FlightSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  startMs: number;
  endMs: number;
  damaging: boolean;
}
/** One authored floor ricochet. The same piecewise path owns rendering, hits and fairness. */
export function traceSandFlight(input: SandFlight, dt: number, floor = 568) {
  const state = {
    ...input,
    bounces: input.bounces ?? 0,
    bounceWait: input.bounceWait ?? 0,
  };
  const segments: FlightSegment[] = [];
  let at = 0,
    grounded = false,
    bounced = false;
  while (at < dt - 1e-6) {
    if (state.bounceWait > 0) {
      const wait = Math.min(state.bounceWait, dt - at);
      segments.push({
        x1: state.x,
        y1: state.y,
        x2: state.x,
        y2: state.y,
        startMs: at,
        endMs: at + wait,
        damaging: false,
      });
      state.bounceWait -= wait;
      at += wait;
      continue;
    }
    const impact =
      state.vy > 0
        ? Math.max(0, ((floor - state.y) / state.vy) * 1000)
        : Infinity;
    const span = Math.min(dt - at, impact);
    const x = state.x + (state.vx * span) / 1000,
      y = state.y + (state.vy * span) / 1000;
    segments.push({
      x1: state.x,
      y1: state.y,
      x2: x,
      y2: y,
      startMs: at,
      endMs: at + span,
      damaging: true,
    });
    state.x = x;
    state.y = y;
    at += span;
    if (impact <= span + 1e-6) {
      if (state.bounces > 0) {
        state.bounces--;
        state.vy = -Math.abs(state.vy) * 0.8;
        state.y = floor - 0.01;
        state.bounceWait = 180;
        bounced = true;
      } else {
        grounded = true;
        break;
      }
    }
  }
  return { ...state, segments, grounded, bounced };
}
