/** Presentation only. Extra visual contacts never award damage or resources. */
export function lotusStaging(
  t: number,
  from: { lx: number; ly: number; gx: number; gy: number },
  gated: boolean,
  floor = 586,
) {
  const dir = from.gx >= from.lx ? 1 : -1;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const mix = (a: number, b: number, p: number) => a + (b - a) * clamp(p);
  const gx = from.gx;
  let lx = from.lx,
    ly = from.ly,
    gy = from.gy,
    frame = 0,
    pair = -1;
  let stage: 'charge' | 'rush' | 'launch' | 'bind' | 'descent' | 'impact' =
    'charge';
  if (t < 0.15) {
    frame = 0;
  } else if (t < 0.3) {
    stage = 'rush';
    lx = mix(from.lx, from.gx - dir * 65, (t - 0.15) / 0.15);
  } else if (t < 0.47) {
    stage = 'launch';
    const p = clamp((t - 0.3) / 0.17);
    lx = from.gx - dir * mix(65, gated ? 65 : 30, p);
    ly = mix(from.ly, floor - (gated ? 225 : 205), p);
    gy = mix(from.gy, floor - 205, p);
    frame = 6 + Math.min(5, Math.floor(p * 6));
  } else if (t < 0.68) {
    stage = 'bind';
    const p = clamp((t - 0.47) / 0.21);
    gy = floor - 205 - 25 * Math.sin(p * Math.PI);
    if (gated) {
      const radius = 65 + 55 * Math.sin(p * Math.PI) - 40 * p;
      lx = from.gx - dir * radius * Math.cos(p * Math.PI * 2);
      ly = gy - 20 - 50 * p - 45 * Math.sin(p * Math.PI * 2);
      frame = 12 + Math.min(5, Math.floor(p * 6));
    } else {
      lx = from.gx - dir * 30;
      ly = gy;
      pair = 12 + Math.min(2, Math.floor(p * 3));
    }
  } else if (t < 0.88) {
    stage = 'descent';
    const p = clamp((t - 0.68) / 0.2);
    gy = mix(floor - 205, floor, p * p);
    lx = from.gx - dir * (gated ? 25 : 30);
    ly = gated ? gy - 70 * (1 - p) : gy;
    if (gated) frame = 21 + Math.min(2, Math.floor(p * 3));
    else pair = 15 + Math.min(1, Math.floor(p * 2));
  } else {
    stage = 'impact';
    const p = clamp((t - 0.88) / 0.12);
    gy = floor;
    lx = from.gx - dir * (30 + 65 * p);
    ly = floor - 38 * Math.sin(p * Math.PI);
    frame = 23;
  }
  return { lx, ly, gx, gy, dir, frame, pair, stage };
}
