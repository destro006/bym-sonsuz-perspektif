'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mix, smooth } from '@/lib/math';
import { NOISE, POINT_FRAG, POINT_VERT_COMMON } from '../cosmos/glsl';
import type { Shared } from '../cosmos/CosmicIntro';
import type { Tier } from '../cosmos/build';
import { CITY_BUDGET, buildAtmosphere, buildCity } from './city';
import { BASIS_Q, CITY_SIZE, EARTH_BASE_SCALE, EARTH_RADIUS, P0, earthCenter, zoom, zoom01 } from './journey';

type P = React.MutableRefObject<number>;

/* -------------------- staging (pure functions of p) -------------------- */
export const stage = (p: number) => ({
  // Dense from orbit, thinning once the camera is inside it (no snow-globe at street scale).
  atmo: smooth(0.5, 0.57, p) * mix(0.8, 0.22, smooth(0.595, 0.63, p)) * (1 - smooth(0.64, 0.68, p)),
  ring: smooth(0.44, 0.5, p) * (1 - smooth(0.56, 0.61, p)),
  city: smooth(0.575, 0.6, p),
  road: smooth(0.585, 0.665, p),
  parcel: smooth(0.63, 0.7, p),
  build: smooth(0.665, 0.8, p),
  settle: smooth(0.77, 0.84, p),
  mass: smooth(0.73, 0.82, p),
});

/* -------------------- atmosphere (planet units) -------------------- */
const ATMO_VERT = /* glsl */ `
attribute vec3 aColor; attribute vec4 aParams;
uniform float uScale; uniform float uRingSpin; uniform float uRingO; uniform float uCapO; uniform float uFloor;
void main(){
  vec3 p=position; float a=1.0;
  if(aParams.y>0.5){
    // Orbital ring: inclined plane, rotation from time (ambient) + scroll (reversible).
    float ang=p.x+uRingSpin*(1.4/p.y);
    vec3 q=vec3(cos(ang)*p.y,p.z,sin(ang)*p.y);
    float c=cos(0.42),s=sin(0.42);
    p=vec3(q.x,q.y*c-q.z*s,q.y*s+q.z*c);
    a=uRingO;
  } else {
    // Atmospheric winds: slow tangential drift with altitude-dependent turbulence.
    p+=flow3(position*7.0+vec3(uTime*0.03,0.0,aParams.z))*0.004*(1.0+aParams.w*20.0);
    a=uCapO;
  }
  emitPoint(modelViewMatrix*vec4(p,1.0),aParams.x*uScale,aColor,a);
}`;

