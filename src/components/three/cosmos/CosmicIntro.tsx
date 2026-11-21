'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mix, pulse, smooth } from '@/lib/math';
import { NOISE, POINT_FRAG, POINT_VERT_COMMON } from './glsl';
import {
  BUDGET, CURVE_SAMPLES, GALAXY_CENTER, GALAXY_QUAT, GALAXY_RADIUS, GALAXY_TILT, type Tier,
  buildClouds, buildDust, buildFarStars, buildWake, buildFilamentParticles, buildFilaments, buildGalaxy, buildPathStars,
} from './build';
import { N as SURFACE_N } from '../descent/journey';

/** Uniform objects shared by reference between all cosmic materials (one write per frame). */
export type Shared = {
  uTime: { value: number }; uHalfH: { value: number }; uMaxPx: { value: number };
  uVel: { value: THREE.Vector3 }; uStreak: { value: number };
};
export function createShared(): Shared {
  return { uTime: { value: 0 }, uHalfH: { value: 540 }, uMaxPx: { value: 64 }, uVel: { value: new THREE.Vector3() }, uStreak: { value: 0 } };
}

type P = React.MutableRefObject<number>;

function geometry(attrs: Record<string, [Float32Array, number]>, count: number) {
  const g = new THREE.BufferGeometry();
  for (const [name, [arr, size]] of Object.entries(attrs)) g.setAttribute(name, new THREE.BufferAttribute(arr, size));
  g.setDrawRange(0, count);
  // Vertices move in the shader; bounds are irrelevant because culling is disabled per object.
  return g;
}
function pointMaterial(shared: Shared, vertexBody: string, extra: Record<string, THREE.IUniform>, opts: { coreK?: number; haloK?: number; near?: [number, number]; dark?: boolean } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime, uHalfH: shared.uHalfH, uMaxPx: shared.uMaxPx,
      uOpacity: { value: 1 }, uNear: { value: new THREE.Vector2(...(opts.near ?? [0.25, 2.5])) },
      uCoreK: { value: opts.coreK ?? 22 }, uHaloK: { value: opts.haloK ?? 0.3 },
      ...extra,
    },
    vertexShader: NOISE + POINT_VERT_COMMON + vertexBody,
    fragmentShader: POINT_FRAG,
    defines: opts.dark ? { DARK: '' } : {},
    transparent: true, depthWrite: false,
    blending: opts.dark ? THREE.NormalBlending : THREE.AdditiveBlending,
  });
}
function useDispose(...items: { dispose: () => void }[]) {
  useEffect(() => () => items.forEach(i => i.dispose()), items); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ================= A. deep-space backdrop: nebula sky + stars + streaks ================= */

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const SKY_FRAG = (oct: number) => NOISE + /* glsl */ `
uniform float uTime; uniform float uNebula; uniform float uGlow; uniform vec3 uGlowPos; uniform float uAtmo; uniform vec3 uUp;
varying vec3 vDir;
void main(){
  vec3 d=normalize(vDir);
  vec3 q=d*1.7+vec3(0.0,0.0,uTime*0.003);
  float n=0.0, a=0.55;
  for(int i=0;i<${oct};i++){ n+=a*snoise(q); q=q*2.07+vec3(1.3,-0.7,2.1); a*=0.5; }
  float m=snoise(d*2.6+vec3(4.1,-2.0,7.7))*0.5+0.5;
  vec3 bandN=normalize(vec3(-0.48,0.86,0.12));
  float band=exp(-pow(dot(d,bandN)/0.34,2.0));
  vec3 base=vec3(0.0026,0.0042,0.0098);
  vec3 col=base;
  col+=vec3(0.011,0.019,0.05)*smoothstep(-0.1,0.95,n)*(0.35+band);
  col+=vec3(0.03,0.013,0.05)*smoothstep(0.2,0.95,n*m+0.2)*band;
  col+=vec3(0.075,0.055,0.028)*pow(smoothstep(0.35,1.0,n),3.0)*band*0.8;
  col=mix(base,col,uNebula);
  // Distant luminous region: the proto-galaxy glows through the haze from the first frame.
  vec3 g=normalize(uGlowPos-cameraPosition);
  float gd=max(dot(d,g),0.0);
  col+=uGlow*(vec3(0.09,0.065,0.04)*pow(gd,90.0)+vec3(0.012,0.016,0.04)*pow(gd,14.0));
  // Inside the atmosphere (city chapters): night-sky scattering around the local up vector.
  float h=dot(d,uUp);
  vec3 zen=vec3(0.004,0.008,0.022);
  vec3 hor=vec3(0.03,0.075,0.13);
  vec3 sky=mix(hor,zen,smoothstep(0.0,0.55,h));
  sky+=vec3(0.06,0.035,0.014)*exp(-abs(h)*14.0);            // warm city glow on the horizon
  vec3 ground=mix(vec3(0.012,0.022,0.04),vec3(0.004,0.006,0.012),smoothstep(0.0,-0.4,h));
  vec3 atmo=h>0.0?sky+col*0.35*smoothstep(0.05,0.5,h):ground;
  col=mix(col,atmo,uAtmo);
  gl_FragColor=vec4(col,1.0);
}`;

const STAR_VERT = /* glsl */ `
attribute vec3 aColor; attribute float aSize; attribute float aTw;
void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  float tw=0.7+0.3*sin(uTime*aTw+aTw*91.7)*sin(uTime*aTw*0.37+aTw*13.1);
  emitPoint(mv,aSize,aColor*tw,1.0);
}`;

const STREAK_VERT = /* glsl */ `
attribute float aEnd; attribute vec3 aColor;
uniform vec3 uVel; uniform float uStreak; uniform float uOpacity;
varying vec3 vColor; varying float vAlpha;
void main(){
  vec3 p=position-uVel*aEnd;
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  vColor=aColor;
  vAlpha=(1.0-aEnd)*uStreak*uOpacity*smoothstep(1.0,6.0,-mv.z);
  gl_Position=projectionMatrix*mv;
}`;
const STREAK_FRAG = /* glsl */ `
varying vec3 vColor; varying float vAlpha;
void main(){ if(vAlpha<0.002) discard; gl_FragColor=vec4(vColor,vAlpha); }`;

function Backdrop({ progress, shared, tier }: { progress: P; shared: Shared; tier: Tier }) {
  const b = BUDGET[tier];
  const sky = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uNebula: { value: 1 }, uGlow: { value: 1 }, uGlowPos: { value: GALAXY_CENTER.clone() }, uAtmo: { value: 0 }, uUp: { value: SURFACE_N.clone() } },
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG(b.skyOctaves), side: THREE.BackSide, depthWrite: false, depthTest: false,
  }), [shared, b.skyOctaves]);
  const skyGeo = useMemo(() => new THREE.SphereGeometry(500, 48, 24), []);

  const far = useMemo(() => {
    const d = buildFarStars(b.farStars);
    return geometry({ position: [d.position, 3], aColor: [d.color, 3], aSize: [d.size, 1], aTw: [d.tw, 1] }, b.farStars);
  }, [b.farStars]);
  const farMat = useMemo(() => pointMaterial(shared, STAR_VERT, {}, { coreK: 30, haloK: 0.18, near: [1, 2] }), [shared]);

  const path = useMemo(() => buildPathStars(b.pathStars), [b.pathStars]);
  const pathGeo = useMemo(() => geometry({ position: [path.position, 3], aColor: [path.color, 3], aSize: [path.size, 1], aTw: [path.tw, 1] }, b.pathStars), [path, b.pathStars]);
  const pathMat = useMemo(() => pointMaterial(shared, STAR_VERT, {}, { coreK: 26, haloK: 0.25, near: [0.4, 3] }), [shared]);

  // Streaks: two vertices per star (head + tail), tail displaced against camera velocity in the shader.
  const streakGeo = useMemo(() => {
    const n = Math.min(b.streaks, b.pathStars);
    const pos = new Float32Array(n * 6), end = new Float32Array(n * 2), col = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) for (let e = 0; e < 2; e++) {
      for (let c = 0; c < 3; c++) { pos[i * 6 + e * 3 + c] = path.position[i * 3 + c]; col[i * 6 + e * 3 + c] = Math.min(1.4, path.color[i * 3 + c] * 1.1); }
      end[i * 2 + e] = e;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    return g;
  }, [path, b.streaks, b.pathStars]);
  const streakMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uVel: shared.uVel, uStreak: shared.uStreak, uOpacity: { value: 1 } },
    vertexShader: STREAK_VERT, fragmentShader: STREAK_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [shared]);
  const wake = useMemo(() => { const d = buildWake(b.wake); return geometry({ position: [d.position, 3], aColor: [d.color, 3], aSize: [d.size, 1], aTw: [d.tw, 1] }, b.wake); }, [b.wake]);
  const wakeMat = useMemo(() => pointMaterial(shared, STAR_VERT, {}, { coreK: 20, haloK: 0.35, near: [0.3, 2.2] }), [shared]);
  const wakePts = useRef<THREE.Points>(null);
  useDispose(sky, skyGeo, far, farMat, pathGeo, pathMat, streakGeo, streakMat, wake, wakeMat);

  const skyMesh = useRef<THREE.Mesh>(null);
  const pathPts = useRef<THREE.Points>(null);
  const streaks = useRef<THREE.LineSegments>(null);
  useFrame(({ camera }) => {
    const p = progress.current;
    skyMesh.current?.position.copy(camera.position);
    sky.uniforms.uNebula.value = mix(1, 0.5, smooth(0.6, 0.72, p));
    sky.uniforms.uGlow.value = (1 - smooth(0.17, 0.25, p));
    const atmo = smooth(0.57, 0.66, p);
    sky.uniforms.uAtmo.value = atmo;
    farMat.uniforms.uOpacity.value = (1 - 0.4 * smooth(0.62, 0.74, p)) * (1 - 0.7 * atmo);
    const pathO = 1 - smooth(0.3, 0.4, p);
    pathMat.uniforms.uOpacity.value = pathO;
    if (pathPts.current) pathPts.current.visible = pathO > 0.002;
    streakMat.uniforms.uOpacity.value = pathO;
    if (streaks.current) streaks.current.visible = pathO > 0.002 && shared.uStreak.value > 0.002;
    const wO = pulse(0.25, 0.275, 0.315, 0.35, p);
    wakeMat.uniforms.uOpacity.value = wO;
    if (wakePts.current) wakePts.current.visible = wO > 0.002;
  });
  return <>
    <mesh ref={skyMesh} geometry={skyGeo} material={sky} renderOrder={-10} frustumCulled={false} />
    <points geometry={far} material={farMat} frustumCulled={false} renderOrder={-5} />
    <points ref={pathPts} geometry={pathGeo} material={pathMat} frustumCulled={false} />
    <points ref={wakePts} geometry={wake} material={wakeMat} frustumCulled={false} />
    <lineSegments ref={streaks} geometry={streakGeo} material={streakMat} frustumCulled={false} />
  </>;
}

