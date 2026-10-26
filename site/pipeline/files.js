/* What the departments actually send. A department is not one format: each sends several files of different kinds.
   Every preview is drawn from real Chhattisgarh geography (window.GEO: the official district boundaries, rivers,
   national highways and the rail network). Places are real towns, dams and stations at their real (approximate,
   town-level) coordinates; codes, counts and loads are samples. Used by the 3D cards and the file viewer. */
const T=(en,hi)=>({en,hi});
const GEO=()=>window.GEO||{districts:[],rivers:[],roads:[],rail:[]};
const D2R=Math.PI/180;

/* one colour per format, so the same format looks the same whichever department sends it */
export const FMTS={
  shp:{n:"Shapefile",c:"#7a5c2e"},kml:{n:"KML",c:"#1d6fd6"},dwg:{n:"CAD drawing",c:"#d2733c"},xlsx:{n:"Excel",c:"#107c41"},
  csv:{n:"CSV",c:"#b4462f"},gpx:{n:"GPS track",c:"#0b7a70"},pdf:{n:"PDF",c:"#c0392b"},reg:{n:"Paper register",c:"#c98a12"},
  tif:{n:"Satellite raster",c:"#5b7f2a"},scan:{n:"Scanned map",c:"#6b5b3e"}
};

/* ---------- real geometry helpers ---------- */
/* UTM zone 44N (EPSG:32644) from WGS 84: what a CAD drawing in metres really contains */
export function utm(lon,lat,zone=44){const a=6378137,f=1/298.257223563,k0=.9996,e2=f*(2-f),ep2=e2/(1-e2),lo0=(zone-1)*6-177,p=lat*D2R,l=(lon-lo0)*D2R;
  const N=a/Math.sqrt(1-e2*Math.sin(p)**2),Tt=Math.tan(p)**2,C=ep2*Math.cos(p)**2,A=Math.cos(p)*l;
  const M=a*((1-e2/4-3*e2*e2/64-5*e2**3/256)*p-(3*e2/8+3*e2*e2/32+45*e2**3/1024)*Math.sin(2*p)+(15*e2*e2/256+45*e2**3/1024)*Math.sin(4*p)-(35*e2**3/3072)*Math.sin(6*p));
  return[k0*N*(A+(1-Tt+C)*A**3/6+(5-18*Tt+Tt*Tt+72*C-58*ep2)*A**5/120)+500000,k0*(M+N*Math.tan(p)*(A*A/2+(5-Tt+9*C+4*C*C)*A**4/24+(61-58*Tt+Tt*Tt+600*C-330*ep2)*A**6/720))]}
const dist=n=>GEO().districts.find(d=>d.n===n);
const bboxOf=pts=>pts.reduce((b,[x,y])=>[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)],[1e9,1e9,-1e9,-1e9]);
const pad=(b,k)=>{const dx=(b[2]-b[0])*k,dy=(b[3]-b[1])*k;return[b[0]-dx,b[1]-dy,b[2]+dx,b[3]+dy]};
const CG=[80.2,17.75,84.45,24.15];
/* area (km²) and centroid of a district from its boundary */
function measure(d){let A=0,cx=0,cy=0;d.r.forEach(r=>{const la0=r[0][1],kx=111.32*Math.cos(la0*D2R),ky=110.57;
  for(let i=0,j=r.length-1;i<r.length;j=i++){const x1=r[j][0]*kx,y1=r[j][1]*ky,x2=r[i][0]*kx,y2=r[i][1]*ky,c=x1*y2-x2*y1;A+=c;cx+=(x1+x2)*c;cy+=(y1+y2)*c}
  });const k0=111.32*Math.cos(d.r[0][0][1]*D2R);return{area:Math.abs(A/2),lon:cx/(3*A)/k0,lat:cy/(3*A)/110.57}}
const mahanadi=()=>GEO().rivers.filter(r=>/^Mah/.test(r.n));
const NH30=()=>GEO().roads[13]||{p:[]},NH130=()=>GEO().roads[9]||{p:[]};

/* real places (town-level coordinates, approximate) */
const SCHOOLS=[["School","UDISE (sample)","Lat","Long"],["GHSS Dhamtari","22100101304","20.7074","81.5490"],["GHSS Mahasamund","22120203105","21.1074","82.0946"],
  ["GHS Tilda","22270433","81.7864","21.5537"],["GPS Kurud","","20.8306","81.7199"],["GHSS Kondagaon","22190102207","19.5910","81.6640"]];
const DAMS=[["Dam","District","Lat","Long"],["Gangrel","Dhamtari","20.6170","81.5640"],["Hasdeo Bango","Korba","22.6110","82.5990"],["Tandula","Balod","20.6530","81.2530"],["Dudhawa","Kanker","20.3000","81.7810"],["Murumsilli","Dhamtari","20.5450","81.6880"]];
const HEALTH=[["id","facility","type","lat","lon"],["CHC-DMT-004","Kurud","CHC","20.8306","81.7199"],["CHC-MSD-011","Saraipali","CHC","21.3290","83.0010"],["CHC-JSP-007","Pathalgaon","CHC","22.5560","83.4600"],["CHC-GPM-002","Pendra","CHC","22.7700","81.9600"],["CHC-KDG-003","Kondagaon","CHC","19.5910","81.6640"]];
const STATIONS=[["Raipur Jn","R",81.6337,21.2588],["Durg Jn","DURG",81.2840,21.1880],["Bilaspur Jn","BSP",82.1520,22.0760],["Bhatapara","BYT",81.9450,21.7360],["Champa Jn","CPH",82.6530,22.0390],["Raigarh","RIG",83.3940,21.8970],["Jagdalpur","JDB",82.0250,19.0750]];

/* table rows → aligned plain text, for the raw view */
const grid=rows=>{const w=rows[0].map((_,j)=>Math.max(...rows.map(r=>String(r[j]??"").length)));return rows.map(r=>r.map((v,j)=>String(v??"").padEnd(w[j])).join("  ").trimEnd()).join("\n")};

