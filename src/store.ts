import { create } from 'zustand'
import { regions } from './content/expedition'

export type Mode = 'intro' | 'world' | 'classic'

type State = {
  mode: Mode
  regionIndex: number // stop the creature is currently at or nearest to
  atStop: boolean // close enough to the flag to open the journal
  journalOpen: boolean
  inventoryOpen: boolean
  travelTarget: number | null // region index to auto-travel to
  visited: Set<number>
  lowPower: boolean
  setMode: (m: Mode) => void
  setPosition: (index: number, atStop: boolean) => void
  travelTo: (index: number) => void
  clearTravel: () => void
  setJournal: (open: boolean) => void
  setInventory: (open: boolean) => void
}

const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

export const useStore = create<State>((set) => ({
  mode: 'intro',
  regionIndex: 0,
  atStop: true,
  journalOpen: false,
  inventoryOpen: false,
  travelTarget: null,
  visited: new Set([0]),
  lowPower: coarsePointer,
  setMode: (mode) => set({ mode }),
  setPosition: (regionIndex, atStop) =>
    set((s) => {
      if (s.regionIndex === regionIndex && s.atStop === atStop) return s
      const visited = s.visited.has(regionIndex) ? s.visited : new Set(s.visited).add(regionIndex)
      return { regionIndex, atStop, visited }
    }),
  travelTo: (index) =>
    set({ travelTarget: Math.max(0, Math.min(regions.length - 1, index)), journalOpen: false }),
  clearTravel: () => set({ travelTarget: null }),
  setJournal: (journalOpen) => set({ journalOpen, inventoryOpen: false }),
  setInventory: (inventoryOpen) => set({ inventoryOpen, journalOpen: false }),
}))