/* ================= B + C. cosmic dust and filament streams ================= */

const DUST_VERT = /* glsl */ `
attribute vec3 aColor; attribute vec2 aParams;
uniform vec3 uCenter; uniform float uPull; uniform float uSwirl;
void main(){
  vec3 p=position+flow3(position*0.03+vec3(uTime*0.012,0.0,aParams.y*0.01))*2.4;
  vec3 rel=p-uCenter;
  float c=cos(uSwirl), s=sin(uSwirl);
  rel.xz=mat2(c,-s,s,c)*rel.xz;
  p=mix(p,uCenter+rel*0.5,uPull);
  emitPoint(modelViewMatrix*vec4(p,1.0),aParams.x,aColor,1.0);
}`;

const FIL_VERT = /* glsl */ `
attribute vec4 aFil; attribute vec3 aOffset; attribute vec3 aColor; attribute float aSize;
uniform sampler2D uCurves; uniform float uSamples; uniform float uFlow;
uniform vec3 uCenter; uniform float uPull;
void main(){
  float t=fract(aFil.y+uFlow*aFil.z);
  float f=t*(uSamples-1.0);
  float i0=floor(f);
  int row=int(aFil.x);
  vec4 a=texelFetch(uCurves,ivec2(int(i0),row),0);
  vec4 b=texelFetch(uCurves,ivec2(int(min(i0+1.0,uSamples-1.0)),row),0);
  vec4 q=mix(a,b,f-i0);
  vec3 p=q.xyz+aOffset*q.w;
  p+=flow3(p*0.06+vec3(0.0,uTime*0.02,aFil.w*0.01))*(0.25+q.w*0.35);
  p=mix(p,uCenter+(p-uCenter)*0.42,uPull);
  float ends=smoothstep(0.0,0.06,t)*smoothstep(1.0,0.9,t);
  float shimmer=0.8+0.2*sin(uTime*1.7+aFil.w);
  emitPoint(modelViewMatrix*vec4(p,1.0),aSize,aColor*shimmer*(0.8+q.w*0.6),ends);
}`;

