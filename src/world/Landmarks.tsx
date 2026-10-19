import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { regions, type LandmarkKind, type Region } from '../content/expedition'
import { useStore } from '../store'
import { anchors, heightAt, landmarkPosition } from './path'
import { Toon } from './Toon'

// Procedural stand-ins for each region. Each one is self-contained, so swapping a region for a
// free GLB model later means replacing a single component in `builders`.

export function Landmarks() {
  return (
    <>
      {regions.map((r, i) => (
        <Stop key={r.id} region={r} index={i} />
      ))}
    </>
  )
}

function Stop({ region, index }: { region: Region; index: number }) {
  const pos = useMemo(() => landmarkPosition(index), [index])
  const anchor = anchors[index]
  // landmarks face the road
  const yaw = Math.atan2(anchor.x - pos.x, anchor.z - pos.z)
  const Builder = builders[region.landmark]
  // flag sits at the roadside, on the landmark's side
  const flagPos = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(pos, anchor).setY(0).normalize()
    const p = anchor.clone().addScaledVector(dir, 4.2)
    p.y = heightAt(p.x, p.z)
    return p
  }, [pos, anchor])

  return (
    <>
      <group position={pos} rotation={[0, yaw, 0]}>
        <Builder accent={region.palette.accent} />
      </group>
      <Flag position={flagPos} region={region} index={index} />
    </>
  )
}

function Flag({ position, region, index }: { position: THREE.Vector3; region: Region; index: number }) {
  const cloth = useRef<THREE.Group>(null)
  const regionIndex = useStore((s) => s.regionIndex)
  const atStop = useStore((s) => s.atStop)
  const visited = useStore((s) => s.visited.has(index))
  const near = Math.abs(regionIndex - index) <= 1
  const here = regionIndex === index && atStop

  useFrame(({ clock }) => {
    if (!cloth.current) return
    cloth.current.rotation.y = Math.sin(clock.elapsedTime * 2.2 + index) * 0.25
  })

  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    const s = useStore.getState()
    if (here) s.setJournal(true)
    else s.travelTo(index)
  }

  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 4.4, 6]} />
        <Toon color="#3b2a20" />
      </mesh>
      <group ref={cloth} position={[0, 3.7, 0]}>
        <mesh position={[0, 0, 0.8]}>
          <boxGeometry args={[0.04, 1, 1.6]} />
          <Toon color={visited ? region.palette.accent : '#d8cfc0'} emissive={region.palette.accent} intensity={here ? 0.6 : 0.1} />
        </mesh>
      </group>
      <mesh position={[0, 4.5, 0]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <Toon color="#ffd27a" emissive="#ffb347" intensity={here ? 2.5 : 0.8} />
      </mesh>
      {near && (
        <Html position={[0, 5.6, 0]} center distanceFactor={14} zIndexRange={[10, 0]}>
          <button className={`flag-label ${here ? 'is-here' : ''}`} onClick={() => onClick({ stopPropagation() {} })}>
            <span className="flag-name">{region.name}</span>
            {region.dates && <span className="flag-dates">{region.dates}</span>}
            {here && <span className="flag-hint">Open journal · E</span>}
          </button>
        </Html>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// helpers

function Spin({ speed = 0.2, children, axis = 'y' }: { speed?: number; children: ReactNode; axis?: 'x' | 'y' | 'z' }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation[axis] += dt * speed
  })
  return <group ref={g}>{children}</group>
}

function Bob({ amp = 0.4, speed = 1, phase = 0, children }: { amp?: number; speed?: number; phase?: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = Math.sin(clock.elapsedTime * speed + phase) * amp
  })
  return <group ref={g}>{children}</group>
}

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

type BuilderProps = { accent: string }

// ---------------------------------------------------------------------------------------------
// Prologue

