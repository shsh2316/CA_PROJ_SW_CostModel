/* ==================================================================
   Builds the 2-page A4 PDF "Benefits of the projects" for the HOD from the figures of derive_ca_projects_deck.js.

   Usage (Node 18+ with Playwright installed; Chromium prints the PDF, fonts are the site's own IBM Plex in web\assets\fonts):
     node derive_ca_projects_deck.js "CA_Projects_List_As_of_July_2026.xlsx" <folder> 2026-10-28
     node build_hod_benefits_pdf.js <folder>\deck_data.json <output.pdf> "28 October 2026"

   Every figure is marked STATED (quoted from the project list) or DERIVED (costed with the estimator's standard assumptions).
   Nothing is estimated beyond that: no frequencies are assumed, so no yearly rupee or FTE benefit is made up.
   ================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const [dataPath, outPdf, dateText] = process.argv.slice(2);
if (!dataPath || !outPdf) { console.error('Usage: node build_hod_benefits_pdf.js <deck_data.json> <output.pdf> [date text]'); process.exit(2); }
const D = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const FONTS = path.resolve(__dirname, '..', '..', 'web', 'assets', 'fonts');
const TODAY = dateText || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cr = (n) => n / 1e7;
const fCr = (n, d = 1) => '₹' + cr(n).toFixed(d) + ' Cr';
const fMoney = (n) => (Math.abs(n) >= 1e7 ? fCr(n, 2) : '₹' + (n / 1e5).toFixed(1) + ' L');
const num = (n) => Math.round(n).toLocaleString('en-IN');
const pct = (a, b) => Math.round((1 - a / b) * 100);

const T = D.total, live = D.byStatusList.find((s) => s.key === 'In use'), prog = D.byStatusList.find((s) => s.key === 'In progress');
const H = D.hoursPerFte;
const fte = (pd) => pd * 8 / H;                                   // person-days (8 hours) as FTE-years
const st = D.stated;
const by = (sr) => st.find((x) => x.sr === sr);
const pctTxt = (x) => (x.less >= 99.95 ? '99.9' : x.less.toFixed(x.less % 1 ? 1 : 0)) + '%';
const period = new Date(D.period[0]).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) + ' to ' + TODAY;
const liveNames = new Set(st.filter((x) => x.live).map((x) => x.sr));
const statedProjects = new Set(st.map((x) => x.sr));

/* ---------- chart A: cost in-house against a software company (SVG) ---------- */
function moneyChart() {
  const groups = [['Live (' + live.n + ')', live], ['In progress (' + prog.n + ')', prog], ['All ' + T.n, T]];
  const W = 700, Hh = 215, base = 170, top = 28, max = Math.max.apply(null, groups.map((g) => cr(g[1].tcoB))) * 1.12;
  const y = (v) => base - (v / max) * (base - top);
  let svg = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cost in-house against a software company">';
  const gw = W / groups.length, bw = 78;
  groups.forEach((g, i) => {
    const cx = gw * i + gw / 2, a = cr(g[1].tco), b = cr(g[1].tcoB);
    svg += '<rect x="' + (cx - bw - 4) + '" y="' + y(a) + '" width="' + bw + '" height="' + (base - y(a)) + '" fill="#0D5E72"/>';
    svg += '<rect x="' + (cx + 4) + '" y="' + y(b) + '" width="' + bw + '" height="' + (base - y(b)) + '" fill="#C98A00"/>';
    svg += '<text x="' + (cx - bw / 2 - 4) + '" y="' + (y(a) - 6) + '" text-anchor="middle" class="v">' + a.toFixed(1) + '</text>';
    svg += '<text x="' + (cx + bw / 2 + 4) + '" y="' + (y(b) - 6) + '" text-anchor="middle" class="v">' + b.toFixed(1) + '</text>';
    svg += '<text x="' + cx + '" y="' + (base + 20) + '" text-anchor="middle" class="c">' + esc(g[0]) + '</text>';
    svg += '<text x="' + cx + '" y="' + (base + 38) + '" text-anchor="middle" class="s">avoided ' + fCr(g[1].tcoB - g[1].tco) + ' (' + pct(g[1].tco, g[1].tcoB) + '%)</text>';
  });
  svg += '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" stroke="#D3DBE0"/></svg>';
  return svg;
}