function Nebulae({ progress, shared, tier, matter }: { progress: P; shared: Shared; tier: Tier; matter: Matter }) {
  const b = BUDGET[tier];
  const dustGeo = useMemo(() => geometry({ position: [matter.dust.position, 3], aColor: [matter.dust.color, 3], aParams: [matter.dust.params, 2] }, matter.dust.count), [matter]);
  const dustMat = useMemo(() => pointMaterial(shared, DUST_VERT, { uCenter: { value: GALAXY_CENTER.clone() }, uPull: { value: 0 }, uSwirl: { value: 0 } }, { coreK: 5, haloK: 0, near: [2, 12] }), [shared]);

  const curveTex = useMemo(() => {
    const t = new THREE.DataTexture(matter.filaments.data, CURVE_SAMPLES, b.curves, THREE.RGBAFormat, THREE.FloatType);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  }, [matter, b.curves]);
  const filGeo = useMemo(() => {
    const d = buildFilamentParticles(b.filament, b.curves);
    // `position` is required by three for draw-range bookkeeping; the shader reads the curve texture.
    return geometry({ position: [new Float32Array(b.filament * 3), 3], aFil: [d.fil, 4], aOffset: [d.offset, 3], aColor: [d.color, 3], aSize: [d.size, 1] }, b.filament);
  }, [b.filament, b.curves]);
  const filMat = useMemo(() => pointMaterial(shared, FIL_VERT, {
    uCurves: { value: curveTex }, uSamples: { value: CURVE_SAMPLES }, uFlow: { value: 0 },
    uCenter: { value: GALAXY_CENTER.clone() }, uPull: { value: 0 },
  }, { coreK: 18, haloK: 0.35, near: [0.5, 4] }), [shared, curveTex]);
  const cloudGeo = useMemo(() => { const c = buildClouds(b.clouds, matter.filaments.curves); return geometry({ position: [c.position, 3], aColor: [c.color, 3], aParams: [c.params, 2] }, c.count); }, [b.clouds, matter]);
  // Clouds use their own (large) sprite cap: they are few, so fill-rate stays bounded.
  const cloudMat = useMemo(() => { const m = pointMaterial(shared, DUST_VERT, { uCenter: { value: GALAXY_CENTER.clone() }, uPull: { value: 0 }, uSwirl: { value: 0 } }, { coreK: 3.2, haloK: 0, near: [4, 18] }); m.uniforms.uMaxPx = { value: 300 }; return m; }, [shared]);
  useDispose(dustGeo, dustMat, curveTex, filGeo, filMat, cloudGeo, cloudMat);

  const dust = useRef<THREE.Points>(null);
  const clouds = useRef<THREE.Points>(null);
  const fil = useRef<THREE.Points>(null);
  useFrame(() => {
    const p = progress.current;
    const t = shared.uTime.value;
    // Gathered toward the galaxy while it forms, then released: the dust streams past the camera
    // as it exits the core (a wake toward the Earth) instead of leaving an empty frame.
    const dO = (1 - 0.45 * smooth(0.22, 0.27, p)) * (1 - smooth(0.31, 0.37, p));
    dustMat.uniforms.uOpacity.value = dO;
    dustMat.uniforms.uPull.value = 0.42 * smooth(0.1, 0.25, p) * (1 - smooth(0.26, 0.34, p));
    dustMat.uniforms.uSwirl.value = -0.9 * smooth(0.08, 0.26, p);
    if (dust.current) dust.current.visible = dO > 0.002;
    cloudMat.uniforms.uOpacity.value = dO;
    cloudMat.uniforms.uPull.value = dustMat.uniforms.uPull.value;
    cloudMat.uniforms.uSwirl.value = dustMat.uniforms.uSwirl.value;
    if (clouds.current) clouds.current.visible = dO > 0.002;
    const fO = (1 - 0.7 * smooth(0.12, 0.22, p)) * (1 - smooth(0.26, 0.33, p));
    filMat.uniforms.uOpacity.value = fO;
    // Scroll drives the major flow (reversible); time adds a slow ambient drift.
    filMat.uniforms.uFlow.value = p * 0.55 + t * 0.0035;
    filMat.uniforms.uPull.value = 0.55 * smooth(0.08, 0.22, p) * (1 - smooth(0.25, 0.33, p));
    if (fil.current) fil.current.visible = fO > 0.002;
  });
  return <>
    <points ref={clouds} geometry={cloudGeo} material={cloudMat} frustumCulled={false} />
    <points ref={dust} geometry={dustGeo} material={dustMat} frustumCulled={false} />
    <points ref={fil} geometry={filGeo} material={filMat} frustumCulled={false} />
  </>;
}