function Camp({ accent }: BuilderProps) {
  const flame = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const f = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06
    flame.current?.scale.set(f, f * (1 + Math.sin(t * 9) * 0.1), f)
    if (light.current) light.current.intensity = 30 * f
  })
  return (
    <group>
      {[
        [-5, 0, -2, 0.4],
        [4.5, 0, -3, -0.5],
        [0, 0, -6, 0],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y + 1.6, z]} rotation={[0, r + Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[2.4, 3.2, 4]} />
          <Toon color={['#c9a46e', '#b0413e', '#8a7a5a'][i]} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.2, 0]} rotation={[0, (i * Math.PI) / 4, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 2, 6]} />
          <Toon color="#4a3020" />
        </mesh>
      ))}
      <group ref={flame} position={[0, 0.3, 0]}>
        <mesh position={[0, 0.7, 0]}>
          <coneGeometry args={[0.6, 1.6, 7]} />
          <Toon color="#ff9a3a" emissive="#ff6a00" intensity={2.5} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <coneGeometry args={[0.35, 1.1, 7]} />
          <Toon color={accent} emissive="#ffd27a" intensity={3} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 2, 0]} color="#ff9a4a" distance={22} decay={2} />
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 0.35, 1.5]} rotation={[0, x * 0.3, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 1.8, 8]} />
          <Toon color="#6b4a2e" />
        </mesh>
      ))}
    </group>
  )
}

function Outpost({ accent }: BuilderProps) {
  return (
    <group>
      {[
        [-1.5, -1.5],
        [1.5, -1.5],
        [-1.5, 1.5],
        [1.5, 1.5],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 3.5, z]} castShadow>
          <boxGeometry args={[0.3, 7, 0.3]} />
          <Toon color="#6b4a2e" />
        </mesh>
      ))}
      <mesh position={[0, 7, 0]} castShadow>
        <boxGeometry args={[4.2, 0.4, 4.2]} />
        <Toon color="#8a6a3f" />
      </mesh>
      <mesh position={[0, 9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[3.4, 2.4, 4]} />
        <Toon color="#b0413e" />
      </mesh>
      <Bob amp={0.15} speed={2}>
        <mesh position={[0, 7.9, 0]}>
          <sphereGeometry args={[0.45, 12, 10]} />
          <Toon color={accent} emissive="#ffcf7a" intensity={2.2} />
        </mesh>
      </Bob>
      <pointLight position={[0, 8, 0]} color="#ffcf7a" intensity={20} distance={18} />
      {/* a seedling: the AgriTech beginnings */}
      <mesh position={[3.5, 0.6, 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.2, 6]} />
        <Toon color="#5f7f3a" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[3.5 + s * 0.35, 1.2, 2]} rotation={[0, 0, s * -0.7]} scale={[1, 0.4, 0.6]}>
          <sphereGeometry args={[0.4, 10, 8]} />
          <Toon color="#9acd5a" />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Act I

function Grove({ accent }: BuilderProps) {
  const trees = useMemo(() => {
    const r = seeded(7)
    return Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + r()
      const d = i === 0 ? 0 : 4 + r() * 3
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, s: i === 0 ? 1.8 : 0.8 + r() * 0.5 }
    })
  }, [])
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.4, 3.6, 7]} />
            <Toon color="#5a3e28" />
          </mesh>
          <mesh position={[0, 4.4, 0]} castShadow>
            <icosahedronGeometry args={[2, 0]} />
            <Toon color={i === 0 ? '#c3d86a' : '#7fa04a'} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <Bob key={k} amp={0.3} speed={1.4} phase={i + k * 2}>
              <mesh position={[Math.cos(k * 2.1) * 2, 4 + k * 0.5, Math.sin(k * 2.1) * 2]}>
                <sphereGeometry args={[0.3, 10, 8]} />
                <Toon color={accent} emissive="#e6ff6a" intensity={2.5} />
              </mesh>
            </Bob>
          ))}
        </group>
      ))}
    </group>
  )
}

