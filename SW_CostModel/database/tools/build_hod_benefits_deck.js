/* ==================================================================
   Builds the 4-slide PowerPoint "Benefits of the projects" for the HOD from the figures of derive_ca_projects_deck.js:
     1 Summary (no project names)   2 Money   3 FTE   4 Productivity (TAT and output)

   Usage (Node 18+; needs pptxgenjs:  npm install pptxgenjs):
     node derive_ca_projects_deck.js "CA_Projects_List_As_of_July_2026.xlsx" <folder> 2026-10-29 ca_projects_extra.json
     node build_hod_benefits_deck.js <folder>\deck_data.json <output.pptx> "29 October 2026"

   Every figure on a slide is tagged STATED (quoted from the project list, or given by the project owner), DERIVED (costed with the estimator's
   standard assumptions) or POTENTIAL (a project still in progress: what it can give, not what it has given).
   Project names: the summary has none, and a project is named at most once in the whole deck. The projects added by hand (ca_projects_extra.json)
   are never named: they appear only as figures. Nothing is annualised that the owner gave for one month; a project cost is never shown as a saving.
   ================================================================== */
'use strict';
const pptxgen = require('pptxgenjs');
const fs = require('fs');

const [dataPath, outPptx, dateText] = process.argv.slice(2);
if (!dataPath || !outPptx) { console.error('Usage: node build_hod_benefits_deck.js <deck_data.json> <output.pptx> [date text]'); process.exit(2); }
const D = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const TODAY = dateText || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const HEX = { ink: '15222A', steel: '0D5E72', amber: 'C98A00', amberText: '8A5F00', green: '1F7A45', rust: 'B3411A', grey: '566872', soft: 'EEF3F5', line: 'D3DBE0', white: 'FFFFFF', warn: 'FFF8E6' };
const FONT = 'Calibri';
const cr = (n) => n / 1e7;
const fCr = (n, d = 1) => '₹' + cr(n).toFixed(d) + ' Cr';
const num = (n) => Math.round(n).toLocaleString('en-IN');
const pct = (a, b) => Math.round((1 - a / b) * 100);

const T = D.total, live = D.byStatusList.find((s) => s.key === 'In use'), prog = D.byStatusList.find((s) => s.key === 'In progress');
const H = D.hoursPerFte, st = D.stated, by = (sr) => st.find((x) => x.sr === sr);
/* the two projects added by hand, found by what they carry (an annual hours figure), never by name */
const portly = D.added.find((a) => a.annualHours != null), potential = D.added.find((a) => a.annualHours == null);
const pctTxt = (less) => (less >= 99.95 ? '99.9' : less.toFixed(less % 1 ? 1 : 0)) + '%';
const periodText = new Date(D.period[0]).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) + ' to ' + TODAY;
const slab = by(26), rep = by(27), yard = by(78), commit = by(116), qrm = by(5), crms = by(23), demurrage = by(109), cmarvelCost = st.filter((x) => x.sr === 66 && x.kind === 'cost')[0], cmarvelOut = st.filter((x) => x.sr === 66 && x.kind === 'output')[0];
const assess = portly.stated[0];                                   // manual assessment per shipment, 360 min to 60 min
const minOf = (re) => +(potential.stated.find((x) => re.test(x.what)).after.match(/[\d.]+/)[0]);
const arcing = minOf(/Arcing/), blowing = minOf(/Blowing/);
const heatH = +(potential.stated[0].after.match(/[\d.]+/)[0]), heatN = +(potential.stated[0].after.match(/~(\d+)/)[1]), conarcH = +(potential.stated[3].after.match(/[\d.]+/)[0]);
const median = +(potential.stated[1].after.match(/\((\d+) min\)/)[1]);
const nProjects = D.counts.inScopeWithAdded;
const fteYears = (T.pd * 8) / H;

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.33 x 7.5 in
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.title = 'Benefits of the projects, ' + periodText;
pres.author = 'Central Automation';
pres.defineSlideMaster({
  title: 'Content',
  background: { color: HEX.white },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 12.1, h: 0.8, fontSize: 30, bold: true, color: HEX.ink, margin: 0, valign: 'middle', align: 'left', fontFace: FONT }, text: '' } },
    { text: { text: 'Central Automation  |  Benefits of the projects, ' + periodText + ' and in progress', options: { x: 0.6, y: 7.08, w: 11, h: 0.3, fontSize: 10, color: HEX.grey, margin: 0, isTextBox: true, fontFace: FONT } } }
  ],
  slideNumber: { x: 12.2, y: 7.08, w: 0.55, h: 0.3, fontSize: 10, color: HEX.grey, align: 'right', fontFace: FONT }
});