/* ================= Galaxy formation, core and energy rings ================= */

const GALAXY_VERT = /* glsl */ `
attribute vec3 aTarget; attribute vec3 aColor; attribute vec3 aStartColor; attribute vec4 aParams;
uniform mat3 uTilt; uniform vec3 uCenter; uniform float uForm; uniform float uSpin; uniform float uWave;
const float PI=3.14159265;
void main(){
  vec3 s=transpose(uTilt)*(position-uCenter);
  float rs=length(s.xz), ts=atan(s.z,s.x);
  float rt=length(aTarget.xz), tt=atan(aTarget.z,aTarget.x);
  float k=smoothstep(aParams.y,aParams.y+0.38,uForm*1.38);
  float e=k*k*(3.0-2.0*k);
  float mid=sin(PI*e);
  // Static shortest arc (no wrap can pop a particle mid-flight) + an in-flight swirl that is
  // exactly zero at both ends, so every particle lands precisely on its arm.
  float dTheta=mod(tt-ts+PI,2.0*PI)-PI;
  float theta=ts+dTheta*e-aParams.z*2.0*PI*mid;
  // Pattern rotation (density-wave style) with mild differential shear: arms never wind up.
  theta-=uSpin*(0.6+0.5/(1.0+rt*0.3))*e;
  float r=mix(rs,rt,e)*(1.0-0.3*mid);
  float h=mix(s.y,aTarget.y,e);
  vec3 local=vec3(cos(theta)*r,h,sin(theta)*r);
  local+=flow3(local*0.07+vec3(0.0,uTime*0.025,aParams.w))*(mix(1.3,0.0,e)+mid*2.4);
  vec3 world=uCenter+uTilt*local;
  // Energy wave: a travelling brightness front through the forming disc.
  float wave=exp(-pow((rt-uWave)/1.6,2.0))*step(0.5,e);
#ifdef DARK
  vec3 col=vec3(0.0);
  float alpha=smoothstep(0.85,1.0,e)*0.32;
#else
  vec3 col=mix(aStartColor,aColor,e)*(1.0+mid*1.5+wave*1.4);
  float alpha=mix(0.5,1.0,e);
#endif
  emitPoint(modelViewMatrix*vec4(world,1.0),aParams.x*mix(1.7,1.0,e),col,alpha);
}`;

