Chhattisgarh State Centre of Geo-Informatics — orbit to Raipur

- `chhattisgarh-geo-informatics-v3.mp4`: current export, 24 seconds, 1920 × 1080, 30 fps, H.264; silent.
- Opens on the site's globe with the extra-bold three-line title “Chhattisgarh State Centre of Geo-Informatics,” using a staggered masked rise and blur-to-sharp reveal.
- The CHiPS logo appears at the top right throughout, using the existing geoportal's logo asset unchanged. District labels avoid the logo area.
- An animated leader from the Raipur pin reveals the full centre name at the lower right of the final map.
- Removes the header, language/play controls, telemetry, mission/progress bar, scroll cue, and cursor.
- Follows the site's original geography and animation, ending on the binary Chhattisgarh map centred on Raipur, before the paper transition.
- `chips-gis-start.png` and `chips-gis-end.png` are still previews.
- `chips-gis-title.png` shows the finished title; `chips-gis-reveal.png` shows the reveal in progress.
- District positions use interior polygon anchors rather than spherical centroids. Full label rectangles are checked against their district boundaries; long names wrap onto multiple lines.
- Animation references: React Bits [Split Text](https://reactbits.dev/text-animations/split-text) and [Blur Text](https://reactbits.dev/text-animations/blur-text). The video uses an original deterministic canvas adaptation.

Replay locally by serving the repository and opening `site/video.html`.
Regenerate with `node site/tools/render-orbit-video.cjs`; requires Playwright and Chromium with H.264 WebCodecs support. Set `PLAYWRIGHT_MODULE` and `CHROME_PATH` if needed. Add `--preview` for stills only or `--verify-only` to check an existing export.

The video uses a separate presentation page. The district-label correction also applies to the site's original globe renderer. Earlier MP4 exports remain available under their original filenames.
