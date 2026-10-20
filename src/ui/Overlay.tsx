import { useEffect, useRef, useState } from 'react'
import { acts, allSkills, profile, regions } from '../content/expedition'
import { maxReach, useStore } from '../store'
import { Battle } from './Battle'
import { RegionDetails } from './RegionDetails'

export function Overlay() {
  const battleOpen = useStore((s) => s.battleOpen)
  if (battleOpen) return <Battle />
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
  const travelTo = useStore((s) => s.travelTo)
  const regionIndex = useStore((s) => s.regionIndex)
  const collected = useCollected()
  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-name">{profile.name}</span>
        <span className="brand-sub">Expedition24</span>
      </div>
      <div className="topbar-actions">
        {regionIndex !== 0 && (
          <button className="ghost" onClick={() => travelTo(0)}>
            ⛺ Camp
          </button>
        )}
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

// Camp skills come from visiting it; every other place's skills are earned by winning there.
function useCollected() {
  const visited = useStore((s) => s.visited)
  const cleared = useStore((s) => s.cleared)
  return Array.from(
    new Set(regions.filter((r, i) => (r.battle ? cleared.has(i) : visited.has(i))).flatMap((r) => r.skills)),
  )
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
  const { regionIndex, atStop, journalOpen, inventoryOpen, cleared, setJournal, travelTo } = useStore()
  if (journalOpen || inventoryOpen) return null
  const r = regions[regionIndex]
  const locked = regionIndex + 1 > maxReach(cleared)
  const unbeaten = r.battle && !cleared.has(regionIndex)
  return (
    <div className="stop-prompt">
      <button className="nav" onClick={() => travelTo(regionIndex - 1)} disabled={regionIndex === 0} aria-label="Previous stop">
        ‹
      </button>
      {atStop ? (
        <button className="primary" onClick={() => setJournal(true)}>
          <span className="prompt-act">
            {acts[r.act].title}
            {r.battle && (cleared.has(regionIndex) ? ' · cleared' : ' · battle')}
          </span>
          {r.name} · {unbeaten ? 'Read & fight' : 'Open journal'} <kbd>E</kbd>
        </button>
      ) : (
        <span className="travelling">Travelling…</span>
      )}
      <button
        className="nav"
        onClick={() => travelTo(regionIndex + 1)}
        disabled={regionIndex === regions.length - 1 || locked}
        aria-label={locked ? 'Next stop locked: win this battle first' : 'Next stop'}
        title={locked ? `Defeat ${r.battle?.boss.name} to open the road` : undefined}
      >
        {locked && regionIndex < regions.length - 1 ? '🔒' : '›'}
      </button>
    </div>
  )
}

function Timeline() {
  const regionIndex = useStore((s) => s.regionIndex)
  const visited = useStore((s) => s.visited)
  const cleared = useStore((s) => s.cleared)
  const travelTo = useStore((s) => s.travelTo)
  const reach = maxReach(cleared)
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
                  className={`timeline-stop ${i === regionIndex ? 'current' : ''} ${visited.has(i) ? 'visited' : ''} ${cleared.has(i) ? 'cleared' : ''} ${i > reach ? 'locked' : ''}`}
                  onClick={() => travelTo(i)}
                  disabled={i > reach}
                  title={i > reach ? `${r.name} · locked` : `${r.name}${r.dates ? ' · ' + r.dates : ''}`}
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
  const { journalOpen, regionIndex, cleared, setJournal, setBattle, travelTo } = useStore()
  if (!journalOpen) return null
  const r = regions[regionIndex]
  const won = cleared.has(regionIndex)
  const next = regions[regionIndex + 1]
  const canGoOn = next && regionIndex + 1 <= maxReach(cleared)
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
        {r.id === 'camp' && (
          <section className="region-section">
            <h3>The Signal Post</h3>
            <ContactBlock />
          </section>
        )}
        {r.battle && (
          <section className={`battle-preview ${won ? 'won' : ''}`}>
            <p className="battle-label">{r.battle.tutorial ? 'Tutorial battle' : 'Battle'}</p>
            <p>
              <b>Fights:</b> {r.battle.fights.map((f) => f.name).join(', ')} · <b>Boss:</b> {r.battle.boss.name}
            </p>
            <p className="battle-why">{r.battle.why}</p>
            <button className="primary big" onClick={() => setBattle(true)}>
              {won ? 'Fight again' : r.battle.tutorial ? '⚔ Start the tutorial' : '⚔ Face the fights'}
            </button>
            {won && <span className="cleared-badge">✓ Cleared</span>}
          </section>
        )}
        <footer className="journal-foot">
          <button className="ghost" disabled={regionIndex === 0} onClick={() => travelTo(regionIndex - 1)}>
            ‹ Previous stop
          </button>
          {next &&
            (canGoOn ? (
              <button className="primary" onClick={() => travelTo(regionIndex + 1)}>
                Ride on to {next.name} ›
              </button>
            ) : (
              <span className="locked-note">🔒 Defeat {r.battle?.boss.name} to ride on</span>
            ))}
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
  const { inventoryOpen, setInventory, resetProgress } = useStore()
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
        <p className="region-tagline">Skills earned by winning each place. Clear more battles to fill the set.</p>
        <div className="pictos big">
          {allSkills.map((s) => (
            <span key={s} className={`picto ${collected.includes(s) ? '' : 'locked'}`}>
              {collected.includes(s) ? s : '???'}
            </span>
          ))}
        </div>
        <footer className="journal-foot">
          <button
            className="ghost"
            onClick={() => {
              if (confirm('Reset all battle progress?')) resetProgress()
            }}
          >
            Reset progress
          </button>
        </footer>
      </section>
    </div>
  )
}
