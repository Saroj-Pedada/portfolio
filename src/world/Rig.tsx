import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { N, heightAt, landmarkPosition, pointAt, tangentAt } from './path'
import { travel } from './travel'

const MAX_SPEED = 0.55 // stops per second
const STOP_RADIUS = 0.12

// Turns keyboard / wheel / touch / timeline clicks into motion along the road, snaps gently to
// stops, reports the nearest stop to the store, and flies the camera behind the creature.
export function Rig() {
  const landmarks = useMemo(() => Array.from({ length: N }, (_, i) => landmarkPosition(i)), [])
  useInput()

  const camPos = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const p = useMemo(() => new THREE.Vector3(), [])
  const t = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])
  const focus = useMemo(() => new THREE.Vector3(), [])
  const first = useMemo(() => ({ done: false }), [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const store = useStore.getState()
    const paused = store.journalOpen || store.inventoryOpen || store.mode !== 'world'

    // --- motion ---
    let target = travel.velocity
    if (store.travelTarget !== null) {
      const d = store.travelTarget - travel.p
      if (Math.abs(d) < 0.004) {
        travel.p = store.travelTarget
        target = 0
        store.clearTravel()
      } else {
        target = THREE.MathUtils.clamp(d * 1.8, -MAX_SPEED * 1.6, MAX_SPEED * 1.6)
      }
    } else if (!paused && (travel.input !== 0 || travel.wheel !== 0)) {
      target = (travel.input + travel.wheel) * MAX_SPEED
      travel.wheel *= Math.exp(-dt * 4)
      if (Math.abs(travel.wheel) < 0.02) travel.wheel = 0
    } else {
      // no input: ease into the nearest stop so the rider always lands at a flag
      const nearest = Math.round(travel.p)
      const d = nearest - travel.p
      target = Math.abs(d) < 0.35 ? d * 1.5 : travel.velocity * 0.9
    }
    if (paused && store.travelTarget === null) target = 0
    travel.velocity = THREE.MathUtils.lerp(travel.velocity, target, 1 - Math.exp(-dt * 5))
    travel.p = THREE.MathUtils.clamp(travel.p + travel.velocity * dt, 0, N - 1)

    const nearest = Math.round(travel.p)
    store.setPosition(nearest, Math.abs(nearest - travel.p) < STOP_RADIUS)

    // --- camera ---
    pointAt(travel.p, p)
    tangentAt(travel.p, t)
    p.y = heightAt(p.x, p.z)
    // at a stop, swing round to frame both the rider and the landmark
    const nearness = 1 - THREE.MathUtils.smoothstep(Math.abs(nearest - travel.p), 0, 0.35)
    const lm = landmarks[nearest]
    focus.copy(p).lerp(lm, 0.5 * nearness)
    desired
      .copy(p)
      .addScaledVector(t, -15 + nearness * 3)
      .add(new THREE.Vector3(0, 8 - nearness * 1.5, 0))
    // offset sideways, away from the landmark, so it is not hidden behind the creature
    const side = new THREE.Vector3().subVectors(lm, p).setY(0).normalize()
    desired.addScaledVector(side, -6 * nearness)
    look.copy(focus).addScaledVector(t, 6 * (1 - nearness)).add(new THREE.Vector3(0, 3, 0))

    const k = first.done ? 1 - Math.exp(-dt * 2.5) : 1
    first.done = true
    camPos.lerp(desired, k)
    state.camera.position.copy(camPos)
    state.camera.lookAt(look)
  })

  return null
}

function useInput() {
  useEffect(() => {
    const keys = new Set<string>()
    const update = () => {
      const fwd = keys.has('ArrowUp') || keys.has('w') || keys.has('ArrowRight') || keys.has('d')
      const back = keys.has('ArrowDown') || keys.has('s') || keys.has('ArrowLeft') || keys.has('a')
      travel.input = (fwd ? 1 : 0) - (back ? 1 : 0)
    }
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const s = useStore.getState()
      if (s.mode !== 'world') return
      if (k === 'e' || k === 'Enter') {
        if (s.atStop && !s.inventoryOpen) s.setJournal(!s.journalOpen)
        return
      }
      if (k === 'Tab' || k === 'i') {
        e.preventDefault()
        s.setInventory(!s.inventoryOpen)
        return
      }
      if (k === 'Escape') {
        s.setJournal(false)
        s.setInventory(false)
        return
      }
      if (s.journalOpen || s.inventoryOpen) return
      keys.add(k)
      if (s.travelTarget !== null) s.clearTravel()
      update()
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key)
      update()
    }
    const wheel = (e: WheelEvent) => {
      const s = useStore.getState()
      if (s.mode !== 'world' || s.journalOpen || s.inventoryOpen) return
      if ((e.target as HTMLElement)?.closest?.('[data-scrollable]')) return
      travel.wheel = THREE.MathUtils.clamp(travel.wheel + e.deltaY * 0.004, -1.6, 1.6)
    }
    let touchY: number | null = null
    const touchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.tagName !== 'CANVAS') return
      touchY = e.touches[0].clientY
    }
    const touchMove = (e: TouchEvent) => {
      if (touchY === null) return
      const dy = touchY - e.touches[0].clientY
      touchY = e.touches[0].clientY
      travel.wheel = THREE.MathUtils.clamp(travel.wheel + dy * 0.01, -1.6, 1.6)
    }
    const touchEnd = () => (touchY = null)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('wheel', wheel, { passive: true })
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchmove', touchMove, { passive: true })
    window.addEventListener('touchend', touchEnd)
    window.addEventListener('blur', () => keys.clear())
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('touchend', touchEnd)
    }
  }, [])
}
