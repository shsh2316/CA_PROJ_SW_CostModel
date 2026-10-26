# Central Automation: estimate and quotation

Estimator for software projects (Masters, Registration, Approval, Excel upload, Print) with
Central Automation cost against a software-company benchmark, and the value each project
creates. Runs on Windows IIS with SQL Server, with no internet access needed on the server or
the client.

## Folder structure

```
database/                                  SQL Server scripts, run in order
  01_create_database_and_login.sql         database + read/write login for the IIS app pool
  02_create_tables.sql                     tables, indexes, views
  03_seed_master_data.sql                  default rates and settings
  04_import_legacy_register_csv.sql        optional: import a CSV from the old claude.ai version
  05_import_projects_csv.sql               optional: load the project sheet (saved as CSV) into the register
  templates/                               the one-sheet project template (.xlsx and .csv) and filled examples
docs/
  DEPLOYMENT_IIS.md                        step-by-step IIS and SQL Server setup
  PROJECT_SHEET.md                         the one-sheet project template: columns, allowed values, loading
  AUDIT.md                                 audit findings and what was changed
web/                                       copy the CONTENTS of this folder to the IIS site
  index.html                               the page
  web.config                               IIS settings
  config/connectionStrings.config          database connection (the only file to edit per server)
  api/estimator.ashx                       JSON API used by the page
  App_Code/                                API code, compiled by IIS on first use
    ApiException.cs, Db.cs, Json.cs, CurrentUser.cs, MasterRepository.cs, ProjectRepository.cs
  assets/css/estimator.css                 page styles
  assets/css/fonts.css                     local font definitions
  assets/js/estimator.js                   page logic and calculations
  assets/js/xlsx-lite.js                   Excel template writer and reader (no outside library)
  assets/fonts/                            IBM Plex fonts (SIL Open Font License)
```

## Quick start

1. Run `database\01` to `03` in SSMS (set `@AppLogin` in 01 first).
2. Copy the contents of `web` to the server, create an IIS site on a .NET 4 application pool,
   enable Windows Authentication and disable Anonymous.
3. Edit `web\config\connectionStrings.config` if SQL Server is not local.
4. Open the page once, then make yourself an admin: `UPDATE dbo.SwAppUser SET IsAdmin = 1 WHERE UserLogin = N'DOMAIN\you';`

Full steps and troubleshooting: [docs/DEPLOYMENT_IIS.md](docs/DEPLOYMENT_IIS.md).

## How it fits together

- The page calls `api/estimator.ashx`. The API reads the masters from the master tables,
  stores each submitted estimate in `dbo.SwProjectRegister` (with the full estimate as JSON,
  so it can be reopened and printed later), and the approval history in `dbo.SwProjectLog`.
- People are identified by their Windows login.
- If the API cannot be reached (for example the page is opened as a file), the page still
  works as a calculator: masters and the current estimate are kept in that browser.

## Who sees what

| | Team member | Admin (`IsAdmin = 1` in `dbo.SwAppUser`) |
|---|---|---|
| Registration: project, team, hardware, licences, support, value creation | yes | yes |
| Cost figures, rates, loadings, ROI and payback | no | yes |
| Their own entries and where they are in approval | yes (My entries) | yes, everyone's (Approval) |
| Verify or send back an entry | no | yes, not their own |
| Masters, Excel upload, Print / quotation | no | yes |

Costs are kept from team members by the server, not only hidden on screen: they never
receive prices, rates or recorded costs. What a team member submits is stored without
costs; when an admin opens it for review, the page works out the cost with the current
masters, and verifying records those figures.

## Value creation

The Value creation step records what a project gives back: man-hours saved, downtime
avoided, energy, quality, material and so on. Each line is quantity × ₹ per unit, per year or
one-time. Choosing a benefit fills in its usual unit and value from the Value creation master
(admins set these on the Masters page). Admins also see the value against the Central
Automation cost: value over the years of ownership, return on cost and payback. Verified
value is totalled by financial year on the Approval page and in `dbo.vw_SwYearlySummary`.

## The project sheet (Excel upload or CSV import)

The team fills **one Excel sheet, one row per project**: project details, a team head-count
(and its usual level), server size, and up to three benefits with a quantity per year. No
prices, no role-by-role breakdown, no explanations.

1. An admin downloads the blank template from **Excel upload** (its drop-down lists come from
   the current masters), or takes `database\templates\projects-template.xlsx`.
2. The team fills it and sends it back; one file can hold many projects.
3. Load it either way:
   - **Excel upload** page: every project's cost, total against the benchmark, value per year
     and payback show at once, with any unreadable answers listed by line. Open, print, submit
     or download a cost summary.
   - **Straight into SQL Server**: save the sheet as CSV and run
     `database\05_import_projects_csv.sql`. It checks every value, imports nothing if
     anything is wrong, and adds the projects as entries awaiting an admin's costing and
     verification.

Both give the same costs. An admin's submission still needs a second admin to verify it.
Uploads on the page are kept until the page is closed; submit them to keep them. Columns and
allowed values: [docs/PROJECT_SHEET.md](docs/PROJECT_SHEET.md).
