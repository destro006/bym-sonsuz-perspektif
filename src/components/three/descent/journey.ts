import * as THREE from 'three';
import { smooth } from '@/lib/math';

/**
 * Planet → atmosphere → city → architecture descent.
 *
 * One deterministic zoom factor Z(p) (1 → 1000, logarithmic) scales BOTH the Earth and the city
 * about a fixed surface point P0. At Z=1 the 60-unit city is a 0.06-unit cluster of light on the
 * globe; at Z=1000 the globe is effectively a plane and the camera skims between buildings.
 * The camera itself always stays a few world units from what it looks at, so depth precision and
 * float ranges stay safe — the scale change lives in the geometry transforms, not in coordinates.
 *
 * The city is an ABSTRACT cinematic urban field. It does not represent a real place.
 */

export const EARTH_RADIUS = 2.4;
export const EARTH_BASE_SCALE = 0.95; // Earth group scale reached at p = 0.48
export const CITY_SIZE = 1000;         // city units per planet-zoom unit (city group scale = Z / CITY_SIZE)
export const Z_MAX = 1000;
export const ZOOM_START = 0.54, ZOOM_END = 0.71;

/** Surface normal of the descent point (front-upper hemisphere, near the evening terminator). */
export const N = new THREE.Vector3(0.18, 0.42, 0.89).normalize();
/** Tangent frame at P0: x = east, y = up (N), z = "north" (forward direction of the city flight). */
// Right-handed (EAST × N = NORTH) so BASIS is a pure rotation and BASIS_Q matches toWorld/toLocal.
export const EAST = new THREE.Vector3().crossVectors(N, new THREE.Vector3(0, 1, 0)).normalize();
export const NORTH = new THREE.Vector3().crossVectors(EAST, N).normalize();
export const BASIS = new THREE.Matrix4().makeBasis(EAST, N, NORTH);
export const BASIS_Q = new THREE.Quaternion().setFromRotationMatrix(BASIS);
export const P0 = N.clone().multiplyScalar(EARTH_RADIUS * EARTH_BASE_SCALE);

/** ln(Z) as a pure function of p. */
export const zoomLog = (p: number) => Math.log(Z_MAX) * smooth(ZOOM_START, ZOOM_END, p);
export const zoom = (p: number) => Math.exp(zoomLog(p));
/** Normalised zoom progress 0..1 in log space (handy for staging effects by scale). */
export const zoom01 = (p: number) => zoomLog(p) / Math.log(Z_MAX);

/** Earth centre for a zoom factor: the surface point P0 stays fixed while the planet grows. */
export function earthCenter(z: number, out: THREE.Vector3) {
  return out.copy(P0).multiplyScalar(1 - z);
}

/** Local (tangent-frame) → world. */
export function toWorld(local: THREE.Vector3, out: THREE.Vector3) {
  return out.set(
    P0.x + EAST.x * local.x + N.x * local.y + NORTH.x * local.z,
    P0.y + EAST.y * local.x + N.y * local.y + NORTH.y * local.z,
    P0.z + EAST.z * local.x + N.z * local.y + NORTH.z * local.z,
  );
}
/** World → local (tangent-frame). */
export function toLocal(world: THREE.Vector3, out: THREE.Vector3) {
  const dx = world.x - P0.x, dy = world.y - P0.y, dz = world.z - P0.z;
  return out.set(
    dx * EAST.x + dy * EAST.y + dz * EAST.z,
    dx * N.x + dy * N.y + dz * N.z,
    dx * NORTH.x + dy * NORTH.y + dz * NORTH.z,
  );
}

/** The featured (abstract) target mass the camera locks onto, in city units. */
export const TARGET = { x: 2, z: 8, w: 1.7, d: 1.5, h: 4.2 };
