/* What the departments actually send. A department is not one format: each sends several files of different kinds.
   Every file has a view (how its contents are drawn), its raw contents, and what the CHiPS GIS team does with it.
   Records are realistic samples (illustrative). Used by the 3D scene (file cards) and the file viewer. */
const T=(en,hi)=>({en,hi});

/* one colour per format, so the same format looks the same whichever department sends it */
export const FMTS={
  shp:{n:"Shapefile",c:"#7a5c2e"},kml:{n:"KML",c:"#1d6fd6"},dwg:{n:"CAD drawing",c:"#d2733c"},xlsx:{n:"Excel",c:"#107c41"},
  csv:{n:"CSV",c:"#b4462f"},gpx:{n:"GPS track",c:"#0b7a70"},pdf:{n:"PDF",c:"#c0392b"},reg:{n:"Paper register",c:"#c98a12"},
  tif:{n:"Satellite raster",c:"#5b7f2a"},scan:{n:"Scanned map",c:"#6b5b3e"}
};

/* table rows → aligned plain text, for the raw view */
const grid=rows=>{const w=rows[0].map((_,j)=>Math.max(...rows.map(r=>String(r[j]??"").length)));return rows.map(r=>r.map((v,j)=>String(v??"").padEnd(w[j])).join("  ").trimEnd()).join("\n")};

