/* ==================================================================
   Central Automation - Estimate and Quotation
   02. Tables, indexes and views

   Run after 01_create_database_and_login.sql. Safe to run again: each
   table is only created if it is missing, and nothing is dropped.
   Needs SQL Server 2016 SP1 or later.

   Every price has two columns:
     ...CA         = cost to Central Automation to develop and deploy in-house
     ...Benchmark  = what a software development company would charge

   Contents
     1. Master tables   : rate levels, roles, hardware prices and factors,
                          GPUs, settings, database engines, OS options,
                          catalogue of other licences and services,
                          value creation categories
     2. Users           : dbo.SwAppUser (display names, who is an admin)
     3. Project register: dbo.SwProjectRegister + dbo.SwProjectLog
     4. Audit           : dbo.SwMasterAudit (one row per master save)
     5. Views           : yearly summary, rate card

   Upgrading from the earlier single script
   (sql/CentralAutomation_Estimator_Schema.sql): that version created a
   different dbo.SwProjectRegister, filled only by CSV import. Drop it and
   dbo.SwProjectRegister_Stage before running this script, then re-import
   the CSV with 04_import_legacy_register_csv.sql.
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

/* ------------------------------------------------------------------
   1. MASTER TABLES
   ------------------------------------------------------------------ */

/* 1a. Manpower: cost per person-day by level */
IF OBJECT_ID('dbo.SwRateLevel') IS NULL
CREATE TABLE dbo.SwRateLevel
(
    LevelName       VARCHAR(20)   NOT NULL CONSTRAINT PK_SwRateLevel PRIMARY KEY,   -- Junior, Mid, Senior, Lead, Architect
    SortOrder       TINYINT       NOT NULL,
    RateCA          DECIMAL(12,2) NOT NULL,   -- INR per person-day, in-house loaded cost
    RateBenchmark   DECIMAL(12,2) NOT NULL    -- INR per person-day, software company billing rate
);
GO

/* 1b. Manpower: role catalogue (suggested in the team table) */
IF OBJECT_ID('dbo.SwRole') IS NULL
CREATE TABLE dbo.SwRole
(
    RoleId          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SwRole PRIMARY KEY,
    RoleName        NVARCHAR(100) NOT NULL,
    DefaultLevel    VARCHAR(20)   NOT NULL CONSTRAINT FK_SwRole_Level REFERENCES dbo.SwRateLevel(LevelName),
    SortOrder       INT           NOT NULL CONSTRAINT DF_SwRole_Sort DEFAULT 0,
    CONSTRAINT UQ_SwRole UNIQUE (RoleName, DefaultLevel)
);
GO

/* 1c. Hardware: unit prices. Model = onprem (buy, INR per unit) or cloud (rent, INR per month).
       Item: cpu (per core), ram (per GB), hdd / ssd / nvme (per TB), opsPct (yearly support and running cost, % of hardware; onprem only) */
IF OBJECT_ID('dbo.SwHwPrice') IS NULL
CREATE TABLE dbo.SwHwPrice
(
    Model           VARCHAR(10)   NOT NULL,
    Item            VARCHAR(10)   NOT NULL,
    ValueCA         DECIMAL(12,2) NOT NULL,
    ValueBenchmark  DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_SwHwPrice PRIMARY KEY (Model, Item),
    CONSTRAINT CK_SwHwPrice_Model CHECK (Model IN ('onprem','cloud')),
    CONSTRAINT CK_SwHwPrice_Item  CHECK (Item  IN ('cpu','ram','hdd','ssd','nvme','opsPct'))
);
GO

/* 1d. Hardware: sizing factors (same for both bases) */
IF OBJECT_ID('dbo.SwHwFactor') IS NULL
CREATE TABLE dbo.SwHwFactor
(
    FactorType      VARCHAR(10)   NOT NULL,   -- env | raid
    Code            VARCHAR(10)   NOT NULL,   -- env: prod, uat, dr, full   raid: none, raid5, raid10
    Name            NVARCHAR(60)  NOT NULL,
    Factor          DECIMAL(6,2)  NOT NULL,
    CONSTRAINT PK_SwHwFactor PRIMARY KEY (FactorType, Code),
    CONSTRAINT CK_SwHwFactor_Type CHECK (FactorType IN ('env','raid'))
);
GO

