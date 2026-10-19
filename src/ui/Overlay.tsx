import { useEffect, useRef, useState } from 'react'
import { acts, allSkills, profile, regions } from '../content/expedition'
import { useStore } from '../store'
import { RegionDetails } from './RegionDetails'

export function Overlay() {
  return (
    <>
      <TopBar />
      <ActCard />
      <StopPrompt />
      <Timeline />
      <Journal />
      <Inventory />
    </>
  )
}

function TopBar() {
  const setMode = useStore((s) => s.setMode)
  const setInventory = useStore((s) => s.setInventory)
  const collected = useCollected()
  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-name">{profile.name}</span>
        <span className="brand-sub">The Expedition</span>
      </div>
      <div className="topbar-actions">
        <button className="ghost" onClick={() => setInventory(true)} title="Skills (Tab)">
          Pictos {collected.length}/{allSkills.length}
        </button>
        <button className="ghost" onClick={() => setMode('classic')}>
          Classic view
        </button>
      </div>
    </div>
  )
}

function useCollected() {
  const visited = useStore((s) => s.visited)
  return Array.from(new Set(regions.filter((_, i) => visited.has(i)).flatMap((r) => r.skills)))
}

// Big painted title card whenever the expedition crosses into a new act.
function ActCard() {
  const regionIndex = useStore((s) => s.regionIndex)
  const act = regions[regionIndex].act
  const [shown, setShown] = useState<number | null>(null)
  const last = useRef(act)
  useEffect(() => {
    if (act === last.current) return
    last.current = act
    setShown(act)
    const t = setTimeout(() => setShown(null), 2600)
    return () => clearTimeout(t)
  }, [act])
  if (shown === null) return null
  const a = acts[shown]
  return (
    <div className="act-card" key={shown}>
      <span className="act-number">{a.title}</span>
      <span className="act-title">{a.subtitle}</span>
    </div>
  )
}

function StopPrompt() {
  const { regionIndex, atStop, journalOpen, inventoryOpen, setJournal, travelTo } = useStore()
  if (journalOpen || inventoryOpen) return null
  const r = regions[regionIndex]
  return (
    <div className="stop-prompt">
      <button className="nav" onClick={() => travelTo(regionIndex - 1)} disabled={regionIndex === 0} aria-label="Previous stop">
        ‹
      </button>
      {atStop ? (
        <button className="primary" onClick={() => setJournal(true)}>
          <span className="prompt-act">{acts[r.act].title}</span>
          {r.name} · Open journal <kbd>E</kbd>
        </button>
      ) : (
        <span className="travelling">Travelling…</span>
      )}
      <button
        className="nav"
        onClick={() => travelTo(regionIndex + 1)}
        disabled={regionIndex === regions.length - 1}
        aria-label="Next stop"
      >
        ›
      </button>
    </div>
  )
}

function Timeline() {
  const regionIndex = useStore((s) => s.regionIndex)
  const visited = useStore((s) => s.visited)
  const travelTo = useStore((s) => s.travelTo)
  return (
    <nav className="timeline" aria-label="Expedition stops">
      {acts.map((a) => (
        <div key={a.number} className="timeline-act">
          <span className="timeline-act-name">{a.subtitle}</span>
          <div className="timeline-stops">
            {regions.map((r, i) =>
              r.act === a.number ? (
                <button
                  key={r.id}
                  className={`timeline-stop ${i === regionIndex ? 'current' : ''} ${visited.has(i) ? 'visited' : ''}`}
                  onClick={() => travelTo(i)}
                  title={`${r.name}${r.dates ? ' · ' + r.dates : ''}`}
                  style={{ '--accent': r.palette.accent } as React.CSSProperties}
                >
                  <span className="sr-only">{r.name}</span>
                </button>
              ) : null,
            )}
          </div>
        </div>
      ))}
    </nav>
  )
}

function Journal() {
  const { journalOpen, regionIndex, setJournal, travelTo } = useStore()
  if (!journalOpen) return null
  const r = regions[regionIndex]
  const last = regionIndex === regions.length - 1
  return (
    <div className="modal-backdrop" onClick={() => setJournal(false)}>
      <article
        className="journal"
        data-scrollable
        onClick={(e) => e.stopPropagation()}
        style={{ '--accent': r.palette.accent } as React.CSSProperties}
      >
        <button className="close" onClick={() => setJournal(false)} aria-label="Close journal">
          ×
        </button>
        <p className="journal-act">
          {acts[r.act].title} — {acts[r.act].subtitle}
        </p>
        <RegionDetails region={r} />
        {last && <ContactBlock />}
        <footer className="journal-foot">
          <button className="ghost" disabled={regionIndex === 0} onClick={() => travelTo(regionIndex - 1)}>
            ‹ Previous stop
          </button>
          {!last && (
            <button className="primary" onClick={() => travelTo(regionIndex + 1)}>
              Ride on to {regions[regionIndex + 1].name} ›
            </button>
          )}
        </footer>
      </article>
    </div>
  )
}

export function ContactBlock() {
  return (
    <div className="contact">
      {profile.links.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
          {l.label}
        </a>
      ))}
      <a href={profile.resume} target="_blank" rel="noreferrer" className="primary">
        Download résumé
      </a>
    </div>
  )
}

function Inventory() {
  const { inventoryOpen, setInventory } = useStore()
  const collected = useCollected()
  if (!inventoryOpen) return null
  return (
    <div className="modal-backdrop" onClick={() => setInventory(false)}>
      <section className="journal inventory" data-scrollable onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={() => setInventory(false)} aria-label="Close">
          ×
        </button>
        <p className="journal-act">Inventory</p>
        <h2 className="region-name">Pictos collected</h2>
        <p className="region-tagline">Skills picked up along the expedition. Visit more flags to fill the set.</p>
        <div className="pictos big">
          {allSkills.map((s) => (
            <span key={s} className={`picto ${collected.includes(s) ? '' : 'locked'}`}>
              {collected.includes(s) ? s : '???'}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