/* -------------------- city particles (city units) -------------------- */
const CITY_VERT = /* glsl */ `
attribute vec3 aStart; attribute vec3 aColor; attribute vec4 aParams;
uniform float uScale; uniform float uRoad; uniform float uParcel; uniform float uBuild; uniform float uSettle;
uniform float uFloor; uniform float uFog; uniform float uCity;
const float PI=3.14159265;
void main(){
  float kind=aParams.z;
  float prog = kind<0.5 ? uRoad : kind<1.5 ? uParcel : uBuild;
  float k=smoothstep(aParams.y,aParams.y+0.25,prog*1.25);
  float e=k*k*(3.0-2.0*k);
  float mid=sin(PI*e);
  float isB=step(1.5,kind);
  vec3 p=mix(aStart,position,e);
  // Controlled turbulence: strongest in flight, zero once a particle has landed.
  // Edges (kinds 2/5) stay disciplined so façades read as architecture even mid-formation.
  float isEdge=step(1.5,kind)*step(kind,2.5)+step(4.5,kind);
  p+=flow3(position*0.32+vec3(0.0,uTime*0.05,aParams.w))*(mid*mix(0.3,0.09,isEdge)*isB+(1.0-e)*0.25*(1.0-isB))*(1.0-uSettle*0.85);
  // Dust keeps a faint breath after settling.
  // (Only dust, kind 4 — the featured mass's edges/aura, kinds 5/6, must stay on the building.)
  if(kind>3.5&&kind<4.5) p+=flow3(position*0.15+vec3(uTime*0.02))*0.35;
  float vis = kind<0.5 ? mix(0.45,1.0,e) : kind<1.5 ? smoothstep(0.0,0.2,e) : smoothstep(0.0,0.12,e);
  // Energy trails: in-flight particles glow, then calm down as geometry stabilises.
  float energy=1.0+mid*(isB*2.2+0.6)*(1.0-uSettle*0.7);
  // Edges flare when they land, then settle to a restrained highlight.
  if(kind>1.5&&kind<2.5||kind>4.5) energy*=mix(1.0,1.6,smoothstep(0.85,1.0,e)*(1.0-uSettle));
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  float fog=exp(-max(0.0,-mv.z-6.0)*uFog);
  // Traffic shimmer on roads (ambient only).
  float tw = kind<0.5 ? 0.82+0.18*sin(uTime*2.3+aParams.w*7.0) : kind>5.5 ? 0.7+0.3*sin(uTime*1.6+aParams.w*5.0) : 1.0;
  emitPoint(mv,aParams.x*uScale,aColor*energy*tw,vis*fog*uCity);
  vAlpha=max(vAlpha,uFloor*vis*uCity*step(kind,0.5));
}`;

