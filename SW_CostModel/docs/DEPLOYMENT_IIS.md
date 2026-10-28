# Deploying on Windows IIS (no internet)

The site is an ASP.NET Web Forms **Web Application project** (`CA_PROJECT_COSTING_MODEL.csproj`, .NET Framework 4.8):
you build it in Visual Studio and publish the result. The server needs no internet access, no NuGet download,
no build step and no Node.js. Nothing is loaded from outside the site: every style, script, font and library
is a file on the server (the Content-Security-Policy header in `Web.config` also blocks any outside address).

| URL | What |
|---|---|
| `/` (`Default.aspx`) | the login page |
| `/SW_CostModel/web/project_registry.aspx` | estimate, registration, approval, masters, Excel upload, print |
| `/SW_CostModel/web/project_report.aspx` | report of estimates: CSV download, and a **PDF** of each project's estimate (the quotation layout) |
| `/SW_CostModel/web/api/estimator.ashx` | JSON API used by the estimator page |

All database access goes through `dbClassSql` (`SW_CostModel\web\App_Code\dbClassSql.cs`, via `Db.cs`).
The database is `CA_PROJ_COST_MODEL`.

## 1. Server prerequisites

| Item | Why |
|---|---|
| Web Server (IIS) with Static Content, Default Document | serves pages, scripts, styles and fonts |
| ASP.NET 4.x, .NET Extensibility 4.x, ISAPI Extensions, ISAPI Filters | runs the `.aspx` pages and the API |
| **.NET Framework 4.8** | the project targets 4.8. It is in-box on Windows Server 2022; on Windows Server 2012 R2 / 2016 / 2019 install the offline installer (`ndp48-x86-x64-allos-enu.exe`) first |
| SQL Server 2016 SP1 or later (Express is fine) | script `05` needs SQL Server 2017 and database compatibility level 140 or higher |

Windows Authentication is **not** needed: the site has its own login. PowerShell, as administrator
(Windows Server installation media offline; `-Source` points to its `sources\sxs` folder):

```powershell
Install-WindowsFeature Web-Server, Web-Static-Content, Web-Default-Doc, Web-Asp-Net45, Web-Net-Ext45, Web-ISAPI-Ext, Web-ISAPI-Filter, Web-Mgmt-Console -Source D:\sources\sxs
```

## 2. Create the application pool first

The database script gives the IIS application pool account access to the database, and SQL Server only knows
the account once the pool exists.

IIS Manager > Application Pools > Add Application Pool: name `CentralAutomationEstimator`,
.NET CLR version **v4.0**, pipeline mode **Integrated** (the login module does not run in Classic mode, which
would leave the site open). Leave **Maximum Worker Processes** at 1 (`dbClassSql` keeps one database connection per process).

## 3. Database

Run the scripts in SQL Server Management Studio as a sysadmin, in this order. Each script from `02` on starts with
`USE CA_PROJ_COST_MODEL;` and a check: if the connection is on another database it stops and changes nothing.
If you used another database name, change the `USE` line and the `DB_NAME()` check at the top of scripts `02` to `06`,
the `@DbName` in `01`, and the `CCCConString` in `Web.config`.

| Script | What it does |
|---|---|
| `database\01_create_database_and_login.sql` | creates the database and gives the IIS application pool account read and write access. Set `@AppLogin` first (see below). Skip it if you made the database yourself and give the login `db_datareader` and `db_datawriter` instead |
| `database\02_create_tables.sql` | creates the tables, indexes and views (safe to run again) |
| `database\03_seed_master_data.sql` | loads the default rates and value categories (only the rows that are missing) |
| `database\04_import_legacy_register_csv.sql` | optional, a CSV exported from the earlier claude.ai version |
| `database\05_import_projects_csv.sql` | optional, the one-sheet project template saved as CSV (`docs\PROJECT_SHEET.md`) |
| `database\06_admins_and_checks.sql` | checks only: users, master row counts, the pool account's rights, the register |
| `database\07_import_ca_projects_list.sql` | optional, one-off: the 190 projects of the CA project list (July 2026) as verified, costed entries (`docs\PROJECT_SHEET.md`) |