/* 1e. GPU catalogue */
IF OBJECT_ID('dbo.SwGpu') IS NULL
CREATE TABLE dbo.SwGpu
(
    GpuId              VARCHAR(20)   NOT NULL CONSTRAINT PK_SwGpu PRIMARY KEY,
    GpuName            NVARCHAR(100) NOT NULL,
    PriceCA            DECIMAL(14,2) NOT NULL,   -- buy, INR each
    PriceBenchmark     DECIMAL(14,2) NOT NULL,
    MonthlyCA          DECIMAL(14,2) NOT NULL,   -- cloud rent, INR per month
    MonthlyBenchmark   DECIMAL(14,2) NOT NULL,
    SortOrder          INT           NOT NULL CONSTRAINT DF_SwGpu_Sort DEFAULT 0,
    IsActive           BIT           NOT NULL CONSTRAINT DF_SwGpu_Active DEFAULT 1
);
GO

/* 1f. Software settings: complexity, loadings, GST, AMC, scope effort, quotation defaults,
       client access licence. ValueBenchmark is NULL where one value applies to both bases. */
IF OBJECT_ID('dbo.SwSetting') IS NULL
CREATE TABLE dbo.SwSetting
(
    SettingKey      VARCHAR(40)   NOT NULL CONSTRAINT PK_SwSetting PRIMARY KEY,
    ValueCA         DECIMAL(12,2) NULL,
    ValueBenchmark  DECIMAL(12,2) NULL,
    TextValue       NVARCHAR(MAX) NULL,
    Unit            VARCHAR(30)   NULL,
    Description     NVARCHAR(200) NULL
);
GO

/* 1g. Licences: database engines */
IF OBJECT_ID('dbo.SwDbEngine') IS NULL
CREATE TABLE dbo.SwDbEngine
(
    DbId            VARCHAR(20)   NOT NULL CONSTRAINT PK_SwDbEngine PRIMARY KEY,
    DbName          NVARCHAR(100) NOT NULL,
    PriceCA         DECIMAL(14,2) NOT NULL,   -- INR per core
    PriceBenchmark  DECIMAL(14,2) NOT NULL,
    MinCores        INT           NOT NULL CONSTRAINT DF_SwDb_Min DEFAULT 0,
    SupportPct      DECIMAL(5,2)  NOT NULL CONSTRAINT DF_SwDb_Sup DEFAULT 0,   -- % of licence per year
    SortOrder       INT           NOT NULL CONSTRAINT DF_SwDb_Sort DEFAULT 0,
    IsActive        BIT           NOT NULL CONSTRAINT DF_SwDb_Active DEFAULT 1
);
GO

/* 1h. Licences: operating systems */
IF OBJECT_ID('dbo.SwOsOption') IS NULL
CREATE TABLE dbo.SwOsOption
(
    OsId            VARCHAR(20)   NOT NULL CONSTRAINT PK_SwOsOption PRIMARY KEY,
    OsName          NVARCHAR(100) NOT NULL,
    PriceCA         DECIMAL(14,2) NOT NULL,   -- INR per server
    PriceBenchmark  DECIMAL(14,2) NOT NULL,
    SortOrder       INT           NOT NULL CONSTRAINT DF_SwOs_Sort DEFAULT 0,
    IsActive        BIT           NOT NULL CONSTRAINT DF_SwOs_Active DEFAULT 1
);
GO

/* 1i. Licences: catalogue of other licences and services */
IF OBJECT_ID('dbo.SwCatalogItem') IS NULL
CREATE TABLE dbo.SwCatalogItem
(
    ItemId          VARCHAR(20)   NOT NULL CONSTRAINT PK_SwCatalogItem PRIMARY KEY,
    ItemName        NVARCHAR(150) NOT NULL,
    Category        VARCHAR(3)    NOT NULL,   -- lic = software / licence, svc = service / other
    Billing         VARCHAR(4)    NOT NULL,   -- once | year
    CostCA          DECIMAL(14,2) NOT NULL,
    CostBenchmark   DECIMAL(14,2) NOT NULL,
    SortOrder       INT           NOT NULL CONSTRAINT DF_SwCat_Sort DEFAULT 0,
    IsActive        BIT           NOT NULL CONSTRAINT DF_SwCat_Active DEFAULT 1,
    CONSTRAINT CK_SwCat_Category CHECK (Category IN ('lic','svc')),
    CONSTRAINT CK_SwCat_Billing  CHECK (Billing  IN ('once','year'))
);
GO

