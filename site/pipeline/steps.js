/* The data pipeline, told by scrolling. One entry per screen of scroll.
   cam: camera position + target for the 3D scene (desktop; phones are pulled back automatically).
   fmt/conv/qa/...: what the overlay shows. Formats and records are realistic samples (illustrative). */
const T=(en,hi)=>({en,hi});
export const DEPTS=[
  {k:"revenue",name:T("Revenue","राजस्व"),fmt:"Shapefile",ext:".shp .shx .dbf .prj",col:"#8a6a3c",kind:"polygon",
   what:T("District, tehsil and village boundaries","ज़िला, तहसील और गाँव की सीमाएँ"),
   snip:`cg_district_boundary.shp\ncg_district_boundary.shx\ncg_district_boundary.dbf\ncg_district_boundary.prj\n\nDBF  dist_e      dist_cod  st_code\n     Raipur      376       22\n     Bastar      374       22\n     Bilaspur    381       22\n\nPRJ  GEOGCS["GCS_WGS_1984"…]`},
  {k:"water",name:T("Water Resources","जल संसाधन"),fmt:"KML",ext:".kml",col:"#1d6fd6",kind:"line",
   what:T("Rivers, canals and dams","नदियाँ, नहरें और बाँध"),
   snip:`<Placemark>\n  <name>Mahanadi</name>\n  <LineString>\n    <coordinates>\n      81.92,20.32,0\n      82.01,20.61,0\n      82.18,20.96,0 …\n    </coordinates>\n  </LineString>\n</Placemark>`},
  {k:"pwd",name:T("Public Works","लोक निर्माण"),fmt:"CAD drawing",ext:".dwg",col:"#d2733c",kind:"line",
   what:T("Roads and bridges, drawn in metres","सड़कें और पुल, मीटर में बनाए गए"),
   snip:`PWD_NH30_Raipur-Jagdalpur.dwg\nUnits     metres\nCRS       UTM zone 44N (EPSG:32644)\nLayers    ROAD_CL  ROAD_EDGE  BRIDGE\n\nLINE  ROAD_CL\n  from  (412 830.4, 2 349 117.9)\n  to    (413 102.7, 2 348 640.2)`},
  {k:"edu",name:T("Education","शिक्षा"),fmt:"Excel",ext:".xlsx",col:"#2f6fd6",kind:"point",
   what:T("Every school with its UDISE code","हर स्कूल अपने UDISE कोड के साथ"),
   snip:`  A                     B        C        D\n1 School                UDISE    Lat      Long\n2 GPS Mana              22270101 21.1804  81.7236\n3 GMS Abhanpur          22270215 20.9871  81.7542\n4 GHS Tilda             22270433 81.6012  21.5568 ⚠\n5 GPS Kurud                      20.8311  81.7210 ⚠`},
  {k:"health",name:T("Health","स्वास्थ्य"),fmt:"CSV from GPS",ext:".csv",col:"#d2423a",kind:"point",
   what:T("Health centres surveyed with handheld GPS","हैंडहेल्ड GPS से सर्वे किए स्वास्थ्य केंद्र"),
   snip:`id,facility,type,lat,lon,surveyed\n PHC-RPR-014,Abhanpur,PHC,20.9902,81.7531,2025-11-03\n SHC-RPR-221,Nawagaon,SHC,21.0410,81.6122,2025-11-04\n CHC-JSP-007,Pathalgaon,CHC,22.5560,83.4602,2025-11-09`},
  {k:"wcd",name:T("Women & Child Development","महिला एवं बाल विकास"),fmt:"Paper register",ext:"scan",col:"#e39a1f",kind:"point",
   what:T("Anganwadi centres, written by hand, no coordinates","आंगनवाड़ी केंद्र, हाथ से लिखे, बिना निर्देशांक"),
   snip:`क्र.  आंगनवाड़ी केंद्र     ग्राम       विकासखंड\n 1   AWC-RPR-00412     माना        अभनपुर\n 2   AWC-RPR-00413     टेमरी        अभनपुर\n 3   AWC-BST-00118     नगरनार      जगदलपुर\n\n(no latitude / longitude)`},
  {k:"forest",name:T("Forest","वन"),fmt:"Satellite raster",ext:".tif",col:"#3e8a4f",kind:"raster",
   what:T("Forest cover classified from satellite images","उपग्रह चित्रों से वर्गीकृत वन आवरण"),
   snip:`forest_cover_2025.tif\nGeoTIFF  10 m pixels  4 bands → 1 class band\nCRS      EPSG:32644\nValues   1 dense  2 open  3 scrub  0 non-forest\nExtent   80.25°E – 84.40°E, 17.78°N – 24.10°N`},
  {k:"rail",name:T("Railways","रेलवे"),fmt:"Scanned map",ext:".jpg",col:"#3a383d",kind:"line",
   what:T("Rail lines on an old paper sheet","पुरानी कागज़ी शीट पर रेल लाइनें"),
   snip:`SoI toposheet 64G/12, 1:50 000  (scan, 600 dpi)\nNo coordinates in the file:\nthe picture must be pinned to the earth\nusing 4+ ground control points\n  GCP1  pixel (412, 388)  →  81.6250°E  21.2500°N\n  GCP2  pixel (5 980, 401) →  81.7500°E  21.2500°N  …`}
];

