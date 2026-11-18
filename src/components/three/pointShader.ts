/** Shared GPU point-sprite shader for cosmic web, galaxy and background stars. */
export const pointVertex = /* glsl */ `
attribute float aSize;
attribute vec3 aTint;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
varying vec3 vTint;
void main(){
  vTint = aTint;
  vec3 p = position;
  float d = length(p.xy);
  p.xy += vec2(sin(uTime * 0.13 + d * 0.9), cos(uTime * 0.11 + d * 0.7)) * 0.018;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = clamp(aSize * uSize * uPixelRatio * (75.0 / max(2.0, -mvPosition.z)), 1.0, 48.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;
export const pointFragment = /* glsl */ `
uniform float uOpacity;
varying vec3 vTint;
void main(){
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float halo = exp(-d * d * 21.0) * 0.35;
  float core = exp(-d * d * 190.0);
  float a = clamp(core + halo, 0.0, 1.0) * uOpacity;
  if (a < 0.015) discard;
  gl_FragColor = vec4(vTint * (1.1 + core * 0.5), a);
}
`;
