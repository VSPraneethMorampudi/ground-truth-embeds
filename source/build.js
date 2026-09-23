// Build-time: project real geometry to SVG paths + compute GIS facts. Output: data.js
const fs = require("fs");
const d3 = require("d3-geo");
const { Delaunay } = require("d3-delaunay");
const proj4 = require("proj4");
const turf = require("@turf/turf");
const topo = require("topojson-client");
const range = (a, b, s) => { const r = []; for (let x = a; x <= b + 1e-9; x += s) r.push(+x.toFixed(4)); return r; };

const districts = JSON.parse(fs.readFileSync("data/districts.json"));
const state = JSON.parse(fs.readFileSync("data/state.json"));
const land = topo.feature(require("world-atlas/land-110m.json"), require("world-atlas/land-110m.json").objects.land);

// Suggested state LCC: 1/6 rule on the state's latitude range, CM at the centre of the longitude range
const LAT0 = 17.788, LAT1 = 24.106, LON0 = 80.246, LON1 = 84.396;
const SP1 = +(LAT0 + (LAT1 - LAT0) / 6).toFixed(2), SP2 = +(LAT1 - (LAT1 - LAT0) / 6).toFixed(2);
const CM = +((LON0 + LON1) / 2).toFixed(2), LATO = +((LAT0 + LAT1) / 2).toFixed(2);
const LCC = `+proj=lcc +lat_1=${SP1} +lat_2=${SP2} +lat_0=${LATO} +lon_0=${CM} +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs`;
const UTM44 = "+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs";
const UTM45 = "+proj=utm +zone=45 +datum=WGS84 +units=m +no_defs";

// Point scale factor for a conformal projection, measured along the meridian on the WGS84 ellipsoid
const a = 6378137, f = 1 / 298.257223563, e2 = f * (2 - f);
function k(def, lon, lat) {
  const dphi = 1e-5, p1 = proj4(def, [lon, lat - dphi / 2]), p2 = proj4(def, [lon, lat + dphi / 2]);
  const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  const phi = lat * Math.PI / 180, M = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi) ** 2, 1.5);
  return dist / (M * dphi * Math.PI / 180);
}

// Grid over the state for the distortion heat map
if (state.geometries.length !== 1) throw new Error("state parts: " + state.geometries.length);
const stFeat = { type: "Feature", properties: {}, geometry: state.geometries[0] };
const STEP = 0.1, cells = [];
for (let lon = 80.2; lon < 84.45; lon += STEP) for (let lat = 17.75; lat < 24.15; lat += STEP) {
  const c = [lon + STEP / 2, lat + STEP / 2];
  if (!turf.booleanIntersects(turf.bboxPolygon([lon, lat, lon + STEP, lat + STEP]), stFeat)) continue;
  cells.push({ lon, lat, u44: (k(UTM44, ...c) - 1) * 1e6, u45: (k(UTM45, ...c) - 1) * 1e6, lcc: (k(LCC, ...c) - 1) * 1e6 });
}
const stat = key => { const v = cells.map(c => c[key]), abs = v.map(Math.abs); return { min: Math.min(...v), max: Math.max(...v), maxAbs: Math.max(...abs) }; };
const S = { u44: stat("u44"), u45: stat("u45"), lcc: stat("lcc") };

// Area east of 84E, and districts touching it
const eastBox = turf.bboxPolygon([84, 17, 86, 25]);
const eastPart = turf.intersect(turf.featureCollection([stFeat, eastBox]));
const areaEast = eastPart ? turf.area(eastPart) / 1e6 : 0;
const areaState = turf.area(stFeat) / 1e6;
const eastDistricts = districts.features.filter(d => turf.booleanIntersects(d, eastBox)).map(d => d.properties.district);

// Worst-case length error across the state in each CRS (metres per km)
const facts = {
  sp1: SP1, sp2: SP2, cm: CM, lat0: LATO, lccDef: LCC,
  areaState: Math.round(areaState), areaEast: Math.round(areaEast), eastDistricts,
  u44: S.u44, u45: S.u45, lcc: S.lcc,
};

// ---------- SVG projection for all map views (the state LCC itself) ----------
const W = 520, H = 640;
const P = d3.geoConicConformal().parallels([SP1, SP2]).rotate([-CM, 0]).fitExtent([[24, 24], [W - 24, H - 24]], turf.rewind(stFeat, { reverse: true }));
const path0 = d3.geoPath(P).digits(1);
const path = g => path0(g.type === "LineString" ? g : turf.rewind(g.type==="Feature"?g:turf.feature(g), { reverse: true }));
const out = {
  W, H, facts,
  state: path(stFeat),
  districts: districts.features.map(d => ({ n: d.properties.district, d: path(d), c: P(d3.geoCentroid(turf.rewind(d, { reverse: true }))).map(v => +v.toFixed(1)) })),
  grat: [],
  cells: cells.map(c => {
    const ring = [[c.lon, c.lat], [c.lon + STEP, c.lat], [c.lon + STEP, c.lat + STEP], [c.lon, c.lat + STEP], [c.lon, c.lat]];
    return { lo: +(c.lon + STEP / 2).toFixed(2), la: +(c.lat + STEP / 2).toFixed(2), d: path({ type: "Polygon", coordinates: [ring] }), u44: Math.round(c.u44), u45: Math.round(c.u45), lcc: Math.round(c.lcc) };
  }),
  m84: path({ type: "LineString", coordinates: [[84, 17.5], [84, 24.4]] }),
  east: eastPart ? path(eastPart) : "",
};
for (let lon = 80; lon <= 85; lon++) out.grat.push({ t: lon + "°E", d: path({ type: "LineString", coordinates: range(17.4, 24.5, 0.2).map(l => [lon, l]) }), lab: P([lon, 17.45]).map(v => +v.toFixed(1)), ax: "x" });
for (let lat = 18; lat <= 24; lat++) out.grat.push({ t: lat + "°N", d: path({ type: "LineString", coordinates: range(79.8, 85.0, 0.2).map(l => [l, lat]) }), lab: P([79.95, lat]).map(v => +v.toFixed(1)), ax: "y" });

