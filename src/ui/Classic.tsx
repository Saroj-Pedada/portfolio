import { acts, allSkills, profile, regions } from '../content/expedition'
import { useStore } from '../store'
import { ContactBlock } from './Overlay'
import { RegionDetails } from './RegionDetails'

// The same content as a fast, plain page: for recruiters, screen readers, search engines and
// devices without WebGL.
export function Classic({ webgl }: { webgl: boolean }) {
  const setMode = useStore((s) => s.setMode)
  return (
    <main className="classic" data-scrollable>
      <header className="classic-hero">
        <h1>{profile.name}</h1>
        <p className="classic-title">{profile.title}</p>
        <p className="classic-summary">{profile.summary}</p>
        <ContactBlock />
        {webgl && (
          <button className="primary" onClick={() => setMode('world')}>
            Enter the Expedition (3D) →
          </button>
        )}
      </header>
      {acts.map((a) => {
        const rs = regions.filter((r) => r.act === a.number)
        if (!rs.length) return null
        return (
          <section key={a.number} className="classic-act">
            <h2 className="classic-act-title">
              <span>{a.title}</span> {a.subtitle}
            </h2>
            {rs.map((r) => (
              <article key={r.id} className="classic-card" style={{ '--accent': r.palette.accent } as React.CSSProperties}>
                <RegionDetails region={r} headingLevel={3} />
                {r.battle && (
                  <p className="battle-why">
                    <b>In the game:</b> fights {r.battle.fights.map((f) => f.name).join(', ')}; boss {r.battle.boss.name}.{' '}
                    {r.battle.why}
                  </p>
                )}
              </article>
            ))}
          </section>
        )
      })}
      <section className="classic-act">
        <h2 className="classic-act-title">
          <span>Skills</span>
        </h2>
        <div className="pictos big">
          {allSkills.map((s) => (
            <span key={s} className="picto">
              {s}
            </span>
          ))}
        </div>
      </section>
      <footer className="classic-foot">© {new Date().getFullYear()} {profile.name}</footer>
    </main>
  )
}
