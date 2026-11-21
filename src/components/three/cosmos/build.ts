import * as THREE from 'three';
import { seeded } from '@/lib/math';
import { sampleCamera, type CameraSample } from './cameraPath';

/**
 * Deterministic (seeded) generators for every particle layer of the cosmic intro.
 * Artistic composition — NOT an astronomical dataset.
 */

export type Tier = 'high' | 'medium' | 'low';

export const BUDGET: Record<Tier, {
  wake: number; farStars: number; pathStars: number; streaks: number; dust: number; clouds: number;
  curves: number; filament: number; galaxy: number; lanes: number;
  skyOctaves: number; post: boolean; bloomScale: number;
}> = {
  high:   { wake: 9000, farStars: 18000, pathStars: 9000, streaks: 2600, dust: 30000, clouds: 4200, curves: 64, filament: 56000, galaxy: 120000, lanes: 9000, skyOctaves: 5, post: true, bloomScale: 1 },
  medium: { wake: 4500, farStars: 9000, pathStars: 4500, streaks: 1200, dust: 12000, clouds: 2000, curves: 40, filament: 22000, galaxy: 52000, lanes: 4000, skyOctaves: 4, post: true, bloomScale: 0.5 },
  low:    { wake: 2000, farStars: 5000, pathStars: 2200, streaks: 500, dust: 5000, clouds: 800, curves: 24, filament: 9000, galaxy: 20000, lanes: 0, skyOctaves: 3, post: false, bloomScale: 0.5 },
};

export const GALAXY_CENTER = new THREE.Vector3(0, 0, 30);
export const GALAXY_RADIUS = 27;
export const GALAXY_EULER = new THREE.Euler(0.7, 0, 0.3, 'XYZ');
export const GALAXY_QUAT = new THREE.Quaternion().setFromEuler(GALAXY_EULER);
export const GALAXY_TILT = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(GALAXY_EULER));
export const CURVE_SAMPLES = 128;

type Rand = () => number;
const gauss = (r: Rand) => {
  const u = Math.max(1e-7, r()), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/* ---------- seeded 3D value noise (CPU, generation only) ---------- */
function hash3(x: number, y: number, z: number, seed: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683) + seed) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function valueNoise(x: number, y: number, z: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(hash3(xi, yi, zi, seed), hash3(xi + 1, yi, zi, seed), u), l(hash3(xi, yi + 1, zi, seed), hash3(xi + 1, yi + 1, zi, seed), u), v),
    l(l(hash3(xi, yi, zi + 1, seed), hash3(xi + 1, yi, zi + 1, seed), u), l(hash3(xi, yi + 1, zi + 1, seed), hash3(xi + 1, yi + 1, zi + 1, seed), u), v),
    w);
}
function fbm(x: number, y: number, z: number, seed: number, oct = 4) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * valueNoise(x * f, y * f, z * f, seed + i * 17); n += a; a *= 0.5; f *= 2.03; }
  return s / n;
}

/* ---------- palette ---------- */
const PAL = {
  blue: [0.36, 0.52, 1.0], violet: [0.58, 0.42, 1.0], silver: [0.78, 0.83, 0.95], gold: [1.0, 0.76, 0.44],
  core: [1.0, 0.84, 0.6], white: [1.0, 0.96, 0.9],
} as const;
function put(arr: Float32Array, i: number, c: readonly number[], k = 1) { arr[i] = c[0] * k; arr[i + 1] = c[1] * k; arr[i + 2] = c[2] * k; }
/** Approximate stellar colour temperature (red dwarf → blue giant), biased to white/yellow like real fields. */
function starColor(r: Rand, out: Float32Array, i: number, k: number) {
  const t = r();
  const c = t < 0.12 ? [1.0, 0.66, 0.46] : t < 0.38 ? [1.0, 0.86, 0.7] : t < 0.7 ? [1.0, 0.97, 0.94] : t < 0.9 ? [0.82, 0.88, 1.0] : [0.62, 0.74, 1.0];
  put(out, i, c, k);
}
/** Keep the Earth's neighbourhood clean so the planet reveal is never cluttered. */
const nearEarth = (x: number, y: number, z: number) => x * x + y * y + z * z < 15 * 15;

