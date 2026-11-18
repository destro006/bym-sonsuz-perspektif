export function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}
export function mix(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t);
}
export function smooth(a: number, b: number, value: number) {
  const x = clamp((value - a) / (b - a));
  return x * x * (3 - 2 * x);
}
export function pulse(a: number, b: number, c: number, d: number, value: number) {
  return smooth(a, b, value) * (1 - smooth(c, d, value));
}

/** Deterministic PRNG so particle layouts are identical on every load and every device. */
export function seeded(seed: number) {
  let value = seed >>> 0;
  return () => { value = (1664525 * value + 1013904223) >>> 0; return value / 4294967296; };
}

export type Key = readonly [p: number, ...values: number[]];
/**
 * Continuous keyframe track: smoothstep between neighbouring keys, so the value is a pure,
 * jump-free function of progress (identical going forward, backward or after a jump).
 */
export function track(keys: readonly Key[], p: number, out: number[]) {
  const n = keys[0].length - 1;
  if (p <= keys[0][0]) { for (let i = 0; i < n; i++) out[i] = keys[0][i + 1]; return out; }
  for (let k = 1; k < keys.length; k++) {
    const a = keys[k - 1], b = keys[k];
    if (p <= b[0]) {
      const t = smooth(a[0], b[0], p);
      for (let i = 0; i < n; i++) out[i] = a[i + 1] + (b[i + 1] - a[i + 1]) * t;
      return out;
    }
  }
  const last = keys[keys.length - 1];
  for (let i = 0; i < n; i++) out[i] = last[i + 1];
  return out;
}