export const FILES=[
  /* ---- Revenue ---- */
  {d:0,f:"shp",name:"cg_district_boundary",ext:".shp .shx .dbf .prj",kind:"polygon",view:"shp",geo:"districts",xy:true,
   what:T("All 33 district boundaries, with area","सभी 33 ज़िला सीमाएँ, क्षेत्रफल सहित"),
   todo:T("Check topology, keep the official boundary","टोपोलॉजी जाँचें, आधिकारिक सीमा रखें")},
  {d:0,f:"scan",name:"Raipur_district_revenue_map_scan",ext:".tif (scan)",kind:"polygon",view:"scanmap",xy:false,
   what:T("Old district revenue map, scanned from paper","पुराना ज़िला राजस्व नक्शा, कागज़ से स्कैन"),
   todo:T("Georeference with control points, then digitise","नियंत्रण बिंदुओं से भू-संदर्भित, फिर डिजिटाइज़")},
  {d:0,f:"xlsx",name:"khasra_register_Abhanpur",ext:".xlsx",kind:"polygon",view:"xlsx",locator:"Raipur",xy:false,
   what:T("Land records by khasra number, no map","खसरा नंबर से भू-अभिलेख, नक्शा नहीं"),
   rows:[["Village","Khasra","Area ha","Owner"],["Mana","112","0.84","Private"],["Mana","113","1.20","Govt."],["Mana","114/1","0.36","Private"],["Temri","27","2.05","Forest"]],
   todo:T("Join to the digitised plots by khasra number","खसरा नंबर से डिजिटाइज़ प्लॉट से जोड़ें")},
  /* ---- Water Resources ---- */
  {d:1,f:"kml",name:"mahanadi_main_stem",ext:".kml",kind:"line",view:"code",geo:"mahanadi",xy:true,
   what:T("The Mahanadi, traced in Google Earth","महानदी, Google Earth में ट्रेस की गई"),
   todo:T("Snap to the river network, add river codes","नदी नेटवर्क से जोड़ें, नदी कोड जोड़ें")},
  {d:1,f:"xlsx",name:"major_dams_register",ext:".xlsx",kind:"point",view:"xlsx",ll:[2,3],xy:true,rows:DAMS,
   what:T("Major dams with lat / long","अक्षांश/देशांतर सहित प्रमुख बाँध"),
   todo:T("Turn rows into points, check each is on water","पंक्तियों को बिंदु बनाएँ, पानी पर है जाँचें")},
  /* ---- Public Works ---- */
  {d:2,f:"dwg",name:"PWD_NH30_Raipur-Jagdalpur",ext:".dwg",kind:"line",view:"dwg",xy:true,
   what:T("NH-30 alignment, drawn in metres (UTM 44N)","NH-30 संरेखण, मीटर में (UTM 44N)"),
   todo:T("Reproject UTM 44N → WGS 84, keep the centre line","UTM 44N → WGS 84 पुनःप्रक्षेपण, मध्य रेखा रखें")},
  {d:2,f:"gpx",name:"NH130_Raipur-Bilaspur_survey",ext:".gpx",kind:"line",view:"code",geo:"nh130",xy:true,
   what:T("Raipur–Bilaspur highway driven with a GPS phone","GPS फ़ोन से दर्ज रायपुर–बिलासपुर राजमार्ग"),
   todo:T("Remove GPS jitter, simplify to a clean line","GPS झटके हटाएँ, साफ़ रेखा बनाएँ")},
  /* ---- School Education ---- */
  {d:3,f:"xlsx",name:"UDISE_schools_sample",ext:".xlsx",kind:"point",view:"xlsx",ll:[2,3],xy:true,reject:true,warn:[3,4],rows:SCHOOLS,
   what:T("Schools with UDISE codes and lat / long","UDISE कोड व अक्षांश/देशांतर सहित स्कूल"),
   todo:T("Fix swapped lat / long; send blank codes back","उलटे अक्षांश/देशांतर सुधारें; खाली कोड वापस भेजें")},
  {d:3,f:"pdf",name:"new_schools_sanctioned_2025",ext:".pdf",kind:"point",view:"pdf",xy:false,
   what:T("Sanction order: school names and villages only","स्वीकृति आदेश: केवल स्कूल और गाँव के नाम"),
   rows:[["S.No","School","Village","Block"],["1","GPS Bhatagaon","Bhatagaon","Dharsiwa"],["2","GPS Sondra","Sondra","Arang"],["3","GMS Parsada","Parsada","Abhanpur"]],
   todo:T("Extract the table, place each school by village","तालिका निकालें, गाँव से स्कूल का स्थान तय करें")},
  /* ---- Health ---- */
  {d:4,f:"csv",name:"chc_locations_gps",ext:".csv",kind:"point",view:"csv",ll:[3,4],xy:true,rows:HEALTH,
   what:T("Community health centres, surveyed with GPS","सामुदायिक स्वास्थ्य केंद्र, GPS से सर्वे"),
   todo:T("Read as points, match ids to the facility list","बिंदु बनाएँ, आईडी को सूची से मिलाएँ")},
  {d:4,f:"xlsx",name:"CHC_beds_staff",ext:".xlsx",kind:"point",view:"xlsx",locator:"all",xy:false,
   what:T("Beds and doctors per centre, no location","हर केंद्र के बेड और डॉक्टर, स्थान नहीं"),
   rows:[["Facility","Type","Beds","Doctors"],["Kurud","CHC","30","6"],["Saraipali","CHC","30","5"],["Pathalgaon","CHC","30","4"],["Pendra","CHC","30","5"]],
   todo:T("Join to the GPS points by facility name","सुविधा के नाम से GPS बिंदुओं से जोड़ें")},
  /* ---- Women & Child Development ---- */
  {d:5,f:"reg",name:"Anganwadi_register_Abhanpur",ext:"paper → scan",kind:"point",view:"register",xy:false,
   what:T("Anganwadi centres, written by hand","आंगनवाड़ी केंद्र, हाथ से लिखे"),
   rows:["1  AWC-RPR-00412  माना","2  AWC-RPR-00413  टेमरी","3  AWC-RPR-00418  अभनपुर","4  AWC-RPR-00421  नवागाँव","5  AWC-RPR-00430  कुरुद"],
   raw:`क्र.  आंगनवाड़ी केंद्र     ग्राम       विकासखंड\n 1   AWC-RPR-00412     माना        अभनपुर\n 2   AWC-RPR-00413     टेमरी        अभनपुर\n 3   AWC-RPR-00418     अभनपुर      अभनपुर\n\n(no latitude / longitude)`,
   todo:T("Type it in, then place each centre by village","टाइप करें, फिर गाँव से हर केंद्र का स्थान तय करें")},
  {d:5,f:"xlsx",name:"AWC_beneficiaries_Q3",ext:".xlsx",kind:"point",view:"xlsx",locator:"Raipur",xy:false,
   what:T("Children and mothers enrolled, by centre","केंद्रवार नामांकित बच्चे और माताएँ"),
   rows:[["AWC code","Village","Children","Mothers"],["AWC-RPR-00412","Mana","46","12"],["AWC-RPR-00413","Temri","38","9"],["AWC-RPR-00418","Abhanpur","52","15"]],
   todo:T("Link to centre points by AWC code","AWC कोड से केंद्र बिंदुओं से जोड़ें")},
  /* ---- Forest ---- */
  {d:6,f:"tif",name:"forest_cover_2025",ext:".tif",kind:"raster",view:"tif",xy:true,
   what:T("Forest cover classified from satellite images","उपग्रह चित्रों से वर्गीकृत वन आवरण"),
   raw:`GeoTIFF  ·  1 class band  ·  10 m pixels\nCRS      EPSG:32644 (UTM 44N)\nValues   1 dense  2 open  3 scrub  0 non-forest\nExtent   80.25°E – 84.40°E, 17.78°N – 24.10°N\nCovers   all 33 districts\n(classes in this preview are illustrative)`,
   todo:T("Reproject, tile and publish as an image layer","पुनःप्रक्षेपण, टाइल, इमेज परत के रूप में प्रकाशित")},
  {d:6,f:"shp",name:"forest_compartments_Bastar",ext:".shp .shx .dbf .prj",kind:"polygon",view:"shp",geo:"bastar",xy:true,
   what:T("Forest compartments inside Bastar district","बस्तर ज़िले के भीतर वन कक्ष"),
   rows:[["comp_no","range","area_ha"],["RF-412","Jagdalpur","388.2"],["RF-413","Jagdalpur","402.7"],["PF-118","Tokapal","215.0"],["RF-509","Bakawand","611.4"]],
   todo:T("Reproject, rename fields to the state schema","पुनःप्रक्षेपण, फ़ील्ड नाम राज्य स्कीमा के अनुसार")},
  /* ---- Railways ---- */
  {d:7,f:"scan",name:"toposheet_Raipur-Durg_scan",ext:".jpg (scan)",kind:"line",view:"topo",xy:false,
   what:T("Rail lines on an old 1:50 000 toposheet","पुरानी 1:50 000 टोपोशीट पर रेल लाइनें"),
   todo:T("Georeference with control points, trace the track","नियंत्रण बिंदुओं से भू-संदर्भित, ट्रैक ट्रेस करें")},
  {d:7,f:"kml",name:"SECR_stations_CG",ext:".kml",kind:"point",view:"code",geo:"stations",xy:true,
   what:T("Junctions and stations as placemarks","जंक्शन और स्टेशन, प्लेसमार्क के रूप में"),
   todo:T("Read as points, attach station codes","बिंदु बनाएँ, स्टेशन कोड जोड़ें")}
];