function Spire({ accent }: BuilderProps) {
  const nodes = useMemo(() => {
    const r = seeded(11)
    return Array.from({ length: 24 }, (_, i) => {
      const layer = Math.floor(i / 6)
      const a = ((i % 6) / 6) * Math.PI * 2 + layer * 0.5
      const rad = 5 - layer * 0.8
      return new THREE.Vector3(Math.cos(a) * rad, 4 + layer * 4 + r() * 0.8, Math.sin(a) * rad)
    })
  }, [])
  const lines = useMemo(() => {
    const pts: number[] = []
    nodes.forEach((n, i) => {
      const next = nodes[i + 6]
      if (next) pts.push(n.x, n.y, n.z, next.x, next.y, next.z)
      const side = nodes[Math.floor(i / 6) * 6 + ((i + 1) % 6)]
      pts.push(n.x, n.y, n.z, side.x, side.y, side.z)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [nodes])
  return (
    <group>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[0, 0.9 + i * 1.6, 0]} rotation={[0, i * 0.28, 0]} castShadow>
          <boxGeometry args={[3.4 - i * 0.18, 1.6, 3.4 - i * 0.18]} />
          <Toon color={i % 2 ? '#5a4a80' : '#6e5c98'} />
        </mesh>
      ))}
      <mesh position={[0, 24, 0]}>
        <octahedronGeometry args={[1.1, 0]} />
        <Toon color={accent} emissive="#c99bff" intensity={3} />
      </mesh>
      <Spin speed={0.15}>
        {nodes.map((n, i) => (
          <mesh key={i} position={n}>
            <sphereGeometry args={[0.32, 10, 8]} />
            <Toon color={accent} emissive="#b88aff" intensity={2.2} />
          </mesh>
        ))}
        <lineSegments geometry={lines}>
          <lineBasicMaterial color="#e8d6ff" transparent opacity={0.6} />
        </lineSegments>
      </Spin>
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Act II

function Foundry({ accent }: BuilderProps) {
  const smoke = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    smoke.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.35 + i / 6) % 1
      c.position.y = 9 + t * 7
      c.scale.setScalar(0.5 + t * 1.4)
      ;((c as THREE.Mesh).material as THREE.MeshToonMaterial).opacity = 1 - t
    })
  })
  return (
    <group>
      {[
        [-4, 0, -1, 5, 4, 5],
        [3, 0, -3, 4, 6, 4],
        [0.5, 0, 3, 6, 3, 3],
      ].map(([x, y, z, w, h, d], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <Toon color={['#8a5a3a', '#a86a42', '#7a4a2e'][i]} />
          </mesh>
          <mesh position={[0, h + 0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[1.6, 1.6, d + 0.2, 3, 1]} />
            <Toon color="#4a2e22" />
          </mesh>
          <mesh position={[0, h * 0.45, d / 2 + 0.02]}>
            <planeGeometry args={[w * 0.5, h * 0.35]} />
            <Toon color={accent} emissive="#ff8a2a" intensity={1.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[3, 7.5, -3]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 4, 8]} />
        <Toon color="#3a2a22" />
      </mesh>
      <group ref={smoke} position={[3, 0, -3]}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.8, 10, 8]} />
            <Toon color="#d8c8b8" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
      {/* the gear */}
      <group position={[-6, 6, 2]} rotation={[0, Math.PI / 2, 0]}>
        <Spin speed={0.6} axis="z">
          <mesh>
            <torusGeometry args={[2, 0.45, 8, 24]} />
            <Toon color="#c08a3a" />
          </mesh>
          {Array.from({ length: 10 }, (_, i) => (
            <mesh key={i} rotation={[0, 0, (i / 10) * Math.PI * 2]} position={[Math.cos((i / 10) * Math.PI * 2) * 2.6, Math.sin((i / 10) * Math.PI * 2) * 2.6, 0]}>
              <boxGeometry args={[0.8, 0.6, 0.6]} />
              <Toon color="#c08a3a" />
            </mesh>
          ))}
        </Spin>
      </group>
      {/* floating desktop-app windows: the Electron apps */}
      {[
        [-2, 9, 4, 0.2],
        [2.8, 11, 3, -0.25],
      ].map(([x, y, z, r], i) => (
        <Bob key={i} amp={0.35} speed={1.1} phase={i * 2}>
          <group position={[x, y, z]} rotation={[0, r, 0]}>
            <mesh>
              <boxGeometry args={[3.6, 2.4, 0.12]} />
              <Toon color="#2a2230" />
            </mesh>
            <mesh position={[0, -0.15, 0.07]}>
              <planeGeometry args={[3.3, 1.8]} />
              <Toon color={i ? '#9ffff0' : '#ffcf7a'} emissive={i ? '#4affd8' : '#ff9a4a'} intensity={1.2} />
            </mesh>
            {[0, 1, 2].map((k) => (
              <mesh key={k} position={[-1.5 + k * 0.28, 1, 0.07]}>
                <circleGeometry args={[0.08, 8]} />
                <meshBasicMaterial color={['#ff5f57', '#febc2e', '#28c840'][k]} />
              </mesh>
            ))}
          </group>
        </Bob>
      ))}
    </group>
  )
}

function Island({ r = 3, children }: { r?: number; children?: ReactNode }) {
  return (
    <group>
      <mesh position={[0, -r * 0.9, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[r, r * 1.8, 7]} />
        <Toon color="#5a4a3a" />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 0.95, 0.5, 7]} />
        <Toon color="#4f8f6a" />
      </mesh>
      {children}
    </group>
  )
}