export const FILES=[
  /* ---- Revenue ---- */
  {d:0,f:"shp",name:"cg_district_boundary",ext:".shp .shx .dbf .prj",kind:"polygon",view:"shp",xy:true,
   what:T("District boundaries with codes","कोड सहित ज़िला सीमाएँ"),
   rows:[["dist_e","dist_cod","st_code"],["Raipur","376","22"],["Bastar","374","22"],["Bilaspur","381","22"],["Durg","382","22"]],
   raw:`cg_district_boundary.shp   geometry\ncg_district_boundary.shx   index\ncg_district_boundary.dbf   attributes\ncg_district_boundary.prj   GEOGCS["GCS_WGS_1984"…]\n\n`,
   todo:T("Check topology, keep the official boundary","टोपोलॉजी जाँचें, आधिकारिक सीमा रखें")},
  {d:0,f:"scan",name:"Mana_village_naksha_P12",ext:".tif (scan)",kind:"polygon",view:"cadastral",xy:false,
   what:T("Village cadastral map, scanned from paper","गाँव का भू-नक्शा, कागज़ से स्कैन"),
   raw:`Village   Mana  ·  Tehsil Abhanpur  ·  Raipur\nSheet     P-12 of 14   ·   scale 1:4 000\nScan      400 dpi, greyscale\n\nNo coordinates in the file.\nKhasra numbers drawn by hand: 112, 113, 114/1, 114/2 …`,
   todo:T("Georeference, then digitise each khasra plot","भू-संदर्भित करें, फिर हर खसरा प्लॉट डिजिटाइज़ करें")},
  {d:0,f:"xlsx",name:"khasra_register_Abhanpur",ext:".xlsx",kind:"polygon",view:"xlsx",xy:false,
   what:T("Land records by khasra number, no map","खसरा नंबर से भू-अभिलेख, नक्शा नहीं"),
   rows:[["Village","Khasra","Area ha","Owner"],["Mana","112","0.84","Private"],["Mana","113","1.20","Govt."],["Mana","114/1","0.36","Private"],["Temri","27","2.05","Forest"]],
   todo:T("Join to the digitised plots by khasra number","खसरा नंबर से डिजिटाइज़ प्लॉट से जोड़ें")},
  /* ---- Water Resources ---- */
  {d:1,f:"kml",name:"mahanadi_canals",ext:".kml",kind:"line",view:"code",xy:true,
   what:T("Rivers and canals from Google Earth","Google Earth से नदियाँ और नहरें"),
   lines:['<Placemark>','  <name>Mahanadi Main Canal</name>','  <LineString>','    <coordinates>','      81.92,20.32,0','      82.01,20.61,0','      82.18,20.96,0','    </coordinates>','  </LineString>','</Placemark>'],
   todo:T("Snap to the river network, add canal codes","नदी नेटवर्क से जोड़ें, नहर कोड जोड़ें")},
  {d:1,f:"xlsx",name:"dam_register_2025",ext:".xlsx",kind:"point",view:"xlsx",xy:true,
   what:T("Dams and reservoirs with lat / long","अक्षांश/देशांतर सहित बाँध और जलाशय"),
   rows:[["Dam","District","Lat","Long"],["Gangrel","Dhamtari","20.6280","81.5631"],["Hasdeo Bango","Korba","22.6170","82.6011"],["Dudhawa","Kanker","20.3045","81.7640"],["Sondur","Dhamtari","20.2301","81.9002"]],
   todo:T("Turn rows into points, check each is on water","पंक्तियों को बिंदु बनाएँ, पानी पर है जाँचें")},
  /* ---- Public Works ---- */
  {d:2,f:"dwg",name:"PWD_NH30_Raipur-Jagdalpur",ext:".dwg",kind:"line",view:"dwg",xy:true,
   what:T("Road alignment drawn in metres","मीटर में बनाया गया सड़क संरेखण"),
   raw:`Units     metres\nCRS       UTM zone 44N (EPSG:32644)\nLayers    ROAD_CL  ROAD_EDGE  BRIDGE  CULVERT\n\nLINE  ROAD_CL\n  from  (412 830.4, 2 349 117.9)\n  to    (413 102.7, 2 348 640.2)\nBLOCK BRIDGE  "Mahanadi br. km 42"`,
   todo:T("Reproject UTM 44N → WGS 84, keep the centre line","UTM 44N → WGS 84 पुनःप्रक्षेपण, मध्य रेखा रखें")},
  {d:2,f:"gpx",name:"PMGSY_road_survey_track",ext:".gpx",kind:"line",view:"code",xy:true,
   what:T("Village road walked with a GPS phone","GPS फ़ोन से चलकर दर्ज गाँव की सड़क"),
   lines:['<trk><name>PMGSY Kurud–Bhakhara</name>','<trkseg>','  <trkpt lat="20.8311" lon="81.7210">','    <time>2025-11-02T09:14:05Z</time>','  </trkpt>','  <trkpt lat="20.8347" lon="81.7262"/>','  <trkpt lat="20.8390" lon="81.7319"/>','  …  1 842 points','</trkseg></trk>'],
   todo:T("Remove GPS jitter, simplify to a clean line","GPS झटके हटाएँ, साफ़ रेखा बनाएँ")},
  /* ---- School Education ---- */
  {d:3,f:"xlsx",name:"UDISE_schools_Raipur",ext:".xlsx",kind:"point",view:"xlsx",xy:true,reject:true,warn:[3,4],
   what:T("Every school with its UDISE code","हर स्कूल अपने UDISE कोड के साथ"),
   rows:[["School","UDISE","Lat","Long"],["GPS Mana","22270101","21.1804","81.7236"],["GMS Abhanpur","22270215","20.9871","81.7542"],["GHS Tilda","22270433","81.6012","21.5568"],["GPS Kurud","","20.8311","81.7210"]],
   todo:T("Fix swapped lat / long; send blank codes back","उलटे अक्षांश/देशांतर सुधारें; खाली कोड वापस भेजें")},
  {d:3,f:"pdf",name:"new_schools_sanctioned_2025",ext:".pdf",kind:"point",view:"pdf",xy:false,
   what:T("Sanction order: school names and villages only","स्वीकृति आदेश: केवल स्कूल और गाँव के नाम"),
   rows:[["S.No","School","Village","Block"],["1","GPS Bhatagaon","Bhatagaon","Dharsiwa"],["2","GPS Sondra","Sondra","Arang"],["3","GMS Parsada","Parsada","Abhanpur"]],
   todo:T("Extract the table, place each school by village","तालिका निकालें, गाँव से स्कूल का स्थान तय करें")},
  /* ---- Health ---- */
  {d:4,f:"csv",name:"health_facilities_gps",ext:".csv",kind:"point",view:"csv",xy:true,
   what:T("Health centres surveyed with handheld GPS","हैंडहेल्ड GPS से सर्वे किए स्वास्थ्य केंद्र"),
   lines:["id,facility,type,lat,lon,surveyed","PHC-RPR-014,Abhanpur,PHC,20.9902,81.7531,2025-11-03","SHC-RPR-221,Nawagaon,SHC,21.0410,81.6122,2025-11-04","CHC-JSP-007,Pathalgaon,CHC,22.5560,83.4602,2025-11-09","PHC-BST-031,Tokapal,PHC,19.0810,81.9520,2025-11-12"],
   todo:T("Read as points, match ids to the facility list","बिंदु बनाएँ, आईडी को सूची से मिलाएँ")},
  {d:4,f:"xlsx",name:"PHC_beds_staff",ext:".xlsx",kind:"point",view:"xlsx",xy:false,
   what:T("Beds and staff per centre, no location","हर केंद्र के बेड और स्टाफ़, स्थान नहीं"),
   rows:[["Facility","Type","Beds","Doctors"],["Abhanpur","PHC","6","2"],["Pathalgaon","CHC","30","7"],["Tokapal","PHC","6","1"],["Nawagaon","SHC","0","0"]],
   todo:T("Join to the GPS points by facility name","सुविधा के नाम से GPS बिंदुओं से जोड़ें")},
  /* ---- Women & Child Development ---- */
  {d:5,f:"reg",name:"Anganwadi_register_Abhanpur",ext:"paper → scan",kind:"point",view:"register",xy:false,
   what:T("Anganwadi centres, written by hand","आंगनवाड़ी केंद्र, हाथ से लिखे"),
   rows:["1  AWC-RPR-00412  माना","2  AWC-RPR-00413  टेमरी","3  AWC-BST-00118  नगरनार","4  AWC-BST-00119  तोकापाल","5  AWC-KRB-00031  कटघोरा"],
   raw:`क्र.  आंगनवाड़ी केंद्र     ग्राम       विकासखंड\n 1   AWC-RPR-00412     माना        अभनपुर\n 2   AWC-RPR-00413     टेमरी        अभनपुर\n 3   AWC-BST-00118     नगरनार      जगदलपुर\n\n(no latitude / longitude)`,
   todo:T("Type it in, then place each centre by village","टाइप करें, फिर गाँव से हर केंद्र का स्थान तय करें")},
  {d:5,f:"xlsx",name:"AWC_beneficiaries_Q3",ext:".xlsx",kind:"point",view:"xlsx",xy:false,
   what:T("Children and mothers enrolled, by centre","केंद्रवार नामांकित बच्चे और माताएँ"),
   rows:[["AWC code","Village","Children","Mothers"],["AWC-RPR-00412","Mana","46","12"],["AWC-RPR-00413","Temri","38","9"],["AWC-BST-00118","Nagarnar","52","15"]],
   todo:T("Link to centre points by AWC code","AWC कोड से केंद्र बिंदुओं से जोड़ें")},
  /* ---- Forest ---- */
  {d:6,f:"tif",name:"forest_cover_2025",ext:".tif",kind:"raster",view:"tif",xy:true,
   what:T("Forest cover classified from satellite images","उपग्रह चित्रों से वर्गीकृत वन आवरण"),
   raw:`GeoTIFF  10 m pixels  ·  1 class band\nCRS      EPSG:32644\nValues   1 dense  2 open  3 scrub  0 non-forest\nExtent   80.25°E – 84.40°E, 17.78°N – 24.10°N\nSize     46 210 × 70 120 px  ·  3.1 GB`,
   todo:T("Reproject, tile and publish as an image layer","पुनःप्रक्षेपण, टाइल, इमेज परत के रूप में प्रकाशित")},
  {d:6,f:"shp",name:"forest_compartments_Bastar",ext:".shp .shx .dbf .prj",kind:"polygon",view:"shp",xy:true,
   what:T("Forest compartments with range names","रेंज नाम सहित वन कक्ष"),
   rows:[["comp_no","range","area_ha"],["RF-412","Jagdalpur","388.2"],["RF-413","Jagdalpur","402.7"],["PF-118","Tokapal","215.0"],["RF-509","Bakawand","611.4"]],
   raw:`forest_compartments_Bastar.shp\nforest_compartments_Bastar.shx\nforest_compartments_Bastar.dbf\nforest_compartments_Bastar.prj   PROJCS["WGS_1984_UTM_Zone_44N"…]\n\n`,
   todo:T("Reproject, rename fields to the state schema","पुनःप्रक्षेपण, फ़ील्ड नाम राज्य स्कीमा के अनुसार")},
  /* ---- Railways ---- */
  {d:7,f:"scan",name:"SoI_toposheet_64G-12",ext:".jpg (scan)",kind:"line",view:"topo",xy:false,
   what:T("Rail lines on an old paper toposheet","पुरानी कागज़ी टोपोशीट पर रेल लाइनें"),
   raw:`SoI toposheet 64G/12, 1:50 000  (scan, 600 dpi)\nNo coordinates in the file:\nthe picture must be pinned to the earth\nusing 4+ ground control points\n  GCP1  pixel (412, 388)   →  81.6250°E  21.2500°N\n  GCP2  pixel (5 980, 401) →  81.7500°E  21.2500°N  …`,
   todo:T("Georeference with control points, trace the track","नियंत्रण बिंदुओं से भू-संदर्भित, ट्रैक ट्रेस करें")},
  {d:7,f:"kml",name:"SECR_stations",ext:".kml",kind:"point",view:"code",xy:true,
   what:T("Stations as placemarks","स्टेशन, प्लेसमार्क के रूप में"),
   lines:['<Placemark>','  <name>Raipur Jn (R)</name>','  <Point>','    <coordinates>81.6337,21.2588,0</coordinates>','  </Point>','</Placemark>','<Placemark>','  <name>Bhilai Power House (BPHB)</name>','  <Point><coordinates>81.3854,21.2087,0</coordinates></Point>','</Placemark>'],
   todo:T("Read as points, attach station codes","बिंदु बनाएँ, स्टेशन कोड जोड़ें")}
];
FILES.forEach((x,i)=>{x.i=i;if(x.raw===undefined)x.raw="";
  if(x.rows&&x.view!=="register")x.raw+=(x.view==="shp"?"DBF\n":"")+grid(x.rows);else if(x.lines)x.raw=x.lines.join("\n")});