/* ---------- stars ---------- */
export function buildFarStars(count: number) {
  const r = seeded(4242);
  const position = new Float32Array(count * 3), color = new Float32Array(count * 3), size = new Float32Array(count), tw = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    // A faint galactic band: denser near a tilted great circle.
    let x = s * Math.cos(th), y = u, z = s * Math.sin(th);
    if (r() < 0.45) { y *= 0.22; const c = Math.cos(0.5), sn = Math.sin(0.5); const ny = y * c - x * sn; x = x * c + y * sn; y = ny; const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l; }
    const R = 260 + r() * 140;
    position[i * 3] = x * R; position[i * 3 + 1] = y * R; position[i * 3 + 2] = z * R + 60;
    const bright = Math.pow(r(), 6);
    size[i] = 0.55 + bright * 2.6;
    starColor(r, color, i * 3, 0.55 + bright * 1.8);
    tw[i] = 0.6 + r() * 2.8;
  }
  return { position, color, size, tw };
}

const cs: CameraSample = { pos: new THREE.Vector3(), target: new THREE.Vector3(), roll: 0 };
/** Stars scattered in a tube around the camera path → strong parallax and streak sources. */
export function buildPathStars(count: number) {
  const r = seeded(9001);
  const position = new Float32Array(count * 3), color = new Float32Array(count * 3), size = new Float32Array(count), tw = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    sampleCamera(r() * 0.33, cs);
    const rad = 4 + Math.pow(r(), 1.6) * 60;
    const a = r() * Math.PI * 2, along = (r() - 0.5) * 20;
    const x = cs.pos.x + Math.cos(a) * rad, y = cs.pos.y + Math.sin(a) * rad * 0.8, z = cs.pos.z + along;
    if (nearEarth(x, y, z)) { i--; continue; }
    position[i * 3] = x; position[i * 3 + 1] = y; position[i * 3 + 2] = z;
    const bright = Math.pow(r(), 5);
    size[i] = 0.035 + bright * 0.12;
    starColor(r, color, i * 3, 0.6 + bright * 1.6);
    tw[i] = 0.8 + r() * 3.2;
  }
  return { position, color, size, tw };
}

/** Galactic wake: luminous matter around the exit path (core → Earth), so the handoff is never empty. */
export function buildWake(count: number) {
  const r = seeded(6161);
  const position = new Float32Array(count * 3), color = new Float32Array(count * 3), size = new Float32Array(count), tw = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    sampleCamera(0.255 + r() * 0.1, cs);
    const rad = 1.6 + Math.pow(r(), 1.3) * 16, a = r() * Math.PI * 2;
    const x = cs.pos.x + Math.cos(a) * rad, y = cs.pos.y + Math.sin(a) * rad * 0.75, z = cs.pos.z + (r() - 0.5) * 6;
    if (nearEarth(x, y, z)) { i--; continue; }
    position[i * 3] = x; position[i * 3 + 1] = y; position[i * 3 + 2] = z;
    const t = r();
    put(color, i * 3, t < 0.5 ? PAL.blue : t < 0.75 ? PAL.silver : t < 0.9 ? PAL.violet : PAL.gold, 0.25 + Math.pow(r(), 3) * 1.2);
    size[i] = 0.025 + Math.pow(r(), 4) * 0.09;
    tw[i] = 0.5 + r() * 2;
  }
  return { position, color, size, tw };
}

