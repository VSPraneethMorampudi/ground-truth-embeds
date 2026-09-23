GROUND TRUTH · StoryMap embeds (v2)

index.html              everything, self-contained (~310 KB, no external requests)
cover-ground-truth.jpg  2400x1350 cover image (map sits right of centre, clear of the title card)

EMBED URLS  (add &bare inside sidecars)
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
