/* ==================================================================
   Builds docs/CA_Estimator_Overview_v10.pptx: an 8-slide overview of the site (what it does, how a project flows, architecture,
   how costs are worked out, health check, what v10 optimised, recommendations). The text follows docs/REVIEW_v10.md.

   Usage (Node 18+; needs pptxgenjs:  npm install pptxgenjs):
     node build_site_overview_deck.js <output.pptx> ["29 October 2026"]
   ================================================================== */
'use strict';
const pptxgen = require('pptxgenjs');

const [outPptx, dateText] = process.argv.slice(2);
if (!outPptx) { console.error('Usage: node build_site_overview_deck.js <output.pptx> [date text]'); process.exit(2); }
const TODAY = dateText || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const HEX = { ink: '15222A', steel: '0D5E72', steelSoft: 'DDEBF0', amber: 'C98A00', amberText: '8A5F00', green: '1F7A45', rust: 'B3411A', grey: '566872', soft: 'EEF3F5', line: 'D3DBE0', white: 'FFFFFF', warn: 'FFF8E6' };
const FONT = 'Calibri';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.title = 'Central Automation estimate and quotation: site overview (v10)';
pres.author = 'Central Automation';
pres.defineSlideMaster({
  title: 'Content', background: { color: HEX.white },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 12.1, h: 0.8, fontSize: 30, bold: true, color: HEX.ink, margin: 0, valign: 'middle', align: 'left', fontFace: FONT }, text: '' } },
    { text: { text: 'Central Automation  |  Estimate and quotation site: overview, v10, ' + TODAY, options: { x: 0.6, y: 7.08, w: 11, h: 0.3, fontSize: 10, color: HEX.grey, margin: 0, isTextBox: true, fontFace: FONT } } }
  ],
  slideNumber: { x: 12.2, y: 7.08, w: 0.55, h: 0.3, fontSize: 10, color: HEX.grey, align: 'right', fontFace: FONT }
});
pres.defineSlideMaster({ title: 'Cover', background: { color: HEX.steel }, objects: [] });

const T = (s, text, o) => s.addText(text, Object.assign({ margin: 0, fontFace: FONT, color: HEX.ink, isTextBox: true, valign: 'top' }, o));
const box = (s, x, y, w, h, fill, line, name) => s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: fill || HEX.soft }, line: { color: line || HEX.line, width: 0.75 }, objectName: name });
const bullets = (items) => items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } }));
function card(s, x, y, w, h, head, sub, items, name, accent) {
  box(s, x, y, w, h, HEX.soft, HEX.line, name + ' card');
  T(s, head, { x: x + 0.22, y: y + 0.18, w: w - 0.44, h: 0.4, fontSize: 18, bold: true, color: accent || HEX.steel, objectName: name + ' head' });
  if (sub) T(s, sub, { x: x + 0.22, y: y + 0.6, w: w - 0.44, h: 0.35, fontSize: 12, italic: true, color: HEX.grey, objectName: name + ' sub' });
  T(s, bullets(items), { x: x + 0.22, y: y + (sub ? 1.0 : 0.7), w: w - 0.44, h: h - (sub ? 1.1 : 0.8), fontSize: 13, paraSpaceAfter: 5, objectName: name + ' text' });
}

/* 1. cover */
let s = pres.addSlide({ masterName: 'Cover' });
T(s, 'Central Automation', { x: 0.8, y: 1.2, w: 11.7, h: 0.5, fontSize: 20, color: 'CFE3EA', objectName: 'Cover kicker' });
T(s, 'Estimate and quotation site: overview', { x: 0.8, y: 1.8, w: 11.7, h: 1.0, fontSize: 40, bold: true, color: HEX.white, objectName: 'Cover title' });
T(s, 'What it does, how it works, how healthy it is, and what to do next', { x: 0.8, y: 2.9, w: 11.7, h: 0.5, fontSize: 20, color: HEX.white, objectName: 'Cover subtitle' });
const kp = [['4', 'pages: estimator, Excel upload, report, login'], ['2', 'cost bases: in-house and a software company'], ['0', 'internet needed: every library on the server'], ['v10', 'this review, ' + TODAY]];
kp.forEach((k, i) => {
  const x = 0.8 + i * 3.0;
  s.addShape(pres.ShapeType.rect, { x, y: 4.3, w: 2.8, h: 1.7, fill: { color: '0A4B5B' }, line: { color: '2E7F93', width: 0.75 }, objectName: 'Cover stat ' + (i + 1) });
  T(s, k[0], { x: x + 0.2, y: 4.4, w: 2.4, h: 0.7, fontSize: 36, bold: true, color: HEX.white, objectName: 'Cover stat value ' + (i + 1) });
  T(s, k[1], { x: x + 0.2, y: 5.15, w: 2.4, h: 0.75, fontSize: 13, color: 'CFE3EA', objectName: 'Cover stat text ' + (i + 1) });
});
s.addNotes('Overview of the Central Automation estimate and quotation site as of branch v10. Detail in docs/REVIEW_v10.md.');

