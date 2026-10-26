# Code audit: moving from claude.ai artifact to offline Windows IIS

Audit of the baseline (`index.html` + `sql/CentralAutomation_Estimator_Schema.sql`, commit 575016b)
for hosting on a Windows IIS server with no internet, and what was changed.

## Blocking issues (the baseline would not work on IIS)

| # | Finding | Impact on IIS | Fix |
|---|---|---|---|
| 1 | The register, approval workflow, user identity, shared masters and CSV export all used `window.claude.use('db' / 'user' / 'downloads')`, which exists only inside claude.ai. | On IIS, Approval showed "register is not available", nothing could be submitted or verified, and masters were saved per browser only. | New server API `web/api/estimator.ashx` (+ `web/App_Code`) on SQL Server. Users come from Windows authentication. CSV export is now a normal browser download. |
| 2 | Fonts loaded from `fonts.googleapis.com`. | On a server with no internet the stylesheet request fails or hangs, delaying first paint, and the page falls back to other fonts. | IBM Plex Sans / Sans Condensed (OFL licence) bundled in `web/assets/fonts`, loaded by `web/assets/css/fonts.css`. |
| 3 | No server-side code, no `web.config`, no database connection. | Nothing to connect the page to SQL Server. | `web/web.config`, connection string kept separately in `web/config/connectionStrings.config`. |
| 4 | SQL register table held only CSV-imported verified rows; no workflow state, log or saved estimate. | Could not back a live register. | `dbo.SwProjectRegister` now stores the workflow, saved estimate JSON and timestamps; `dbo.SwProjectLog` holds the approval history; `dbo.SwAppUser` holds users and master-editor rights; `dbo.SwMasterAudit` keeps a copy of each master save. |

## Security findings

| # | Finding | Fix |
|---|---|---|
| 5 | Workflow rules (cannot verify your own entry, verified entries are final, only the submitter edits or deletes, only editors change masters) were checked only in the browser. | Enforced again on the server in `ProjectRepository.cs`, `MasterRepository.cs` and the handler, inside transactions with row locks. |
| 6 | Stored cross-site scripting: a saved estimate is replayed into the page with `innerHTML`; several values (`amc.level`, `amc.crLevel`, `users`, CPU count, ...) were inserted without escaping. A crafted entry could run script in the verifier's browser. | `hydrate()` now gives every stored value the type of its default and checks level names (`tidy()` in `estimator.js`). Financial year options are escaped. A `Content-Security-Policy` header blocks inline script as a second layer. Both layers were tested with a crafted entry. |
| 7 | A verifier could approve an entry that was resubmitted after they opened it. | The API compares the entry's `UpdatedAt` with what the verifier saw and refuses with "This entry changed. Review it again." |
| 8 | Cross-site request forgery: with Windows authentication the browser signs requests automatically. | Every POST must carry `X-Requested-With: XMLHttpRequest`, which another site cannot send without CORS (not enabled). |
| 9 | Server internals in error responses. | Detailed errors only for requests from the server itself; others get a short message, and the detail goes to the Windows Application event log. |
| 10 | Response headers. | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, CSP added; `X-Powered-By` and the ASP.NET version header removed; `config` folder hidden from browsers. |
| 11 | SQL injection. | All SQL uses parameters. Table names in the one dynamic statement are fixed strings in code. |

## Compatibility notes

- The C# is written for C# 5 so IIS compiles it with the compiler built into .NET Framework 4.5+
  (no Roslyn/NuGet). Verified with `mcs -langversion:5`.
- `configSource` uses a backslash (`config\connectionStrings.config`); .NET Framework does not
  accept `/` there.
- `web.config` avoids settings that are locked by default in IIS (authentication sections) or
  that only exist on IIS 10 (`removeServerHeader`), so it loads on IIS 8.5 and later.
- The page uses `async`/`await` and `fetch`: current Edge, Chrome or Firefox. Not Internet Explorer.

## Smaller observations (left as is)

- Quotation numbers default to `QTN-<date>-01`; two quotations on the same day get the same
  number unless edited.
- The draft estimate is kept in the browser (`localStorage`), per PC and per browser, as before.
- `ensureQuote()` renames an old default company name "AM/NS India" to "Central Automation";
  harmless legacy migration.

## Roles, value creation and Excel upload (second change)

| Item | How it is handled |
|---|---|
| Costs for admins only | The API sends prices, rates, loadings and recorded costs only to admins (`IsAdmin`). Team members get the masters as names only (roles, GPUs, products, value categories) and only their own register entries, with cost fields removed and no costed estimate once verified. Cost figures a team member posts are ignored. |
| Assumed defaults in the page | `estimator.js` still carries the assumed default rates the page started with (the same values as `03_seed_master_data.sql`). They are visible to anyone who reads the script, so set your real rates on the Masters page; those are never sent to team members. |
| Costing entries from team members | Stored with `CostedBy` NULL. The admin's review costs them with the current masters; verification records the figures, the costed estimate and `CostedBy`. |
| Verifier comments | Stored as written and shown to the submitter. An adjusted value is kept in `ValueOriginalINR` / `ValueINR`, no longer written into the comment, so it does not reach a team member. |
| Excel files | Read in the browser (`xlsx-lite.js`) as data only: no formulas or macros run, values are type-checked against the template and every unreadable answer is listed. `.xlsm`/`.xls` are not accepted. |

## How it was tested

- SQL scripts run twice on SQL Server 2022 (Linux container): tables, seed data, views and
  the login/permission step all succeed and are re-runnable.
- The `web` folder ran under Mono's ASP.NET (FastCGI) with the same CSP header, against that
  SQL Server, and was driven in Chromium with Playwright as three different users: 43 checks
  covering no outside network requests, local fonts, submit, verify with adjustment, refusal
  to resubmit a verified entry, send back and reply, delete rules, master editing (manpower,
  licences, software settings) seen by another user, master audit, CSV download, print with
  VERIFIED stamp, crafted-entry XSS, invalid input and anonymous users. All passed.
- Second change: 59 browser checks with a team member and two admins: no prices in what a
  team member receives, value creation, costing with current masters on verify, own-entry
  rules, value creation master, template download, filling it with openpyxl (a separate
  Excel library), upload of good, faulty and non-Excel files, cost summary workbook, print
  and submit from Excel. The template was also opened in LibreOffice, which kept the
  drop-down lists and hidden Lists sheet and calculated the value formula correctly; a
  LibreOffice-saved copy uploads correctly too.
- One-sheet project template (third change): the template downloaded from the app was
  filled with openpyxl, uploaded on the Excel upload page, and also saved as CSV by
  LibreOffice (with Excel's byte-order mark, Windows line ends and blank rows added) and
  loaded with script 05. Both routes gave identical costs for every project (on-premise,
  no-server and GPU projects), every wrong value was reported with its line number, and
  a faulty file imported nothing.
- Not tested on a real Windows IIS server (not available here); the Windows-only pieces are
  the event log writer and Windows authentication itself.
