/* ==================================================================
   Derives the figures for the "CA projects, Nov 2025 to Nov 2026" slides from the Central Automation project list workbook.

   Usage (Node 18+ with Playwright installed; Chromium is used headless):
     node derive_ca_projects_deck.js "CA_Projects_List_As_of_July_2026.xlsx" <output folder>
   Writes <output folder>\deck_data.json (every number on the slides) and <output folder>\projects.csv (one row per project in scope).

   Which projects: those whose Start / End dates overlap 1 Nov 2025 to 30 Nov 2026, plus every project whose status is In Progress
   (dated outside that period, or with no dates). "Failed" projects are left out.

   Cost: NOT re-implemented here. As in generate_ca_projects_import.js the real estimator page (web\project_registry.aspx and
   web\assets\js\estimator.js, served from memory) costs every project with the same assumptions as script 07:
     team           1 person: Senior for AI / ML / vision / digital twin / mathematical model, else Mid (FTE from the sheet when given)
     duration       working days (Mon-Fri) from Start to End; "till date" = 31 Jul 2026, "till next year" = 31 Mar 2027; a missing date = 90 days
     everything else the estimator's defaults (100 users, 8 cores, 32 GB, 2 TB, SQL Server Standard, Windows Server, 3 years, default masters)
   The full cost of each project is used (it is not pro-rated to the period).
   Benchmark = what a software company would charge (the estimator's benchmark rates and loadings; with the default masters the
   benchmark effort factor is 1, so the person-days are the same and only the rates and loadings differ).

   "Stated in the sheet": before / after figures that the Key Benefit, Considerations or Description text of a project gives. Each one below is
   checked against the workbook text when the script runs (a quotation that is not in the sheet stops the script).
   "Other benefits": themes found by keywords in the Key Benefit text (fallback: Short Description); the keyword rules are below.
   ================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const [xlsxPath, outDir] = process.argv.slice(2);
if (!xlsxPath || !outDir) { console.error('Usage: node derive_ca_projects_deck.js <workbook.xlsx> <output folder>'); process.exit(2); }

const WEB = path.resolve(__dirname, '..', '..', 'web');
const AS_OF = new Date(Date.UTC(2026, 6, 31));
const NEXT_YEAR_END = new Date(Date.UTC(2027, 2, 31));
const W0 = new Date(Date.UTC(2025, 10, 1)), W1 = new Date(Date.UTC(2026, 10, 30));   // the period
const DEFAULT_DAYS = 90;
const DEFAULT_FY = '2026-27';

/* ---------- mappings (the same as generate_ca_projects_import.js) ---------- */
const SENIOR_TYPES = new Set(['ai model', 'vision ai model', 'ml model', 'digital twin / ml model', 'mathematical model / ai', 'mathematical model']);
const VHIGH_TYPES = new Set(['ai model', 'vision ai model', 'ml model', 'digital twin / ml model', 'mathematical model / ai']);
const HIGH_TYPES = new Set(['mathematical model', 'rule base model']);
const INTERFACE_TYPES = new Set(['ot-infra', 'cybersecurity']);
const norm = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const key = (v) => norm(v).toLowerCase();
function projectType(work) { const k = key(work); return VHIGH_TYPES.has(k) ? 'ai' : INTERFACE_TYPES.has(k) ? 'interface' : 'web'; }
function complexityCode(work) { const k = key(work); return VHIGH_TYPES.has(k) ? 'vhigh' : HIGH_TYPES.has(k) ? 'high' : 'std'; }
function level(work) { return SENIOR_TYPES.has(key(work)) ? 'Senior' : 'Mid'; }

/* ---------- dates ---------- */
function serialToDate(n) { return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000); }
function toDate(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v > 20000 ? serialToDate(v) : null;
  const s = norm(v).toLowerCase();
  if (s === 'till date') return AS_OF;
  if (s === 'till next year') return NEXT_YEAR_END;
  const m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);
  return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : null;
}
function workingDays(a, b) {
  let n = 0;
  for (let t = a.getTime(); t <= b.getTime(); t += 86400000) { const d = new Date(t).getUTCDay(); if (d !== 0 && d !== 6) n++; }
  return Math.max(1, n);
}
/* Business KPI names as written in the sheet differ in case and wording: bring the same KPI under one name */
const KPI_NAMES = { 'quality & process excelence': 'Quality', 'quality': 'Quality', 'safety and asset integrity': 'HSE and safety', 'hse': 'HSE and safety',
  'work force optimization': 'Workforce optimisation', 'productivity': 'Productivity', 'reliability': 'Reliability', 'sustainability': 'Sustainability', 'others': 'Others' };