/* 2. what it does */
s = pres.addSlide({ masterName: 'Content' });
s.addText('What the site does', { placeholder: 'title' });
const cw = 2.9, gx = 0.17;
card(s, 0.6, 1.4, cw, 3.6, 'Estimate', 'Estimator: Registration', ['Step by step: team, servers, licences, support, value', 'Central Automation cost against a software company\'s price', 'Quotation to print, with both prices'], 'Estimate');
card(s, 0.6 + (cw + gx), 1.4, cw, 3.6, 'Register and approve', 'Estimator: Approval', ['Submit for verification', 'Verify, send back with a comment, or recalculate with new rates', 'Full history of every entry'], 'Approve');
card(s, 0.6 + 2 * (cw + gx), 1.4, cw, 3.6, 'Upload in bulk', 'Excel upload page', ['Template with drop-down lists from the masters', 'One row per project, costed at once', 'Duplicates and clashes flagged before sending'], 'Upload');
card(s, 0.6 + 3 * (cw + gx), 1.4, cw, 3.6, 'Report', 'Report page', ['Filter, totals, CSV for Excel', 'PDF of each estimate in the quotation layout', 'Readable on phones, tablets and big screens'], 'Report');
T(s, 'Masters (rates, prices, loadings, value rates) feed every new estimate; each estimate keeps its own copy until it is recalculated.', { x: 0.6, y: 5.25, w: 12.1, h: 0.5, fontSize: 13, color: HEX.grey, objectName: 'Masters note' });

/* 3. how a project flows */
s = pres.addSlide({ masterName: 'Content' });
s.addText('How a project flows through the site', { placeholder: 'title' });
const steps = [['Masters', 'Rates and prices set by admins'], ['Estimate', 'On the page, or many at once from Excel'], ['Submit', 'Saved with its costs and its own rates'], ['Approval', 'Verify, send back, or recalculate'], ['Report', 'Totals, CSV, PDF quotation']];
steps.forEach((st, i) => {
  const x = 0.6 + i * 2.45;
  s.addShape(pres.ShapeType.chevron, { x, y: 1.7, w: 2.35, h: 1.2, fill: { color: i === 3 ? HEX.amber : HEX.steel }, line: { color: HEX.white, width: 1 }, objectName: 'Step ' + (i + 1) });
  T(s, st[0], { x: x + 0.35, y: 1.95, w: 1.7, h: 0.7, fontSize: 17, bold: true, color: HEX.white, align: 'center', valign: 'middle', objectName: 'Step label ' + (i + 1) });
  T(s, st[1], { x, y: 3.05, w: 2.3, h: 0.8, fontSize: 13, align: 'center', objectName: 'Step text ' + (i + 1) });
});
box(s, 0.6, 4.2, 12.1, 2.1, HEX.soft, HEX.line, 'States box');
T(s, 'Review states of an entry', { x: 0.85, y: 4.35, w: 6, h: 0.35, fontSize: 15, bold: true, objectName: 'States head' });
T(s, bullets(['Awaiting verification: just submitted (or resubmitted); the submitter can still edit it', 'Needs information: sent back with a comment; the submitter edits and replies', 'Verified: final and counted in the totals; it changes only through a logged recalculation']),
  { x: 0.85, y: 4.8, w: 11.6, h: 1.45, fontSize: 13, paraSpaceAfter: 4, objectName: 'States text' });

