# Deploying on Windows IIS (no internet)

The site is an ASP.NET Web Forms **Web Application project** (`CA_PROJECT_COSTING_MODEL.csproj`):
you build it in Visual Studio and publish the result, which is precompiled into `bin`. The server
needs no internet access, no NuGet download, no build step and no Node.js, and no C# compiler
beyond what `bin` already holds.

The site has two pages and one API, all reading and writing SQL Server through `dbClassSql`:

| URL | What |
|---|---|
| `/project_registry.aspx` (the default page) | estimate, registration, approval, masters, Excel upload, print |
| `/project_report.aspx` | report of estimates, with CSV download |
| `/api/estimator.ashx` | JSON API used by the registry page |

## 1. Server prerequisites

All of these install offline from the Windows Server installation media
(Server Manager > Add Roles and Features, or `Install-WindowsFeature` with `-Source` pointing
at the `sources\sxs` folder of the media).

| Feature | Why |
|---|---|
| Web Server (IIS) > Static Content, Default Document | serves the page, scripts, styles and fonts |
| Application Development > ASP.NET 4.x (4.5 or later), .NET Extensibility 4.x, ISAPI Extensions, ISAPI Filters | runs the pages (`.aspx`) and the API (`api\estimator.ashx`) |
| .NET Framework 4.5 or later | in-box on Windows Server 2012 R2 and later |

PowerShell, run as administrator:

```powershell
Install-WindowsFeature Web-Server, Web-Static-Content, Web-Default-Doc, Web-Asp-Net45, Web-Net-Ext45, Web-ISAPI-Ext, Web-ISAPI-Filter, Web-Windows-Auth, Web-Mgmt-Console -Source D:\sources\sxs
```

SQL Server 2016 SP1 or later (Express is fine). Script `04` needs SQL Server 2017 or later.

## 2. Database

Open each script in SQL Server Management Studio as a sysadmin and run it, in order:

| Script | What it does |
|---|---|
| `database\01_create_database_and_login.sql` | creates the database and gives the IIS application pool account read and write access. Set `@AppLogin` at the top first (see below). |
| `database\02_create_tables.sql` | creates the tables, indexes and views |
| `database\03_seed_master_data.sql` | loads the default rates and value creation categories |
| `database\06_admins_and_checks.sql` | checks only: users, master row counts, the pool account's rights, the register (run it after the first sign-in) |
| `database\04_import_legacy_register_csv.sql` | optional, only to bring in a CSV exported from the earlier claude.ai version |
| `database\05_import_projects_csv.sql` | optional, loads the one-sheet project template saved as CSV (see `docs\PROJECT_SHEET.md`) |
| `database\07_import_ca_projects_list.sql` | optional, one-off: the 190 projects of the CA project list (July 2026) as verified, costed register entries (see `docs\PROJECT_SHEET.md`). Run it after `01`-`03`. |

Or from a command prompt on the SQL Server machine (Windows authentication, stops at the first error):

```bat
cd database
sqlcmd -S . -E -b -i 01_create_database_and_login.sql
sqlcmd -S . -E -b -i 02_create_tables.sql
sqlcmd -S . -E -b -i 03_seed_master_data.sql
sqlcmd -S . -E -b -i 06_admins_and_checks.sql
```

(Use `-S SERVER\INSTANCE` for a named instance. Edit `@AppLogin` in script 01 and the admin
logins in script 06 before running them.)

All scripts are safe to run again. To upgrade a database made with an earlier version, run
`02` and `03` again: they add the new tables and columns and rename `IsMasterEditor` to
`IsAdmin`, keeping your data.

`@AppLogin` is the Windows account the site runs as:

- SQL Server on the same machine as IIS: `IIS APPPOOL\CentralAutomationEstimator`
  (the application pool name from step 3).
- SQL Server on another machine: the web server's computer account, `DOMAIN\WEBSERVER$`,
  or a domain service account that you set as the application pool identity.

If you change the database name, change it at the top of each script and in
the `CCCConString` entry in the root `Web.config`.

## 3. IIS site

1. In Visual Studio, check that the project includes every file under `SW_CostModel\web`
   (Solution Explorer > Show All Files > right-click > Include In Project):
   `project_registry.aspx`, `project_report.aspx` (with their `.aspx.cs`; the pages have no server controls, so no designer files),
   `api\estimator.ashx` (with `estimator.ashx.cs`), everything in `App_Code` (Build Action
   **Compile**), and `assets` (Build Action **Content**). The `database` and `docs` folders stay out.
   All settings live in the project's root `Web.config` (the application root): `CCCConString`, Windows
   authentication, security headers. There is no `web.config` inside `SW_CostModel\web`: IIS rejects
   `<authentication>` in a subfolder ("allowDefinition='MachineToApplication'" error). Include the root `Default.aspx` in the project too: it is the default document and forwards `/` to
   `/SW_CostModel/web/project_registry.aspx`.