/* 1j. Value creation: categories of benefit a project brings, with a default unit and
       a default value per unit (INR). Example: man-hours saved, hours, 500 per hour. */
IF OBJECT_ID('dbo.SwValueCategory') IS NULL
CREATE TABLE dbo.SwValueCategory
(
    CategoryId      VARCHAR(20)   NOT NULL CONSTRAINT PK_SwValueCategory PRIMARY KEY,
    CategoryName    NVARCHAR(100) NOT NULL,
    Unit            NVARCHAR(30)  NOT NULL,
    DefaultRate     DECIMAL(14,2) NOT NULL,   -- INR per unit
    SortOrder       INT           NOT NULL CONSTRAINT DF_SwValueCategory_Sort DEFAULT 0,
    IsActive        BIT           NOT NULL CONSTRAINT DF_SwValueCategory_Active DEFAULT 1
);
GO

/* ------------------------------------------------------------------
   2. USERS
      People sign in with Windows authentication. Each person is added
      here automatically the first time they open the page.

      Admins see cost estimates, rates, masters and quotations, upload
      Excel workbooks, and verify entries. Everyone else can register
      projects and value creation and follow their own entries, but sees
      no costs.
        UPDATE dbo.SwAppUser SET IsAdmin = 1 WHERE UserLogin = N'DOMAIN\username';
      DisplayName is what other people see in the approval log; change it freely.
   ------------------------------------------------------------------ */
IF OBJECT_ID('dbo.SwAppUser') IS NULL
CREATE TABLE dbo.SwAppUser
(
    UserLogin       NVARCHAR(200) NOT NULL CONSTRAINT PK_SwAppUser PRIMARY KEY,   -- DOMAIN\username
    DisplayName     NVARCHAR(200) NOT NULL,
    IsAdmin         BIT           NOT NULL CONSTRAINT DF_SwAppUser_Admin DEFAULT 0,
    FirstSeenAt     DATETIME2(0)  NOT NULL CONSTRAINT DF_SwAppUser_First DEFAULT SYSUTCDATETIME(),
    LastSeenAt      DATETIME2(0)  NOT NULL CONSTRAINT DF_SwAppUser_Last  DEFAULT SYSUTCDATETIME()
);
GO
/* Upgrade: the first IIS version called this column IsMasterEditor */
IF COL_LENGTH('dbo.SwAppUser', 'IsAdmin') IS NULL AND COL_LENGTH('dbo.SwAppUser', 'IsMasterEditor') IS NOT NULL
    EXEC sp_rename 'dbo.SwAppUser.IsMasterEditor', 'IsAdmin', 'COLUMN';
GO

/* ------------------------------------------------------------------
   3. PROJECT REGISTER
      One row per submitted estimate (project + financial year + record type
      + submitter). Workflow: pending -> verified, or pending -> info (sent
      back) -> pending ... One verification by a different admin makes it final.
      Entries from people who are not admins arrive without costs
      (CostedBy is NULL); the admin's review works out the cost with the
      current masters and records it on verification.
      All times are UTC.
   ------------------------------------------------------------------ */
