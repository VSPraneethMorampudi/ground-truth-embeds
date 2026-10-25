GROUND TRUTH · the website (site/)

From orbit down to Raipur, then a playable game: the state map is built in front of you from the
data the departments send. English and Hindi. "Play the story" runs the whole thing by itself in
about 3 minutes (flight, then the game in watch mode, then the ending).

THE PIPELINE (pipeline/): the main story, driven by scroll
  One sticky 3D scene (Three.js) that you move through by scrolling, 13 steps, each one screen:
    departments (8 buildings, each with its real file format floating above: Shapefile, KML, CAD .dwg, Excel,
    GPS CSV, handwritten register, satellite GeoTIFF, scanned toposheet) → collection on a conveyor →
    the CHiPS GIS team lab (analysts at dual monitors: digitising, attribute tables, georeferencing scans;
    rows → points with swapped lat/long fixed; CAD/KML reprojected to EPSG:4326) →
    quality gate (one record with a blank code is sent back) → State Data Centre (42U racks with 1U/2U
    servers, drive bays, blinking LEDs, cable tray) and geodatabase layers → the 33-district map assembling
    layer by layer → the Geoportal screen → field app, dashboard and department GIS → use cases → the loop.
  The overlay shows a bold short caption (words rise in) and a side panel with the actual content: file
  snippets, conversion before → after, the checklist, layer counts, use cases.
  Everything in the scene is a function of scroll position, so scrolling back rewinds it exactly.
  Files: pipeline/steps.js (all text, EN + HI, camera keys), pipeline/scene.js (3D), pipeline/pipeline.js
  (scroll → scene + overlay), pipeline/pipeline.css. The 3D loads only when the reader gets close.

THE GAME (play.html, game/): the earlier hands-on game, kept as an optional page linked at the end.

FILES
  index.html        page shell (preloader, header, orbit stage, game section, outro, auto-play pill)
  content.js        orbit and closing text (EN + HI), portal link, auto-play length
  globe.js          the opening flight (canvas): Earth, satellite, zoom to the districts, Raipur lock-on
  geo.js            generated (tools/gen-geo.mjs): world land dots, India (official boundary, see below), state,
                    districts, neighbours,
                    rivers/roads/rail clipped to the state, towns
  game/world.js     the 3D diorama: districts, layers, pins, labels, picking, choropleth, snapshot,
                    adaptive quality (drops resolution and shadows on slow machines; ?lowgl forces it)
  game/game.js      the guide, HUD, badges, the eight levels and their auto-solvers
  game/game.css     game styles. Desktop: side panel. Phones (≤900px): the page header hides, one compact top bar
                    (exit, level dots, quality, restart, sound), the level panel is a bottom sheet that scrolls
                    with its buttons pinned, and shrinks ("peek") while you need the map (Pinpoint, Field);
                    the 3D view is re-centred on the visible area above the sheet (World.setInset)
  fx.js / fx.css    the feel layer: rolling-label buttons with a fill from the cursor and springy press, card
                    tilt with glare, particle bursts and +1 / ✕ floats, soft synthesised sounds (mute button
                    in the game HUD; sounds only inside the game), phone vibration, count-ups
  cursor.js         the surveyor cursor: crosshair with a GPS breadcrumb trail, corner brackets that lock onto
                    buttons and cards (Drag / Open tags), dashed route while dragging, live district and
                    coordinates over the 3D map, ping on click. Desktop only; off for reduced motion
  icons.js          Phosphor Icons (duotone, MIT) as an inline sprite; icon("name") returns an <svg>
  app.js            language, smooth scroll (Lenis), preloader, cursor, outro, auto-play
  vendor/           three 0.170 + OrbitControls (MIT), gsap + ScrollTrigger 3.15 (GSAP standard licence),
                    lenis 1.3 (MIT), d3-geo 3 (ISC)
  Fonts: Google Fonts. Bricolage Grotesque (display: 800, 75% width; body and UI), Geist Mono (labels, HUD),
  Theme: Mahanadi (river blue, coral accent, yellow buttons) by default. ?theme=paddy|sal|night|default previews
                    the other palettes; every colour, including the 3D world and the globe, is a token in style.css.
                    Anek Devanagari (Hindi display and body)

URL OPTIONS
  #play    start auto-play on load (kiosk / meeting-room screen)
  ?lowgl   low-quality 3D from the start

REBUILD geo.js
  npm i world-atlas@2 topojson-client d3-geo   then: node site/tools/gen-geo.mjs (from a folder with those node_modules)

INDIA BOUNDARY
  The India outline and the "inside India" dots use India's official boundary as depicted by the Survey of
  India: the whole of Jammu & Kashmir and Ladakh, including PoK, Gilgit-Baltistan, Aksai Chin and the Shaksgam
  Valley, with Lakshadweep and Andaman & Nicobar. Source: DataMeet india-composite.geojson (CC0,
  github.com/datameet/maps/tree/master/Country), simplified with mapshaper (-simplify 1.5% keep-shapes), tiny
  islands re-added from the source; stored as tools/india-official.geojson. Do not swap in Natural Earth /
  world-atlas country outlines for India: they use a different (de facto) line in the north.
