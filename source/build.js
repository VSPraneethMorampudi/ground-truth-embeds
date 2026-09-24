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
const path0 = d3.geoPath(P).digits(2);
const pathHi0 = d3.geoPath(P).digits(3);
const pathHi = g => pathHi0(g.type === "LineString" ? g : turf.rewind(g.type==="Feature"?g:turf.feature(g), { reverse: true }));
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


// ================= v4: real context layers (Natural Earth 10m, public domain) =================
const rd = f => JSON.parse(fs.readFileSync("data/" + f));
const VIEWB = turf.bboxPolygon([78.6, 16.6, 86.2, 25.2]);
const clipLine = f => { try { const c = turf.bboxClip(turf.simplify(f, { tolerance: 0.006, highQuality: false }), [78.6, 16.6, 86.2, 25.2]); return c.geometry.coordinates.length ? c : null; } catch (e) { return null; } };
const lpath = g => path0(g.type === "Feature" ? g.geometry : g);
out.ctx = {
  states: rd("cg_admin1.json").features.filter(f => f.properties.name !== "Chhattisgarh").map(f => {
    let cl = turf.intersect(turf.featureCollection([f, VIEWB])); if (!cl) return null; cl = turf.simplify(cl, { tolerance: 0.01 });
    const c = turf.centerOfMass(cl).geometry.coordinates; return { n: f.properties.name.replace("Orissa", "Odisha"), d: path(cl), c: P(c).map(v => +v.toFixed(1)) };
  }).filter(Boolean),
  rivers: rd("cg_ne_10m_rivers_lake_centerlines.json").features.map(f => { const c = clipLine(f); return c ? { n: (f.properties.name || "").replace("Mahäna Nadï", "Mahanadi").replace("Godävari", "Godavari"), d: lpath(c), r: f.properties.scalerank } : null; }).filter(Boolean),
  rail: rd("cg_ne_10m_railroads.json").features.map(f => { const c = clipLine(f); return c ? lpath(c) : null; }).filter(Boolean).join(""),
  roads: rd("cg_ne_10m_roads.json").features.filter(f => f.properties.type === "Major Highway" || f.properties.sr <= 5).map(f => { const c = clipLine(f); return c ? lpath(c) : null; }).filter(Boolean).join(""),
  cities: rd("cg_places.json").features.map(f => ({ n: f.properties.name, cg: f.properties.adm1name === "Chhattisgarh", p: f.properties.pop_max, xy: P(f.geometry.coordinates).map(v => +v.toFixed(1)) })),
};
// river label anchor: point at ~55% along the longest clipped part inside CG
out.ctx.rivers.forEach(r => { r.d = r.d; });

