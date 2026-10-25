GROUND TRUTH · the website (site/)

An immersive version of the StoryMap: from orbit down to Raipur, then the story on paper,
using the same embeds as the Esri StoryMap. English and Hindi. "Play the story" scrolls the page
by itself in about 3 minutes; any wheel, swipe, key or tap on a figure hands control back.

FILES
  index.html    page shell (preloader, header, orbit stage, auto-play pill)
  content.js    all text (EN + HI), embed URLs (G.E), portal link, auto-play length. Edit here.
  globe.js      the opening flight (canvas): dotted Earth, satellite and beam, zoom to the
                official 33 districts, Raipur lock-on, landing on paper
  geo.js        generated: world-atlas land (Natural Earth, public domain), India outline,
                Chhattisgarh dots, official districts and neighbouring states from ../source/
  app.js        builds the sections, smooth scroll (Lenis), scroll animations (GSAP ScrollTrigger),
                step cards that drive the figures, cursor, level rail, toasts, auto-play
  style.css     design: space → paper. Fonts from Google Fonts: Instrument Serif + Inter Tight (English),
                Tiro Devanagari Hindi + Noto Sans Devanagari (Hindi), JetBrains Mono (labels)
  vendor/       gsap + ScrollTrigger 3.15 (GSAP standard licence), lenis 1.3 (MIT), d3-geo 3 (ISC)

SCENES (app.js)
  scene   pinned: the chapter title fills the screen, the figure grows from a card behind it to full
          size, then scrolling plays the steps (captions cross-fade, the figure follows)
          used for the overview, Geodatabase, Mobile, Mapping, Maintenance and the closing cycle
  track   pinned, sideways: one full screen per step URL (Data Creation)
  window  pinned: the live portal grows to full screen, feature captions play over it
  Figures show "Click to play": a click hands the mouse to the figure, moving off it hands it back
  to the page, so the wheel never gets stuck inside a figure.

EMBEDS (content.js → E). BASE is "../" so the folder works inside this Pages site:
  https://vspraneethmorampudi.github.io/ground-truth-embeds/site/
  On another host set BASE to "https://vspraneethmorampudi.github.io/ground-truth-embeds/".
  sync:true embeds follow the step cards (adds &nav=off&auto=off&step=N); Data Creation keeps one
  iframe per step (the four URLs from the StoryMap) and cross-fades between them.
  The live portal (v18) loads MapLibre from unpkg, so it needs internet access.

URL OPTIONS
  #play        start auto-play on load (kiosk / screen in a meeting room)

REBUILD geo.js
  npm i world-atlas@2 topojson-client d3-geo   then: node site/tools/gen-geo.mjs (from a folder with those node_modules)
  (land 110m dots every 1.6°, India 50m dots every 0.3°, state dots every 0.055°).
