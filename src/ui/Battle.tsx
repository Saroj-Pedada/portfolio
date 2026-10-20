import { useCallback, useEffect, useRef, useState } from 'react'
import { baseMoves, player, regions, type Enemy, type EnemyAttack, type Move } from '../content/expedition'
import { useStore } from '../store'
import { ContactBlock } from './Overlay'

// Short turn-based battles in the Clair Obscur spirit: spend AP on skills on your turn, and on the
// enemy's turn parry each hit by pressing Space (or tapping) as the ring closes on the target.
// A perfect parry takes no damage, counters and gives AP; a near miss dodges; anything else hits.

type Phase = 'banner' | 'player' | 'enemy' | 'victory' | 'defeat'
type Popup = { id: number; text: string; side: 'enemy' | 'player'; kind: 'dmg' | 'heal' | 'info' }
type Qte = { key: number; duration: number; attack: EnemyAttack; hit: number }

const PERFECT_MS = 120
const GOOD_MS = 240
const COUNTER = 8
const BETWEEN_WAVES_HEAL = 20

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function Battle() {
  const index = useStore((s) => s.regionIndex)
  const region = regions[index]
  const battle = region.battle!
  const waves: Enemy[] = [...battle.fights, battle.boss]

  const [wave, setWave] = useState(0)
  const [enemyHp, setEnemyHp] = useState(waves[0].hp)
  const [hp, setHp] = useState(player.hp)
  const [ap, setAp] = useState(player.startAp)
  const [revealed, setRevealed] = useState(false)
  const [phase, setPhase] = useState<Phase>('banner')
  const [log, setLog] = useState<string>('')
  const [popups, setPopups] = useState<Popup[]>([])
  const [qte, setQte] = useState<Qte | null>(null)
  const [qteResult, setQteResult] = useState<string | null>(null)
  const [shake, setShake] = useState<'enemy' | 'player' | null>(null)

  const enemy = waves[wave]
  const isBoss = wave === waves.length - 1
  const hidden = !!enemy.hiddenUntil && !revealed
  const alive = useRef(true)
  const qteStart = useRef(0)
  const qteResolve = useRef<((delta: number | null) => void) | null>(null)
  const popupId = useRef(0)
  // the latest values, for the async enemy turn
  const live = useRef({ hp, enemyHp })
  live.current = { hp, enemyHp }

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const pop = useCallback((text: string, side: Popup['side'], kind: Popup['kind']) => {
    const id = ++popupId.current
    setPopups((p) => [...p, { id, text, side, kind }])
    setTimeout(() => alive.current && setPopups((p) => p.filter((x) => x.id !== id)), 1100)
  }, [])

  const bump = (who: 'enemy' | 'player') => {
    setShake(who)
    setTimeout(() => alive.current && setShake(null), 300)
  }

  // ---- wave banner -> player turn
  useEffect(() => {
    if (phase !== 'banner') return
    setLog(isBoss ? `Boss: ${enemy.name}. ${enemy.lore}` : `${enemy.name} appears. ${enemy.lore}`)
    const t = setTimeout(() => alive.current && setPhase('player'), 1600)
    return () => clearTimeout(t)
  }, [phase, enemy, isBoss])

  // ---- parry input
  const parry = useCallback(() => {
    if (!qteResolve.current) return
    const delta = performance.now() - qteStart.current
    const r = qteResolve.current
    qteResolve.current = null
    r(delta)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'f') {
        e.preventDefault()
        parry()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [parry])

  const runQte = (attack: EnemyAttack, hitNo: number, duration: number) =>
    new Promise<number | null>((resolve) => {
      qteStart.current = performance.now()
      qteResolve.current = resolve
      setQte({ key: Math.random(), duration, attack, hit: hitNo })
      // no press by the end of the window counts as a miss
      setTimeout(() => {
        if (qteResolve.current === resolve) {
          qteResolve.current = null
          resolve(null)
        }
      }, duration + GOOD_MS)
    })

  // ---- enemy turn
  const enemyTurn = useCallback(async () => {
    setPhase('enemy')
    const attack = enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)]
    setLog(`${enemy.name} uses ${attack.name}!`)
    await wait(700)
    let playerHp = live.current.hp
    let gainedAp = 0
    for (let h = 0; h < attack.hits; h++) {
      if (!alive.current) return
      const enraged = enemy.enrage && live.current.enemyHp < enemy.hp / 2
      let duration = attack.speed ?? (isBoss ? 1000 : 1100)
      if (attack.jitter) duration = 550 + Math.random() * 900
      if (enraged) duration *= 0.75
      const pressed = await runQte(attack, h, duration)
      setQte(null)
      const delta = pressed === null ? Infinity : Math.abs(pressed - duration)
      if (delta <= PERFECT_MS) {
        setQteResult('Parry!')
        gainedAp += 1
        live.current.enemyHp = Math.max(0, live.current.enemyHp - COUNTER)
        setEnemyHp(live.current.enemyHp)
        pop(`-${COUNTER}`, 'enemy', 'dmg')
        bump('enemy')
      } else if (delta <= GOOD_MS) {
        setQteResult('Dodge')
      } else {
        setQteResult(pressed === null ? 'Hit' : pressed < duration ? 'Too early' : 'Too late')
        playerHp = Math.max(0, playerHp - attack.damage)
        setHp(playerHp)
        pop(`-${attack.damage}`, 'player', 'dmg')
        bump('player')
      }
      await wait(450)
      setQteResult(null)
      if (playerHp <= 0) {
        setPhase('defeat')
        return
      }
      if (live.current.enemyHp <= 0) break
      await wait(200)
    }
    if (gainedAp) setAp((a) => Math.min(player.maxAp, a + gainedAp))
    if (!alive.current) return
    if (live.current.enemyHp <= 0) {
      afterEnemyDown()
      return
    }
    setLog('Your turn.')
    setPhase('player')
  }, [enemy, isBoss, pop])

  // ---- enemy down: next wave or victory
  const afterEnemyDown = () => {
    if (isBoss) {
      useStore.getState().winBattle(index)
      setPhase('victory')
      return
    }
    setLog(`${enemy.name} is defeated.`)
    setTimeout(() => {
      if (!alive.current) return
      const next = wave + 1
      setWave(next)
      setEnemyHp(waves[next].hp)
      setRevealed(false)
      setHp((v) => Math.min(player.hp, v + BETWEEN_WAVES_HEAL))
      setPhase('banner')
    }, 900)
  }

  // ---- player move
  const use = (move: Move) => {
    if (phase !== 'player' || ap < move.cost) return
    let nextAp = ap - move.cost
    if (move.id === 'strike') nextAp = Math.min(player.maxAp, nextAp + 1)
    setAp(nextAp)

    if (move.id === 'focus') {
      setHp((v) => Math.min(player.hp, v + move.power))
      pop(`+${move.power}`, 'player', 'heal')
      setLog('You steady yourself.')
      setTimeout(() => alive.current && enemyTurn(), 700)
      return
    }

    const reveals = enemy.hiddenUntil === move.id && hidden
    if (reveals) setRevealed(true)
    const weak = move.id === enemy.weakTo
    const veiled = hidden && !reveals
    const dmg = Math.round(move.power * (weak ? 2 : 1) * (veiled ? 0.25 : 1) * (0.9 + Math.random() * 0.2))
    const left = Math.max(0, enemyHp - dmg)
    setEnemyHp(left)
    live.current.enemyHp = left
    pop(`-${dmg}`, 'enemy', 'dmg')
    bump('enemy')
    if (weak) pop('WEAK!', 'enemy', 'info')
    setLog(
      reveals
        ? `${move.name}: the error rate spikes. ${enemy.name} is revealed!`
        : veiled
          ? `${move.name} barely lands. ${enemy.name} is hiding in the noise.`
          : `${move.name}! ${move.text}`,
    )
    setPhase('enemy')
    setTimeout(() => {
      if (!alive.current) return
      if (left <= 0) afterEnemyDown()
      else enemyTurn()
    }, 800)
  }

  const retry = () => {
    setWave(0)
    setEnemyHp(waves[0].hp)
    setHp(player.hp)
    setAp(player.startAp)
    setRevealed(false)
    setPhase('banner')
  }

  const leave = () => useStore.getState().setBattle(false)
  const next = regions[index + 1]
  const moves = [...baseMoves, ...battle.moves]
  const tip = battle.tutorial ? tutorialTip(phase, wave) : null

  // ---- end screens
  if (phase === 'victory') {
    return (
      <div className="battle">
        <div className="battle-end">
          <p className="journal-act">Victory</p>
          <h2 className="battle-end-title">{region.name} cleared</h2>
          <p className="battle-why">{battle.why}</p>
          <p className="battle-label">Pictos earned</p>
          <div className="pictos">
            {region.skills.map((s) => (
              <span key={s} className="picto">
                {s}
              </span>
            ))}
          </div>
          {!next && (
            <>
              <p className="battle-why">The expedition is complete. The next one could be with you.</p>
              <ContactBlock />
            </>
          )}
          <div className="battle-end-actions">
            {next && (
              <button
                className="primary"
                onClick={() => {
                  leave()
                  useStore.getState().travelTo(index + 1)
                }}
              >
                Ride on to {next.name} ›
              </button>
            )}
            <button
              className="ghost"
              onClick={() => {
                leave()
                useStore.getState().travelTo(0)
              }}
            >
              Return to camp
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'defeat') {
    return (
      <div className="battle">
        <div className="battle-end">
          <p className="journal-act">Defeat</p>
          <h2 className="battle-end-title">You fell to {enemy.name}</h2>
          <p className="battle-why">Tip: parry when the ring meets the circle, and use the move marked Weak.</p>
          <div className="battle-end-actions">
            <button className="primary" onClick={retry}>
              Try again
            </button>
            <button className="ghost" onClick={leave}>
              Leave for now
            </button>
          </div>
        </div>
      </div>
    )
  }

  const weakMove = moves.find((m) => m.id === enemy.weakTo)

  return (
    <div className="battle" style={{ '--enemy': enemy.color, '--accent': region.palette.accent } as React.CSSProperties}>
      <header className="battle-top">
        <span className="journal-act">
          {region.name} · {isBoss ? 'Boss' : `Fight ${wave + 1} of ${battle.fights.length}`}
        </span>
        <button className="ghost" onClick={leave} disabled={phase === 'enemy'}>
          Flee
        </button>
      </header>

      <div className="battle-stage">
        <div className={`combatant enemy ${shake === 'enemy' ? 'shake' : ''} ${hidden ? 'veiled' : ''} ${isBoss ? 'boss' : ''}`}>
          <div className="enemy-glyph" aria-hidden>
            {enemy.glyph}
          </div>
          <div className="combatant-name">{enemy.name}</div>
          <Bar value={enemyHp} max={enemy.hp} kind="enemy" />
          <div className="enemy-weak">
            {hidden ? 'Hidden. Find her in the error rate.' : `Weak to ${weakMove?.name}`}
          </div>
          {popups
            .filter((p) => p.side === 'enemy')
            .map((p) => (
              <span key={p.id} className={`popup ${p.kind}`}>
                {p.text}
              </span>
            ))}
        </div>

        {qte && (
          <button className="qte" onPointerDown={parry} aria-label="Parry">
            <span className="qte-target" />
            <span key={qte.key} className="qte-ring" style={{ animationDuration: `${qte.duration}ms` }} />
            <span className="qte-label">
              {qte.attack.hits > 1 ? `Hit ${qte.hit + 1}/${qte.attack.hits}` : 'Parry'}
            </span>
          </button>
        )}
        {qteResult && <div className="qte-result">{qteResult}</div>}

        <div className={`combatant hero ${shake === 'player' ? 'shake' : ''}`}>
          <div className="combatant-name">{player.name}</div>
          <Bar value={hp} max={player.hp} kind="hero" />
          <div className="ap" aria-label={`${ap} AP`}>
            {Array.from({ length: player.maxAp }, (_, i) => (
              <span key={i} className={i < ap ? 'on' : ''} />
            ))}
          </div>
          {popups
            .filter((p) => p.side === 'player')
            .map((p) => (
              <span key={p.id} className={`popup ${p.kind}`}>
                {p.text}
              </span>
            ))}
        </div>
      </div>

      <p className="battle-log" aria-live="polite">
        {log}
      </p>
      {tip && <p className="battle-tip">{tip}</p>}

      <div className={`moves ${phase === 'player' ? '' : 'waiting'}`}>
        {moves.map((m) => (
          <button
            key={m.id}
            className={`move ${m.id === enemy.weakTo && !hidden ? 'weak' : ''} ${m.id === enemy.hiddenUntil && hidden ? 'weak' : ''}`}
            disabled={phase !== 'player' || ap < m.cost}
            onClick={() => use(m)}
            title={m.text}
          >
            <span className="move-name">{m.name}</span>
            <span className="move-cost">{m.cost ? `${m.cost} AP` : '+1 AP'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Bar({ value, max, kind }: { value: number; max: number; kind: 'enemy' | 'hero' }) {
  return (
    <div className={`bar ${kind}`} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <span style={{ width: `${(value / max) * 100}%` }} />
      <em>
        {value} / {max}
      </em>
    </div>
  )
}

function tutorialTip(phase: Phase, wave: number) {
  if (phase === 'enemy') return 'Press Space (or tap the ring) the moment it meets the circle. Perfect = parry, close = dodge.'
  if (phase !== 'player') return null
  if (wave === 0) return 'Strike builds AP. Spend AP on skills. The move marked Weak deals double damage.'
  return 'Low on HP? Focus heals. Parrying gives AP too.'
}