2. Build > Publish Selection > Folder, configuration **Release**. The published folder holds the
   pages, `assets`, `Web.config` and `bin` (including `bin\roslyn`, the compiler ASP.NET uses for the
   page markup). Copy that folder's contents to the server, for example
   `C:\inetpub\CentralAutomationEstimator`.
3. IIS Manager > Application Pools > Add Application Pool:
   name `CentralAutomationEstimator`, .NET CLR version **v4.0**, pipeline mode **Integrated**.
   Leave **Maximum Worker Processes** at 1 (`dbClassSql` shares one database connection per process).
4. IIS Manager > Sites > Add Website (or Add Application under an existing site):
   physical path = the folder from step 1, application pool = `CentralAutomationEstimator`.
5. Select the site > **Authentication**: leave **Anonymous Authentication** enabled and
   **Windows Authentication** disabled. The sign-in is done by the site itself (`LoginModule` and the
   `Default.aspx` login page); the password is checked against `Web.config`.
6. Give the application pool read access to the folder (normally already true through
   `IIS_IUSRS`): `icacls C:\inetpub\CentralAutomationEstimator /grant "IIS APPPOOL\CentralAutomationEstimator:(OI)(CI)RX"`

## 4. Database connection

Edit the `CCCConString` entry in `Web.config` on the server. It is the only place with
connection details, and both `dbClassSql` and the API read it. The default uses Windows
authentication to a local SQL Server:

```xml
<add name="CCCConString" providerName="System.Data.SqlClient"
     connectionString="Data Source=localhost;Initial Catalog=CentralAutomationEstimator;Integrated Security=True;Connect Timeout=15;Application Name=CentralAutomationEstimator" />
```

- Named instance: `Data Source=SQLSERVER01\SQLEXPRESS`
- SQL Server login instead of Windows authentication: use `User ID=...;Password=...` instead of
  `Integrated Security=True`, then encrypt the section so the password is not stored in plain text:
  `%windir%\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis -pef "connectionStrings" "C:\inetpub\CentralAutomationEstimator"`


## 5. Check it works

1. Browse to the site from a client PC (`http://yourserver/` opens `project_registry.aspx`). The first
   request takes 10 to 30 seconds while IIS compiles the code. The login page opens: enter any name and
   the password you were given (see "Sign-in" below).
2. Open **Approval**. It should say there are no verified projects yet, not
   "The register is not available".
3. Open `http://yourserver/yoursite/api/estimator.ashx?action=init` on the server itself.
   After signing in on the login page, you should see JSON with your name under `me` and `isAdmin` true (without signing in: a 401). On the server, errors show in full here.
4. Open `/project_report.aspx`. You see the register with cost columns and a
   **Download CSV** button (empty at first: "No projects match").
5. There is one shared password, so there are no other roles: everyone who signs in sees costs, masters,
   Excel upload and Print, and can verify entries, including ones they submitted themselves
   (`AllowSelfVerification` in `Web.config`).

### Sign-in

`Default.aspx` is the login page (the site root opens it). It takes **any user name** and one shared
**password**. The name is only recorded as who submitted and approved entries; whoever signs in is an admin.

- `LoginModule` checks a signed, encrypted cookie on every request (pages, API and files except the login
  page and `assets`). Without it, pages go to the login page and the API answers 401. A sign-in lasts 8 hours
  (`LoginHours` in `Web.config`); **Sign out** is in the page menu.
- The password is not stored anywhere: `Web.config` holds only its SHA-256 (`LoginPasswordSha256`).
- To change the password, in PowerShell, then paste the result into `Web.config`:
  ```powershell
  $b=[Text.Encoding]::UTF8.GetBytes('NEW PASSWORD'); -join ([Security.Cryptography.SHA256]::Create().ComputeHash($b)|%{$_.ToString('x2')})
  ```
- The password and the sign-in cookie cross the network as they are, so use **HTTPS** on the server. The
  cookie is encrypted with the machine key: on a web farm give every server the same `<machineKey>`.
- A missing `LoginPasswordSha256` means nobody can sign in.

## 6. Before going live