/* ---------- helpers ---------- */
const TAGS = { STATED: [HEX.green, HEX.green], DERIVED: [HEX.amber, HEX.amberText], POTENTIAL: [HEX.steel, HEX.steel] };
function tag(slide, kind, x, y, name) {
  const c = TAGS[kind];
  slide.addText(kind, { x, y, w: kind === 'POTENTIAL' ? 1.15 : 0.95, h: 0.24, fontSize: 10, bold: true, align: 'center', valign: 'middle', margin: 0, color: c[1], fontFace: FONT,
    shape: pres.ShapeType.roundRect, rectRadius: 0.05, fill: { color: HEX.white }, line: { color: c[0], width: 1 }, objectName: name || (kind + ' tag') });
}
function card(slide, x, y, w, h, label, kinds, big, text, name) {
  slide.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: HEX.soft }, line: { color: HEX.line, width: 0.75 }, objectName: name + ' card' });
  slide.addText(label, { x: x + 0.25, y: y + 0.15, w: w - 2.8, h: 0.3, fontSize: 12, bold: true, color: HEX.grey, margin: 0, charSpacing: 1, fontFace: FONT, isTextBox: true, objectName: name + ' label' });
  let tx = x + w - 0.2;
  kinds.slice().reverse().forEach((k) => { const tw = k === 'POTENTIAL' ? 1.15 : 0.95; tx -= tw; tag(slide, k, tx, y + 0.17, name + ' ' + k + ' tag'); tx -= 0.08; });
  slide.addText(big, { x: x + 0.25, y: y + 0.5, w: w - 0.5, h: 0.65, fontSize: 32, bold: true, color: HEX.steel, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: name + ' value' });
  slide.addText(text, { x: x + 0.25, y: y + 1.2, w: w - 0.5, h: h - 1.3, fontSize: 14, color: HEX.ink, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: name + ' text' });
}
const heading = (slide, text, x, y, w, name) => slide.addText(text, { x, y, w, h: 0.35, fontSize: 15, bold: true, color: HEX.ink, margin: 0, fontFace: FONT, isTextBox: true, objectName: name || 'Heading' });
const note = (slide, text, y = 6.45, h = 0.55) => slide.addText(text, { x: 0.6, y, w: 12.1, h, fontSize: 11, color: HEX.grey, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: 'Basis note' });
function chip(slide, x, y, w, big, text, name) {
  slide.addShape(pres.ShapeType.rect, { x, y, w, h: 0.85, fill: { color: HEX.soft }, line: { color: HEX.line, width: 0.75 }, objectName: name + ' chip' });
  slide.addText(big, { x: x + 0.15, y: y + 0.05, w: 1.7, h: 0.75, fontSize: 20, bold: true, color: HEX.steel, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: name + ' value' });
  slide.addText(text, { x: x + 1.9, y: y + 0.05, w: w - 2.05, h: 0.75, fontSize: 12, color: HEX.ink, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: name + ' text' });
}
const chartBase = {
  catAxisLabelColor: HEX.grey, valAxisLabelColor: HEX.grey, catAxisLabelFontFace: FONT, valAxisLabelFontFace: FONT, catAxisLabelFontSize: 12, valAxisLabelFontSize: 11,
  catGridLine: { style: 'none' }, valGridLine: { style: 'none' }, dataLabelFontFace: FONT, dataLabelFontSize: 12, dataLabelColor: HEX.ink,
  legendFontFace: FONT, legendFontSize: 12, legendColor: HEX.ink, showValue: true, valAxisHidden: true
};
const tcell = (text, o = {}) => ({ text: String(text), options: Object.assign({ fontSize: 12, color: HEX.ink, fontFace: FONT, valign: 'middle', margin: [0.03, 0.08, 0.03, 0.08], border: { type: 'solid', color: HEX.line, pt: 0.75 } }, o) });
const thead = (arr, aligns) => arr.map((t, i) => tcell(t, { bold: true, color: HEX.white, fill: { color: HEX.steel }, align: (aligns || [])[i] || 'left' }));

