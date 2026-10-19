import * as THREE from 'three'

// Three-step gradient so every toon material shades in flat painted bands.
const data = new Uint8Array([90, 170, 255])
export const toonGradient = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat)
toonGradient.minFilter = THREE.NearestFilter
toonGradient.magFilter = THREE.NearestFilter
toonGradient.needsUpdate = true
