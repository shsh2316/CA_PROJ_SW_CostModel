/* ==================================================================
   Central Automation - Estimate and Quotation
   06. First admins and a check that everything is in place

   Run after 01, 02 and 03. Safe to run again.
   1. Fill in the admin list below (at least two people: a verification
      needs an admin other than the person who submitted the entry).
   2. Run the whole script. The last result sets are the checks.
   ================================================================== */

USE CentralAutomationEstimator;   -- change if you used another name in script 01
GO
SET NOCOUNT ON;
GO

/* 1. Admins. UserLogin is DOMAIN\username exactly as Windows reports it. */
DECLARE @Admins TABLE (UserLogin NVARCHAR(200) NOT NULL, DisplayName NVARCHAR(200) NOT NULL);
INSERT @Admins (UserLogin, DisplayName) VALUES
    (N'DOMAIN\admin1', N'First Admin'),
    (N'DOMAIN\admin2', N'Second Admin');

MERGE dbo.SwAppUser AS t
USING @Admins AS s ON t.UserLogin = s.UserLogin
WHEN MATCHED THEN UPDATE SET IsAdmin = 1, DisplayName = s.DisplayName
WHEN NOT MATCHED THEN INSERT (UserLogin, DisplayName, IsAdmin) VALUES (s.UserLogin, s.DisplayName, 1);
GO

/* 2. Checks */

-- a. Who is an admin (expect at least two rows)
SELECT UserLogin, DisplayName, IsAdmin, FirstSeenAt, LastSeenAt FROM dbo.SwAppUser ORDER BY IsAdmin DESC, UserLogin;

-- b. Masters are loaded (expect 5 levels, 8 value categories, rows in the others)
SELECT 'SwRateLevel' AS TableName, COUNT(*) AS NumRows FROM dbo.SwRateLevel
UNION ALL SELECT 'SwRole',          COUNT(*) FROM dbo.SwRole
UNION ALL SELECT 'SwHwPrice',       COUNT(*) FROM dbo.SwHwPrice
UNION ALL SELECT 'SwHwFactor',      COUNT(*) FROM dbo.SwHwFactor
UNION ALL SELECT 'SwGpu',           COUNT(*) FROM dbo.SwGpu
UNION ALL SELECT 'SwDbEngine',      COUNT(*) FROM dbo.SwDbEngine
UNION ALL SELECT 'SwOsOption',      COUNT(*) FROM dbo.SwOsOption
UNION ALL SELECT 'SwCatalogItem',   COUNT(*) FROM dbo.SwCatalogItem
UNION ALL SELECT 'SwValueCategory', COUNT(*) FROM dbo.SwValueCategory
UNION ALL SELECT 'SwSetting',       COUNT(*) FROM dbo.SwSetting;

-- c. The application pool account can read and write (expect db_datareader and db_datawriter)
SELECT m.name AS DatabaseUser, r.name AS RoleName
FROM sys.database_role_members rm
JOIN sys.database_principals r ON r.principal_id = rm.role_principal_id
JOIN sys.database_principals m ON m.principal_id = rm.member_principal_id
WHERE r.name IN (N'db_datareader', N'db_datawriter') AND m.name NOT IN (N'dbo')
ORDER BY m.name, r.name;

-- d. The register (empty on a new install)
SELECT Workflow, COUNT(*) AS Entries FROM dbo.SwProjectRegister GROUP BY Workflow;
GO