/* ============ 1. summary (no project names) ============ */
let s = pres.addSlide({ masterName: 'Content' });
s.addText('Benefits at a glance: money, FTE, TAT and productivity', { placeholder: 'title' });
s.addText(periodText + ' and all in progress: ' + nProjects + ' projects (' + live.n + ' live and ' + prog.n + ' in progress from the project list, and ' + D.added.length + ' added by their owners).',
  { x: 0.6, y: 1.2, w: 12.1, h: 0.5, fontSize: 14, color: HEX.grey, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: 'Scope line' });
const cw = 5.98, ch = 2.1, gx = 0.14, gy = 0.15, x0 = 0.6, y0 = 1.8;
card(s, x0, y0, cw, ch, 'MONEY', ['DERIVED'], fCr(live.tcoB - live.tco) + ' avoided',
  'by the ' + live.n + ' live projects: built in-house for ' + fCr(live.tco) + ' against ' + fCr(live.tcoB) + ' from a software company (' + pct(live.tco, live.tcoB) + '% lower). All ' + T.n + ' listed projects: ' + fCr(T.tcoB - T.tco) + ' (' + pct(T.tco, T.tcoB) + '%).', 'Money');
card(s, x0 + cw + gx, y0, cw, ch, 'FTE', ['STATED'], num(portly.annualHours) + ' man-hours a year',
  'saved on one project (' + portly.fte.toFixed(2) + ' FTE at ' + num(H) + ' h). Other tasks need up to ' + pctTxt(rep.less) + ' less effort: ' + slab.before + ' down to ' + slab.after + '; ' + rep.before + ' down to ' + rep.after + '.', 'FTE');
card(s, x0, y0 + ch + gy, cw, ch, 'TAT', ['STATED'], 'up to ' + pctTxt(yard.less) + ' faster',
  'Coil tracing ' + yard.before + ' to ' + yard.after + '. Commitment report ' + commit.before + ' to ' + commit.after + '. Quality KPI capture ' + qrm.before + ' to ' + qrm.after + '. Manpower distribution ' + crms.before + ' to ' + crms.after + '.', 'TAT');
card(s, x0 + cw + gx, y0 + ch + gy, cw, ch, 'PRODUCTIVITY', ['STATED', 'POTENTIAL'], '+70 t/day',
  'blast-furnace production, and demurrage 30% lower. Potential, from a project still in progress: ' + heatH + ' h of furnace time (about ' + heatN + ' more heats) recoverable in a one-month analysis.', 'Productivity');
note(s, 'STATED = quoted from the project list or given by the project owner. DERIVED = worked out with the estimator\'s standard costing. POTENTIAL = a project still in progress: what it can give, not what it has given. Money is external cost avoided, not cash released. No rupee gain (Cal-2) is recorded in the list.', 6.4, 0.6);
s.addNotes('Scope: listed projects whose dates overlap ' + periodText + ', plus every project marked In Progress (dated outside the period, or with no dates); failed projects left out. ' + D.added.length + ' projects were added by their owners and are counted, but not costed with the estimator. Money = software-company (benchmark) cost minus in-house cost over 3 years, for the listed projects only. FTE = hours / ' + num(H) + '.');

