import { AdditiveBlending, Color, ShaderMaterial, UniformsLib, UniformsUtils } from "three";

const vertexShader = /* glsl */ `
  uniform float uUntangle;
  uniform float uSpin;
  attribute vec3 aClean;
  attribute vec3 aCleanNormal;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  #include <fog_pars_vertex>

  vec3 spinY(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  void main() {
    // The head of each pipe straightens first, so the knot visibly "unrolls".
    float k = clamp(uUntangle * 1.6 - uv.x * 0.6, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    vec3 p = mix(spinY(position, uSpin), aClean, k);
    vec3 n = normalize(mix(spinY(normal, uSpin), aCleanNormal, k));

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * n);
    vViewDir = normalize(-mvPosition.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uPulse;
  uniform float uTime;
  uniform float uUntangle;
  uniform float uPulseFreq;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  #include <fog_pars_fragment>

  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 2.0);
    vec3 col = uColor * (0.25 + 1.1 * fres);

    // Amber data packets travelling down the optimized flow.
    float stripe = fract(vUv.x * uPulseFreq - uTime * 0.22);
    float pulse = smoothstep(0.0, 0.015, stripe) * smoothstep(0.07, 0.015, stripe);
    col = mix(col, uPulse * 1.8, pulse * smoothstep(0.6, 1.0, uUntangle));

    gl_FragColor = vec4(col, (0.45 + 0.55 * fres) * uOpacity);
    #include <fog_fragment>
  }
`;

export function createPipeMaterial(opacity: number, pulseFreq: number): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        uColor: { value: new Color("#5ce1e6") },
        uPulse: { value: new Color("#ffb547") },
        uTime: { value: 0 },
        uUntangle: { value: 0 },
        uSpin: { value: 0 },
        uPulseFreq: { value: pulseFreq },
        uOpacity: { value: opacity },
      },
    ]),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: true,
  });
}