IF OBJECT_ID('dbo.SwProjectRegister') IS NULL
CREATE TABLE dbo.SwProjectRegister
(
    RegisterId            NVARCHAR(200)  NOT NULL CONSTRAINT PK_SwProjectRegister PRIMARY KEY,
    EntryKey              NVARCHAR(100)  NOT NULL,          -- project-slug_FY_kind, same for every submitter
    FinYear               VARCHAR(9)     NOT NULL,          -- e.g. 2026-27 (April to March)
    Kind                  VARCHAR(10)    NOT NULL,          -- new | amc | enh
    DeliveryModel         VARCHAR(10)    NULL,              -- once | yearly
    Status                VARCHAR(10)    NOT NULL,          -- planned | progress | completed
    ProjectName           NVARCHAR(200)  NOT NULL,
    ProjectType           VARCHAR(20)    NULL,              -- web | desktop | mobile | interface | dash | ai
    Department            NVARCHAR(200)  NULL,
    ValueINR              DECIMAL(18,2)  NOT NULL,          -- Central Automation cost counted for that year
    ValueOriginalINR      DECIMAL(18,2)  NULL,              -- submitted value, when the verifier adjusted it
    BenchmarkValueINR     DECIMAL(18,2)  NOT NULL,          -- benchmark (software company) cost for that year
    ChargedINR            DECIMAL(18,2)  NOT NULL CONSTRAINT DF_SwReg_Charged DEFAULT 0,
    OneTimeINR            DECIMAL(18,2)  NULL,
    BenchmarkOneTimeINR   DECIMAL(18,2)  NULL,
    YearlyRunINR          DECIMAL(18,2)  NULL,
    BenchmarkYearlyRunINR DECIMAL(18,2)  NULL,
    PersonDays            DECIMAL(12,1)  NULL,
    TeamSize              INT            NULL,
    ValueCreatedYearlyINR DECIMAL(18,2)  NULL,              -- value creation: benefit per year
    ValueCreatedOneTimeINR DECIMAL(18,2) NULL,              -- value creation: one-time benefit
    Note                  NVARCHAR(500)  NULL,
    Workflow              VARCHAR(10)    NOT NULL CONSTRAINT DF_SwReg_Workflow DEFAULT 'pending',
    SubmittedBy           NVARCHAR(200)  NULL,              -- DOMAIN\username
    SubmittedAt           DATETIME2(0)   NOT NULL CONSTRAINT DF_SwReg_SubmittedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt             DATETIME2(0)   NOT NULL CONSTRAINT DF_SwReg_UpdatedAt DEFAULT SYSUTCDATETIME(),
    VerifiedBy            NVARCHAR(200)  NULL,
    VerifiedAt            DATETIME2(0)   NULL,
    CostedBy              NVARCHAR(200)  NULL,              -- admin whose rates priced the entry; NULL = not costed yet
    EstimateJson          NVARCHAR(MAX)  NULL,              -- full estimate with the rates it was made with
    StartDate             DATE           NULL,              -- project start (dashboard date filter)
    EndDate               DATE           NULL,              -- project end; NULL = still running or not known
    CONSTRAINT CK_SwReg_Kind     CHECK (Kind IN ('new','amc','enh')),
    CONSTRAINT CK_SwReg_Model    CHECK (DeliveryModel IS NULL OR DeliveryModel IN ('once','yearly')),
    CONSTRAINT CK_SwReg_Status   CHECK (Status IN ('planned','progress','completed')),
    CONSTRAINT CK_SwReg_Workflow CHECK (Workflow IN ('pending','info','verified'))
);
GO
/* Upgrade of a database made before project dates existed (safe to run again) */
IF COL_LENGTH('dbo.SwProjectRegister', 'StartDate') IS NULL ALTER TABLE dbo.SwProjectRegister ADD StartDate DATE NULL;
IF COL_LENGTH('dbo.SwProjectRegister', 'EndDate') IS NULL ALTER TABLE dbo.SwProjectRegister ADD EndDate DATE NULL;
GO
/* The page filters the register by who submitted the entry */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SwProjectRegister_SubmittedBy' AND object_id = OBJECT_ID('dbo.SwProjectRegister'))
    CREATE INDEX IX_SwProjectRegister_SubmittedBy ON dbo.SwProjectRegister (SubmittedBy) INCLUDE (Workflow);
GO
/* Upgrade: columns added after the first IIS version */
IF COL_LENGTH('dbo.SwProjectRegister', 'CostedBy') IS NULL
BEGIN
    ALTER TABLE dbo.SwProjectRegister ADD CostedBy NVARCHAR(200) NULL;
    EXEC (N'UPDATE dbo.SwProjectRegister SET CostedBy = ISNULL(VerifiedBy, SubmittedBy);');   -- earlier entries were all costed
END
IF COL_LENGTH('dbo.SwProjectRegister', 'ValueCreatedYearlyINR') IS NULL
    ALTER TABLE dbo.SwProjectRegister ADD ValueCreatedYearlyINR DECIMAL(18,2) NULL, ValueCreatedOneTimeINR DECIMAL(18,2) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SwProjectRegister_FinYear' AND object_id = OBJECT_ID('dbo.SwProjectRegister'))
    CREATE INDEX IX_SwProjectRegister_FinYear ON dbo.SwProjectRegister (FinYear, Kind) INCLUDE (Workflow, ValueINR, BenchmarkValueINR, ChargedINR);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SwProjectRegister_EntryKey' AND object_id = OBJECT_ID('dbo.SwProjectRegister'))
    CREATE INDEX IX_SwProjectRegister_EntryKey ON dbo.SwProjectRegister (EntryKey);
