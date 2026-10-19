// Per-frame travel state, kept outside React so useFrame can mutate it without re-rendering.
export const travel = {
  p: 0, // progress along the road, measured in stops
  velocity: 0,
  input: 0, // -1..1 from keys / touch
  wheel: 0, // accumulated wheel impulse
}