From a command prompt on the SQL Server machine (Windows authentication, stops at the first error):

```bat
cd database
sqlcmd -S . -E -b -i 01_create_database_and_login.sql
sqlcmd -S . -E -b -i 02_create_tables.sql
sqlcmd -S . -E -b -i 03_seed_master_data.sql
sqlcmd -S . -E -b -i 07_import_ca_projects_list.sql
```

(`-S SERVER\INSTANCE` for a named instance. Save the `.sql` files as they are: `07` is plain ASCII on purpose.)

`@AppLogin` in script 01 is the Windows account the site runs as:

- SQL Server on the same machine as IIS: `IIS APPPOOL\CentralAutomationEstimator` (the pool from step 2).
- SQL Server on another machine: the web server's computer account `DOMAIN\WEBSERVER$`, or a domain service account
  set as the pool identity.
- For a SQL Server login in the connection string, leave `@AppLogin` empty and add the user yourself:
  `CREATE USER [app] FOR LOGIN [app]; ALTER ROLE db_datareader ADD MEMBER [app]; ALTER ROLE db_datawriter ADD MEMBER [app];`

To undo the project-list import: `DELETE dbo.SwProjectRegister WHERE SubmittedBy = N'Import';` (log rows go with it).

## 4. The site files

1. **Libraries for the login page.** Copy your `Content`, `Scripts` and `Standards` folders into the **site root**
   (the folder that holds `Web.config` and `Default.aspx`). The login page uses only
   `Content\bootstrap.min.css` and `Content\font-awesome.min.css` (Font Awesome 4 also needs its `fonts` folder next to
   `Content`: `fonts\fontawesome-webfont.woff2` and the other `fontawesome-webfont.*` files). The estimator and the report need
   no library at all. Optional logo: `Assets\images\AMNS_Logo_Small.png`.
2. **Project items.** In Visual Studio the project file already lists `Default.aspx`, the two pages, `api\estimator.ashx`,
   `SW_CostModel\web\App_Code\*.cs` and `SW_CostModel\web\assets\**`. If your own project file differs, include them
   (Solution Explorer > Show All Files > right-click > Include In Project) and add `Content`, `Scripts`, `Standards`, `fonts`
   with Build Action **Content**. Not part of the site: `database`, `docs`, `packages`, `obj`, `.vs`.
3. **Build and publish.** Build > Publish > Folder, configuration **Release**. The output holds the pages, `assets`, `Web.config`
   and `bin` (including `bin\roslyn`, the compiler ASP.NET uses for the page markup). Copy the output to the server, for example
   `C:\inetpub\CentralAutomationEstimator`.
4. IIS Manager > Sites > Add Website: physical path = that folder, application pool = `CentralAutomationEstimator`.
5. Select the site > **Authentication**: **Anonymous Authentication enabled**, **Windows Authentication disabled**. The sign-in is done by
   the site itself (`LoginModule` and the `Default.aspx` login page).
6. Give the pool read access to the folder (normally already true through `IIS_IUSRS`):
   `icacls C:\inetpub\CentralAutomationEstimator /grant "IIS APPPOOL\CentralAutomationEstimator:(OI)(CI)RX"`

The PDF is made in the browser by two libraries that are part of the site, `assets\js\vendor\jspdf.umd.min.js` and
`html2canvas.min.js` (MIT licences next to them): nothing is downloaded. The PDF needs the entry's saved estimate (every entry made on the page or by
script `07` has one; rows from script `04` do not and say so).

All settings are in the root `Web.config` (the application root). There is no `web.config` inside `SW_CostModel\web`: IIS rejects
`<authentication>` in a subfolder ("allowDefinition='MachineToApplication'").

## 5. Database connection

Edit the `CCCConString` entry in `Web.config` on the server. It is the only place with connection details, and both `dbClassSql`
and the API read it:

