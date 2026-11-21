'use client';
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { mix, pulse, smooth } from '@/lib/math';

/**
 * Pipeline (three built-in composer, as recommended by the awwwards-3d skill):
 *   RenderPass → HalfFloat HDR target (linear, no tone mapping)
 *   UnrealBloomPass (threshold on HDR luminance = selective bloom on cores/streams only)
 *   OutputPass (ACESFilmic tone mapping + sRGB, applied exactly once)
 *   Grade pass (display space): soft vignette, gated chromatic fringe, flash lift, film grain.
 * The composer runs through the cosmic, planetary and city chapters (city lights need the bloom).
 * Only while the review-required project photo fully covers the frame is it bypassed, so the
 * photo keeps its original (non tone-mapped) colour handling; the city behind is ~10% visible.
 */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    uVignette: { value: 0.22 }, uGrain: { value: 0.035 }, uCA: { value: 0 }, uFlash: { value: 0 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes;
uniform float uVignette; uniform float uGrain; uniform float uCA; uniform float uFlash;
varying vec2 vUv;
void main(){
  vec2 c=vUv-0.5;
  vec3 col;
  if(uCA>0.0002){
    vec2 o=c*dot(c,c)*uCA;
    col=vec3(texture2D(tDiffuse,vUv+o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-o).b);
  } else col=texture2D(tDiffuse,vUv).rgb;
  col+=uFlash*vec3(1.0,0.92,0.78)*(1.0-dot(c,c)*1.6);
  float v=smoothstep(0.9,0.25,length(c*vec2(1.0,1.15)));
  col*=mix(1.0-uVignette,1.0,v);
  float g=fract(sin(dot(floor(vUv*uRes)+fract(uTime*7.31)*vec2(91.7,47.3),vec2(12.9898,78.233)))*43758.5453);
  col+=(g-0.5)*uGrain;
  gl_FragColor=vec4(col,1.0);
}`,
};

export function PostFX({ progress, bloomScale }: { progress: React.MutableRefObject<number>; bloomScale: number }) {
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);
  const camera = useThree(s => s.camera);
  const size = useThree(s => s.size);
  const dpr = useThree(s => s.viewport.dpr);

  const { composer, bloom, grade } = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.75, 0.55, 0.72);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
    return { composer, bloom, grade };
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
    // Bloom is blurry by nature: run it at reduced resolution on weaker tiers.
    if (bloomScale < 1) bloom.setSize(Math.round(size.width * dpr * bloomScale), Math.round(size.height * dpr * bloomScale));
    (grade.uniforms.uRes.value as THREE.Vector2).set(size.width * dpr, size.height * dpr);
  }, [composer, bloom, grade, size, dpr, bloomScale]);

  useEffect(() => () => { composer.passes.forEach(p => p.dispose()); composer.dispose(); }, [composer]);

  useFrame((state, delta) => {
    const p = progress.current;
    // Once the photo covers the frame the architectural chapter is shown ungraded (no bloom,
    // vignette or grain over the photograph) through to the end of the journey.
    if (p > 0.868) { gl.render(scene, camera); return; }
    bloom.strength = mix(mix(0.78, 0.42, smooth(0.3, 0.45, p)), 0.62, smooth(0.58, 0.68, p));
    bloom.radius = mix(0.62, 0.45, smooth(0.3, 0.45, p));
    grade.uniforms.uTime.value = state.clock.elapsedTime;
    // Flash lift bridges the camera threading the galactic core; fringe only while warping.
    grade.uniforms.uFlash.value = 0.32 * pulse(0.245, 0.262, 0.268, 0.295, p);
    grade.uniforms.uCA.value = 0.012 * pulse(0.2, 0.245, 0.265, 0.29, p);
    composer.render(delta);
  }, 1);
  return null;
}