// ================= v4: organic sub-district geometry for the cartography zoom =================
(function () {
  const feat = target, b = turf.bbox(feat);
  // Poisson-disk seeds (Bridson), deterministic
  let s2 = 7; const R = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
  const r0 = 0.019, pts = [], active = [];
  const inF = p => turf.booleanPointInPolygon(turf.point(p), feat);
  let first; for (let g = 0; g < 500 && !first; g++) { const p = [b[0] + R() * (b[2] - b[0]), b[1] + R() * (b[3] - b[1])]; if (inF(p)) first = p; }
  pts.push(first); active.push(first);
  while (active.length && pts.length < 2500) {
    const i = Math.floor(R() * active.length), a = active[i]; let ok = false;
    for (let k = 0; k < 24; k++) { const ang = R() * 2 * Math.PI, d = r0 * (1 + R() * .9); const p = [a[0] + Math.cos(ang) * d, a[1] + Math.sin(ang) * d * .93];
      if (p[0] < b[0] - .05 || p[0] > b[2] + .05 || p[1] < b[1] - .05 || p[1] > b[3] + .05) continue;
      if (pts.every(q => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 > r0 * r0)) { pts.push(p); active.push(p); ok = true; break; } }
    if (!ok) active.splice(i, 1);
  }
  const seeds = pts;
  const vor = Delaunay.from(seeds).voronoi([b[0] - .08, b[1] - .08, b[2] + .08, b[3] + .08]);
  // deterministic midpoint displacement on shared edges -> surveyed-looking boundaries
  const hash = (x, y) => { let h = Math.floor(x * 1e5) * 73856093 ^ Math.floor(y * 1e5) * 19349663; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  function wiggle(a, c, depth) {
    if (depth === 0) return [];
    const m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const t = (hash(m[0], m[1]) - .5) * L * .32, nx = -(c[1] - a[1]) / (L || 1), ny = (c[0] - a[0]) / (L || 1);
    const mp = [m[0] + nx * t, m[1] + ny * t];
    return [...wiggle(a, mp, depth - 1), mp, ...wiggle(mp, c, depth - 1)];
  }
  function edge(a, c) { const fwd = a[0] < c[0] || (a[0] === c[0] && a[1] < c[1]); const [p, q] = fwd ? [a, c] : [c, a]; const w = wiggle(p, q, 3); return fwd ? w : w.reverse(); }
  const cells = [];
  seeds.forEach((sd, i) => {
    const poly = vor.cellPolygon(i); if (!poly) return;
    const ring = []; for (let j = 0; j < poly.length - 1; j++) { ring.push(poly[j], ...edge(poly[j], poly[j + 1])); } ring.push(ring[0]);
    let clip; try { clip = turf.intersect(turf.featureCollection([turf.polygon([ring]), feat])); } catch (e) { clip = null; }
    if (clip && turf.area(clip) > 4e5) cells.push({ seed: sd, f: clip });
  });
  // tehsils = unions of villages grouped around 5 seeds (so tehsil and village lines coincide)
  const tseeds = [[81.63, 21.25], [81.95, 21.35], [81.75, 20.95], [81.45, 21.05], [82.05, 21.05]];
  const groups = tseeds.map(() => []);
  cells.forEach(c => { let bi = 0, bd = 1e9; tseeds.forEach((t, k) => { const d = (t[0] - c.seed[0]) ** 2 + (t[1] - c.seed[1]) ** 2; if (d < bd) { bd = d; bi = k; } }); groups[bi].push(c.f); });
  const teh = groups.filter(g => g.length).map(g => { let u = g[0]; for (let k = 1; k < g.length; k++) { try { u = turf.union(turf.featureCollection([u, g[k]])) || u; } catch (e) {} } return pathHi(u); });
  // settlements: one Anganwadi near most village centres, GP nodes every ~7 villages, fibre from Raipur outward (MST)
  const vill = cells.map(c => pathHi(c.f));
  const cen = cells.map(c => { const p = turf.pointOnFeature(c.f).geometry.coordinates; return [p[0] + (R() - .5) * .006, p[1] + (R() - .5) * .006]; });
  const aw = cen.filter((_, i) => i % 5 !== 3).map(p => P(p).map(v => +v.toFixed(3)));
  const gpIdx = cen.map((_, i) => i).filter(i => i % 7 === 0); const gp = gpIdx.map(i => cen[i]);
  const hub = [81.63, 21.25]; const nodes = [hub, ...gp]; const inT = [0], rest = new Set(nodes.map((_, i) => i).slice(1)), edges = [];
  while (rest.size) { let best = null; for (const i of inT) for (const j of rest) { const d = (nodes[i][0] - nodes[j][0]) ** 2 + (nodes[i][1] - nodes[j][1]) ** 2; if (!best || d < best[2]) best = [i, j, d]; } edges.push([best[0], best[1]]); inT.push(best[1]); rest.delete(best[1]); }
  out.carto.village = vill;
  out.carto.tehsil = teh;
  { const names = ["Raipur", "Kharora", "Abhanpur", "Dharsiwa", "Arang"];
    out.carto.tehN = groups.map((g, k) => g.length ? { n: names[k], xy: P(tseeds[k]).map(v => +v.toFixed(2)) } : null).filter(Boolean); }
  out.carto.aw = aw;
  out.carto.gp = gp.map(p => P(p).map(v => +v.toFixed(3)));
  out.carto.fibre = edges.map(([i, j]) => path0({ type: "LineString", coordinates: [nodes[i], nodes[j]] })).join("");
  out.carto.hub = P(hub).map(v => +v.toFixed(3));
  // ---- a connected village road network (Gabriel graph on settlements + the block HQ), and fibre routed along it ----
  {
    const N = [hub, ...cen]; const del = Delaunay.from(N); const E = new Set();
    for (let t = 0; t < del.triangles.length; t += 3) { const tri = [del.triangles[t], del.triangles[t + 1], del.triangles[t + 2]];
      for (let k = 0; k < 3; k++) { const a = tri[k], b = tri[(k + 1) % 3]; E.add(a < b ? a + "_" + b : b + "_" + a); } }
    const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    const edges2 = [...E].map(k => k.split("_").map(Number)).filter(([a, b]) => {
      const m = [(N[a][0] + N[b][0]) / 2, (N[a][1] + N[b][1]) / 2], r2 = d2(N[a], N[b]) / 4;
      if (d2(N[a], N[b]) > (0.075) ** 2) return false; // no long straight tracks across the district
      for (let i = 0; i < N.length; i++) if (i !== a && i !== b && d2(N[i], m) < r2) return false; // Gabriel rule
      const mid = turf.point(m); return turf.booleanPointInPolygon(mid, target); });
    // gentle, deterministic curve on each road so it reads as a track, not a ruler line
    const curve = (a, b) => { const p = N[a], q = N[b], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], L = Math.sqrt(d2(p, q)), nx = -(q[1] - p[1]) / L, ny = (q[0] - p[0]) / L;
      const h = (((a * 928371 + b * 12979) % 1000) / 1000 - .5) * L * .22; const c = [m[0] + nx * h, m[1] + ny * h];
      const pts = []; for (let t = 0; t <= 1.0001; t += .125) { const u = 1 - t; pts.push([u * u * p[0] + 2 * u * t * c[0] + t * t * q[0], u * u * p[1] + 2 * u * t * c[1] + t * t * q[1]]); } return pts; };
    // make sure every village is reachable: join disconnected pieces with their shortest Delaunay link
    { const par = N.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i])); edges2.forEach(([a, b]) => { par[f(a)] = f(b); });
      const cand = [...E].map(k => k.split("_").map(Number)).map(([a, b]) => [a, b, d2(N[a], N[b])]).sort((x, y) => x[2] - y[2]);
      let added = 0; cand.forEach(([a, b]) => { if (f(a) !== f(b)) { par[f(a)] = f(b); edges2.push([a, b]); added++; } });
      console.log("bridging links", added); }
    const roadPts = edges2.map(([a, b]) => ({ a, b, pts: curve(a, b) }));
    out.carto.roads = roadPts.map(r => pathHi0({ type: "LineString", coordinates: r.pts })).join("");
    // Dijkstra from the hub along roads to every GP village; fibre = union of those paths
    const adj = N.map(() => []); roadPts.forEach((r, i) => { const w = Math.sqrt(d2(N[r.a], N[r.b])); adj[r.a].push([r.b, w, i]); adj[r.b].push([r.a, w, i]); });
    const dist = N.map(() => Infinity), prev = N.map(() => null); dist[0] = 0; const done = new Set();
    while (done.size < N.length) { let u = -1, best = Infinity; dist.forEach((d, i) => { if (!done.has(i) && d < best) { best = d; u = i; } }); if (u < 0) break; done.add(u);
      adj[u].forEach(([v, w, ei]) => { if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = [u, ei]; } }); }
    const used = new Set(); gpIdx.forEach(gi => { let v = gi + 1; while (prev[v]) { used.add(prev[v][1]); v = prev[v][0]; } });
    out.carto.fibre = [...used].map(i => pathHi0({ type: "LineString", coordinates: roadPts[i].pts })).join("");
    out.carto.gp = gpIdx.filter(gi => Number.isFinite(dist[gi + 1])).map(gi => P(cen[gi]).map(v => +v.toFixed(3)));
    out.carto.vill_c = cen.map(p => P(p).map(v => +v.toFixed(3)));
    console.log("roads", roadPts.length, "fibre edges", used.size);
  }
  console.log("villages", vill.length, "tehsils", teh.length, "aw", aw.length, "gp", gp.length);
})();
// km scale: SVG units per km at the state centre
{ const a = P([CM, 21]), c = P([CM + 1 / (111.32 * Math.cos(21 * Math.PI / 180)), 21]); out.kmPx = +Math.hypot(c[0] - a[0], c[1] - a[1]).toFixed(4); }
// inverse helper data: a coarse lon/lat lattice in SVG space so the page can invert pointer -> lon/lat by bilinear lookup
out.lattice = { lon0: 79.8, lat0: 17.4, step: .2, nx: 27, ny: 37, xy: [] };
for (let j = 0; j < 37; j++) for (let i = 0; i < 27; i++) out.lattice.xy.push(P([79.8 + i * .2, 17.4 + j * .2]).map(v => +v.toFixed(2)));