- [ ] **HTTPS**: bind a certificate to the site (IIS Manager > Bindings > Add > https) and redirect
      http to https. The login sends the password as typed, and the register holds costs.
- [ ] **Password**: changed from the one you were first given, and kept by the people who need it.
- [ ] **Masters** reviewed on the Masters page: the seeded rates, prices and value rates are assumptions.
- [ ] **Database backups**: a full backup nightly and log backups if the recovery model is full, for example
      ```sql
      BACKUP DATABASE CentralAutomationEstimator TO DISK = N'D:\Backup\CentralAutomationEstimator.bak' WITH COMPRESSION, CHECKSUM, INIT;
      ```
      Schedule it with SQL Server Agent (Express has no Agent: use Task Scheduler and `sqlcmd`).
- [ ] **Site files** copied somewhere safe once (your own `Web.config` has the connection string).
- [ ] **Firewall**: clients reach the web server on 443; only the web server reaches SQL Server on 1433.
- [ ] **A real test**: as a normal user submit an estimate; as an admin open it on Approval, verify it;
      confirm it shows in `/project_report.aspx` and the CSV opens in Excel.

## Running locally in Visual Studio (IIS Express)

1. Select the project in Solution Explorer, press **F4** (Properties window): set **Anonymous
   Authentication = Enabled** and **Windows Authentication = Disabled**. (If Windows Authentication
   stays on, IIS Express signs you in as your Windows user before the site's own login.)
2. Set `CCCConString` in the root `Web.config` to your SQL Server and database.
3. Run (F5). The site root forwards to `/SW_CostModel/web/project_registry.aspx` through `Default.aspx`
   (a 403.14 "directory browsing" error at `/` means `Default.aspx` is missing).
4. The login page opens: any name and the password.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| HTTP 500.19 or a configuration error page | a feature from step 1 is missing (usually ASP.NET 4.x), or `CCCConString` in `Web.config` is missing or not valid XML, or a `web.config` was added in a subfolder that is not an application (remove it). |
| Configuration error naming `Microsoft.CodeDom.Providers.DotNetCompilerPlatform` | `bin\Microsoft.CodeDom.Providers.DotNetCompilerPlatform.dll` or the `bin\roslyn` folder was not copied: publish again and copy the whole folder. |
| Build error "The name 'xyz' does not exist" or "already contains a definition for 'form1'" | a leftover Visual Studio template page (for example `project1.aspx` with its `.cs` and `.designer.cs`) is in the project: remove it. The two pages here have no `runat="server"` controls and need no designer file. |
| `CS0433` "type exists in both" when running locally | rename the `App_Code` folder (for example `Code`) so ASP.NET does not compile it a second time; published output is not affected. |
| Page loads but says "The connection string 'CCCConString' is missing or not valid" | the entry is missing or misspelt in `Web.config`. |
| First page load is very slow, or a compile error appears once then goes | normal while IIS compiles; antivirus scanning `Temporary ASP.NET Files` can slow it. |
| HTTP 401.2, or no login prompt but a Windows sign-in | IIS has Anonymous off or Windows on. Enable Anonymous, disable Windows (step 3.5). |
| The login page keeps coming back | wrong password, or `LoginPasswordSha256` in `Web.config` does not match it; or cookies are blocked for the site; or the clock on the server is far off (the sign-in has an expiry time). |
| Approval says "Cannot connect to SQL Server" | wrong server or database name in `CCCConString` in `Web.config`; SQL Server not accepting TCP connections or the firewall blocks port 1433; or the app pool account has no SQL login (the event log then shows "Login failed for user ..."; check `@AppLogin` in script 01 matches the pool identity and re-run it). |
| "This browser cannot read Excel files" | use a current Edge or Chrome. Files must be `.xlsx` (Excel Workbook), not `.xls`. |
| Any other server error | details are in Event Viewer > Windows Logs > Application (source ASP.NET 4.0.30319.0). |

## Browsers

Current Edge, Chrome or Firefox. Internet Explorer is not supported.

## Updating the site

1. Back up the database and the current site folder.
2. Publish the new build and copy it over the old files, but keep the server's own
   `CCCConString` in `Web.config` (merge the file if the new version changed other settings).
3. Run any new database scripts (all are safe to run again).
4. Browse to the site once (the first request is slow while IIS compiles the page markup). Browsers pick up the new files on the next visit
   (the site sends `Cache-Control: no-cache`).

**Rollback**: put the old site folder back (and, if a script changed the database, restore the
backup). Nothing else on the server changes.