/* contents that come straight from the real geometry */
function fill(F){const G=GEO();if(!G.districts.length)return;
  if(F.geo==="districts"){const m=G.districts.map(d=>({n:d.n,...measure(d)})).sort((a,b)=>b.area-a.area);
    F.rows=[["dist_name","area_km2","cen_lat","cen_lon"],...m.slice(0,4).map(d=>[d.n,Math.round(d.area).toLocaleString("en-IN"),d.lat.toFixed(3),d.lon.toFixed(3)])];
    F.raw=`cg_district_boundary.shp   33 polygons\ncg_district_boundary.dbf   attributes\ncg_district_boundary.prj   GEOGCS["GCS_WGS_1984"]\n\nDBF (largest first, area from the geometry)\n`+grid([["dist_name","area_km2","cen_lat","cen_lon"],...m.slice(0,10).map(d=>[d.n,Math.round(d.area),d.lat.toFixed(3),d.lon.toFixed(3)])])+`\n… 33 records`}
  else if(F.geo==="bastar"){F.raw=`forest_compartments_Bastar.shp\nforest_compartments_Bastar.prj   PROJCS["WGS_1984_UTM_Zone_44N"]\nInside: Bastar district (official boundary)\n\nDBF (sample)\n`+grid(F.rows)}
  else if(F.geo==="mahanadi"){const p=mahanadi().flatMap(r=>r.p);F.lines=["<Placemark>","  <name>Mahanadi</name>","  <LineString><coordinates>",...p.slice(0,6).map(q=>`    ${q[0].toFixed(3)},${q[1].toFixed(3)},0`),`    … ${p.length} vertices`,"  </coordinates></LineString>","</Placemark>"]}
  else if(F.geo==="nh130"){const p=NH130().p;F.lines=['<trk><name>NH-130 Raipur–Bilaspur</name><trkseg>',...p.slice(0,6).map((q,i)=>`  <trkpt lat="${q[1].toFixed(4)}" lon="${q[0].toFixed(4)}"><time>2025-11-02T09:${String(14+i*3).padStart(2,"0")}:05Z</time></trkpt>`),`  … ${p.length} points`,'</trkseg></trk>']}
  else if(F.geo==="stations"){F.lines=STATIONS.slice(0,5).flatMap(([n,c,lo,la])=>[`<Placemark><name>${n} (${c})</name>`,`  <Point><coordinates>${lo},${la},0</coordinates></Point></Placemark>`])}
  if(F.view==="dwg"){const p=NH30().p.map(q=>utm(q[0],q[1]));F.utm=p;F.raw=`Units     metres\nCRS       UTM zone 44N (EPSG:32644)\nLayers    ROAD_CL  ROAD_EDGE  KM_POST\nLength    ${Math.round(p.reduce((a,q,i)=>i?a+Math.hypot(q[0]-p[i-1][0],q[1]-p[i-1][1]):0,0)/1000)} km (Raipur → Jagdalpur)\n\nPOLYLINE ROAD_CL  ${p.length} vertices\n`+p.slice(0,4).map(q=>`  (${q[0].toFixed(1)}, ${q[1].toFixed(1)})`).join("\n")+"\n  …"}
  if(F.view==="scanmap"){const b=bboxOf(dist("Raipur").r.flat());F.raw=`Scan      400 dpi, greyscale, no coordinates\nSheet     Raipur district, revenue map\n\nGround control points picked by CHiPS:\n`+[[b[0],b[3]],[b[2],b[3]],[b[2],b[1]],[b[0],b[1]]].map((q,i)=>`  GCP${i+1}  ${q[0].toFixed(3)}°E  ${q[1].toFixed(3)}°N`).join("\n")}
  if(F.view==="topo")F.raw=`Survey of India style toposheet, 1:50 000 (scan, 600 dpi)\nArea      Raipur – Bhilai – Durg\nNo coordinates in the file: pin it to the earth with\n4+ ground control points at the graticule corners\n  GCP1  81°15′E 21°30′N    GCP2  81°45′E 21°30′N\n  GCP3  81°45′E 21°00′N    GCP4  81°15′E 21°00′N`;
  if(F.lines)F.raw=F.lines.join("\n");else if(F.view==="csv")F.raw=F.rows.map(r=>r.join(",")).join("\n");else if(F.rows&&F.view!=="register"&&!F.raw)F.raw=grid(F.rows)}
