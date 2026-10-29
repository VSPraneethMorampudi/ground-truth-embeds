/* Ground Truth · Rajyotsav 2026 — vector motion engine. render(t) is deterministic. */
const G = window.GEO, W = 1920, H = 1080;
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const dom = document.getElementById('dom');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lin = (t, a, b) => clamp((t - a) / (b - a));
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eo = x => 1 - Math.pow(1 - x, 3), eo5 = x => 1 - Math.pow(1 - x, 5), ei = x => x * x * x;
const mix = (a, b, p) => a + (b - a) * p;
let S = 777; const rnd = () => ((S = (S * 1664525 + 1013904223) >>> 0) / 4294967296);
const END = 106;

/* ---------------- camera ---------------- */
// [t, lon, lat, k, cx, cy]
const KF = [
  [0, 20, 8, 330, 1180, 560], [5.5, 62, 16, 360, 1180, 560], [8.5, 79, 22, 950, 1180, 560], [11.5, 80.8, 22, 2600, 1220, 540],
  [14.6, 82.15, 21.25, 7400, 1240, 540], [16.6, 82.15, 21.25, 7400, 1240, 540],
  [18.0, 82.15, 21.25, 6000, 650, 560], [28.6, 82.15, 21.25, 6000, 650, 560],
  [30.6, 82.15, 21.25, 6500, 1000, 560], [42.0, 82.15, 21.25, 6500, 1000, 560],
  [44.6, 81.64, 21.215, 70000, 1240, 560], [46.0, 81.64, 21.215, 250000, 1250, 560], [49.6, 81.64, 21.215, 270000, 1250, 560],
  [52.8, 82.15, 21.25, 6800, 1240, 560], [54.2, 82.15, 21.25, 6800, 1240, 560],
  [74.0, 82.15, 21.25, 6800, 1240, 560], [77.6, 82.15, 21.25, 6800, 1240, 560], [79.8, 81.53, 21.72, 52000, 1260, 560], [83.4, 81.53, 21.72, 60000, 1260, 560],
  [85.0, 82.15, 21.25, 6800, 1240, 560],
  [94.0, 82.15, 21.25, 6800, 1240, 560], [96.5, 81.5, 22, 2200, 960, 380], [100.5, 70, 18, 420, 960, 380], [106, 55, 14, 380, 960, 380]
];
function cam(t) {
  let i = 0; while (i < KF.length - 2 && t > KF[i + 1][0]) i++;
  const a = KF[i], b = KF[i + 1], p = eio(lin(t, a[0], b[0]));
  return { lon: mix(a[1], b[1], p), lat: mix(a[2], b[2], p), k: Math.exp(mix(Math.log(a[3]), Math.log(b[3]), p)), cx: mix(a[4], b[4], p), cy: mix(a[5], b[5], p) };
}
const proj = d3.geoOrthographic().clipAngle(90).precision(0.3);
const path = d3.geoPath(proj, ctx);
function setProj(c, pr = proj) { pr.rotate([-c.lon, -c.lat]).scale(c.k).translate([c.cx, c.cy]); return pr; }

/* ---------------- static pre-renders ---------------- */
const stars = Array.from({ length: 420 }, () => [rnd() * W, rnd() * H, rnd() * 1.4 + .2, rnd()]);
const grainEl = document.getElementById('grain'), flashEl = document.getElementById('flash'), bug = document.getElementById('bug'), prog = document.getElementById('prog');
const stateF = G.state, districts = G.districts.features;
const forestDiv = new Set(['1', '5']);
const DIVCOL = { '1': '#2f8f5b', '2': '#3a7bd5', '3': '#d07a2b', '4': '#c04a6b', '5': '#7b5bd6' };

function bg(t, k) {
  const g = ctx.createRadialGradient(W * .55, H * .48, 50, W * .55, H * .48, 1150);
  g.addColorStop(0, '#10264a'); g.addColorStop(.55, '#08152e'); g.addColorStop(1, '#030816');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const sa = clamp(1 - (Math.log(k) - Math.log(800)) / (Math.log(3000) - Math.log(800)));
  if (sa > 0) {
    for (const s of stars) { ctx.globalAlpha = sa * (.35 + .65 * Math.abs(Math.sin(t * 1.3 + s[3] * 20))) * .8; ctx.fillStyle = '#cfe6ff'; ctx.fillRect(s[0], s[1], s[2], s[2]); }
    ctx.globalAlpha = 1;
  }
}
function gridOverlay(t, a) { // GIS graticule-like screen grid
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(111,211,255,.06)'; ctx.lineWidth = 1;
  const o = (t * 6) % 160; ctx.beginPath();
  for (let x = -o; x < W; x += 160) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = -o * .6; y < H; y += 160) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke(); ctx.restore();
}
function globe(t, c, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  // atmosphere
  const r = c.k; if (r < 3000) {
    const g = ctx.createRadialGradient(c.cx, c.cy, r * .9, c.cx, c.cy, r * 1.25);
    g.addColorStop(0, 'rgba(80,160,255,.35)'); g.addColorStop(1, 'rgba(80,160,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.cx, c.cy, r * 1.25, 0, 7); ctx.fill();
    const g2 = ctx.createRadialGradient(c.cx - r * .3, c.cy - r * .3, r * .1, c.cx, c.cy, r);
    g2.addColorStop(0, '#163566'); g2.addColorStop(1, '#091a38'); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(c.cx, c.cy, r, 0, 7); ctx.fill();
  }
  // graticule
  ctx.beginPath(); path(d3.geoGraticule10()); ctx.strokeStyle = 'rgba(111,211,255,.12)'; ctx.lineWidth = 1; ctx.stroke();
  // land dots
  const ds = clamp(r / 220, 1.2, 3.2); ctx.fillStyle = '#5f9ee6';
  for (const d of G.dots) { const p = proj(d); if (!p) continue; if (d3.geoDistance(d, [c.lon, c.lat]) > 1.55) continue; ctx.fillRect(p[0] - ds / 2, p[1] - ds / 2, ds, ds); }
  ctx.restore();
}
function strokeF(f, col, lw, a = 1) { ctx.beginPath(); path(f); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.globalAlpha = 1; }
function fillF(f, col, a = 1) { ctx.beginPath(); path(f); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; }
function drawPartial(feat, p, col, lw, glow) { // path-drawing via dash
  if (p <= 0) return; ctx.save(); ctx.beginPath(); path(feat); ctx.setLineDash([p * 6000, 6000]); ctx.strokeStyle = col; ctx.lineWidth = lw;
  if (glow) { ctx.shadowColor = col; ctx.shadowBlur = glow; } ctx.stroke(); ctx.restore();
}

/* the Chhattisgarh map in "night" style */
function cgMap(t, c, o) {
  const a = o.a ?? 1;
  if (o.india > 0) { fillF(G.india, '#0f2650', .55 * o.india * a); drawPartial(G.india, o.india, 'rgba(140,200,255,.85)', 1.6, 8); }
  if (o.nb > 0) { ctx.save(); ctx.globalAlpha = o.nb * a * .5; for (const f of G.admin1.features) if (f.properties.name !== 'Chhattisgarh') { ctx.beginPath(); path(f); ctx.strokeStyle = 'rgba(111,170,230,.45)'; ctx.lineWidth = 1; ctx.stroke(); } ctx.restore(); }
  if (o.state > 0) {
    ctx.save(); ctx.globalAlpha = a * o.state; ctx.beginPath(); path(stateF);
    const g = ctx.createLinearGradient(c.cx - 300, c.cy - 400, c.cx + 300, c.cy + 400); g.addColorStop(0, o.light ? '#f2f6fb' : '#1d4a86'); g.addColorStop(1, o.light ? '#dfe7f2' : '#123264');
    ctx.fillStyle = g; ctx.shadowColor = o.light ? 'rgba(0,0,0,.5)' : 'rgba(90,170,255,.6)'; ctx.shadowBlur = o.light ? 40 : 30; ctx.fill(); ctx.restore();
  }
  if (o.dist > 0) { ctx.save(); ctx.globalAlpha = a; for (const f of districts) { ctx.beginPath(); path(f); ctx.setLineDash([o.dist * 2500, 2500]); ctx.strokeStyle = o.light ? 'rgba(40,60,90,.55)' : 'rgba(170,215,255,.55)'; ctx.lineWidth = o.light ? 1.1 : 1; ctx.stroke(); } ctx.restore(); }
  if (o.edge > 0) { ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); path(stateF); ctx.setLineDash([o.edge * 9000, 9000]); ctx.strokeStyle = o.light ? '#30486e' : '#bfe6ff'; ctx.lineWidth = o.light ? 2 : 2.2; ctx.shadowColor = '#6fd3ff'; ctx.shadowBlur = o.light ? 0 : 14; ctx.stroke(); ctx.restore(); }
}

