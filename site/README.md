GROUND TRUTH · the website (site/)

From orbit down to Raipur, then a playable game: the state map is built in front of you from the
data the departments send. English and Hindi. "Play the story" runs the whole thing by itself in
about 3 minutes (flight, then the game in watch mode, then the ending).

THE GAME (game/)
  A miniature 3D Chhattisgarh on a plinth (Three.js), built from the official 33-district layer.
  Bindu, a map pin, guides the player. Each level is one stage of the real workflow:
    1 Collect      click the files eight departments send (boundaries drop the 33 districts in)
    2 Sort         drag records onto Boundaries / Water / Roads & rail / Facilities; broken ones to Fix
    3 Pinpoint     drag three lost records (swapped lat/long, blank 0°,0°, no .prj) onto their districts
    4 Merge        stack the layers bottom-up (areas, lines, points): forest, rivers, roads, facilities appear
    5 Publish      the portal: switch layers, search a district, ask AI (answers from the map's data)
    6 Field        drop a new Anganwadi point inside the ring from the field app, send it for review
    7 Cartography  pick the river colour, choose a question: districts rise into a 3D thematic map
    8 Maintain     publish or send back incoming updates from their rule checks
  Badges per level, a data-quality score, and a downloadable map card at the end.
  Every level has "Show me" (the guide solves it); "Watch it play" runs all eight.
  Real: district boundaries, state outline, rivers, roads, rail, towns. Illustrative: facility points,
  trees, records, updates and the AI answers.

FILES
  index.html        page shell (preloader, header, orbit stage, game section, outro, auto-play pill)
  content.js        orbit and closing text (EN + HI), portal link, auto-play length
  globe.js          the opening flight (canvas): Earth, satellite, zoom to the districts, Raipur lock-on
  geo.js            generated (tools/gen-geo.mjs): world land dots, India, state, districts, neighbours,
                    rivers/roads/rail clipped to the state, towns
  game/world.js     the 3D diorama: districts, layers, pins, labels, picking, choropleth, snapshot,
                    adaptive quality (drops resolution and shadows on slow machines; ?lowgl forces it)
  game/game.js      the guide, HUD, badges, the eight levels and their auto-solvers
  game/game.css     game styles (desktop side panel, phone bottom sheet)
  app.js            language, smooth scroll (Lenis), preloader, cursor, outro, auto-play
  vendor/           three 0.170 + OrbitControls (MIT), gsap + ScrollTrigger 3.15 (GSAP standard licence),
                    lenis 1.3 (MIT), d3-geo 3 (ISC)
  Fonts: Google Fonts. Fraunces (headlines, SOFT/WONK axes) + Bricolage Grotesque (body, game UI) + Geist Mono (labels);
                    Hindi: Tiro Devanagari Hindi (headlines) + Anek Devanagari (body, UI)

URL OPTIONS
  #play    start auto-play on load (kiosk / meeting-room screen)
  ?lowgl   low-quality 3D from the start

REBUILD geo.js
  npm i world-atlas@2 topojson-client d3-geo   then: node site/tools/gen-geo.mjs (from a folder with those node_modules)
