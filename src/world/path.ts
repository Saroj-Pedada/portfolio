import * as THREE from 'three'
import { regions } from '../content/expedition'

// One stop every SPACING units, winding gently so the camera always sees the next landmark ahead.
export const SPACING = 46
export const N = regions.length

export const anchors = regions.map(
  (_, i) => new THREE.Vector3(Math.sin(i * 0.85) * 16, 0, -i * SPACING),
)

// Extend past both ends so the tangent at the first and last stops stays sensible.
const curvePoints = [
  anchors[0].clone().add(new THREE.Vector3(0, 0, SPACING)),
  ...anchors,
  anchors[N - 1].clone().add(new THREE.Vector3(0, 0, -SPACING)),
]
export const curve = new THREE.CatmullRomCurve3(curvePoints, false, 'centripetal')

// Progress p is measured in "stops": p = 2.5 means halfway between stop 2 and stop 3.
const segs = curvePoints.length - 1
export const pToT = (p: number) => (p + 1) / segs

export function pointAt(p: number, target = new THREE.Vector3()) {
  return curve.getPoint(THREE.MathUtils.clamp(pToT(p), 0, 1), target)
}
export function tangentAt(p: number, target = new THREE.Vector3()) {
  return curve.getTangent(THREE.MathUtils.clamp(pToT(p), 0, 1), target)
}

// The path is monotonic in z, so path x for any z can come from a lookup table.
const LUT_SIZE = 2048
const zStart = curvePoints[0].z
const zEnd = curvePoints[curvePoints.length - 1].z
const lut = new Float32Array(LUT_SIZE)
{
  const samples = curve.getPoints(LUT_SIZE * 2)
  let j = 0
  for (let i = 0; i < LUT_SIZE; i++) {
    const z = zStart + ((zEnd - zStart) * i) / (LUT_SIZE - 1)
    while (j < samples.length - 2 && samples[j + 1].z > z) j++
    const a = samples[j]
    const b = samples[j + 1]
    const f = a.z === b.z ? 0 : (z - a.z) / (b.z - a.z)
    lut[i] = a.x + (b.x - a.x) * THREE.MathUtils.clamp(f, 0, 1)
  }
}
export function pathXAt(z: number) {
  const f = THREE.MathUtils.clamp((z - zStart) / (zEnd - zStart), 0, 1) * (LUT_SIZE - 1)
  const i = Math.floor(f)
  const k = f - i
  return lut[i] * (1 - k) + lut[Math.min(i + 1, LUT_SIZE - 1)] * k
}

// Rolling hills that flatten near the road.
export function heightAt(x: number, z: number) {
  const d = Math.abs(x - pathXAt(z))
  const flat = THREE.MathUtils.smoothstep(d, 5, 22)
  const hills =
    Math.sin(x * 0.07 + 1.3) * Math.cos(z * 0.05) * 3.5 +
    Math.sin(x * 0.19 + z * 0.11) * 1.4 +
    Math.cos(z * 0.21 - x * 0.05) * 0.8 +
    2.2
  return hills * flat - 0.2
}

// Landmarks alternate sides of the road.
export function landmarkPosition(i: number) {
  const side = i % 2 === 0 ? 1 : -1
  const a = anchors[i]
  const t = tangentAt(i)
  const normal = new THREE.Vector3(-t.z, 0, t.x).normalize().multiplyScalar(side * 13)
  const p = a.clone().add(normal)
  p.z -= 4
  p.y = heightAt(p.x, p.z)
  return p
}