const kpiName = (v) => KPI_NAMES[key(v)] || norm(v);
const iso = (d) => (d ? d.toISOString().slice(0, 10) : '');
const fyOf = (d) => { const y = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; return y + '-' + String((y + 1) % 100).padStart(2, '0'); };

/* ---------- other benefits: keyword rules (a project can have several) ---------- */
const THEMES = [
  ['Turnaround time and time saved', /\btat\b|turn ?around|time saving|saves? time|time reduc|faster|quick|reduc\w* (?:in )?(?:the )?(?:time|hours|days|effort)|minutes?\b/i],
  ['Manual work and reporting removed', /manual|automat|man[- ]?hours|man[- ]?days|elimination|paperless|auto[- ]|data (?:gathering|collection|compil)|report (?:preparation|generation)/i],
  ['Real-time visibility and tracking', /real[- ]?time|realtime|online|live\b|visibility|tracking|traceab|monitor|dashboard/i],
  ['Early warning, predictive maintenance, reliability', /predict|early (?:detection|warning)|alert|failure|breakdown|reliab|downtime|health|anomal|abnormal/i],
  ['Quality, productivity and process control', /quality|defect|yield|rejection|scarf|grade|accura|optimi[sz]|stabil|rework|correct|productiv|throughput/i],
  ['Safety and hazard avoidance', /safety|hazard|hse|risk|ppe|safe\b|unsafe/i],
  ['Cost, energy and material savings', /\bcost|energy|fuel|consumption|loss|saving|revenue|profit|margin|inventory/i],
  ['Approvals, records and compliance', /approval|audit|compliance|record|workflow|standardi[sz]|statutory/i],
  ['Obsolete systems replaced, cyber-security and infrastructure', /obsolete|upgrad|replace|iso 27000|tisax|firewall|dmz|virtuali[sz]ation|cyber|security|network|wifi|hardware/i]
];
const THEME_WITH_NAME = 'Obsolete systems replaced, cyber-security and infrastructure';   // this rule also reads the project name and type of work

/* ---------- read the workbook rows into project objects ---------- */
function toProjects(rows) {
  const hdr = rows[0].map(norm);
  const col = (name) => hdr.indexOf(name);
  const C = { sr: col('Sr. No.'), loc: col('Location'), kpi: col('Business KPI'), work: col('Type of work'), dept: col('Department'), status: col('STATUS'),
    name: col('Project'), start: col('Start Date'), end: col('End Date'), fte: col('FTE'), cal2: col('Cal-2'), cons: col('Considerations'),
    benefit: col('Key Benefit'), desc: col('Short Description') };
  for (const k of Object.keys(C)) if (C[k] < 0) throw new Error('Column not found in the workbook: ' + k);
  const out = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i] || [];
    if (!norm(r[C.name])) continue;
    const start = toDate(r[C.start]), end = toDate(r[C.end]);
    let days = DEFAULT_DAYS, basis = 'default ' + DEFAULT_DAYS + ' days (a date is missing)';
    if (start && end && end >= start) { days = workingDays(start, end); basis = iso(start) + ' to ' + iso(end); }
    const first = start || end, last = end || start;
    const st = key(r[C.status]).replace(/-/g, ' ');
    out.push({
      sr: r[C.sr], name: norm(r[C.name]), loc: norm(r[C.loc]), kpi: kpiName(r[C.kpi]), work: norm(r[C.work]), dept: norm(r[C.dept]),
      statusText: norm(r[C.status]), inProgress: st === 'in progress', failed: st === 'failed',
      start, end, dated: !!first, inPeriod: !!(first && first <= W1 && last >= W0),
      type: projectType(r[C.work]), cx: complexityCode(r[C.work]), level: level(r[C.work]),
      people: typeof r[C.fte] === 'number' && r[C.fte] > 0 ? r[C.fte] : 1, days, basis,
      fy: first ? fyOf(first) : DEFAULT_FY, gained: typeof r[C.cal2] === 'number' ? r[C.cal2] : 0,
      benefit: String(r[C.benefit] == null ? '' : r[C.benefit]), cons: String(r[C.cons] == null ? '' : r[C.cons]), desc: String(r[C.desc] == null ? '' : r[C.desc])
    });
  }
  return out;
}