FILES.forEach((x,i)=>{x.i=i;x.raw=x.raw||"";fill(x)});

/* ---------- drawing a file's contents on a 2D canvas (512 × 660 logical) ---------- */
const MONO='"Geist Mono",ui-monospace,monospace',SANS='"Bricolage Grotesque",system-ui,sans-serif',HI='"Anek Devanagari",sans-serif';
function rr(x,X,Y,W,H,r){x.beginPath();x.roundRect(X,Y,W,H,r)}
function projector(b,X,Y,W,H){const cx=Math.cos((b[1]+b[3])/2*D2R),sx=(b[2]-b[0])*cx,sy=b[3]-b[1],s=Math.min(W/sx,H/sy),ox=X+(W-sx*s)/2,oy=Y+(H-sy*s)/2;return(lo,la)=>[ox+(lo-b[0])*cx*s,oy+(b[3]-la)*s]}
function trace(x,pr,pts,close){pts.forEach((p,i)=>{const q=pr(p[0],p[1]);i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])});if(close)x.closePath()}
function shapes(x,pr,list,fill,stroke,lw){list.forEach(d=>{x.beginPath();d.r.forEach(r=>trace(x,pr,r,true));if(fill){x.fillStyle=typeof fill==="function"?fill(d):fill;x.fill()}if(stroke){x.strokeStyle=stroke;x.lineWidth=lw;x.stroke()}})}
function polys(x,pr,list,c,w,dash){x.strokeStyle=c;x.lineWidth=w;x.setLineDash(dash||[]);list.forEach(l=>{x.beginPath();trace(x,pr,l.p);x.stroke()});x.setLineDash([])}
function dot(x,q,c,r=6){x.fillStyle=c;x.beginPath();x.arc(q[0],q[1],r,0,7);x.fill();x.strokeStyle="#fff";x.lineWidth=2;x.stroke()}
/* a light basemap of the state: districts, rivers, highways, rail */
function cgBase(x,pr,{roads=true,rail=true,rivers=true,fill="#f4f7fb",line="#c3cede"}={}){const G=GEO();shapes(x,pr,G.districts,fill,line,1);
  if(rivers)polys(x,pr,G.rivers,"#8ec1ea",1.6);if(roads)polys(x,pr,G.roads,"#e7a57c",1.4);if(rail)polys(x,pr,G.rail,"#7b7f88",1.1,[4,3])}
function table(x,rows,B,cw,head,warn=[],rh=62){rows.forEach((r,i)=>{let X=28;r.forEach((v,j)=>{x.fillStyle=i===0?head+"22":(warn.includes(i)?"#fde8e4":i%2?"#fafafa":"#fff");x.fillRect(X,B+i*rh,cw[j],rh-2);x.strokeStyle="#e2e2e2";x.strokeRect(X,B+i*rh,cw[j],rh-2);
  x.fillStyle=i===0?head:"#333";x.font=`${i===0?700:500} 17px ${MONO}`;x.fillText(String(v).slice(0,Math.floor((cw[j]-10)/10.4)),X+7,B+rh/2+6+i*rh);X+=cw[j]})})}
/* points from table rows; a row whose lat is outside the state is shown as an error, off the map */
function plotRows(x,pr,F,c,y){const[a,b]=F.ll;F.rows.slice(1).forEach((r,i)=>{const la=+r[a],lo=+r[b];if(!la||!lo)return;const bad=la<17||la>24.5||lo<80||lo>84.6;
  if(bad){x.fillStyle="#d2423a";x.font=`700 15px ${SANS}`;x.fillText(`⚠ ${r[0]}: ${la}, ${lo} is outside CG`,32,y)}else dot(x,pr(lo,la),c,6)})}