/* -------------------- instanced building mass -------------------- */
const MASS_VERT = /* glsl */ `
attribute vec4 aBox; // x height, y delay, z target, w seed
uniform float uBuild;
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vDim; varying float vTarget; varying float vSeed;
void main(){
  float k=smoothstep(aBox.y,aBox.y+0.25,uBuild*1.25);
  float grow=k*k*(3.0-2.0*k);
  vec3 dim=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
  vec3 pos=position; pos.y*=grow;
  vec4 wp=modelMatrix*instanceMatrix*vec4(pos,1.0);
  vW=wp.xyz; vL=vec3(position.x,position.y*grow,position.z); vDim=dim;
  vN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
  vTarget=aBox.z; vSeed=aBox.w;
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const MASS_FRAG = /* glsl */ `
uniform float uMass; uniform float uFog; uniform vec3 uHaze;
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vDim; varying float vTarget; varying float vSeed;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec3 n=normalize(vN);
  vec3 v=normalize(cameraPosition-vW);
  float fres=pow(1.0-abs(dot(n,v)),3.0);
  vec3 col=vec3(0.010,0.014,0.026)+vec3(0.05,0.10,0.2)*fres*0.6;
  // Window grid on the side faces (local unit box → metric via instance dims).
  float side=1.0-step(0.9,abs(n.y));
  vec2 f=vec2(abs(n.x)>0.5? vL.z*vDim.z : vL.x*vDim.x, vL.y*vDim.y);
  vec2 cell=floor(f/vec2(0.11,0.24));
  vec2 g=fract(f/vec2(0.11,0.24));
  float win=step(0.18,g.x)*step(g.x,0.82)*step(0.25,g.y)*step(g.y,0.8);
  float lit=step(mix(0.7,0.45,vTarget),hash(cell+vSeed*91.0));
  col+=vec3(1.0,0.7,0.38)*win*lit*side*mix(0.22,0.45,vTarget);
  // Roof edge glow for the featured mass.
  col+=vec3(1.0,0.8,0.5)*vTarget*smoothstep(0.9,1.0,vL.y)*0.15;
  float d=length(cameraPosition-vW);
  float fog=1.0-exp(-max(0.0,d-6.0)*uFog);
  col=mix(col,uHaze,fog);
  gl_FragColor=vec4(col,uMass);
}`;

/* -------------------- architectural linework (grows with the mass) -------------------- */
const EDGE_VERT = /* glsl */ `
attribute vec4 aBox; attribute float aRise;
uniform float uBuild; uniform float uSettle; uniform float uFog;
varying vec3 vColor; varying float vA;
void main(){
  float k=smoothstep(aBox.y,aBox.y+0.25,uBuild*1.25);
  float grow=k*k*(3.0-2.0*k);
  vec3 p=position; p.y*=grow;
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  float fog=exp(-max(0.0,-mv.z-6.0)*uFog);
  // Edges trace in bright while rising, then settle to a restrained highlight.
  float flare=sin(3.14159*grow)*(1.0-uSettle);
  vColor=mix(vec3(0.35,0.55,0.95),vec3(1.0,0.78,0.48),aBox.z)*(0.16+aBox.z*0.25+flare*0.7+aRise*0.1);
  vA=step(0.001,grow)*fog;
  gl_Position=projectionMatrix*mv;
}`;
const EDGE_FRAG = /* glsl */ `varying vec3 vColor; varying float vA; void main(){ if(vA<0.002) discard; gl_FragColor=vec4(vColor,vA); }`;

/* -------------------- ground light density (orbit → street scale) -------------------- */
const GLOW_VERT = /* glsl */ `varying vec2 vXZ; void main(){ vXZ=position.xz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const GLOW_FRAG = NOISE + /* glsl */ `
uniform vec3 uD[7]; uniform float uGlow; uniform float uRoad;
varying vec2 vXZ;
void main(){
  float dens=0.0;
  for(int i=0;i<7;i++){ vec2 d=vXZ-uD[i].xy; dens+=exp(-dot(d,d)/(uD[i].z*uD[i].z)); }
  dens+=0.35*exp(-dot(vXZ,vXZ)/900.0);
  // Road-network mask using the SAME warp functions as the generated particle roads (city.ts).
  float S=4.2;
  float i=floor(vXZ.y/S+0.5), j=floor(vXZ.x/S+0.5);
  float wz=0.7*sin(vXZ.x*0.07+i*1.7)+0.35*sin(vXZ.x*0.17+i*0.6);
  float wx=0.7*sin(vXZ.y*0.06+j*2.1)+0.3*sin(vXZ.y*0.19+j*0.9);
  float gz=abs(vXZ.y-(i*S+wz)), gx=abs(vXZ.x-(j*S+wx));
  float roads=max(exp(-gz*gz*40.0),exp(-gx*gx*40.0));
  float n=snoise(vec3(vXZ*0.12,1.0))*0.5+0.5;
  float dd=pow(dens,1.4);
  vec3 col=vec3(1.0,0.62,0.3)*dd*(0.2+0.8*n)*mix(1.0,0.15+roads*1.2,uRoad)+vec3(0.25,0.45,0.9)*dd*0.1;
  float edge=smoothstep(45.0,30.0,length(vXZ));
  gl_FragColor=vec4(col*edge*uGlow,1.0);
}`;

function useDispose(...items: ({ dispose: () => void } | null)[]) {
  useEffect(() => () => items.forEach(i => i?.dispose()), items); // eslint-disable-line react-hooks/exhaustive-deps
}

export function DescentField({ progress, shared, tier }: { progress: P; shared: Shared; tier: Tier }) {
  const budget = CITY_BUDGET[tier];
  const common = (extra: Record<string, THREE.IUniform>, vert: string, near: [number, number], coreK = 18, haloK = 0.3) => new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime, uHalfH: shared.uHalfH, uMaxPx: shared.uMaxPx,
      uOpacity: { value: 1 }, uNear: { value: new THREE.Vector2(...near) }, uCoreK: { value: coreK }, uHaloK: { value: haloK },
      uScale: { value: 1 }, uFloor: { value: 0 }, ...extra,
    },
    vertexShader: NOISE + POINT_VERT_COMMON + vert, fragmentShader: POINT_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

  /* atmosphere */
  const atmoData = useMemo(() => buildAtmosphere(Math.round(budget.roads * 0.36), Math.round(budget.roads * 0.18)), [budget.roads]);
  const atmoGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(atmoData.position, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(atmoData.color, 3));
    g.setAttribute('aParams', new THREE.BufferAttribute(atmoData.params, 4));
    return g;
  }, [atmoData]);
  const atmoMat = useMemo(() => common({ uRingSpin: { value: 0 }, uRingO: { value: 0 }, uCapO: { value: 0 } }, ATMO_VERT, [0.8, 4.0]), [shared]); // eslint-disable-line react-hooks/exhaustive-deps

  /* city */
  const city = useMemo(() => buildCity(budget), [budget]);
  const cityGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(city.position, 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(city.start, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(city.color, 3));
    g.setAttribute('aParams', new THREE.BufferAttribute(city.params, 4));
    g.setDrawRange(0, city.count);
    return g;
  }, [city]);
  const cityMat = useMemo(() => common({
    uRoad: { value: 0 }, uParcel: { value: 0 }, uBuild: { value: 0 }, uSettle: { value: 0 }, uFog: { value: 0.03 }, uCity: { value: 0 },
  }, CITY_VERT, [0.12, 0.9], 16, 0.35), [shared]); // eslint-disable-line react-hooks/exhaustive-deps

  /* mass */
  const massGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const massMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uBuild: { value: 0 }, uMass: { value: 0 }, uFog: { value: 0.03 }, uHaze: { value: new THREE.Color(0.012, 0.03, 0.06) } },
    vertexShader: MASS_VERT, fragmentShader: MASS_FRAG, transparent: true, depthWrite: true,
  }), []);
  const mass = useMemo(() => {
    const m = new THREE.InstancedMesh(massGeo, massMat, city.boxes.length);
    const box = new Float32Array(city.boxes.length * 4);
    const mtx = new THREE.Matrix4();
    city.boxes.forEach((b, i) => {
      // Slightly inside the particle hull so edge/window particles stay visible on the surface.
      mtx.makeScale(b.w * 0.97, b.h * 0.995, b.d * 0.97).setPosition(b.x, 0, b.z);
      m.setMatrixAt(i, mtx);
      box[i * 4] = b.h; box[i * 4 + 1] = b.delay; box[i * 4 + 2] = b.target ? 1 : 0; box[i * 4 + 3] = b.seed;
    });
    massGeo.setAttribute('aBox', new THREE.InstancedBufferAttribute(box, 4));
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    m.renderOrder = 1;
    return m;
  }, [massGeo, massMat, city]);
  const glowGeo = useMemo(() => { const g = new THREE.PlaneGeometry(90, 90, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0.005, 0); return g; }, []);
  const glowMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uD: { value: city.districts.map((d, i) => new THREE.Vector3(d.x, d.y, i === 0 ? 7 : 4 + (i % 3) * 1.5)) }, uGlow: { value: 0 }, uRoad: { value: 0 } },
    vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [city]);
  const glow = useRef<THREE.Mesh>(null);
  const edgeGeo = useMemo(() => {
    const E = [[0,0,0,1,0,0],[1,0,0,1,0,1],[1,0,1,0,0,1],[0,0,1,0,0,0],[0,1,0,1,1,0],[1,1,0,1,1,1],[1,1,1,0,1,1],[0,1,1,0,1,0],[0,0,0,0,1,0],[1,0,0,1,1,0],[1,0,1,1,1,1],[0,0,1,0,1,1]];
    const nb = city.boxes.length, pos = new Float32Array(nb * 24 * 3), box = new Float32Array(nb * 24 * 4), rise = new Float32Array(nb * 24);
    let v = 0;
    for (const b of city.boxes) for (const e of E) for (let s = 0; s < 2; s++) {
      const x = e[s * 3], y = e[s * 3 + 1], z = e[s * 3 + 2];
      pos[v * 3] = b.x + (x - 0.5) * b.w; pos[v * 3 + 1] = y * b.h; pos[v * 3 + 2] = b.z + (z - 0.5) * b.d;
      box[v * 4] = b.h; box[v * 4 + 1] = b.delay; box[v * 4 + 2] = b.target ? 1 : 0; box[v * 4 + 3] = b.seed; rise[v] = y;
      v++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aBox', new THREE.BufferAttribute(box, 4));
    g.setAttribute('aRise', new THREE.BufferAttribute(rise, 1));
    return g;
  }, [city]);
  const edgeMat = useMemo(() => new THREE.ShaderMaterial({ uniforms: { uBuild: { value: 0 }, uSettle: { value: 0 }, uFog: { value: 0.03 } }, vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const edges = useRef<THREE.LineSegments>(null);
  useDispose(atmoGeo, atmoMat, cityGeo, cityMat, massGeo, massMat, glowGeo, glowMat, edgeGeo, edgeMat);

  const atmoGroup = useRef<THREE.Group>(null);
  const cityGroup = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = progress.current;
    const st = stage(p);
    const Z = zoom(p);
    const t = shared.uTime.value;
    // Planet-unit group follows the growing Earth about the fixed descent point.
    if (atmoGroup.current) {
      const R = EARTH_RADIUS * EARTH_BASE_SCALE * Z;
      atmoGroup.current.position.copy(earthCenter(Z, tmp));
      atmoGroup.current.scale.setScalar(R);
      atmoGroup.current.visible = st.atmo + st.ring > 0.002;
      atmoMat.uniforms.uScale.value = R;
      atmoMat.uniforms.uCapO.value = st.atmo;
      atmoMat.uniforms.uRingO.value = st.ring;
      atmoMat.uniforms.uRingSpin.value = t * 0.03 + p * 4.0;
    }
    if (cityGroup.current) {
      const s = Z / CITY_SIZE;
      cityGroup.current.scale.setScalar(s);
      cityGroup.current.visible = st.city > 0.002;
      cityMat.uniforms.uScale.value = s;
      cityMat.uniforms.uCity.value = st.city;
      cityMat.uniforms.uRoad.value = st.road;
      cityMat.uniforms.uParcel.value = st.parcel;
      cityMat.uniforms.uBuild.value = st.build;
      cityMat.uniforms.uSettle.value = st.settle;
      // From orbit the whole city is sub-pixel: keep its light visible as a glowing cluster.
      cityMat.uniforms.uFloor.value = 0.3 * (1 - smooth(0.4, 0.8, zoom01(p)));
      // Light density reads from orbit, then yields to discrete particles at street scale.
      // Orbit/aerial scale only: hands over to the warped particle roads before street scale.
      const gI = st.city * 0.45 * (1 - smooth(0.635, 0.668, p));
      glowMat.uniforms.uGlow.value = gI;
      glowMat.uniforms.uRoad.value = st.road;
      if (glow.current) glow.current.visible = gI > 0.002;
      edgeMat.uniforms.uBuild.value = st.build;
      edgeMat.uniforms.uSettle.value = st.settle;
      if (edges.current) edges.current.visible = st.build > 0.001;
      massMat.uniforms.uBuild.value = st.build;
      massMat.uniforms.uMass.value = st.mass * 0.94;
      mass.visible = st.mass > 0.002;
    }
  });
  return <>
    <group ref={atmoGroup} quaternion={BASIS_Q}>
      <points geometry={atmoGeo} material={atmoMat} frustumCulled={false} />
    </group>
    <group ref={cityGroup} position={P0} quaternion={BASIS_Q}>
      <mesh ref={glow} geometry={glowGeo} material={glowMat} frustumCulled={false} />
      <primitive object={mass} />
      <lineSegments ref={edges} geometry={edgeGeo} material={edgeMat} frustumCulled={false} renderOrder={3} />
      <points geometry={cityGeo} material={cityMat} frustumCulled={false} renderOrder={2} />
    </group>
  </>;
}