const SPRITE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const CORE_FRAG = /* glsl */ `
uniform float uI; varying vec2 vUv;
void main(){
  vec2 c=vUv*2.0-1.0; float d2=dot(c,c);
  if(d2>1.0) discard;
  vec3 col=vec3(1.0,0.95,0.86)*exp(-d2*320.0)*1.1
          +vec3(1.0,0.76,0.46)*exp(-d2*40.0)*0.16
          +vec3(0.55,0.42,0.9)*exp(-d2*6.0)*0.10
          +vec3(0.28,0.38,0.95)*exp(-d2*2.2)*0.05;
  gl_FragColor=vec4(col*uI*(1.0-d2),1.0);
}`;
const RING_FRAG = NOISE + /* glsl */ `
uniform vec3 uR; uniform vec3 uI; uniform float uTime; uniform float uExtent;
varying vec2 vUv;
void main(){
  vec2 c=vUv*2.0-1.0;
  float r=length(c)*uExtent;
  float ang=atan(c.y,c.x);
  vec3 col=vec3(0.0);
  for(int i=0;i<3;i++){
    float R=uR[i];
    float n=snoise(vec3(cos(ang)*2.6,sin(ang)*2.6,uTime*0.08+float(i)*3.1))*(0.12+R*0.012);
    float w=0.05+R*0.007;
    // Broken, filamentary front: brightness varies along the circumference.
    float grain=0.45+0.55*smoothstep(-0.4,0.8,snoise(vec3(cos(ang)*7.0,sin(ang)*7.0,float(i)*5.3+uTime*0.05)));
    float ring=exp(-pow((r-R-n)/w,2.0))*grain;
    float trail=exp(-max(0.0,R-r)/(1.0+R*0.1))*step(r,R+n)*0.05;
    vec3 tint=mix(vec3(1.0,0.8,0.52),vec3(0.5,0.66,1.0),clamp(R/uExtent*1.4,0.0,1.0))*1.6;
    col+=tint*(ring+trail)*uI[i];
  }
  col*=smoothstep(uExtent,uExtent*0.7,r);
  gl_FragColor=vec4(col,1.0);
}`;

