import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { regions, type LandmarkKind, type Region } from '../content/expedition'
import { maxReach, useStore } from '../store'
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
  // flag sits at the roadside, on the landmark's side; the boss waits a little further in
  const { flagPos, bossPos } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(pos, anchor).setY(0).normalize()
    const f = anchor.clone().addScaledVector(dir, 4.2)
    f.y = heightAt(f.x, f.z)
    const b = anchor.clone().addScaledVector(dir, 7.5)
    b.z -= 3
    b.y = heightAt(b.x, b.z)
    return { flagPos: f, bossPos: b }
  }, [pos, anchor])
  const cleared = useStore((s) => s.cleared.has(index))

  return (
    <>
      <group position={pos} rotation={[0, yaw, 0]}>
        <Builder accent={region.palette.accent} />
      </group>
      <Flag position={flagPos} region={region} index={index} />
      {region.battle && !cleared && <BossMarker position={bossPos} color={region.battle.boss.color} index={index} />}
    </>
  )
}

function Flag({ position, region, index }: { position: THREE.Vector3; region: Region; index: number }) {
  const cloth = useRef<THREE.Group>(null)
  const regionIndex = useStore((s) => s.regionIndex)
  const atStop = useStore((s) => s.atStop)
  const cleared = useStore((s) => s.cleared.has(index))
  const locked = useStore((s) => index > maxReach(s.cleared))
  const near = Math.abs(regionIndex - index) <= 1
  const here = regionIndex === index && atStop
  const battle = !!region.battle
  const clothColor = battle ? (cleared ? region.palette.accent : '#b0413e') : region.palette.accent

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
          <Toon color={clothColor} emissive={clothColor} intensity={here ? 0.6 : 0.1} />
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
            {battle && (
              <span className="flag-status">{locked ? '🔒 Locked' : cleared ? '✓ Cleared' : `⚔ ${region.battle!.boss.name}`}</span>
            )}
            {here && <span className="flag-hint">Open journal · E</span>}
          </button>
        </Html>
      )}
    </group>
  )
}

// A dark, spiked creature guarding every place not yet won. It vanishes once its boss falls.
function BossMarker({ position, color, index }: { position: THREE.Vector3; color: string; index: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    const t = clock.elapsedTime + index
    g.current.position.y = position.y + 3.2 + Math.sin(t * 1.4) * 0.35
    g.current.rotation.y = t * 0.6
  })
  const spikes = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2
        const up = i % 2 ? 0.5 : -0.3
        return new THREE.Euler(up, a, Math.PI / 2)
      }),
    [],
  )
  return (
    <group ref={g} position={[position.x, position.y + 3, position.z]} scale={1.1}>
      <mesh castShadow>
        <icosahedronGeometry args={[1.3, 0]} />
        <Toon color="#1a1220" />
      </mesh>
      {spikes.map((r, i) => (
        <group key={i} rotation={r}>
          <mesh position={[0, 1.7, 0]} castShadow>
            <coneGeometry args={[0.28, 1.3, 5]} />
            <Toon color="#2a1a2e" />
          </mesh>
        </group>
      ))}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.25, 1.12]}>
          <sphereGeometry args={[0.18, 10, 8]} />
          <Toon color={color} emissive={color} intensity={3} />
        </mesh>
      ))}
      <pointLight color={color} intensity={8} distance={8} />
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
      <CampExtras />
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 0.35, 1.5]} rotation={[0, x * 0.3, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 1.8, 8]} />
          <Toon color="#6b4a2e" />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Act I

