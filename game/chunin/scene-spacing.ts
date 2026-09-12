const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
/** Establish room for a retreat and the Lotus sand-shell reveal, in either facing. */
export function sceneSpacing(lx: number, gx: number) {
  const dir = gx >= lx ? 1 : -1;
  const targetG = clamp(gx, dir > 0 ? 465 : 340, dir > 0 ? 940 : 815);
  const targetL = clamp(lx, 110, 1170);
  return {
    gx: targetG,
    lx:
      Math.abs(targetL - targetG) >= 250 && (targetG - targetL) * dir > 0
        ? targetL
        : targetG - dir * 260,
    dir,
  };
}
