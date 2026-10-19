import type { Region } from '../content/expedition'
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
      {region.media && (
        <div className="media-grid">
          {region.media.map((m, i) =>
            m.src ? (
              m.kind === 'image' ? (
                <img key={i} src={m.src} alt={m.label} />
              ) : m.kind === 'audio' ? (
                <audio key={i} src={m.src} controls />
              ) : (
                <video key={i} src={m.src} controls />
              )
            ) : (
              <div key={i} className={`media-slot media-${m.kind}`}>
                <span className="media-icon" aria-hidden>
                  {m.kind === 'image' ? '🖼' : m.kind === 'audio' ? '♪' : '▶'}
                </span>
                <span>{m.label}</span>
                <span className="media-soon">coming soon</span>
              </div>
            ),
          )}
        </div>
      )}
      {region.links && (
        <div className="region-links">
          {region.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
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
