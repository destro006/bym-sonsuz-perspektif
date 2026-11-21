import * as THREE from 'three';
import { seeded } from '@/lib/math';
import { sampleCamera, type CameraSample } from '../cosmos/cameraPath';
import { TARGET, toLocal } from './journey';

/**
 * Seeded generator for the ABSTRACT urban field (city units, ground = y 0).
 * Not GIS data and not a real location. Every particle has a deterministic start and target,
 * so the whole formation is a pure function of scroll progress and reverses exactly.
 *
 * Particle kinds (aParams.z):
 *   0 road light · 1 parcel trace · 2 building edge · 3 window light · 4 volumetric dust · 5 target edge
 */
export type CityBudget = { roads: number; parcels: number; buildings: number; dust: number };
export const CITY_BUDGET: Record<'high' | 'medium' | 'low', CityBudget> = {
  high: { roads: 46000, parcels: 16000, buildings: 110000, dust: 5000 },
  medium: { roads: 20000, parcels: 7000, buildings: 42000, dust: 4000 },
  low: { roads: 9000, parcels: 3000, buildings: 18000, dust: 1500 },
};

const EXTENT = 34, SPACING = 4.2;
type Rand = () => number;
const gauss = (r: Rand) => { const u = Math.max(1e-7, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
// Gentle organic warp so the grid reads as a grown city, not a spreadsheet.
const wz = (x: number, i: number) => 0.7 * Math.sin(x * 0.07 + i * 1.7) + 0.35 * Math.sin(x * 0.17 + i * 0.6);
const wx = (z: number, j: number) => 0.7 * Math.sin(z * 0.06 + j * 2.1) + 0.3 * Math.sin(z * 0.19 + j * 0.9);
const arterialA = (z: number) => 9 * Math.sin(z * 0.045 + 0.6) - 4;           // x(z)
const arterialB = (x: number) => 7 * Math.sin(x * 0.05 + 2.2) + 0.25 * x - 6;  // z(x)
const RING = 21;

export type Box = { x: number; z: number; w: number; d: number; h: number; target: boolean; delay: number; seed: number };

/** Camera corridor (city units) once the zoom is complete; buildings never intrude into it. */
function corridor() {
  const s: CameraSample = { pos: new THREE.Vector3(), target: new THREE.Vector3(), roll: 0 };
  const pts: THREE.Vector3[] = [];
  for (let p = 0.7; p <= 1.0001; p += 0.004) { sampleCamera(p, s); pts.push(toLocal(s.pos, new THREE.Vector3())); }
  return pts;
}

export function buildCity(budget: CityBudget) {
  const r = seeded(73_2026);
  const path = corridor();
  const n = Math.floor(EXTENT / SPACING);
  const center = new THREE.Vector2(TARGET.x, TARGET.z);
  const districts: THREE.Vector2[] = [];
  for (let i = 0; i < 7; i++) districts.push(new THREE.Vector2((r() - 0.5) * 50, (r() - 0.5) * 50));
  districts[0].copy(center);

  /* ---------- roads (polylines) ---------- */
  const roads: { pts: THREE.Vector2[]; weight: number }[] = [];
  for (let i = -n; i <= n; i++) {
    const a: THREE.Vector2[] = [], b: THREE.Vector2[] = [];
    for (let t = -EXTENT; t <= EXTENT; t += 0.5) { a.push(new THREE.Vector2(t, i * SPACING + wz(t, i))); b.push(new THREE.Vector2(i * SPACING + wx(t, i), t)); }
    roads.push({ pts: a, weight: 1 }, { pts: b, weight: 1 });
  }
  const artA: THREE.Vector2[] = [], artB: THREE.Vector2[] = [], ring: THREE.Vector2[] = [];
  for (let t = -EXTENT; t <= EXTENT; t += 0.4) { artA.push(new THREE.Vector2(arterialA(t), t)); artB.push(new THREE.Vector2(t, arterialB(t))); }
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.03) { const rr = RING + 1.2 * Math.sin(a * 3 + 0.4); ring.push(new THREE.Vector2(TARGET.x + Math.cos(a) * rr, TARGET.z - 6 + Math.sin(a) * rr)); }
  roads.push({ pts: artA, weight: 2.6 }, { pts: artB, weight: 2.6 }, { pts: ring, weight: 2.0 });
  const roadLen = roads.map(rd => { let L = 0; for (let k = 1; k < rd.pts.length; k++) L += rd.pts[k].distanceTo(rd.pts[k - 1]); return L * rd.weight; });
  const totalLen = roadLen.reduce((a, b) => a + b, 0);

  const nearArterial = (x: number, z: number, m: number) =>
    Math.abs(x - arterialA(z)) < m || Math.abs(z - arterialB(x)) < m || Math.abs(Math.hypot(x - TARGET.x, z - TARGET.z + 6) - RING) < m + 1.2;

  /* ---------- lots & building boxes ---------- */
  const boxes: Box[] = [];
  const parcels: { x0: number; z0: number; x1: number; z1: number }[] = [];
  const clearOf = (b: { x: number; z: number; w: number; d: number }, camY: (y: number) => void) => {
    for (const q of path) {
      const dx = Math.max(0, Math.abs(q.x - b.x) - b.w / 2), dz = Math.max(0, Math.abs(q.z - b.z) - b.d / 2);
      if (Math.hypot(dx, dz) < 1.1) camY(q.y);
    }
  };
  for (let i = -n; i < n; i++) for (let j = -n; j < n; j++) {
    const zc = (i + 0.5) * SPACING, xc = (j + 0.5) * SPACING;
    const x0 = j * SPACING + wx(zc, j) + 0.45, x1 = (j + 1) * SPACING + wx(zc, j + 1) - 0.45;
    const z0 = i * SPACING + wz(xc, i) + 0.45, z1 = (i + 1) * SPACING + wz(xc, i + 1) - 0.45;
    if (x1 - x0 < 1 || z1 - z0 < 1) continue;
    parcels.push({ x0, z0, x1, z1 });
    const distT = Math.hypot(xc - TARGET.x, zc - TARGET.z);
    if (r() < 0.1 && distT > 6) continue; // parks / plazas
    // Split the block into 1–4 lots.
    const splits = r() < 0.35 ? 1 : r() < 0.6 ? 2 : 4;
    const lots: [number, number, number, number][] = [];
    if (splits === 1) lots.push([x0, z0, x1, z1]);
    else if (splits === 2) { const m = x0 + (x1 - x0) * (0.4 + r() * 0.2); lots.push([x0, z0, m, z1], [m, z0, x1, z1]); }
    else { const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2; lots.push([x0, z0, mx, mz], [mx, z0, x1, mz], [x0, mz, mx, z1], [mx, mz, x1, z1]); }
    for (const [a0, b0, a1, b1] of lots) {
      const inset = 0.18 + r() * 0.15;
      const b = { x: (a0 + a1) / 2, z: (b0 + b1) / 2, w: a1 - a0 - inset * 2, d: b1 - b0 - inset * 2 };
      if (b.w < 0.5 || b.d < 0.5) continue;
      if (nearArterial(b.x, b.z, Math.max(b.w, b.d) / 2 + 0.4)) continue;
      if (Math.abs(b.x - TARGET.x) < TARGET.w / 2 + 0.9 && Math.abs(b.z - TARGET.z) < TARGET.d / 2 + 0.9) continue;
      const dc = Math.hypot(b.x - TARGET.x, b.z - (TARGET.z - 4));
      const downtown = Math.exp(-((dc / 15) ** 2));
      let h = 0.3 + 0.55 * r() + 3.8 * downtown * Math.pow(r(), 1.4);
      let cap = Infinity;
      clearOf(b, y => { cap = Math.min(cap, y - 0.9); });
      h = Math.min(h, cap);
      if (h < 0.22) continue;
      boxes.push({ ...b, h, target: false, delay: 0, seed: r() });
    }
  }
  boxes.push({ x: TARGET.x, z: TARGET.z, w: TARGET.w, d: TARGET.d, h: TARGET.h, target: true, delay: 0, seed: 0.5 });
  // Formation order: spreads outward from the downtown core, the featured mass resolves last.
  for (const b of boxes) {
    const dist = Math.hypot(b.x - TARGET.x, b.z - TARGET.z);
    b.delay = b.target ? 0.72 : Math.min(0.62, 0.04 + 0.5 * (dist / 45) + b.seed * 0.12);
  }

  /* ---------- particles ---------- */
  const tb = boxes.find(b => b.target)!;
  const targetPlan = planTarget(tb, budget);
  const total = budget.roads + budget.parcels + budget.buildings + budget.dust + targetPlan.count;
  const position = new Float32Array(total * 3), start = new Float32Array(total * 3), color = new Float32Array(total * 3), params = new Float32Array(total * 4);
  let o = 0;
  const emit = (x: number, y: number, z: number, sx: number, sy: number, sz: number, c: readonly number[], k: number, size: number, delay: number, kind: number) => {
    position[o * 3] = x; position[o * 3 + 1] = y; position[o * 3 + 2] = z;
    start[o * 3] = sx; start[o * 3 + 1] = sy; start[o * 3 + 2] = sz;
    color[o * 3] = c[0] * k; color[o * 3 + 1] = c[1] * k; color[o * 3 + 2] = c[2] * k;
    params[o * 4] = size; params[o * 4 + 1] = delay; params[o * 4 + 2] = kind; params[o * 4 + 3] = r() * 100;
    o++;
  };
  const GOLD = [1.0, 0.72, 0.4], WARM = [1.0, 0.86, 0.66], CYAN = [0.45, 0.72, 1.0], SILVER = [0.72, 0.8, 0.95];

  // Roads: begin as district density clusters ("city lights from orbit"), then stream into the network.
  for (let q = 0; q < budget.roads; q++) {
    let pick = r() * totalLen, ri = 0;
    while (ri < roads.length - 1 && pick > roadLen[ri]) { pick -= roadLen[ri]; ri++; }
    const rd = roads[ri];
    const k = Math.floor(r() * (rd.pts.length - 1)), f = r();
    const a = rd.pts[k], b = rd.pts[k + 1];
    const lane = (r() - 0.5) * (rd.weight > 1 ? 0.5 : 0.22);
    const tx = a.x + (b.x - a.x) * f, tz = a.y + (b.y - a.y) * f;
    const nx = -(b.y - a.y), nz = b.x - a.x, nl = Math.hypot(nx, nz) || 1;
    const x = tx + nx / nl * lane, z = tz + nz / nl * lane;
    // Nearest district → clustered start.
    let best = districts[0], bd = Infinity;
    for (const d of districts) { const dd = (d.x - x) ** 2 + (d.y - z) ** 2; if (dd < bd) { bd = dd; best = d; } }
    const sx = best.x + (x - best.x) * 0.22 + gauss(r) * 1.6, sz = best.y + (z - best.y) * 0.22 + gauss(r) * 1.6;
    const lamp = r() < 0.14;
    const dist = Math.hypot(x - TARGET.x, z - TARGET.z);
    const c = lamp ? WARM : r() < 0.72 ? GOLD : SILVER;
    emit(x, 0.02, z, sx, 0.02, sz, c, (lamp ? 1.5 : 0.55 + r() * 0.5) * (rd.weight > 1 ? 1.25 : 1), lamp ? 0.055 : 0.032 + r() * 0.02, Math.min(0.7, dist / 60 + r() * 0.1), 0);
  }
  // Parcel traces: outlines "draw" themselves around each block.
  const perim = parcels.map(pc => 2 * ((pc.x1 - pc.x0) + (pc.z1 - pc.z0)));
  const perimTotal = perim.reduce((a, b) => a + b, 0);
  for (let q = 0; q < budget.parcels; q++) {
    let pick = r() * perimTotal, pi = 0;
    while (pi < parcels.length - 1 && pick > perim[pi]) { pick -= perim[pi]; pi++; }
    const pc = parcels[pi], w = pc.x1 - pc.x0, d = pc.z1 - pc.z0;
    const t = pick / perim[pi];
    let L = t * 2 * (w + d), x: number, z: number;
    if (L < w) { x = pc.x0 + L; z = pc.z0; } else if ((L -= w) < d) { x = pc.x1; z = pc.z0 + L; }
    else if ((L -= d) < w) { x = pc.x1 - L; z = pc.z1; } else { L -= w; x = pc.x0; z = pc.z1 - L; }
    const cx = (pc.x0 + pc.x1) / 2, cz = (pc.z0 + pc.z1) / 2;
    const dist = Math.hypot(cx - TARGET.x, cz - TARGET.z);
    emit(x, 0.015, z, x, 0.015, z, CYAN, 0.32 + r() * 0.2, 0.026, Math.min(0.75, dist / 70 + t * 0.22), 1);
  }
  // Buildings: luminous edges + window lights + interior haze, rising from the ground footprint.
  const areas = boxes.map(b => b.target ? 0 : Math.pow(2 * (b.w + b.d) * b.h + b.w * b.d, 0.85));
  const areaTotal = areas.reduce((a, b) => a + b, 0);
  for (let q = 0; q < budget.buildings; q++) {
    let pick = r() * areaTotal, bi = 0;
    while (bi < boxes.length - 1 && pick > areas[bi]) { pick -= areas[bi]; bi++; }
    const b = boxes[bi], hw = b.w / 2, hd = b.d / 2;
    const roll = r();
    let x: number, y: number, z: number, kind: number, c: readonly number[], k: number, size: number;
    if (roll < 0.42) {
      // Edges: 4 vertical, 4 roof, plus floor bands every ~0.5.
      const e = r();
      const sx = r() < 0.5 ? -1 : 1, sz = r() < 0.5 ? -1 : 1;
      if (e < 0.45) { x = b.x + sx * hw; z = b.z + sz * hd; y = r() * b.h; }
      else if (e < 0.75) { y = b.h; if (r() < 0.5) { x = b.x + (r() - 0.5) * b.w; z = b.z + sz * hd; } else { x = b.x + sx * hw; z = b.z + (r() - 0.5) * b.d; } }
      else { y = Math.round((r() * b.h) / 0.5) * 0.5; if (r() < 0.5) { x = b.x + (r() - 0.5) * b.w; z = b.z + sz * hd; } else { x = b.x + sx * hw; z = b.z + (r() - 0.5) * b.d; } }
      kind = b.target ? 5 : 2;
      c = b.target ? WARM : e < 0.75 ? CYAN : SILVER;
      k = b.target ? 1.25 + r() * 0.5 : 0.45 + r() * 0.35;
      size = b.target ? 0.03 : 0.024;
    } else if (roll < 0.86) {
      // Windows: quantised to floors and bays, so lit facades read as architecture, not glitter.
      const face = Math.floor(r() * 4);
      const u = Math.round(((r() - 0.5) * 0.9) / 0.11) * 0.11, v = Math.max(0.12, Math.round((r() * b.h) / 0.24) * 0.24 - 0.06);
      if (face === 0) { x = b.x + u * b.w; z = b.z - hd; } else if (face === 1) { x = b.x + u * b.w; z = b.z + hd; }
      else if (face === 2) { x = b.x - hw; z = b.z + u * b.d; } else { x = b.x + hw; z = b.z + u * b.d; }
      y = Math.min(v, b.h - 0.08);
      kind = 3;
      const lit = r() < (b.target ? 0.55 : 0.32);
      c = lit ? (r() < 0.8 ? GOLD : WARM) : CYAN;
      k = lit ? 0.7 + r() * 0.6 : 0.08 + r() * 0.08;
      size = 0.028;
    } else {
      x = b.x + (r() - 0.5) * b.w; z = b.z + (r() - 0.5) * b.d; y = r() * b.h;
      kind = 4; c = r() < 0.5 ? CYAN : GOLD; k = 0.05 + r() * 0.05; size = 0.12 + r() * 0.12;
    }
    // Rises from the footprint on the ground: vertical attraction, staggered by height.
    const sx = x + gauss(r) * 0.35, sz = z + gauss(r) * 0.35;
    const delay = b.delay + 0.18 * (y / Math.max(0.5, b.h)) + r() * 0.05;
    emit(x, y, z, sx, 0.0, sz, c, k, size, Math.min(0.95, delay), kind);
  }
  emitTarget(tb, targetPlan, emit, r, WARM, GOLD);
  // Volumetric dust drifting over the city, settling as structures stabilise.
  for (let q = 0; q < budget.dust; q++) {
    const x = (r() - 0.5) * 70, z = (r() - 0.5) * 70, y = Math.pow(r(), 2) * 6;
    emit(x, y, z, x + gauss(r) * 2, y + 2 + r() * 4, z + gauss(r) * 2, r() < 0.6 ? CYAN : GOLD, 0.03 + r() * 0.04, 0.18 + r() * 0.3, r() * 0.5, 4);
  }
  return { position, start, color, params, count: o, boxes, districts };
}

/* ---------- featured mass: aligned particles + wrapping aura ---------- */
// Must match the window grid in DescentField's MASS_FRAG (metric cells measured from the box
// centre horizontally and from the ground vertically), so particle windows sit on the drawn ones.
const WIN_W = 0.11, WIN_H = 0.24;
/** Aura palette (bottom → top): ember red-orange → hot pink → magenta → violet. */
const AURA: readonly (readonly number[])[] = [[1.0, 0.36, 0.2], [1.0, 0.3, 0.6], [0.86, 0.22, 0.78], [0.5, 0.26, 1.0]];
const auraColor = (t: number) => {
  const x = Math.min(0.999, Math.max(0, t)) * (AURA.length - 1), i = Math.floor(x), f = x - i;
  const a = AURA[i], b = AURA[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
};
type Face = { cols: number[]; rows: number[] };
function planTarget(b: Box, budget: CityBudget) {
  const cells = (len: number) => { const out: number[] = []; for (let i = Math.ceil(-len / 2 / WIN_W); (i + 1) * WIN_W <= len / 2 + 1e-6; i++) out.push((i + 0.5) * WIN_W); return out; };
  const rows: number[] = []; for (let j = 0; (j + 1) * WIN_H <= b.h - 0.05; j++) rows.push((j + 0.5) * WIN_H);
  const faces: Face[] = [{ cols: cells(b.w), rows }, { cols: cells(b.w), rows }, { cols: cells(b.d), rows }, { cols: cells(b.d), rows }];
  const windows = faces.reduce((n, f) => n + f.cols.length * f.rows.length, 0);
  const scale = budget.buildings / CITY_BUDGET.high.buildings; // tier ratio
  const edges = Math.round(900 + 1500 * scale);
  const aura = Math.round(1000 + 2600 * scale);
  return { faces, windows, edges, aura, count: windows + edges + aura };
}
type Emit = (x: number, y: number, z: number, sx: number, sy: number, sz: number, c: readonly number[], k: number, size: number, delay: number, kind: number) => void;
function emitTarget(b: Box, plan: ReturnType<typeof planTarget>, emit: Emit, r: Rand, WARM: readonly number[], GOLD: readonly number[]) {
  const hw = b.w / 2, hd = b.d / 2;
  const rise = (y: number) => Math.min(0.95, b.delay + 0.18 * (y / b.h));
  // Windows: one light per drawn window cell, a hair in front of the façade.
  const off = 0.006;
  plan.faces.forEach((f, fi) => {
    for (const u of f.cols) for (const v of f.rows) {
      let x: number, z: number;
      if (fi === 0) { x = b.x + u; z = b.z - hd - off; } else if (fi === 1) { x = b.x + u; z = b.z + hd + off; }
      else if (fi === 2) { x = b.x - hw - off; z = b.z + u; } else { x = b.x + hw + off; z = b.z + u; }
      const lit = r() < 0.55;
      emit(x, v, z, x, 0, z, lit ? (r() < 0.8 ? GOLD : WARM) : [0.45, 0.72, 1.0], lit ? 0.75 + r() * 0.5 : 0.1, 0.03, rise(v) + r() * 0.03, 3);
    }
  });
  // Edges: evenly spaced along the 12 box edges and the floor bands (every second window row).
  const verts = 4 * b.h, roof = 2 * (b.w + b.d), bands = Math.max(1, Math.floor(b.h / (2 * WIN_H)));
  const lenTotal = verts + roof * (1 + bands) + roof; // + ground outline
  const along = (L: number, y: number): [number, number] => {
    // walk the rectangle perimeter, start at (-hw,-hd)
    if (L < b.w) return [b.x - hw + L, b.z - hd]; L -= b.w;
    if (L < b.d) return [b.x + hw, b.z - hd + L]; L -= b.d;
    if (L < b.w) return [b.x + hw - L, b.z + hd]; L -= b.w;
    return [b.x - hw, b.z + hd - Math.min(L, b.d)];
  };
  for (let q = 0; q < plan.edges; q++) {
    let L = ((q + 0.5) / plan.edges) * lenTotal, x: number, y: number, z: number;
    if (L < verts) { const c = Math.floor(L / b.h); y = L - c * b.h; x = b.x + (c === 1 || c === 2 ? hw : -hw); z = b.z + (c >= 2 ? hd : -hd); }
    else {
      L -= verts; const ring = Math.floor(L / roof); const yy = ring === 0 ? b.h : ring <= bands ? ring * 2 * WIN_H : 0;
      [x, z] = along(L - ring * roof, yy); y = yy;
    }
    emit(x, y, z, x, 0, z, WARM, 1.2 + r() * 0.4, 0.03, rise(y), 5);
  }
  // Aura: helical ribbons wrapping the mass just outside the façade, coloured by height.
  const gap = 0.16, ax = hw + gap, az = hd + gap, per = 4 * (ax + az) / 2 * 2, ribbons = 3, turns = 2.2;
  const ring = (t: number): [number, number] => {
    let L = (((t % 1) + 1) % 1) * per;
    const W = 2 * ax, D = 2 * az;
    if (L < W) return [b.x - ax + L, b.z - az]; L -= W;
    if (L < D) return [b.x + ax, b.z - az + L]; L -= D;
    if (L < W) return [b.x + ax - L, b.z + az]; L -= W;
    return [b.x - ax, b.z + az - L];
  };
  for (let q = 0; q < plan.aura; q++) {
    const h = r(), rib = q % ribbons;
    const t = h * turns + rib / ribbons + (r() - 0.5) * 0.012;
    const [px, pz] = ring(t);
    const y = h * (b.h + 0.5) - 0.15;
    const spread = gauss(r) * 0.035;
    const x = px + spread, z = pz + gauss(r) * 0.035;
    const c = auraColor(y / (b.h + 0.4) + (r() - 0.5) * 0.12);
    emit(x, Math.max(0.02, y + gauss(r) * 0.03), z, b.x + (px - b.x) * 2.2, 0, b.z + (pz - b.z) * 2.2, c, 0.9 + r() * 0.9, 0.034 + Math.pow(r(), 3) * 0.05, Math.min(0.95, 0.8 + 0.12 * h), 6);
  }
}

/** Atmosphere cap + orbital ring, in planet units (Earth radius = 1, local +y = descent normal). */
export function buildAtmosphere(count: number, ringCount: number) {
  const r = seeded(4040);
  const position = new Float32Array((count + ringCount) * 3), color = new Float32Array((count + ringCount) * 3), params = new Float32Array((count + ringCount) * 4);
  for (let i = 0; i < count; i++) {
    // Cone around the descent normal, denser toward its axis.
    // Uniform over the spherical cap (no axis clumping), altitude biased low.
    const th = Math.acos(1 - r() * (1 - Math.cos(0.8))), ph = r() * Math.PI * 2;
    const rad = 1.004 + Math.pow(r(), 1.5) * 0.1;
    const dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph);
    position[i * 3] = dx * rad; position[i * 3 + 1] = dy * rad; position[i * 3 + 2] = dz * rad;
    const c = r() < 0.75 ? [0.42, 0.72, 1.0] : [0.7, 0.85, 1.0];
    const k = 0.5 + r() * 0.9;
    color[i * 3] = c[0] * k; color[i * 3 + 1] = c[1] * k; color[i * 3 + 2] = c[2] * k;
    params[i * 4] = 0.0018 + Math.pow(r(), 3) * 0.006; params[i * 4 + 1] = 0; params[i * 4 + 2] = r() * 100; params[i * 4 + 3] = rad - 1;
  }
  for (let i = count; i < count + ringCount; i++) {
    // Orbital ring: encoded as (angle, radius, height) and rotated in the shader.
    position[i * 3] = r() * Math.PI * 2; position[i * 3 + 1] = 1.28 + Math.pow(r(), 1.5) * 0.45 + gauss(r) * 0.01; position[i * 3 + 2] = gauss(r) * 0.012;
    const c = r() < 0.85 ? [0.5, 0.75, 1.0] : [1.0, 0.8, 0.55];
    const k = 0.3 + r() * 0.5;
    color[i * 3] = c[0] * k; color[i * 3 + 1] = c[1] * k; color[i * 3 + 2] = c[2] * k;
    params[i * 4] = 0.004 + Math.pow(r(), 3) * 0.01; params[i * 4 + 1] = 1; params[i * 4 + 2] = r() * 100; params[i * 4 + 3] = 0;
  }
  return { position, color, params, count: count + ringCount };
}
