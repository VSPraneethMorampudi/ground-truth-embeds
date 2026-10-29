// Precompute geodata for the vector video
import fs from 'fs';
import * as d3 from 'd3-geo';
import { Delaunay } from 'd3-delaunay';
import * as topo from 'topojson-client';

const R = p => JSON.parse(fs.readFileSync(p));
const src = '../source/';
const districts = R(src + 'districts.json');
const stateGC = R(src + 'state.json');
const state = { type: 'Feature', geometry: stateGC.geometries ? stateGC.geometries[0] : stateGC, properties: {} };
const admin1 = R(src + 'cg_admin1.json');
const roads = R(src + 'cg_ne_10m_roads.json');
const rail = R(src + 'cg_ne_10m_railroads.json');
const rivers = R(src + 'cg_ne_10m_rivers_lake_centerlines.json');
const places = R(src + 'cg_places.json');

const world50 = R('./node_modules/world-atlas/countries-50m.json');
const countries = topo.feature(world50, world50.objects.countries);
const india = countries.features.find(f => f.properties.name === 'India');
const land110 = R('./node_modules/world-atlas/land-110m.json');
const land = topo.feature(land110, land110.objects.land);

// fix winding for d3-geo (exterior rings must be clockwise on the sphere)
function rewindGeom(g){
  if(!g) return g;
  if(g.type==='Polygon'){ const f={type:'Feature',geometry:g}; if(d3.geoArea(f)>2*Math.PI) g.coordinates=g.coordinates.map(r=>r.slice().reverse()); }
  else if(g.type==='MultiPolygon'){ g.coordinates=g.coordinates.map(poly=>{ const f={type:'Feature',geometry:{type:'Polygon',coordinates:poly}}; return d3.geoArea(f)>2*Math.PI?poly.map(r=>r.slice().reverse()):poly; }); }
  else if(g.type==='GeometryCollection') g.geometries.forEach(rewindGeom);
  return g;
}
for (const f of districts.features) rewindGeom(f.geometry);
rewindGeom(state.geometry);
for (const f of admin1.features) rewindGeom(f.geometry);
rewindGeom(india.geometry);
console.log('areas', d3.geoArea(state).toFixed(5), d3.geoArea(india).toFixed(4));
// seeded rng
let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// 1. land dot matrix (equal-area-ish spacing)
const dots = [];
for (let lat = -58; lat <= 78; lat += 1.6) {
  const step = 1.6 / Math.max(0.25, Math.cos(lat * Math.PI / 180));
  for (let lon = -180; lon < 180; lon += step) {
    if (d3.geoContains(land, [lon, lat])) dots.push([+lon.toFixed(2), +lat.toFixed(2)]);
  }
}
// 2. village points inside the state (15,000), with district index
const bb = d3.geoBounds(state);
const villages = [];
const dIdx = districts.features;
while (villages.length < 15000) {
  const lon = bb[0][0] + rnd() * (bb[1][0] - bb[0][0]), lat = bb[0][1] + rnd() * (bb[1][1] - bb[0][1]);
  if (!d3.geoContains(state, [lon, lat])) continue;
  villages.push([+lon.toFixed(4), +lat.toFixed(4)]);
}
// sort villages by distance from Raipur so lighting can ripple outward
const RAI = [81.63, 21.24];
villages.sort((a, b) => d3.geoDistance(a, RAI) - d3.geoDistance(b, RAI));

// 3. khasra parcels: Voronoi inside a small window around a village near Raipur
const raipurD = dIdx.find(f => f.properties.district === 'Raipur');
const win = [81.50, 21.10, 81.78, 21.33];
const pts = [];
while (pts.length < 420) {
  const lon = win[0] + rnd() * (win[2] - win[0]), lat = win[1] + rnd() * (win[3] - win[1]);
  pts.push([lon, lat]);
}
// cluster a bit (village core denser)
for (let i = 0; i < 160; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 0.035; pts.push([81.64 + Math.cos(a) * r, 21.215 + Math.sin(a) * r]); }
const del = Delaunay.from(pts);
const vor = del.voronoi(win);
const parcels = [];
for (let i = 0; i < pts.length; i++) { const c = vor.cellPolygon(i); if (c) parcels.push(c.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)])); }

// 4. rural road network: MST over villages of one district (Mahasamund) + BFS order
const md = dIdx.find(f => f.properties.district === 'Bemetara');
const rv = villages.filter(v => d3.geoContains(md, v)).slice(0, 380);
const n = rv.length; const inT = new Array(n).fill(false), dist = new Array(n).fill(1e9), par = new Array(n).fill(-1);
dist[0] = 0; const edges = [];
for (let k = 0; k < n; k++) {
  let u = -1; for (let i = 0; i < n; i++) if (!inT[i] && (u < 0 || dist[i] < dist[u])) u = i;
  inT[u] = true; if (par[u] >= 0) edges.push([par[u], u]);
  for (let v = 0; v < n; v++) if (!inT[v]) { const dd = Math.hypot(rv[u][0] - rv[v][0], rv[u][1] - rv[v][1]); if (dd < dist[v]) { dist[v] = dd; par[v] = u; } }
}
// depth for each node (order of growth)
const depth = new Array(n).fill(0); for (const [a, b] of edges) depth[b] = depth[a] + 1;
const maxDepth = Math.max(...depth);
const rc=[rv.reduce((a,v)=>a+v[0],0)/rv.length, rv.reduce((a,v)=>a+v[1],0)/rv.length];
const rural = { center: rc, nodes: rv, edges: edges.map(([a, b]) => [a, b, depth[b] / maxDepth]) };

const out = { districts, state, admin1, roads, rail, rivers, places, india, land: null, dots, villages, parcels, rural, RAI };
fs.writeFileSync('data.js', 'window.GEO=' + JSON.stringify(out) + ';');
console.log('dots', dots.length, 'villages', villages.length, 'parcels', parcels.length, 'rural', rv.length, edges.length, 'MB', (fs.statSync('data.js').size / 1e6).toFixed(2));