function Archive({ accent }: BuilderProps) {
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
      {/* the archive's books, drifting off the shelves */}
      {Array.from({ length: 10 }, (_, i) => (
        <Bob key={`b${i}`} amp={0.5} speed={0.9} phase={i * 0.7}>
          <mesh position={[Math.cos(i * 0.63) * 7, 3 + (i % 5) * 3.2, Math.sin(i * 0.63) * 7]} rotation={[0.3, i, 0.4]} castShadow>
            <boxGeometry args={[1.1, 1.5, 0.35]} />
            <Toon color={['#8a3a3a', '#3a5a8a', '#c9a046', '#4a7a4a'][i % 4]} />
          </mesh>
        </Bob>
      ))}
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

function Lattice({ accent }: BuilderProps) {
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

// ---------------------------------------------------------------------------------------------
// Epilogue


// ---------------------------------------------------------------------------------------------
// Camp props: the Easel, the Fireside Guitar and the Signal Post

function CampExtras() {
  return (
    <group>
      {/* easel */}
      <group position={[-6.5, 0, 3]} rotation={[0, 0.6, 0]}>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 1.6, 0]} rotation={[0.1, 0, x * -0.12]} castShadow>
            <boxGeometry args={[0.12, 3.4, 0.12]} />
            <Toon color="#6b4a2e" />
          </mesh>
        ))}
        <group scale={0.6}>
          <Canvas3D seed={3} colors={ART_PALETTES[0]} position={[0, 4, 0.25]} rotation={0} />
        </group>
      </group>
      {/* guitar leaning on a log */}
      <group position={[3.2, 0.9, 2.6]} rotation={[0, -0.5, 0.35]}>
        <mesh position={[0, 0, 0]} scale={[1, 1, 0.35]} castShadow>
          <sphereGeometry args={[0.55, 16, 12]} />
          <Toon color="#c0703a" />
        </mesh>
        <mesh position={[0, 0.65, 0]} scale={[1, 1, 0.35]} castShadow>
          <sphereGeometry args={[0.42, 16, 12]} />
          <Toon color="#c0703a" />
        </mesh>
        <mesh position={[0, 1.6, 0.05]} castShadow>
          <boxGeometry args={[0.14, 1.5, 0.08]} />
          <Toon color="#4a2e1e" />
        </mesh>
        <mesh position={[0, 0.35, 0.2]}>
          <circleGeometry args={[0.16, 14]} />
          <meshBasicMaterial color="#1a0f0a" />
        </mesh>
      </group>
      {/* signpost */}
      <group position={[6.5, 0, 2]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 3.2, 6]} />
          <Toon color="#5a3e28" />
        </mesh>
        {[0.4, -0.3].map((r, i) => (
          <mesh key={i} position={[0, 2.6 - i * 0.6, 0]} rotation={[0, r, 0]} castShadow>
            <boxGeometry args={[1.8, 0.4, 0.08]} />
            <Toon color="#c9a46e" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Prologue: the tutorial

function Proving({ accent }: BuilderProps) {
  return (
    <group>
      {/* university arch */}
      {[-4, 4].map((x) => (
        <mesh key={x} position={[x, 4, -3]} castShadow>
          <boxGeometry args={[1.4, 8, 1.4]} />
          <Toon color="#b8a080" />
        </mesh>
      ))}
      <mesh position={[0, 8.6, -3]} castShadow>
        <boxGeometry args={[10, 1.2, 1.6]} />
        <Toon color="#b8a080" />
      </mesh>
      <mesh position={[0, 8.6, -2.15]}>
        <planeGeometry args={[4, 0.6]} />
        <Toon color={accent} emissive={accent} intensity={0.8} />
      </mesh>
      {/* sparring circle and training dummies */}
      <mesh position={[0, 0.06, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[4.4, 5, 32]} />
        <Toon color="#e0c890" />
      </mesh>
      {[-2.4, 0, 2.4].map((x, i) => (
        <group key={x} position={[x, 0, 2 + (i === 1 ? -1.2 : 0.6)]}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 2, 6]} />
            <Toon color="#6b4a2e" />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow>
            <capsuleGeometry args={[0.45, 0.8, 4, 8]} />
            <Toon color="#d8c090" />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <sphereGeometry args={[0.35, 10, 8]} />
            <Toon color="#d8c090" />
          </mesh>
          <mesh position={[0, 1.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.8, 6]} />
            <Toon color="#6b4a2e" />
          </mesh>
        </group>
      ))}
      {/* a stack of textbooks */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[5.5, 0.2 + i * 0.32, 3]} rotation={[0, i * 0.3, 0]} castShadow>
          <boxGeometry args={[1.4, 0.3, 1]} />
          <Toon color={['#8a3a3a', '#3a5a8a', '#4a7a4a', '#c9a046'][i]} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Act I

function Millet({ accent }: BuilderProps) {
  const stalks = useMemo(() => {
    const r = seeded(5)
    return Array.from({ length: 90 }, () => ({ x: (r() - 0.5) * 16, z: (r() - 0.5) * 10 + 1, h: 1.4 + r() * 1.2, lean: (r() - 0.5) * 0.3, p: r() * 6 }))
  }, [])
  const field = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    field.current?.children.forEach((c, i) => {
      c.rotation.z = stalks[i].lean + Math.sin(clock.elapsedTime * 1.6 + stalks[i].p) * 0.08
    })
  })
  return (
    <group>
      <group ref={field}>
        {stalks.map((s, i) => (
          <group key={i} position={[s.x, 0, s.z]}>
            <mesh position={[0, s.h / 2, 0]}>
              <cylinderGeometry args={[0.03, 0.04, s.h, 4]} />
              <Toon color="#9a9a4a" />
            </mesh>
            <mesh position={[0, s.h + 0.25, 0]}>
              <capsuleGeometry args={[0.1, 0.4, 2, 6]} />
              <Toon color="#d8b860" />
            </mesh>
          </group>
        ))}
      </group>
      {/* the Hollow Oracle's shrine: a statue with an empty, glowing eye */}
      <group position={[0, 0, -6]}>
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[1.6, 2, 2, 8]} />
          <Toon color="#b8a888" />
        </mesh>
        <mesh position={[0, 4.4, 0]} castShadow>
          <capsuleGeometry args={[1.1, 3, 4, 10]} />
          <Toon color="#d0c4a8" />
        </mesh>
        <mesh position={[0, 6.6, 0]} castShadow>
          <sphereGeometry args={[1.1, 16, 12]} />
          <Toon color="#d0c4a8" />
        </mesh>
        <mesh position={[0, 6.7, 1.02]}>
          <circleGeometry args={[0.45, 16]} />
          <Toon color={accent} emissive="#fff0a0" intensity={2.5} />
        </mesh>
      </group>
      {/* a little learning hut: the LMS */}
      <mesh position={[6.5, 1.2, -2]} castShadow>
        <boxGeometry args={[2.6, 2.4, 2.4]} />
        <Toon color="#a07a4a" />
      </mesh>
      <mesh position={[6.5, 3, -2]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.2, 1.6, 4]} />
        <Toon color="#7a5a3a" />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Act II

function Watchtower({ accent }: BuilderProps) {
  const beam = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (beam.current) beam.current.rotation.y += dt * 0.7
  })
  return (
    <group>
      <mesh position={[0, 7, 0]} castShadow>
        <cylinderGeometry args={[1.6, 2.4, 14, 8]} />
        <Toon color="#8a7a6a" />
      </mesh>
      <mesh position={[0, 14.6, 0]} castShadow>
        <cylinderGeometry args={[2.8, 2.8, 1.2, 8]} />
        <Toon color="#6a5a4a" />
      </mesh>
      <mesh position={[0, 16.6, 0]} castShadow>
        <coneGeometry args={[3, 2.8, 8]} />
        <Toon color="#b0413e" />
      </mesh>
      <mesh position={[0, 15.4, 0]}>
        <sphereGeometry args={[0.8, 12, 10]} />
        <Toon color={accent} emissive="#ffcf7a" intensity={3} />
      </mesh>
      {/* the scanning beam sweeping websites, networks and code */}
      <group ref={beam} position={[0, 15.4, 0]}>
        <mesh position={[0, -2, 9]} rotation={[Math.PI / 2 + 0.25, 0, 0]}>
          <coneGeometry args={[2.4, 18, 16, 1, true]} />
          <meshBasicMaterial color="#fff0c0" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* three things it watches */}
      {[
        [-6, '#c8a070'],
        [0, '#a88060'],
        [6, '#d0b080'],
      ].map(([x, c], i) => (
        <mesh key={i} position={[x as number, 0.8, 5]} rotation={[0, i, 0]} castShadow>
          {i === 0 ? <boxGeometry args={[1.6, 1.6, 1.6]} /> : i === 1 ? <torusGeometry args={[0.8, 0.25, 6, 12]} /> : <octahedronGeometry args={[1, 0]} />}
          <Toon color={c as string} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------------------------
// Act III finale

function Mirror({ accent }: BuilderProps) {
  const tail = useRef<THREE.Group>(null)
  const nodes = useMemo(
    () => Array.from({ length: 6 }, (_, i) => new THREE.Vector3(Math.cos(i * 1.05) * 7, 1.2 + (i % 2), Math.sin(i * 1.05) * 5 - 2)),
    [],
  )
  const links = useMemo(() => {
    const pts: number[] = []
    nodes.forEach((n, i) => {
      const m = nodes[(i + 1) % nodes.length]
      pts.push(n.x, n.y, n.z, m.x, m.y, m.z)
    })
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  }, [nodes])
  useFrame(({ clock }) => {
    if (tail.current) tail.current.position.y = -1.5 + Math.sin(clock.elapsedTime * 0.8) * 1.2
  })
  return (
    <group>
      {/* the still, reflective sea */}
      <mesh position={[0, 0.3, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[11, 40]} />
        <meshStandardMaterial color="#9ac8e8" metalness={0.9} roughness={0.08} />
      </mesh>
      {/* simulated network nodes floating on it */}
      {nodes.map((n, i) => (
        <Bob key={i} amp={0.25} speed={1} phase={i}>
          <mesh position={n}>
            <sphereGeometry args={[0.45, 12, 10]} />
            <Toon color={accent} emissive="#bfe8ff" intensity={2} />
          </mesh>
        </Bob>
      ))}
      <lineSegments geometry={links}>
        <lineBasicMaterial color="#e8f6ff" transparent opacity={0.7} />
      </lineSegments>
      {/* the Leviathan's coils breaking the surface */}
      <group ref={tail} position={[0, -1.5, -7]}>
        {[-4, 0, 4].map((x, i) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[1.6 - i * 0.2, 0.55, 8, 16, Math.PI]} />
            <Toon color="#24344a" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

const builders: Record<LandmarkKind, (p: BuilderProps) => ReactNode> = {
  camp: Camp,
  proving: Proving,
  millet: Millet,
  archive: Archive,
  lattice: Lattice,
  caverns: Caverns,
  watchtower: Watchtower,
  peaks: Peaks,
  wellspring: Wellspring,
  mirror: Mirror,
}
