# CHiPS GIS · Rajyotsav 2026 — vector video (v2)

A 1:46, 1080p30 motion piece, drawn entirely in code from the repo's real map data
(`../source/*.json`: 33 districts, state outline, rivers, roads, rail). Nothing is a screen
recording of the embeds. The embeds were used only as visual reference.

`render(t)` in `engine.js` is deterministic, so any frame can be reproduced and any
section re-rendered on its own.

## Run it
```bash
cd video-v2
npm install
npx playwright install chromium      # once
python3 make-grain.py                # needs numpy + pillow; writes assets/grain0..7.png
npm run data                         # optional: rebuilds data.js (already committed)
node r.cjs stills-out stills 6,20,48 # preview individual frames (seconds)
node r.cjs out.mp4                   # full render (~15 min); needs ffmpeg on PATH
node r.cjs part.mp4 video 44,56      # render only 44s-56s, then splice with ffmpeg concat
```

## Files
| File | What it is |
|---|---|
| `index.html` | page shell, fonts, styles for text, portal, cards, atlas pages |
| `engine.js` | camera keyframes (`KF`), every scene, text content (`T`), and `render(t)` |
| `pre.mjs` | builds `data.js`: land dots, 15,000 village points, 580 khasra parcels, rural road MST |
| `data.js` | generated geodata (committed so rendering works without rebuilding) |
| `r.cjs` | Playwright → ffmpeg frame renderer (`video` or `stills` mode) |
| `sheet.py` | contact sheet of stills for quick review |

## Editing
- **Text / timing:** the `T` object in `engine.js` (`tIn`/`tOut` per block; `countAt` for the counters).
- **Camera:** the `KF` array: `[time, lon, lat, zoom, screenX, screenY]`.
- **Scene timings** are inline in `render()`.
- Hindi text uses Mukta (OFL); the closing card uses the CHiPS logo from the portal.

## Data notes
District boundaries, state outline, India, rivers, roads and rail are real.
Forest/settlement layers, village points, khasra parcels, portal themes and atlas colours are
**illustrative**. Do not present them as real counts or departmental data.

Rajyotsav 2026: 1–3 Nov 2026, Nava Raipur. Videos are not stored here (size); keep final MP4s in a Release or Drive.