function Archipelago({ accent }: BuilderProps) {
  const islands = useMemo(
    () => [
      new THREE.Vector3(0, 6, 0),
      new THREE.Vector3(-8, 9, -4),
      new THREE.Vector3(8, 8, -5),
      new THREE.Vector3(1, 12, -10),
    ],
    [],
  )
  const bridges = useMemo(
    () =>
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
      ].map(([a, b]) => {
        const mid = islands[a].clone().lerp(islands[b], 0.5)
        mid.y -= 1.5
        return new THREE.QuadraticBezierCurve3(islands[a].clone().setY(islands[a].y + 0.4), mid, islands[b].clone().setY(islands[b].y + 0.4))
      }),
    [islands],
  )
  const packets = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    packets.current?.children.forEach((m, i) => {
      const curve = bridges[i % bridges.length]
      const t = (clock.elapsedTime * 0.25 + i * 0.37) % 1
      curve.getPoint(t, m.position)
      m.position.y += 0.4
      m.rotation.set(t * 6, t * 4, 0)
    })
  })
  return (
    <group>
      {islands.map((p, i) => (
        <group key={i} position={p}>
          <Bob amp={0.3} speed={0.6} phase={i}>
            <Island r={i === 0 ? 4 : 2.6}>
              {i === 0 && <LatticeGate accent={accent} />}
              {i === 3 && (
                // a little server hut on the far island
                <mesh position={[0, 1.2, 0]} castShadow>
                  <boxGeometry args={[1.6, 2, 1.6]} />
                  <Toon color="#2f4a5a" emissive={accent} intensity={0.15} />
                </mesh>
              )}
            </Island>
          </Bob>
        </group>
      ))}
      {bridges.map((c, i) => (
        <mesh key={i}>
          <tubeGeometry args={[c, 24, 0.12, 6, false]} />
          <Toon color="#3a2a22" />
        </mesh>
      ))}
      <group ref={packets}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <Toon color={accent} emissive="#4affd8" intensity={2.2} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// Arch filled with a lattice: a nod to the lattice-based crypto (ML-KEM) behind PQC VPNs.
function LatticeGate({ accent }: BuilderProps) {
  const bars = []
  for (let i = -3; i <= 3; i++) {
    bars.push(
      <mesh key={`v${i}`} position={[i * 0.45, 2.4, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.06, 4.2, 0.06]} />
        <Toon color={accent} emissive="#4affd8" intensity={1.4} />
      </mesh>,
      <mesh key={`w${i}`} position={[i * 0.45, 2.4, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.06, 4.2, 0.06]} />
        <Toon color={accent} emissive="#4affd8" intensity={1.4} />
      </mesh>,
    )
  }
  return (
    <group position={[0, 0.25, 0]}>
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} position={[x, 2.4, 0]} castShadow>
          <boxGeometry args={[0.6, 4.8, 0.6]} />
          <Toon color="#c9c0b0" />
        </mesh>
      ))}
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[4.4, 0.6, 0.7]} />
        <Toon color="#c9c0b0" />
      </mesh>
      <group scale={[0.75, 1, 1]}>{bars}</group>
    </group>
  )
}

function Cloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[
        [0, 0, 0, 1.6],
        [1.5, -0.3, 0.2, 1.2],
        [-1.4, -0.2, 0.1, 1.1],
        [0.5, 0.7, -0.3, 1.1],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 14, 10]} />
          <Toon color="#ffffff" />
        </mesh>
      ))}
    </group>
  )
}