/* ---------- chart B: reduction per occurrence (stated) ---------- */
function reductionRows() {
  const rows = [
    [by(78), 'Coil tracing turnaround (Yard Management)'], [by(116), 'SCM commitment report turnaround'], [by(5), 'Quality KPI capture (QRM)'],
    [by(27), 'Report preparation (Byproduct Management)'], [by(26), 'Non-prime slab identification (Slab Qualification)'], [by(23), 'Manpower distribution (CRMS)']
  ];
  return rows.map((r) => {
    const x = r[0], tat = x.kind === 'tat';
    return '<div class="rr"><div class="rl">' + esc(r[1]) + '<small>' + esc(x.before) + ' &rarr; ' + esc(x.after) + '</small></div>' +
      '<div class="rb"><i class="' + (tat ? 'tat' : 'eff') + '" style="width:' + x.less + '%"></i></div><div class="rv">' + pctTxt(x) + '</div></div>';
  }).join('');
}

/* ---------- tables ---------- */
const clean = (t, n) => { const s = String(t || '').replace(/[•‒–]/g, '-').replace(/\s+/g, ' ').replace(/^[-\s]+/, '').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };
function statedTable() {
  const seen = new Set(), rows = [];
  st.forEach((x) => {
    const k = x.what.replace(/ \(phase 2\)/, '') + x.before + x.after;
    if (seen.has(k)) return; seen.add(k);
    const proj = x.sr === 66 ? 'C-MARVEL' : x.sr === 78 ? 'Yard Management' : x.sr === 26 || x.sr === 106 ? 'Slab Qualification System' : x.name.split(' - ')[0];
    const what = x.sr === 26 || x.sr === 106 ? 'Non-prime slab identification' : x.what.replace(/ \((?:QRM|CRMS|Byproduct)\)/, '').replace(/ \(raw material model\)/, '');
    const status = x.sr === 26 ? 'Both' : (x.live ? 'In use' : 'In progress');
    const kind = { tat: 'TAT', effort: 'Effort', cost: 'Money', output: 'Output' }[x.kind];
    const red = x.less != null ? pctTxt(x) + ' less' : '';
    const fteEq = x.perFteYear ? num(x.perFteYear) + ' a year' : '';
    rows.push('<tr><td>' + esc(proj) + '</td><td>' + esc(what) + '</td><td><span class="pill ' + x.kind + '">' + kind + '</span></td><td class="nw">' + esc(x.before || '') + '</td><td>' + esc(x.after) + '</td><td class="r b">' + red + '</td><td class="r">' + fteEq + '</td><td>' + status + '</td></tr>');
  });
  return rows.join('');
}
function moneyTable() {
  const row = (n, s, bold) => '<tr' + (bold ? ' class="tot"' : '') + '><td>' + n + '</td><td class="r">' + s.n + '</td><td class="r">' + num(s.pd) + '</td><td class="r">' + fte(s.pd).toFixed(1) + '</td><td class="r">' + fCr(s.labour, 2) + '</td><td class="r">' + fCr(s.tco, 2) + '</td><td class="r">' + fCr(s.tcoB, 2) + '</td><td class="r b">' + fCr(s.tcoB - s.tco, 2) + '</td><td class="r">' + pct(s.tco, s.tcoB) + '%</td></tr>';
  return row('Live (in use)', live) + row('In progress', prog) + row('All projects', T, true);
}
function topTable() {
  return D.topLive.slice(0, 5).map((p) => '<tr><td>' + esc(clean(p.name.split(' - ')[0], 30)) + '</td><td class="r">' + fMoney(p.tco) + '</td><td class="r">' + fMoney(p.tcoB) + '</td><td class="r b">' + fMoney(p.saving) + '</td><td class="small">' + esc(clean(p.benefit, 74)) + '</td></tr>').join('');
}

