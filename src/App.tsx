import { lazy, Suspense, useEffect, useMemo } from 'react'
import { profile } from './content/expedition'
import { useStore } from './store'
import { Classic } from './ui/Classic'
import { Overlay } from './ui/Overlay'

// The 3D world is a separate chunk so the classic page and intro load instantly.
const World = lazy(() => import('./world/World').then((m) => ({ default: m.World })))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const webgl = useMemo(hasWebGL, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (!webgl || params.get('mode') === 'classic') setMode('classic')
    else if (params.get('mode') === 'world') setMode('world')
  }, [webgl, setMode])

  if (mode === 'classic') return <Classic webgl={webgl} />

  return (
    <>
      {mode === 'world' && (
        <Suspense fallback={<div className="loading">Mixing the paints…</div>}>
          <World />
          <Overlay />
        </Suspense>
      )}
      {mode === 'intro' && (
        <div className="intro">
          <div className="intro-card">
            <p className="intro-kicker">Expedition24 · a portfolio you fight through</p>
            <h1>{profile.name}</h1>
            <p className="intro-sub">{profile.title}</p>
            <button className="primary big" onClick={() => setMode('world')}>
              Begin the Expedition
            </button>
            <button className="ghost" onClick={() => setMode('classic')}>
              In a hurry? Classic view
            </button>
            <p className="intro-controls">
              <kbd>W</kbd>/<kbd>↑</kbd>/scroll to ride · <kbd>E</kbd> read the journal · <kbd>Space</kbd> parry in battle ·
              win each place to open the road
            </p>
          </div>
        </div>
      )}
    </>
  )
}
