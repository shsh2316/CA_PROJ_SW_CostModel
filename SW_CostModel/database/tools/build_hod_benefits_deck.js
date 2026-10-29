/* ==================================================================
   Builds the 5-slide PowerPoint "Benefits of the projects" for the HOD from the figures of derive_ca_projects_deck.js.

   Usage (Node 18+; needs pptxgenjs:  npm install pptxgenjs):
     node derive_ca_projects_deck.js "CA_Projects_List_As_of_July_2026.xlsx" <folder> 2026-10-29 ca_projects_extra.json
     node build_hod_benefits_deck.js <folder>\deck_data.json <output.pptx> "29 October 2026"

   Every figure on a slide is tagged STATED (quoted from the project list, or given by the project owner) or DERIVED (costed with the estimator's
   standard assumptions, or valued at the masters' rates). Nothing is annualised that the owner gave for one month, and a project cost is never shown as a saving.
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
const fL = (n, d = 1) => '₹' + (n / 1e5).toFixed(d) + ' L';
const num = (n) => Math.round(n).toLocaleString('en-IN');
const pct = (a, b) => Math.round((1 - a / b) * 100);

const T = D.total, live = D.byStatusList.find((s) => s.key === 'In use'), prog = D.byStatusList.find((s) => s.key === 'In progress');
const H = D.hoursPerFte, st = D.stated, by = (sr) => st.find((x) => x.sr === sr);
const smp2 = D.added.find((a) => /SMP2/.test(a.name)), par = D.added.find((a) => /Paradeep/.test(a.name));
const pctTxt = (less) => (less >= 99.95 ? '99.9' : less.toFixed(less % 1 ? 1 : 0)) + '%';
const periodText = new Date(D.period[0]).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) + ' to ' + TODAY;
const slab = by(26), rep = by(27), yard = by(78), commit = by(116), qrm = by(5), crms = by(23);
const parAssess = par.stated[0];
const nProjects = D.counts.inScopeWithAdded;

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
function tag(slide, kind, x, y, name) {
  const stated = kind === 'STATED';
  slide.addText(kind, { x, y, w: 0.95, h: 0.24, fontSize: 10, bold: true, align: 'center', valign: 'middle', margin: 0, color: stated ? HEX.green : HEX.amberText, fontFace: FONT,
    shape: pres.ShapeType.roundRect, rectRadius: 0.05, fill: { color: HEX.white }, line: { color: stated ? HEX.green : HEX.amber, width: 1 }, objectName: name || (kind + ' tag') });
}
function card(slide, x, y, w, h, label, kind, big, text, name) {
  slide.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: HEX.soft }, line: { color: HEX.line, width: 0.75 }, objectName: name + ' card' });
  slide.addText(label, { x: x + 0.25, y: y + 0.15, w: w - 1.6, h: 0.3, fontSize: 12, bold: true, color: HEX.grey, margin: 0, charSpacing: 1, fontFace: FONT, isTextBox: true, objectName: name + ' label' });
  tag(slide, kind, x + w - 1.2, y + 0.17, name + ' tag');
  slide.addText(big, { x: x + 0.25, y: y + 0.5, w: w - 0.5, h: 0.65, fontSize: 32, bold: true, color: HEX.steel, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: name + ' value' });
  slide.addText(text, { x: x + 0.25, y: y + 1.2, w: w - 0.5, h: h - 1.3, fontSize: 14, color: HEX.ink, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: name + ' text' });
}
const heading = (slide, text, x, y, w, name) => slide.addText(text, { x, y, w, h: 0.35, fontSize: 15, bold: true, color: HEX.ink, margin: 0, fontFace: FONT, isTextBox: true, objectName: name || 'Heading' });
const note = (slide, text, y = 6.45, h = 0.55) => slide.addText(text, { x: 0.6, y, w: 12.1, h, fontSize: 11, color: HEX.grey, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: 'Basis note' });
const chartBase = {
  catAxisLabelColor: HEX.grey, valAxisLabelColor: HEX.grey, catAxisLabelFontFace: FONT, valAxisLabelFontFace: FONT, catAxisLabelFontSize: 12, valAxisLabelFontSize: 11,
  catGridLine: { style: 'none' }, valGridLine: { style: 'none' }, dataLabelFontFace: FONT, dataLabelFontSize: 12, dataLabelColor: HEX.ink,
  legendFontFace: FONT, legendFontSize: 12, legendColor: HEX.ink, showValue: true, valAxisHidden: true
};
const tcell = (text, o = {}) => ({ text: String(text), options: Object.assign({ fontSize: 12, color: HEX.ink, fontFace: FONT, valign: 'middle', margin: [0.03, 0.08, 0.03, 0.08], border: { type: 'solid', color: HEX.line, pt: 0.75 } }, o) });
const thead = (arr, aligns) => arr.map((t, i) => tcell(t, { bold: true, color: HEX.white, fill: { color: HEX.steel }, align: (aligns || [])[i] || 'left' }));

/* ============ 1. headline ============ */
let s = pres.addSlide({ masterName: 'Content' });
s.addText('Benefits of ' + nProjects + ' projects: money, FTE, TAT and productivity', { placeholder: 'title' });
s.addText(periodText + ' and all in progress: ' + T.n + ' listed projects (' + live.n + ' live, ' + prog.n + ' in progress) and ' + D.added.length + ' added by the owners (SMP2 Digital Transformation, Paradeep Ports).',
  { x: 0.6, y: 1.2, w: 12.1, h: 0.5, fontSize: 14, color: HEX.grey, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: 'Scope line' });