/* ============ 2. money ============ */
s = pres.addSlide({ masterName: 'Content' });
s.addText('Money: live projects avoided ' + fCr(live.tcoB - live.tco) + ' of external cost', { placeholder: 'title' });
heading(s, 'Cost over 3 years, in-house against a software company, ₹ Cr', 0.6, 1.35, 6.1, 'Chart heading');
const groups = [['Live (' + live.n + ')', live], ['In progress (' + prog.n + ')', prog], ['All ' + T.n, T]];
s.addChart(pres.charts.BAR, [
  { name: 'Central Automation (in-house)', labels: groups.map((g) => g[0]), values: groups.map((g) => +cr(g[1].tco).toFixed(1)) },
  { name: 'Software company (benchmark)', labels: groups.map((g) => g[0]), values: groups.map((g) => +cr(g[1].tcoB).toFixed(1)) }
], Object.assign({ x: 0.6, y: 1.75, w: 6.3, h: 3.55, barDir: 'col', barGapWidthPct: 60, chartColors: [HEX.steel, HEX.amber], showLegend: true, legendPos: 'b', dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', objectName: 'Cost chart' }, chartBase));
s.addText('Avoided:  live ' + fCr(live.tcoB - live.tco) + ' (' + pct(live.tco, live.tcoB) + '%)  ·  in progress ' + fCr(prog.tcoB - prog.tco) + ' (' + pct(prog.tco, prog.tcoB) + '%)  ·  all ' + fCr(T.tcoB - T.tco) + ' (' + pct(T.tco, T.tcoB) + '%)',
  { x: 0.6, y: 5.3, w: 6.3, h: 0.3, fontSize: 12, color: HEX.green, bold: true, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: 'Avoided line' });
tag(s, 'DERIVED', 5.95, 1.4);
heading(s, 'Cost avoided by business KPI, ₹ Cr (all ' + T.n + ' listed projects)', 7.2, 1.35, 5.5, 'KPI heading');
const kp = D.byKpi.map((k) => ({ key: k.key, n: k.n, avoided: k.tcoB - k.tco })).sort((a, b) => b.avoided - a.avoided);
s.addChart(pres.charts.BAR, [{ name: 'Avoided, ₹ Cr', labels: kp.map((k) => k.key + ' (' + k.n + ')'), values: kp.map((k) => +cr(k.avoided).toFixed(1)) }],
  Object.assign({ x: 7.2, y: 1.75, w: 5.5, h: 3.85, barDir: 'bar', barGapWidthPct: 40, chartColors: [HEX.green], showLegend: false, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', catAxisOrientation: 'maxMin', objectName: 'KPI chart' }, chartBase));
heading(s, 'Stated money gains', 0.6, 5.7, 4, 'Gains heading'); tag(s, 'STATED', 2.7, 5.75);
chip(s, 0.6, 6.05, 5.95, '₹615 / ton', 'lower cost of production, Hazira (' + cmarvelCost.name.split(' - ')[0] + ')', 'Cost');
chip(s, 6.75, 6.05, 5.95, '30% lower', 'demurrage, with real-time visibility (' + demurrage.name.split(' - ')[0] + ')', 'Demurrage');
s.addNotes('In-house ' + fCr(T.tco, 2) + ' against ' + fCr(T.tcoB, 2) + ' for all ' + T.n + ' listed projects; live ' + fCr(live.tco, 2) + ' against ' + fCr(live.tcoB, 2) + '; in progress ' + fCr(prog.tco, 2) + ' against ' + fCr(prog.tcoB, 2) + '. Derived, not recorded: the project list holds no costs, so each listed project is costed with the estimator\'s standard assumptions (one person, Senior for AI / ML / vision models else Mid; working days between its dates, 90 if a date is missing; 100 users; default masters; 3 years; full project cost, not pro-rated). Same effort on both sides: the difference is in-house rates, loadings and mark-up against a software company\'s. It is external price avoided, not cash released. The two stated gains are quoted from the list and are not annualised.');

/* ============ 3. FTE ============ */
s = pres.addSlide({ masterName: 'Content' });
s.addText('FTE: working time saved', { placeholder: 'title' });
heading(s, 'Stated reductions, each time the task runs', 0.6, 1.35, 5.2, 'Table heading'); tag(s, 'STATED', 6.95, 1.4);
const perUnitH = (assess.beforeMin - assess.afterMin) / 60;
const rows = [thead(['Project', 'Task', 'Before', 'After', 'Reduction', '1 FTE equals'], ['left', 'left', 'left', 'left', 'left', 'right'])].concat([
  ['Port logistics', 'Shipment assessment', assess.before, assess.after, pctTxt(assess.less) + ' less', num(H / perUnitH) + ' shipments a year'],
  [slab.name.split(' System')[0], 'Non-prime slab identification', slab.before, slab.after, pctTxt(slab.less) + ' less', num(slab.perFteYear) + ' slabs a year'],
  [rep.name.split(' - ')[0], 'Report preparation', rep.before, rep.after, pctTxt(rep.less) + ' less', num(rep.perFteYear) + ' reports a year']
].map((r) => r.map((t, i) => tcell(t, { align: i === 5 ? 'right' : 'left', bold: i === 4, color: i === 4 ? HEX.green : HEX.ink }))));
s.addTable(rows, { x: 0.6, y: 1.75, w: 7.6, colW: [1.45, 1.8, 0.9, 0.9, 0.95, 1.6], rowH: 0.5, objectName: 'Effort table' });
heading(s, 'Reduction in effort, %', 0.6, 4.0, 7.4, 'Chart heading');
const eff = [[assess, 'Shipment assessment'], [slab, 'Non-prime slab identification'], [rep, 'Report preparation']];
s.addChart(pres.charts.BAR, [{ name: 'Less effort, %', labels: eff.map((e) => e[1]), values: eff.map((e) => +e[0].less.toFixed(1)) }],
  Object.assign({ x: 0.6, y: 4.35, w: 7.6, h: 2.0, barDir: 'bar', barGapWidthPct: 40, chartColors: [HEX.amber], showLegend: false, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0"%"', catAxisOrientation: 'maxMin', objectName: 'Effort chart' }, chartBase));
card(s, 8.5, 1.35, 4.2, 2.45, 'TIME SAVED ON ONE PROJECT', ['STATED'], num(portly.annualHours) + ' man-hours',
  num(portly.annualHours * 60) + ' minutes a year. ' + num(portly.annualHours) + ' h = ' + portly.fte.toFixed(2) + ' FTE at ' + num(H) + ' h per FTE.', 'Hours');
card(s, 8.5, 3.95, 4.2, 2.4, 'IN-HOUSE BUILD EFFORT', ['DERIVED'], fteYears.toFixed(0) + ' FTE-years',
  num(T.pd) + ' person-days of 8 hours behind the ' + T.n + ' listed projects. A software company would need the same effort.', 'Effort');
note(s, 'Effort = people\'s working time. Man-day = 8 hours; 1 FTE = ' + num(H) + ' hours a year. "1 FTE equals" = runs a year whose saved time adds up to ' + num(H) + ' hours. Reductions use the lower figure of a stated range (4-5 h taken as 4 h). The list gives no frequency for slab identification or report preparation, so only the saving per run is stated.', 6.45, 0.55);
s.addNotes('Shipment assessment: 360 min to 60 min = ' + assess.less + '% less; 36,000 min a year = 600 man-hours (owner\'s figures); 600 / 2,740 = ' + portly.fte.toFixed(3) + ' FTE; about ' + num(portly.unitsPerYear) + ' shipments a year follows from 36,000 / 300 (derived). Slab identification: 7 man-days to 1 = 6 man-days = 48 h per slab; ' + slab.perFteYear + ' slabs a year equal 1 FTE. Report preparation: 4 h to 2 min saves about 3.97 h; ' + rep.perFteYear + ' reports a year equal 1 FTE. In-house effort: ' + num(T.pd) + ' person-days x 8 h / ' + num(H) + ' = ' + fteYears.toFixed(1) + ' FTE-years.');

/* ============ 4. productivity (TAT and output) ============ */
s = pres.addSlide({ masterName: 'Content' });
s.addText('Productivity: faster turnaround, more output', { placeholder: 'title' });
heading(s, 'Turnaround time, reduction in %', 0.6, 1.35, 4.6, 'Chart heading'); tag(s, 'STATED', 5.9, 1.4);
const nm = (x) => x.name.split(' - ')[0].replace(/ Systema.*/, '').replace(/ \(.*\)/, '').trim();
const tat = [[yard, nm(yard) + ': ' + yard.before + ' → ' + yard.after], [commit, nm(commit) + ': ' + commit.before + ' → ' + commit.after], [qrm, nm(qrm) + ': ' + qrm.before + ' → ' + qrm.after], [crms, nm(crms) + ': ' + crms.before + ' → ' + crms.after]];
s.addChart(pres.charts.BAR, [{ name: 'Faster, %', labels: tat.map((t) => t[1]), values: tat.map((t) => +t[0].less.toFixed(1)) }],
  Object.assign({ x: 0.6, y: 1.75, w: 6.4, h: 3.1, barDir: 'bar', barGapWidthPct: 40, chartColors: [HEX.steel], showLegend: false, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0"%"', catAxisOrientation: 'maxMin', objectName: 'TAT chart' }, chartBase, { catAxisLabelFontSize: 11 }));
chip(s, 0.6, 5.2, 6.4, '+' + cmarvelOut.after.match(/\d+/)[0] + ' t/day', 'blast-furnace production from a raw-material optimisation model', 'Output');
tag(s, 'STATED', 6.05, 4.9);
/* potential panel (project in progress, unnamed) */
s.addShape(pres.ShapeType.rect, { x: 7.3, y: 1.35, w: 5.4, h: 4.7, fill: { color: HEX.soft }, line: { color: HEX.steel, width: 1.25, dashType: 'dash' }, objectName: 'Potential panel' });
s.addText('Furnace heat cycle: potential', { x: 7.5, y: 1.45, w: 3.4, h: 0.32, fontSize: 14, bold: true, color: HEX.ink, margin: 0, fontFace: FONT, isTextBox: true, objectName: 'Potential heading' });
tag(s, 'POTENTIAL', 11.35, 1.49);
s.addText('Project in progress. Analysis of September 2026 (one month); not yet realised, not annualised.', { x: 7.5, y: 1.82, w: 5.0, h: 0.5, fontSize: 11, italic: true, color: HEX.grey, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: 'Potential period' });
s.addText(heatH + ' h', { x: 7.5, y: 2.35, w: 1.7, h: 0.6, fontSize: 32, bold: true, color: HEX.steel, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: 'Potential value' });
s.addText('of recoverable furnace time, about ' + heatN + ' additional heats, by bringing slower heats to the ' + median + ' min median tap-to-tap time.', { x: 9.3, y: 2.3, w: 3.25, h: 0.75, fontSize: 12, color: HEX.ink, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: 'Potential text' });
s.addText('Above the median, slowest quarter of heats (min per heat)', { x: 7.5, y: 3.2, w: 5.0, h: 0.28, fontSize: 12, bold: true, color: HEX.ink, margin: 0, fontFace: FONT, isTextBox: true, objectName: 'Potential chart heading' });
s.addChart(pres.charts.BAR, [{ name: 'min/heat above median', labels: ['Arcing', 'Blowing'], values: [arcing, blowing] }],
  Object.assign({ x: 7.4, y: 3.45, w: 5.2, h: 1.5, barDir: 'bar', barGapWidthPct: 35, chartColors: [HEX.steel], showLegend: false, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', catAxisOrientation: 'maxMin', objectName: 'Potential chart' }, chartBase));
s.addText('Aligning the two converters adds about ' + conarcH + ' h more furnace time.', { x: 7.5, y: 5.15, w: 5.0, h: 0.6, fontSize: 12, color: HEX.ink, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: 'Potential converter' });
note(s, 'TAT = elapsed time (a day is taken as 24 hours). A TAT reduction is not converted to FTE or rupees: the project list gives no frequency. The heat-cycle figures are what the analysis shows is recoverable, from one month, for a project that is still in progress: they are a potential, not a result.', 6.35, 0.6);
s.addNotes('Turnaround (by task): coil tracing ' + yard.before + ' to ' + yard.after + ' (' + yard.less + '% less); commitment report ' + commit.before + ' to ' + commit.after + ' (' + commit.less + '%); quality KPI capture ' + qrm.before + ' to ' + qrm.after + ' (' + qrm.less + '%); manpower distribution ' + crms.before + ' to ' + crms.after + ' (' + crms.less + '%). Output: +70 t/day blast-furnace production, stated by the project. Potential (project in progress): data-driven heat-cycle analysis for September 2026 identifies ' + heatH + ' h of recoverable furnace time (about ' + heatN + ' additional heats) by bringing slower heats to the median tap-to-tap time of ' + median + ' min; quickest gains are arcing (' + arcing + ' min/heat above median) and blowing (' + blowing + ' min/heat above median) in the slowest quarter of heats; aligning the two converters adds about ' + conarcH + ' h. These are not multiplied up to a year.');

pres.writeFile({ fileName: outPptx }).then(() => console.log('written', outPptx));
