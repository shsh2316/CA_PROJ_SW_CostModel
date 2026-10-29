/* ==================================================================
   Central Automation - Estimate and Quotation
   05. OPTIONAL: import projects from one CSV file straight into the register

   The team fills ONE sheet, one row per project: the Excel template from the
   Excel upload page (or database\templates\projects.csv). Save that sheet
   as CSV and load it here. Columns and allowed values: docs\PROJECT_SHEET.md.

   What it does
     - Reads projects.csv: row 1 = headings, row 2 = hints (skipped), then one
       row per project, in the template's column order.
     - Checks every value against the masters. If anything is wrong it lists
       the problems with their line numbers and imports NOTHING. Fix the file
       and run it again.
     - Adds each project to dbo.SwProjectRegister as "awaiting verification",
       WITHOUT costs, like an entry submitted on the page. An admin opens it
       on the Approval page: the cost is worked out there with the current
       masters and recorded when the admin verifies it. (Costs are calculated
       by the page, not by SQL Server.)
     - Running it again with the same file updates entries that are not yet
       verified and leaves verified ones alone.

   How to run
     1. In Excel: File > Save As > "CSV UTF-8 (Comma delimited) (*.csv)",
        file name projects.csv, into a folder the SQL Server service account
        can read (a local folder on the SQL Server machine, or a UNC share).
        Only the Projects sheet is saved, which is what is needed.
     2. Set @Folder below. Leave @CheckOnly = 1 for a first run: it only
        checks the file and shows what would be imported.
     3. Set @CheckOnly = 0 and run again to import.
   The entries belong to @SubmittedBy (you, unless you change it). An entry
   must be verified by an admin other than the person it belongs to.
   Needs SQL Server 2017 or later and database compatibility level 140 or higher
   (BULK INSERT ... FORMAT = 'CSV', STRING_AGG).
   ================================================================== */

USE CA_PROJ_COST_MODEL;   -- the database made in script 01 (if you used another name, change it here and in the check below)
GO
IF DB_NAME() <> N'CA_PROJ_COST_MODEL'
BEGIN
    RAISERROR('Not connected to CA_PROJ_COST_MODEL (the USE above failed): nothing was changed.', 16, 1);
    SET NOEXEC ON;   -- skip the rest of the script
END
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Folder      nvarchar(400) = N'D:\Imports\Estimates\';   -- <<< folder with projects.csv
DECLARE @CheckOnly   bit           = 1;                          -- 1 = check and preview only, 0 = import
DECLARE @SubmittedBy nvarchar(200) = N'Import';                  -- whose entries these are: the name someone types at the login page to edit them

