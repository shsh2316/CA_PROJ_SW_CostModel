/* ==================================================================
   Generates database\07_import_ca_projects_list.sql from the Central Automation project list workbook.

   Usage (Node 18+ with Playwright installed; Chromium is used headless):
     node generate_ca_projects_import.js "CA_Projects_List_As_of_July_2026.xlsx" ..\07_import_ca_projects_list.sql

   The costs are NOT re-implemented here. The script opens the real estimator page
   (web\project_registry.aspx with the .aspx tags removed, and web\assets\js\estimator.js with a hook
   appended in memory; the repository files are not changed), builds one estimate per project the same
   way the Excel upload page does, and reads the figures the page itself would register
   (calc2, figuresOf, savedState). The workbook is read with the page's own XlsxLite reader.

   Assumptions (the workbook has almost no cost data; see the header of the generated script):
     team           1 person: Senior for AI / ML / vision / digital twin / mathematical model, else Mid
                    (FTE from the sheet when given)
     duration       working days (Mon-Fri) between Start and End date; "till date" = 31 Jul 2026,
                    "till next year" = 31 Mar 2027; a missing date = 90 days
     everything else the estimator defaults (100 users, 8 cores, 32 GB, 2 TB, SQL Server Standard, Windows Server, 3 years)
   ================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const [xlsxPath, outPath] = process.argv.slice(2);
if (!xlsxPath || !outPath) { console.error('Usage: node generate_ca_projects_import.js <workbook.xlsx> <output.sql>'); process.exit(2); }

const WEB = path.resolve(__dirname, '..', '..', 'web');
const DB_NAME = 'CA_PROJ_COST_MODEL';
const AS_OF = new Date(Date.UTC(2026, 6, 31));            // the list is "as of July 2026"
const NEXT_YEAR_END = new Date(Date.UTC(2027, 2, 31));    // "till next year"
const DEFAULT_DAYS = 90;
const DEFAULT_FY = '2026-27';
const SOURCE_NAME = path.basename(xlsxPath).replace(/^[0-9a-f]{8}-/i, '');   // drop an upload id prefix

/* ---------- mappings (kept simple and listed in the script header) ---------- */
const SENIOR_TYPES = new Set(['ai model', 'vision ai model', 'ml model', 'digital twin / ml model', 'mathematical model / ai', 'mathematical model']);
const VHIGH_TYPES = new Set(['ai model', 'vision ai model', 'ml model', 'digital twin / ml model', 'mathematical model / ai']);
const HIGH_TYPES = new Set(['mathematical model', 'rule base model']);
const AI_TYPES = VHIGH_TYPES;
const INTERFACE_TYPES = new Set(['ot-infra', 'cybersecurity']);
const norm = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const key = (v) => norm(v).toLowerCase();

function projectType(work) { const k = key(work); return AI_TYPES.has(k) ? 'ai' : INTERFACE_TYPES.has(k) ? 'interface' : 'web'; }
function complexityCode(work) { const k = key(work); return VHIGH_TYPES.has(k) ? 'vhigh' : HIGH_TYPES.has(k) ? 'high' : 'std'; }
function level(work) { return SENIOR_TYPES.has(key(work)) ? 'Senior' : 'Mid'; }
function statusOf(s) { const k = key(s); return k === 'in progress' || k === 'in-progress' ? 'progress' : 'completed'; }

/* ---------- dates ---------- */
function serialToDate(n) { return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000); }
function toDate(v, warn) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v > 20000 ? serialToDate(v) : null;
  const s = norm(v).toLowerCase();
  if (s === 'till date') return AS_OF;
  if (s === 'till next year') return NEXT_YEAR_END;
  const m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  warn.push('unreadable date "' + v + '"');
  return null;
}
function workingDays(a, b) {
  let n = 0;
  for (let t = a.getTime(); t <= b.getTime(); t += 86400000) { const d = new Date(t).getUTCDay(); if (d !== 0 && d !== 6) n++; }
  return Math.max(1, n);
}
function fyOf(d) { const y = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; return y + '-' + String((y + 1) % 100).padStart(2, '0'); }
const iso = (d) => d.toISOString().slice(0, 10);

