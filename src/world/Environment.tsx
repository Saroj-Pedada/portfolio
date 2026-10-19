import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { regions } from '../content/expedition'
import { N, SPACING, curve, heightAt, landmarkPosition, pathXAt, pointAt } from './path'
import { travel } from './travel'

const palettes = regions.map((r) => ({
  ground: new THREE.Color(r.palette.ground),
  sky: new THREE.Color(r.palette.sky),
  fog: new THREE.Color(r.palette.fog),
  accent: new THREE.Color(r.palette.accent),
}))

// Blend the two palettes either side of progress p.
export function paletteAt(p: number, key: 'ground' | 'sky' | 'fog' | 'accent', out: THREE.Color) {
  const c = THREE.MathUtils.clamp(p, 0, N - 1)
  const i = Math.floor(c)
  const f = THREE.MathUtils.smoothstep(c - i, 0.25, 0.75)
  return out.copy(palettes[i][key]).lerp(palettes[Math.min(i + 1, N - 1)][key], f)
}

export function Terrain() {
  const geometry = useMemo(() => {
    const length = N * SPACING + 260
    const g = new THREE.PlaneGeometry(320, length, 140, Math.round(length / 2.2))
    g.rotateX(-Math.PI / 2)
    g.translate(0, 0, -(N - 1) * SPACING * 0.5)
    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    const dark = new THREE.Color('#2a1f1a')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const h = heightAt(x, z)
      pos.setY(i, h)
      paletteAt(-z / SPACING, 'ground', c)
      // darker in hollows, lighter on crests, plus a little painterly jitter
      c.lerp(dark, THREE.MathUtils.clamp(0.25 - h * 0.05, 0, 0.35))
      c.offsetHSL(0, 0, (Math.sin(x * 1.3) * Math.cos(z * 1.7)) * 0.03)
      c.toArray(colors, i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  )
}

export function Road() {
  const geometry = useMemo(() => {
    const samples = 900
    const width = 2.6
    const positions: number[] = []
    const indices: number[] = []
    const p = new THREE.Vector3()
    const t = new THREE.Vector3()
    for (let i = 0; i <= samples; i++) {
      const u = i / samples
      curve.getPoint(u, p)
      curve.getTangent(u, t)
      const nx = -t.z
      const nz = t.x
      const len = Math.hypot(nx, nz) || 1
      for (const s of [-1, 1]) {
        const x = p.x + (nx / len) * width * s
        const z = p.z + (nz / len) * width * s
        positions.push(x, heightAt(x, z) + 0.06, z)
      }
      if (i < samples) {
        const a = i * 2
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setIndex(indices)
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial color="#c9a46e" />
    </mesh>
  )
}

const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const skyFragment = /* glsl */ `
uniform vec3 top;
uniform vec3 horizon;
uniform vec3 sun;
varying vec3 vDir;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  float h = clamp(vDir.y, -0.2, 1.0);
  vec3 col = mix(horizon, top, smoothstep(0.0, 0.55, h));
  // soft brushed cloud bands
  float band = sin(vDir.x * 9.0 + vDir.y * 30.0) * sin(vDir.z * 7.0 - vDir.y * 18.0);
  col += smoothstep(0.55, 1.0, band) * 0.08 * (1.0 - h);
  // sun glow low on the horizon ahead
  float s = max(dot(vDir, normalize(vec3(0.3, 0.12, -1.0))), 0.0);
  col += sun * (pow(s, 40.0) * 0.9 + pow(s, 6.0) * 0.25);
  gl_FragColor = vec4(col, 1.0);
}`

export function Atmosphere() {
  const { scene } = useThree()
  const sky = useRef<THREE.Mesh>(null)
  const sunLight = useRef<THREE.DirectionalLight>(null)
  const uniforms = useMemo(
    () => ({
      top: { value: new THREE.Color() },
      horizon: { value: new THREE.Color() },
      sun: { value: new THREE.Color() },
    }),
    [],
  )
  const fog = useMemo(() => new THREE.Fog('#e9a965', 30, 150), [])
  scene.fog = fog
  const tmp = useMemo(() => new THREE.Color(), [])
  const pos = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const p = travel.p
    paletteAt(p, 'fog', fog.color)
    paletteAt(p, 'fog', uniforms.horizon.value)
    paletteAt(p, 'sky', tmp)
    uniforms.top.value.copy(tmp).offsetHSL(0.02, 0.05, -0.18)
    paletteAt(p, 'accent', uniforms.sun.value)
    pointAt(p, pos)
    if (sky.current) sky.current.position.copy(pos)
    if (sunLight.current) {
      sunLight.current.position.set(pos.x + 30, 45, pos.z + 10)
      sunLight.current.target.position.set(pos.x, 0, pos.z - 10)
      sunLight.current.target.updateMatrixWorld()
      paletteAt(p, 'accent', sunLight.current.color).lerp(new THREE.Color('#ffffff'), 0.5)
    }
  })

  return (
    <>
      <mesh ref={sky} renderOrder={-1}>
        <sphereGeometry args={[400, 32, 16]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
          uniforms={uniforms}
          vertexShader={skyVertex}
          fragmentShader={skyFragment}
        />
      </mesh>
      <hemisphereLight args={['#fff1d6', '#3a2a40', 0.9]} />
      <directionalLight
        ref={sunLight}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-far={150}
      />
    </>
  )
}

// Drifting petals / motes that travel with the expedition.
export function Motes() {
  const group = useRef<THREE.Group>(null)
  const pos = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    pointAt(travel.p, pos)
    group.current?.position.set(pos.x, 6, pos.z - 10)
  })
  return (
    <group ref={group}>
      <Sparkles count={140} scale={[60, 14, 60]} size={5} speed={0.35} opacity={0.75} color="#ffe2b0" />
    </group>
  )
}

// Scattered trees and rocks so the land between landmarks is not empty.
export function Scatter() {
  const { trees, rocks } = useMemo(() => {
    const rand = mulberry32(33)
    const trees: { m: THREE.Matrix4; c: THREE.Color }[] = []
    const rocks: { m: THREE.Matrix4; c: THREE.Color }[] = []
    const plots = regions.map((_, i) => landmarkPosition(i))
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const zMax = SPACING
    const zMin = -(N - 1) * SPACING - SPACING
    for (let i = 0; i < 1100; i++) {
      const z = zMin + rand() * (zMax - zMin)
      const x = pathXAt(z) + (rand() - 0.5) * 220
      const h = heightAt(x, z)
      if (h < 0.7) continue // keeps the road clear
      if (plots.some((p) => Math.hypot(p.x - x, p.z - z) < 15)) continue
      const s = 0.7 + rand() * 1.4
      q.setFromAxisAngle(up, rand() * Math.PI * 2)
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(x, h, z),
        q,
        new THREE.Vector3(s, s * (0.8 + rand() * 0.6), s),
      )
      const c = paletteAt(-z / SPACING, 'ground', new THREE.Color()).offsetHSL(rand() * 0.04, 0.05, -0.08)
      ;(rand() < 0.78 ? trees : rocks).push({ m, c })
    }
    return { trees, rocks }
  }, [])

  const treeRef = useRef<THREE.InstancedMesh>(null)
  const rockRef = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    for (const [mesh, items] of [
      [treeRef.current, trees],
      [rockRef.current, rocks],
    ] as const) {
      if (!mesh) continue
      items.forEach(({ m, c }, i) => {
        mesh.setMatrixAt(i, m)
        mesh.setColorAt(i, c)
      })
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  }, [trees, rocks])

  return (
    <>
      <instancedMesh ref={treeRef} args={[undefined, undefined, trees.length]} castShadow>
        <coneGeometry args={[1.4, 4.5, 6]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, rocks.length]} castShadow>
        <dodecahedronGeometry args={[0.9, 0]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
    </>
  )
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