/* 4. architecture */
s = pres.addSlide({ masterName: 'Content' });
s.addText('How it is built', { placeholder: 'title' });
const cols = [
  ['Browser', ['Pages: estimator, upload, report', 'estimator.js works out every cost', 'xlsx-lite.js reads and writes Excel', 'jsPDF and html2canvas make the PDF', 'All files served by the site']],
  ['IIS, ASP.NET 4.8', ['LoginModule: one shared password, 8-hour cookie', 'api/estimator.ashx: JSON for the pages', 'Report page drawn on the server', 'Db over dbClassSql: one shared connection', 'Strict content security policy']],
  ['SQL Server', ['SwProjectRegister: entries, figures, estimate', 'SwProjectLog: history of each entry', 'Master tables and their audit', 'Views for yearly totals', 'Scripts 01 to 07 to install and import']]
];
cols.forEach((c, i) => {
  const x = 0.6 + i * 4.15;
  box(s, x, 1.4, 3.85, 4.3, i === 1 ? HEX.steelSoft : HEX.soft, HEX.line, c[0] + ' box');
  T(s, c[0], { x: x + 0.22, y: 1.55, w: 3.4, h: 0.45, fontSize: 18, bold: true, color: HEX.steel, objectName: c[0] + ' head' });
  T(s, bullets(c[1]), { x: x + 0.22, y: 2.1, w: 3.45, h: 3.5, fontSize: 13, paraSpaceAfter: 5, objectName: c[0] + ' text' });
  if (i < 2) s.addShape(pres.ShapeType.rightArrow, { x: x + 3.88, y: 3.3, w: 0.25, h: 0.4, fill: { color: HEX.grey }, line: { color: HEX.grey }, objectName: 'Arrow ' + (i + 1) });
});
T(s, 'No internet at any point: no CDN, no web fonts, no outside calls. Deployed on an intranet IIS server; published from Visual Studio.', { x: 0.6, y: 5.95, w: 12.1, h: 0.5, fontSize: 13, color: HEX.grey, objectName: 'Offline note' });

/* 5. how costs are worked out */
s = pres.addSlide({ masterName: 'Content' });
s.addText('How costs are worked out', { placeholder: 'title' });
card(s, 0.6, 1.4, 3.9, 3.7, 'Inputs', 'Typed or from Excel', ['Team: people, level, days', 'Servers or cloud, storage, GPU', 'Database, operating system, other licences', 'Support (AMC) and years of ownership', 'Benefits: quantity x rate, per year or once'], 'Inputs');
card(s, 4.7, 1.4, 3.9, 3.7, 'Two prices', 'Same work, two cost bases', ['Central Automation: internal rates, actual purchase prices, own loadings', 'Software company: market rates, higher loadings and mark-up', 'Saving = the difference: an avoided price, not cash'], 'Bases', HEX.amberText);
card(s, 8.8, 1.4, 3.9, 3.7, 'Outputs', 'Recorded with the entry', ['One-time cost, yearly running cost, total over the years', 'Person-days and team size', 'Value created, return and payback', 'A copy of the rates used, so a master change never alters it silently'], 'Outputs');
T(s, 'After a master change, Approval > Recalculate applies the new rates to chosen entries (preview first, every change written to the history).', { x: 0.6, y: 5.3, w: 12.1, h: 0.5, fontSize: 13, color: HEX.grey, objectName: 'Recalc note' });

/* 6. health check */
s = pres.addSlide({ masterName: 'Content' });
s.addText('Health check', { placeholder: 'title' });
const RATE = { Good: [HEX.green, 'E3F1E8'], Watch: [HEX.amberText, 'FBF0D9'], Act: [HEX.rust, 'F7E1D9'] };
const rows = [
  ['Offline and security headers', 'Good', 'All libraries local; strict content security policy; no inline script'],
  ['Usability', 'Good', 'Fluid from 360 to 2,560 px; dark theme; report readable on phones and tablets'],
  ['Performance', 'Watch', 'Improved in v10; every estimator open still loads every saved estimate'],
  ['Data and audit', 'Watch', 'Full history, but deleting an entry deletes its history'],
  ['Code structure', 'Watch', 'estimator.js is one large file; one shared database connection'],
  ['Identity and access', 'Act', 'One shared password: no real names, approval rules cannot be enforced'],
  ['Testing', 'Act', 'Browser tests exist but are not in the project or run before releases']
];
const cell = (t, o) => ({ text: t, options: Object.assign({ fontSize: 13, color: HEX.ink, fontFace: FONT, valign: 'middle', margin: [0.04, 0.1, 0.04, 0.1], border: { type: 'solid', color: HEX.line, pt: 0.75 } }, o) });
s.addTable([[cell('Area', { bold: true, color: HEX.white, fill: { color: HEX.steel } }), cell('State', { bold: true, color: HEX.white, fill: { color: HEX.steel } }), cell('Why', { bold: true, color: HEX.white, fill: { color: HEX.steel } })]]
  .concat(rows.map((r) => [cell(r[0], { bold: true }), cell(r[1], { bold: true, align: 'center', color: RATE[r[1]][0], fill: { color: RATE[r[1]][1] } }), cell(r[2])])),
  { x: 0.6, y: 1.4, w: 12.1, colW: [3.2, 1.2, 7.7], rowH: 0.6, objectName: 'Health table' });

