import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { Atmosphere, Motes, Road, Scatter, Terrain } from './Environment'
import { Creature } from './Creature'
import { Landmarks } from './Landmarks'
import { Painterly } from './Painterly'
import { Rig } from './Rig'

export function World() {
  const lowPower = useStore((s) => s.lowPower)
  return (
    <Canvas
      className="world-canvas"
      shadows={!lowPower}
      dpr={lowPower ? [1, 1.25] : [1, 1.75]}
      camera={{ fov: 50, near: 0.5, far: 900, position: [0, 10, 20] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <Suspense fallback={null}>
        <Atmosphere />
        <Terrain />
        <Road />
        <Scatter />
        <Landmarks />
        <Creature />
        <Motes />
        <Rig />
        <Painterly lowPower={lowPower} />
      </Suspense>
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  )
}