```xml
<add name="CCCConString" providerName="System.Data.SqlClient"
     connectionString="Data Source=localhost;Initial Catalog=CA_PROJ_COST_MODEL;Integrated Security=True;Connect Timeout=15;Application Name=CentralAutomationEstimator" />
```

- Named instance: `Data Source=SQLSERVER01\SQLEXPRESS`.
- SQL Server login: `User ID=...;Password=...` instead of `Integrated Security=True` (a password with `;` or `"` goes in
  `Password="..."`; `&` and `<` are written `&amp;` and `&lt;` in this file). Then encrypt the section so the password is not stored in
  plain text: `%windir%\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis -pef "connectionStrings" "C:\inetpub\CentralAutomationEstimator"`.
- A Visual Studio **Publish** copies your development `Web.config`: check this entry on the server after each publish.

## 6. Sign-in

`Default.aspx` is the login page (the site root opens it). It takes **any user name** and one shared **password**. The name is only recorded
as who submitted and approved entries; whoever signs in is an admin (costs, masters, Excel upload, Print, verification, including
entries they submitted themselves: `AllowSelfVerification` in `Web.config`).

- `LoginModule` checks a signed, encrypted cookie on every request (pages, API and files, except the login page and the files it needs).
  Without it, pages go to the login page and the API answers 401. A sign-in lasts `LoginHours` (8). **Sign out** is in the page menu.
- After 5 wrong passwords an address is locked out for 5 minutes.
- The password is not stored anywhere: `Web.config` holds only its SHA-256 (`LoginPasswordSha256`). To change it, in PowerShell, then paste
  the result into `Web.config` (everyone is signed out when it changes):
  ```powershell
  $b=[Text.Encoding]::UTF8.GetBytes('NEW PASSWORD'); -join ([Security.Cryptography.SHA256]::Create().ComputeHash($b)|%{$_.ToString('x2')})
  ```
- The password and the cookie cross the network as they are: use **HTTPS** on the server. The cookie is encrypted with the machine key; on a
  web farm give every server the same `<machineKey>`.
- Limits to know: the name is whatever is typed, so "only the submitter can edit" and "a different admin must verify" cannot be enforced
  (hence `AllowSelfVerification`). A missing `LoginPasswordSha256` means nobody can sign in.

## 7. Check it works

1. Browse to `http://yourserver/`. The first request takes 10 to 30 seconds while IIS compiles the page markup. The login page opens in
   the site's style (red bar, card). Sign in with any name and the password.
2. The estimator opens. **Approval** shows the register (190 projects after script `07`), not "The register is not available".
3. Open `/SW_CostModel/web/api/estimator.ashx?action=init`: JSON with your name under `me` and `isAdmin` true (after signing in; without
   signing in it is a 401).