const cw = 5.98, ch = 2.1, gx = 0.14, gy = 0.15, x0 = 0.6, y0 = 1.8;
card(s, x0, y0, cw, ch, 'MONEY', 'DERIVED', fCr(live.tcoB - live.tco) + ' avoided',
  'by the ' + live.n + ' live listed projects: built in-house for ' + fCr(live.tco) + ' against ' + fCr(live.tcoB) + ' from a software company (' + pct(live.tco, live.tcoB) + '% lower). All ' + T.n + ' listed: ' + fCr(T.tcoB - T.tco) + ' (' + pct(T.tco, T.tcoB) + '%).', 'Money');
card(s, x0 + cw + gx, y0, cw, ch, 'FTE', 'STATED', num(par.annualHours) + ' man-hours a year',
  'Paradeep Ports: ' + par.fte.toFixed(2) + ' FTE (at ' + num(H) + ' h). Slab identification ' + slab.before + ' down to ' + slab.after + '; report preparation up to ' + pctTxt(rep.less) + ' less effort.', 'FTE');
card(s, x0, y0 + ch + gy, cw, ch, 'TAT', 'STATED', 'up to ' + pctTxt(yard.less) + ' faster',
  'Coil tracing ' + yard.before + ' to ' + yard.after + '. SCM commitment report ' + commit.before + ' to ' + commit.after + '. Quality KPI capture ' + qrm.before + ' to ' + qrm.after + '. Manpower distribution ' + crms.before + ' to ' + crms.after + '.', 'TAT');
card(s, x0 + cw + gx, y0 + ch + gy, cw, ch, 'PRODUCTIVITY', 'STATED', '~15 more heats a month',
  'SMP2: 25.6 h of furnace time recoverable in September 2026 (one month). C-MARVEL: +70 t/day blast-furnace production, ₹615 per ton lower cost. Stowage Plan: demurrage 30% lower.', 'Productivity');