/* ---------------- layers scene (pseudo-3D stack) ---------------- */
const LC = Array.from({ length: 5 }, () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
function drawLayer(i, c) {
  const L = LC[i], x = L.getContext('2d'); x.clearRect(0, 0, W, H);
  const pp = d3.geoPath(proj, x);
  const plate = (fill, a) => { x.beginPath(); pp(stateF); x.globalAlpha = a; x.fillStyle = fill; x.fill(); x.globalAlpha = 1; };
  const edge = (col) => { x.beginPath(); pp(stateF); x.strokeStyle = col; x.lineWidth = 2.2; x.stroke(); };
  if (i === 0) { plate('#173f78', .95); for (const f of districts) { x.beginPath(); pp(f); x.strokeStyle = 'rgba(190,225,255,.6)'; x.lineWidth = 1.1; x.stroke(); } edge('#bfe6ff'); }
  if (i === 1) { plate('#0d2a1f', .55); for (const f of districts) { x.beginPath(); pp(f); x.fillStyle = forestDiv.has(f.properties.div_code) ? 'rgba(52,168,96,.85)' : 'rgba(52,168,96,.35)'; x.fill(); x.strokeStyle = 'rgba(160,240,190,.35)'; x.lineWidth = .8; x.stroke(); } edge('#6fe0a0'); }
  if (i === 2) { plate('#0a2244', .45); x.save(); x.beginPath(); pp(stateF); x.clip(); x.beginPath(); pp(G.rivers); x.strokeStyle = '#5ec8ff'; x.lineWidth = 3; x.shadowColor = '#5ec8ff'; x.shadowBlur = 10; x.stroke(); x.restore(); edge('#5ec8ff'); }
  if (i === 3) { plate('#2a1a08', .4); x.save(); x.beginPath(); pp(stateF); x.clip(); x.beginPath(); pp(G.roads); x.strokeStyle = '#ffb347'; x.lineWidth = 2.4; x.stroke(); x.beginPath(); pp(G.rail); x.setLineDash([6, 4]); x.strokeStyle = '#ffd98a'; x.lineWidth = 1.6; x.stroke(); x.restore(); edge('#ffb347'); }
  if (i === 4) { plate('#1c1430', .4); x.fillStyle = '#ffd98a'; for (let k = 0; k < 2600; k++) { const p = proj(G.villages[k * 5]); if (p) x.fillRect(p[0] - 1.3, p[1] - 1.3, 2.6, 2.6); } edge('#ffd98a'); }
}
function layerStack(t, c, tilt, expl, merge) {
  const N = 5;
  for (let i = 0; i < N; i++) drawLayer(i, c);
  const th = -tilt * 64 * Math.PI / 180, sy = 1 - tilt * .56;
  for (let i = 0; i < N; i++) {
    const lift = expl * (i - 2) * 150 * (1 - merge);
    const ap = i === 0 ? 1 : clamp(expl * 1.4 - i * .12) * (1 - merge) + merge * (i === 0 ? 1 : .55);
    ctx.save(); ctx.globalAlpha = clamp(ap);
    ctx.translate(c.cx, c.cy - lift); ctx.scale(1, sy); ctx.rotate(th); ctx.translate(-c.cx, -c.cy);
    if (tilt > .05) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30 * tilt; ctx.shadowOffsetY = 18 * tilt; }
    ctx.drawImage(LC[i], 0, 0); ctx.restore();
  }
}