IF RIGHT(@Folder, 1) NOT IN (N'\', N'/') SET @Folder += N'\';

/* ---------- 1. load the file (all text) ---------- */
IF OBJECT_ID('tempdb..#P') IS NOT NULL DROP TABLE #P;
CREATE TABLE #P (ProjectName nvarchar(400) COLLATE DATABASE_DEFAULT, Department nvarchar(400) COLLATE DATABASE_DEFAULT, PreparedBy nvarchar(400) COLLATE DATABASE_DEFAULT, FinancialYear nvarchar(400) COLLATE DATABASE_DEFAULT,
    RecordAs nvarchar(400) COLLATE DATABASE_DEFAULT, ProjectStatus nvarchar(400) COLLATE DATABASE_DEFAULT, DeliveryModel nvarchar(400) COLLATE DATABASE_DEFAULT, ProjectType nvarchar(400) COLLATE DATABASE_DEFAULT,
    DurationDays nvarchar(400) COLLATE DATABASE_DEFAULT, NamedUsers nvarchar(400) COLLATE DATABASE_DEFAULT, Complexity nvarchar(400) COLLATE DATABASE_DEFAULT, TeamSize nvarchar(400) COLLATE DATABASE_DEFAULT, TeamLevel nvarchar(400) COLLATE DATABASE_DEFAULT,
    NeedsServers nvarchar(400) COLLATE DATABASE_DEFAULT, HostingModel nvarchar(400) COLLATE DATABASE_DEFAULT, Environments nvarchar(400) COLLATE DATABASE_DEFAULT, CpuCores nvarchar(400) COLLATE DATABASE_DEFAULT, RamGB nvarchar(400) COLLATE DATABASE_DEFAULT,
    StorageTB nvarchar(400) COLLATE DATABASE_DEFAULT, GpuModel nvarchar(400) COLLATE DATABASE_DEFAULT, GpuCount nvarchar(400) COLLATE DATABASE_DEFAULT, DatabaseEngine nvarchar(400) COLLATE DATABASE_DEFAULT, OperatingSystem nvarchar(400) COLLATE DATABASE_DEFAULT,
    YearsOfOwnership nvarchar(400) COLLATE DATABASE_DEFAULT, Benefit1 nvarchar(400) COLLATE DATABASE_DEFAULT, Benefit1Qty nvarchar(400) COLLATE DATABASE_DEFAULT, Benefit2 nvarchar(400) COLLATE DATABASE_DEFAULT, Benefit2Qty nvarchar(400) COLLATE DATABASE_DEFAULT,
    Benefit3 nvarchar(400) COLLATE DATABASE_DEFAULT, Benefit3Qty nvarchar(400) COLLATE DATABASE_DEFAULT, OneTimeValue nvarchar(400) COLLATE DATABASE_DEFAULT, Note nvarchar(2000) COLLATE DATABASE_DEFAULT,
    StartDate nvarchar(400) COLLATE DATABASE_DEFAULT, EndDate nvarchar(400) COLLATE DATABASE_DEFAULT);

