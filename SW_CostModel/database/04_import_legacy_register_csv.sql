/* ==================================================================
   Central Automation - Estimate and Quotation
   04. OPTIONAL: import a register CSV exported from the earlier
       claude.ai version of the page ("Export verified (CSV for SQL Server)").

   Only needed once, to bring old verified entries into SQL Server.
   The IIS version writes straight to dbo.SwProjectRegister, so you do not
   need this for normal use.

   Imported rows are marked verified. They have no saved estimate, so they
   count in the totals but cannot be opened for print or copied.

   1. Copy the CSV to a folder the SQL Server service account can read
      (a local path on the SQL Server machine, or a UNC share).
   2. Change the file path below.
   3. Run the whole script. Needs SQL Server 2017 or later (FORMAT = 'CSV').
   ================================================================== */

USE CentralAutomationEstimator;   -- change if you used another name in script 01
GO
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#Stage') IS NOT NULL DROP TABLE #Stage;
CREATE TABLE #Stage
(
    RegisterId NVARCHAR(200), FinYear NVARCHAR(20), Kind NVARCHAR(20), DeliveryModel NVARCHAR(20), Status NVARCHAR(20),
    ProjectName NVARCHAR(200), ProjectType NVARCHAR(40), Department NVARCHAR(200),
    ValueINR NVARCHAR(40), BenchmarkValueINR NVARCHAR(40), ChargedINR NVARCHAR(40),
    OneTimeINR NVARCHAR(40), BenchmarkOneTimeINR NVARCHAR(40), YearlyRunINR NVARCHAR(40), BenchmarkYearlyRunINR NVARCHAR(40),
    PersonDays NVARCHAR(40), TeamSize NVARCHAR(40), Note NVARCHAR(500),
    SubmittedBy NVARCHAR(200), VerifiedBy NVARCHAR(200), VerifiedAt NVARCHAR(40)
);

BULK INSERT #Stage
FROM 'D:\Imports\project-register.csv'          -- <<< change this path
WITH (FORMAT = 'CSV', FIRSTROW = 2, FIELDQUOTE = '"', CODEPAGE = '65001', ROWTERMINATOR = '0x0d0a', TABLOCK);

MERGE dbo.SwProjectRegister AS t
USING (
    SELECT  LEFT(RegisterId, 200) AS RegisterId,
            LEFT(CONCAT(ProjectName, '_', FinYear, '_', Kind), 100) AS EntryKey,
            FinYear, Kind, NULLIF(DeliveryModel,'') DeliveryModel, Status, ProjectName,
            NULLIF(ProjectType,'') ProjectType, NULLIF(Department,'') Department,
            TRY_CONVERT(DECIMAL(18,2), ValueINR)              ValueINR,
            ISNULL(TRY_CONVERT(DECIMAL(18,2), BenchmarkValueINR), TRY_CONVERT(DECIMAL(18,2), ValueINR)) BenchmarkValueINR,
            ISNULL(TRY_CONVERT(DECIMAL(18,2), ChargedINR), 0) ChargedINR,
            TRY_CONVERT(DECIMAL(18,2), OneTimeINR)            OneTimeINR,
            TRY_CONVERT(DECIMAL(18,2), BenchmarkOneTimeINR)   BenchmarkOneTimeINR,
            TRY_CONVERT(DECIMAL(18,2), YearlyRunINR)          YearlyRunINR,
            TRY_CONVERT(DECIMAL(18,2), BenchmarkYearlyRunINR) BenchmarkYearlyRunINR,
            TRY_CONVERT(DECIMAL(12,1), PersonDays)            PersonDays,
            TRY_CONVERT(INT, TeamSize)                        TeamSize,
            NULLIF(Note,'') Note, NULLIF(SubmittedBy,'') SubmittedBy, NULLIF(VerifiedBy,'') VerifiedBy,
            ISNULL(TRY_CONVERT(DATETIME2(0), REPLACE(REPLACE(VerifiedAt,'T',' '),'Z','')), SYSUTCDATETIME()) VerifiedAt
    FROM #Stage
    WHERE RegisterId <> '' AND TRY_CONVERT(DECIMAL(18,2), ValueINR) IS NOT NULL
) AS s ON t.RegisterId = s.RegisterId
WHEN MATCHED AND t.EstimateJson IS NULL THEN UPDATE SET
     t.FinYear = s.FinYear, t.Kind = s.Kind, t.DeliveryModel = s.DeliveryModel, t.Status = s.Status,
     t.ProjectName = s.ProjectName, t.ProjectType = s.ProjectType, t.Department = s.Department,
     t.ValueINR = s.ValueINR, t.BenchmarkValueINR = s.BenchmarkValueINR, t.ChargedINR = s.ChargedINR,
     t.OneTimeINR = s.OneTimeINR, t.BenchmarkOneTimeINR = s.BenchmarkOneTimeINR,
     t.YearlyRunINR = s.YearlyRunINR, t.BenchmarkYearlyRunINR = s.BenchmarkYearlyRunINR,
     t.PersonDays = s.PersonDays, t.TeamSize = s.TeamSize, t.Note = s.Note,
     t.SubmittedBy = s.SubmittedBy, t.VerifiedBy = s.VerifiedBy, t.VerifiedAt = s.VerifiedAt, t.UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED BY TARGET THEN INSERT
     (RegisterId, EntryKey, FinYear, Kind, DeliveryModel, Status, ProjectName, ProjectType, Department,
      ValueINR, BenchmarkValueINR, ChargedINR, OneTimeINR, BenchmarkOneTimeINR, YearlyRunINR, BenchmarkYearlyRunINR,
      PersonDays, TeamSize, Note, Workflow, SubmittedBy, SubmittedAt, VerifiedBy, VerifiedAt)
VALUES (s.RegisterId, s.EntryKey, s.FinYear, s.Kind, s.DeliveryModel, s.Status, s.ProjectName, s.ProjectType, s.Department,
        s.ValueINR, s.BenchmarkValueINR, s.ChargedINR, s.OneTimeINR, s.BenchmarkOneTimeINR, s.YearlyRunINR, s.BenchmarkYearlyRunINR,
        s.PersonDays, s.TeamSize, s.Note, 'verified', s.SubmittedBy, s.VerifiedAt, s.VerifiedBy, s.VerifiedAt);

SELECT @@ROWCOUNT AS RowsInsertedOrUpdated;
DROP TABLE #Stage;
GO