note(s, 'STATED = quoted from the project list or given by the project owner. DERIVED = worked out with the estimator\'s standard costing or the masters\' rates. Money is external cost avoided, not cash released. The project cost of Paradeep Ports (₹17 L) is an investment, not a saving.', 6.4, 0.6);
s.addNotes('Scope: listed projects whose dates overlap ' + periodText + ', plus every project marked In Progress (dated outside the period, or with no dates); failed projects left out. ' + D.added.length + ' projects were added by the owners and are counted but not costed with the estimator (SMP2 gave no cost, Paradeep gave its actual cost). Money = benchmark (software company) cost minus in-house cost over 3 years, for the listed projects only.');

/* ============ 2. money ============ */
s = pres.addSlide({ masterName: 'Content' });
s.addText('Money: live projects avoided ' + fCr(live.tcoB - live.tco) + ' of external cost', { placeholder: 'title' });
heading(s, 'Cost over 3 years, in-house against a software company, ₹ Cr', 0.6, 1.35, 7.3, 'Chart heading');
tag(s, 'DERIVED', 6.95, 1.4);
const groups = [['Live (' + live.n + ')', live], ['In progress (' + prog.n + ')', prog], ['All ' + T.n + ' listed', T]];
s.addChart(pres.charts.BAR, [
  { name: 'Central Automation (in-house)', labels: groups.map((g) => g[0]), values: groups.map((g) => +cr(g[1].tco).toFixed(1)) },
  { name: 'Software company (benchmark)', labels: groups.map((g) => g[0]), values: groups.map((g) => +cr(g[1].tcoB).toFixed(1)) }
], Object.assign({ x: 0.6, y: 1.75, w: 7.3, h: 4.1, barDir: 'col', barGapWidthPct: 60, chartColors: [HEX.steel, HEX.amber], showLegend: true, legendPos: 'b', dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', objectName: 'Cost chart' }, chartBase));
s.addText('Avoided:  live ' + fCr(live.tcoB - live.tco) + ' (' + pct(live.tco, live.tcoB) + '%)   ·   in progress ' + fCr(prog.tcoB - prog.tco) + ' (' + pct(prog.tco, prog.tcoB) + '%)   ·   all ' + fCr(T.tcoB - T.tco) + ' (' + pct(T.tco, T.tcoB) + '%)', { x: 0.6, y: 5.95, w: 7.3, h: 0.3, fontSize: 12, color: HEX.green, bold: true, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: 'Avoided line' });
card(s, 8.3, 1.35, 4.4, 1.75, 'ALL ' + T.n + ' LISTED PROJECTS', 'DERIVED', fCr(T.tcoB - T.tco), pct(T.tco, T.tcoB) + '% below a software company; ' + num(T.pd) + ' person-days either way.', 'All');
/* added project box */
s.addShape(pres.ShapeType.rect, { x: 8.3, y: 3.3, w: 4.4, h: 2.95, fill: { color: HEX.warn }, line: { color: 'E4B33E', width: 1 }, objectName: 'Paradeep box' });
s.addText('Added project: Paradeep Ports', { x: 8.5, y: 3.4, w: 4.0, h: 0.32, fontSize: 14, bold: true, color: HEX.ink, margin: 0, fontFace: FONT, isTextBox: true, objectName: 'Paradeep heading' });
const prow = (y, label, value, kind) => { s.addText(label, { x: 8.5, y, w: 2.55, h: 0.5, fontSize: 12, color: HEX.ink, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: 'Paradeep ' + label.slice(0, 12) }); s.addText(value, { x: 11.0, y, w: 1.6, h: 0.5, fontSize: 14, bold: true, color: HEX.steel, align: 'right', margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: 'Paradeep value ' + label.slice(0, 8) }); };
prow(3.78, 'Project cost, the investment (STATED)', fL(par.costRs));
prow(4.28, 'Time saved: ' + num(par.annualHours) + ' man-hours = ' + num(par.manDays) + ' man-days a year (STATED)', num(par.manDays) + ' days');
prow(4.78, 'Worth at the ₹' + num(par.midRatePerDay) + ' Mid man-day rate (DERIVED)', '≈ ' + fL(par.valueRsPerYear) + ' a year');
prow(5.28, 'Simple payback (DERIVED)', '≈ ' + par.paybackYears.toFixed(1) + ' years');
s.addText('The ₹17 L is what the project cost, not a saving.', { x: 8.5, y: 5.82, w: 4.0, h: 0.3, fontSize: 11, italic: true, color: HEX.grey, margin: 0, fontFace: FONT, isTextBox: true, objectName: 'Paradeep caution' });
note(s, 'Derived, not recorded: the project list holds no costs, so each listed project is costed with the estimator\'s standard assumptions (one person, Senior for AI / ML / vision models else Mid; working days between its dates, 90 if a date is missing; default masters; 3 years). Same effort on both sides: the difference is in-house rates, loadings and mark-up against a software company\'s. SMP2 gave no cost and is not in these totals.', 6.45, 0.55);
s.addNotes('In-house ' + fCr(T.tco, 2) + ' against ' + fCr(T.tcoB, 2) + ' for all ' + T.n + ' listed projects; live ' + fCr(live.tco, 2) + ' against ' + fCr(live.tcoB, 2) + '; in progress ' + fCr(prog.tco, 2) + ' against ' + fCr(prog.tcoB, 2) + '. Paradeep Ports: cost ' + fL(par.costRs) + ' as given by the owner; ' + num(par.annualHours) + ' h / 8 = ' + num(par.manDays) + ' man-days x ' + num(par.midRatePerDay) + ' (Mid rate in the masters) = ' + fL(par.valueRsPerYear) + ' a year; payback ' + par.paybackYears.toFixed(2) + ' years. This is a simple payback on time value only.');

/* ============ 3. FTE and effort ============ */
s = pres.addSlide({ masterName: 'Content' });
s.addText('FTE and effort: working time saved', { placeholder: 'title' });
heading(s, 'Stated reductions, each time the task runs', 0.6, 1.35, 7.4, 'Table heading'); tag(s, 'STATED', 6.95, 1.4);
const perUnitH = (parAssess.beforeMin - parAssess.afterMin) / 60;
const rows = [thead(['Project', 'Task', 'Before', 'After', 'Reduction', '1 FTE equals'], ['left', 'left', 'left', 'left', 'left', 'right'])].concat([
  ['Paradeep Ports', 'Manual assessment per shipment', parAssess.before, parAssess.after, pctTxt(parAssess.less) + ' less', num(H / perUnitH) + ' shipments a year'],
  ['Slab Qualification', 'Non-prime slab identification', slab.before, slab.after, pctTxt(slab.less) + ' less', num(slab.perFteYear) + ' slabs a year'],
  ['Byproduct Management', 'Report preparation', rep.before, rep.after, pctTxt(rep.less) + ' less', num(rep.perFteYear) + ' reports a year']
].map((r) => r.map((t, i) => tcell(t, { align: i === 5 ? 'right' : 'left', bold: i === 4, color: i === 4 ? HEX.green : HEX.ink }))));
s.addTable(rows, { x: 0.6, y: 1.75, w: 7.6, colW: [1.45, 1.8, 0.9, 0.9, 0.95, 1.6], rowH: 0.5, objectName: 'Effort table' });
heading(s, 'Reduction in effort, %', 0.6, 4.0, 7.4, 'Chart heading');
const eff = [[parAssess, 'Paradeep: assessment per shipment'], [slab, 'Slab identification'], [rep, 'Report preparation']];
s.addChart(pres.charts.BAR, [{ name: 'Less effort, %', labels: eff.map((e) => e[1]), values: eff.map((e) => +e[0].less.toFixed(1)) }],
  Object.assign({ x: 0.6, y: 4.35, w: 7.5, h: 2.0, barDir: 'bar', barGapWidthPct: 40, chartColors: [HEX.amber], showLegend: false, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0"%"', catAxisOrientation: 'maxMin', objectName: 'Effort chart' }, chartBase));
card(s, 8.5, 1.35, 4.2, 2.45, 'PARADEEP PORTS, PER YEAR', 'STATED', num(par.annualHours) + ' man-hours',
  num(par.annualHours * 60) + ' minutes saved a year. ' + num(par.annualHours) + ' h = ' + par.fte.toFixed(2) + ' FTE at ' + num(H) + ' h per FTE.', 'Paradeep');
s.addShape(pres.ShapeType.rect, { x: 8.5, y: 4.0, w: 4.2, h: 2.3, fill: { color: HEX.soft }, line: { color: HEX.line, width: 0.75 }, objectName: 'Reading card' });
s.addText([
  { text: 'How to read this', options: { bold: true, breakLine: true } },
  { text: 'Hours and FTE are the owner\'s figures; FTE = hours / ' + num(H) + '.', options: { bullet: true, breakLine: true } },
  { text: 'About ' + num(par.unitsPerYear) + ' shipments a year follows from 36,000 min / 300 min saved each (DERIVED).', options: { bullet: true, breakLine: true } },
  { text: '"1 FTE equals" = runs a year whose saved time adds up to ' + num(H) + ' h.', options: { bullet: true } }
], { x: 8.65, y: 4.1, w: 3.9, h: 2.1, fontSize: 12, color: HEX.ink, margin: 0, valign: 'top', paraSpaceAfter: 4, fontFace: FONT, isTextBox: true, objectName: 'Reading text' });
note(s, 'Effort = people\'s working time. Man-day = 8 hours; 1 FTE = ' + num(H) + ' hours a year. Reductions use the lower figure of a stated range (report preparation 4-5 h taken as 4 h). The project list gives no frequency for slab identification or report preparation, so only the per-run saving is stated.', 6.45, 0.55);
s.addNotes('Paradeep Ports: manual assessment per shipment 360 min to 60 min = ' + parAssess.less + '% less; 36,000 min a year = 600 man-hours (owner\'s figures). 600 / 2,740 = ' + par.fte.toFixed(3) + ' FTE. Slab: 7 man-days to 1 = 6 man-days = 48 h saved per slab; ' + slab.perFteYear + ' slabs a year equal 1 FTE. Report preparation: 4 h to 2 min saves about 3.97 h; ' + rep.perFteYear + ' reports a year equal 1 FTE.');

/* ============ 4. TAT and productivity ============ */
s = pres.addSlide({ masterName: 'Content' });
s.addText('TAT and productivity: faster turnaround, more output', { placeholder: 'title' });
heading(s, 'Turnaround time, reduction in %', 0.6, 1.35, 6.0, 'Chart heading'); tag(s, 'STATED', 5.65, 1.4);
const tat = [[yard, 'Coil tracing: 160 min → 10 s'], [commit, 'SCM commitment report: 4 days → 3 min'], [qrm, 'Quality KPI capture: 3 days → 1 h'], [crms, 'Manpower distribution: 5 h → 1 h']];
s.addChart(pres.charts.BAR, [{ name: 'Faster, %', labels: tat.map((t) => t[1]), values: tat.map((t) => +t[0].less.toFixed(1)) }],
  Object.assign({ x: 0.6, y: 1.75, w: 6.2, h: 3.2, barDir: 'bar', barGapWidthPct: 40, chartColors: [HEX.steel], showLegend: false, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0"%"', catAxisOrientation: 'maxMin', objectName: 'TAT chart' }, chartBase, { catAxisLabelFontSize: 11 }));
/* SMP2 panel */
s.addShape(pres.ShapeType.rect, { x: 7.1, y: 1.35, w: 5.6, h: 3.6, fill: { color: HEX.soft }, line: { color: HEX.line, width: 0.75 }, objectName: 'SMP2 panel' });
s.addText('SMP2 Digital Transformation, Hazira Operations', { x: 7.3, y: 1.45, w: 4.3, h: 0.3, fontSize: 14, bold: true, color: HEX.ink, margin: 0, fontFace: FONT, isTextBox: true, objectName: 'SMP2 heading' });
tag(s, 'STATED', 11.6, 1.48);
s.addText('September 2026 figures: one month, not annualised', { x: 7.3, y: 1.78, w: 5.2, h: 0.28, fontSize: 11, italic: true, color: HEX.grey, margin: 0, fontFace: FONT, isTextBox: true, objectName: 'SMP2 period' });
s.addText('25.6 h', { x: 7.3, y: 2.08, w: 1.9, h: 0.6, fontSize: 32, bold: true, color: HEX.steel, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: 'SMP2 value' });
s.addText('recoverable furnace time, about 15 additional heats, by bringing slower heats to the 79 min median tap-to-tap time.', { x: 9.25, y: 2.05, w: 3.3, h: 0.7, fontSize: 12, color: HEX.ink, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: 'SMP2 text' });
s.addText('Above the median, slowest quarter of heats (min per heat)', { x: 7.3, y: 2.85, w: 5.2, h: 0.28, fontSize: 12, bold: true, color: HEX.ink, margin: 0, fontFace: FONT, isTextBox: true, objectName: 'SMP2 chart heading' });
s.addChart(pres.charts.BAR, [{ name: 'min/heat above median', labels: ['Arcing', 'Blowing'], values: [10.5, 7.0] }],
  Object.assign({ x: 7.2, y: 3.1, w: 5.4, h: 1.2, barDir: 'bar', barGapWidthPct: 35, chartColors: [HEX.amber], showLegend: false, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', catAxisOrientation: 'maxMin', objectName: 'SMP2 chart' }, chartBase));
s.addText('Aligning Conarc3 to Conarc2 adds about 1.8 h more furnace time.', { x: 7.3, y: 4.4, w: 5.2, h: 0.4, fontSize: 12, color: HEX.ink, margin: 0, valign: 'top', fontFace: FONT, isTextBox: true, objectName: 'SMP2 Conarc' });
/* other productivity */
heading(s, 'Other productivity gains', 0.6, 5.1, 6, 'Productivity heading'); tag(s, 'STATED', 3.3, 5.15);
const chips = [['+70 t/day', 'blast-furnace production (C-MARVEL)'], ['₹615 / ton', 'lower cost of production, Hazira (C-MARVEL)'], ['30% lower', 'demurrage with real-time visibility (Stowage Plan)']];
chips.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  s.addShape(pres.ShapeType.rect, { x, y: 5.5, w: 3.95, h: 0.85, fill: { color: HEX.soft }, line: { color: HEX.line, width: 0.75 }, objectName: 'Chip ' + (i + 1) });
  s.addText(c[0], { x: x + 0.15, y: 5.55, w: 1.55, h: 0.75, fontSize: 18, bold: true, color: HEX.steel, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: 'Chip value ' + (i + 1) });
  s.addText(c[1], { x: x + 1.75, y: 5.55, w: 2.1, h: 0.75, fontSize: 12, color: HEX.ink, margin: 0, valign: 'middle', fontFace: FONT, isTextBox: true, objectName: 'Chip text ' + (i + 1) });
});
note(s, 'TAT = elapsed time (a day is taken as 24 hours). A TAT reduction is not converted to FTE or rupees: the project list gives no frequency. SMP2\'s figures are for September 2026 as given by the owner and are not multiplied up to a year.', 6.5, 0.45);
s.addNotes('SMP2 Digital Transformation (September 2026): data-driven heat-cycle analysis identifies 25.6 h of recoverable furnace time (about 15 additional heats) by bringing slower heats to the median tap-to-tap time of 79 min. Quickest gains: blowing 7.0 min/heat and arcing 10.5 min/heat above the median in the slowest quarter of heats. Aligning Conarc3 to Conarc2 adds about 1.8 h. TAT reductions: coil tracing 160 min to 10 s; SCM commitment report 4 days to 3 min; quality KPI capture 3 days to 1 h; manpower distribution 5 h to 1 h.');

/* ============ 5. basis and gaps ============ */
s = pres.addSlide({ masterName: 'Content' });
s.addText('What is stated, what is derived, and what is still missing', { placeholder: 'title' });
const cols = [
  ['STATED', HEX.green, [
    'Before and after figures quoted from the project list: ' + st.length + ' figures from ' + new Set(st.map((x) => x.sr)).size + ' project entries.',
    'Paradeep Ports and SMP2 Digital Transformation, as given by their owners (not in the July list).',
    'Hours saved, TAT, heats and tons: as written, never multiplied up.']],
  ['DERIVED', HEX.amberText, [
    'Cost of the ' + T.n + ' listed projects with the estimator\'s standard costing (one person, working days between dates, default masters, 3 years).',
    'Avoided cost = software-company price minus in-house cost.',
    'FTE = hours / ' + num(H) + '. Paradeep\'s ₹ value and payback use the ₹' + num(par.midRatePerDay) + ' Mid man-day rate.']],
  ['STILL MISSING', HEX.rust, [
    'No rupee gain (Cal-2) is recorded for these projects; Efforts Saving (man-hours) is empty.',
    D.withNoTextAtAll + ' of ' + T.n + ' listed projects have no benefit text at all.',
    'SMP2 has no cost, and no yearly figure (September only). The status of both added projects was not given: treated as live.']]
];
cols.forEach((c, i) => {
  const x = 0.6 + i * 4.1, w = 3.95;
  s.addShape(pres.ShapeType.rect, { x, y: 1.4, w, h: 3.55, fill: { color: HEX.soft }, line: { color: HEX.line, width: 0.75 }, objectName: c[0] + ' card' });
  s.addText(c[0], { x: x + 0.2, y: 1.5, w: w - 0.4, h: 0.35, fontSize: 14, bold: true, color: c[1], margin: 0, fontFace: FONT, isTextBox: true, objectName: c[0] + ' heading' });
  s.addText(c[2].map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < c[2].length - 1 } })), { x: x + 0.2, y: 1.9, w: w - 0.4, h: 2.95, fontSize: 13, color: HEX.ink, margin: 0, valign: 'top', paraSpaceAfter: 6, fontFace: FONT, isTextBox: true, objectName: c[0] + ' text' });
});
s.addShape(pres.ShapeType.rect, { x: 0.6, y: 5.1, w: 12.1, h: 1.2, fill: { color: HEX.warn }, line: { color: 'E4B33E', width: 1 }, objectName: 'Ask card' });
s.addText([
  { text: 'To turn these into yearly ₹, FTE and TAT totals, ask each project owner for one number: how often the task runs (shipments a year, reports a day, heats a month).', options: { bold: true, breakLine: true } },
  { text: 'Then: saved time x runs per year x cost per hour. Money here is an avoided external price, not cash released; a project cost is an investment, not a saving.' }
], { x: 0.8, y: 5.18, w: 11.7, h: 1.05, fontSize: 13, color: HEX.ink, margin: 0, valign: 'middle', paraSpaceAfter: 4, fontFace: FONT, isTextBox: true, objectName: 'Ask text' });
note(s, 'Scope: listed projects whose dates overlap ' + periodText + ', plus every project marked In Progress; ' + D.counts.left + ' of ' + D.counts.workbook + ' listed projects left out (dated outside the period and not in progress, no dates and not in progress, or failed). Source: CA_Projects_List_As_of_July_2026.xlsx and the owners\' notes of 29 October 2026.', 6.45, 0.55);
s.addNotes('Method files: database/tools/derive_ca_projects_deck.js (figures), ca_projects_extra.json (the two added projects), build_hod_benefits_deck.js (this deck).');

pres.writeFile({ fileName: outPptx }).then(() => console.log('written', outPptx));
