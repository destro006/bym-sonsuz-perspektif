import * as THREE from 'three';
import { smooth } from '@/lib/math';
import { N as SURFACE_N, toLocal, toWorld } from '../descent/journey';

/**
 * Cinematic camera rig for the whole journey.
 *
 * Cosmic section (p 0 → 0.48): C1-continuous Hermite spline through directed keys
 * (position, look-at target, roll). Tangents are scaled by key spacing in p, so speed never
 * jumps at a key and the path is a pure function of p → fully reversible.
 *
 * Later chapters (p ≥ 0.48): descent spline in the surface tangent frame (see DESCENT below).
 *
 * World layout (composition, not astronomy): the galaxy sits at GALAXY_CENTER between the
 * opening vantage point (z≈130) and the Earth at the origin. The camera flies through the
 * cosmic dust, banks along the spiral arms, threads the core and exits towards the Earth.
 */
// [p, posX, posY, posZ, targetX, targetY, targetZ, roll]
const COSMOS: readonly (readonly number[])[] = [
  [0.000, 15.0, 8.0, 131.0, -8.0, 2.0, 30.0, 0.00],
  [0.060, 11.0, 6.2, 114.0, -6.0, 1.2, 30.0, -0.03],
  [0.120, 2.5, 9.5, 94.0, -3.0, 0.0, 30.0, 0.04],
  [0.170, -13.0, 7.5, 67.0, 0.0, -1.0, 30.0, 0.12],
  [0.210, -16.5, 3.2, 47.0, -1.0, 0.0, 30.0, 0.18],
  [0.245, -6.8, 1.1, 35.5, 1.5, -0.4, 26.0, 0.10],
  [0.270, 0.9, 0.35, 27.6, 0.0, 0.0, 12.0, 0.02],
  [0.300, 0.4, 0.40, 18.5, 0.0, 0.0, 0.0, 0.00],
  [0.340, 0.1, 0.25, 11.2, 0.0, 0.0, 0.0, 0.00],
  [0.400, 0.0, 0.00, 7.6, 0.0, 0.0, 0.0, 0.00],
  [0.480, 0.0, 0.00, 6.9, 0.0, 0.0, 0.0, 0.00],
];
const N = COSMOS[0].length - 1;
/** Per-key tangents (d value / d p). End keys rest, so the spline meets the old track at zero speed. */
const TAN = COSMOS.map((k, i) => {
  if (i === 0 || i === COSMOS.length - 1) return new Array(N).fill(0);
  const a = COSMOS[i - 1], b = COSMOS[i + 1];
  return Array.from({ length: N }, (_, c) => (b[c + 1] - a[c + 1]) / (b[0] - a[0]));
});

/**
 * Descent chapters (p ≥ 0.48), authored in the tangent frame at the descent point (see descent/journey.ts):
 * x = east, y = up, z = forward over the city. Values are world units; once the zoom reaches Z=1000
 * they coincide with city units. The camera arcs over the planet, descends obliquely (never straight
 * down, never a pure zoom), skims the forming city, then locks onto the featured mass.
 */
const c0 = toLocal(new THREE.Vector3(0, 0, 6.9), new THREE.Vector3());
const t0 = toLocal(new THREE.Vector3(0, 0, 0), new THREE.Vector3());
const DESCENT: readonly (readonly number[])[] = [
  [0.480, c0.x, c0.y, c0.z, t0.x, t0.y, t0.z, 0],
  [0.530, -0.9, 3.0, -3.2, 0.0, -0.9, 0.3, 0.02],
  [0.580, -0.35, 2.3, -3.0, 0.0, -0.1, 0.6, 0.05],
  [0.630, 0.4, 2.05, -3.4, 0.1, 0.0, 0.8, 0.03],
  [0.670, 0.6, 2.4, -5.5, 0.4, 0.0, 1.0, -0.02],
  [0.710, -2.6, 2.7, -11.0, 0.0, 0.7, -1.0, -0.025],
  [0.745, -4.1, 2.05, -3.2, 0.6, 1.3, 5.0, -0.04],
  [0.775, -0.6, 2.55, 2.0, 2.0, 2.0, 8.0, -0.015],
  [0.810, 1.25, 2.5, 4.55, 2.0, 2.3, 8.0, 0.0],
  [1.000, 1.6, 2.62, 5.2, 2.0, 2.4, 8.0, 0.0],
];
const D_TAN = DESCENT.map((k, i) => {
  if (i === 0 || i === DESCENT.length - 1) return new Array(7).fill(0);
  const a = DESCENT[i - 1], b = DESCENT[i + 1];
  return Array.from({ length: 7 }, (_, c) => (b[c + 1] - a[c + 1]) / (b[0] - a[0]));
});

const out = new Array(N).fill(0);
function sampleKeys(p: number, KEYS: readonly (readonly number[])[] = COSMOS, TANGENTS: number[][] = TAN) {
  const last = KEYS[KEYS.length - 1];
  if (p <= KEYS[0][0]) { for (let c = 0; c < N; c++) out[c] = KEYS[0][c + 1]; return out; }
  if (p >= last[0]) { for (let c = 0; c < N; c++) out[c] = last[c + 1]; return out; }
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1], h = b[0] - a[0];
  const t = (p - a[0]) / h, t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  const ma = TANGENTS[i], mb = TANGENTS[i + 1];
  for (let c = 0; c < N; c++) out[c] = h00 * a[c + 1] + h10 * h * ma[c] + h01 * b[c + 1] + h11 * h * mb[c];
  return out;
}

export type CameraSample = { pos: THREE.Vector3; target: THREE.Vector3; roll: number };

export function sampleCamera(p: number, s: CameraSample) {
  if (p <= 0.48) {
    const v = sampleKeys(p);
    s.pos.set(v[0], v[1], v[2]);
    s.target.set(v[3], v[4], v[5]);
    s.roll = v[6];
    return s;
  }
  const v = sampleKeys(p, DESCENT, D_TAN);
  toWorld(lp.set(v[0], v[1], v[2]), s.pos);
  toWorld(lp.set(v[3], v[4], v[5]), s.target);
  s.roll = v[6];
  return s;
}
const lp = new THREE.Vector3();
/** Camera up vector: world-up while orbiting the planet, the local surface up once over the city. */
export function cameraUp(p: number, out: THREE.Vector3) {
  return out.set(0, 1, 0).lerp(SURFACE_N, smooth(0.6, 0.7, p)).normalize();
}

const a: CameraSample = { pos: new THREE.Vector3(), target: new THREE.Vector3(), roll: 0 };
const b: CameraSample = { pos: new THREE.Vector3(), target: new THREE.Vector3(), roll: 0 };
/** World-space d(position)/d(progress), used to derive camera velocity for star streaks. */
export function cameraDerivative(p: number, outV: THREE.Vector3) {
  const e = 0.0015;
  const p0 = Math.max(0, p - e), p1 = Math.min(1, p + e);
  sampleCamera(p0, a); sampleCamera(p1, b);
  return outV.subVectors(b.pos, a.pos).divideScalar(Math.max(1e-5, p1 - p0));
}
