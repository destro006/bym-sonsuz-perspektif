/**
 * Shared GLSL chunks for the cosmic intro.
 * Three.js (r180, WebGL2) compiles ShaderMaterial as GLSL ES 3.00 with compatibility defines,
 * so `texelFetch` is available in vertex shaders.
 */

/** Ashima / Stefan Gustavson 3D simplex noise (MIT) + a cheap 3-channel flow field. */
export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 flow3(vec3 p){
  return vec3(snoise(p),snoise(p+vec3(31.4,-17.2,9.1)),snoise(p+vec3(-7.7,23.9,-41.3)));
}
`;

/**
 * Point sprites sized in WORLD units (perspective-correct, DPR-independent).
 * Sub-pixel points are drawn at 1px with their energy folded into alpha, which removes the
 * crawling/flicker that fixed-size additive points produce while the camera moves.
 */
export const POINT_VERT_COMMON = /* glsl */ `
uniform float uTime;
uniform float uHalfH;
uniform float uMaxPx;
uniform float uOpacity;
uniform vec2 uNear;
varying vec3 vColor;
varying float vAlpha;
void emitPoint(vec4 mv, float worldSize, vec3 color, float alpha){
  float depth=-mv.z;
  float px=worldSize*projectionMatrix[1][1]*uHalfH/max(depth,0.001);
  float cover=clamp(px*px,0.0,1.0);
  // Points that would exceed the hardware/aesthetic cap lose energy instead of turning into discs.
  float capped=clamp(uMaxPx/max(px,1.0),0.0,1.0);
  gl_PointSize=clamp(px,1.0,uMaxPx);
  float near=smoothstep(uNear.x,uNear.y,depth);
  vColor=color;
  vAlpha=alpha*cover*near*uOpacity*mix(0.35,1.0,capped);
  gl_Position=projectionMatrix*mv;
}
`;

/** Soft luminous sprite: sharp core + wide halo. Additive. */
export const POINT_FRAG = /* glsl */ `
uniform float uCoreK;
uniform float uHaloK;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c=gl_PointCoord*2.0-1.0;
  float d2=dot(c,c);
  if(d2>1.0) discard;
  float core=exp(-d2*uCoreK);
  float halo=exp(-d2*3.2)*uHaloK;
  float a=(core+halo)*(1.0-d2)*vAlpha;
  if(a<0.0015) discard;
#ifdef DARK
  gl_FragColor=vec4(vec3(0.006,0.005,0.011),clamp(a,0.0,0.85));
#else
  gl_FragColor=vec4(vColor,a);
#endif
}
`;