function Harbor({ accent }: BuilderProps) {
  return (
    <group>
      {/* dock on stilts */}
      {[-3, 0, 3].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 2, z * 1.5]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 4, 6]} />
            <Toon color="#5a4a3a" />
          </mesh>
        )),
      )}
      <mesh position={[0, 4.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.3, 3.6]} />
        <Toon color="#8a6a4a" />
      </mesh>
      {/* airship */}
      <Bob amp={0.6} speed={0.7}>
        <group position={[0, 11, -2]}>
          <mesh scale={[1, 1, 2.4]} castShadow>
            <sphereGeometry args={[2, 20, 14]} />
            <Toon color="#e0d4c0" />
          </mesh>
          {[-1.2, 0, 1.2].map((z) => (
            <mesh key={z} position={[0, 0, z * 2]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[2.02, 0.06, 6, 24]} />
              <Toon color="#b0413e" />
            </mesh>
          ))}
          <mesh position={[0, -2.6, 0]} castShadow>
            <boxGeometry args={[1.4, 0.8, 2.6]} />
            <Toon color="#5a3e28" />
          </mesh>
          <mesh position={[0, 0, -5.2]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[2.4, 0.1, 1]} />
            <Toon color="#b0413e" />
          </mesh>
        </group>
      </Bob>
      {/* containers floating up into the cloud */}
      {['#d0603a', '#3a7ad0', '#e0b04a', '#4aa070'].map((c, i) => (
        <Bob key={c} amp={0.8} speed={0.5} phase={i * 1.5}>
          <mesh position={[-5 + i * 3.2, 7 + i * 1.2, 3]} rotation={[0, i * 0.4, 0]} castShadow>
            <boxGeometry args={[2, 1, 1]} />
            <Toon color={c} />
          </mesh>
        </Bob>
      ))}
      <Cloud position={[-6, 14, -4]} scale={1.4} />
      <Cloud position={[7, 12, -1]} />
      <Cloud position={[2, 16, -8]} scale={1.8} />
      <mesh position={[0, 15, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <Toon color={accent} emissive="#ffffff" intensity={0.5} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Act III

function Caverns({ accent }: BuilderProps) {
  const crystals = useMemo(() => {
    const r = seeded(19)
    return Array.from({ length: 16 }, () => {
      const a = r() * Math.PI * 2
      const d = 3 + r() * 5
      return { x: Math.cos(a) * d, z: Math.sin(a) * d - 1, h: 1.5 + r() * 3.5, tilt: (r() - 0.5) * 0.6, phase: r() * 6 }
    })
  }, [])
  const group = useRef<THREE.Group>(null)
  const beam = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshToonMaterial
      m.emissiveIntensity = 0.8 + Math.sin(t * 1.5 + crystals[i].phase) * 0.6
    })
    // light pulse travels into the box, then is held: a quantum memory in miniature
    if (beam.current) {
      const cycle = (t * 0.4) % 1
      beam.current.scale.y = THREE.MathUtils.smoothstep(cycle, 0, 0.4)
      ;(beam.current.material as THREE.MeshBasicMaterial).opacity = cycle < 0.7 ? 0.7 : 0.7 * (1 - (cycle - 0.7) / 0.3)
    }
  })
  return (
    <group>
      {/* rock arch */}
      <mesh position={[0, 0, -2]} castShadow>
        <torusGeometry args={[8, 2, 8, 20, Math.PI]} />
        <Toon color="#2a3040" />
      </mesh>
      <group ref={group}>
        {crystals.map((c, i) => (
          <mesh key={i} position={[c.x, c.h / 2, c.z]} rotation={[c.tilt, i, c.tilt]} scale={[0.6, c.h, 0.6]} castShadow>
            <octahedronGeometry args={[1, 0]} />
            <meshToonMaterial color="#5fd0e8" emissive="#3ae0ff" emissiveIntensity={1} />
          </mesh>
        ))}
      </group>
      {/* the memory box */}
      <mesh position={[0, 1, 1]} castShadow>
        <cylinderGeometry args={[1.4, 1.6, 2, 8]} />
        <Toon color="#3a4a60" />
      </mesh>
      <mesh position={[0, 2.8, 1]} castShadow>
        <boxGeometry args={[2.4, 1.6, 1.6]} />
        <Toon color="#202838" />
      </mesh>
      <mesh position={[0, 2.8, 1.82]}>
        <planeGeometry args={[1.8, 0.2]} />
        <Toon color={accent} emissive="#7ff3ff" intensity={2.5} />
      </mesh>
      <mesh ref={beam} position={[0, 3.6, 1]}>
        <cylinderGeometry args={[0.15, 0.15, 9, 8, 1, true]} />
        <meshBasicMaterial color="#bff8ff" transparent opacity={0.7} />
      </mesh>
      <pointLight position={[0, 4, 2]} color="#7ff3ff" intensity={30} distance={20} />
    </group>
  )
}

