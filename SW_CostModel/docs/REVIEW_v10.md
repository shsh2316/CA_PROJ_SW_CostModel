# Site review and recommendations (v10, 29 October 2026)

A review of the whole site as it stands on branch `v10`: what it does, how healthy each part is, what was optimised in v10,
and what to do next. The slide version is `docs/CA_Estimator_Overview_v10.pptx`.

## What the site is

An offline ASP.NET Web Forms site (IIS, .NET 4.8, SQL Server) for Central Automation:

| Page | Purpose |
|---|---|
| `Default.aspx` | Login (any name, one shared password) |
| `project_registry.aspx` | The estimator: Masters, Registration (step-by-step estimate), Approval (verify, send back, recalculate), Print (quotation) |
| `project_upload.aspx` | Excel upload: template, one row per project, cost check, submit |
| `project_report.aspx` | Report: filters, CSV, project detail with history, PDF of each estimate |
| `api/estimator.ashx` | JSON API used by the pages |

Costs are worked out in the browser (`estimator.js`) on two bases (Central Automation in-house and a software-company benchmark),
and stored with the estimate and its own copy of the rates. Every library is served from the site; nothing goes to the internet.
About 4,400 lines of C# and JavaScript, 7 SQL scripts, documentation in `docs/`.

## Health check

| Area | State | Notes |
|---|---|---|
| Offline and security headers | Good | All libraries local; strict Content-Security-Policy, no inline script, nosniff, frame and referrer headers |
| Identity and access | **Act** | One shared password: no individual identity, so "only the submitter edits" and "another admin verifies" cannot be enforced; unsalted SHA-256 of a short password in `Web.config` |
| Performance | Watch (improved in v10) | Every estimator open still loads every saved estimate (about 4 KB each, 0.4 to 0.8 MB today, growing); static files are re-checked on every visit |
| Data and audit | Watch | History for submit, reply, send back, verify, recalculate; deleting an entry deletes its history; verified figures can now change through recalculation (logged) |
| Code structure | Watch | `estimator.js` is one 1,700-line file (calculation, screens, Excel, API); one shared database connection serialises requests |
| Testing | **Act** | Browser tests exist but only in the work area of these sessions; nothing runs automatically before a release |
| Usability | Good | Fluid layout 360 to 2,560 px, dark theme, report readable on phones (cards) and tablets (sticky column) |

## Optimised in v10 (this branch)

1. **Register poll: about 50 bytes instead of the whole register.** Each open estimator tab refreshed the register every minute and received every saved estimate
   (0.4 to 0.8 MB each time). The server now sends a signature (`ProjectRepository.Signature`: count and checksum of the entries, last history line), the page sends it back,
   and an unchanged register is answered with `{ unchanged: true }`. Any submit, edit, verify, send back, recalculation or deletion changes the signature.
   Files: `App_Code/ProjectRepository.cs`, `api/estimator.ashx.cs`, `assets/js/estimator.js`.
2. **Report page opens without 700 KB of scripts.** jsPDF, html2canvas and `estimator.js` are loaded on the first PDF click (in parallel, once), not with the page.
   Files: `project_report.aspx`, `assets/js/report-pdf.js`.
3. **Compression switched on** in `Web.config` (`urlCompression`, static and dynamic): pages, scripts and API JSON travel 5 to 10 times smaller.
   Dynamic compression needs the IIS role feature "Dynamic Content Compression" (Server Manager > Web Server > Performance); without it the setting does nothing.

Deploy: rebuild and publish (two `.cs` files changed), copy `Web.config` changes into the server's own `Web.config` (keep its connection string and password hash),
hard-refresh the browser. No database change.

## Recommendations

### Now (days)
| # | What | Why | Effort |
|---|---|---|---|
| 1 | Turn on HTTPS and change the shared password to a long one | The password crosses the network in clear text without HTTPS | Small (IIS binding) |
| 2 | Install "Dynamic Content Compression" on the server | Makes v10's compression work for the API | Small |
| 3 | Put the browser tests into the repository (`tests/`) and run them before each release | They caught every regression in these changes; today they live outside the project | Small |
| 4 | Keep a nightly database backup and test a restore | Verified figures and history live only in SQL Server | Small |

### Next (weeks)
| # | What | Why | Effort |
|---|---|---|---|
| 5 | Sign in with Windows / Active Directory (or one account per person) | Real names in the history; enforce "submitter edits, another person verifies"; turn `AllowSelfVerification` off | Medium |
| 6 | Load a saved estimate only when it is opened (`project?id=`), not with the register | The register stays small as entries grow; faster estimator start | Medium |
| 7 | Long cache for static files with a version in their URL (`estimator.js?v=10`) | No re-check of every file on every page load | Small |
| 8 | Keep a record of deletions (who, when, what) | History disappears with the entry today | Small |
| 9 | Report page: sort by column, choose columns, a small chart of cost and value by year | Easier reading for management | Medium |

### Later (months)
| # | What | Why | Effort |
|---|---|---|---|
| 10 | Split `estimator.js` into modules (calculation, screens, Excel, API) with a small build step | Easier to change one part without touching the rest | Medium |
| 11 | One database connection per request (ADO.NET pooling) instead of one shared, locked connection | Requests stop queueing behind each other when more people use the site | Medium |
| 12 | Record benefits as numbers per project (time saved per run, runs a year, ₹) in the register | The HOD reports could then show yearly ₹ and FTE instead of per-run figures | Medium |
| 13 | Move costing to a shared library usable by the server too | Server-side checks of submitted figures; reports without a browser | Large |