/* ---------------- text system ---------------- */
const ICON = {
  labor: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6b73c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/></svg>',
  time: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6b73c" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6b73c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5h10M7 9h10M9 5c4 0 6 2 6 4s-2 4-6 4H7l7 7"/></svg>',
  road: '<svg viewBox="0 0 24 24" fill="none" stroke="#6fd3ff" stroke-width="2" stroke-linecap="round"><path d="M8 3 5 21M16 3l3 18M12 4v3M12 10v3M12 16v4"/></svg>'
};
const T = {
  intro: { x: 120, bottom: 110, w: 860, tIn: .8, tOut: 15.2, kick: 'छत्तीसगढ़ · जी.आई.एस.', ttl: 'भौगोलिक सूचना प्रणाली',
    body: 'भौगोलिक सूचना प्रणाली (जी.आई.एस.) का उपयोग विभिन्न विभागों की परियोजनाएं तैयार करने, भूमि या भौगोलिक परिवर्तनों के तुलनात्मक अध्ययन करने, _जंगल,_ _जल~संग्रहण,_ _हरियाली,_ _मिट्टी~एवं~उर्वरता_ आदि का विश्लेषण करने में किया जाता है ।' },
  obj: { x: 1250, y: 250, w: 610, tIn: 18.2, tOut: 29.2, kick: 'उद्देश्य',
    body: 'भौगोलिक सूचना प्रणाली *सटीक* और *वास्तविकता~के~निकट* होने के कारण योजना निर्माण और मूल्यांकन हेतु जी.आई.एस. का उपयोग कर शासन के बहुमूल्य _श्रम,~समय~और~धन~की~बचत_ करना मुख्य उद्देश्य है ।',
    chips: [['labor', 'श्रम'], ['time', 'समय'], ['money', 'धन']] },
  a1: { x: 110, y: 170, w: 580, tIn: 31.0, tOut: 41.4, n: '01', kick: 'उपलब्धियां', big: 100, suf: '+', unit: 'जी.आई.एस. आधारित डेटाबेस',
    body: '*प्रधानमंत्री~गति~शक्ति~योजना* अंतर्गत ऑनलाइन माध्यम से राज्य के 100 से अधिक जी.आई.एस. आधारित डेटाबेस भास्कराचार्य राष्ट्रीय अंतरिक्ष अनुप्रयोग और भू-सूचना विज्ञान संस्थान _(BiSAG-N)_ को साझा किया जा रहा है ।' },
  a2: { x: 110, y: 190, w: 700, tIn: 45.6, tOut: 53.4, n: '02', kick: 'उपलब्धियां', big: 15000, suf: '+', unit: 'ग्रामों के खसरा-नक्शों का जियो-रिफरेंसिंग', countAt: 49.8, countDur: 3.2,
    body: 'राज्य के 15 हजार से अधिक ग्रामों के खसरा-नक्शों का जियो-रिफरेंसिंग कार्य पूर्ण किया गया है, जिसे *प्रधानमंत्री~गति~शक्ति~योजना* हेतु _BISAG-N_ को साझा किया गया और राज्य स्तर पर _एग्रीस्टेक~परियोजना_ के सफल क्रियान्वयन हेतु उपयोग किया जा रहा है ।' },
  a3: { x: 110, y: 260, w: 580, tIn: 55.2, tOut: 63.4, n: '03', kick: 'उपलब्धियां', h2: 'राज्य-स्तरीय जियो-पोर्टल',
    body: '*छत्तीसगढ़~सेंटर~ऑफ़~जियो-इन्फार्मेटिक्स* परियोजना अंतर्गत _राज्य-स्तरीय~जियो-पोर्टल_ का निर्माण किया गया है ।' },
  a4: { x: 110, y: 200, w: 600, tIn: 64.8, tOut: 73.2, n: '04', kick: 'उपलब्धियां', big: 5, suf: '', unit: 'विभागीय जियो-पोर्टल',
    body: '5 विभागों हेतु विभागीय भौगोलिक सूचना प्रणाली आधारित डाटा एवं जानकारी के _विश्लेषण_ एवं _परियोजना~क्रियान्वयन_ एवं निर्माण हेतु *निर्णय~लेने~में~सहयोग* हेतु विभागीय जिओ-पोर्टल का निर्माण किया गया है ।' },
  a5: { x: 110, y: 250, w: 620, tIn: 74.8, tOut: 83.6, n: '05', kick: 'उपलब्धियां', h2: 'सड़क डेटाबेस',
    body: '*लोक~निर्माण~विभाग,* _प्रधान~मंत्री~ग्रामीण~सड़क~योजना_ और _मुख्यमंत्री~ग्रामीण~सड़क~योजना_ हेतु भौगोलिक सूचना प्रणाली आधारित डेटा बेस का निर्माण पूर्ण किया गया है ।',
    chips: [['road', 'लोक निर्माण विभाग'], ['road', 'PMGSY'], ['road', 'MMGSY']] },
  a6: { x: 110, y: 290, w: 600, tIn: 85.0, tOut: 93.4, n: '06', kick: 'उपलब्धियां', h2: 'जनजाति आधारित एटलस',
    body: '*आदिमजाति~अनुसन्धान~एवं~प्रशिक्षण~संस्थान* के लिए _जनजाति~आधारित~एटलस_ हेतु मानचित्रों का निर्माण किया गया ।' }
};
function words(str) {
  return str.split(' ').map(tok => {
    let cls = ''; if (/^\*.*\*[,.]?$/.test(tok)) { cls = 'hl'; tok = tok.replace(/\*/g, '') } else if (/^_.*_[,.]?$/.test(tok)) { cls = 'hg'; tok = tok.replace(/_/g, '') }
    return tok.split('~').map((w, i, arr) => `<span class="w ${cls}">${w}${i < arr.length - 1 ? ' ' : ''}</span>`).join('')
  }).join('<span class="w"> </span>');
}
for (const [id, c] of Object.entries(T)) {
  const tx = document.createElement('div'); tx.className = 'txt'; tx.style.cssText = `left:${c.x}px;width:${c.w}px;` + (c.bottom ? `bottom:${c.bottom}px` : `top:${c.y}px`);
  let h = `<div class="kick"><b></b><span>${c.kick}</span>${c.n ? `<span class="n">${c.n}</span>` : ''}</div>`;
  if (c.ttl) h += `<h1 class="ttl">${c.ttl}</h1>`;
  if (c.big !== undefined) h += `<div class="big"><span class="num">0</span><span class="shine">0</span></div><div class="unit">${c.unit}</div>`;
  if (c.h2) h += `<div class="h2">${c.h2}</div>`;
  h += `<p class="body">${words(c.body)}</p>`;
  if (c.chips) h += `<div class="chips">${c.chips.map(k => `<div class="chip ${id === 'obj' ? 'g' : ''}">${ICON[k[0]]}<span>${k[1]}</span></div>`).join('')}</div>`;
  tx.innerHTML = h; dom.appendChild(tx); c.el = tx;
}
const fmt = n => n >= 1000 ? n.toLocaleString('en-IN') : String(n);
function textAnim(c, t) {
  const tx = c.el, a = c.tIn, o = c.tOut;
  const vis = t > a - .1 && t < o + .8; tx.style.display = vis ? 'block' : 'none'; if (!vis) return;
  const out = eio(lin(t, o, o + .7));
  tx.style.opacity = 1 - out; tx.style.transform = `translateY(${-30 * out}px)`; tx.style.filter = out > 0 ? `blur(${8 * out}px)` : 'none';
  tx.querySelector('.kick b').style.transform = `scaleX(${eo(lin(t, a, a + .6))})`; tx.querySelector('.kick').style.opacity = lin(t, a, a + .4);
  let cur = a + .35;
  const ttl = tx.querySelector('.ttl');
  if (ttl) { const p = eo5(lin(t, cur, cur + 1)); ttl.style.opacity = p; ttl.style.transform = `translateY(${40 * (1 - p)}px)`; ttl.style.clipPath = `inset(-20% ${100 - 100 * eo(lin(t, cur, cur + 1.1))}% -20% 0)`; cur += .9; }
  const big = tx.querySelector('.big');
  if (big) {
    const p = c.countAt ? eo5(lin(t, c.countAt - .4, c.countAt + .2)) : eo5(lin(t, cur, cur + .6)); big.style.opacity = p; big.style.transform = `translateY(${30 * (1 - p)}px) scale(${.92 + .08 * p})`;
    const ca = c.countAt ?? cur, cd = c.countDur ?? 1.8; const k = eo5(lin(t, ca, ca + cd)); const v = Math.round(c.big * k); const s2 = fmt(v) + (k >= 1 ? c.suf : '');
    big.querySelector('.num').textContent = s2; const sh = big.querySelector('.shine'); sh.textContent = s2;
    const sp = lin(t, ca + cd, ca + cd + .8); sh.style.backgroundPosition = `${100 - 150 * sp + 50}% 0`; sh.style.opacity = sp > 0 && sp < 1 ? 1 : 0;
    const u = tx.querySelector('.unit'); const pu = eo5(lin(t, cur + .4, cur + 1.1)); u.style.opacity = pu; u.style.transform = `translateX(${-20 * (1 - pu)}px)`; cur += .9;
  }
  const h2 = tx.querySelector('.h2');
  if (h2) { const p = eo5(lin(t, cur, cur + .8)); h2.style.opacity = p; h2.style.transform = `translateY(${30 * (1 - p)}px)`; h2.style.clipPath = `inset(-10% ${100 - 100 * eo(lin(t, cur, cur + .9))}% -20% 0)`; cur += .6; }
  const ws = tx.querySelectorAll('.body .w'); const n = ws.length, dur = Math.min(2.6, n * .06);
  ws.forEach((w, i) => { const st = cur + dur * i / n; const p = eo(lin(t, st, st + .45)); w.style.opacity = p; w.style.transform = `translateY(${14 * (1 - p)}px)`; w.style.filter = p < 1 ? `blur(${4 * (1 - p)}px)` : 'none'; });
  cur += dur;
  tx.querySelectorAll('.chip').forEach((ch, i) => { const st = cur + .2 + i * .18; const p = eo5(lin(t, st, st + .6)); ch.style.opacity = p; ch.style.transform = `translateY(${24 * (1 - p)}px) scale(${.9 + .1 * p})`; });
}