/* ---------- read the workbook rows into project objects ---------- */
function toProjects(rows) {
  const hdr = rows[0].map(norm);
  const col = (name) => hdr.indexOf(name);
  const C = { sr: col('Sr. No.'), loc: col('Location'), kpi: col('Business KPI'), work: col('Type of work'), dept: col('Department'), status: col('STATUS'),
    name: col('Project'), start: col('Start Date'), end: col('End Date'), fte: col('FTE'), cal2: col('Cal-2'), cons: col('Considerations'),
    benefit: col('Key Benefit'), desc: col('Short Description') };
  for (const k of Object.keys(C)) if (C[k] < 0) throw new Error('Column not found in the workbook: ' + k);
  const out = [];
  for (let i = 2; i < rows.length; i++) {                      // row 1 = headings, row 2 = sub-headings
    const r = rows[i] || [];
    if (!norm(r[C.name])) continue;
    const warn = [];
    const start = toDate(r[C.start], warn), end = toDate(r[C.end], warn);
    let days = DEFAULT_DAYS, basis = 'default ' + DEFAULT_DAYS + ' days (a date is missing)';
    if (start && end) {
      if (end >= start) { days = workingDays(start, end); basis = iso(start) + ' to ' + iso(end); }
      else warn.push('end date before start date: ' + DEFAULT_DAYS + ' days used');
    }
    const fyDate = start || end;
    const fte = typeof r[C.fte] === 'number' && r[C.fte] > 0 ? r[C.fte] : 1;
    const gained = typeof r[C.cal2] === 'number' && r[C.cal2] > 0 ? r[C.cal2] : 0;
    const failed = key(r[C.status]) === 'failed';
    out.push({
      sr: r[C.sr], name: norm(r[C.name]), loc: norm(r[C.loc]), kpi: norm(r[C.kpi]), work: norm(r[C.work]), dept: norm(r[C.dept]),
      statusText: norm(r[C.status]), failed, status: statusOf(r[C.status]), kind: key(r[C.work]) === 'maintenance' ? 'amc' : 'new',
      type: projectType(r[C.work]), cx: complexityCode(r[C.work]), level: level(r[C.work]), people: fte, days, basis,
      fy: fyDate ? fyOf(fyDate) : DEFAULT_FY, gained, warn,
      note: { desc: norm(r[C.desc]), cons: norm(r[C.cons]), benefit: norm(r[C.benefit]) }
    });
  }
  return out;
}

/* Note (max 500): [Sr | location | KPI | type] short description. Considerations. Key benefit. */
function noteOf(p) {
  const head = '[Estimated from the project list, #' + p.sr + ' | ' + [p.loc, p.kpi, p.work].filter(Boolean).join(' | ') + ']';
  const parts = [p.failed ? 'FAILED.' : '', head, p.note.desc, p.note.cons ? 'Considerations: ' + p.note.cons : '', p.note.benefit ? 'Key benefit: ' + p.note.benefit : ''].filter(Boolean);
  const s = parts.join(' ');
  return s.length > 500 ? s.slice(0, 497).trimEnd() + '...' : s;
}

