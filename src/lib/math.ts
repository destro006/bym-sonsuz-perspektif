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