/* ---------- filaments (flow-field integrated curves, stored in a float texture) ---------- */
export function buildFilaments(nCurves: number) {
  const r = seeded(1977);
  const S = CURVE_SAMPLES;
  const data = new Float32Array(nCurves * S * 4);
  const curves: THREE.Vector3[][] = [];
  const p = new THREE.Vector3(), d = new THREE.Vector3(), f = new THREE.Vector3(), toC = new THREE.Vector3();
  const field = (q: THREE.Vector3, o: THREE.Vector3) => {
    const s = 0.045;
    o.set(
      Math.sin(q.y * s * 1.3 + 1.7) + Math.cos(q.z * s * 0.9 + 0.4),
      Math.sin(q.z * s * 1.1 + 2.3) + Math.cos(q.x * s * 1.2 + 5.1),
      Math.sin(q.x * s * 0.8 + 0.9) + Math.cos(q.y * s * 1.4 + 3.3),
    );
    toC.subVectors(GALAXY_CENTER, q);
    const dist = toC.length();
    // Far filaments lean toward the galaxy; within ~35 units they swirl around it (tangential),
    // so the web stays a web instead of collapsing into one ball.
    toC.normalize();
    const tang = new THREE.Vector3(-toC.z, 0, toC.x);
    o.addScaledVector(toC, 0.28 * Math.min(1, Math.max(0, dist - 25) / 40));
    o.addScaledVector(tang, 0.35 * Math.max(0, 1 - dist / 40));
    return o.normalize();
  };
  for (let c = 0; c < nCurves; c++) {
    const branch = c > nCurves * 0.45 && curves.length > 0;
    if (branch) {
      const parent = curves[Math.floor(r() * curves.length)];
      p.copy(parent[Math.floor(r() * S * 0.7)]);
      d.set(gauss(r), gauss(r), gauss(r)).normalize();
    } else {
      do { p.set((r() - 0.5) * 110, (r() - 0.5) * 70, -10 + r() * 150); } while (nearEarth(p.x, p.y, p.z));
      d.set(0, 0, 0);
    }
    const pts: THREE.Vector3[] = [];
    const step = 0.55 + r() * 0.35;
    const seed = r() * 100;
    for (let i = 0; i < S; i++) {
      pts.push(p.clone());
      const k = (c * S + i) * 4;
      data[k] = p.x; data[k + 1] = p.y; data[k + 2] = p.z;
      // Thickness: knots and pinches along the stream.
      data[k + 3] = 0.25 + 1.1 * Math.pow(fbm(i * 0.07, seed, 0, 31, 3), 2.2) * 2.2;
      field(p, f);
      d.lerp(f, branch && i < 12 ? 0.18 : 0.35).normalize();
      p.addScaledVector(d, step);
    }
    curves.push(pts);
  }
  return { data, curves };
}

export function buildFilamentParticles(count: number, nCurves: number) {
  const r = seeded(555);
  const fil = new Float32Array(count * 4), offset = new Float32Array(count * 3), color = new Float32Array(count * 3), size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    fil[i * 4] = Math.floor(r() * nCurves);
    fil[i * 4 + 1] = r();
    fil[i * 4 + 2] = (0.5 + r() * 1.0) * (r() < 0.12 ? -0.6 : 1);
    fil[i * 4 + 3] = r() * 100;
    const tight = r() < 0.72;
    const spread = tight ? 0.13 : 0.75;
    offset[i * 3] = gauss(r) * spread; offset[i * 3 + 1] = gauss(r) * spread; offset[i * 3 + 2] = gauss(r) * spread;
    const t = r();
    const c = t < 0.6 ? PAL.blue : t < 0.8 ? PAL.silver : t < 0.93 ? PAL.violet : PAL.gold;
    put(color, i * 3, c, tight ? 0.5 + r() * 0.7 : 0.08 + r() * 0.12);
    size[i] = tight ? 0.13 + Math.pow(r(), 3) * 0.32 : 0.3 + r() * 0.5;
  }
  return { fil, offset, color, size };
}

/* ---------- cosmic dust ---------- */
export function buildDust(count: number, curves: THREE.Vector3[][]) {
  const r = seeded(31337);
  const position = new Float32Array(count * 3), color = new Float32Array(count * 3), params = new Float32Array(count * 2);
  let i = 0, tries = 0;
  while (i < count && tries < count * 40) {
    tries++;
    let x: number, y: number, z: number;
    if (r() < 0.7) {
      // Clouds that hug the filaments.
      const cv = curves[Math.floor(r() * curves.length)];
      const q = cv[Math.floor(r() * cv.length)];
      const s = 1.5 + r() * 3.5;
      x = q.x + gauss(r) * s; y = q.y + gauss(r) * s; z = q.z + gauss(r) * s;
    } else {
      x = (r() - 0.5) * 130; y = (r() - 0.5) * 80; z = -20 + r() * 175;
      const dn = fbm(x * 0.028, y * 0.028, z * 0.028, 7, 4);
      if (dn < 0.5 || r() > Math.pow((dn - 0.5) / 0.28, 1.4)) continue;
    }
    if (nearEarth(x, y, z)) continue;
    position[i * 3] = x; position[i * 3 + 1] = y; position[i * 3 + 2] = z;
    const hue = fbm(x * 0.018 + 40, y * 0.018, z * 0.018, 99, 3);
    const c = r() < 0.06 ? PAL.gold : hue < 0.45 ? PAL.blue : hue < 0.56 ? PAL.violet : PAL.silver;
    put(color, i * 3, c, 0.018 + r() * 0.04);
    params[i * 2] = 0.5 + Math.pow(r(), 2) * 1.9;
    params[i * 2 + 1] = r() * 100;
    i++;
  }
  return { position: position.subarray(0, i * 3), color: color.subarray(0, i * 3), params: params.subarray(0, i * 2), count: i };
}