/* ---------------- satellite ---------------- */
function satellite(t, c, a) {
  if (a <= 0) return;
  const ang = -2.2 + t * .22, R = c.k * 1.32;
  const sx = c.cx + Math.cos(ang) * R, sy = c.cy + Math.sin(ang) * R * .42 - c.k * .55;
  const tgt = proj([81.6, 21.3]);
  ctx.save(); ctx.globalAlpha = a;
  if (tgt && t > 3.5) { const ba = clamp((t - 3.5) / 1.2) * .5; const g = ctx.createLinearGradient(sx, sy, tgt[0], tgt[1]); g.addColorStop(0, `rgba(255,230,160,${ba})`); g.addColorStop(1, 'rgba(255,230,160,0.02)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - 4, sy); ctx.lineTo(tgt[0] - 26, tgt[1]); ctx.lineTo(tgt[0] + 26, tgt[1]); ctx.lineTo(sx + 4, sy); ctx.fill();
    ctx.strokeStyle = `rgba(255,220,140,${ba * 1.6})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(tgt[0], tgt[1], 28, 9, 0, 0, 7); ctx.stroke(); }
  ctx.translate(sx, sy); ctx.rotate(-.5);
  ctx.fillStyle = '#2f6fb8'; ctx.strokeStyle = '#9cc8ff'; ctx.lineWidth = 1;
  for (const s of [-1, 1]) { ctx.fillRect(s > 0 ? 14 : -52, -9, 38, 18); ctx.strokeRect(s > 0 ? 14 : -52, -9, 38, 18); for (let k = 1; k < 4; k++) { ctx.beginPath(); const x0 = (s > 0 ? 14 : -52) + k * 9.5; ctx.moveTo(x0, -9); ctx.lineTo(x0, 9); ctx.stroke(); } }
  ctx.fillStyle = '#f0dfb0'; ctx.fillRect(-12, -12, 24, 24); ctx.fillStyle = '#c99a3c'; ctx.fillRect(-12, -12, 24, 7);
  ctx.fillStyle = '#ff5a4a'; ctx.beginPath(); ctx.arc(0, -16, 2.5, 0, 7); ctx.fill();
  ctx.restore();
}

/* ---------------- A1: data packets to BISAG-N ---------------- */
const NODE = [1640, 690];
const packets = Array.from({ length: 140 }, (_, i) => ({ v: G.villages[(i * 97) % 15000], d: rnd() * 3.2, s: .9 + rnd() * .6, bend: (rnd() - .5) * 260 }));
function shareScene(t, c) {
  const a = lin(t, 33.5, 34.5) * (1 - lin(t, 41.0, 41.8)); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  // node
  const pulse = (t * 1.2) % 1;
  ctx.strokeStyle = `rgba(246,183,60,${.6 * (1 - pulse)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(NODE[0], NODE[1], 40 + pulse * 60, 0, 7); ctx.stroke();
  const g = ctx.createRadialGradient(NODE[0], NODE[1], 0, NODE[0], NODE[1], 46); g.addColorStop(0, '#fff3cf'); g.addColorStop(.5, '#f6b73c'); g.addColorStop(1, 'rgba(246,183,60,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(NODE[0], NODE[1], 46, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '700 34px ML'; ctx.textAlign = 'center'; ctx.fillText('BISAG-N', NODE[0], NODE[1] + 88);
  ctx.fillStyle = '#b9cbe6'; ctx.font = '600 24px M'; ctx.fillText('पीएम गति शक्ति', NODE[0], NODE[1] + 122);
  // packets
  for (const p of packets) {
    const st = 34.2 + p.d; const life = (t - st) * p.s; if (life < 0) continue; const u = life % 1.6 / 1.6; if (t - st > 6.5) continue;
    const s = proj(p.v); if (!s) continue;
    const mx = (s[0] + NODE[0]) / 2, my = Math.min(s[1], NODE[1]) - 160 + p.bend * .3;
    const q = (k) => [(1 - k) * (1 - k) * s[0] + 2 * (1 - k) * k * mx + k * k * NODE[0], (1 - k) * (1 - k) * s[1] + 2 * (1 - k) * k * my + k * k * NODE[1]];
    ctx.strokeStyle = 'rgba(111,211,255,.10)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.quadraticCurveTo(mx, my, NODE[0], NODE[1]); ctx.stroke();
    const e = eio(u); const P = q(e), P2 = q(Math.max(0, e - .06));
    ctx.strokeStyle = 'rgba(255,217,138,.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(P2[0], P2[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(P[0] - 1.5, P[1] - 1.5, 3, 3);
  }
  ctx.restore();
}
function layersBadge(t, c) { // "185+ layers" over the map
  const a = lin(t, 31.4, 32.4) * (1 - lin(t, 41.0, 41.8)); if (a <= 0) return;
  const k = eo5(lin(t, 31.6, 33.6)); const v = Math.round(185 * k) + (k >= 1 ? '+' : '');
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.font = '800 120px ML'; ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,10,30,.8)'; ctx.shadowBlur = 24; ctx.fillText(v, 1300, 300); const w = ctx.measureText(v).width;
  ctx.font = '600 40px ML'; ctx.fillStyle = '#b9cbe6'; ctx.fillText('layers', 1310 + w, 300); ctx.restore();
}

/* ---------------- A2: khasra georeferencing ---------------- */
const sheet = document.createElement('canvas'); sheet.width = 900; sheet.height = 700;
const SB = [81.55, 21.14, 81.73, 21.29]; // sheet bounds (lon/lat)
(function drawSheet() {
  const x = sheet.getContext('2d'); x.fillStyle = '#efe4c8'; x.fillRect(0, 0, 900, 700);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(120,90,40,${rnd() * .06})`; x.fillRect(rnd() * 900, rnd() * 700, 2, 2); }
  x.strokeStyle = 'rgba(110,70,30,.75)'; x.lineWidth = 1.2;
  for (const pg of G.parcels) { x.beginPath(); pg.forEach((p, i) => { const X = (p[0] - SB[0]) / (SB[2] - SB[0]) * 900, Y = (SB[3] - p[1]) / (SB[3] - SB[1]) * 700; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); x.stroke(); }
  x.strokeStyle = 'rgba(110,70,30,.9)'; x.lineWidth = 6; x.strokeRect(14, 14, 872, 672);
  x.fillStyle = 'rgba(90,60,25,.85)'; x.font = '700 30px M'; x.fillText('खसरा नक्शा', 40, 62); x.font = '500 20px M'; x.fillText('ग्राम · प. ह. नं. —', 40, 92);
})();
function georef(t, c) {
  const a = lin(t, 44.8, 45.6) * (1 - lin(t, 50.2, 51.2)); if (a <= 0) return;
  const P = (lon, lat) => proj([lon, lat]);
  // parcels on the map (target)
  const snap = eio(lin(t, 47.0, 49.2));
  ctx.save(); ctx.globalAlpha = a;
  const pc = Math.floor(G.parcels.length * lin(t, 45.0, 46.4));
  ctx.strokeStyle = `rgba(111,211,255,${.18 + .55 * snap})`; ctx.lineWidth = 1;
  const ctrP = P(81.64, 21.215), rad = Math.abs(P(81.78, 21.215)[0] - ctrP[0]);
  for (let i = 0; i < pc; i++) { const pg = G.parcels[i]; const q0 = P(pg[0][0], pg[0][1]); const fd = clamp(1.25 - Math.hypot(q0[0] - ctrP[0], q0[1] - ctrP[1]) / rad); if (fd <= 0) continue; ctx.globalAlpha = a * fd; ctx.beginPath(); pg.forEach((p, j) => { const q = P(p[0], p[1]); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke(); }
  // sheet affine: from wrong to correct
  const tl = P(SB[0], SB[3]), tr = P(SB[2], SB[3]), bl = P(SB[0], SB[1]);
  const ux = [(tr[0] - tl[0]) / 900, (tr[1] - tl[1]) / 900], vy = [(bl[0] - tl[0]) / 700, (bl[1] - tl[1]) / 700];
  const ang = mix(-.26, 0, snap), sc = mix(.78, 1, snap), off = [mix(-170, 0, snap), mix(110, 0, snap)];
  const cxs = (tl[0] + tr[0] + bl[0] * 0 + tr[0]) / 3, cys = (tl[1] + bl[1]) / 2;
  const sIn = eo5(lin(t, 45.4, 46.4)), sOut = eo(lin(t, 48.9, 49.3));
  ctx.save(); ctx.globalAlpha = a * sIn * (1 - sOut);
  ctx.translate(cxs + off[0], cys + off[1]); ctx.rotate(ang); ctx.scale(sc, sc); ctx.translate(-cxs, -cys);
  ctx.transform(ux[0], ux[1], vy[0], vy[1], tl[0], tl[1]);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40 * (1 - snap); ctx.drawImage(sheet, 0, 0);
  ctx.restore();
  // GCPs
  const gcp = [[81.585, 21.27], [81.70, 21.262], [81.71, 21.16], [81.575, 21.165]];
  const gA = lin(t, 46.2, 46.7) * (1 - lin(t, 49.2, 49.8));
  gcp.forEach((g, i) => {
    const tgt = P(g[0], g[1]);
    // where this point sits on the wrong sheet
    const rx = tgt[0] - cxs, ry = tgt[1] - cys; const w = [cxs + off[0] + (rx * Math.cos(ang) - ry * Math.sin(ang)) * sc, cys + off[1] + (rx * Math.sin(ang) + ry * Math.cos(ang)) * sc];
    const pi = eo5(lin(t, 46.2 + i * .15, 46.8 + i * .15));
    ctx.globalAlpha = a * gA * pi;
    ctx.setLineDash([6, 6]); ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(tgt[0], tgt[1]); ctx.stroke(); ctx.setLineDash([]);
    for (const [p, col] of [[w, '#ff6b5a'], [tgt, '#6fd3ff']]) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], 11, 0, 7); ctx.moveTo(p[0] - 18, p[1]); ctx.lineTo(p[0] + 18, p[1]); ctx.moveTo(p[0], p[1] - 18); ctx.lineTo(p[0], p[1] + 18); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.font = '700 18px ML'; ctx.fillText('GCP ' + (i + 1), tgt[0] + 16, tgt[1] - 14);
  });
  // lock flash
  const lk = lin(t, 49.1, 49.7); if (lk > 0 && lk < 1) { ctx.globalAlpha = (1 - lk) * .8 * a; ctx.strokeStyle = '#6fd3ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.rect(tl[0] - 20 * lk, tl[1] - 20 * lk, tr[0] - tl[0] + 40 * lk, bl[1] - tl[1] + 40 * lk); ctx.stroke(); }
  ctx.restore();
}
function villagesLight(t, c) {
  const a = lin(t, 49.6, 50.4) * (1 - lin(t, 53.6, 54.4)); if (a <= 0) return;
  const n = Math.floor(15000 * eo5(lin(t, 49.8, 53.0)));
  ctx.save(); ctx.globalAlpha = a; const s = clamp(c.k / 4000, 1.2, 3);
  ctx.fillStyle = 'rgba(255,217,138,.9)';
  for (let i = 0; i < n; i++) { const p = proj(G.villages[i]); if (p) ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s); }
  // ripple front
  const fr = G.villages[Math.max(0, n - 1)]; const ro = proj(G.RAI);
  if (ro && n < 15000) { const pf = proj(fr); const rr = Math.hypot(pf[0] - ro[0], pf[1] - ro[1]); ctx.strokeStyle = 'rgba(255,217,138,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ro[0], ro[1], rr, 0, 7); ctx.stroke(); }
  ctx.restore();
}

/* ---------------- A3: portal (DOM + canvas) ---------------- */
const portal = document.createElement('div'); portal.className = 'portal';
const ROWS = [['जिला सीमा', '#bfe6ff'], ['नदियाँ', '#5ec8ff'], ['सड़क एवं रेल', '#ffb347'], ['आंगनबाड़ी केंद्र', '#7aa2ff'], ['भारतनेट जीपी नोड', '#3fe0c5'], ['खनिज पट्टे', '#ff7aa8']];
portal.innerHTML = `<div class="hdr"><img src="assets/chips-logo.jpg"><b>छत्तीसगढ़ राज्य जियो-पोर्टल</b><span>⌕ जिला, ग्राम या रिकॉर्ड खोजें</span></div>
<div class="side"><h6>लेयर्स</h6>${ROWS.map(r => `<div class="row"><div class="sw"></div><span>${r[0]}</span><i class="lg" style="background:${r[1]}"></i></div>`).join('')}</div><canvas width="780" height="616"></canvas>`;
dom.appendChild(portal);
const pcv = portal.querySelector('canvas'), px = pcv.getContext('2d');
const pproj = d3.geoOrthographic().clipAngle(90).precision(.3), ppath = d3.geoPath(pproj, px);
const aw = G.villages.filter((_, i) => i % 9 === 0).slice(0, 1400), gpN = G.villages.filter((_, i) => i % 61 === 3).slice(0, 220);
const gpEdges = (() => { const n = gpN.length, inT = Array(n).fill(false), d = Array(n).fill(1e9), p = Array(n).fill(-1), e = []; d[0] = 0; for (let k = 0; k < n; k++) { let u = -1; for (let i = 0; i < n; i++) if (!inT[i] && (u < 0 || d[i] < d[u])) u = i; inT[u] = true; if (p[u] >= 0) e.push([p[u], u]); for (let v = 0; v < n; v++) if (!inT[v]) { const dd = Math.hypot(gpN[u][0] - gpN[v][0], gpN[u][1] - gpN[v][1]); if (dd < d[v]) { d[v] = dd; p[v] = u; } } } return e; })();
const mines = Array.from({ length: 26 }, () => { const v = G.villages[Math.floor(rnd() * 15000)]; return [v, .03 + rnd() * .05, rnd()]; });
function portalScene(t) {
  const on = t > 53.6 && t < 64.6; portal.style.display = on ? 'block' : 'none'; if (!on) return;
  const pin = eo5(lin(t, 53.8, 55.2)), pout = eio(lin(t, 63.4, 64.4));
  const life = lin(t, 54, 64);
  portal.style.opacity = pin * (1 - pout);
  portal.style.transform = `rotateY(${-22 + 14 * life - 30 * pout}deg) rotateX(${6 - 4 * life}deg) translateZ(${-260 * (1 - pin) - 200 * pout}px) translateX(${160 * (1 - pin)}px)`;
  const toggles = [55.0, 56.6, 57.6, 58.6, 59.6, 60.6];
  portal.querySelectorAll('.row').forEach((r, i) => { const k = eo5(lin(t, toggles[i], toggles[i] + .35)); r.querySelector('.sw').style.background = k > .5 ? ROWS[i][1] : '#26385a'; r.querySelector('.sw').style.setProperty('--k', (20 * k) + 'px'); r.style.background = (t > toggles[i] && t < toggles[i] + .8) ? 'rgba(111,211,255,.12)' : 'transparent'; });
  const z = Math.exp(mix(Math.log(5400), Math.log(7600), eio(lin(t, 60.8, 63.4))));
  pproj.rotate([-82.15, -21.25]).scale(z).translate([390, 308]);
  const g = px.createRadialGradient(390, 300, 20, 390, 300, 600); g.addColorStop(0, '#11284d'); g.addColorStop(1, '#07142b'); px.fillStyle = g; px.fillRect(0, 0, 780, 616);
  px.strokeStyle = 'rgba(111,211,255,.06)'; px.beginPath(); for (let x = 0; x < 780; x += 60) { px.moveTo(x, 0); px.lineTo(x, 616); } for (let y = 0; y < 616; y += 60) { px.moveTo(0, y); px.lineTo(780, y); } px.stroke();
  px.beginPath(); ppath(stateF); px.fillStyle = '#163c72'; px.fill(); px.strokeStyle = '#bfe6ff'; px.lineWidth = 2; px.stroke();
  const L = i => eo(lin(t, toggles[i], toggles[i] + .6));
  if (L(0)) { px.globalAlpha = L(0); px.strokeStyle = 'rgba(190,225,255,.55)'; px.lineWidth = 1; for (const f of districts) { px.beginPath(); ppath(f); px.stroke(); } px.globalAlpha = 1; }
  if (L(1)) { px.save(); px.beginPath(); ppath(G.rivers); px.setLineDash([L(1) * 3000, 3000]); px.strokeStyle = '#5ec8ff'; px.lineWidth = 2.2; px.shadowColor = '#5ec8ff'; px.shadowBlur = 6; px.stroke(); px.restore(); }
  if (L(2)) { px.save(); px.setLineDash([L(2) * 3000, 3000]); px.beginPath(); ppath(G.roads); px.strokeStyle = '#ffb347'; px.lineWidth = 1.8; px.stroke(); px.beginPath(); ppath(G.rail); px.strokeStyle = '#ffd98a'; px.lineWidth = 1.2; px.stroke(); px.restore(); }
  if (L(3)) { const n = Math.floor(aw.length * L(3)); px.fillStyle = '#7aa2ff'; for (let i = 0; i < n; i++) { const p = pproj(aw[i]); px.fillRect(p[0] - 1.4, p[1] - 1.4, 2.8, 2.8); } }
  if (L(4)) { px.strokeStyle = 'rgba(63,224,197,.75)'; px.lineWidth = 1.2; const n = Math.floor(gpEdges.length * L(4)); px.beginPath(); for (let i = 0; i < n; i++) { const [u, v] = gpEdges[i]; const a = pproj(gpN[u]), b = pproj(gpN[v]); px.moveTo(a[0], a[1]); px.lineTo(b[0], b[1]); } px.stroke(); px.fillStyle = '#3fe0c5'; for (let i = 0; i < gpN.length * L(4); i++) { const p = pproj(gpN[i]); px.beginPath(); px.arc(p[0], p[1], 2.6, 0, 7); px.fill(); } }
  if (L(5)) { px.fillStyle = 'rgba(255,122,168,.55)'; px.strokeStyle = '#ff7aa8'; for (const [v, r, s] of mines) { const p = pproj(v); const rr = r * z / 57.3 * L(5); px.beginPath(); px.rect(p[0] - rr, p[1] - rr * .7, rr * 2, rr * 1.4); px.fill(); px.stroke(); } }
  // cursor
  const cu = [mix(520, 610, eio(lin(t, 58, 61))), mix(300, 360, eio(lin(t, 58, 61)))]; px.fillStyle = '#fff'; px.beginPath(); px.moveTo(cu[0], cu[1]); px.lineTo(cu[0] + 14, cu[1] + 34); px.lineTo(cu[0] + 19, cu[1] + 20); px.lineTo(cu[0] + 33, cu[1] + 16); px.closePath(); px.fill();
}

/* ---------------- A4: five departmental portals ---------------- */
const THEMES = [['#34a860', 'fill'], ['#5ec8ff', 'water'], ['#ffb347', 'roads'], ['#b98cff', 'points'], ['#3fe0c5', 'net']];
const cards = THEMES.map((th, i) => {
  const d = document.createElement('div'); d.className = 'pcard'; d.innerHTML = `<div class="bar" style="background:linear-gradient(90deg,${th[0]}33,transparent)"><i style="background:${th[0]}"></i><span>जियो-पोर्टल ${['१', '२', '३', '४', '५'][i]}</span></div><canvas width="420" height="496"></canvas>`;
  dom.appendChild(d);
  const c = d.querySelector('canvas'), x = c.getContext('2d'); const pr = d3.geoOrthographic().clipAngle(90).rotate([-82.15, -21.25]).scale(3300).translate([210, 248]); const pa = d3.geoPath(pr, x);
  x.fillStyle = '#0a1a36'; x.fillRect(0, 0, 420, 496);
  x.beginPath(); pa(stateF); x.fillStyle = '#143665'; x.fill();
  if (th[1] === 'fill') for (const f of districts) { x.beginPath(); pa(f); x.fillStyle = th[0]; x.globalAlpha = .25 + .6 * ((+f.properties.dt_code % 7) / 7); x.fill(); x.globalAlpha = 1; }
  if (th[1] === 'water') { x.beginPath(); pa(G.rivers); x.strokeStyle = th[0]; x.lineWidth = 2.4; x.stroke(); for (let k = 0; k < 500; k++) { const p = pr(G.villages[k * 23]); x.fillStyle = 'rgba(94,200,255,.55)'; x.fillRect(p[0] - 1, p[1] - 1, 2, 2); } }
  if (th[1] === 'roads') { x.beginPath(); pa(G.roads); x.strokeStyle = th[0]; x.lineWidth = 2; x.stroke(); x.beginPath(); pa(G.rail); x.strokeStyle = '#ffe0a0'; x.lineWidth = 1; x.stroke(); }
  if (th[1] === 'points') for (let k = 0; k < 900; k++) { const p = pr(G.villages[k * 13]); x.fillStyle = th[0]; x.fillRect(p[0] - 1.2, p[1] - 1.2, 2.4, 2.4); }
  if (th[1] === 'net') { x.strokeStyle = th[0]; x.lineWidth = 1; x.beginPath(); for (const [u, v] of gpEdges) { const a = pr(gpN[u]), b = pr(gpN[v]); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); } x.stroke(); }
  x.strokeStyle = 'rgba(190,225,255,.35)'; x.lineWidth = .7; for (const f of districts) { x.beginPath(); pa(f); x.stroke(); }
  x.beginPath(); pa(stateF); x.strokeStyle = th[0]; x.lineWidth = 2; x.stroke();
  return d;
});
function cardsScene(t) {
  const on = t > 63.6 && t < 74.4;
  cards.forEach((d, i) => {
    d.style.display = on ? 'block' : 'none'; if (!on) return;
    const pin = eo5(lin(t, 63.8 + i * .12, 65.2 + i * .12)), fan = eio(lin(t, 65.4, 67.2)), pout = eio(lin(t, 73.2, 74.2));
    const k = i - 2; const life = lin(t, 65, 73);
    const x = 1260 + k * fan * 175 - 210, y = 270 - Math.abs(k) * fan * -18;
    const ry = -k * 14 * fan - 8 + 6 * life, rz = k * 3 * fan;
    d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.zIndex = 10 - Math.abs(k);
    d.style.opacity = pin * (1 - pout);
    d.style.transform = `translateZ(${-Math.abs(k) * 120 * fan - 300 * (1 - pin) - 250 * pout}px) translateY(${(1 - pin) * 80 - 40 * Math.sin(t * 1.4 + i) * fan * .2}px) rotateY(${ry}deg) rotateZ(${rz}deg)`;
  });
}

/* ---------------- A5: roads ---------------- */
function roadsScene(t, c) {
  const a = lin(t, 74.2, 75.0) * (1 - lin(t, 84.2, 85.0)); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const p1 = eo(lin(t, 75.0, 78.0)), p2 = eo(lin(t, 76.0, 79.0));
  drawPartial(G.roads, p1, '#ffb347', clamp(c.k / 3000, 2, 5), 10);
  ctx.save(); ctx.beginPath(); path(G.rail); ctx.setLineDash([p2 * 6000, 6000]); ctx.strokeStyle = '#ffe0a0'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
  // rural network (MST) grows during zoom
  const g = lin(t, 79.0, 83.0);
  if (g > 0) {
    const R = G.rural; ctx.lineCap = 'round';
    for (const [u, v, d] of R.edges) {
      const st = d * .85; const q = clamp((g - st) / .15); if (q <= 0) continue;
      const A = proj(R.nodes[u]), B = proj(R.nodes[v]); if (!A || !B) continue;
      ctx.strokeStyle = 'rgba(255,200,120,.9)'; ctx.lineWidth = 2.2; ctx.shadowColor = '#ffb347'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(mix(A[0], B[0], q), mix(A[1], B[1], q)); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    for (let i = 0; i < R.nodes.length; i++) { const p = proj(R.nodes[i]); if (!p) continue; ctx.fillStyle = '#fff2c9'; ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, 7); ctx.fill(); }
  }
  ctx.restore();
}

/* ---------------- A6: atlas pages ---------------- */
const PAL = [['#1b7f5a', '#43b07a', '#7fd39b', '#b6e8c2', '#e3f5e6'], ['#7a3e9d', '#a35cc6', '#c890e0', '#e3c2f0', '#f4e6f9'], ['#a4471f', '#d0702f', '#eba05a', '#f5c993', '#fbe7cc'], ['#1d4f91', '#3b7ac4', '#74a8e0', '#b3d0f0', '#e2edf9']];
const pages = PAL.map((pal, i) => {
  const d = document.createElement('div'); d.className = 'page'; d.innerHTML = '<canvas width="640" height="760"></canvas>'; dom.appendChild(d);
  const x = d.querySelector('canvas').getContext('2d'); const pr = d3.geoOrthographic().clipAngle(90).rotate([-82.15, -21.25]).scale(4300).translate([320, 400]); const pa = d3.geoPath(pr, x);
  x.fillStyle = '#f3ecd9'; x.fillRect(0, 0, 640, 760);
  for (let k = 0; k < 4000; k++) { x.fillStyle = `rgba(120,90,40,${rnd() * .05})`; x.fillRect(rnd() * 640, rnd() * 760, 2, 2); }
  x.fillStyle = '#5a4630'; x.font = '700 28px M'; x.fillText('जनजाति एटलस', 36, 58); x.font = '600 18px ML'; x.fillStyle = '#8a7350'; x.fillText('PLATE ' + (i + 1), 36, 86);
  for (const f of districts) { x.beginPath(); pa(f); const v = (+f.properties.dt_code * (i + 3) + +f.properties.div_code * 2) % 5; x.fillStyle = pal[v]; x.fill(); x.strokeStyle = 'rgba(70,50,30,.55)'; x.lineWidth = .8; x.stroke(); }
  x.beginPath(); pa(stateF); x.strokeStyle = '#3d2f1f'; x.lineWidth = 2; x.stroke();
  if (i % 2) { x.beginPath(); pa(G.rivers); x.strokeStyle = 'rgba(40,110,170,.7)'; x.lineWidth = 1.6; x.stroke(); }
  pal.forEach((col, k) => { x.fillStyle = col; x.fillRect(440 + k * 34, 700, 34, 16); }); x.strokeStyle = '#5a4630'; x.strokeRect(440, 700, 170, 16);
  x.strokeStyle = '#5a4630'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(580, 120); x.lineTo(580, 160); x.moveTo(570, 132); x.lineTo(580, 120); x.lineTo(590, 132); x.stroke(); x.font = '700 18px ML'; x.fillStyle = '#5a4630'; x.fillText('N', 574, 180);
  return d;
});
function atlasScene(t) {
  const on = t > 84.0 && t < 94.6;
  const pin = eo5(lin(t, 84.2, 85.6)), pout = eio(lin(t, 93.2, 94.2));
  pages.forEach((d, i) => {
    d.style.display = on ? 'block' : 'none'; if (!on) return;
    const flip = eio(lin(t, 86.6 + i * 1.6, 87.8 + i * 1.6)); const last = i === pages.length - 1;
    const ang = last ? 0 : -178 * flip;
    d.style.left = (1180) + 'px'; d.style.top = (160 + (1 - pin) * 80) + 'px';
    d.style.zIndex = 20 - i + (flip > .5 ? -40 : 0);
    d.style.opacity = pin * (1 - pout);
    d.style.transform = `rotateY(${-16 + 6 * lin(t, 85, 93)}deg) rotateX(4deg) translateZ(${-i * 2}px) rotateY(${ang}deg)`;
    d.style.filter = `brightness(${1 - .35 * Math.sin(Math.PI * flip)})`;
  });
}

/* ---------------- outro ---------------- */
const outro = document.createElement('div'); outro.className = 'txt'; outro.style.cssText = 'left:0;right:0;top:640px;text-align:center';
outro.innerHTML = `<div class="kick" style="justify-content:center"><b></b><span>1–3 नवंबर 2026 · नवा रायपुर</span><b style="transform-origin:right"></b></div>
<div class="ttl" style="font-size:100px">छत्तीसगढ़ राज्योत्सव 2026</div><div class="rule" style="width:560px"></div>
<div class="sig" style="display:flex;align-items:center;justify-content:center;gap:28px"><div class="logo"><img src="assets/chips-logo.jpg"></div>
<div style="text-align:left"><div style="font:700 36px/1.25 M,ML;color:#fff">छत्तीसगढ़ सेंटर ऑफ़ जियो-इन्फार्मेटिक्स</div><div style="font:500 28px/1.3 M,ML;color:var(--soft)">चिप्स · जी.आई.एस. टीम</div></div></div>`;
dom.appendChild(outro);
function outroAnim(t) {
  const a = 97.6; const on = t > a - .1; outro.style.display = on ? 'block' : 'none'; if (!on) return;
  outro.querySelectorAll('.kick b').forEach(b => b.style.transform = `scaleX(${eo(lin(t, a, a + .7))})`);
  outro.querySelector('.kick').style.opacity = lin(t, a, a + .5);
  const tt = outro.querySelector('.ttl'); const p = eo5(lin(t, a + .3, a + 1.5)); tt.style.opacity = p; tt.style.transform = `translateY(${40 * (1 - p)}px)`; tt.style.letterSpacing = `${.06 * (1 - p)}em`;
  outro.querySelector('.rule').style.transform = `scaleX(${eo(lin(t, a + 1, a + 2))})`;
  const l = outro.querySelector('.sig'); const pl = eo5(lin(t, a + 1.6, a + 2.6)); l.style.opacity = pl; l.style.transform = `translateY(${24 * (1 - pl)}px)`;
  outro.style.opacity = 1 - lin(t, END - 1.4, END - .2);
}

/* ---------------- main render ---------------- */
window.TL = { END };
window.render = async function (t) {
  const c = cam(t); setProj(c);
  // A4/A3/A6 scenes push the main map back
  const mapDim = Math.max(lin(t, 53.4, 54.6) * (1 - lin(t, 73.6, 74.6)), lin(t, 84.0, 85.2) * (1 - lin(t, 93.6, 94.6)));
  bg(t, c.k);
  gridOverlay(t, clamp((Math.log(c.k) - Math.log(1500)) / 1.2) * .9);
  const globeA = 1 - clamp((Math.log(c.k) - Math.log(2600)) / (Math.log(6000) - Math.log(2600)));
  globe(t, c, globeA);
  satellite(t, c, clamp(lin(t, .5, 2) * (1 - lin(t, 7.5, 9.5))) + clamp(lin(t, 101.5, 103)) * 0);
  // map visibility
  const india = lin(t, 7.6, 10.4) * (1 - lin(t, 15.5, 17.0)) + lin(t, 95.2, 97.0) * (1 - lin(t, 101.5, 103.5));
  const nb = lin(t, 11, 13) * (1 - lin(t, 16, 17.5)) + lin(t, 94.5, 96) * (1 - lin(t, 99, 101));
  const light = t > 29.8 && t < 42.2;
  const lightMix = lin(t, 29.8, 31.0) * (1 - lin(t, 41.2, 42.2));
  const inLayers = t > 16.6 && t < 30.6;
  if (!inLayers) {
    const o = { india, nb, state: lin(t, 10.5, 12.5), dist: lin(t, 12.5, 15.0), edge: lin(t, 10.0, 13.0), a: 1 - mapDim * .8, light: lightMix > .5 };
    if (lightMix > 0 && lightMix < 1) { cgMap(t, c, { ...o, light: false, a: (1 - lightMix) }); cgMap(t, c, { ...o, light: true, a: lightMix }); }
    else cgMap(t, c, o);
  } else {
    const tilt = eio(lin(t, 16.8, 18.6)) * (1 - eio(lin(t, 28.0, 29.8)));
    const expl = eio(lin(t, 18.4, 20.8));
    const merge = eio(lin(t, 25.6, 27.8));
    layerStack(t, c, tilt, expl, merge);
    if (t > 29.0) { ctx.globalAlpha = lin(t, 29.4, 30.6); cgMap(t, c, { india: 0, nb: 0, state: 1, dist: 1, edge: 1, light: true }); ctx.globalAlpha = 1; }
  }
  if (t > 29 && t < 42.5) { // district labels on the light map
    const la = lin(t, 31.2, 32.6) * (1 - lin(t, 40.8, 41.8));
    if (la > 0) { ctx.save(); ctx.font = '600 15px ML'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(40,60,90,${.75 * la})`;
      districts.forEach((f, i) => { if (i % 2) return; const p = proj(d3.geoCentroid(f)); if (p) ctx.fillText(f.properties.district.split('-')[0], p[0], p[1]); }); ctx.restore(); }
  }
  layersBadge(t, c); shareScene(t, c);
  georef(t, c); villagesLight(t, c);
  roadsScene(t, c);
  // city pins on the CG map during intro arrival
  const pinA = lin(t, 14.0, 15.0) * (1 - lin(t, 16.4, 17.0));
  if (pinA > 0) { const r = proj([81.633, 21.237]); const pu = (t * 1.1) % 1; ctx.save(); ctx.globalAlpha = pinA; ctx.strokeStyle = `rgba(246,183,60,${1 - pu})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r[0], r[1], 8 + 40 * pu, 0, 7); ctx.stroke(); ctx.fillStyle = '#f6b73c'; ctx.beginPath(); ctx.arc(r[0], r[1], 6, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 26px M'; ctx.fillText('रायपुर', r[0] + 16, r[1] - 12); ctx.restore(); }
  // DOM scenes
  portalScene(t); cardsScene(t); atlasScene(t);
  for (const c2 of Object.values(T)) textAnim(c2, t);
  outroAnim(t);
  // overlays
  flashEl.style.opacity = Math.max(0, Math.sin(Math.PI * lin(t, 44.3, 45.1)) * .35, Math.sin(Math.PI * lin(t, 53.2, 54.0)) * .25);
  grainEl.src = 'assets/grain' + (Math.floor(t * 24) % 8) + '.png';
  bug.style.opacity = lin(t, 17.5, 18.5) * (1 - lin(t, END - 9, END - 8));
  prog.style.width = (100 * t / END) + '%'; prog.style.opacity = .85 * (1 - lin(t, END - 3, END - 2));
  // fade in/out
  if (t < .6) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .6})`; ctx.fillRect(0, 0, W, H); }
  document.body.style.opacity = 1 - lin(t, END - .8, END);
  await new Promise(r => requestAnimationFrame(() => r()));
};
