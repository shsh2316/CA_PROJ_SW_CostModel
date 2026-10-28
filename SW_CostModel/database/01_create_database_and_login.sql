/* ==================================================================
   Central Automation - Estimate and Quotation
   01. Database, login and permissions for the IIS application pool

   Run once as a sysadmin (SSMS, normal query mode). Safe to run again.
   Needs SQL Server 2016 SP1 or later.

   Before running, set the two values below:
     @DbName    the database name. If you change it, change it in
                02_create_tables.sql, 03_seed_master_data.sql and in
                the CCCConString entry in web\web.config too.
     @AppLogin  the Windows account the IIS site runs as:
                - SQL Server on the same machine as IIS:
                    IIS APPPOOL\<application pool name>
                    e.g. IIS APPPOOL\CentralAutomationEstimator
                - SQL Server on another machine: the web server's computer
                  account, DOMAIN\WEBSERVERNAME$ , or a domain service
                  account that you set as the application pool identity.
                Leave it empty to skip the login (for example when you use
                a SQL Server login in the connection string instead).
   ================================================================== */
SET NOCOUNT ON;

DECLARE @DbName   sysname = N'CentralAutomationEstimator';
DECLARE @AppLogin sysname = N'IIS APPPOOL\CentralAutomationEstimator';

DECLARE @sql nvarchar(max);

IF DB_ID(@DbName) IS NULL
BEGIN
    SET @sql = N'CREATE DATABASE ' + QUOTENAME(@DbName) + N';';
    EXEC (@sql);
    PRINT 'Created database ' + @DbName;
END

IF @AppLogin <> N''
BEGIN
    IF SUSER_ID(@AppLogin) IS NULL
    BEGIN
        SET @sql = N'CREATE LOGIN ' + QUOTENAME(@AppLogin) + N' FROM WINDOWS WITH DEFAULT_DATABASE = ' + QUOTENAME(@DbName) + N';';
        EXEC (@sql);
        PRINT 'Created login ' + @AppLogin;
    END

    /* Database user with read and write rights only (no schema changes) */
    SET @sql = N'USE ' + QUOTENAME(@DbName) + N';
        IF USER_ID(@u) IS NULL
        BEGIN
            DECLARE @c nvarchar(max) = N''CREATE USER '' + QUOTENAME(@u) + N'' FOR LOGIN '' + QUOTENAME(@u) + N'';'';
            EXEC (@c);
        END
        ALTER ROLE db_datareader ADD MEMBER ' + QUOTENAME(@AppLogin) + N';
        ALTER ROLE db_datawriter ADD MEMBER ' + QUOTENAME(@AppLogin) + N';';
    EXEC sp_executesql @sql, N'@u sysname', @u = @AppLogin;
    PRINT 'Granted read and write on ' + @DbName + ' to ' + @AppLogin;
END
GO
