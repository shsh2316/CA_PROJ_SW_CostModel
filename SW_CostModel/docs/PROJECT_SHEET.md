# The project sheet: one Excel sheet for the team

Give users **one sheet**, one row per project. A whole department can list all its projects
in the same file. No prices are asked for, the team is just a head-count, and value creation
is up to three benefits with a quantity per year.

Two ways to load the filled sheet, both giving the same costs:

1. **Excel upload page** (admins): upload the .xlsx. Every row's cost, value and payback
   show at once; open, print or submit any of them.
2. **Straight into SQL Server**: save the sheet as CSV and run
   `database\05_import_projects_csv.sql`. Each project lands on the Approval page, awaiting an
   admin, who costs and verifies it there.

## Where to get the sheet

- Best: **Excel upload > Download blank template** in the app. Its drop-down lists (GPUs,
  database engines, operating systems, benefits) come from your current masters.
- Or `database\templates\projects-template.xlsx` (made with the default masters) or the
  plain `database\templates\projects.csv`. Filled examples are in `database\templates\example`.

The template has the column headings in line 1, a hint under each heading in line 2 (what an
empty cell means), and the projects from line 3 down. Tell users:

- Fill one row per project from line 3. Leave line 1 and 2 as they are; don't add, remove or
  move columns.
- Pick from the drop-down lists where there is one. Leave a cell empty to use the default
  shown in line 2.
- Only **Project name** is required.

## The columns

| # | Column | Allowed values | Empty means |
|---|---|---|---|
| 1 | Project name | text, up to 200 characters | **required** |
| 2 | Department / client | text | – |
| 3 | Prepared by | text | – |
| 4 | Financial year | `2026-27` | current financial year |
| 5 | Record as | New project, Maintenance (AMC), Enhancement | New project |
| 6 | Project status | Planned, In progress, Completed | Completed |
| 7 | Delivery model | One-time setup, Yearly model (with support) | Yearly model |
| 8 | Project type | Web application, Windows desktop application, Mobile app, Interface / integration, Dashboard / reporting, AI / vision system | Web application |
| 9 | Duration (working days) | number | 90 |
| 10 | Named users | number | 100 |
| 11 | Complexity | Low, Standard, High, Very high | Standard |
| 12 | Team size (people) | number of people working on it for the whole duration | no manpower cost |
| 13 | Team level | Junior, Mid, Senior, Lead, Architect (the usual level of the team) | Mid |
| 14 | Needs servers | Yes, No | Yes |
| 15 | Hosting model | On-premise, Cloud | On-premise |
| 16 | Environments | Production only, Production + UAT, Production + DR, Production + UAT + DR | Production only |
| 17 | CPU cores | number (total) | 8 |
| 18 | RAM (GB) | number | 32 |
| 19 | Storage (TB) | number (usable) | 2 |
| 20 | GPU model | a GPU from the Hardware master; only for AI / vision | no GPU |
| 21 | GPU count | number; 0 = no GPU | 1 when a GPU model is chosen |
| 22 | Database engine | a name from the Licences master, e.g. SQL Server Standard, Open-source (PostgreSQL / MySQL) | SQL Server Standard |
| 23 | Operating system | a name from the Licences master, e.g. Windows Server, Linux (no licence) | Windows Server |
| 24 | Years of ownership | number | 3 |
| 25 | Benefit 1 | a benefit from the Value creation master, shown with its unit, e.g. Man-hours saved (hours) | – |
| 26 | Benefit 1 per year | quantity per year in that unit, e.g. 1200 | – |
| 27–30 | Benefit 2, Benefit 2 per year, Benefit 3, Benefit 3 per year | as above | – |
| 31 | One-time value (₹) | a one-time benefit in rupees | – |
| 32 | Note | text, up to 500 characters | – |

How it is costed:
- **Manpower** = team size × duration × the rate for the team level (from the Manpower
  master). An admin can split the team into roles afterwards by opening the entry.
- **Value per year** = quantity × the benefit's ₹ per unit from the Value creation master
  (e.g. 1,200 hours × ₹500). Users don't enter rates or explain how.
- Everything else (support, loadings, GST, licences) uses the master defaults, as for a new
  estimate on the page.

Numbers may be written as `1200`, `1,200` or `1,00,000`; a ₹ sign is ignored.

## Loading it into SQL Server (CSV)

1. In Excel: **File > Save As > "CSV UTF-8 (Comma delimited) (*.csv)"**, named
   `projects.csv`. Excel saves only the visible Projects sheet, which is what is needed.
2. Put it in a folder the SQL Server service account can read (a folder on the SQL Server
   machine, or a UNC share).
3. Open `database\05_import_projects_csv.sql` in SSMS, set `@Folder`, and run it with
   `@CheckOnly = 1` (the default). It either lists every problem with its line number in the
   sheet, or shows what would be imported (person-days, value per year).
4. Set `@CheckOnly = 0` and run again to import. If any value is wrong, nothing is imported.

Each project becomes an entry **awaiting verification, without costs**. An admin opens it on
the Approval page: the cost is worked out there with the current masters and recorded on
verification. Costs are calculated by the page, not by SQL Server.

The entries belong to `@SubmittedBy` (whoever runs the script, unless changed). An entry has
to be verified by a different admin. Running the script again updates entries that are not
verified yet and leaves verified ones alone; an entry is identified by project name,
financial year and record type.

Needs SQL Server 2017 or later.
