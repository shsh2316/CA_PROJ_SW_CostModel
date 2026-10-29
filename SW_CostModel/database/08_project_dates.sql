/* ==================================================================
   Central Automation - Estimate and Quotation
   08. Project start and end dates for the projects imported by script 07 (GENERATED: do not edit by hand)

   Source      CA_Projects_List_As_of_July_2026.xlsx (153 of 190 projects have a date)
   Generated   by database\tools\generate_ca_projects_import.js, with the same entries and RegisterIds as script 07.
   What        adds StartDate / EndDate to dbo.SwProjectRegister if missing (also done by script 02), then fills them for the
               imported entries that have no dates yet. "till date" = still running (no end date); "till next year" = 31 Mar 2027;
               an end date before the start date is left out. The dashboard filters projects by these dates.
   Safe to run again: an entry that already has a date is not changed.
   ================================================================== */

USE CA_PROJ_COST_MODEL;
GO
IF DB_NAME() <> N'CA_PROJ_COST_MODEL'
BEGIN
    RAISERROR('Not connected to CA_PROJ_COST_MODEL: nothing was changed.', 16, 1);
    SET NOEXEC ON;   -- skip the rest of the script
END
GO
IF COL_LENGTH('dbo.SwProjectRegister', 'StartDate') IS NULL ALTER TABLE dbo.SwProjectRegister ADD StartDate DATE NULL;
IF COL_LENGTH('dbo.SwProjectRegister', 'EndDate') IS NULL ALTER TABLE dbo.SwProjectRegister ADD EndDate DATE NULL;
GO
SET NOCOUNT ON;
DECLARE @IdSuffix nvarchar(100) = N'Import';   -- as in script 07
DECLARE @Set int = 0;
BEGIN TRANSACTION;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-04-01', EndDate = NULL WHERE RegisterId = N'rcm_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #1
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-09-01', EndDate = '2024-11-15' WHERE RegisterId = N'bf-stave-realtime-monitoring_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #2
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-12-01', EndDate = '2025-08-15' WHERE RegisterId = N'platemill-quality-live_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #4
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-08-01', EndDate = '2025-11-30' WHERE RegisterId = N'qrm_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #5
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-08-01', EndDate = '2026-09-30' WHERE RegisterId = N'lf-rinsing-trend_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #6
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-08-26', EndDate = '2024-10-22' WHERE RegisterId = N'critical-conveyor-live-status-mh_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #7
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-06-11', EndDate = '2025-04-30' WHERE RegisterId = N'emrs-and-aqms_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #8
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-09-18', EndDate = NULL WHERE RegisterId = N'fuel-management-stores-in-progress_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #9
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-01-01', EndDate = '2025-05-01' WHERE RegisterId = N'slab-identification-system_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #11
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-06-01', EndDate = '2024-08-01' WHERE RegisterId = N'hsm-live_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #12
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-05-01', EndDate = '2025-07-01' WHERE RegisterId = N'hsm-pattern-s-report-dashboard_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #13
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-06-01', EndDate = '2025-12-01' WHERE RegisterId = N'l-2-system-integration-with-gpqs-for-hsm-1-product-quality_2024-25_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #14
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-04-03', EndDate = '2025-04-30' WHERE RegisterId = N'corex-stave-realtime-monitoring_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #15
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-01-01', EndDate = '2025-07-31' WHERE RegisterId = N'lims_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #16
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-04-01', EndDate = '2026-11-30' WHERE RegisterId = N'conarc-level-2-upgradation_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #17
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-04-01', EndDate = '2025-09-30' WHERE RegisterId = N'incidence-reporting_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #18
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-03-01', EndDate = '2025-10-01' WHERE RegisterId = N'cic-digitalization_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #19
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-01-01', EndDate = '2024-08-30' WHERE RegisterId = N'ims-and-internal-audit-module_2023-24_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #20
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-07-01', EndDate = '2026-10-30' WHERE RegisterId = N'redtag-with-secondary-sales-in-progress_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #21
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-02-01', EndDate = '2026-04-30' WHERE RegisterId = N'5s-module_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #22
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-12-01', EndDate = '2026-04-01' WHERE RegisterId = N'crms_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #23
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-03-01', EndDate = '2025-07-31' WHERE RegisterId = N'fire-service-portal_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #25
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-11-01', EndDate = '2026-04-30' WHERE RegisterId = N'slab-qualification-system_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #26
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-05-21', EndDate = NULL WHERE RegisterId = N'byproduct-management_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #27
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-04-30', EndDate = '2025-05-31' WHERE RegisterId = N'corex-tuyere-rotation-life_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #28
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-12-11', EndDate = '2025-01-18' WHERE RegisterId = N'corex-dust-burner-runner-life_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #29
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2023-04-27', EndDate = '2024-10-29' WHERE RegisterId = N'crm1-tu-bay-cyms_2023-24_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #30
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2023-05-03', EndDate = '2023-11-22' WHERE RegisterId = N'plate-yard_2023-24_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #31
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-04-08', EndDate = '2025-08-12' WHERE RegisterId = N'hot-metal-ladle-life-calculation-hmm_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #32
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-05-01', EndDate = '2025-07-01' WHERE RegisterId = N'fm-interstrand-standardization-in-hsm_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #33
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-12-01', EndDate = '2025-02-01' WHERE RegisterId = N'identification-of-coils-which-are-prone-to-stricky-scale-in-_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #34
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-06-01', EndDate = '2025-08-01' WHERE RegisterId = N'recipe-created-for-rhf-drop-out-temperature-for-hsm_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #35
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-05-01', EndDate = '2025-07-01' WHERE RegisterId = N'rm-transfer-bar-setup-configured-in-ped-as-per-gwt-for-surfa_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #36
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-05-01', EndDate = '2025-07-01' WHERE RegisterId = N'looper-tension-setup-in-configured-in-ped-as-per-gwt-for-dim_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #37
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-01', EndDate = NULL WHERE RegisterId = N'parsytec-water-droplet-report-for-hsm_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #38
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-05-01', EndDate = '2025-07-01' WHERE RegisterId = N'in-hsm-for-rm-setup-fix-pattern-configured-in-ped_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #39
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-06-01', EndDate = '2025-08-01' WHERE RegisterId = N'new-interface-created-for-rhf-handling-and-combustion-plc-sy_2024-25_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #40
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-09-01', EndDate = '2026-12-31' WHERE RegisterId = N'casting-speed-optimization-model_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #41
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-11-01', EndDate = '2027-05-31' WHERE RegisterId = N'ladle-hot-spot-detection-system_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #42
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-04-01', EndDate = '2026-08-31' WHERE RegisterId = N'auto-grade-diversion-in-slab_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #44
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2023-07-04', EndDate = '2023-07-25' WHERE RegisterId = N'bf-alkali-model_2023-24_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #45
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-03-19', EndDate = '2024-04-15' WHERE RegisterId = N'solution-loss-carbon-bf_2023-24_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #46
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-02-14', EndDate = '2025-04-11' WHERE RegisterId = N'bf-liquid-levels-height-prediction_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #47
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-04-01', EndDate = '2025-12-31' WHERE RegisterId = N'cbam_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #48
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-07-01', EndDate = '2026-09-30' WHERE RegisterId = N'material-and-alloy-optimization-smp-1_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #49
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-04-15', EndDate = '2024-08-13' WHERE RegisterId = N'rdi-prediction-model-sinter_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #50
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-07-28', EndDate = '2024-12-22' WHERE RegisterId = N'bf-gas-utilization-prediction-model-sinter_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #51
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-01-12', EndDate = '2025-05-27' WHERE RegisterId = N'top-gas-temperature-prediction-model-mod6_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #52
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-08-09', EndDate = '2024-11-30' WHERE RegisterId = N'pkl-speed-prediction-model-in-crm_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #53
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-04-01', EndDate = '2026-05-31' WHERE RegisterId = N'fes-in-smp_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #54
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-01-01', EndDate = '2026-01-15' WHERE RegisterId = N'ecd-cspmill_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #55
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-04-05', EndDate = '2024-07-21' WHERE RegisterId = N'weighbridge-automation_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #56
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-01', EndDate = '2026-03-01' WHERE RegisterId = N'inspected-coil-weighment-system-cspmill_2025-26_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #58
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2022-07-01', EndDate = '2023-12-31' WHERE RegisterId = N'odisha-live_2022-23_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #62
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-05-10', EndDate = '2024-08-02' WHERE RegisterId = N'fe-ccs-al2o3-sio2-prediction-model-odisha-pellet-plant-parad_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #63
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-05-10', EndDate = '2024-08-02' WHERE RegisterId = N'ccs-optimization-model-and-furnace-set-point-odisha-pellet-p_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #64
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-05-10', EndDate = '2024-08-02' WHERE RegisterId = N'dabuna-rejection-optimization-model_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #65
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-02-16', EndDate = '2026-05-31' WHERE RegisterId = N'c-marvel-raw-material-optimization-model-for-odisha-faciliti_2023-24_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #66
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-01-09', EndDate = '2025-02-04' WHERE RegisterId = N'capa-vizag-delay-integration_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #67
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-02-01', EndDate = '2025-07-30' WHERE RegisterId = N'tatva_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #68
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-08-01', EndDate = '2025-02-02' WHERE RegisterId = N'cms-complaint-management-system_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #69
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2023-12-01', EndDate = '2024-08-31' WHERE RegisterId = N'tos-terminal-operating-systems_2023-24_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #71
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-02-01', EndDate = '2026-04-15' WHERE RegisterId = N'common-process-control-room_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #72
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-07-25', EndDate = NULL WHERE RegisterId = N'common-process-control-room_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #73
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-08-21', EndDate = '2025-11-25' WHERE RegisterId = N'uav-drone-application_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #74
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-01-01', EndDate = '2024-09-30' WHERE RegisterId = N'digital-eco-system_2023-24_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #77
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-02-01', EndDate = '2026-01-01' WHERE RegisterId = N'yard-management-systema-and-yard-automation_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #78
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-06-01', EndDate = '2025-11-01' WHERE RegisterId = N'schedule-gradation-model_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #79
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-08-01', EndDate = '2025-09-01' WHERE RegisterId = N'ea-analyser_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #80
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-08-01', EndDate = '2025-09-01' WHERE RegisterId = N'rm-gap-time-reduction_2025-26_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #81
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-08-01', EndDate = '2025-09-01' WHERE RegisterId = N'l-2-integration-with-new-surface-inspection-system_2025-26_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #83
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-02-01', EndDate = '2025-12-01' WHERE RegisterId = N'reduction-in-ct-deviation-after-simulation_2024-25_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #84
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-10-01', EndDate = '2026-03-01' WHERE RegisterId = N'tf-fan-condition-monitoring_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #85
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-01', EndDate = NULL WHERE RegisterId = N'crane-reliability-and-condition-based-maintenance_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #87
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-19', EndDate = '2026-07-20' WHERE RegisterId = N'sinter-car-grate-bar-monitoring_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #90
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-03-01', EndDate = '2026-06-01' WHERE RegisterId = N'reason-based-offset-identification-of-mill-pacing_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #91
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-06-05', EndDate = '2025-12-18' WHERE RegisterId = N'rolling-time-analysis_2025-26_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #93
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-05-31', EndDate = '2026-12-31' WHERE RegisterId = N'predicate-warm-charge-slab_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #94
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-01', EndDate = '2026-12-31' WHERE RegisterId = N'smp-1-caster-level-2-upgradation_2025-26_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #96
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-01', EndDate = '2026-06-30' WHERE RegisterId = N'heat-treatment-nf-af-tf-process-digitalization_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #97
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-05-01', EndDate = '2026-09-30' WHERE RegisterId = N'smp-1-eaf-lf-rh-vd-level-2-upgradation_2025-26_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #98
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-09-01', EndDate = '2026-09-30' WHERE RegisterId = N'daily-and-monthly-control-parameters-of-the-mill_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #99
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-02-09', EndDate = '2026-07-15' WHERE RegisterId = N'slab-yard-digitalization_2025-26_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #101
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-10-01', EndDate = '2024-11-01' WHERE RegisterId = N'automatic-drafting-control-in-f6-stand-for-chequered-plates_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #102
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-03-01', EndDate = '2026-07-24' WHERE RegisterId = N'vision-based-stencil-marking-validation-on-inspection-table_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #104
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-05-01', EndDate = '2026-09-30' WHERE RegisterId = N'slab-qualification-system_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #106
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-11-01', EndDate = '2024-12-01' WHERE RegisterId = N'ng-and-corex-gas-capturing-from-plc-live-and-history_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #107
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-03-01', EndDate = NULL WHERE RegisterId = N'vision-based-thick-plate-yard-using-normal-camera_2025-26_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #108
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-08-01', EndDate = '2026-03-30' WHERE RegisterId = N'stowage-plan_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #109
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-02-01', EndDate = NULL WHERE RegisterId = N'scheduling-system_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #110
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-05-01', EndDate = '2026-07-31' WHERE RegisterId = N'low-emission-and-green-steel-heat-marking-while-produce-from_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #112
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-06-03', EndDate = '2026-05-31' WHERE RegisterId = N'stoori-model_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #113
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-06-01', EndDate = '2026-08-31' WHERE RegisterId = N'moq_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #115
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-09-01', EndDate = '2026-01-31' WHERE RegisterId = N'commitment-report_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #116
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-11-30' WHERE RegisterId = N'make-level-2-system-for-purging-station_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #117
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-09-01', EndDate = '2026-11-30' WHERE RegisterId = N'super-heat-calculation_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #119
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-02-01', EndDate = '2026-02-01' WHERE RegisterId = N'gpqs-online_2023-24_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #120
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-06-01', EndDate = '2026-09-30' WHERE RegisterId = N'calculate-loss-during-the-heat-making_2026-27_amc_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #122
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-06-03', EndDate = NULL WHERE RegisterId = N'mmhf-model_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #124
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-05-01', EndDate = NULL WHERE RegisterId = N'coil-stock-yard-management-system_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #126
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-10-12', EndDate = '2026-01-18' WHERE RegisterId = N'csm_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #130
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-07-01', EndDate = NULL WHERE RegisterId = N'wcm_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #131
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-02-01', EndDate = '2026-03-15' WHERE RegisterId = N'pdc-checklist_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #134
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-06-16', EndDate = '2026-07-20' WHERE RegisterId = N'corex-hearthware-monitoring-system_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #135
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-06-15', EndDate = NULL WHERE RegisterId = N'tms-system-integration-with-yard-system_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #136
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2024-05-27', EndDate = '2024-11-11' WHERE RegisterId = N'mothus-model-in-bf_2024-25_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #137
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-06-01', EndDate = '2026-06-28' WHERE RegisterId = N'automated-individual-coil-loss-calculation-for-process-yield_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #138
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-06-15', EndDate = NULL WHERE RegisterId = N'mtbf-and-mttr-calculation-for-all-cr-lines-of-all-units-hazi_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #139
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-02', EndDate = '2027-03-31' WHERE RegisterId = N'suceesful-iso-27000-and-tisax-certification_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #140
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-02', EndDate = '2026-01-10' WHERE RegisterId = N'firewall-placed-alongside-rules-at-8-new-locations-without-p_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #141
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-02', EndDate = NULL WHERE RegisterId = N'demilatarized-zone-dmz-implemeted-at-ca-newrok-and-server_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #142
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = NULL WHERE RegisterId = N'crm-2-hardware-and-network-inventory-updates-av-and-me-imple_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #143
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-01-02', EndDate = NULL WHERE RegisterId = N'wifi-extention-at-crm-1-platemill-dsc-and-other-yard-locatio_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #143
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2025-10-18', EndDate = '2026-02-18' WHERE RegisterId = N'virtualization-concept-used-and-resolved-the-issue-of-msc-se_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #144
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-03-01', EndDate = NULL WHERE RegisterId = N'windows-security-patch-update-for-legacy-and-new-systems-in-_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #151
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-08-01', EndDate = '2026-08-07' WHERE RegisterId = N'bay-number-marked-on-coil-for-ease-of-logistics-in-hsm-coily_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #152
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-09-01', EndDate = '2026-09-15' WHERE RegisterId = N'laminar-header-availability-and-reliability-report-for-ident_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #153
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = NULL WHERE RegisterId = N'rm-transfer-bar-setup-configured-in-ped-as-per-gwt-for-prodc_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #154
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = NULL WHERE RegisterId = N'intelligence-model-for-prodcutivity-improvement-live-suggest_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #155
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-09-01', EndDate = '2026-09-30' WHERE RegisterId = N'daily-and-monthly-controlled-parameter-report-in-auto_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #156
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-08-01', EndDate = '2026-08-31' WHERE RegisterId = N'automatic-lower-target-crown-for-higher-thickness-and-width_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #157
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = NULL WHERE RegisterId = N'coil-mapping-in-the-coil-yard-through-yard-automation_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #158
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-08-01', EndDate = NULL WHERE RegisterId = N'offline-weighment-system-for-identification-of-losses-after-_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #159
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-10-20' WHERE RegisterId = N'validation-for-wrong-weighment-or-slab-through-tracking-the-_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #160
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-10-20' WHERE RegisterId = N'reason-idenfication-for-slab-drop-at-charging-side-to-know-s_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #161
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-10-20' WHERE RegisterId = N'slab-attribute-error-identification-and-sequencing_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #162
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-09-22', EndDate = '2026-09-30' WHERE RegisterId = N'mix-grade-idenfication-basis-rules-from-qc-team-for-referenc_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #163
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-08-01', EndDate = NULL WHERE RegisterId = N'tf-energy-optimization-basis-defined-setpoints_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #164
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-02-01', EndDate = '2026-02-05' WHERE RegisterId = N'l-2-server-panel-moved-from-fm-pulpit-to-l-2-room-for-good-o_2025-26_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #165
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-10-20' WHERE RegisterId = N'dashboard-for-total-casters-operating-at-given-time-to-ident_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #166
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-10-30' WHERE RegisterId = N'predicate-defect-in-slab-before-the-scrafing_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #167
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-07-01', EndDate = '2026-12-31' WHERE RegisterId = N'make-digital-twin-system-for-eaf-3-with-pwc-it-team_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #168
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-12-01', EndDate = '2027-03-31' WHERE RegisterId = N'calculate-throughput-losses-during-casting-in-caster_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #169
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-12-01', EndDate = '2027-03-31' WHERE RegisterId = N'predicate-defect-in-slab-before-the-rolling_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #170
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-11-30' WHERE RegisterId = N'make-all-tcg-report-in-tathya-portal_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #171
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-15', EndDate = '2026-12-31' WHERE RegisterId = N'make-alloy-optimization-model-in-lf_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #172
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-09-05', EndDate = '2026-11-30' WHERE RegisterId = N'dashboard-preparation-cccm-c-activities-of-reliability-team_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #173
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-16', EndDate = '2026-11-30' WHERE RegisterId = N'coal-coke-data-sap-linking-in-ccc-energy-portal_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #174
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-15', EndDate = '2026-12-31' WHERE RegisterId = N'portal-creation-for-equipment-certification-automation-for-c_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #175
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-07-01', EndDate = '2026-09-15' WHERE RegisterId = N'ladel-mangement-system-lms-smp1_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #176
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-15', EndDate = '2026-12-31' WHERE RegisterId = N'smp1-yms-autoplan_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #177
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-12-31', EndDate = '2027-03-31' WHERE RegisterId = N'ladel-mangement-system-lms-smp2_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #178
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-15', EndDate = '2026-12-31' WHERE RegisterId = N'asset-pulse-portal-capa_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #179
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-15', EndDate = '2026-12-31' WHERE RegisterId = N'7-qc-tools_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #180
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-08-01', EndDate = '2026-10-23' WHERE RegisterId = N'cic-phase-3_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #181
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-12-31' WHERE RegisterId = N'cqs-auto-ud_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #182
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-12-31' WHERE RegisterId = N'mtc-form-4_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #183
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-12-31' WHERE RegisterId = N'lims-vizag_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #184
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-12-31' WHERE RegisterId = N'lims-indonesia_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #185
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-12-31' WHERE RegisterId = N'gpqs-cqp-code-integration-smp-1-sqs_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #186
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-12-31' WHERE RegisterId = N'redatag-pahse-2_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #187
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2026-12-31' WHERE RegisterId = N'dsc-migaration-in-cqs_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #188
SET @Set += @@ROWCOUNT;
UPDATE dbo.SwProjectRegister SET StartDate = '2026-10-01', EndDate = '2027-03-31' WHERE RegisterId = N'deepblue-migaration_2026-27_new_' + @IdSuffix AND StartDate IS NULL AND EndDate IS NULL;   -- #189
SET @Set += @@ROWCOUNT;
COMMIT TRANSACTION;
PRINT CONCAT('Dates set on ', @Set, ' of 153 imported entries (the rest already had dates or are not in the register).');
GO
SET NOEXEC OFF;