export const STEPS=[
  {id:"intro",cam:[[-20,150,200],[0,0,10]],
   k:T("The pipeline","पाइपलाइन"),h:T("Follow the data","डेटा के साथ चलिए"),
   b:T("From office files to a live map.","दफ़्तर की फ़ाइलों से लाइव नक्शे तक।")},
  {id:"depts1",cam:[[-114,46,72],[-114,8,-6]],formats:[0,1,2,3],
   k:T("1 · Departments","1 · विभाग"),h:T("Every office, its own format","हर दफ़्तर, अपना प्रारूप"),
   b:T("This is what really arrives.","असल में यही आता है।")},
  {id:"depts2",cam:[[-114,46,72],[-114,8,-6]],formats:[4,5,6,7],
   k:T("1 · Departments","1 · विभाग"),h:T("Tables, scans, pixels","तालिकाएँ, स्कैन, पिक्सेल"),
   b:T("Some have coordinates. Some don’t.","कुछ में निर्देशांक हैं। कुछ में नहीं।")},
  {id:"collect",cam:[[-72,42,76],[-62,6,8]],
   k:T("2 · Collection","2 · संग्रह"),h:T("Eight formats. One pipeline.","आठ प्रारूप। एक पाइपलाइन।"),
   b:T("Nothing retyped. Every source traced.","कुछ दोबारा टाइप नहीं। हर स्रोत दर्ज।")},
  {id:"conv1",cam:[[-46,30,54],[-46,8,12]],conv:0,
   k:T("3 · Conversion","3 · रूपांतरण"),h:T("Rows become points","पंक्तियाँ बिंदु बनती हैं"),
   b:T("Swapped columns caught and fixed.","उलटे कॉलम पकड़े और सुधारे।")},
  {id:"conv2",cam:[[-46,30,54],[-46,8,12]],conv:1,
   k:T("3 · Conversion","3 · रूपांतरण"),h:T("Drawings land on the earth","ड्रॉइंग धरती पर उतरती हैं"),
   b:T("Metres and degrees → one standard.","मीटर और डिग्री → एक मानक।")},
  {id:"qa",cam:[[-28,30,58],[-24,6,12]],qa:true,
   k:T("4 · Quality checks","4 · गुणवत्ता जाँच"),h:T("Rules at the door","प्रवेश पर नियम"),
   b:T("Fail a check, go back with a reason.","जाँच में फ़ेल, कारण सहित वापस।")},
  {id:"gdb",cam:[[14,44,70],[14,10,2]],gdb:true,
   k:T("5 · Geodatabase","5 · भू-डेटाबेस"),h:T("One home","एक घर"),
   b:T("State Data Centre, Raipur. Backed up nightly.","राज्य डेटा केंद्र, रायपुर। हर रात बैकअप।")},
  {id:"map",cam:[[75,92,92],[75,0,4]],
   k:T("6 · One map","6 · एक नक्शा"),h:T("Layers line up","परतें मिलती हैं"),
   b:T("One system. One set of boundaries.","एक प्रणाली। एक सीमा-समूह।")},
  {id:"portal",cam:[[75,44,112],[75,20,-22]],
   k:T("7 · Geoportal","7 · जियोपोर्टल"),h:T("Open to everyone","सबके लिए खुला"),
   b:T("Any browser. Search, layers, Ask AI.","कोई भी ब्राउज़र। खोज, परतें, AI।")},
  {id:"apps",cam:[[132,34,72],[132,8,0]],
   k:T("8 · Apps","8 · ऐप्स"),h:T("Same data, every tool","वही डेटा, हर उपकरण"),
   b:T("Field app. Dashboards. Department GIS.","फ़ील्ड ऐप। डैशबोर्ड। विभागीय GIS।")},
  {id:"uses",cam:[[75,110,82],[75,0,4]],uses:true,
   k:T("9 · Use cases","9 · उपयोग"),h:T("Decisions, grounded","ज़मीन पर टिके निर्णय"),
   b:T("","")},
  {id:"loop",cam:[[0,170,220],[0,10,0]],
   k:T("10 · Never finished","10 · कभी पूरा नहीं"),h:T("Never finished","कभी पूरा नहीं"),
   b:T("Field updates flow back in.","फ़ील्ड अपडेट लौटकर आते हैं।")}
];