GO

/* Approval history: submit, reply, info (sent back), verify, recalc (recalculated with the current masters) */
IF OBJECT_ID('dbo.SwProjectLog') IS NULL
CREATE TABLE dbo.SwProjectLog
(
    LogId           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SwProjectLog PRIMARY KEY,
    RegisterId      NVARCHAR(200)  NOT NULL CONSTRAINT FK_SwProjectLog_Register REFERENCES dbo.SwProjectRegister(RegisterId) ON DELETE CASCADE,
    Action          VARCHAR(10)    NOT NULL,
    ActionBy        NVARCHAR(200)  NULL,
    ActionAt        DATETIME2(0)   NOT NULL CONSTRAINT DF_SwProjectLog_At DEFAULT SYSUTCDATETIME(),
    Comment         NVARCHAR(2000) NULL,
    CONSTRAINT CK_SwProjectLog_Action CHECK (Action IN ('submit','reply','info','verify','recalc'))
);
GO
/* Upgrade of a database made before "recalc" existed: widen the check (safe to run again; nothing happens when it is already wide enough) */
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_SwProjectLog_Action' AND parent_object_id = OBJECT_ID('dbo.SwProjectLog') AND definition NOT LIKE '%recalc%')
BEGIN
    ALTER TABLE dbo.SwProjectLog DROP CONSTRAINT CK_SwProjectLog_Action;
    ALTER TABLE dbo.SwProjectLog ADD CONSTRAINT CK_SwProjectLog_Action CHECK (Action IN ('submit','reply','info','verify','recalc'));
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SwProjectLog_Register' AND object_id = OBJECT_ID('dbo.SwProjectLog'))
    CREATE INDEX IX_SwProjectLog_Register ON dbo.SwProjectLog (RegisterId, LogId);
GO

/* ------------------------------------------------------------------
   4. AUDIT: a copy of each master as saved from the Masters page
   ------------------------------------------------------------------ */
IF OBJECT_ID('dbo.SwMasterAudit') IS NULL
CREATE TABLE dbo.SwMasterAudit
(
    AuditId         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SwMasterAudit PRIMARY KEY,
    MasterKey       VARCHAR(10)    NOT NULL,          -- man | hw | sw | lic | val
    SavedBy         NVARCHAR(200)  NOT NULL,
    SavedAt         DATETIME2(0)   NOT NULL CONSTRAINT DF_SwMasterAudit_At DEFAULT SYSUTCDATETIME(),
    MasterJson      NVARCHAR(MAX)  NOT NULL
);
GO

/* ------------------------------------------------------------------
   5. VIEWS
   ------------------------------------------------------------------ */

/* Year-by-year summary: same figures as the Approval page (verified entries only) */
CREATE OR ALTER VIEW dbo.vw_SwYearlySummary AS
SELECT  FinYear,
        SUM(CASE WHEN Kind = 'new' THEN 1 ELSE 0 END)   AS NewProjects,
        SUM(BenchmarkValueINR)                          AS BenchmarkValue,
        SUM(ValueINR)                                   AS CentralAutomationCost,
        SUM(BenchmarkValueINR) - SUM(ValueINR)          AS SavingVsBenchmark,
        SUM(ChargedINR)                                 AS ChargedToDepartments,
        SUM(ISNULL(PersonDays, 0))                      AS PersonDays,
        SUM(ISNULL(ValueCreatedYearlyINR, 0))           AS ValueCreatedPerYear,
        SUM(ISNULL(ValueCreatedOneTimeINR, 0))          AS ValueCreatedOneTime
FROM dbo.SwProjectRegister
WHERE Workflow = 'verified'
GROUP BY FinYear;
GO

/* Rate card: manpower rates side by side */
CREATE OR ALTER VIEW dbo.vw_SwRateCard AS
SELECT  LevelName, SortOrder, RateCA, RateBenchmark, RateBenchmark - RateCA AS Difference
FROM dbo.SwRateLevel;
GO

/* Quick checks
   SELECT * FROM dbo.vw_SwRateCard ORDER BY SortOrder;
   SELECT * FROM dbo.vw_SwYearlySummary ORDER BY FinYear DESC;
   SELECT RegisterId, ProjectName, FinYear, Kind, Workflow, ValueINR FROM dbo.SwProjectRegister ORDER BY UpdatedAt DESC;
*/
SET NOEXEC OFF;