// ================= v4: intake inset (plate carrée fitted to the state, so the page can invert pointer -> lon/lat linearly)
{ const IB = [79.9, 17.4, 84.8, 24.5], IW = 300, IH = 380;
  const sx = IW / (IB[2] - IB[0]) * Math.cos(21 * Math.PI / 180), sy = IH / (IB[3] - IB[1]); const k = Math.min(sx / Math.cos(21 * Math.PI / 180), sy);
  const kx = k * Math.cos(21 * Math.PI / 180), ky = k; const ox = (IW - (IB[2] - IB[0]) * kx) / 2, oy = (IH - (IB[3] - IB[1]) * ky) / 2;
  const f = ([lo, la]) => [ox + (lo - IB[0]) * kx, oy + (IB[3] - la) * ky];
  const pp = g => { const rings = g.type === "Polygon" ? [g.coordinates] : g.coordinates; return rings.map(poly => poly.map(r => "M" + r.map(p => f(p).map(v => v.toFixed(1)).join(",")).join("L") + "Z").join("")).join(""); };
  out.inset = { W: IW, H: IH, lon0: IB[0], lat1: IB[3], kx: +kx.toFixed(4), ky: +ky.toFixed(4), ox: +ox.toFixed(2), oy: +oy.toFixed(2), state: pp(stFeat.geometry), districts: districts.features.map(d => pp(d.geometry)).join("") };
}

fs.writeFileSync("data.js", "window.GT=" + JSON.stringify(out) + ";");
console.log(JSON.stringify(facts, null, 1));
console.log("cells", cells.length, "bytes", fs.statSync("data.js").size, "precR", out.precR);