/** Volumetric haze: few, very large, very faint sprites that read as gas around the streams. */
export function buildClouds(count: number, curves: THREE.Vector3[][]) {
  const r = seeded(2718);
  const position = new Float32Array(count * 3), color = new Float32Array(count * 3), params = new Float32Array(count * 2);
  let i = 0;
  while (i < count) {
    const cv = curves[Math.floor(r() * curves.length)];
    const q = cv[Math.floor(r() * cv.length)];
    const s = 2 + r() * 5;
    const x = q.x + gauss(r) * s, y = q.y + gauss(r) * s, z = q.z + gauss(r) * s;
    if (nearEarth(x, y, z)) continue;
    position[i * 3] = x; position[i * 3 + 1] = y; position[i * 3 + 2] = z;
    const hue = fbm(x * 0.02 + 40, y * 0.02, z * 0.02, 99, 3);
    const c = r() < 0.05 ? PAL.gold : hue < 0.47 ? PAL.blue : hue < 0.58 ? PAL.violet : [0.3, 0.42, 0.8];
    put(color, i * 3, c, 0.010 + r() * 0.018);
    params[i * 2] = 3.5 + Math.pow(r(), 1.5) * 8;
    params[i * 2 + 1] = r() * 100;
    i++;
  }
  return { position, color, params, count };
}

