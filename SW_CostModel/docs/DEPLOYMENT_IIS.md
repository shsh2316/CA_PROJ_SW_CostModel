# Deploying on Windows IIS (no internet)

Everything the site needs is in this repository. The server needs no internet access,
no NuGet packages, no build step and no Node.js. IIS compiles the C# in `App_Code` and
`api\estimator.ashx` itself the first time the site is opened.

## 1. Server prerequisites

All of these install offline from the Windows Server installation media
(Server Manager > Add Roles and Features, or `Install-WindowsFeature` with `-Source` pointing
at the `sources\sxs` folder of the media).

| Feature | Why |
|---|---|
| Web Server (IIS) > Static Content, Default Document | serves the page, scripts, styles and fonts |
| Application Development > ASP.NET 4.x (4.5 or later), .NET Extensibility 4.x, ISAPI Extensions, ISAPI Filters | runs the API (`api\estimator.ashx`) |
| Security > Windows Authentication | identifies who submits and verifies entries |
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
| `database\03_seed_master_data.sql` | loads the default rates and value creation categories. At the end, uncomment the last statement with your own Windows login to make yourself the first admin. |
| `database\04_import_legacy_register_csv.sql` | optional, only to bring in a CSV exported from the earlier claude.ai version |
| `database\05_import_projects_csv.sql` | optional, loads the one-sheet project template saved as CSV (see `docs\PROJECT_SHEET.md`) |

All scripts are safe to run again. To upgrade a database made with an earlier version, run
`02` and `03` again: they add the new tables and columns and rename `IsMasterEditor` to
`IsAdmin`, keeping your data.

`@AppLogin` is the Windows account the site runs as:

- SQL Server on the same machine as IIS: `IIS APPPOOL\CentralAutomationEstimator`
  (the application pool name from step 3).
- SQL Server on another machine: the web server's computer account, `DOMAIN\WEBSERVER$`,
  or a domain service account that you set as the application pool identity.

If you change the database name, change it at the top of each script and in
the `CCCConString` entry in `web\web.config`.

## 3. IIS site

1. Copy the **contents of the `web` folder** to the server, for example
   `C:\inetpub\CentralAutomationEstimator`. Only that folder goes on the web server;
   `database` and `docs` do not.
2. IIS Manager > Application Pools > Add Application Pool:
   name `CentralAutomationEstimator`, .NET CLR version **v4.0**, pipeline mode **Integrated**.
3. IIS Manager > Sites > Add Website (or Add Application under an existing site):
   physical path = the folder from step 1, application pool = `CentralAutomationEstimator`.
4. Select the site > **Authentication**: enable **Windows Authentication**, disable
   **Anonymous Authentication**. These settings are locked at server level, which is why
   they are not in `web.config`.
5. Give the application pool read access to the folder (normally already true through
   `IIS_IUSRS`): `icacls C:\inetpub\CentralAutomationEstimator /grant "IIS APPPOOL\CentralAutomationEstimator:(OI)(CI)RX"`

## 4. Database connection

Edit the `CCCConString` entry in `web\web.config` on the server. It is the only file with
connection details; `web.config` links to it. The default uses Windows authentication to
a local SQL Server:

```xml
<add name="CCCConString" providerName="System.Data.SqlClient"
     connectionString="Data Source=localhost;Initial Catalog=CentralAutomationEstimator;Integrated Security=True;Connect Timeout=15;Application Name=CentralAutomationEstimator" />
```

- Named instance: `Data Source=SQLSERVER01\SQLEXPRESS`
- SQL Server login instead of Windows authentication: see option B in the file. Then
  encrypt the section so the password is not stored in plain text:
  `%windir%\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis -pef "connectionStrings" "C:\inetpub\CentralAutomationEstimator"`

IIS never serves the `config` folder (request filtering, set in `web.config`).

## 5. Check it works

1. Browse to the site from a client PC. The page should open without a sign-in prompt
   (Edge and Chrome pass your Windows sign-in to intranet sites). If you are prompted, add
   the site to the Local intranet zone (Internet Options > Security, or Group Policy).
2. Open **Approval**. It should say there are no verified projects yet, not
   "The register is not available".
3. Open `http://yourserver/yoursite/api/estimator.ashx?action=init` on the server itself.
   You should see JSON with your login under `me`. On the server, errors show in full here.
4. Make admins: people appear in `dbo.SwAppUser` the first time they open the page. Admins see
   costs, masters, Excel upload and Print, and verify entries; everyone else registers projects
   and value creation without seeing costs. Verification needs an admin other than the person
   who submitted, so have at least two admins.
   ```sql
   UPDATE dbo.SwAppUser SET IsAdmin = 1 WHERE UserLogin = N'DOMAIN\username';
   UPDATE dbo.SwAppUser SET DisplayName = N'Full Name' WHERE UserLogin = N'DOMAIN\username';
   ```

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| HTTP 500.19 or a configuration error page | a feature from step 1 is missing (usually ASP.NET 4.x), or `CCCConString` in `web.config` is missing or not valid XML. |
| HTTP 401.2 | both Windows and Anonymous authentication are off. Enable Windows Authentication. |
| Approval says "Cannot connect to SQL Server" | wrong server or database name in `CCCConString` in `web.config`; SQL Server not accepting TCP connections or the firewall blocks port 1433; or the app pool account has no SQL login (the event log then shows "Login failed for user ..."; check `@AppLogin` in script 01 matches the pool identity and re-run it). |
| Someone sees only Registration and My entries | they are not an admin: set `IsAdmin = 1` for them in `dbo.SwAppUser`, then they reload the page. |
| "This browser cannot read Excel files" | use a current Edge or Chrome. Files must be `.xlsx` (Excel Workbook), not `.xls`. |
| "Sign in with your Windows account" when submitting | Anonymous Authentication is still on, or Windows Authentication is off. |
| Any other server error | details are in Event Viewer > Windows Logs > Application (source ASP.NET 4.0.30319.0). |

## Browsers

Current Edge, Chrome or Firefox. Internet Explorer is not supported.

## Updating the site

Copy the new `web` folder contents over the old ones, but keep the server's own
`CCCConString` in `web.config`. Run any new database scripts. Browsers pick up the new
files on the next visit (the site sends `Cache-Control: no-cache`).
