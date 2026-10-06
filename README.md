GROUND TRUTH · StoryMap embeds (v3 · Pajamas design language)

Styled with GitLab Pajamas tokens (@gitlab/ui 137.x), GitLab Sans / GitLab Mono (OFL-1.1, subset in fonts/) and GitLab SVG icons (MIT).

index.html              overview + six views (~320 KB); loads fonts/ from the same folder
cover-ground-truth.jpg  2400x1350 cover image (map sits right of centre, clear of the title card)

EMBED URLS  (add &bare inside sidecars)
  index.html#overview        (full-width intro: base map with handwritten notes)
  index.html#intake&bare
  index.html#conversion&bare
  index.html#projection&bare&crs=lcc
  index.html#storage&bare
  index.html#publication&bare
  index.html#cartography&bare

HOSTING: HTTPS, and no X-Frame-Options: DENY or restrictive frame-ancestors header.

REBUILD WITH OFFICIAL BOUNDARIES (source/)
  npm i mapshaper d3-geo d3-delaunay proj4 world-atlas topojson-client @turf/turf
  put the Revenue Dept district layer (GeoJSON, EPSG:4326, property "district") at data/cg.geojson
  npx mapshaper data/cg.geojson -simplify 10% keep-shapes -clean -o data/districts.json format=geojson precision=0.0001
  npx mapshaper data/cg.geojson -simplify 10% keep-shapes -clean -dissolve -o data/state.json format=geojson precision=0.0001
  edit the LCC parameters at the top of build.js if yours differ
  node build.js && mkdir -p dist && python3 assemble.py

Handwritten notes: Caveat (OFL-1.1), fonts/Caveat-*.woff2

JOURNEY (one record, AWC-RPR-00412, followed through the pipeline; scroll inside the frame)
  index.html#j-intro&bare
  index.html#j-intake&bare
  index.html#j-conversion&bare
  index.html#j-projection&bare
  index.html#j-storage&bare
  index.html#j-publication&bare
  index.html#j-cartography&bare
  index.html#j-provenance&bare
  index.html#j-inuse&bare
  index.html#j-update&bare
  Sources: source/journey.js, source/journey.css (inlined by assemble4.py)