function Peaks({ accent }: BuilderProps) {
  const orbs = useRef<THREE.Mesh[]>([])
  const a = useMemo(() => new THREE.Vector3(-5, 15, -2), [])
  const b = useMemo(() => new THREE.Vector3(6, 13, -4), [])
  const linkGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(Array.from({ length: 40 }, () => new THREE.Vector3())), [])
  const line = useMemo(() => new THREE.Line(linkGeo, new THREE.LineBasicMaterial({ color: accent })), [linkGeo, accent])
  const color = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // both orbs share one colour at every instant: entangled
    color.setHSL((t * 0.08) % 1, 0.8, 0.65)
    orbs.current.forEach((o) => {
      const m = o.material as THREE.MeshToonMaterial
      m.color.copy(color)
      m.emissive.copy(color)
    })
    const pos = linkGeo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < 40; i++) {
      const f = i / 39
      const p = a.clone().lerp(b, f)
      p.y += Math.sin(f * Math.PI) * 2 + Math.sin(f * 20 - t * 4) * 0.3
      pos.setXYZ(i, p.x, p.y, p.z)
    }
    pos.needsUpdate = true
    ;(line.material as THREE.LineBasicMaterial).color.copy(color)
  })
  return (
    <group>
      {[
        [-5, -2, 3, 13],
        [6, -4, 2.6, 11],
        [0.5, -9, 2, 8],
      ].map(([x, z, r, h], i) => (
        <mesh key={i} position={[x, h / 2, z]} castShadow>
          <coneGeometry args={[r, h, 5]} />
          <Toon color={['#5a3a70', '#6a4080', '#7a4a8a'][i]} />
        </mesh>
      ))}
      {[a, b].map((p, i) => (
        <Bob key={i} amp={0.4} speed={1.2}>
          <mesh
            position={p}
            ref={(m) => {
              if (m) orbs.current[i] = m
            }}
          >
            <sphereGeometry args={[0.8, 18, 14]} />
            <meshToonMaterial emissiveIntensity={1.8} />
          </mesh>
        </Bob>
      ))}
      <primitive object={line} />
      {/* floating shards */}
      {Array.from({ length: 8 }, (_, i) => (
        <Bob key={i} amp={0.6} speed={0.8} phase={i}>
          <mesh position={[Math.cos(i) * 9, 4 + (i % 4) * 2.5, Math.sin(i) * 6 - 3]} rotation={[i, i * 2, 0]} castShadow>
            <tetrahedronGeometry args={[0.6 + (i % 3) * 0.3, 0]} />
            <Toon color="#c78bd6" />
          </mesh>
        </Bob>
      ))}
    </group>
  )
}

