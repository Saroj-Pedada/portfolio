import type { Link, MediaSlot, Region } from '../content/expedition'
import { BB84 } from './BB84'

// Shared between the in-world journal and the classic page.
export function RegionDetails({ region, headingLevel = 2 }: { region: Region; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <>
      <header className="region-head">
        <H className="region-name">{region.name}</H>
        {region.role && <p className="region-role">{region.role}</p>}
        {(region.org || region.dates) && (
          <p className="region-meta">
            {region.org}
            {region.org && region.dates && ' · '}
            {region.dates}
          </p>
        )}
        <p className="region-tagline">{region.tagline}</p>
      </header>
      <ul className="region-bullets">
        {region.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {region.minigame === 'bb84' && <BB84 />}
      {region.sections?.map((sec) => (
        <section key={sec.title} className="region-section">
          <h3>{sec.title}</h3>
          <ul className="region-bullets">
            {sec.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {sec.media && <Media media={sec.media} />}
          {sec.links && <Links links={sec.links} />}
        </section>
      ))}
      {region.links && <Links links={region.links} />}
      {region.skills.length > 0 && (
        <div className="pictos">
          {region.skills.map((s) => (
            <span key={s} className="picto">
              {s}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

function Links({ links }: { links: Link[] }) {
  return (
    <div className="region-links">
      {links.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
          {l.label} ↗
        </a>
      ))}
    </div>
  )
}

function Media({ media }: { media: MediaSlot[] }) {
  return (
        <div className="media-grid">
          {media.map((m, i) => {
            const src = m.src && (/^https?:/.test(m.src) ? m.src : import.meta.env.BASE_URL + m.src)
            return src ? (
              m.kind === 'image' ? (
                <img key={i} src={src} alt={m.label} />
              ) : m.kind === 'audio' ? (
                <audio key={i} src={src} controls />
              ) : (
                <video key={i} src={src} controls />
              )
            ) : (
              <div key={i} className={`media-slot media-${m.kind}`}>
                <span className="media-icon" aria-hidden>
                  {m.kind === 'image' ? '🖼' : m.kind === 'audio' ? '♪' : '▶'}
                </span>
                <span>{m.label}</span>
                <span className="media-soon">coming soon</span>
              </div>
            )
          })}
        </div>
  )
}