const slab = by(26), rep = by(27), yard = by(78), commit = by(116), qrm = by(5), crms = by(23);
const liveWith = D.stated.filter((x) => x.live).map((x) => x.sr).filter((v, i, a) => a.indexOf(v) === i).length;
const css = `
@font-face{font-family:Plex;font-weight:400;src:url('file://${FONTS}/ibm-plex-sans-latin-400-normal.woff2') format('woff2')}
@font-face{font-family:Plex;font-weight:600;src:url('file://${FONTS}/ibm-plex-sans-latin-600-normal.woff2') format('woff2')}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:Plex,Arial,sans-serif;color:#15222A;font-size:9.6pt;line-height:1.38}
.page{width:210mm;height:297mm;padding:13mm 14mm 11mm;position:relative;page-break-after:always;overflow:hidden}
.page:last-child{page-break-after:auto}
.top{display:flex;justify-content:space-between;font-size:8.4pt;color:#566872;border-bottom:1px solid #D3DBE0;padding-bottom:5px;margin-bottom:11px}
h1{font-size:20pt;line-height:1.15;margin:0 0 6px;font-weight:600}
h2{font-size:11.2pt;margin:10px 0 4px;font-weight:600}
.lead{margin:0 0 10px;color:#2d3d46}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.card{background:#EEF3F5;border:1px solid #D3DBE0;border-radius:4px;padding:8px 10px 8px}
.card .k{font-size:8pt;letter-spacing:.06em;text-transform:uppercase;color:#566872;font-weight:600;display:flex;justify-content:space-between}
.card .big{font-size:21pt;font-weight:600;color:#0D5E72;line-height:1.1;margin:2px 0 2px}
.card p{margin:2px 0 0;font-size:8.8pt;line-height:1.32}
.tag{font-size:7pt;border:1px solid #566872;border-radius:2px;padding:0 4px;color:#566872}
.tag.d{border-color:#C98A00;color:#8a5f00}
.tag.s{border-color:#1F7A45;color:#1F7A45}
svg{width:100%;height:auto;display:block}
svg .v{font:600 12px Plex,Arial;fill:#15222A}
svg .c{font:600 12.5px Plex,Arial;fill:#15222A}
svg .s{font:11px Plex,Arial;fill:#1F7A45}
.legend{font-size:8.4pt;color:#566872;margin:2px 0 0}
.legend i{display:inline-block;width:9px;height:9px;margin:0 4px 0 10px;vertical-align:-1px}
.legend i:first-child{margin-left:0}
.rr{display:grid;grid-template-columns:70mm 1fr 14mm;gap:8px;align-items:center;padding:3px 0;border-bottom:1px solid #EEF3F5}
.rl{font-size:8.8pt;line-height:1.25}.rl small{display:block;color:#566872;font-size:8pt}
.rb{height:11px;background:#EEF3F5;border-radius:2px}
.rb i{display:block;height:100%;border-radius:2px}.rb i.tat{background:#0D5E72}.rb i.eff{background:#C98A00}
.rv{font-weight:600;text-align:right;font-size:9.4pt}
table{border-collapse:collapse;width:100%;font-size:8pt}
th{background:#0D5E72;color:#fff;text-align:left;font-weight:600;padding:3px 5px}
td{padding:2.6px 5px;border-bottom:1px solid #D3DBE0;vertical-align:top}
th.r,td.r{text-align:right}td.b{font-weight:600}
tr.tot td{font-weight:600;border-top:1.5px solid #15222A}
td.small{font-size:7.6pt;color:#2d3d46}
th,td.r,td.nw{white-space:nowrap}
.pill{font-size:7pt;font-weight:600;padding:0 4px;border-radius:2px;color:#fff;white-space:nowrap}
.pill.tat{background:#0D5E72}.pill.effort{background:#C98A00}.pill.cost{background:#1F7A45}.pill.output{background:#566872}
.box{background:#FFF8E6;border:1px solid #E4B33E;border-radius:4px;padding:5px 9px;margin-top:8px;font-size:8.3pt;line-height:1.32}
.box b{font-weight:600}
.box ul{margin:3px 0 0;padding-left:16px}
.notes{font-size:7.6pt;color:#566872;margin:4px 0 0;line-height:1.32}
.foot{position:absolute;left:14mm;right:14mm;bottom:7mm;font-size:7.6pt;color:#566872;display:flex;justify-content:space-between;border-top:1px solid #D3DBE0;padding-top:3px}
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Benefits of the projects, ${esc(period)}</title><style>${css}</style></head><body>
<section class="page">
  <div class="top"><span>Central Automation</span><span>For HOD, Central Automation &middot; ${esc(TODAY)}</span></div>
  <h1>Benefits of the projects, ${esc(period)} and in progress</h1>
  <p class="lead">${T.n} projects: ${live.n} live (in use) and ${prog.n} in progress. The focus is money, FTE and turnaround time (TAT), and the productivity they bring. Each figure is marked
  <span class="tag s">STATED</span> (quoted from the project list) or <span class="tag d">DERIVED</span> (worked out with the estimator's standard costing).</p>
  <div class="cards">
    <div class="card"><div class="k"><span>Money</span><span class="tag d">DERIVED</span></div><div class="big">${fCr(live.tcoB - live.tco)}</div>
      <p>external cost avoided by the ${live.n} live projects: built in-house for ${fCr(live.tco)} against ${fCr(live.tcoB)} from a software company (${pct(live.tco, live.tcoB)}% lower). All ${T.n} projects: ${fCr(T.tcoB - T.tco)} (${pct(T.tco, T.tcoB)}%).</p></div>
    <div class="card"><div class="k"><span>FTE</span><span class="tag s">STATED</span></div><div class="big">up to ${pctTxt(rep)} less effort</div>
      <p>Report preparation: ${esc(rep.before)} down to ${esc(rep.after)}. Non-prime slab identification: ${esc(slab.before)} down to ${esc(slab.after)}, ${slab.savedHours / 8} man-days saved each time. At ${num(H)} hours per FTE, ${num(slab.perFteYear)} slabs a year equal 1 FTE; so do ${num(rep.perFteYear)} reports a year.</p></div>
    <div class="card"><div class="k"><span>TAT</span><span class="tag s">STATED</span></div><div class="big">up to ${pctTxt(yard)} faster</div>
      <p>Coil tracing ${esc(yard.before)} &rarr; ${esc(yard.after)}. SCM commitment report ${esc(commit.before)} &rarr; ${esc(commit.after)}. Quality KPI capture ${esc(qrm.before)} &rarr; ${esc(qrm.after)}. Manpower distribution ${esc(crms.before)} &rarr; ${esc(crms.after)}.</p></div>
    <div class="card"><div class="k"><span>Productivity and efficiency</span><span class="tag s">STATED</span></div><div class="big">+70 t/day</div>
      <p>blast-furnace production with the raw-material model (C-MARVEL), with production cost &#8377;615 per ton lower. Demurrage 30% lower with real-time visibility (Stowage Plan).
      <span class="tag d">DERIVED</span> The in-house team's ${num(T.pd)} person-days (${fte(T.pd).toFixed(0)} FTE-years) avoided about &#8377;${num((T.tcoB - T.tco) / T.pd)} of external price per person-day.</p></div>
  </div>
  <h2>Money: cost in-house against a software company, over 3 years (&#8377; Cr)</h2>
  ${moneyChart()}
  <div class="legend"><i style="background:#0D5E72"></i>Central Automation (in-house) <i style="background:#C98A00"></i>Software company (benchmark) &nbsp;&middot;&nbsp; avoided = benchmark minus in-house</div>
  <h2>Time and effort: reduction each time the task runs <span class="tag s">STATED</span></h2>
  ${reductionRows()}
  <div class="legend"><i style="background:#0D5E72"></i>Turnaround time <i style="background:#C98A00"></i>Effort (people's working time)</div>
  <div class="foot"><span>Source: CA project list (as of July 2026); costs from the estimator's standard costing</span><span>Page 1 of 2</span></div>
</section>
<section class="page">
  <div class="top"><span>Central Automation</span><span>Detail and basis &middot; ${esc(TODAY)}</span></div>
  <h2 style="margin-top:0">Stated in the project list: per time the task runs</h2>
  <table><thead><tr><th>Project</th><th>What</th><th>Type</th><th>Before</th><th>After</th><th class="r">Reduction</th><th class="r">1 FTE equals</th><th>Status</th></tr></thead><tbody>${statedTable()}</tbody></table>
  <p class="notes">"1 FTE equals" = times a year the task must run for the saved time to add up to ${num(H)} hours; shown for effort savings only (TAT is elapsed time, not converted). "Both": the project appears twice in the list, once in use and once in progress.</p>
  <h2>Money, derived: what the projects cost against a software company <span class="tag d">DERIVED</span></h2>
  <table><thead><tr><th>Projects</th><th class="r">Count</th><th class="r">Person-days</th><th class="r">FTE-years</th><th class="r">Manpower, loaded</th><th class="r">In-house, 3 years</th><th class="r">Software co.</th><th class="r">Avoided</th><th class="r">%</th></tr></thead><tbody>${moneyTable()}</tbody></table>
  <p class="notes">The effort is the same on both sides (benchmark effort factor 1): the difference is the in-house rates, loadings and mark-up against a software company's. It is external price avoided, not cash released.</p>
  <h2>Largest avoided cost among the live projects <span class="tag d">DERIVED</span></h2>
  <table><thead><tr><th>Project</th><th class="r">In-house</th><th class="r">Software co.</th><th class="r">Avoided</th><th>Benefit (project list)</th></tr></thead><tbody>${topTable()}</tbody></table>
  <div class="box"><b>What the project list does not yet record</b>
    <ul>
      <li>No rupee gain (Cal-2) is recorded for any of these projects, and "Efforts Saving (man-hours)" is empty. Only ${statedProjects.size} project entries (${liveWith} live) state a before and after figure.</li>
      <li>Yearly rupee, FTE and TAT totals need one number per project: how often the task runs (slabs a year, reports a day, users). With it, each stated saving converts directly: saved time &times; runs a year &times; cost per hour.</li>
      <li>${D.withNoTextAtAll} of ${T.n} projects have no benefit text in the list at all. Asking project owners for volume and before/after figures would make the next report fully stated.</li>
    </ul></div>
  <p class="notes"><b>Basis.</b> Scope: projects whose dates overlap ${esc(period)}, plus every project marked In Progress (dated outside the period, or with no dates); failed projects left out; ${D.counts.left} of ${D.counts.workbook} projects left out. Costs are derived because the list holds none: one person per project (Senior for AI / ML / vision models, otherwise Mid; FTE where given), working days between the project's dates (90 days if a date is missing), 100 users, standard server and licences, default masters, 3 years of ownership; full project cost, not pro-rated to the period. A day of TAT is 24 hours; a man-day is 8 hours; 1 FTE is ${num(H)} hours a year. Reductions use the lower figure of a stated range.</p>
  <div class="foot"><span>Figures: derive_ca_projects_deck.js (same costing as database script 07)</span><span>Page 2 of 2</span></div>
</section></body></html>`;

(async () => {
  const htmlPath = outPdf.replace(/\.pdf$/i, '') + '.html';
  fs.writeFileSync(htmlPath, html);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(htmlPath));
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: outPdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  const heights = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p) => [p.scrollHeight, p.clientHeight]));
  await browser.close();
  fs.unlinkSync(htmlPath);
  console.log('written', outPdf, '| page content heights (scroll / box):', JSON.stringify(heights));
})().catch((e) => { console.error(e); process.exit(1); });