function Wellspring({ accent }: BuilderProps) {
  const dice = useRef<THREE.Group>(null)
  const spins = useMemo(() => Array.from({ length: 6 }, () => new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(2)), [])
  useFrame(({ clock }, dt) => {
    dice.current?.children.forEach((d, i) => {
      // re-roll the tumble direction now and then: random, all the way down
      if (Math.random() < 0.004) spins[i].set(Math.random(), Math.random(), Math.random()).multiplyScalar(3)
      d.rotation.x += spins[i].x * dt
      d.rotation.y += spins[i].y * dt
      d.rotation.z += spins[i].z * dt
      const a = clock.elapsedTime * 0.4 + (i / 6) * Math.PI * 2
      d.position.set(Math.cos(a) * 3, 5 + Math.sin(clock.elapsedTime * 1.3 + i) * 0.8, Math.sin(a) * 3)
    })
  })
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5, 5.4, 1, 16]} />
        <Toon color="#c9b890" />
      </mesh>
      <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 24]} />
        <Toon color="#7ad0e0" emissive="#9ff0ff" intensity={0.5} />
      </mesh>
      <mesh position={[0, 2.4, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.8, 3, 10]} />
        <Toon color="#c9b890" />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <icosahedronGeometry args={[0.9, 1]} />
        <Toon color={accent} emissive="#ffd27a" intensity={2.5} />
      </mesh>
      <pointLight position={[0, 5, 0]} color="#ffd27a" intensity={25} distance={18} />
      <group ref={dice}>
        {spins.map((_, i) => (
          <mesh key={i} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <Toon color="#fff7ef" emissive={i % 2 ? '#ffd27a' : '#9ffff0'} intensity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Act IV

function useBrushTexture(seed: number, colors: string[]) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 320
    const g = c.getContext('2d')!
    const r = seeded(seed)
    g.fillStyle = colors[0]
    g.fillRect(0, 0, c.width, c.height)
    for (let i = 0; i < 140; i++) {
      g.strokeStyle = colors[1 + Math.floor(r() * (colors.length - 1))]
      g.globalAlpha = 0.25 + r() * 0.5
      g.lineWidth = 6 + r() * 26
      g.lineCap = 'round'
      g.beginPath()
      const x = r() * c.width
      const y = r() * c.height
      g.moveTo(x, y)
      g.quadraticCurveTo(x + (r() - 0.5) * 120, y + (r() - 0.5) * 120, x + (r() - 0.5) * 160, y + (r() - 0.5) * 80)
      g.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [seed, colors])
}

function Canvas3D({ seed, colors, position, rotation }: { seed: number; colors: string[]; position: [number, number, number]; rotation: number }) {
  const tex = useBrushTexture(seed, colors)
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[3.6, 4.4, 0.25]} />
        <Toon color="#b08a3a" />
      </mesh>
      <mesh position={[0, 0, 0.14]}>
        <planeGeometry args={[3.1, 3.9]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

const ART_PALETTES = [
  ['#f2e6d0', '#b0413e', '#e0b04a', '#2d3a5a'],
  ['#1f2a44', '#7ff3ff', '#c78bd6', '#f2e6d0'],
  ['#e8c8a8', '#5f7f3a', '#c48a64', '#8a5a52'],
]

function Atelier() {
  return (
    <group>
      {/* easel */}
      <group position={[0, 0, 2]}>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 2, 0]} rotation={[0.1, 0, x * -0.12]} castShadow>
            <boxGeometry args={[0.15, 4.2, 0.15]} />
            <Toon color="#6b4a2e" />
          </mesh>
        ))}
        <mesh position={[0, 1.9, -0.5]} rotation={[-0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.15, 4, 0.15]} />
          <Toon color="#6b4a2e" />
        </mesh>
        <Canvas3D seed={3} colors={ART_PALETTES[0]} position={[0, 2.8, 0.25]} rotation={0} />
      </group>
      {/* floating gallery: empty frames ready for real artwork */}
      {[
        [-6, 6, -2, 0.5],
        [0, 9, -4, 0],
        [6, 6.5, -2, -0.5],
      ].map(([x, y, z, r], i) => (
        <Bob key={i} amp={0.4} speed={0.7} phase={i * 1.7}>
          <Canvas3D seed={20 + i} colors={ART_PALETTES[i % 3]} position={[x, y, z]} rotation={r} />
        </Bob>
      ))}
      {/* paint pots */}
      {['#b0413e', '#e0b04a', '#3a7ad0', '#5f7f3a'].map((c, i) => (
        <mesh key={c} position={[-2.5 + i * 0.7, 0.35, 3.5]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.7, 10]} />
          <Toon color={c} />
        </mesh>
      ))}
    </group>
  )
}

