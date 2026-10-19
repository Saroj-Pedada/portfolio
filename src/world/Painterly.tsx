import { useMemo } from 'react'
import * as THREE from 'three'
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// Anisotropy-free Kuwahara filter: each pixel takes the mean colour of whichever of its four
// neighbouring quadrants has the lowest variance, which flattens detail into brush-like strokes.
// Paper grain and a warm vignette finish the "painted canvas" look.
const fragment = /* glsl */ `
uniform int radius;
uniform float grain;
uniform float time;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void quadrant(vec2 uv, ivec2 dir, inout vec3 bestMean, inout float bestVar) {
  vec3 sum = vec3(0.0);
  vec3 sq = vec3(0.0);
  float n = 0.0;
  for (int x = 0; x <= 4; x++) {
    if (x > radius) break;
    for (int y = 0; y <= 4; y++) {
      if (y > radius) break;
      vec3 c = texture2D(inputBuffer, uv + vec2(float(x * dir.x), float(y * dir.y)) * texelSize).rgb;
      sum += c;
      sq += c * c;
      n += 1.0;
    }
  }
  vec3 mean = sum / n;
  vec3 v = abs(sq / n - mean * mean);
  float variance = v.r + v.g + v.b;
  if (variance < bestVar) { bestVar = variance; bestMean = mean; }
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 col = inputColor.rgb;
  if (radius > 0) {
    float bestVar = 1e9;
    vec3 bestMean = col;
    quadrant(uv, ivec2(-1, -1), bestMean, bestVar);
    quadrant(uv, ivec2( 1, -1), bestMean, bestVar);
    quadrant(uv, ivec2(-1,  1), bestMean, bestVar);
    quadrant(uv, ivec2( 1,  1), bestMean, bestVar);
    col = bestMean;
  }
  // canvas weave + grain
  vec2 px = uv * resolution;
  float weave = (sin(px.x * 1.7) * sin(px.y * 1.7)) * 0.012;
  float n = (hash(floor(px * 0.5) + floor(time * 8.0)) - 0.5) * grain;
  col += weave + n;
  // warm vignette
  float vig = smoothstep(1.15, 0.35, length(uv - 0.5) * 1.4);
  col *= mix(vec3(0.55, 0.42, 0.38), vec3(1.0), vig);
  outputColor = vec4(col, inputColor.a);
}
`

class PainterlyEffect extends Effect {
  constructor(radius: number) {
    super('PainterlyEffect', fragment, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, THREE.Uniform>([
        ['radius', new THREE.Uniform(radius)],
        ['grain', new THREE.Uniform(0.035)],
        ['time', new THREE.Uniform(0)],
      ]),
    })
  }
  update(_r: THREE.WebGLRenderer, _i: THREE.WebGLRenderTarget, dt: number) {
    ;(this.uniforms.get('time') as THREE.Uniform<number>).value += dt
  }
}

export function Painterly({ lowPower }: { lowPower: boolean }) {
  const effect = useMemo(() => new PainterlyEffect(lowPower ? 2 : 3), [lowPower])
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.6} luminanceThreshold={0.75} mipmapBlur />
      <primitive object={effect} />
    </EffectComposer>
  )
}
