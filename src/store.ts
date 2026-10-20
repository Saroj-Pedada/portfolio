import { create } from 'zustand'
import { regions } from './content/expedition'

export type Mode = 'intro' | 'world' | 'classic'

type State = {
  mode: Mode
  regionIndex: number // stop the creature is currently at or nearest to
  atStop: boolean // close enough to the flag to open the journal
  journalOpen: boolean
  inventoryOpen: boolean
  battleOpen: boolean
  travelTarget: number | null // region index to auto-travel to
  visited: Set<number>
  cleared: Set<number> // battle places won
  lowPower: boolean
  setMode: (m: Mode) => void
  setPosition: (index: number, atStop: boolean) => void
  travelTo: (index: number) => void
  clearTravel: () => void
  setJournal: (open: boolean) => void
  setInventory: (open: boolean) => void
  setBattle: (open: boolean) => void
  winBattle: (index: number) => void
  resetProgress: () => void
}

const STORAGE_KEY = 'expedition24.cleared'

function loadCleared(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as number[]) : [])
  } catch {
    return new Set()
  }
}
function saveCleared(s: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]))
  } catch {
    // progress just won't survive a reload
  }
}

// The road is open up to (and including) the first battle place not yet won.
export function maxReach(cleared: Set<number>) {
  const i = regions.findIndex((r, idx) => r.battle && !cleared.has(idx))
  return i === -1 ? regions.length - 1 : i
}

const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const initialCleared = loadCleared()

export const useStore = create<State>((set, get) => ({
  mode: 'intro',
  regionIndex: 0,
  atStop: true,
  journalOpen: false,
  inventoryOpen: false,
  battleOpen: false,
  travelTarget: null,
  visited: new Set([0, ...initialCleared]),
  cleared: initialCleared,
  lowPower: coarsePointer,
  setMode: (mode) => set({ mode }),
  setPosition: (regionIndex, atStop) =>
    set((s) => {
      if (s.regionIndex === regionIndex && s.atStop === atStop) return s
      const firstArrival = atStop && !s.visited.has(regionIndex)
      const visited = s.visited.has(regionIndex) ? s.visited : new Set(s.visited).add(regionIndex)
      // arriving somewhere new opens its story first: read, then fight
      return { regionIndex, atStop, visited, journalOpen: s.journalOpen || (firstArrival && s.travelTarget === null) }
    }),
  travelTo: (index) => {
    const limit = maxReach(get().cleared)
    set({ travelTarget: Math.max(0, Math.min(limit, index)), journalOpen: false })
  },
  clearTravel: () => set({ travelTarget: null }),
  setJournal: (journalOpen) => set({ journalOpen, inventoryOpen: false }),
  setInventory: (inventoryOpen) => set({ inventoryOpen, journalOpen: false }),
  setBattle: (battleOpen) => set({ battleOpen, journalOpen: false, inventoryOpen: false }),
  winBattle: (index) =>
    set((s) => {
      const cleared = new Set(s.cleared).add(index)
      saveCleared(cleared)
      return { cleared }
    }),
  resetProgress: () => {
    saveCleared(new Set())
    set({ cleared: new Set(), visited: new Set([0]), travelTarget: 0, journalOpen: false })
  },
}))