DECLARE @sql nvarchar(max), @set nvarchar(max), @msg nvarchar(2048);
-- 0x0a ends a row whether the file uses Windows (CR LF) or Unix (LF) line ends; CR is removed below
SET @sql = N'BULK INSERT #P FROM ' + QUOTENAME(@Folder + N'projects.csv', N'''') +
           N' WITH (FORMAT = ''CSV'', FIRSTROW = 2, FIELDQUOTE = ''"'', CODEPAGE = ''65001'', ROWTERMINATOR = ''0x0a'', MAXERRORS = 0);';
BEGIN TRY
    EXEC (@sql);
END TRY
BEGIN CATCH
    SET @msg = ERROR_MESSAGE();
    RAISERROR (N'Could not read projects.csv: %s Check the folder, that the file is saved as CSV and that it has exactly the template''s 34 columns (a template from before October 2026 has 32: download a fresh one, or add empty Start date and End date columns at the end).', 16, 1, @msg);
    RETURN;
END CATCH
ALTER TABLE #P ADD Line int IDENTITY(2, 1);   -- spreadsheet line number (line 1 is the headings)

-- trim every value, drop the CR of Windows line ends and turn empty text into NULL
SELECT @set = STRING_AGG(CAST(QUOTENAME(name) + N' = NULLIF(LTRIM(RTRIM(REPLACE(REPLACE(' + QUOTENAME(name) + N', NCHAR(13), N''''), NCHAR(160), N'' ''))), N'''')' AS nvarchar(max)), N', ')
FROM tempdb.sys.columns WHERE object_id = OBJECT_ID(N'tempdb..#P') AND name <> 'Line';
EXEC (N'UPDATE #P SET ' + @set + N';');

-- the hint row under the headings, and rows Excel leaves empty
DELETE #P WHERE ProjectName = N'Required';
DELETE #P WHERE COALESCE(ProjectName, Department, PreparedBy, FinancialYear, RecordAs, ProjectStatus, DeliveryModel, ProjectType, DurationDays,
    NamedUsers, Complexity, TeamSize, TeamLevel, NeedsServers, HostingModel, Environments, CpuCores, RamGB, StorageTB, GpuModel, GpuCount,
    DatabaseEngine, OperatingSystem, YearsOfOwnership, Benefit1, Benefit1Qty, Benefit2, Benefit2Qty, Benefit3, Benefit3Qty, OneTimeValue, Note, StartDate, EndDate) IS NULL;

-- numbers: allow 1,200 / 1,00,000 / ₹75000
UPDATE #P SET DurationDays = REPLACE(DurationDays, N',', N''), NamedUsers = REPLACE(NamedUsers, N',', N''), TeamSize = REPLACE(TeamSize, N',', N''),
    CpuCores = REPLACE(CpuCores, N',', N''), RamGB = REPLACE(RamGB, N',', N''), StorageTB = REPLACE(StorageTB, N',', N''), GpuCount = REPLACE(GpuCount, N',', N''),
    YearsOfOwnership = REPLACE(YearsOfOwnership, N',', N''), Benefit1Qty = REPLACE(Benefit1Qty, N',', N''), Benefit2Qty = REPLACE(Benefit2Qty, N',', N''),
    Benefit3Qty = REPLACE(Benefit3Qty, N',', N''), OneTimeValue = REPLACE(REPLACE(OneTimeValue, N',', N''), NCHAR(8377), N'');

/* ---------- 2. allowed values (the template's wording; codes and the page's longer wording are accepted too) ---------- */
IF OBJECT_ID('tempdb..#C') IS NOT NULL DROP TABLE #C;
CREATE TABLE #C (Field varchar(20) COLLATE DATABASE_DEFAULT, Label nvarchar(60) COLLATE DATABASE_DEFAULT, Code varchar(20) COLLATE DATABASE_DEFAULT);
INSERT #C VALUES
 ('kind','New project','new'),('kind','New','new'),('kind','Maintenance (AMC)','amc'),('kind','Maintenance','amc'),('kind','AMC','amc'),('kind','Enhancement','enh'),('kind','enh','enh'),
 ('status','Planned','planned'),('status','In progress','progress'),('status','progress','progress'),('status','Completed','completed'),
 ('model','One-time setup','once'),('model','One-time','once'),('model','once','once'),('model','Yearly model (with support)','yearly'),('model','Yearly model','yearly'),('model','Yearly','yearly'),
 ('type','Web application','web'),('type','web','web'),('type','Windows desktop application','desktop'),('type','desktop','desktop'),('type','Mobile app','mobile'),('type','mobile','mobile'),
 ('type','Interface / integration','interface'),('type','interface','interface'),('type','Dashboard / reporting','dash'),('type','dash','dash'),('type','AI / vision system','ai'),('type','ai','ai'),
 ('cx','Low','low'),('cx','Standard','std'),('cx','std','std'),('cx','High','high'),('cx','Very high','vhigh'),('cx','vhigh','vhigh'),
 ('yesno','Yes','1'),('yesno','Y','1'),('yesno','No','0'),('yesno','N','0'),
 ('mode','On-premise','onprem'),('mode','onprem','onprem'),('mode','Cloud','cloud'),
 ('env','Production only','prod'),('env','prod','prod'),('env','Production + UAT','uat'),('env','uat','uat'),('env','Production + DR','dr'),('env','dr','dr'),('env','Production + UAT + DR','full'),('env','full','full');

DECLARE @today date = GETDATE();
DECLARE @fyStart int = CASE WHEN MONTH(@today) >= 4 THEN YEAR(@today) ELSE YEAR(@today) - 1 END;
DECLARE @CurrentFy varchar(9) = CONCAT(@fyStart, '-', RIGHT(CONCAT('0', (@fyStart + 1) % 100), 2));

/* benefits are matched by name, by "name (unit)" as in the template's list, or by id */
IF OBJECT_ID('tempdb..#B') IS NOT NULL DROP TABLE #B;
SELECT CategoryId, CategoryName, Unit, DefaultRate,
       CategoryName + N' (' + CASE WHEN Unit = 'INR' THEN NCHAR(8377) ELSE Unit END + N')' AS ListLabel
INTO #B FROM dbo.SwValueCategory WHERE IsActive = 1;

/* ---------- 3. convert ---------- */
IF OBJECT_ID('tempdb..#Pc') IS NOT NULL DROP TABLE #Pc;
SELECT p.*,
    ISNULL(LTRIM(CASE WHEN p.FinancialYear LIKE 'FY %' THEN SUBSTRING(p.FinancialYear, 3, 20) ELSE p.FinancialYear END), @CurrentFy) AS Fy,
    ISNULL((SELECT Code FROM #C WHERE Field = 'kind'   AND Label = p.RecordAs),      CASE WHEN p.RecordAs IS NULL THEN 'new' END)            AS KindCode,
    ISNULL((SELECT Code FROM #C WHERE Field = 'status' AND Label = p.ProjectStatus), CASE WHEN p.ProjectStatus IS NULL THEN 'completed' END) AS StatusCode,
    (SELECT Code FROM #C WHERE Field = 'model' AND Label = p.DeliveryModel) AS ModelCode,
    (SELECT Code FROM #C WHERE Field = 'type'  AND Label = p.ProjectType)   AS TypeCode,
    (SELECT Code FROM #C WHERE Field = 'cx'    AND Label = p.Complexity)    AS CxCode,
    (SELECT LevelName FROM dbo.SwRateLevel WHERE LevelName = p.TeamLevel)  AS LevelName,
    CAST((SELECT Code FROM #C WHERE Field = 'yesno' AND Label = p.NeedsServers) AS bit) AS NeedHw,
    (SELECT Code FROM #C WHERE Field = 'mode' AND Label = p.HostingModel) AS ModeCode,
    (SELECT Code FROM #C WHERE Field = 'env'  AND Label = p.Environments) AS EnvCode,
    (SELECT TOP 1 GpuId FROM dbo.SwGpu      WHERE IsActive = 1 AND (GpuName = p.GpuModel OR GpuId = p.GpuModel))           AS GpuId,
    (SELECT TOP 1 DbId  FROM dbo.SwDbEngine WHERE IsActive = 1 AND (DbName = p.DatabaseEngine OR DbId = p.DatabaseEngine))   AS DbId,
    (SELECT TOP 1 OsId  FROM dbo.SwOsOption WHERE IsActive = 1 AND (OsName = p.OperatingSystem OR OsId = p.OperatingSystem)) AS OsId,
    (SELECT TOP 1 CategoryId FROM #B WHERE p.Benefit1 IN (CategoryName, ListLabel, CategoryId)) AS Cat1,
    (SELECT TOP 1 CategoryId FROM #B WHERE p.Benefit2 IN (CategoryName, ListLabel, CategoryId)) AS Cat2,
    (SELECT TOP 1 CategoryId FROM #B WHERE p.Benefit3 IN (CategoryName, ListLabel, CategoryId)) AS Cat3,
    TRY_CONVERT(decimal(12,2), p.DurationDays) AS nDays, TRY_CONVERT(decimal(12,2), p.NamedUsers) AS nUsers, TRY_CONVERT(decimal(12,2), p.TeamSize) AS nTeam,
    TRY_CONVERT(decimal(12,2), p.CpuCores) AS nCpu, TRY_CONVERT(decimal(12,2), p.RamGB) AS nRam, TRY_CONVERT(decimal(12,2), p.StorageTB) AS nStorage,
    TRY_CONVERT(decimal(12,2), p.GpuCount) AS nGpu, TRY_CONVERT(decimal(12,2), p.YearsOfOwnership) AS nYears,
    TRY_CONVERT(decimal(14,2), p.Benefit1Qty) AS nQty1, TRY_CONVERT(decimal(14,2), p.Benefit2Qty) AS nQty2, TRY_CONVERT(decimal(14,2), p.Benefit3Qty) AS nQty3,
    TRY_CONVERT(decimal(14,2), p.OneTimeValue) AS nOnce,
    COALESCE(TRY_CONVERT(date, p.StartDate, 103), TRY_CONVERT(date, p.StartDate, 105), TRY_CONVERT(date, p.StartDate, 23)) AS dStart,   -- dd/mm/yyyy, dd-mm-yyyy or yyyy-mm-dd
    COALESCE(TRY_CONVERT(date, p.EndDate, 103), TRY_CONVERT(date, p.EndDate, 105), TRY_CONVERT(date, p.EndDate, 23)) AS dEnd,
    CAST(NULL AS decimal(12,4)) AS Cx, CAST(NULL AS nvarchar(400)) AS Slug, CAST(NULL AS nvarchar(200)) AS RegisterId
INTO #Pc FROM #P p;
UPDATE p SET Cx = (SELECT ValueCA FROM dbo.SwSetting WHERE SettingKey = 'complexity.' + p.CxCode) FROM #Pc p WHERE p.CxCode IS NOT NULL;

/* register id = project-slug_FY_kind_login, the same as the page builds */
DECLARE @login nvarchar(200);
;WITH n AS (SELECT TOP (200) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_columns)
SELECT @login = STRING_AGG(CASE WHEN SUBSTRING(@SubmittedBy, n.i, 1) COLLATE Latin1_General_BIN LIKE '[A-Za-z0-9_-]' THEN SUBSTRING(@SubmittedBy, n.i, 1) ELSE N'' END, N'')
                WITHIN GROUP (ORDER BY n.i)
FROM n WHERE n.i <= LEN(@SubmittedBy);
;WITH n AS (SELECT TOP (400) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_columns),
ch AS (SELECT p.Line, n.i, SUBSTRING(LOWER(p.ProjectName), n.i, 1) AS c FROM #Pc p JOIN n ON n.i <= LEN(p.ProjectName))
UPDATE p SET Slug = s.v
FROM #Pc p JOIN (SELECT Line, STRING_AGG(CASE WHEN c COLLATE Latin1_General_BIN LIKE '[a-z0-9]' THEN c ELSE N'-' END, N'') WITHIN GROUP (ORDER BY i) AS v
                 FROM ch GROUP BY Line) s ON s.Line = p.Line;
WHILE EXISTS (SELECT 1 FROM #Pc WHERE Slug LIKE N'%--%') UPDATE #Pc SET Slug = REPLACE(Slug, N'--', N'-');
UPDATE #Pc SET Slug = SUBSTRING(Slug, 2, 400) WHERE Slug LIKE N'-%';
UPDATE #Pc SET Slug = LEFT(Slug, LEN(Slug) - 1) WHERE Slug LIKE N'%-';
UPDATE #Pc SET Slug = ISNULL(NULLIF(LEFT(Slug, 60), N''), N'project');
UPDATE #Pc SET RegisterId = LEFT(Slug + N'_' + Fy + N'_' + ISNULL(KindCode, N'new') + N'_' + ISNULL(@login, N''), 200);

/* ---------- 4. check ---------- */
IF OBJECT_ID('tempdb..#Err') IS NOT NULL DROP TABLE #Err;
CREATE TABLE #Err (Line int, ProjectName nvarchar(400), Problem nvarchar(1000));

INSERT #Err SELECT NULL, NULL, N'projects.csv has no projects.' WHERE NOT EXISTS (SELECT 1 FROM #Pc);
INSERT #Err SELECT NULL, NULL, N'Nobody to submit as: set @SubmittedBy.' WHERE ISNULL(@login, N'') = N'';
INSERT #Err SELECT Line, ProjectName, N'Project name is empty.' FROM #Pc WHERE ProjectName IS NULL;
INSERT #Err SELECT p.Line, p.ProjectName, N'Text too long: ' + v.col + N' (at most ' + CAST(v.mx AS nvarchar) + N' characters).'
    FROM #Pc p CROSS APPLY (VALUES ('Project name', LEN(p.ProjectName), 200), ('Department / client', LEN(p.Department), 200),
                                   ('Prepared by', LEN(p.PreparedBy), 200), ('Note', LEN(p.Note), 500)) v(col, len, mx) WHERE v.len > v.mx;
INSERT #Err SELECT Line, ProjectName, N'Financial year "' + Fy + N'" is not like 2026-27.' FROM #Pc WHERE Fy NOT LIKE '[0-9][0-9][0-9][0-9]-[0-9][0-9]';
INSERT #Err SELECT p.Line, p.ProjectName, v.col + N' "' + v.raw + N'" is not one of: ' + v.allowed
    FROM #Pc p CROSS APPLY (VALUES
        ('Record as', p.RecordAs, p.KindCode, N'New project, Maintenance (AMC), Enhancement'),
        ('Project status', p.ProjectStatus, p.StatusCode, N'Planned, In progress, Completed'),
        ('Delivery model', p.DeliveryModel, p.ModelCode, N'One-time setup, Yearly model (with support)'),
        ('Project type', p.ProjectType, p.TypeCode, N'Web application, Windows desktop application, Mobile app, Interface / integration, Dashboard / reporting, AI / vision system'),
        ('Complexity', p.Complexity, p.CxCode, N'Low, Standard, High, Very high'),
        ('Team level', p.TeamLevel, p.LevelName, N'Junior, Mid, Senior, Lead, Architect'),
        ('Needs servers', p.NeedsServers, CAST(p.NeedHw AS varchar), N'Yes, No'),
        ('Hosting model', p.HostingModel, p.ModeCode, N'On-premise, Cloud'),
        ('Environments', p.Environments, p.EnvCode, N'Production only, Production + UAT, Production + DR, Production + UAT + DR'),
        ('GPU model', p.GpuModel, p.GpuId, N'a GPU name from the Hardware master'),
        ('Database engine', p.DatabaseEngine, p.DbId, N'a database engine name from the Licences master'),
        ('Operating system', p.OperatingSystem, p.OsId, N'an operating system name from the Licences master'),
        ('Benefit 1', p.Benefit1, p.Cat1, N'a benefit from the Value creation master'),
        ('Benefit 2', p.Benefit2, p.Cat2, N'a benefit from the Value creation master'),
        ('Benefit 3', p.Benefit3, p.Cat3, N'a benefit from the Value creation master')) v(col, raw, code, allowed)
    WHERE v.raw IS NOT NULL AND v.code IS NULL;
INSERT #Err SELECT p.Line, p.ProjectName, v.col + N' "' + v.raw + N'" is not a number of 0 or more.'
    FROM #Pc p CROSS APPLY (VALUES
        ('Duration (working days)', p.DurationDays, p.nDays), ('Named users', p.NamedUsers, p.nUsers), ('Team size (people)', p.TeamSize, p.nTeam),
        ('CPU cores', p.CpuCores, p.nCpu), ('RAM (GB)', p.RamGB, p.nRam), ('Storage (TB)', p.StorageTB, p.nStorage), ('GPU count', p.GpuCount, p.nGpu),
        ('Years of ownership', p.YearsOfOwnership, p.nYears), ('Benefit 1 per year', p.Benefit1Qty, p.nQty1), ('Benefit 2 per year', p.Benefit2Qty, p.nQty2),
        ('Benefit 3 per year', p.Benefit3Qty, p.nQty3), ('One-time value', p.OneTimeValue, p.nOnce)) v(col, raw, num)
    WHERE v.raw IS NOT NULL AND (v.num IS NULL OR v.num < 0);
INSERT #Err SELECT p.Line, p.ProjectName, v.col + N' "' + v.raw + N'" is not a date (use dd/mm/yyyy).'
    FROM #Pc p CROSS APPLY (VALUES ('Start date', p.StartDate, p.dStart), ('End date', p.EndDate, p.dEnd)) v(col, raw, d) WHERE v.raw IS NOT NULL AND v.d IS NULL;
INSERT #Err SELECT Line, ProjectName, N'End date is before the start date.' FROM #Pc WHERE dEnd < dStart;
INSERT #Err SELECT p.Line, p.ProjectName, v.col + N' per year is filled but no benefit is chosen.'
    FROM #Pc p CROSS APPLY (VALUES ('Benefit 1', p.Benefit1, p.nQty1), ('Benefit 2', p.Benefit2, p.nQty2), ('Benefit 3', p.Benefit3, p.nQty3)) v(col, cat, qty)
    WHERE v.cat IS NULL AND v.qty > 0;
INSERT #Err SELECT MIN(Line), MIN(ISNULL(ProjectName, N'')), N'Lines ' + STRING_AGG(CAST(Line AS nvarchar), N', ') + N' are the same entry (same project name, financial year and record type).'
    FROM #Pc GROUP BY RegisterId HAVING COUNT(*) > 1;

IF EXISTS (SELECT 1 FROM #Err)
BEGIN
    SELECT Line, ProjectName, Problem FROM #Err ORDER BY Line;
    RAISERROR (N'The file has problems (listed above). Nothing was imported. Fix the file and run the script again.', 16, 1);
    RETURN;
END

/* ---------- 5. build each estimate as the page stores it ---------- */
IF OBJECT_ID('tempdb..#V') IS NOT NULL DROP TABLE #V;   -- value creation lines
SELECT p.Line, x.Slot, b.CategoryId AS cat, CAST(N'' AS nvarchar(100)) AS [desc], x.Qty AS qty, b.Unit AS unit, b.DefaultRate AS rate, 'year' AS freq
INTO #V FROM #Pc p
CROSS APPLY (VALUES (1, p.Cat1, p.nQty1), (2, p.Cat2, p.nQty2), (3, p.Cat3, p.nQty3)) x(Slot, Cat, Qty)
JOIN #B b ON b.CategoryId = x.Cat
WHERE x.Qty > 0;
INSERT #V SELECT p.Line, 4, (SELECT CategoryId FROM #B WHERE CategoryId = 'other'), N'One-time value', 1, N'INR', p.nOnce, 'once' FROM #Pc p WHERE p.nOnce > 0;

IF OBJECT_ID('tempdb..#Out') IS NOT NULL DROP TABLE #Out;
SELECT p.Line, p.ProjectName, p.RegisterId,
    p.Slug + N'_' + p.Fy + N'_' + p.KindCode AS EntryKey,
    CASE WHEN p.nTeam > 0 THEN p.nTeam * ISNULL(p.nDays, 90) END AS PersonDays,
    CASE WHEN p.nTeam > 0 THEN CAST(p.nTeam AS int) END AS TeamSize,
    (SELECT SUM(v.qty * v.rate) FROM #V v WHERE v.Line = p.Line AND v.freq = 'year') AS ValueYearly,
    (SELECT SUM(v.qty * v.rate) FROM #V v WHERE v.Line = p.Line AND v.freq = 'once') AS ValueOnce,
    (SELECT p.ProjectName AS name, p.TypeCode AS [type], p.ModelCode AS model, p.nDays AS days, p.nUsers AS users, p.Cx AS complexity,
            CAST(CASE WHEN p.nTeam > 0 THEN 1 ELSE 0 END AS bit) AS [need.man], p.NeedHw AS [need.hw],
            CAST(CASE WHEN p.nGpu > 0 OR (p.GpuId IS NOT NULL AND p.nGpu IS NULL) THEN 1 ELSE 0 END AS bit) AS [need.gpu],
            p.EnvCode AS [infra.env], p.ModeCode AS [infra.mode], p.nCpu AS [infra.cpu], p.nRam AS [infra.ram], p.nStorage AS [infra.storageTb],
            p.GpuId AS [infra.gpuId], p.nGpu AS [infra.gpuCount],
            p.DbId AS [lic.dbId], p.OsId AS [lic.osId],
            p.nYears AS [amc.years],
            p.Fy AS [reg.fy], p.KindCode AS [reg.kind], p.StatusCode AS [reg.status], ISNULL(p.Note, N'Imported from CSV') AS [reg.note],
            CONVERT(char(10), p.dStart, 23) AS [reg.start], CONVERT(char(10), p.dEnd, 23) AS [reg.end],
            p.Department AS [q.to], p.PreparedBy AS [q.prepared],
            JSON_QUERY(CASE WHEN p.nTeam > 0
                THEN (SELECT N'Team' AS role, ISNULL(p.LevelName, 'Mid') AS level, p.nTeam AS people, 100 AS alloc FOR JSON PATH)
                ELSE N'[]' END) AS team,
            JSON_QUERY(N'[]') AS other,
            JSON_QUERY(ISNULL((SELECT v.cat, v.[desc], v.qty, v.unit, v.rate, v.freq FROM #V v WHERE v.Line = p.Line ORDER BY v.Slot FOR JSON PATH), N'[]')) AS [value.items]
     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS EstimateJson,
    p.Fy, p.KindCode, p.ModelCode, p.StatusCode, p.TypeCode, p.Department, ISNULL(p.Note, N'Imported from CSV') AS Note, p.dStart, p.dEnd,
    (SELECT Workflow FROM dbo.SwProjectRegister r WHERE r.RegisterId = p.RegisterId) AS ExistingWorkflow,
    CAST(NULL AS nvarchar(40)) AS Result,
    CASE WHEN p.nTeam IS NULL THEN N'Team size is empty, so there is no manpower cost.' END AS Warning
INTO #Out FROM #Pc p;

UPDATE #Out SET Result = CASE WHEN ExistingWorkflow IS NULL THEN N'Add' WHEN ExistingWorkflow = 'verified' THEN N'Skip: already verified' ELSE N'Update (not verified yet)' END;

IF @CheckOnly = 1
BEGIN
    SELECT Line, ProjectName, RegisterId, Result, PersonDays, TeamSize, ValueYearly, ValueOnce, Warning FROM #Out ORDER BY Line;
    PRINT N'Check only: the file is fine and nothing was imported. Set @CheckOnly = 0 and run again to import.';
    RETURN;
END

/* ---------- 6. import ---------- */
BEGIN TRANSACTION;
    MERGE dbo.SwProjectRegister AS t
    USING (SELECT * FROM #Out WHERE Result <> N'Skip: already verified') AS s ON t.RegisterId = s.RegisterId
    WHEN MATCHED AND t.Workflow <> 'verified' THEN UPDATE SET
        EntryKey = s.EntryKey, FinYear = s.Fy, Kind = s.KindCode, DeliveryModel = s.ModelCode, Status = s.StatusCode, ProjectName = s.ProjectName,
        ProjectType = s.TypeCode, Department = s.Department, ValueINR = 0, ValueOriginalINR = NULL, BenchmarkValueINR = 0, ChargedINR = 0,
        OneTimeINR = NULL, BenchmarkOneTimeINR = NULL, YearlyRunINR = NULL, BenchmarkYearlyRunINR = NULL,
        PersonDays = s.PersonDays, TeamSize = s.TeamSize, ValueCreatedYearlyINR = ISNULL(s.ValueYearly, 0), ValueCreatedOneTimeINR = ISNULL(s.ValueOnce, 0),
        Note = s.Note, Workflow = 'pending', UpdatedAt = SYSUTCDATETIME(), VerifiedBy = NULL, VerifiedAt = NULL, CostedBy = NULL, EstimateJson = s.EstimateJson,
        StartDate = s.dStart, EndDate = s.dEnd
    WHEN NOT MATCHED THEN INSERT
        (RegisterId, EntryKey, FinYear, Kind, DeliveryModel, Status, ProjectName, ProjectType, Department, ValueINR, BenchmarkValueINR, ChargedINR,
         PersonDays, TeamSize, ValueCreatedYearlyINR, ValueCreatedOneTimeINR, Note, Workflow, SubmittedBy, CostedBy, EstimateJson, StartDate, EndDate)
    VALUES (s.RegisterId, s.EntryKey, s.Fy, s.KindCode, s.ModelCode, s.StatusCode, s.ProjectName, s.TypeCode, s.Department, 0, 0, 0,
         s.PersonDays, s.TeamSize, ISNULL(s.ValueYearly, 0), ISNULL(s.ValueOnce, 0), s.Note, 'pending', @SubmittedBy, NULL, s.EstimateJson, s.dStart, s.dEnd);

    INSERT dbo.SwProjectLog (RegisterId, Action, ActionBy, Comment)
    SELECT RegisterId, 'submit', @SubmittedBy, N'Imported from CSV' FROM #Out WHERE Result <> N'Skip: already verified';
COMMIT;

SELECT Line, ProjectName, RegisterId,
       CASE Result WHEN N'Add' THEN N'Added' WHEN N'Update (not verified yet)' THEN N'Updated' ELSE Result END AS Result, Warning
FROM #Out ORDER BY Line;
IF EXISTS (SELECT 1 FROM #Out WHERE Result <> N'Skip: already verified')
    PRINT N'Imported. The entries are on the Approval page, awaiting verification; an admin costs each one when reviewing it.';
ELSE
    PRINT N'Nothing imported: every project in the file is already verified.';
GO
SET NOEXEC OFF;