function Amphitheater({ accent }: BuilderProps) {
  const notes = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    notes.current?.children.forEach((n, i) => {
      const t = (clock.elapsedTime * 0.25 + i / 7) % 1
      n.position.set(Math.sin(t * 6 + i) * 3, 3 + t * 12, -2 + Math.cos(i) * 2)
      n.scale.setScalar(Math.sin(t * Math.PI))
    })
  })
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, i * 0.6 + 0.3, 0]} rotation={[0, Math.PI, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[10 - i * 1.6, 10 - i * 1.6, 0.6, 24, 1, false, -Math.PI / 2, Math.PI]} />
          <Toon color={i % 2 ? '#a86a5a' : '#c08a6a'} />
        </mesh>
      ))}
      {/* giant guitar sculpture */}
      <group position={[0, 2.6, -4]} rotation={[0, 0, 0.18]}>
        <mesh position={[0, 2, 0]} scale={[1, 1, 0.35]} castShadow>
          <sphereGeometry args={[2.4, 24, 16]} />
          <Toon color="#c0703a" />
        </mesh>
        <mesh position={[0, 5, 0]} scale={[1, 1, 0.35]} castShadow>
          <sphereGeometry args={[1.8, 24, 16]} />
          <Toon color="#c0703a" />
        </mesh>
        <mesh position={[0, 3.6, 0.86]}>
          <circleGeometry args={[0.7, 20]} />
          <meshBasicMaterial color="#1a0f0a" />
        </mesh>
        <mesh position={[0, 9.5, 0.2]} castShadow>
          <boxGeometry args={[0.6, 6, 0.3]} />
          <Toon color="#4a2e1e" />
        </mesh>
        <mesh position={[0, 13, 0.2]} castShadow>
          <boxGeometry args={[1, 1.4, 0.3]} />
          <Toon color="#2a1a12" />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-0.25 + i * 0.1, 7.5, 0.9]}>
            <boxGeometry args={[0.02, 11, 0.02]} />
            <meshBasicMaterial color="#f2e6d0" />
          </mesh>
        ))}
      </group>
      <group ref={notes}>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i}>
            <mesh>
              <sphereGeometry args={[0.3, 10, 8]} />
              <Toon color={accent} emissive="#ffb07a" intensity={2} />
            </mesh>
            <mesh position={[0.26, 0.6, 0]}>
              <boxGeometry args={[0.06, 1.2, 0.06]} />
              <Toon color={accent} emissive="#ffb07a" intensity={2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Arcade({ accent }: BuilderProps) {
  return (
    <group>
      {[-3.5, 0, 3.5].map((x, i) => (
        <group key={x} position={[x, 0, -1 + Math.abs(x) * 0.3]} rotation={[0, -x * 0.12, 0]}>
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[2.2, 4, 1.8]} />
            <Toon color={['#3a2a6a', '#5a2a5a', '#2a3a6a'][i]} />
          </mesh>
          <mesh position={[0, 2.7, 0.91]}>
            <planeGeometry args={[1.7, 1.3]} />
            <Toon color={['#5aff9a', '#ff5ad8', '#5ad8ff'][i]} emissive={['#2aff6a', '#ff2ad0', '#2ad0ff'][i]} intensity={1.6} />
          </mesh>
          <mesh position={[0, 4.25, 0.5]}>
            <boxGeometry args={[2.2, 0.5, 0.9]} />
            <Toon color={accent} emissive={accent} intensity={1.2} />
          </mesh>
          <mesh position={[0, 1.6, 1.1]} rotation={[-0.5, 0, 0]}>
            <boxGeometry args={[2, 0.15, 0.7]} />
            <Toon color="#1a1428" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0, -3]}>
        <torusGeometry args={[7, 0.25, 8, 32, Math.PI]} />
        <Toon color={accent} emissive={accent} intensity={2} />
      </mesh>
      {/* a zombie from Zombie Hunter, wandering */}
      <Bob amp={0.15} speed={3}>
        <group position={[6, 0, 3]} rotation={[0, -0.8, 0]}>
          <mesh position={[0, 1.4, 0]} castShadow>
            <capsuleGeometry args={[0.45, 1.2, 4, 8]} />
            <Toon color="#5a7a4a" />
          </mesh>
          <mesh position={[0, 2.6, 0]} castShadow>
            <sphereGeometry args={[0.4, 10, 8]} />
            <Toon color="#7a9a5a" />
          </mesh>
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} position={[x, 2, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <capsuleGeometry args={[0.12, 0.8, 4, 6]} />
              <Toon color="#5a7a4a" />
            </mesh>
          ))}
        </group>
      </Bob>
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Epilogue

function Monolith({ accent }: BuilderProps) {
  return (
    <group position={[0, 0, -10]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * 0.6 + 0.3, 0]} receiveShadow castShadow>
          <boxGeometry args={[14 - i * 3, 0.6, 14 - i * 3]} />
          <Toon color="#3a3440" />
        </mesh>
      ))}
      <mesh position={[0, 24, 0]} castShadow>
        <boxGeometry args={[5, 46, 2.2]} />
        <Toon color="#1e1a24" />
      </mesh>
      <mesh position={[0, 24, 1.12]}>
        <planeGeometry args={[0.25, 40]} />
        <Toon color={accent} emissive="#ffb347" intensity={3} />
      </mesh>
      <Spin speed={0.25}>
        <mesh position={[0, 30, 0]} rotation={[Math.PI / 2.3, 0, 0]}>
          <torusGeometry args={[7, 0.15, 6, 48]} />
          <Toon color={accent} emissive="#ffd27a" intensity={2.5} />
        </mesh>
      </Spin>
      <pointLight position={[0, 6, 6]} color="#ffd27a" intensity={60} distance={30} />
    </group>
  )
}

const builders: Record<LandmarkKind, (p: BuilderProps) => ReactNode> = {
  camp: Camp,
  outpost: Outpost,
  grove: Grove,
  spire: Spire,
  foundry: Foundry,
  archipelago: Archipelago,
  harbor: Harbor,
  caverns: Caverns,
  peaks: Peaks,
  wellspring: Wellspring,
  atelier: Atelier,
  amphitheater: Amphitheater,
  arcade: Arcade,
  monolith: Monolith,
}