/** Ring emission keyed to scroll: each ring expands over a fixed progress window. */
const RINGS = [0.095, 0.145, 0.195] as const;

function Galaxy({ progress, shared, tier, matter }: { progress: P; shared: Shared; tier: Tier; matter: Matter }) {
  const b = BUDGET[tier];
  const make = (dark: boolean, count: number) => {
    const d = buildGalaxy(count, matter.dust.position, matter.filaments.curves, dark);
    return geometry({ position: [d.position, 3], aTarget: [d.target, 3], aColor: [d.color, 3], aStartColor: [d.startColor, 3], aParams: [d.params, 4] }, count);
  };
  const geo = useMemo(() => make(false, b.galaxy), [b.galaxy, matter]); // eslint-disable-line react-hooks/exhaustive-deps
  const laneGeo = useMemo(() => b.lanes ? make(true, b.lanes) : null, [b.lanes, matter]); // eslint-disable-line react-hooks/exhaustive-deps
  const galUniforms = () => ({ uTilt: { value: GALAXY_TILT }, uCenter: { value: GALAXY_CENTER }, uForm: { value: 0 }, uSpin: { value: 0 }, uWave: { value: -10 } });
  const mat = useMemo(() => pointMaterial(shared, GALAXY_VERT, galUniforms(), { coreK: 20, haloK: 0.32, near: [0.4, 3.5] }), [shared]);
  const laneMat = useMemo(() => pointMaterial(shared, GALAXY_VERT, galUniforms(), { coreK: 4, haloK: 0, near: [3, 9], dark: true }), [shared]);
  const coreMat = useMemo(() => new THREE.ShaderMaterial({ uniforms: { uI: { value: 0 } }, vertexShader: SPRITE_VERT, fragmentShader: CORE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const ringMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uR: { value: new THREE.Vector3(-5, -5, -5) }, uI: { value: new THREE.Vector3() }, uTime: shared.uTime, uExtent: { value: GALAXY_RADIUS * 1.4 } },
    vertexShader: SPRITE_VERT, fragmentShader: RING_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }), [shared]);
  const coreGeo = useMemo(() => new THREE.PlaneGeometry(30, 30), []);
  const ringGeo = useMemo(() => new THREE.PlaneGeometry(GALAXY_RADIUS * 2.8, GALAXY_RADIUS * 2.8), []);
  useDispose(geo, mat, laneMat, coreMat, ringMat, coreGeo, ringGeo, ...(laneGeo ? [laneGeo] : []));

  const pts = useRef<THREE.Points>(null);
  const lanes = useRef<THREE.Points>(null);
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    const p = progress.current;
    const t = shared.uTime.value;
    const form = smooth(0.03, 0.235, p);
    const o = 1 - smooth(0.272, 0.315, p);
    const spin = t * 0.012 + p * 1.4;
    const wave = mix(-4, GALAXY_RADIUS * 1.2, smooth(0.2, 0.26, p));
    for (const m of [mat, laneMat]) {
      m.uniforms.uForm.value = form; m.uniforms.uSpin.value = spin; m.uniforms.uOpacity.value = o; m.uniforms.uWave.value = wave;
    }
    laneMat.uniforms.uOpacity.value = o * 0.9;
    if (pts.current) pts.current.visible = o > 0.002;
    if (lanes.current) lanes.current.visible = o > 0.002 && form > 0.85;

    // Rings: deterministic in p.
    const R = ringMat.uniforms.uR.value as THREE.Vector3, I = ringMat.uniforms.uI.value as THREE.Vector3;
    let ringAny = 0, flashes = 0;
    RINGS.forEach((s, i) => {
      const g = smooth(s, s + 0.085, p);
      const r = mix(0.5, GALAXY_RADIUS * 1.3, g);
      const it = Math.pow(Math.sin(Math.PI * g), 1.4) * 0.26 * o;
      R.setComponent(i, r); I.setComponent(i, it);
      ringAny += it; flashes += pulse(s - 0.01, s, s + 0.01, s + 0.035, p);
    });
    if (ring.current) ring.current.visible = ringAny > 0.003;

    // Core: dramatic distant beacon at the start, light pulses at ring emission, fades as the camera threads it.
    if (core.current) {
      core.current.quaternion.copy(camera.quaternion);
      const dist = camera.position.distanceTo(GALAXY_CENTER);
      const I0 = (0.35 + 0.75 * smooth(0.08, 0.23, p)) * (1 + 0.45 * flashes) * smooth(2.5, 9, dist) * o;
      coreMat.uniforms.uI.value = I0;
      core.current.visible = I0 > 0.002;
    }
  });
  return <>
    <points ref={pts} geometry={geo} material={mat} frustumCulled={false} />
    {laneGeo && <points ref={lanes} geometry={laneGeo} material={laneMat} frustumCulled={false} renderOrder={2} />}
    <mesh ref={core} geometry={coreGeo} material={coreMat} position={GALAXY_CENTER} renderOrder={3} frustumCulled={false} />
    <group position={GALAXY_CENTER} quaternion={GALAXY_QUAT}>
      <mesh ref={ring} geometry={ringGeo} material={ringMat} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} />
    </group>
  </>;
}

/* ================= composition ================= */

type Matter = { dust: ReturnType<typeof buildDust>; filaments: ReturnType<typeof buildFilaments> };

export function CosmicIntro({ progress, shared, tier }: { progress: P; shared: Shared; tier: Tier }) {
  const b = BUDGET[tier];
  // Shared seeded matter: dust and galaxy start positions come from the same filament curves,
  // so the galaxy literally condenses out of the visible cosmic structure.
  const matter = useMemo<Matter>(() => {
    const filaments = buildFilaments(b.curves);
    const dust = buildDust(b.dust, filaments.curves);
    return { dust, filaments };
  }, [b.curves, b.dust]);
  return <>
    <Backdrop progress={progress} shared={shared} tier={tier} />
    <Nebulae progress={progress} shared={shared} tier={tier} matter={matter} />
    <Galaxy progress={progress} shared={shared} tier={tier} matter={matter} />
  </>;
}