/* ---------- SQL text ---------- */
/* The script is plain ASCII (no BOM, nothing for an editor to mis-read): a character outside ASCII becomes NCHAR(code). */
const q = (s) => {
  const t = String(s == null ? '' : s).replace(/\u0000/g, '').replace(/'/g, "''");
  const parts = [];
  let cur = '';
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    if (c < 128) cur += t[i];
    else { if (cur) parts.push("N'" + cur + "'"); cur = ''; parts.push('NCHAR(' + c + ')'); }
  }
  if (cur || !parts.length) parts.push("N'" + cur + "'");
  return parts.join(' + ');
};
const ascii = (s) => String(s).replace(/[^\x00-\x7f]/g, '?');   // for the comment lines
const qn = (s) => (s == null || s === '' ? 'NULL' : q(s));
const num = (n) => String(Math.round(n * 100) / 100);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  /* The page, served from memory: aspx tags removed, estimator.js with a hook before its last line. */
  /* (the workbook reader, xlsx-lite.js, is loaded by the upload page, not the estimator page: add it here) */
  const html = fs.readFileSync(path.join(WEB, 'project_registry.aspx'), 'utf8').replace(/^<%@[^\n]*\n/, '').replace(/<%[:=][^%]*%>/g, '')
    .replace('<script src="assets/js/estimator.js">', '<script src="assets/js/xlsx-lite.js"></script>\n<script src="assets/js/estimator.js">');
  let js = fs.readFileSync(path.join(WEB, 'assets', 'js', 'estimator.js'), 'utf8');
  const tail = js.lastIndexOf('})();');
  if (tail < 0) throw new Error('estimator.js: closing "})();" not found');
  js = js.slice(0, tail) + 'window.__CA={newEstimate:newEstimate,calc2:calc2,figuresOf:figuresOf,savedState:savedState,slug:slug,isAdmin:isAdmin,M:M,offline:function(){DBSTATE=\"off\";}};\n' + js.slice(tail);
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/index.html') return route.fulfill({ contentType: 'text/html', body: html });
    if (u.pathname === '/assets/js/estimator.js') return route.fulfill({ contentType: 'application/javascript', body: js });
    if (u.pathname.startsWith('/assets/')) {
      const f = path.join(WEB, u.pathname);
      return fs.existsSync(f) ? route.fulfill({ path: f }) : route.fulfill({ status: 404, body: '' });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });   // no API: the page works as an offline calculator
  });
  await page.goto('http://ca.local/index.html');
  await page.waitForFunction(() => window.__CA, null, { timeout: 15000 });
  /* there is no server here: use the page as the offline calculator (it then shows costs, as figuresOf needs) */
  await page.evaluate(() => window.__CA.offline());

  /* read the workbook with the page's own reader */
  const b64 = fs.readFileSync(xlsxPath).toString('base64');
  const rows = await page.evaluate(async (b64) => {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const book = await window.XlsxLite.read(bytes.buffer);
    const name = book.names.filter((n) => (book.sheets[n][0] || []).some((h) => String(h).trim() === 'Project'))[0] || book.names[0];
    return book.sheets[name];
  }, b64);
  const projects = toProjects(rows);

  /* cost every project with the page's own logic */
  const costed = await page.evaluate((projects) => {
    const A = window.__CA;
    return projects.map((p) => {
      const s = A.newEstimate();
      s.name = p.name; s.type = p.type; s.model = 'yearly'; s.days = p.days; s.users = 100;
      s.complexity = +A.M.sw.complexity[p.cx] || 1;
      s.need.man = true; s.need.amc = true; s.need.gpu = false;
      s.team = [{ role: 'Team', level: p.level, people: p.people, days: '', alloc: 100 }];
      s.other = [];
      s.value.items = p.gained > 0 ? [{ cat: 'other', desc: 'Gained (project list, Cal-2)', qty: p.gained, unit: 'INR', rate: 1, freq: 'year' }] : [];
      s.reg.fy = p.fy; s.reg.kind = p.kind; s.reg.status = p.status; s.reg.note = p.noteText;
      s.q.to = p.dept;
      const R = A.calc2(s);
      return { fig: A.figuresOf(s, R), state: A.savedState(s), slug: A.slug(p.name), tco: Math.round(R.tco) };
    });
  }, projects.map((p) => Object.assign({}, p, { noteText: noteOf(p) })));
  await browser.close();
  if (pageErrors.length) console.error('Page errors:', pageErrors.slice(0, 3));

  /* keys: slug_FY_kind; later duplicates get -<Sr.No> */
  const seen = new Map();
  const entries = projects.map((p, i) => {
    const c = costed[i];
    let base = c.slug;
    const dupKey = base + '_' + p.fy + '_' + p.kind;
    const n = (seen.get(dupKey) || 0) + 1; seen.set(dupKey, n);
    if (n > 1) base = base.slice(0, 60 - String(p.sr).length - 1).replace(/-+$/, '') + '-' + p.sr;
    return Object.assign({}, p, c, { entryKey: base + '_' + p.fy + '_' + p.kind, noteText: noteOf(p) });
  });
  const keyRe = /^[a-z0-9-]{1,60}_\d{4}-\d{2}_(new|amc|enh)$/;
  const bad = entries.filter((e) => !keyRe.test(e.entryKey));
  if (bad.length) throw new Error('Entry keys not valid: ' + bad.slice(0, 3).map((e) => e.entryKey).join(', '));
  if (new Set(entries.map((e) => e.entryKey)).size !== entries.length) throw new Error('Entry keys are not unique');

  /* ---------- write the script ---------- */
  const sum = (f) => entries.reduce((a, e) => a + (e.fig[f] || 0), 0);
  const L = [];
  L.push('/* ==================================================================');
  L.push('   Central Automation - Estimate and Quotation');
  L.push('   07. Import the CA project list into the register (GENERATED: do not edit by hand)');
  L.push('');
  L.push('   Source      ' + SOURCE_NAME + ' (' + entries.length + ' projects)');
  L.push('   Generated   by database\\tools\\generate_ca_projects_import.js, which costs every project with the');
  L.push('               estimator\'s own calculation (the same figures the page registers on submit).');
  L.push('   Result      each project becomes a VERIFIED entry (dbo.SwProjectRegister) with a "submit" and a');
  L.push('               "verify" row in dbo.SwProjectLog, costed with the estimator\'s default masters (rates and prices in estimator.js).');
  L.push('   Safe to run again: a project whose RegisterId already exists is skipped, never changed.');
  L.push('');
  L.push('   The workbook has almost no cost data, so these ASSUMPTIONS were used for every project:');
  L.push('     Team        1 person: Senior for AI / ML / vision / digital twin / mathematical model, else Mid');
  L.push('                 (3 people where the sheet says FTE 3: BF Alkali Model, BF Liquid Levels Height Prediction)');
  L.push('     Duration    working days (Mon-Fri) from Start to End date; "till date" = 31 Jul 2026,');
  L.push('                 "till next year" = 31 Mar 2027; a missing date = ' + DEFAULT_DAYS + ' days');
  L.push('     Complexity  Very high: AI / ML / vision / digital twin; High: mathematical model, rule-base model; else Standard');
  L.push('     Sizing      100 users, 1 server (8 cores, 32 GB, 2 TB SSD), SQL Server Standard, Windows Server,');
  L.push('                 yearly delivery model, 3 years of ownership, default loadings and AMC');
  L.push('     Value       "Cal-2 (Gained)" amounts are a yearly benefit (other benefit, INR); other projects: none');
  L.push('     Dates       financial year from the Start Date (else End Date, else ' + DEFAULT_FY + ')');
  L.push('   Edit @ImportUser below if the entries should belong to someone else.');
  L.push('');
  L.push('   These entries are ESTIMATES (every Note starts "Estimated from the project list") but are stored as verified, so reports count them.');
  L.push('   A verified entry cannot be edited or deleted on the page. To undo this import (the log rows go with the entries):');
  L.push("       DELETE dbo.SwProjectRegister WHERE SubmittedBy = N'Import';");
  L.push('   Registering one of these projects again on the page creates a second row for it (a different RegisterId); delete the imported row first.');
  L.push('   ================================================================== */');
  L.push('');
  L.push('USE ' + DB_NAME + ';');
  L.push('GO');
  L.push("IF DB_NAME() <> N'" + DB_NAME + "'");
  L.push('BEGIN');
  L.push("    RAISERROR('Not connected to " + DB_NAME + ": nothing was imported.', 16, 1);");
  L.push('    SET NOEXEC ON;   -- skip the rest of the script');
  L.push('END');
  L.push('GO');
  L.push('SET NOCOUNT ON;');
  L.push('SET XACT_ABORT ON;');
  L.push('');
  L.push("DECLARE @ImportUser nvarchar(200) = N'Import';   -- SubmittedBy, VerifiedBy and CostedBy of every entry");
  L.push("DECLARE @IdSuffix   nvarchar(100) = N'Import';   -- letters and digits of @ImportUser: the end of every RegisterId");
  L.push('DECLARE @Id nvarchar(200), @Added int = 0;');
  L.push('');
  L.push('BEGIN TRANSACTION;');
  L.push('');
  entries.forEach((e, i) => {
    const f = e.fig;
    L.push('-- ' + (i + 1) + '/' + entries.length + '  #' + e.sr + '  ' + ascii(e.name.replace(/[\r\n]+/g, ' ')) + '  (' + e.basis + ', ' + e.days + ' days, ' + e.people + ' x ' + e.level + ')' + (e.warn.length ? '  !! ' + ascii(e.warn.join('; ')) : ''));
    L.push('SET @Id = ' + q(e.entryKey + '_') + ' + @IdSuffix;');
    L.push('IF NOT EXISTS (SELECT 1 FROM dbo.SwProjectRegister WHERE RegisterId = @Id)');
    L.push('BEGIN');
    L.push('    INSERT dbo.SwProjectRegister (RegisterId, EntryKey, FinYear, Kind, DeliveryModel, Status, ProjectName, ProjectType, Department,');
    L.push('        ValueINR, BenchmarkValueINR, ChargedINR, OneTimeINR, BenchmarkOneTimeINR, YearlyRunINR, BenchmarkYearlyRunINR, PersonDays, TeamSize,');
    L.push('        ValueCreatedYearlyINR, ValueCreatedOneTimeINR, Note, Workflow, SubmittedBy, VerifiedBy, VerifiedAt, CostedBy, EstimateJson)');
    L.push('    VALUES (@Id, ' + q(e.entryKey) + ', ' + q(e.fy) + ', ' + q(e.kind) + ", 'yearly', " + q(e.status) + ', ' + q(e.name) + ', ' + q(e.type) + ', ' + qn(e.dept) + ',');
    L.push('        ' + [num(f.value), num(f.valueB), num(f.charged || 0), num(f.oneTime), num(f.oneTimeB), num(f.yearly), num(f.yearlyB), num(f.personDays), num(f.team)].join(', ') + ',');
    L.push('        ' + num(f.valueYearly) + ', ' + num(f.valueOnce) + ', ' + q(e.noteText) + ", 'verified', @ImportUser, @ImportUser, SYSUTCDATETIME(), @ImportUser,");
    L.push('        ' + q(e.state) + ');');
    L.push("    INSERT dbo.SwProjectLog (RegisterId, Action, ActionBy, Comment) VALUES (@Id, 'submit', @ImportUser, NULL);");
    L.push("    INSERT dbo.SwProjectLog (RegisterId, Action, ActionBy, Comment) VALUES (@Id, 'verify', @ImportUser, " + q('Imported from ' + SOURCE_NAME) + ');');
    L.push('    SET @Added += 1;');
    L.push('END');
    L.push('');
  });
  L.push('COMMIT TRANSACTION;');
  L.push("PRINT CONCAT('Added ', @Added, ' of " + entries.length + " projects (the rest already existed).');");
  L.push('');
  L.push('-- Check: expected for a first run on an empty register: ' + entries.length + ' verified entries');
  L.push("-- value (Central Automation) " + Math.round(sum('value')) + ", benchmark " + Math.round(sum('valueB')) + ", person-days " + Math.round(sum('personDays') * 10) / 10);
  L.push("SELECT Workflow, COUNT(*) AS Entries, SUM(ValueINR) AS ValueINR, SUM(BenchmarkValueINR) AS BenchmarkValueINR, SUM(PersonDays) AS PersonDays");
  L.push("FROM dbo.SwProjectRegister WHERE SubmittedBy = @ImportUser GROUP BY Workflow;");
  L.push('GO');
  L.push('SET NOEXEC OFF;');
  L.push('');
  fs.writeFileSync(outPath, L.join('\r\n'), 'ascii');   // ASCII only: no BOM

  /* ---------- summary ---------- */
  const by = (f) => entries.reduce((m, e) => { m[f(e)] = (m[f(e)] || 0) + 1; return m; }, {});
  console.log('Projects read      :', rows.length - 2, '| written:', entries.length);
  console.log('By status          :', JSON.stringify(by((e) => e.status)));
  console.log('By record type     :', JSON.stringify(by((e) => e.kind)));
  console.log('By financial year  :', JSON.stringify(by((e) => e.fy)));
  console.log('By project type    :', JSON.stringify(by((e) => e.type)));
  console.log('Default 90 days    :', entries.filter((e) => /default/.test(e.basis)).length, 'projects (a date is missing)');
  console.log('Warnings           :', entries.filter((e) => e.warn.length).map((e) => '#' + e.sr + ' ' + e.warn.join('; ')).join(' | ') || 'none');
  console.log('Person-days        :', Math.round(sum('personDays') * 10) / 10);
  console.log('Value CA / bench   :', Math.round(sum('value')), '/', Math.round(sum('valueB')));
  console.log('Value created/year :', Math.round(sum('valueYearly')));
  console.log('Written            :', outPath, '(' + Math.round(fs.statSync(outPath).size / 1024) + ' KB)');
})().catch((e) => { console.error(e); process.exit(1); });
