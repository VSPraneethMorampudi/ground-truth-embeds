import fs from 'fs';import {feature} from 'topojson-client';import {geoContains,geoBounds} from 'd3-geo';
const R=new URL('../../source/',import.meta.url).pathname,r3=v=>Math.round(v*1000)/1000,r2=v=>Math.round(v*100)/100;
const land110=feature(JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json')),JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json')).objects.land);
const t50=JSON.parse(fs.readFileSync('node_modules/world-atlas/land-50m.json')),land50=feature(t50,t50.objects.land);
const c50=JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json')),countries=feature(c50,c50.objects.countries);
/* India: the official boundary (Survey of India claim: all of J&K and Ladakh incl. PoK, Gilgit-Baltistan, Aksai Chin,
   Shaksgam), from DataMeet india-composite.geojson (CC0), simplified with mapshaper -simplify 1.5% keep-shapes; tiny islands (Lakshadweep) re-added from the source */
const indiaOff=JSON.parse(fs.readFileSync(new URL('./india-official.geojson',import.meta.url).pathname));
const indiaGeom=indiaOff.type==='FeatureCollection'?indiaOff.features[0].geometry:(indiaOff.geometries?indiaOff.geometries[0]:indiaOff);
const pipAny=(pt,polys)=>polys.some(rings=>{let ins=false;for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[xi,yi]=ring[i],[xj,yj]=ring[j];if(((yi>pt[1])!==(yj>pt[1]))&&pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)ins=!ins}return ins});
const indiaPolys=indiaGeom.type==='Polygon'?[indiaGeom.coordinates]:indiaGeom.coordinates;
// globe dots, roughly equal-area
const globe=[];for(let la=-58;la<=80;la+=1.6){const st=1.6/Math.max(.25,Math.cos(la*Math.PI/180));for(let lo=-180;lo<180;lo+=st){if(geoContains(land110,[lo,la]))globe.push(r2(lo),r2(la))}}
// India region dots (land 50m), finer
const ind=[];for(let la=5;la<=37.5;la+=.3)for(let lo=66;lo<=99;lo+=.3){if(geoContains(land50,[lo,la]))ind.push(r2(lo),r2(la),pipAny([lo,la],indiaPolys)?1:0)}
// Chhattisgarh dots
const st=JSON.parse(fs.readFileSync(R+'state.json')).geometries[0],stF={type:'Feature',geometry:st};
const dis=JSON.parse(fs.readFileSync(R+'districts.json'));
// planar point-in-polygon: the dissolved ring winds the GeoJSON way, which d3's spherical test reads inside-out
const pip=(pt,rings)=>{let ins=false;for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[xi,yi]=ring[i],[xj,yj]=ring[j];if(((yi>pt[1])!==(yj>pt[1]))&&pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)ins=!ins}return ins};
const cg=[];for(let la=17.7;la<=24.2;la+=.055)for(let lo=80.2;lo<=84.5;lo+=.055){if(pip([lo,la],st.coordinates))cg.push(r3(lo),r3(la))}
const ring=g=>(g.type==='Polygon'?[g.coordinates]:g.coordinates).map(p=>p[0].map(([x,y])=>[r3(x),r3(y)]));
const simp=(pts,k)=>pts.filter((_,i)=>i%k===0||i===pts.length-1);
// lines clipped to the state (runs of vertices inside it), for the game world
const clip=(f)=>{const g=JSON.parse(fs.readFileSync(R+f)).features,out=[];
  for(const ft of g){const ls=ft.geometry.type==='LineString'?[ft.geometry.coordinates]:ft.geometry.coordinates;
    for(const l of ls){let run=[];for(const p of l){if(pip(p,st.coordinates))run.push([r3(p[0]),r3(p[1])]);else{if(run.length>1)out.push({n:ft.properties.name||'',p:run});run=[]}}if(run.length>1)out.push({n:ft.properties.name||'',p:run})}}
  return out};
const towns=JSON.parse(fs.readFileSync(R+'cg_places.json')).features.filter(f=>f.properties.adm1name==='Chhattisgarh').map(f=>({n:f.properties.name,c:f.geometry.coordinates.map(r3)}));
const out={globe,ind,cg,rivers:clip('cg_ne_10m_rivers_lake_centerlines.json'),roads:clip('cg_ne_10m_roads.json'),rail:clip('cg_ne_10m_railroads.json'),towns,
  state:ring(st).map(p=>simp(p,1)),
  india:ring(indiaGeom).filter(p=>p.length>3).map(p=>simp(p,1)),
  districts:dis.features.map(f=>({n:f.properties.district,r:ring(f.geometry).map(p=>simp(p,2))})),
  neigh:JSON.parse(fs.readFileSync(R+'cg_admin1.json')).features.map(f=>({n:f.properties.name,r:ring(f.geometry).filter(p=>p.length>20).map(p=>simp(p,3))}))};
fs.writeFileSync(new URL('../geo.js',import.meta.url).pathname,'/* generated: world-atlas (Natural Earth, public domain) + official CG boundaries (source/) */\nwindow.GEO='+JSON.stringify(out)+';\n');
console.log(globe.length/2,ind.length/3,cg.length/2,out.districts.length);