SECTION FIGURES (v5 · hand-annotated, stepped)
  #intake #conversion #projection #cartography follow the overview's look
  (#storage and #publication keep their original interactive designs, with phone layouts):
  one drawing, handwritten notes with pen arrows, 3 to 5 steps (arrows, step list, tap or swipe the drawing).
  Phones (< 700 px): drawing on top, numbered notes below keyed to numbered markers, sticky step bar.
  Options: &step=N opens a step directly (no autoplay); &auto=off stops autoplay.
  Source: source/sketch.js (inlined by assemble4.py)
  New in v5.1: #provenance, #inuse, #update (the last three sections of the story), hand-drawn
  scale bars on map figures, a note under each figure saying what is real and what is illustrative,
  and a "next:" cue on the last step.

NEW STORY OUTLINE (v8 · 1 Oct 2026) — one figure per section of the re-ordered story
  index.html#create&bare        1 Data Creation: old records, paper to digital (Try it: drag the scanner), new data, keeping it current
  index.html#geodatabase&bare   2 Geodatabase: stacked layers, a record (Try it: tap the centre), rules at the door, one home
  index.html#portal&bare        3 Geo Portal: open it, layers (Try it: switch on centres), search, Ask AI, accessibility
  index.html#mobile&bare        4 Mobile App: you are here, nearby, capture (Try it: tap to drop a point), send for review
  index.html#mapping&bare       5 Mapping and cartography: raw data, colour (Try it: pick the river colour), labels, a thematic map
  index.html#maintain&bare      6 Maintenance: running, safe, current (Try it: publish or send back), all three
  index.html#cycle&bare         Closing: the six stages as one loop (Try it: drag the marker round once)
  Cover: reuse index.html#overview. Source: source/story8.js (inlined by assemble4.py after sketch.js and play.js).
  Pinned copy: versions/v8/#<view>&bare
  Step control: arrows and progress dots (no labelled tabs). &nav=off hides it, so a sidecar can pin one
    step per slide with &step=N and let the story's own scrolling move the figure.

VERSIONS (frozen copies; links never change)
  versions/v8/   1 Oct 2026 · Figures for the new story outline (current build)
  versions/index.html lists every version and its embed links
  versions/v7/   30 Sep 2026 · Pen only for arrowed notes, one optional Try it per figure
  versions/v6/   29 Sep 2026 · Your turn: hands-on sketch figures, faster
  versions/v5/   28 Sep 2026 · Hand-annotated section figures (commit 51c3791)
  versions/v4.1/   25 Sep 2026 · Overview, vertical flow and the scroll journey (commit cafc85f)
  versions/v4/   24 Sep 2026 · Hands-on figures on real geography (commit 2fd7c85)
  versions/v3/   23 Sep 2026 · GitLab Pajamas restyle (commit c6ec764)
  versions/v2/   23 Sep 2026 · First six figures (commit 63fa3a3)
  The root index.html is the current build and keeps changing. Point a story at versions/<v>/#<view> to pin it.

v6 (29 Sep 2026): every sketch step ends in a "your turn" task (source/play.js); animations run at half duration
  and a tap finishes any animation. Storage and Publication keep their v4 interactive designs.

v7 (30 Sep 2026): type and interaction cleanup after a review of the story.
  Type rule: Caveat (pen) only for a note that carries a pen arrow to what it points at. Every other
    note, every label inside a drawing, the step bar, the Try it bar and the footer are set in the
    story's own font (Avenir Next World); IDs, table names and field values in GitLab Mono. On phones
    all notes are typed (they sit in a numbered list under the drawing).
  One optional Try it per figure instead of a task on every step (see the table at the top of
    source/play.js). Tasks never block: the arrows and step list always move on, a stray tap on the
    drawing no longer shakes the bar, "Show me" solves it. Steps without a task animate again.
  No "next:" cue under the last step: the story's own navigation says what comes next.
  Fonts: the figure waits for Avenir, Caveat and GitLab Mono before its first layout, so the
    reveal masks are measured on the real faces and no word is cut off.
  Layout: a note with an arrow sits level with what it points at; a note alone in its column is
    centred on the drawing. No more notes stacked at the top over empty space.
  Home ground, no world map: Intake and Projection draw Chhattisgarh among its eight neighbouring
    states (Natural Earth admin-1, in the state's own projection) with the state's lat/long box
    traced through the projection. A record that lands far away (swapped lat/long, blank = 0,0, a
    lost .prj) waits as a red pin on the map's edge, on the great-circle bearing from Raipur, with
    its coordinates and distance: 81.63° N, 21.25° E is about 7,200 km north; 0° N, 0° E is about
    9,100 km west. The Intake task is now: drag that pin back inside the dashed box.
  Fixes: Projection colour key no longer overlaps the scale bar; Provenance card values stay inside
    the card; Update cycle arrow no longer crosses the record ID.

AUTOSLIDE (v11 · 6 Oct 2026)
  A try-it step can demo itself when nothing else drives the figure (e.g. &nav=off&step=N in a sidecar).
  Data Creation step 2: the scanner sweeps across the sheet and back, looping, until the reader grabs it.
  index.html#create&bare&nav=off&step=1      &auto=off keeps it still.   Frozen copy: versions/v11/

OVERVIEW ON HOVER (v12 · 6 Oct 2026)
  #overview keeps two points in Avenir Next World: "The work: merge it all" and "162 layers".
  The four source notes are gone from the resting view; hover the map (tap on phones, Enter on keyboard)
  and it separates into four labelled copies. Frozen copy: versions/v12/ (also has v11's autoslide).

OVERVIEW TEXT (v13 · 6 Oct 2026)
  Drops the "Already running on it" row and the caption under the overview. Two left-aligned blocks,
  same top, centred on the map: "Merged onto one base" and "162 layers". Frozen copy: versions/v13/

OVERVIEW PEN MARKS (v14 · 6 Oct 2026)
  Pen arrow from the highlighted line to a hand-drawn ring round the village (ring only on phones).
  Larger type; blocks hug the map at a fixed gap; title and number share one cap line. Frozen: versions/v14/