/* ---------- drawing a file's contents on a 2D canvas (512 × 660 logical) ---------- */
const MONO='"Geist Mono",ui-monospace,monospace',SANS='"Bricolage Grotesque",system-ui,sans-serif',HI='"Anek Devanagari",sans-serif';
const mix=(a,b,t)=>a+(b-a)*t;
function rr(x,X,Y,W,H,r){x.beginPath();x.roundRect(X,Y,W,H,r)}
function table(x,rows,B,cw,head,warn=[]){rows.forEach((r,i)=>{let X=28;r.forEach((v,j)=>{x.fillStyle=i===0?head+"22":(warn.includes(i)?"#fde8e4":i%2?"#fafafa":"#fff");x.fillRect(X,B+i*62,cw[j],60);x.strokeStyle="#e2e2e2";x.strokeRect(X,B+i*62,cw[j],60);
  x.fillStyle=i===0?head:"#333";x.font=`${i===0?700:500} 18px ${MONO}`;x.fillText(String(v).slice(0,Math.floor((cw[j]-10)/11)),X+8,B+38+i*62);X+=cw[j]})})}
/* draw(file, dept) → (ctx, W, H). `full` adds the header band; the viewer draws without it */
export function drawFile(F,dep,{head=true}={}){return (x,W0,H0)=>{const sc=W0/512;x.save();x.scale(sc,sc);const W=512,H=660,fm=FMTS[F.f],c=fm.c;
  x.fillStyle="#fff";rr(x,0,0,W,H,28);x.fill();
  let B=24;
  if(head){x.fillStyle=c;rr(x,0,0,W,96,[28,28,0,0]);x.fill();x.fillStyle="#fff";x.font=`700 40px ${SANS}`;x.fillText(fm.n,28,58);x.font=`500 22px ${MONO}`;x.globalAlpha=.85;x.fillText(F.ext,28,86);x.globalAlpha=1;B=118;
    /* department tag at the foot */
    x.fillStyle=dep.col;rr(x,0,H-58,W,58,[0,0,28,28]);x.fill();x.fillStyle="#fff";x.font=`700 24px ${SANS}`;x.fillText(dep.short.en.toUpperCase(),28,H-21);
    x.font=`600 24px ${HI}`;x.textAlign="right";x.fillText(dep.short.hi,W-28,H-21);x.textAlign="left"}
  const bot=head?H-70:H-20;x.beginPath();x.rect(16,B,W-32,bot-B);x.clip();
  const v=F.view;
  if(v==="shp"){["shp","shx","dbf","prj"].forEach((e,i)=>{x.fillStyle="#f3ede2";rr(x,28+i*118,B+8,104,74,14);x.fill();x.fillStyle=c;x.font=`700 26px ${MONO}`;x.fillText("."+e,44+i*118,B+55)});
    x.strokeStyle=c;x.lineWidth=4;x.fillStyle=c+"22";const P=[[70,250],[180,190],[300,215],[440,160],[452,300],[320,370],[150,350]];x.beginPath();P.forEach((p,i)=>i?x.lineTo(p[0],p[1]+B-100):x.moveTo(p[0],p[1]+B-100));x.closePath();x.fill();x.stroke();
    x.beginPath();x.moveTo(180,B+90);x.lineTo(240,B+260);x.lineTo(452,B+200);x.stroke();
    table(x,F.rows,B+290,[190,140,126],c)}
  else if(v==="code"||v==="csv"){x.font=`500 ${v==="csv"?19:23}px ${MONO}`;const L=F.lines;
    L.forEach((l,i)=>{const y=B+38+i*(v==="csv"?50:44);if(v==="csv"){let X=24;l.split(",").forEach((p,k,a)=>{x.fillStyle=i===0?c:"#333";x.fillText(p,X,y);X+=x.measureText(p).width;if(k<a.length-1){x.fillStyle=c;x.fillText(",",X,y);X+=x.measureText(",").width}})}
      else{x.fillStyle=/^\s*</.test(l)?c:"#333";x.fillText(l,26,y)}})}
  else if(v==="dwg"){x.fillStyle="#13233d";x.fillRect(16,B,W-32,bot-B);x.strokeStyle="#5fb3ff33";x.lineWidth=1;for(let i=0;i<22;i++){x.beginPath();x.moveTo(16+i*26,B);x.lineTo(16+i*26,bot);x.stroke();x.beginPath();x.moveTo(16,B+i*26);x.lineTo(W,B+i*26);x.stroke()}
    x.strokeStyle="#ffd36b";x.lineWidth=6;x.beginPath();x.moveTo(40,bot-30);x.bezierCurveTo(160,bot-110,240,B+220,470,B+90);x.stroke();x.strokeStyle="#9fd3ff";x.lineWidth=2;x.setLineDash([10,8]);
    x.beginPath();x.moveTo(30,bot-50);x.bezierCurveTo(150,bot-130,230,B+200,460,B+70);x.stroke();x.beginPath();x.moveTo(52,bot-12);x.bezierCurveTo(172,bot-92,252,B+240,480,B+110);x.stroke();x.setLineDash([]);
    x.strokeStyle="#ff8a6b";x.lineWidth=3;x.strokeRect(250,B+250,60,30);x.fillStyle="#9fd3ff";x.font=`500 21px ${MONO}`;x.fillText("UTM 44N  ·  metres",32,B+36);x.fillText("ROAD_CL  NH-30",32,B+66);x.fillStyle="#ff8a6b";x.fillText("BRIDGE km 42",320,B+272)}
  else if(v==="xlsx"){/* spreadsheet: column letters, row numbers, a green ribbon */
    x.fillStyle="#e9f3ec";x.fillRect(16,B,W-32,34);x.fillStyle="#107c41";x.font=`700 18px ${SANS}`;x.fillText("Sheet1",28,B+23);x.fillStyle="#555";x.font=`500 18px ${MONO}`;x.fillText("fx",120,B+23);
    const cw=[150,108,96,92];let X=56;["A","B","C","D"].forEach((L,j)=>{x.fillStyle="#f1f1f1";x.fillRect(X,B+40,cw[j],28);x.fillStyle="#666";x.fillText(L,X+cw[j]/2-6,B+60);X+=cw[j]});
    F.rows.forEach((r,i)=>{x.fillStyle="#f1f1f1";x.fillRect(16,B+70+i*62,40,60);x.fillStyle="#666";x.font=`500 18px ${MONO}`;x.fillText(i+1,28,B+108+i*62)});
    x.save();x.translate(28,0);table(x,F.rows,B+70,cw,"#107c41",F.warn);x.restore();
    (F.warn||[]).forEach(i=>{x.fillStyle="#d2423a";x.font=`700 26px ${SANS}`;x.fillText("⚠",W-48,B+110+i*62)})}
  else if(v==="pdf"){x.fillStyle="#f4f4f4";x.fillRect(16,B,W-32,bot-B);x.fillStyle="#fff";x.shadowColor="#0003";x.shadowBlur=12;x.fillRect(40,B+14,W-80,bot-B-28);x.shadowBlur=0;
    x.fillStyle="#222";x.font=`700 20px Georgia,serif`;x.fillText("School Education Department",62,B+54);x.font=`400 16px Georgia,serif`;x.fillText("Order No. 1187 / 2025 · New schools sanctioned",62,B+80);
    x.fillStyle="#999";x.fillRect(62,B+94,W-124,2);x.save();x.translate(34,0);x.font=`400 16px Georgia,serif`;
    F.rows.forEach((r,i)=>{let X=30;[40,140,110,90].forEach((w,j)=>{x.fillStyle=i===0?"#222":"#444";x.font=`${i===0?700:400} 16px Georgia,serif`;x.fillText(r[j],X,B+130+i*40);X+=w});x.fillStyle="#ddd";x.fillRect(30,B+140+i*40,380,1)});x.restore();
    x.fillStyle="#bbb";for(let i=0;i<5;i++)x.fillRect(62,B+320+i*24,W-124-(i%3)*60,8);x.strokeStyle=c;x.lineWidth=3;x.beginPath();x.arc(W-120,bot-80,34,0,7);x.stroke();x.fillStyle="#999";x.font=`400 14px Georgia,serif`;x.fillText("Page 1 of 4",62,bot-30)}
  else if(v==="register"){x.fillStyle="#fbf3dc";x.fillRect(16,B,W-32,bot-B);x.strokeStyle="#c9b78d";x.lineWidth=1;for(let i=0;i<12;i++){x.beginPath();x.moveTo(16,B+40+i*46);x.lineTo(W-16,B+40+i*46);x.stroke()}
    x.strokeStyle="#d2423a";x.beginPath();x.moveTo(80,B);x.lineTo(80,bot);x.stroke();x.fillStyle="#2a3b8f";x.font=`500 29px ${HI}`;
    x.save();x.rotate(-.012);F.rows.forEach((l,i)=>x.fillText(l,28,B+78+i*46));x.restore();x.fillStyle="#d2423a";x.font=`700 23px ${MONO}`;x.fillText("no lat / long",28,bot-24)}
  else if(v==="tif"){for(let i=0;i<23;i++)for(let j=0;j<Math.ceil((bot-B)/21);j++){const q=Math.sin(i*.6+j*.3)+Math.cos(j*.4-i*.2)+Math.sin(i*j*.05);x.fillStyle=q>1?"#1f6b35":q>.2?"#4f9a4f":q>-.6?"#a7c77a":"#e9e2c9";x.fillRect(18+i*21,B+j*21,20,20)}}
  else if(v==="cadastral"){x.fillStyle="#ece4cc";x.fillRect(16,B,W-32,bot-B);x.strokeStyle="#3d3426";x.lineWidth=2;
    const pl=[[[40,40],[200,30],[220,170],[60,190]],[[200,30],[380,50],[360,180],[220,170]],[[380,50],[470,70],[460,230],[360,180]],[[60,190],[220,170],[240,330],[50,340]],[[220,170],[360,180],[350,320],[240,330]],[[360,180],[460,230],[450,380],[350,320]],[[50,340],[240,330],[230,470],[40,460]],[[240,330],[450,380],[440,480],[230,470]]];
    const nos=["112","113","118","114/1","114/2","117","115","116"];x.font=`600 22px ${MONO}`;pl.forEach((p,k)=>{x.beginPath();p.forEach((q,i)=>i?x.lineTo(q[0],q[1]+B):x.moveTo(q[0],q[1]+B));x.closePath();x.stroke();
      const cx=p.reduce((a,q)=>a+q[0],0)/4,cy=p.reduce((a,q)=>a+q[1],0)/4+B;x.fillStyle="#3d3426";x.fillText(nos[k],cx-24,cy+8)});
    x.fillStyle="#3d342611";for(let i=0;i<60;i++)x.fillRect((i*137)%W,B+(i*89)%(bot-B),3,3);x.fillStyle="#7a2b1f";x.font=`700 20px ${HI}`;x.fillText("ग्राम माना · प.ह.नं. 12",40,bot-20)}
  else if(v==="topo"){x.fillStyle="#efe3c4";x.fillRect(16,B,W-32,bot-B);x.strokeStyle="#9c8a63";x.lineWidth=1;for(let i=0;i<9;i++){x.beginPath();x.moveTo(16,B+i*64);x.bezierCurveTo(200,B+i*64+30,300,B+i*64-30,W,B+i*64+10);x.stroke()}
    x.strokeStyle="#222";x.lineWidth=5;x.beginPath();x.moveTo(40,bot-40);x.lineTo(W-40,B+60);x.stroke();x.lineWidth=2;for(let i=0;i<16;i++){const t=i/15,X=mix(40,W-40,t),Y=mix(bot-40,B+60,t);x.beginPath();x.moveTo(X-8,Y-8);x.lineTo(X+8,Y+8);x.stroke()}
    x.strokeStyle="#c0392b";x.lineWidth=4;x.beginPath();x.arc(W-110,bot-100,48,0,7);x.stroke();x.fillStyle="#c0392b";x.font=`700 18px ${MONO}`;x.fillText("SoI 64G/12",W-160,bot-95)}
  x.restore()}}