/* draw(file, dept) → (ctx, W, H). `head` adds the coloured format band and department tag (3D card); the viewer draws without it */
export function drawFile(F,dep,{head=true}={}){return (x,W0,H0)=>{const sc=W0/512;x.save();x.scale(sc,sc);const W=512,H=660,fm=FMTS[F.f],c=fm.c,G=GEO();
  x.fillStyle="#fff";rr(x,0,0,W,H,28);x.fill();
  let B=24;
  if(head){x.fillStyle=c;rr(x,0,0,W,96,[28,28,0,0]);x.fill();x.fillStyle="#fff";x.font=`700 40px ${SANS}`;x.fillText(fm.n,28,58);x.font=`500 22px ${MONO}`;x.globalAlpha=.85;x.fillText(F.ext,28,86);x.globalAlpha=1;B=118;
    x.fillStyle=dep.col;rr(x,0,H-58,W,58,[0,0,28,28]);x.fill();x.fillStyle="#fff";x.font=`700 24px ${SANS}`;x.fillText(dep.short.en.toUpperCase(),28,H-21);
    x.font=`600 24px ${HI}`;x.textAlign="right";x.fillText(dep.short.hi,W-28,H-21);x.textAlign="left"}
  const bot=head?H-70:H-20,X0=16,MW=W-32;x.beginPath();x.rect(X0,B,MW,bot-B);x.clip();
  const v=F.view;
  if(v==="shp"){const isB=F.geo==="bastar",mh=(bot-B)*.56;
    if(isB){const d=dist("Bastar"),b=pad(bboxOf(d.r.flat()),.04),pr=projector(b,X0+6,B+6,MW-12,mh-12);x.fillStyle="#eef3e8";x.fillRect(X0,B,MW,mh);
      x.save();x.beginPath();d.r.forEach(r=>trace(x,pr,r,true));x.clip();x.fillStyle="#d9ead0";x.fillRect(X0,B,MW,mh);
      const g=24;let k=0;for(let gx=X0;gx<X0+MW;gx+=g)for(let gy=B;gy<B+mh;gy+=g){x.fillStyle=["#b9d7a8","#cfe3c0","#a6cc93","#c4ddb2"][(k++*7)%4];x.fillRect(gx,gy,g-1,g-1)}
      polys(x,pr,G.rivers,"#5aa3e0",2);polys(x,pr,G.roads,"#d2733c",1.6);x.restore();shapes(x,pr,[d],null,c,3);
      x.fillStyle="#2d4a22";x.font=`700 16px ${SANS}`;const q=pr(81.95,19.25);x.fillText("Bastar",q[0]-26,q[1])}
    else{const pr=projector(pad(CG,.01),X0+4,B+4,MW-8,mh-8);const big=F.rows.slice(1).map(r=>r[0]);
      shapes(x,pr,G.districts,d=>big.includes(d.n)?c+"55":"#efe7da","#8a7350",1.2);polys(x,pr,G.rivers,"#7fb3e0",1.4);
      x.font=`700 13px ${SANS}`;x.fillStyle="#3d2f1a";G.districts.filter(d=>big.includes(d.n)).forEach(d=>{const m=measure(d),q=pr(m.lon,m.lat);x.fillText(d.n,q[0]-x.measureText(d.n).width/2,q[1]+4)})}
    x.fillStyle=c;x.font=`600 15px ${MONO}`;x.fillText(isB?"compartments.dbf":"DBF · 33 records",28,B+mh+26);table(x,F.rows,B+mh+38,[160,130,90,90],c,[],Math.min(46,(bot-B-mh-44)/F.rows.length))}
  else if(v==="code"||v==="csv"){const L=v==="csv"?F.rows.map(r=>r.join(",")):F.lines,lh=v==="csv"?32:30,th=Math.min(L.length,9)*lh+18;x.fillStyle="#f7f9fc";x.fillRect(X0,B,MW,th);
    x.font=`500 ${v==="csv"?15:16}px ${MONO}`;L.slice(0,9).forEach((l,i)=>{const y=B+28+i*lh;if(v==="csv"){let X=24;l.split(",").forEach((p,k,a)=>{x.fillStyle=i===0?c:"#333";x.fillText(p,X,y);X+=x.measureText(p).width;if(k<a.length-1){x.fillStyle=c;x.fillText(",",X,y);X+=x.measureText(",").width}})}
      else{x.fillStyle=/^\s*</.test(l)?c:"#333";x.fillText(l.length>44?l.slice(0,43)+"…":l,24,y)}});
    const my=B+th+8,pr=projector(pad(CG,.01),X0,my,MW,bot-my);cgBase(x,pr,{roads:F.geo!=="nh130",rail:F.geo==="stations"});
    if(F.geo==="mahanadi")polys(x,pr,mahanadi(),c,4.5);
    else if(F.geo==="nh130"){polys(x,pr,[NH130()],c,5);NH130().p.forEach((q,i)=>{if(i%3===0)dot(x,pr(q[0],q[1]),c,3.5)})}
    else if(F.geo==="stations"){polys(x,pr,G.rail,"#3a383d",2);STATIONS.forEach(([n,cd,lo,la])=>{const q=pr(lo,la);dot(x,q,c,6);x.fillStyle="#1d2633";x.font=`700 12px ${SANS}`;x.fillText(cd,q[0]+8,q[1]+4)})}
    else if(v==="csv")plotRows(x,pr,F,c,bot-12)}
  else if(v==="dwg"){x.fillStyle="#13233d";x.fillRect(X0,B,MW,bot-B);const P=F.utm||[];if(P.length){const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),b=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
      const s=Math.min((MW-90)/(b[2]-b[0]),(bot-B-90)/(b[3]-b[1])),ox=X0+60+(MW-90-(b[2]-b[0])*s)/2,oy=B+30,pr=(e,n)=>[ox+(e-b[0])*s,oy+(b[3]-n)*s];
      x.font=`500 12px ${MONO}`;x.strokeStyle="#5fb3ff2a";x.lineWidth=1;const st=50000;
      for(let e=Math.ceil(b[0]/st)*st;e<=b[2];e+=st){const q=pr(e,b[1]);x.beginPath();x.moveTo(q[0],B);x.lineTo(q[0],bot);x.stroke();x.fillStyle="#7fb6e8";x.fillText(`E ${e/1000}k`,q[0]+3,bot-8)}
      for(let n=Math.ceil(b[1]/st)*st;n<=b[3];n+=st){const q=pr(b[0],n);x.beginPath();x.moveTo(X0,q[1]);x.lineTo(W,q[1]);x.stroke();x.fillStyle="#7fb6e8";x.fillText(`N ${n/1000}k`,X0+4,q[1]-3)}
      [-1,1].forEach(o=>{x.strokeStyle="#9fd3ff";x.lineWidth=1.2;x.setLineDash([8,6]);x.beginPath();P.forEach((p,i)=>{const q=pr(p[0],p[1]);i?x.lineTo(q[0]+o*5,q[1]):x.moveTo(q[0]+o*5,q[1])});x.stroke()});x.setLineDash([]);
      x.strokeStyle="#ffd36b";x.lineWidth=3.5;x.beginPath();P.forEach((p,i)=>{const q=pr(p[0],p[1]);i?x.lineTo(...q):x.moveTo(...q)});x.stroke();
      [[0,"RAIPUR"],[P.length-1,"JAGDALPUR"]].forEach(([i,t])=>{const q=pr(P[i][0],P[i][1]);x.fillStyle="#ff8a6b";x.fillRect(q[0]-4,q[1]-4,8,8);x.font=`700 13px ${MONO}`;x.fillText(t,q[0]+9,q[1]+4)})}
    x.fillStyle="#9fd3ff";x.font=`500 15px ${MONO}`;x.fillText("ROAD_CL  NH-30  ·  UTM 44N  ·  metres",28,B+20)}
  else if(v==="xlsx"){x.fillStyle="#e9f3ec";x.fillRect(X0,B,MW,30);x.fillStyle="#107c41";x.font=`700 16px ${SANS}`;x.fillText("Sheet1",28,B+21);x.fillStyle="#555";x.font=`500 16px ${MONO}`;x.fillText("fx",110,B+21);
    const cw=[150,128,84,82],rh=44;let X=56;["A","B","C","D"].forEach((L,j)=>{x.fillStyle="#f1f1f1";x.fillRect(X,B+34,cw[j],24);x.fillStyle="#666";x.fillText(L,X+cw[j]/2-5,B+52);X+=cw[j]});
    F.rows.forEach((r,i)=>{x.fillStyle="#f1f1f1";x.fillRect(X0,B+60+i*rh,40,rh-2);x.fillStyle="#666";x.font=`500 16px ${MONO}`;x.fillText(i+1,28,B+60+i*rh+28)});
    x.save();x.translate(28,0);table(x,F.rows,B+60,cw,"#107c41",F.warn,rh);x.restore();
    (F.warn||[]).forEach(i=>{x.fillStyle="#d2423a";x.font=`700 22px ${SANS}`;x.fillText("⚠",W-42,B+60+i*rh+30)});
    const my=B+66+F.rows.length*rh,mh=bot-my;if(mh>60){const pr=projector(pad(F.locator&&F.locator!=="all"?bboxOf(dist(F.locator).r.flat()):CG,.03),X0+4,my+4,MW-8,mh-8);
      x.fillStyle="#f4f7fb";x.fillRect(X0,my,MW,mh);
      if(F.ll){cgBase(x,pr,{rail:false});
        const[a,b]=F.ll;let bad=null;F.rows.slice(1).forEach(r=>{const la=+r[a],lo=+r[b];if(!la||!lo)return;if(la>24.5||la<17)bad=r;else dot(x,pr(lo,la),"#107c41",6)});
        if(bad){x.fillStyle="#d2423a";x.font=`700 14px ${SANS}`;x.fillText(`⚠ ${bad[0]}: lat ${bad[a]} is outside CG`,26,my+mh-12)}}
      else{cgBase(x,pr,{rail:false});if(F.locator&&F.locator!=="all")shapes(x,pr,[dist(F.locator)],c+"33",c,2.5);x.fillStyle="#7a8698";x.font=`700 14px ${SANS}`;x.fillText(F.locator&&F.locator!=="all"?`No coordinates · somewhere in ${F.locator} district`:"No coordinates · names only",26,my+mh-12)}}}
  else if(v==="pdf"){x.fillStyle="#f4f4f4";x.fillRect(X0,B,MW,bot-B);x.fillStyle="#fff";x.shadowColor="#0003";x.shadowBlur=12;x.fillRect(40,B+14,W-80,bot-B-28);x.shadowBlur=0;
    x.fillStyle="#222";x.font=`700 20px Georgia,serif`;x.fillText("School Education Department",62,B+54);x.font=`400 15px Georgia,serif`;x.fillText("Order No. 1187 / 2025 · New schools sanctioned",62,B+80);
    x.fillStyle="#999";x.fillRect(62,B+94,W-124,2);x.save();x.translate(34,0);
    F.rows.forEach((r,i)=>{let X=30;[40,140,110,90].forEach((w,j)=>{x.fillStyle=i===0?"#222":"#444";x.font=`${i===0?700:400} 16px Georgia,serif`;x.fillText(r[j],X,B+130+i*40);X+=w});x.fillStyle="#ddd";x.fillRect(30,B+140+i*40,380,1)});x.restore();
    x.fillStyle="#bbb";for(let i=0;i<5;i++)x.fillRect(62,B+320+i*24,W-124-(i%3)*60,8);x.strokeStyle=c;x.lineWidth=3;x.beginPath();x.arc(W-120,bot-80,34,0,7);x.stroke();x.fillStyle="#999";x.font=`400 14px Georgia,serif`;x.fillText("Page 1 of 4",62,bot-30)}
  else if(v==="register"){x.fillStyle="#fbf3dc";x.fillRect(X0,B,MW,bot-B);x.strokeStyle="#c9b78d";x.lineWidth=1;for(let i=0;i<12;i++){x.beginPath();x.moveTo(X0,B+40+i*46);x.lineTo(W-16,B+40+i*46);x.stroke()}
    x.strokeStyle="#d2423a";x.beginPath();x.moveTo(80,B);x.lineTo(80,bot);x.stroke();x.fillStyle="#2a3b8f";x.font=`500 29px ${HI}`;
    x.save();x.rotate(-.012);F.rows.forEach((l,i)=>x.fillText(l,28,B+78+i*46));x.restore();x.fillStyle="#d2423a";x.font=`700 23px ${MONO}`;x.fillText("no lat / long",28,bot-24)}
  else if(v==="tif"){/* the real state outline as a raster: pixels inside the boundary, classed (illustrative) */
    const pr=projector(pad(CG,.01),X0,B,MW,bot-B),cell=6;x.fillStyle="#1b2433";x.fillRect(X0,B,MW,bot-B);
    const FOREST=new Set(["Bastar","Dantewada","Bijapur","Sukma","Narayanpur","Kanker","Kondagaon","Sarguja","Jashpur","Korba","Balrampur-Ramanujganj","Surajpur","Koriya","Gariyaband","Dhamtari","Manendragarh-Chirmiri-Bharatpur","Gaurela-Pendra-Marwahi","Mohla-Manpur-Ambagarh Chowki"]);
    G.districts.forEach(d=>{x.save();x.beginPath();d.r.forEach(r=>trace(x,pr,r,true));x.clip();const f=FOREST.has(d.n);
      for(let gx=X0;gx<W;gx+=cell)for(let gy=B;gy<bot;gy+=cell){const q=Math.sin(gx*.05+gy*.03)+Math.cos(gy*.045-gx*.02)+Math.sin(gx*gy*.0004)+(f?1.1:-.6);
        x.fillStyle=q>1.4?"#1f6b35":q>.6?"#4f9a4f":q>-.2?"#a7c77a":"#e9e2c9";x.fillRect(gx,gy,cell,cell)}x.restore()});
    shapes(x,pr,G.districts,null,"#00000033",.8);x.fillStyle="#fff";x.font=`600 13px ${MONO}`;x.fillText("1 dense  2 open  3 scrub  0 non-forest",28,bot-12)}
  else if(v==="scanmap"){/* a scanned paper map of Raipur district: sepia, skewed, stained, no coordinates */
    x.fillStyle="#e9dfc6";x.fillRect(X0,B,MW,bot-B);x.save();x.translate(W/2,(B+bot)/2);x.rotate(-.025);x.translate(-W/2,-(B+bot)/2);
    const d=dist("Raipur"),b=pad(bboxOf(d.r.flat()),.08),pr=projector(b,X0+20,B+40,MW-40,bot-B-70);x.strokeStyle="#6b5b3e";x.lineWidth=2;x.strokeRect(X0+12,B+30,MW-24,bot-B-52);
    shapes(x,pr,G.districts.filter(q=>q!==d),"#e3d7b8","#a8956c",1);shapes(x,pr,[d],"#f1e8d0","#7a2b1f",2.6);
    polys(x,pr,G.rivers,"#5d7f9a",2.2);polys(x,pr,G.roads,"#a2492f",2);polys(x,pr,G.rail,"#2a2a2a",1.8,[6,3]);
    x.fillStyle="#7a2b1f";x.font=`700 22px ${HI}`;x.fillText("जिला रायपुर — राजस्व मानचित्र",X0+26,B+22);x.font=`600 16px ${HI}`;const t=pr(81.63,21.24);x.fillText("रायपुर",t[0]+6,t[1]-6);dot(x,t,"#7a2b1f",4);
    x.restore();x.fillStyle="#6b5b3e18";for(let i=0;i<5;i++){x.beginPath();x.arc(60+i*97%400,B+60+i*131%(bot-B-80),18+i*6,0,7);x.fill()}
    x.strokeStyle="#d2423a";x.lineWidth=2;[[X0+20,B+40],[W-36,B+40],[W-36,bot-30],[X0+20,bot-30]].forEach(([a,q])=>{x.beginPath();x.moveTo(a-9,q);x.lineTo(a+9,q);x.moveTo(a,q-9);x.lineTo(a,q+9);x.stroke()})}
  else if(v==="topo"){/* a 1:50 000 toposheet around Raipur–Durg with the real rail, roads and rivers */
    const b=[81.25,21.0,81.75,21.5],pr=projector(b,X0+28,B+28,MW-44,bot-B-56);x.fillStyle="#efe3c4";x.fillRect(X0,B,MW,bot-B);
    x.strokeStyle="#c9a978";x.lineWidth=1;for(let i=0;i<14;i++){x.beginPath();for(let k=0;k<=40;k++){const px=X0+k*MW/40,py=B+20+i*(bot-B)/13+Math.sin(k*.4+i)*9+Math.cos(k*.17+i*2)*6;k?x.lineTo(px,py):x.moveTo(px,py)}x.stroke()}
    const [p0x,p0y]=pr(b[0],b[3]),[p1x,p1y]=pr(b[2],b[1]);x.save();x.beginPath();x.rect(p0x,p0y,p1x-p0x,p1y-p0y);x.clip();
    polys(x,pr,G.rivers,"#4f7fae",2.4);polys(x,pr,G.roads,"#b0412a",2.4);x.strokeStyle="#111";x.lineWidth=3;G.rail.forEach(l=>{x.beginPath();trace(x,pr,l.p);x.stroke()});
    x.lineWidth=1.4;G.rail.forEach(l=>l.p.forEach((q,i)=>{const s=pr(q[0],q[1]);x.beginPath();x.moveTo(s[0]-4,s[1]-4);x.lineTo(s[0]+4,s[1]+4);x.stroke()}));
    [["Raipur",81.633,21.25],["Bhilai",81.38,21.21],["Durg",81.284,21.19]].forEach(([n,lo,la])=>{const q=pr(lo,la);x.fillStyle="#b0412a";x.fillRect(q[0]-5,q[1]-5,10,10);x.fillStyle="#222";x.font=`700 14px Georgia,serif`;x.fillText(n,q[0]+8,q[1]-6)});x.restore();
    x.strokeStyle="#333";x.lineWidth=2;x.strokeRect(p0x,p0y,p1x-p0x,p1y-p0y);x.fillStyle="#333";x.font=`500 12px ${MONO}`;
    [[b[0],"81°15′"],[b[2],"81°45′"]].forEach(([lo,t])=>{const q=pr(lo,b[1]);x.fillText(t,q[0]-18,p1y+16)});[[b[3],"21°30′"],[b[1],"21°00′"]].forEach(([la,t])=>{const q=pr(b[0],la);x.fillText(t,X0+2,q[1]+4)});
    x.strokeStyle="#c0392b";x.lineWidth=2;[[p0x,p0y],[p1x,p0y],[p1x,p1y],[p0x,p1y]].forEach(([a,q])=>{x.beginPath();x.arc(a,q,9,0,7);x.stroke()})}
  x.restore()}}