4. Open `/SW_CostModel/web/project_report.aspx`: the register with cost columns and **Download CSV**. Click **PDF** on a row (or **Download PDF** on a project's page): a PDF of that project's estimate downloads, in the same layout as the estimator's Print page (both cost columns, A4, tables continue on the next page with their header).

## 8. Before going live

- [ ] **HTTPS**: bind a certificate (IIS Manager > Bindings > Add > https) and redirect http to https.
- [ ] **Password** changed from the one you were first given, and kept by the people who need it.
- [ ] **Masters** reviewed on the Masters page: the seeded rates, prices and value rates are assumptions.
- [ ] **Database backups**: a full backup nightly, for example
      `BACKUP DATABASE CA_PROJ_COST_MODEL TO DISK = N'D:\Backup\CA_PROJ_COST_MODEL.bak' WITH COMPRESSION, CHECKSUM, INIT;`
      (SQL Server Agent, or Task Scheduler and `sqlcmd` on Express).
- [ ] **Site files** copied somewhere safe once (your `Web.config` has the connection string and the password hash).
- [ ] **Firewall**: clients reach the web server on 443; only the web server reaches SQL Server on 1433.
- [ ] **A real test**: submit an estimate, open it on Approval, verify it, confirm it shows in the report and the CSV opens in Excel.
- [ ] `debug="false"` in `Web.config` (the default now).

## Running locally in Visual Studio (IIS Express)

1. Select the project, press **F4**: **Anonymous Authentication = Enabled**, **Windows Authentication = Disabled**. (With Windows
   Authentication on, IIS Express signs you in as your Windows user before the site's own login.)
2. Set `CCCConString` in `Web.config`; your Windows account needs `db_datareader` and `db_datawriter` on the database.
3. Run (F5): the login page opens. A 403.14 at `/` means `Default.aspx` is missing from the project. Visual Studio's Browser Link
   injects an inline script that the Content-Security-Policy blocks: it logs a console error and is harmless.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| HTTP 500.19 or a configuration error page | a feature from step 1 is missing (usually ASP.NET 4.x), `CCCConString` is missing or `Web.config` is not valid XML, or a `web.config` was added in a subfolder (remove it) |
| Configuration error naming `Microsoft.CodeDom.Providers.DotNetCompilerPlatform` | `bin\Microsoft.CodeDom.Providers.DotNetCompilerPlatform.dll` or the `bin\roslyn` folder was not copied: publish again and copy the whole output |
| "Could not load type 'LoginPage'" / `LoginModule` not found | the project items of step 4.2 are not part of the project, so they were not compiled into `bin` |
| Login page has no styling | `Content\bootstrap.min.css` is missing (step 4.1): check the folder is in the site root; the browser's developer tools (F12 > Network) show the 404 |
| Icons are empty squares | Font Awesome's `fonts` folder is missing next to `Content` |
| The login page keeps coming back | wrong password, `LoginPasswordSha256` does not match it, cookies blocked for the site, or the server clock is far off |
| "Too many wrong passwords" | 5 wrong passwords from that address: wait 5 minutes |
| The site opens with no login at all | the application pool is in Classic mode: use Integrated |
| HTTP 401.2 or a Windows sign-in prompt | IIS has Anonymous off or Windows on: enable Anonymous, disable Windows (step 4.5) |
| "The connection string 'CCCConString' is missing or not valid" | the entry is missing or misspelt in `Web.config` |
| "The database is not available" | wrong server or database in `CCCConString`; SQL Server not accepting TCP connections or port 1433 blocked; or the account has no SQL login (the Application event log, source ASP.NET, shows "Login failed for user ..."; check `@AppLogin` in script 01 and re-run it) |
| "This entry changed while you were saving it" | someone else changed the entry first: reload and try again |
| A build error "The name 'xyz' does not exist" or "already contains a definition for 'form1'" | a leftover Visual Studio template page (for example `project1.aspx` with `.cs` and `.designer.cs`) is in the project: remove it. The pages here have no `runat="server"` controls and need no designer file |
| "This browser cannot read Excel files" | use a current Edge or Chrome; files must be `.xlsx` |
| First page load is very slow | normal while IIS compiles; antivirus scanning `Temporary ASP.NET Files` can slow it |
| The PDF button says the libraries did not load | `assets\js\vendor\*.js` was not published (they are `Content` of the project) or the browser blocked them: F12 > Console |
| Any other server error | Event Viewer > Windows Logs > Application (source ASP.NET 4.0.30319.0) |

## Browsers

Current Edge, Chrome or Firefox 126 or later. Internet Explorer is not supported.

## Updating the site

1. Back up the database and the current site folder.
2. Publish the new build and copy it over the old files, but keep the server's own `Web.config` (the connection string and the password hash):
   merge the file if the new version changed other settings.
3. Run any new database scripts.
4. Browse to the site once (the first request is slow while IIS compiles the page markup). Browsers pick up the new files on the next
   visit (the site sends `Cache-Control: no-cache` for pages, the API and static files).

**Rollback**: put the old site folder back (and, if a script changed the database, restore the backup).