/* 7. optimised in v10 */
s = pres.addSlide({ masterName: 'Content' });
s.addText('Optimised in v10', { placeholder: 'title' });
const opt = [
  ['~50 bytes', 'instead of 0.4 to 0.8 MB', 'Register refresh', 'Every open estimator tab refreshed the whole register each minute. Now the server answers "unchanged" when nothing changed.'],
  ['700 KB less', 'when the report opens', 'Report page', 'The PDF libraries and the estimator load on the first PDF click, once, instead of with every visit.'],
  ['5 to 10 x smaller', 'pages, scripts and data', 'Compression', 'Switched on in Web.config. Needs the IIS feature "Dynamic Content Compression" for the API.']
];
opt.forEach((o, i) => {
  const x = 0.6 + i * 4.1;
  box(s, x, 1.4, 3.9, 3.4, HEX.soft, HEX.line, 'Opt ' + (i + 1));
  T(s, o[2].toUpperCase(), { x: x + 0.25, y: 1.6, w: 3.4, h: 0.3, fontSize: 12, bold: true, color: HEX.grey, charSpacing: 1, objectName: 'Opt label ' + (i + 1) });
  T(s, o[0], { x: x + 0.25, y: 2.0, w: 3.4, h: 0.7, fontSize: 30, bold: true, color: HEX.green, objectName: 'Opt value ' + (i + 1) });
  T(s, o[1], { x: x + 0.25, y: 2.7, w: 3.4, h: 0.4, fontSize: 14, color: HEX.ink, objectName: 'Opt sub ' + (i + 1) });
  T(s, o[3], { x: x + 0.25, y: 3.3, w: 3.4, h: 1.4, fontSize: 13, color: HEX.ink, objectName: 'Opt text ' + (i + 1) });
});
T(s, 'Tested in the browser: the refresh sends and honours the signature; the report opens without the libraries and the first PDF click loads them and downloads the PDF; earlier tests still pass.', { x: 0.6, y: 5.05, w: 12.1, h: 0.6, fontSize: 12, color: HEX.grey, objectName: 'Tested note' });

/* 8. recommendations */
s = pres.addSlide({ masterName: 'Content' });
s.addText('Recommendations', { placeholder: 'title' });
const rec = [
  ['Now', 'days', HEX.rust, ['HTTPS and a long shared password', 'Install Dynamic Content Compression', 'Add the browser tests to the project; run them before each release', 'Nightly backup and a tested restore']],
  ['Next', 'weeks', HEX.amberText, ['Windows / AD sign-in: real names, real approval rules', 'Load an estimate only when it is opened', 'Long cache for static files with a version in the URL', 'Record deletions; sort and choose columns in the report']],
  ['Later', 'months', HEX.steel, ['Split estimator.js into modules', 'One database connection per request', 'Record benefits as numbers (time per run, runs a year, ₹)', 'Costing shared with the server for checks and reports']]
];
rec.forEach((r, i) => {
  const x = 0.6 + i * 4.1;
  box(s, x, 1.4, 3.9, 3.9, HEX.soft, HEX.line, r[0] + ' box');
  T(s, r[0], { x: x + 0.25, y: 1.55, w: 2.0, h: 0.5, fontSize: 24, bold: true, color: r[2], objectName: r[0] + ' head' });
  T(s, r[1], { x: x + 2.3, y: 1.68, w: 1.35, h: 0.35, fontSize: 13, italic: true, color: HEX.grey, align: 'right', objectName: r[0] + ' when' });
  T(s, bullets(r[3]), { x: x + 0.25, y: 2.2, w: 3.45, h: 3.0, fontSize: 14, paraSpaceAfter: 8, objectName: r[0] + ' text' });
});
T(s, 'Details, reasons and effort for each item: docs/REVIEW_v10.md', { x: 0.6, y: 5.5, w: 12.1, h: 0.35, fontSize: 12, color: HEX.grey, objectName: 'Review link' });

pres.writeFile({ fileName: outPptx }).then(() => console.log('written', outPptx));