/* ---------- a converted feature, as a small GIS map tile (256 × 256): the file's real geometry, in its department's colour ---------- */
const PLACES={pdf:[[81.62,21.33],[81.97,21.2],[81.75,20.99]],register:[[81.73,21.17],[81.75,20.99],[81.66,21.05],[81.72,20.83]]};
export function drawFeature(F,col){return (x,W,H)=>{const G=GEO();x.clearRect(0,0,W,H);x.fillStyle="#fbfcfe";rr(x,3,3,W-6,H-6,16);x.fill();
  const RP=["scanmap","register"].includes(F.view)||F.locator==="Raipur",b=pad(F.geo==="bastar"?bboxOf(dist("Bastar").r.flat()):RP?bboxOf(dist("Raipur").r.flat()):F.view==="topo"?[81.25,21,81.75,21.5]:CG,.06);
  const pr=projector(b,12,12,W-24,H-24);x.save();rr(x,3,3,W-6,H-6,16);x.clip();shapes(x,pr,G.districts,"#eef2f7","#c9d3e0",1);
  const handles=pts=>{x.fillStyle="#fff";x.strokeStyle=col;x.lineWidth=1.5;pts.forEach((p,i)=>{if(i%Math.max(1,Math.floor(pts.length/7)))return;const q=pr(p[0],p[1]);x.fillRect(q[0]-3,q[1]-3,6,6);x.strokeRect(q[0]-3,q[1]-3,6,6)})};
  const pts=list=>list.forEach(([lo,la])=>dot(x,pr(lo,la),col,6));
  if(F.geo==="districts"){shapes(x,pr,G.districts,col+"40",col,1.6)}
  else if(F.geo==="bastar"){const d=dist("Bastar");x.save();x.beginPath();d.r.forEach(r=>trace(x,pr,r,true));x.clip();let k=0;for(let gx=0;gx<W;gx+=18)for(let gy=0;gy<H;gy+=18){x.fillStyle=col+["55","33","66","44"][(k++*7)%4];x.fillRect(gx,gy,17,17)}x.restore();shapes(x,pr,[d],null,col,2.5)}
  else if(RP&&F.view!=="register"){const d=dist("Raipur");shapes(x,pr,[d],col+"44",col,2.5);handles(d.r[0])}
  else if(F.geo==="mahanadi"){polys(x,pr,mahanadi(),col,5);handles(mahanadi().flatMap(r=>r.p))}
  else if(F.view==="dwg"){polys(x,pr,[NH30()],col,5);handles(NH30().p)}
  else if(F.geo==="nh130"){polys(x,pr,[NH130()],col,5);handles(NH130().p)}
  else if(F.view==="topo"){polys(x,pr,G.rail,col,4);G.rail.forEach(l=>handles(l.p))}
  else if(F.geo==="stations"){polys(x,pr,G.rail,"#9aa3ae",1.5,[4,3]);pts(STATIONS.map(s=>[s[2],s[3]]))}
  else if(F.ll){const[a,c2]=F.ll;pts(F.rows.slice(1).map(r=>[+r[c2],+r[a]]).filter(([lo,la])=>la>17&&la<24.5&&lo>80))}
  else if(F.view==="tif"){const FO=["Bastar","Dantewada","Bijapur","Sukma","Narayanpur","Kanker","Kondagaon","Sarguja","Jashpur","Korba","Balrampur-Ramanujganj","Surajpur","Koriya","Gariyaband","Dhamtari"];
    shapes(x,pr,G.districts.filter(d=>FO.includes(d.n)),"#3e8a4fbb",null);shapes(x,pr,G.districts.filter(d=>!FO.includes(d.n)),"#a7c77aaa",null)}
  else if(F.view==="pdf")pts(PLACES.pdf);
  else if(F.view==="register"){shapes(x,pr,[dist("Raipur")],null,col+"88",1.5);pts(PLACES.register)}
  else pts(HEALTH.slice(1).map(r=>[+r[4],+r[3]]));
  x.restore();x.strokeStyle=col;x.lineWidth=5;rr(x,3,3,W-6,H-6,16);x.stroke()}}
