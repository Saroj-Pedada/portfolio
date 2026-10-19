import { useMemo, useState } from 'react'

// A tiny BB84 run: Alice sends random bits in random bases, Bob measures in random bases, they
// keep the positions where bases matched. An intercept-resend eavesdropper picks a random basis
// per photon, which corrupts ~25% of the sifted key and gives her away.
type Basis = '+' | '×'
const N = 16
const rb = () => (Math.random() < 0.5 ? 0 : 1)
const rbasis = (): Basis => (Math.random() < 0.5 ? '+' : '×')

function photon(bit: number, basis: Basis) {
  if (basis === '+') return bit ? '↑' : '→'
  return bit ? '↗' : '↘'
}

function run(eve: boolean) {
  return Array.from({ length: N }, () => {
    const aBit = rb()
    const aBasis = rbasis()
    let bit = aBit
    let basis = aBasis
    if (eve) {
      const eBasis = rbasis()
      if (eBasis !== basis) bit = rb() // wrong basis: random outcome, photon re-sent in Eve's basis
      basis = eBasis
    }
    const bBasis = rbasis()
    const bBit = bBasis === basis ? bit : rb()
    return { aBit, aBasis, bBasis, bBit, sent: photon(aBit, aBasis), keep: aBasis === bBasis }
  })
}

export function BB84() {
  const [eve, setEve] = useState(false)
  const [seed, setSeed] = useState(0)
  const rows = useMemo(() => run(eve), [eve, seed])
  const kept = rows.filter((r) => r.keep)
  const errors = kept.filter((r) => r.aBit !== r.bBit).length
  const qber = kept.length ? Math.round((errors / kept.length) * 100) : 0

  return (
    <div className="bb84">
      <div className="bb84-controls">
        <button onClick={() => setSeed((s) => s + 1)}>Send {N} photons</button>
        <label className="bb84-eve">
          <input type="checkbox" checked={eve} onChange={(e) => setEve(e.target.checked)} />
          Eavesdropper (Eve)
        </label>
      </div>
      <div className="bb84-grid" role="table" aria-label="BB84 exchange">
        <div className="bb84-row bb84-head" role="row">
          <span>Alice bit</span>
          <span>Alice basis</span>
          <span>Photon</span>
          <span>Bob basis</span>
          <span>Bob bit</span>
        </div>
        <div className="bb84-cols">
          {rows.map((r, i) => (
            <div key={i} className={`bb84-col ${r.keep ? 'keep' : 'drop'} ${r.keep && r.aBit !== r.bBit ? 'err' : ''}`} role="row">
              <span>{r.aBit}</span>
              <span>{r.aBasis}</span>
              <span className="bb84-photon">{r.sent}</span>
              <span>{r.bBasis}</span>
              <span>{r.bBit}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="bb84-result">
        Sifted key: <b>{kept.map((r) => r.bBit).join('') || '—'}</b> · Error rate <b className={qber > 11 ? 'bad' : 'good'}>{qber}%</b>
        {' — '}
        {qber > 11 ? 'too noisy: someone is listening. Abort the key.' : 'clean channel: key accepted.'}
      </p>
    </div>
  )
}