/* ---------- galaxy (formation: start = cosmic matter, target = spiral) ---------- */
export function buildGalaxy(count: number, dust: Float32Array, curves: THREE.Vector3[][], dark = false) {
  const r = seeded(dark ? 8080 : 20261118);
  const R = GALAXY_RADIUS;
  const position = new Float32Array(count * 3), target = new Float32Array(count * 3);
  const color = new Float32Array(count * 3), startColor = new Float32Array(count * 3), params = new Float32Array(count * 4);
  const knots: [number, number][] = [];
  for (let k = 0; k < 180; k++) knots.push([2.5 + Math.pow(r(), 0.8) * (R - 4), Math.floor(r() * 2)]);
  const armAngle = (rad: number, arm: number) => arm * Math.PI + Math.log(rad / 1.1) * 3.1;
  const dustCount = dust.length / 3;
  // Additive overlap grows with density: scale per-particle energy so every tier exposes alike.
  const gain = Math.pow(120000 / count, 0.7);
  for (let i = 0; i < count; i++) {
    // --- start: inside the surrounding cosmic matter
    const sr = r();
    let sx: number, sy: number, sz: number;
    if (sr < 0.6) {
      const cv = curves[Math.floor(r() * curves.length)];
      const q = cv[Math.floor(r() * cv.length)];
      sx = q.x + gauss(r) * 0.7; sy = q.y + gauss(r) * 0.7; sz = q.z + gauss(r) * 0.7;
    } else if (sr < 0.9 && dustCount > 0) {
      const j = Math.floor(r() * dustCount) * 3;
      sx = dust[j] + gauss(r) * 1.4; sy = dust[j + 1] + gauss(r) * 1.4; sz = dust[j + 2] + gauss(r) * 1.4;
    } else {
      const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), rad = 8 + Math.cbrt(r()) * 50;
      sx = GALAXY_CENTER.x + s * Math.cos(th) * rad; sy = GALAXY_CENTER.y + u * rad * 0.7; sz = GALAXY_CENTER.z + s * Math.sin(th) * rad;
    }
    position[i * 3] = sx; position[i * 3 + 1] = sy; position[i * 3 + 2] = sz;
    const sc = r() < 0.65 ? PAL.blue : r() < 0.6 ? PAL.violet : PAL.silver;
    put(startColor, i * 3, sc, (0.09 + r() * 0.12) * gain);

    // --- target: local galaxy frame, disc = XZ plane
    let rad: number, th: number, h: number, size: number;
    const type = r();
    if (dark) {
      const arm = Math.floor(r() * 2);
      rad = 2.4 + Math.pow(r(), 0.9) * (R * 0.78);
      th = armAngle(rad, arm) - 0.2 + gauss(r) * 0.05;
      const w = 0.35 + rad * 0.025;
      const ox = gauss(r) * w, oz = gauss(r) * w;
      h = gauss(r) * 0.12;
      target[i * 3] = Math.cos(th) * rad + ox; target[i * 3 + 1] = h; target[i * 3 + 2] = Math.sin(th) * rad + oz;
      params[i * 4] = 0.25 + r() * 0.45;
    } else {
      let col: readonly number[]; let k: number;
      if (type < 0.17) {
        // Bulge: triaxial, warm, very dense.
        const gx = gauss(r), gy = gauss(r), gz = gauss(r);
        const sc2 = 1.0 + Math.abs(gauss(r)) * 1.2;
        target[i * 3] = gx * sc2; target[i * 3 + 1] = gy * sc2 * 0.55; target[i * 3 + 2] = gz * sc2 * 0.85;
        rad = Math.hypot(target[i * 3], target[i * 3 + 2]);
        col = r() < 0.75 ? PAL.core : PAL.white; k = 0.13 + r() * 0.15;
        size = 0.04 + Math.pow(r(), 3) * 0.1;
      } else if (type < 0.8) {
        // Spiral arms (2 major + 2 diffuse minor), logarithmic.
        const minor = r() < 0.28;
        const arm = Math.floor(r() * 2);
        const inKnot = !minor && r() < 0.08;
        if (inKnot) {
          const kn = knots[Math.floor(r() * knots.length)];
          rad = kn[0] + gauss(r) * 0.35; th = armAngle(kn[0], kn[1]) + gauss(r) * 0.35 / Math.max(1, kn[0]);
        } else {
          rad = 1.4 + Math.pow(r(), 0.85) * (R - 1.4);
          th = armAngle(rad, arm) + (minor ? Math.PI * 0.5 : 0);
        }
        const w = (minor ? 1.6 : 0.55) + rad * (minor ? 0.07 : 0.035);
        const ox = gauss(r) * w, oz = gauss(r) * w;
        h = gauss(r) * (0.16 + rad * 0.012);
        target[i * 3] = Math.cos(th) * rad + ox; target[i * 3 + 1] = h; target[i * 3 + 2] = Math.sin(th) * rad + oz;
        const tOut = Math.min(1, rad / R);
        if (inKnot) { col = r() < 0.5 ? PAL.violet : [0.7, 0.82, 1.0]; k = 1.0 + r() * 0.8; size = 0.1 + r() * 0.14; }
        else {
          col = tOut < 0.22 ? PAL.gold : r() < 0.55 ? PAL.silver : PAL.blue;
          k = (0.5 + r() * 0.6) * (1.15 - tOut * 0.45) * (minor ? 0.5 : 1);
          size = 0.075 + Math.pow(r(), 4) * 0.2;
        }
      } else {
        // Thin exponential disc + inter-arm haze.
        rad = Math.min(R * 1.15, -Math.log(Math.max(1e-4, r())) * 6.5);
        th = r() * Math.PI * 2;
        h = gauss(r) * 0.3;
        target[i * 3] = Math.cos(th) * rad; target[i * 3 + 1] = h; target[i * 3 + 2] = Math.sin(th) * rad;
        col = r() < 0.5 ? PAL.silver : PAL.blue; k = 0.12 + r() * 0.14;
        size = 0.07 + r() * 0.08;
      }
      put(color, i * 3, col, k * gain);
      params[i * 4] = size;
    }
    const rt = Math.hypot(target[i * 3], target[i * 3 + 2]);
    // Core gathers first, outer arms last: attraction → spiral arms emerging.
    params[i * 4 + 1] = Math.min(1, 0.04 + 0.62 * (rt / R) + r() * 0.3);
    params[i * 4 + 2] = 0.12 + r() * 0.5;
    params[i * 4 + 3] = r() * 100;
    if (dark) put(color, i * 3, [0, 0, 0]);
  }
  return { position, target, color, startColor, params };
}
