/* ==================================================================
   Central Automation - Estimate and Quotation
   03. Seed data for the masters

   Run after 02_create_tables.sql. Safe to run again: it inserts only the
   rows that are missing and never overwrites values you have changed
   (on the Masters page or by hand).

   The values are the same assumed defaults the web page starts with.
   Replace them with your real rates on the Masters page.
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
GO

/* Rate levels */
MERGE dbo.SwRateLevel AS t
USING (VALUES ('Junior',1,3500,6000),('Mid',2,6000,10000),('Senior',3,9500,16000),('Lead',4,13000,22000),('Architect',5,18000,32000))
      AS s(LevelName,SortOrder,RateCA,RateBenchmark)
ON t.LevelName = s.LevelName
WHEN NOT MATCHED THEN INSERT (LevelName,SortOrder,RateCA,RateBenchmark) VALUES (s.LevelName,s.SortOrder,s.RateCA,s.RateBenchmark);
GO

/* Roles (only when the catalogue is empty, so roles you removed stay removed) */
IF NOT EXISTS (SELECT 1 FROM dbo.SwRole)
INSERT dbo.SwRole (RoleName,DefaultLevel,SortOrder)
VALUES (N'Project lead','Lead',1),(N'Solution architect','Architect',2),(N'Full-stack developer','Senior',3),(N'Full-stack developer','Mid',4),
       (N'UI / UX designer','Mid',5),(N'Tester / QA','Junior',6),(N'Database engineer','Senior',7),(N'AI / vision engineer','Senior',8),
       (N'DevOps / infrastructure engineer','Mid',9),(N'Security engineer','Senior',10);
GO

/* Hardware unit prices */
MERGE dbo.SwHwPrice AS t
USING (VALUES
    ('onprem','cpu',   8000, 9600),('onprem','ram',   1500, 1800),('onprem','hdd',  15000,18000),
    ('onprem','ssd',  55000,66000),('onprem','nvme', 80000,96000),('onprem','opsPct',10,15),
    ('cloud','cpu',    2500, 3000),('cloud','ram',     400,  480),('cloud','hdd',    4000, 4800),
    ('cloud','ssd',    9000,10800),('cloud','nvme',  14000,16800))
      AS s(Model,Item,ValueCA,ValueBenchmark)
ON t.Model = s.Model AND t.Item = s.Item
WHEN NOT MATCHED THEN INSERT (Model,Item,ValueCA,ValueBenchmark) VALUES (s.Model,s.Item,s.ValueCA,s.ValueBenchmark);
GO

/* Hardware factors */
MERGE dbo.SwHwFactor AS t
USING (VALUES
    ('env','prod',N'Production only',1.00),('env','uat',N'Production + UAT',1.50),('env','dr',N'Production + DR',2.00),('env','full',N'Production + UAT + DR',2.50),
    ('raid','none',N'No RAID',1.00),('raid','raid5',N'RAID 5',1.25),('raid','raid10',N'RAID 10',2.00))
      AS s(FactorType,Code,Name,Factor)
ON t.FactorType = s.FactorType AND t.Code = s.Code
WHEN NOT MATCHED THEN INSERT (FactorType,Code,Name,Factor) VALUES (s.FactorType,s.Code,s.Name,s.Factor);
GO

/* GPUs */
MERGE dbo.SwGpu AS t
USING (VALUES
    ('t4',     N'NVIDIA T4 16 GB',   150000, 180000,  30000,  36000, 1),
    ('l4',     N'NVIDIA L4 24 GB',   300000, 360000,  45000,  54000, 2),
    ('a4000',  N'RTX A4000 16 GB',   120000, 144000,  35000,  42000, 3),
    ('rtx4090',N'RTX 4090 24 GB',    220000, 264000,  50000,  60000, 4),
    ('a100',   N'NVIDIA A100 80 GB',1200000,1440000, 200000, 240000, 5))
      AS s(GpuId,GpuName,PriceCA,PriceBenchmark,MonthlyCA,MonthlyBenchmark,SortOrder)
ON t.GpuId = s.GpuId
WHEN NOT MATCHED THEN INSERT (GpuId,GpuName,PriceCA,PriceBenchmark,MonthlyCA,MonthlyBenchmark,SortOrder)
     VALUES (s.GpuId,s.GpuName,s.PriceCA,s.PriceBenchmark,s.MonthlyCA,s.MonthlyBenchmark,s.SortOrder);
GO

