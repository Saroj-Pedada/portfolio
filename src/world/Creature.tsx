import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon } from './Toon'
import { heightAt, pointAt, tangentAt } from './path'
import { travel } from './travel'

// Original companion: a big, soft, round wanderer with stubby legs who carries the rider between
// regions. Built from primitives so it can be swapped for a GLB model later without touching travel.
const FUR = '#efe6f2'
const SHADE = '#c9b8d6'

export function Creature() {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const legs = useRef<THREE.Group[]>([])
  const scarf = useRef<THREE.Mesh>(null)
  const pos = new THREE.Vector3()
  const tan = new THREE.Vector3()
  const stride = useRef(0)

  useFrame((state, dt) => {
    if (!root.current || !body.current) return
    pointAt(travel.p, pos)
    tangentAt(travel.p, tan)
    pos.y = heightAt(pos.x, pos.z)
    root.current.position.copy(pos)
    const yaw = Math.atan2(tan.x, tan.z) + (travel.velocity < -0.01 ? Math.PI : 0)
    const cur = root.current.rotation.y
    const delta = Math.atan2(Math.sin(yaw - cur), Math.cos(yaw - cur)) // shortest way round
    root.current.rotation.y = cur + delta * (1 - Math.exp(-dt * 6))

    const speed = Math.min(Math.abs(travel.velocity) * 6, 1)
    stride.current += dt * (2 + speed * 9)
    const t = state.clock.elapsedTime
    const s = stride.current
    // idle breathing, walking bounce and a little squash-and-stretch
    const bounce = Math.abs(Math.sin(s)) * 0.35 * speed + Math.sin(t * 1.6) * 0.06
    body.current.position.y = 2.6 + bounce
    const squash = 1 + Math.sin(s * 2) * 0.04 * speed + Math.sin(t * 1.6) * 0.015
    body.current.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash))
    body.current.rotation.z = Math.sin(s) * 0.05 * speed
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.x = Math.sin(s + (i % 2 === 0 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * 0.6 * speed
    })
    if (scarf.current) scarf.current.rotation.x = -0.6 - speed * 0.5 + Math.sin(t * 7) * 0.12
  })

  const legSpots: [number, number][] = [
    [-1.1, 0.9],
    [1.1, 0.9],
    [-1.1, -0.9],
    [1.1, -0.9],
  ]

  return (
    <group ref={root}>
      {legSpots.map(([x, z], i) => (
        <group
          key={i}
          position={[x, 1.3, z]}
          ref={(g) => {
            if (g) legs.current[i] = g
          }}
        >
          <mesh position={[0, -0.7, 0]} castShadow>
            <capsuleGeometry args={[0.42, 0.7, 4, 10]} />
            <Toon color={SHADE} />
          </mesh>
        </group>
      ))}
      <group ref={body}>
        {/* body */}
        <mesh castShadow>
          <sphereGeometry args={[2.2, 32, 24]} />
          <Toon color={FUR} />
        </mesh>
        {/* belly patch */}
        <mesh position={[0, -0.4, 1.55]} scale={[1.2, 1, 0.5]}>
          <sphereGeometry args={[1.1, 20, 16]} />
          <Toon color="#fff7ef" />
        </mesh>
        {/* ears */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 1.2, 1.8, 0.2]} rotation={[0, 0, sx * -0.5]} castShadow>
            <sphereGeometry args={[0.55, 16, 12]} />
            <Toon color={SHADE} />
          </mesh>
        ))}
        {/* eyes + cheeks */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <mesh position={[sx * 0.7, 0.55, 1.95]}>
              <sphereGeometry args={[0.22, 16, 12]} />
              <meshBasicMaterial color="#231a2a" />
            </mesh>
            <mesh position={[sx * 0.62, 0.66, 2.1]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[sx * 1.15, 0.1, 1.75]} scale={[1, 0.6, 0.4]}>
              <sphereGeometry args={[0.3, 12, 10]} />
              <meshBasicMaterial color="#f4a7b9" />
            </mesh>
          </group>
        ))}
        {/* little smile */}
        <mesh position={[0, 0.2, 2.12]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.18, 0.04, 6, 12, Math.PI]} />
          <meshBasicMaterial color="#231a2a" />
        </mesh>
        {/* saddle blanket */}
        <mesh position={[0, 1.95, -0.1]} rotation={[-0.15, 0, 0]} scale={[1.3, 0.25, 1.1]}>
          <sphereGeometry args={[1, 20, 10]} />
          <Toon color="#b0413e" />
        </mesh>
        {/* glowing seed on the tail */}
        <mesh position={[0, 0.3, -2.3]}>
          <sphereGeometry args={[0.35, 12, 10]} />
          <Toon color="#ffd27a" emissive="#ffb347" />
        </mesh>
        <Rider scarfRef={scarf} />
      </group>
    </group>
  )
}

function Rider({ scarfRef }: { scarfRef: React.RefObject<THREE.Mesh | null> }) {
  return (
    <group position={[0, 2.25, -0.1]}>
      {/* coat */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.6, 4, 10]} />
        <Toon color="#2d3a5a" />
      </mesh>
      {/* legs astride */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.35, 0.15, 0.15]} rotation={[1.2, 0, sx * 0.5]} castShadow>
          <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
          <Toon color="#3b2f2a" />
        </mesh>
      ))}
      {/* head */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 12]} />
        <Toon color="#c48a64" />
      </mesh>
      {/* hair */}
      <mesh position={[0, 1.38, -0.04]} scale={[1.05, 0.7, 1.05]}>
        <sphereGeometry args={[0.28, 16, 12]} />
        <Toon color="#1c1612" />
      </mesh>
      {/* scarf, trailing in the wind */}
      <mesh position={[0, 1.0, 0]}>
        <torusGeometry args={[0.24, 0.07, 6, 16]} />
        <Toon color="#e0b04a" />
      </mesh>
      <mesh ref={scarfRef} position={[0.1, 1.0, -0.2]} rotation={[-0.6, 0, 0]}>
        <boxGeometry args={[0.16, 0.04, 0.9]} />
        <Toon color="#e0b04a" />
      </mesh>
      {/* paintbrush in hand */}
      <mesh position={[0.42, 0.75, 0.25]} rotation={[0.6, 0, -0.4]}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
        <Toon color="#6b4a2e" />
      </mesh>
      <mesh position={[0.55, 1.05, 0.45]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <Toon color="#ffd27a" emissive="#ffb347" />
      </mesh>
    </group>
  )
}