// ---------- Cartography: zoom target district + illustrative subdivisions ----------
const target = districts.features.find(d => d.properties.district === "Raipur");
const tb = turf.bbox(target);
let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
function randIn(feat, n) { const pts = []; const b = turf.bbox(feat); let guard = 0; while (pts.length < n && guard++ < 20000) { const p = [b[0] + rnd() * (b[2] - b[0]), b[1] + rnd() * (b[3] - b[1])]; if (turf.booleanPointInPolygon(turf.point(p), feat)) pts.push(p); } return pts; }
function voronoiClipped(feat, seeds) {
  const b = turf.bbox(feat), v = Delaunay.from(seeds).voronoi([b[0] - .1, b[1] - .1, b[2] + .1, b[3] + .1]);
  const polys = [];
  for (let i = 0; i < seeds.length; i++) {
    const cell = v.cellPolygon(i); if (!cell) continue;
    const poly = turf.polygon([cell]);
    const clip = turf.intersect(turf.featureCollection([poly, feat]));
    if (clip) polys.push(path(clip));
  }
  return polys;
}
out.carto = {
  target: "Raipur",
  bbox: (() => { const a = P([tb[0], tb[3]]), b = P([tb[2], tb[1]]); return [a[0], a[1], b[0] - a[0], b[1] - a[1]].map(v => +v.toFixed(1)); })(),
  tehsil: voronoiClipped(target, randIn(target, 5)),
  village: voronoiClipped(target, randIn(target, 150)),
  aw: randIn(target, 70).map(p => P(p).map(v => +v.toFixed(1))),
  gp: randIn(target, 18).map(p => P(p).map(v => +v.toFixed(1))),
};

// ---------- Intake: world inset (equirectangular) ----------
const WP = d3.geoEquirectangular().fitExtent([[0, 0], [640, 320]], { type: "Sphere" });
const wpath0 = d3.geoPath(WP).digits(1);
const wpath = g => wpath0(g === land ? g : turf.rewind(g, { reverse: true }));
out.world = { land: wpath(land), cg: wpath(stFeat), proj: null };
out.worldPt = ll => WP(ll);
const W_PTS = { transposed: WP([22.079618, 81.713205]).map(v => +v.toFixed(1)), nullisl: WP([0, 0]).map(v => +v.toFixed(1)), cg: WP([82.3, 21.3]).map(v => +v.toFixed(1)) };
out.worldPts = W_PTS;
// accepted/duplicate/precision locations on the state map
out.intakePts = {
  a: P([81.629641, 21.251384]), b: P([83.195774, 23.118302]), c: P([82.682119, 22.357046]), p: P([81.35, 18.89]),
};
for (const k2 in out.intakePts) out.intakePts[k2] = out.intakePts[k2].map(v => +v.toFixed(1));
// ±1.1 km precision radius in SVG units (at 18.89N)
const k1 = P([81.35, 18.89]), k2 = P([81.35 + 0.01, 18.89]);
out.precR = +(Math.hypot(k2[0] - k1[0], k2[1] - k1[1])).toFixed(2);
// statewide clutter points (what a full-state request without scale limits would draw)
out.clutter = randIn(stFeat, 2400).map(p => P(p).map(v => +v.toFixed(0)));
// storage stack: illustrative department content on the real outline
const cent = districts.features.map(d => d3.geoCentroid(turf.rewind(d, { reverse: true })));
// minimum spanning tree over district HQ-ish centroids = illustrative fibre backbone
const mst = []; { const inT = [0]; const rest = new Set(cent.map((_, i) => i).slice(1));
  while (rest.size) { let best = null; for (const i of inT) for (const j of rest) { const dd = (cent[i][0]-cent[j][0])**2 + (cent[i][1]-cent[j][1])**2; if (!best || dd < best[2]) best = [i, j, dd]; } mst.push([best[0], best[1]]); inT.push(best[1]); rest.delete(best[1]); } }
out.stack = {
  fibre: mst.map(([i, j]) => path({ type: "LineString", coordinates: [cent[i], cent[j]] })).join(""),
  gp: cent.map(c => P(c).map(v => +v.toFixed(1))),
  aw: randIn(stFeat, 260).map(p => P(p).map(v => +v.toFixed(1))),
  mines: [[82.68,22.35],[83.45,22.2],[82.6,22.8],[81.25,18.65],[81.08,20.58],[83.35,21.95],[82.85,23.05]].map(([x, y], i) => path(turf.transformRotate(turf.bboxPolygon([x - .09, y - .06, x + .09, y + .06]), 15 + i * 20))).join(""),
  pin: P([81.629641, 21.251384]).map(v => +v.toFixed(1)),
};
delete out.worldPt; delete out.world.proj;

fs.writeFileSync("data.js", "window.GT=" + JSON.stringify(out) + ";");
console.log(JSON.stringify(facts, null, 1));
console.log("cells", cells.length, "bytes", fs.statSync("data.js").size, "precR", out.precR);