/* ---------- figures stated in the sheet (verified against the workbook text; checked project by project) ---------- */
/* sr: the project's Sr. No. quote: text that must appear in the project's Key Benefit / Considerations / Description. */
const pctLess = (before, after) => Math.round((1 - after / before) * 1000) / 10;
const STATED = [
  { sr: 5,   what: 'Quality KPI capture (QRM)',            kind: 'time',   before: '3 days',          after: '1 hour',         quote: 'TAT reduced from 3 days to 1 hours' },
  { sr: 23,  what: 'Manpower distribution (CRMS)',          kind: 'time',   before: '5 hours',         after: '1 hour',         less: pctLess(5, 1),     quote: 'TAT reduced from 5 hours to 1 hour for manpower distribution' },
  { sr: 26,  what: 'Non-prime slab identification',         kind: 'effort', before: '7 man-days',      after: '1 man-day',      less: pctLess(7, 1),     quote: 'Earlier 7 man-days were being used' },
  { sr: 106, what: 'Non-prime slab identification (phase 2)', kind: 'effort', before: '7 man-days',    after: '1 man-day',      less: pctLess(7, 1),     quote: 'Earlier 7 man-days were being used' },
  { sr: 27,  what: 'Report preparation',                    kind: 'effort', before: '4-5 hours',       after: '1-2 minutes',    quote: 'report preparation time has been reduced from 4-5 hours to 1-2 minutes' },
  { sr: 78,  what: 'Coil tracing turnaround',               kind: 'time',   before: '160 minutes',     after: '10 seconds',     less: pctLess(160 * 60, 10), quote: 'Reduced coil tracing TAT from 160 minutes to 10 seconds' },
  { sr: 116, what: 'SCM commitment report turnaround',      kind: 'time',   before: '4 days',          after: '3 minutes',      quote: 'TAT reduced for SCM team from 4 days to 3 minutes' },
  { sr: 109, what: 'Demurrage',                             kind: 'cost',   before: '',                after: '30% lower',      quote: 'Reduced Demauragge by 30%' },
  { sr: 66,  what: 'Blast furnace production (raw material model)', kind: 'output', before: '',       after: '+70 tons/day',   quote: '70 tons/day increment in the BF production' },
  { sr: 66,  what: 'Cost of production, Hazira (raw material model)', kind: 'cost', before: '',     after: 'Rs 615 per ton lower', quote: 'reduction in cost of production by Rs 615/ Ton' }
];

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  /* The estimator page, served from memory: aspx tags removed, xlsx-lite.js added, estimator.js with a hook before its last line. */
  const html = fs.readFileSync(path.join(WEB, 'project_registry.aspx'), 'utf8').replace(/^<%@[^\n]*\n/, '').replace(/<%[:=][^%]*%>/g, '')
    .replace('<script src="assets/js/estimator.js">', '<script src="assets/js/xlsx-lite.js"></script>\n<script src="assets/js/estimator.js">');
  let js = fs.readFileSync(path.join(WEB, 'assets', 'js', 'estimator.js'), 'utf8');
  const tail = js.lastIndexOf('})();');
  if (tail < 0) throw new Error('estimator.js: closing "})();" not found');
  js = js.slice(0, tail) + 'window.__CA={newEstimate:newEstimate,calc2:calc2,figuresOf:figuresOf,M:M,offline:function(){DBSTATE="off";}};\n' + js.slice(tail);
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/index.html') return route.fulfill({ contentType: 'text/html', body: html });
    if (u.pathname === '/assets/js/estimator.js') return route.fulfill({ contentType: 'application/javascript', body: js });
    if (u.pathname.startsWith('/assets/')) {
      const f = path.join(WEB, u.pathname);
      return fs.existsSync(f) ? route.fulfill({ path: f }) : route.fulfill({ status: 404, body: '' });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.goto('http://ca.local/index.html');
  await page.waitForFunction(() => window.__CA, null, { timeout: 15000 });
  await page.evaluate(() => window.__CA.offline());

  const b64 = fs.readFileSync(xlsxPath).toString('base64');
  const rows = await page.evaluate(async (b64) => {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const book = await window.XlsxLite.read(bytes.buffer);
    const name = book.names.filter((n) => (book.sheets[n][0] || []).some((h) => String(h).trim() === 'Project'))[0] || book.names[0];
    return book.sheets[name];
  }, b64);
  const all = toProjects(rows);

  /* ---------- which projects ---------- */
  const scope = all.filter((p) => !p.failed && (p.inPeriod || p.inProgress));
  scope.forEach((p) => { p.group = p.inPeriod ? (p.inProgress ? 'Dated in the period, in progress' : 'Dated in the period, in use') : (p.dated ? 'In progress, dated outside the period' : 'In progress, no dates'); });
  const left = all.filter((p) => !scope.includes(p));
  const leftWhy = (p) => p.failed ? 'Failed' : p.dated ? 'Dated outside the period, not in progress' : 'No dates, not in progress';

  /* ---------- cost with the estimator's own calculation ---------- */
  const costed = await page.evaluate((projects) => {
    const A = window.__CA;
    return projects.map((p) => {
      const s = A.newEstimate();
      s.name = p.name; s.type = p.type; s.model = 'yearly'; s.days = p.days; s.users = 100;
      s.complexity = +A.M.sw.complexity[p.cx] || 1;
      s.need.man = true; s.need.amc = true; s.need.gpu = false;
      s.team = [{ role: 'Team', level: p.level, people: p.people, days: '', alloc: 100 }];
      s.other = []; s.value.items = [];
      const R = A.calc2(s), B = R.b;
      return { oneTime: R.oneTotal, oneTimeB: B.oneTotal, yearly: R.steady.total, yearlyB: B.steady.total, tco: R.tco, tcoB: B.tco, years: R.H,
        pd: R.pd, pdB: B.pd, people: R.headcount, labour: R.dev, labourB: B.dev, eff: B.eff };
    });
  }, scope.map((p) => ({ name: p.name, type: p.type, days: p.days, cx: p.cx, level: p.level, people: p.people })));
  await browser.close();
  if (pageErrors.length) console.error('Page errors:', pageErrors.slice(0, 3));
  scope.forEach((p, i) => Object.assign(p, { c: costed[i] }));

  /* ---------- themes ---------- */
  scope.forEach((p) => {
    const text = norm(p.benefit) || norm(p.desc);
    p.themeText = text ? (p.benefit ? 'Key Benefit' : 'Short Description') : 'none';
    p.themes = THEMES.filter((t) => t[1].test(t[0] === THEME_WITH_NAME ? text + ' ' + p.name + ' ' + p.work : text)).map((t) => t[0]);
  });

  /* ---------- stated figures (candidates when STATED is empty) ---------- */
  const numRe = /[^.\n*]*\d[^.\n*]*(?:%|hours?|hrs?|days?|man[- ]?days?|min(?:ute)?s?|₹|lakh|crore|\bL\b|\bCr\b|tons?|mt\b)[^.\n*]*/gi;
  scope.forEach((p) => {
    p.candidates = [];
    ['benefit', 'cons', 'desc'].forEach((f) => { (p[f].match(numRe) || []).forEach((m) => p.candidates.push(f + ': ' + norm(m))); });
  });
  const stated = STATED.map((s) => {
    const p = scope.find((x) => x.sr === s.sr);
    if (!p) throw new Error('Stated figure for Sr. No. ' + s.sr + ' is not for a project in scope');
    const hay = norm([p.benefit, p.cons, p.desc].join(' ')).toLowerCase();
    if (!hay.includes(norm(s.quote).toLowerCase())) throw new Error('The text "' + s.quote + '" is not in the sheet for Sr. No. ' + s.sr);
    return Object.assign({ name: p.name }, s);
  });

  /* ---------- totals ---------- */
  const sum = (arr, f) => arr.reduce((a, p) => a + f(p), 0);
  const tot = (arr) => ({
    n: arr.length, oneTime: sum(arr, (p) => p.c.oneTime), oneTimeB: sum(arr, (p) => p.c.oneTimeB), yearly: sum(arr, (p) => p.c.yearly), yearlyB: sum(arr, (p) => p.c.yearlyB),
    tco: sum(arr, (p) => p.c.tco), tcoB: sum(arr, (p) => p.c.tcoB), pd: sum(arr, (p) => p.c.pd), pdB: sum(arr, (p) => p.c.pdB),
    labour: sum(arr, (p) => p.c.labour), labourB: sum(arr, (p) => p.c.labourB)
  });
  const by = (f) => { const m = {}; scope.forEach((p) => { const k = f(p) || 'Not given'; (m[k] = m[k] || []).push(p); }); return Object.keys(m).map((k) => Object.assign({ key: k }, tot(m[k]))).sort((a, b) => b.tco - a.tco); };
  const themeCount = THEMES.map((t) => ({ theme: t[0], n: scope.filter((p) => p.themes.includes(t[0])).length, examples: scope.filter((p) => p.themes.includes(t[0])).slice(0, 4).map((p) => p.name) }));
  const data = {
    source: path.basename(xlsxPath).replace(/^[0-9a-f]{8}-/i, ''), period: [iso(W0), iso(W1)],
    counts: { workbook: all.length, inScope: scope.length, byGroup: by((p) => p.group).map((g) => [g.key, g.n]), left: left.length,
      leftByReason: Object.entries(left.reduce((m, p) => { const k = leftWhy(p); m[k] = (m[k] || 0) + 1; return m; }, {})) },
    total: tot(scope), byGroup: by((p) => p.group), byKpi: by((p) => p.kpi), byType: by((p) => p.work), byStatus: by((p) => (p.inProgress ? 'In progress' : 'In use')),
    withoutAnyBenefitText: scope.filter((p) => !p.themes.length).length, withNoTextAtAll: scope.filter((p) => !norm(p.benefit) && !norm(p.desc)).length, themes: themeCount, stated, calGainedInScope: scope.filter((p) => p.gained > 0).map((p) => ({ sr: p.sr, name: p.name, gained: p.gained })),
    topSaving: scope.slice().sort((a, b) => (b.c.tcoB - b.c.tco) - (a.c.tcoB - a.c.tco)).slice(0, 8).map((p) => ({ sr: p.sr, name: p.name, saving: p.c.tcoB - p.c.tco, tco: p.c.tco, tcoB: p.c.tcoB })),
    candidates: scope.filter((p) => p.candidates.length).map((p) => ({ sr: p.sr, name: p.name, candidates: p.candidates }))
  };
  fs.writeFileSync(path.join(outDir, 'deck_data.json'), JSON.stringify(data, null, 1));

  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const head = ['Sr. No.', 'Project', 'Business KPI', 'Type of work', 'Location', 'Status', 'Group', 'Start', 'End', 'Basis of duration', 'People', 'Level', 'Person-days',
    'Manpower cost CA (Rs)', 'Manpower cost benchmark (Rs)', 'One-time CA (Rs)', 'One-time benchmark (Rs)', 'Yearly CA (Rs)', 'Yearly benchmark (Rs)', 'Years', 'Total cost CA (Rs)', 'Total cost benchmark (Rs)', 'Saving vs benchmark (Rs)', 'Benefit themes'];
  const lines = [head.map(q).join(',')].concat(scope.map((p) => {
    const c = p.c, r = Math.round;
    return [p.sr, p.name, p.kpi, p.work, p.loc, p.statusText, p.group, iso(p.start), iso(p.end), p.basis, p.people, p.level, r(c.pd), r(c.labour), r(c.labourB), r(c.oneTime), r(c.oneTimeB), r(c.yearly), r(c.yearlyB), c.years, r(c.tco), r(c.tcoB), r(c.tcoB - c.tco), p.themes.join('; ')].map(q).join(',');
  }));
  fs.writeFileSync(path.join(outDir, 'projects.csv'), '﻿' + lines.join('\r\n'));

  const T = data.total, m = (n) => Math.round(n).toLocaleString('en-IN');
  console.log('Workbook projects :', all.length, '| in scope:', scope.length, JSON.stringify(data.counts.byGroup));
  console.log('Left out          :', left.length, JSON.stringify(data.counts.leftByReason));
  console.log('Cost CA / bench   : one-time', m(T.oneTime), '/', m(T.oneTimeB), '| yearly', m(T.yearly), '/', m(T.yearlyB), '| total', m(T.tco), '/', m(T.tcoB));
  console.log('Manpower CA/bench :', m(T.labour), '/', m(T.labourB), '| person-days', m(T.pd), '/', m(T.pdB));
  console.log('Themes            :', themeCount.map((t) => t.n + ' ' + t.theme).join(' | '), '| no theme:', data.withoutAnyBenefitText, '| no text at all:', data.withNoTextAtAll);
  console.log('Stated figures    :', stated.length, '| candidates in', data.candidates.length, 'projects | Cal-2 in scope:', data.calGainedInScope.length);
  console.log('Written           :', path.join(outDir, 'deck_data.json'), 'and projects.csv');
})().catch((e) => { console.error(e); process.exit(1); });