export const CONV=[
  {in:{t:T("Excel row","एक्सेल पंक्ति"),code:`GHS Tilda | 22270433 | 81.6012 | 21.5568`},
   steps:[T("latitude 81.6 is impossible here → columns swapped","यहाँ अक्षांश 81.6 असंभव → कॉलम उलटे"),T("swap, then check it falls inside Raipur district","उलटें, फिर जाँचें कि रायपुर ज़िले में है")],
   out:{t:T("GeoJSON point","GeoJSON बिंदु"),code:`{ "type": "Feature",\n  "geometry": { "type": "Point",\n    "coordinates": [81.6012, 21.5568] },\n  "properties": { "udise": "22270433",\n    "name": "GHS Tilda", "district": "Raipur" } }`}},
  {in:{t:T("CAD line (metres)","CAD रेखा (मीटर)"),code:`(412 830.4, 2 349 117.9)  UTM 44N`},
   steps:[T("reproject EPSG:32644 → EPSG:4326 (WGS 84)","पुनःप्रक्षेपण EPSG:32644 → EPSG:4326 (WGS 84)"),T("rename fields to the state schema","फ़ील्ड नाम राज्य स्कीमा के अनुसार")],
   out:{t:T("Road in degrees","डिग्री में सड़क"),code:`LINESTRING (81.6582 21.2386,\n            81.6608 21.2343, …)\nroad_no: NH-30   class: National Highway\nsource: PWD   updated: 2025-10-14`}}
];

export const USES=[
  {k:"school",t:T("Where should the next school go?","अगला स्कूल कहाँ बने?"),b:T("Villages more than 3 km from a primary school, by district.","प्राथमिक स्कूल से 3 किमी से अधिक दूर गाँव, ज़िलेवार।"),col:"#2f6fd6"},
  {k:"health",t:T("Who is far from a health centre?","स्वास्थ्य केंद्र से कौन दूर है?"),b:T("Travel time from every habitation to the nearest PHC.","हर बसाहट से नज़दीकी PHC तक यात्रा समय।"),col:"#d2423a"},
  {k:"forest",t:T("How is forest cover changing?","वन आवरण कैसे बदल रहा है?"),b:T("Year-on-year change from satellite classification.","उपग्रह वर्गीकरण से साल-दर-साल बदलाव।"),col:"#3e8a4f"},
  {k:"flood",t:T("Which roads flood in the monsoon?","मानसून में कौन-सी सड़कें डूबती हैं?"),b:T("Roads within the Mahanadi flood zone, for disaster planning.","आपदा योजना हेतु महानदी बाढ़ क्षेत्र में सड़कें।"),col:"#0b7a70"}
];

export const APPS=[
  {k:"phone",t:T("Field app","फ़ील्ड ऐप"),b:T("Capture a point, a photo and a note on site; works offline.","मौके पर बिंदु, फ़ोटो और नोट दर्ज करें; ऑफ़लाइन भी चलता है।")},
  {k:"tablet",t:T("Dashboards","डैशबोर्ड"),b:T("Coverage by district for officials, updated from the same layers.","अधिकारियों के लिए ज़िलेवार कवरेज, उन्हीं परतों से।")},
  {k:"laptop",t:T("Department GIS","विभागीय GIS"),b:T("Desktop GIS and other systems read the same map services.","डेस्कटॉप GIS और अन्य प्रणालियाँ वही मैप सेवाएँ पढ़ती हैं।")}
];
