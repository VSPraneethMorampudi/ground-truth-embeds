/* The data pipeline, told by scrolling. One entry per screen of scroll.
   cam: camera position + target for the 3D scene (desktop; phones are pulled back automatically).
   depts/conv/qa/...: what the overlay shows. Formats and records are realistic samples (illustrative). */
const T=(en,hi)=>({en,hi});
/* the departments. Each sends several files in different formats (see files.js) */
export const DEPTS=[
  {k:"revenue",short:T("Revenue","राजस्व"),name:T("Revenue Department","राजस्व विभाग"),col:"#8a6a3c"},
  {k:"water",short:T("Water Resources","जल संसाधन"),name:T("Water Resources Department","जल संसाधन विभाग"),col:"#1d6fd6"},
  {k:"pwd",short:T("Public Works","लोक निर्माण"),name:T("Public Works Department","लोक निर्माण विभाग"),col:"#d2733c"},
  {k:"edu",short:T("School Education","स्कूल शिक्षा"),name:T("School Education Department","स्कूल शिक्षा विभाग"),col:"#2f6fd6"},
  {k:"health",short:T("Health","स्वास्थ्य"),name:T("Health Department","स्वास्थ्य विभाग"),col:"#d2423a"},
  {k:"wcd",short:T("Women & Child","महिला एवं बाल"),name:T("Women & Child Development","महिला एवं बाल विकास विभाग"),col:"#e39a1f"},
  {k:"forest",short:T("Forest","वन"),name:T("Forest Department","वन विभाग"),col:"#3e8a4f"},
  {k:"rail",short:T("Railways","रेलवे"),name:T("Railways · SECR","रेलवे · द.पू.म.रे."),col:"#3a383d"}
];

export const STEPS=[
  {id:"intro",cam:[[-20,150,200],[0,0,10]],
   k:T("The pipeline","पाइपलाइन"),h:T("Follow the data","डेटा के साथ चलिए"),
   b:T("From office files to a live map.","दफ़्तर की फ़ाइलों से लाइव नक्शे तक।")},
  {id:"depts1",cam:[[-122,130,110],[-122,0,2]],depts:"all",
   k:T("1 · Departments","1 · विभाग"),h:T("Eight departments","आठ विभाग"),
   b:T("Each sends many kinds of file. Click one to open it.","हर विभाग कई तरह की फ़ाइलें भेजता है। खोलने के लिए क्लिक करें।")},
  {id:"depts2",cam:[[-110,112,100],[-124,0,0]],depts:"each",
   k:T("1 · Departments","1 · विभाग"),h:T("One office, many formats","एक दफ़्तर, कई प्रारूप"),
   b:T("Some have coordinates. Some don’t.","कुछ में निर्देशांक हैं। कुछ में नहीं।")},
  {id:"collect",cam:[[-98,96,122],[-98,2,-2]],
   k:T("2 · To CHiPS","2 · चिप्स तक"),h:T("Every file. One team.","हर फ़ाइल। एक टीम।"),
   b:T("Sent by email to the CHiPS GIS team.","ईमेल से चिप्स जीआईएस टीम को भेजी गई।")},
  {id:"conv1",cam:[[-46,34,52],[-46,4,0]],conv:0,
   k:T("3 · CHiPS GIS team","3 · चिप्स जीआईएस टीम"),h:T("Mail opened. Tools at work.","मेल खुला। टूल्स काम पर।"),
   b:T("Rows become points. Swapped columns fixed.","पंक्तियाँ बिंदु बनीं। उलटे कॉलम सुधरे।")},
  {id:"conv2",cam:[[-36,28,46],[-48,4,-2]],conv:1,
   k:T("3 · CHiPS GIS team","3 · चिप्स जीआईएस टीम"),h:T("Scans and drawings, georeferenced","स्कैन और ड्रॉइंग, भू-संदर्भित"),
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
