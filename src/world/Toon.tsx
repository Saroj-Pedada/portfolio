import { toonGradient } from './materials'

export function Toon({
  color,
  emissive,
  intensity = 1.5,
  transparent,
  opacity,
}: {
  color: string
  emissive?: string
  intensity?: number
  transparent?: boolean
  opacity?: number
}) {
  return (
    <meshToonMaterial
      color={color}
      gradientMap={toonGradient}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissive ? intensity : 0}
      transparent={transparent}
      opacity={opacity}
    />
  )
}