/* Software settings (and the client access licence price) */
MERGE dbo.SwSetting AS t
USING (VALUES
    ('complexity.low',   0.9,  NULL, NULL, 'x',             N'Complexity multiplier: low'),
    ('complexity.std',   1.0,  NULL, NULL, 'x',             N'Complexity multiplier: standard'),
    ('complexity.high',  1.25, NULL, NULL, 'x',             N'Complexity multiplier: high'),
    ('complexity.vhigh', 1.5,  NULL, NULL, 'x',             N'Complexity multiplier: very high'),
    ('benchEffort',      1.0,  NULL, NULL, 'x',             N'Benchmark effort factor on person-days'),
    ('load.cont',        10,   15,   NULL, '% of labour',   N'Contingency'),
    ('load.ovh',         8,    15,   NULL, '% of labour',   N'Overheads'),
    ('load.markup',      0,    20,   NULL, '% on dev cost', N'Mark-up / margin'),
    ('load.gst',         18,   NULL, NULL, '%',             N'GST rate'),
    ('load.gstOn',       0,    NULL, NULL, 'flag',          N'Add GST by default (1 = yes)'),
    ('amc.pct',          15,   20,   NULL, '% of dev cost', N'AMC rate per year'),
    ('amc.warranty',     3,    NULL, NULL, 'months',        N'Free warranty'),
    ('amc.esc',          5,    NULL, NULL, '% per year',    N'Yearly cost escalation'),
    ('amc.years',        3,    NULL, NULL, 'years',         N'Years of ownership'),
    ('amc.crDays',       10,   NULL, NULL, 'days per year', N'Change-request days'),
    ('amc.deployDays',   5,    NULL, NULL, 'days per year', N'Yearly deployment effort'),
    ('scope.screen',     3,    NULL, NULL, 'days',          N'Effort per screen / form'),
    ('scope.report',     2,    NULL, NULL, 'days',          N'Effort per report / dashboard'),
    ('scope.integ',      6,    NULL, NULL, 'days',          N'Effort per integration'),
    ('lic.calPerUser',   0,    0,    NULL, 'INR per user',  N'Client access licence per user'),
    ('quote.valid',      30,   NULL, NULL, 'days',          N'Quotation validity'),
    ('quote.from',       NULL, NULL, N'Central Automation',              NULL, N'Quotation: company name'),
    ('quote.fromAddr',   NULL, NULL, N'Hazira Plant, Surat, Gujarat',    NULL, N'Quotation: address'),
    ('quote.terms',      NULL, NULL,
        N'Prices are in Indian Rupees.' + CHAR(10) +
        N'Payment: 40% on order, 40% on UAT completion, 20% on go-live.' + CHAR(10) +
        N'Warranty covers defect fixes only. Enhancements are billed as change requests.' + CHAR(10) +
        N'Hardware and licence prices hold until order confirmation.' + CHAR(10) +
        N'Timeline starts after requirement sign-off.', NULL, N'Quotation: terms, one per line'))
      AS s(SettingKey,ValueCA,ValueBenchmark,TextValue,Unit,Description)
ON t.SettingKey = s.SettingKey
WHEN NOT MATCHED THEN INSERT (SettingKey,ValueCA,ValueBenchmark,TextValue,Unit,Description)
     VALUES (s.SettingKey,s.ValueCA,s.ValueBenchmark,s.TextValue,s.Unit,s.Description);
GO

/* Database engines */
MERGE dbo.SwDbEngine AS t
USING (VALUES
    ('open',   N'Open-source (PostgreSQL / MySQL)',      0,      0, 0,  0, 1),
    ('express',N'SQL Server Express (free)',             0,      0, 0,  0, 2),
    ('sqlstd', N'SQL Server Standard',               82000,  94300, 4, 25, 3),
    ('sqlent', N'SQL Server Enterprise',            315000, 362250, 4, 25, 4),
    ('oracle', N'Oracle Standard Edition 2',        350000, 402500, 4, 22, 5))
      AS s(DbId,DbName,PriceCA,PriceBenchmark,MinCores,SupportPct,SortOrder)
ON t.DbId = s.DbId
WHEN NOT MATCHED THEN INSERT (DbId,DbName,PriceCA,PriceBenchmark,MinCores,SupportPct,SortOrder)
     VALUES (s.DbId,s.DbName,s.PriceCA,s.PriceBenchmark,s.MinCores,s.SupportPct,s.SortOrder);
GO

/* Operating systems */
MERGE dbo.SwOsOption AS t
USING (VALUES ('linux',N'Linux (no licence)',0,0,1),('win',N'Windows Server',65000,74750,2)) AS s(OsId,OsName,PriceCA,PriceBenchmark,SortOrder)
ON t.OsId = s.OsId
WHEN NOT MATCHED THEN INSERT (OsId,OsName,PriceCA,PriceBenchmark,SortOrder) VALUES (s.OsId,s.OsName,s.PriceCA,s.PriceBenchmark,s.SortOrder);
GO

/* Catalogue of other licences and services */
MERGE dbo.SwCatalogItem AS t
USING (VALUES
    ('ui',   N'Third-party UI / report components','lic','once', 50000,  60000, 1),
    ('ssl',  N'SSL certificate',                   'lic','year',  8000,   9600, 2),
    ('vapt', N'VAPT security audit',               'svc','once',150000, 225000, 3),
    ('train',N'User training',                     'svc','once', 50000,  75000, 4))
      AS s(ItemId,ItemName,Category,Billing,CostCA,CostBenchmark,SortOrder)
ON t.ItemId = s.ItemId
WHEN NOT MATCHED THEN INSERT (ItemId,ItemName,Category,Billing,CostCA,CostBenchmark,SortOrder)
     VALUES (s.ItemId,s.ItemName,s.Category,s.Billing,s.CostCA,s.CostBenchmark,s.SortOrder);
GO

/* Value creation categories (only when the list is empty, so categories you removed stay removed).
   Rates are assumed defaults: set your plant's own values on the Masters page. */
IF NOT EXISTS (SELECT 1 FROM dbo.SwValueCategory)
INSERT dbo.SwValueCategory (CategoryId, CategoryName, Unit, DefaultRate, SortOrder)
VALUES ('manhours', N'Man-hours saved',                      N'hours',  500,   1),
       ('downtime', N'Downtime avoided',                     N'hours',  50000, 2),
       ('energy',   N'Energy saved',                         N'kWh',    8,     3),
       ('quality',  N'Quality / yield improvement',          N'INR',    1,     4),
       ('material', N'Material and consumables saved',       N'INR',    1,     5),
       ('through',  N'Productivity / throughput gain',       N'INR',    1,     6),
       ('safety',   N'Safety and compliance risk avoided',   N'INR',    1,     7),
       ('other',    N'Other benefit',                        N'INR',    1,     8);
GO

/* Admins: the site has one shared password and everyone who signs in is an admin, so there is nobody to set up here.
   People are added to dbo.SwAppUser automatically under the name they type at the login page. */
SET NOEXEC OFF;
