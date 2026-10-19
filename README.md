# Saroj Pedada · The Expedition

A portfolio you ride through. Each phase of my career is a region on a painted road, travelled on the back of a big, soft companion creature. Work comes first, in chronological order (Acts I–III), then hobbies (Act IV).

```
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

`?mode=classic` opens the plain résumé-style page; `?mode=world` skips the intro.

## Editing content

Everything lives in [`src/content/expedition.ts`](src/content/expedition.ts): regions, dates, bullets, links, skills ("Pictos") and media slots. Lines marked `TODO(saroj)` still need real details.

To fill a media slot, drop the file into `public/media/` and set `src`, e.g. `{ kind: 'audio', label: 'Recording', src: 'media/song.mp3' }`. Slots without `src` show a "coming soon" frame.

## Layout

| Path | What |
|---|---|
| `src/world/path.ts` | the road, stop positions, terrain height |
| `src/world/Landmarks.tsx` | one procedural landmark per region (swap any for a GLB model) |
| `src/world/Creature.tsx` | the companion and rider |
| `src/world/Rig.tsx` | input, travel, camera |
| `src/world/Painterly.tsx` | Kuwahara oil-paint post effect |
| `src/ui/` | HUD, journal, inventory, BB84 mini-game, classic page |

## Deploying

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`, served at https://saroj-pedada.github.io/portfolio/. One-time setup: repo **Settings → Pages → Source: GitHub Actions**.
