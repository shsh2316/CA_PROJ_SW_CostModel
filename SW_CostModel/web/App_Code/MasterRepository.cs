using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Text.RegularExpressions;

/// <summary>
/// Reads and saves the masters (man, hw, sw, lic, val) in the shape the page uses,
/// mapped to the master tables created by database\02_create_tables.sql.
/// People who are not admins get the lists (roles, GPU and licence names, value
/// categories) without any price, rate or loading.
/// </summary>
public static class MasterRepository
{
    public static readonly string[] Keys = { "man", "hw", "sw", "lic", "val" };

    const decimal MaxMoney = 999999999999m;   // fits DECIMAL(14,2)
    const decimal MaxRate = 9999999999m;      // fits DECIMAL(12,2)
    const decimal MaxFactor = 9999m;          // fits DECIMAL(6,2)
    const decimal MaxPct = 999m;              // fits DECIMAL(5,2)

    static readonly string[] OnpremItems = { "cpu", "ram", "hdd", "ssd", "nvme", "opsPct" };
    static readonly string[] CloudItems = { "cpu", "ram", "hdd", "ssd", "nvme" };
    static readonly string[] EnvCodes = { "prod", "uat", "dr", "full" };
    static readonly string[] RaidCodes = { "none", "raid5", "raid10" };
    static readonly Regex IdPattern = new Regex("^[A-Za-z0-9_-]{1,20}$");

    enum Kind { Number, Flag, Text }

    sealed class SettingMap
    {
        public string Key, Master, PathCA, PathB; public Kind Kind; public bool AdminOnly;
        public SettingMap(string key, string master, string pathCA, string pathB, Kind kind, bool adminOnly)
        { Key = key; Master = master; PathCA = pathCA; PathB = pathB; Kind = kind; AdminOnly = adminOnly; }
    }

    /// <summary>dbo.SwSetting row -> where its value sits in the master. PathB is the benchmark value.
    /// AdminOnly settings are prices, loadings and quotation details.</summary>
    static readonly SettingMap[] Settings =
    {
        new SettingMap("complexity.low",   "sw",  "complexity.low",   null,           Kind.Number, false),
        new SettingMap("complexity.std",   "sw",  "complexity.std",   null,           Kind.Number, false),
        new SettingMap("complexity.high",  "sw",  "complexity.high",  null,           Kind.Number, false),
        new SettingMap("complexity.vhigh", "sw",  "complexity.vhigh", null,           Kind.Number, false),
        new SettingMap("benchEffort",      "sw",  "benchEffort",      null,           Kind.Number, true),
        new SettingMap("load.cont",        "sw",  "load.cont",        "loadB.cont",   Kind.Number, true),
        new SettingMap("load.ovh",         "sw",  "load.ovh",         "loadB.ovh",    Kind.Number, true),
        new SettingMap("load.markup",      "sw",  "load.markup",      "loadB.markup", Kind.Number, true),
        new SettingMap("load.gst",         "sw",  "load.gst",         null,           Kind.Number, true),
        new SettingMap("load.gstOn",       "sw",  "load.gstOn",       null,           Kind.Flag,   true),
        new SettingMap("amc.pct",          "sw",  "amc.pct",          "amc.pctB",     Kind.Number, true),
        new SettingMap("amc.warranty",     "sw",  "amc.warranty",     null,           Kind.Number, false),
        new SettingMap("amc.esc",          "sw",  "amc.esc",          null,           Kind.Number, true),
        new SettingMap("amc.years",        "sw",  "amc.years",        null,           Kind.Number, false),
        new SettingMap("amc.crDays",       "sw",  "amc.crDays",       null,           Kind.Number, false),
        new SettingMap("amc.deployDays",   "sw",  "amc.deployDays",   null,           Kind.Number, false),
        new SettingMap("scope.screen",     "sw",  "scopeDays.screen", null,           Kind.Number, false),
        new SettingMap("scope.report",     "sw",  "scopeDays.report", null,           Kind.Number, false),
        new SettingMap("scope.integ",      "sw",  "scopeDays.integ",  null,           Kind.Number, false),
        new SettingMap("quote.valid",      "sw",  "quote.valid",      null,           Kind.Number, true),
        new SettingMap("quote.from",       "sw",  "quote.from",       null,           Kind.Text,   true),
        new SettingMap("quote.fromAddr",   "sw",  "quote.fromAddr",   null,           Kind.Text,   true),
        new SettingMap("quote.terms",      "sw",  "quote.terms",      null,           Kind.Text,   true),
        new SettingMap("lic.calPerUser",   "lic", "calPerUser",       "calPerUserB",  Kind.Number, true)
    };

    /* ================= load ================= */

    /// <param name="includeCosts">false for people who are not admins: prices are left out.</param>
    public static Dictionary<string, object> Load(bool includeCosts)
    {
        var man = new Dictionary<string, object>();
        var hw = new Dictionary<string, object>();
        var sw = new Dictionary<string, object>();
        var lic = new Dictionary<string, object>();
        var val = new Dictionary<string, object>();

        if (includeCosts)
        {
            var rates = new Dictionary<string, object>();
            var ratesB = new Dictionary<string, object>();
            Read("SELECT LevelName, RateCA, RateBenchmark FROM dbo.SwRateLevel ORDER BY SortOrder", r =>
            {
                rates[Db.Str(r, "LevelName")] = Db.Dec(r, "RateCA");
                ratesB[Db.Str(r, "LevelName")] = Db.Dec(r, "RateBenchmark");
            });
            man["rates"] = rates;
            man["ratesB"] = ratesB;
        }
        var roles = new List<object>();
        Read("SELECT RoleName, DefaultLevel FROM dbo.SwRole ORDER BY SortOrder, RoleId", r =>
            roles.Add(new Dictionary<string, object> { { "role", Db.Str(r, "RoleName") }, { "level", Db.Str(r, "DefaultLevel") } }));
        man["roles"] = roles;

        if (includeCosts)
            Read("SELECT Model, Item, ValueCA, ValueBenchmark FROM dbo.SwHwPrice", r =>
            {
                Json.Set(hw, Db.Str(r, "Model") + "." + Db.Str(r, "Item"), Db.Dec(r, "ValueCA"));
                Json.Set(hw, Db.Str(r, "Model") + "B." + Db.Str(r, "Item"), Db.Dec(r, "ValueBenchmark"));
            });
        Read("SELECT FactorType, Code, Factor FROM dbo.SwHwFactor", r =>
            Json.Set(hw, (Db.Str(r, "FactorType") == "env" ? "envF." : "raidF.") + Db.Str(r, "Code"), Db.Dec(r, "Factor")));
        var gpus = new List<object>();
        Read("SELECT GpuId, GpuName, PriceCA, PriceBenchmark, MonthlyCA, MonthlyBenchmark FROM dbo.SwGpu WHERE IsActive = 1 ORDER BY SortOrder, GpuId", r =>
            gpus.Add(new Dictionary<string, object> {
                { "id", Db.Str(r, "GpuId") }, { "name", Db.Str(r, "GpuName") },
                { "price", Db.Dec(r, "PriceCA") }, { "priceB", Db.Dec(r, "PriceBenchmark") },
                { "monthly", Db.Dec(r, "MonthlyCA") }, { "monthlyB", Db.Dec(r, "MonthlyBenchmark") } }));
        hw["gpus"] = includeCosts ? gpus : NamesOnly(gpus, "id", "name");

        var db = new List<object>();
        Read("SELECT DbId, DbName, PriceCA, PriceBenchmark, MinCores, SupportPct FROM dbo.SwDbEngine WHERE IsActive = 1 ORDER BY SortOrder, DbId", r =>
            db.Add(new Dictionary<string, object> {
                { "id", Db.Str(r, "DbId") }, { "name", Db.Str(r, "DbName") },
                { "price", Db.Dec(r, "PriceCA") }, { "priceB", Db.Dec(r, "PriceBenchmark") },
                { "min", r["MinCores"] }, { "support", Db.Dec(r, "SupportPct") } }));
        lic["db"] = includeCosts ? db : NamesOnly(db, "id", "name", "min");
        var os = new List<object>();
        Read("SELECT OsId, OsName, PriceCA, PriceBenchmark FROM dbo.SwOsOption WHERE IsActive = 1 ORDER BY SortOrder, OsId", r =>
            os.Add(new Dictionary<string, object> {
                { "id", Db.Str(r, "OsId") }, { "name", Db.Str(r, "OsName") },
                { "price", Db.Dec(r, "PriceCA") }, { "priceB", Db.Dec(r, "PriceBenchmark") } }));
        lic["os"] = includeCosts ? os : NamesOnly(os, "id", "name");
        var items = new List<object>();
        Read("SELECT ItemId, ItemName, Category, Billing, CostCA, CostBenchmark FROM dbo.SwCatalogItem WHERE IsActive = 1 ORDER BY SortOrder, ItemId", r =>
            items.Add(new Dictionary<string, object> {
                { "id", Db.Str(r, "ItemId") }, { "name", Db.Str(r, "ItemName") },
                { "cat", Db.Str(r, "Category") }, { "type", Db.Str(r, "Billing") },
                { "cost", Db.Dec(r, "CostCA") }, { "costB", Db.Dec(r, "CostBenchmark") } }));
        lic["items"] = includeCosts ? items : NamesOnly(items, "id", "name", "cat", "type");

        var cats = new List<object>();
        Read("SELECT CategoryId, CategoryName, Unit, DefaultRate FROM dbo.SwValueCategory WHERE IsActive = 1 ORDER BY SortOrder, CategoryId", r =>
            cats.Add(new Dictionary<string, object> {
                { "id", Db.Str(r, "CategoryId") }, { "name", Db.Str(r, "CategoryName") },
                { "unit", Db.Str(r, "Unit") }, { "rate", Db.Dec(r, "DefaultRate") } }));
        val["cats"] = cats;

        var masters = new Dictionary<string, object> { { "man", man }, { "hw", hw }, { "sw", sw }, { "lic", lic }, { "val", val } };
        var byKey = new Dictionary<string, SettingMap>();
        foreach (SettingMap m in Settings) byKey[m.Key] = m;
        Read("SELECT SettingKey, ValueCA, ValueBenchmark, TextValue FROM dbo.SwSetting", r =>
        {
            SettingMap m;
            if (!byKey.TryGetValue(Db.Str(r, "SettingKey"), out m) || (m.AdminOnly && !includeCosts)) return;
            var target = (Dictionary<string, object>)masters[m.Master];
            if (m.Kind == Kind.Text) { Json.Set(target, m.PathCA, Db.Str(r, "TextValue") ?? ""); return; }
            decimal? ca = Db.Dec(r, "ValueCA"), b = Db.Dec(r, "ValueBenchmark");
            if (ca.HasValue) Json.Set(target, m.PathCA, m.Kind == Kind.Flag ? (object)(ca.Value != 0) : ca.Value);
            if (m.PathB != null && b.HasValue) Json.Set(target, m.PathB, b.Value);
        });
        return masters;
    }

    static List<object> NamesOnly(List<object> rows, params string[] keep)
    {
        var result = new List<object>();
        foreach (Dictionary<string, object> row in rows)
        {
            var d = new Dictionary<string, object>();
            foreach (string k in keep) d[k] = row[k];
            result.Add(d);
        }
        return result;
    }

    static void Read(string sql, Action<DataRow> row)
    {
        foreach (DataRow r in Db.Select(sql).Rows) row(r);
    }

    /* ================= save ================= */

    public static void Save(CurrentUser user, string key, IDictionary<string, object> doc)
    {
        if (Array.IndexOf(Keys, key) < 0) throw new ApiException(400, "bad_request", "Unknown master '" + key + "'.");
        if (doc == null) throw new ApiException(400, "bad_request", "The master is missing.");

        // Everything for one master is saved together or not at all.
        var batch = new Db.Batch();
        if (key == "man") SaveManpower(batch, doc);
        else if (key == "hw") SaveHardware(batch, doc);
        else if (key == "lic") SaveLicences(batch, doc);
        else if (key == "val") SaveValueCategories(batch, doc);
        SaveSettings(batch, key, doc);
        batch.Add("INSERT dbo.SwMasterAudit (MasterKey, SavedBy, MasterJson) VALUES (@k, @by, @json)",
            "@k", key, "@by", user.Login, "@json", Json.Serializer().Serialize(doc));
        batch.Commit(500, "database_error", "The master could not be saved to the database.");
    }

    static void SaveManpower(Db.Batch batch, IDictionary<string, object> doc)
    {
        IDictionary<string, object> rates = Json.Obj(doc, "rates"), ratesB = Json.Obj(doc, "ratesB");
        var levels = new List<string>();
        foreach (DataRow r in Db.Select("SELECT LevelName FROM dbo.SwRateLevel").Rows) levels.Add(Db.Str(r, "LevelName"));
        foreach (string level in levels)
        {
            if (Json.Has(rates, level))
                batch.Add("UPDATE dbo.SwRateLevel SET RateCA = @v WHERE LevelName = @l", "@v", Json.Num(rates, level, 0, MaxRate), "@l", level);
            if (Json.Has(ratesB, level))
                batch.Add("UPDATE dbo.SwRateLevel SET RateBenchmark = @v WHERE LevelName = @l", "@v", Json.Num(ratesB, level, 0, MaxRate), "@l", level);
        }

        IList roles = Json.List(doc, "roles");
        if (roles == null) return;
        if (roles.Count == 0) throw new ApiException(400, "bad_request", "Keep at least one role: an empty list would delete every role.");
        batch.Add("DELETE dbo.SwRole");
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        int sort = 0;
        foreach (object o in roles)
        {
            var role = o as IDictionary<string, object>;
            string name = Json.Text(role, "role", 100), level = Json.Text(role, "level", 20);
            if (String.IsNullOrEmpty(name)) continue;
            if (level == null || !levels.Contains(level)) level = levels.Contains("Mid") ? "Mid" : levels[0];
            if (!seen.Add(name + "|" + level)) continue;
            batch.Add("INSERT dbo.SwRole (RoleName, DefaultLevel, SortOrder) VALUES (@n, @l, @s)", "@n", name, "@l", level, "@s", ++sort);
        }
    }

    static void SaveHardware(Db.Batch batch, IDictionary<string, object> doc)
    {
        foreach (string model in new[] { "onprem", "cloud" })
        {
            IDictionary<string, object> ca = Json.Obj(doc, model), b = Json.Obj(doc, model + "B");
            foreach (string item in model == "onprem" ? OnpremItems : CloudItems)
            {
                if (!Json.Has(ca, item) && !Json.Has(b, item)) continue;
                batch.Add(
                    "MERGE dbo.SwHwPrice AS t USING (SELECT @m AS Model, @i AS Item) AS s ON t.Model = s.Model AND t.Item = s.Item " +
                    "WHEN MATCHED THEN UPDATE SET ValueCA = COALESCE(@ca, t.ValueCA), ValueBenchmark = COALESCE(@b, t.ValueBenchmark) " +
                    "WHEN NOT MATCHED THEN INSERT (Model, Item, ValueCA, ValueBenchmark) VALUES (@m, @i, COALESCE(@ca, 0), COALESCE(@b, @ca, 0));",
                    "@m", model, "@i", item,
                    "@ca", Json.Has(ca, item) ? (object)Json.Num(ca, item, 0, MaxRate) : null,
                    "@b", Json.Has(b, item) ? (object)Json.Num(b, item, 0, MaxRate) : null);
            }
        }
        SaveFactors(batch, "env", EnvCodes, Json.Obj(doc, "envF"));
        SaveFactors(batch, "raid", RaidCodes, Json.Obj(doc, "raidF"));

        SyncCatalog(batch, "dbo.SwGpu", "GpuId", Json.List(doc, "gpus"), (it, id, sort) =>
            batch.Add(
                "MERGE dbo.SwGpu AS t USING (SELECT @id AS GpuId) AS s ON t.GpuId = s.GpuId " +
                "WHEN MATCHED THEN UPDATE SET GpuName = @n, PriceCA = @p, PriceBenchmark = @pb, MonthlyCA = @mo, MonthlyBenchmark = @mob, SortOrder = @s, IsActive = 1 " +
                "WHEN NOT MATCHED THEN INSERT (GpuId, GpuName, PriceCA, PriceBenchmark, MonthlyCA, MonthlyBenchmark, SortOrder) VALUES (@id, @n, @p, @pb, @mo, @mob, @s);",
                "@id", id, "@n", Json.Text(it, "name", 100) ?? "GPU", "@s", sort,
                "@p", Json.Num(it, "price", 0, MaxMoney), "@pb", Json.Num(it, "priceB", 0, MaxMoney),
                "@mo", Json.Num(it, "monthly", 0, MaxMoney), "@mob", Json.Num(it, "monthlyB", 0, MaxMoney)));
    }

    static void SaveFactors(Db.Batch batch, string type, string[] codes, IDictionary<string, object> values)
    {
        foreach (string code in codes)
        {
            if (!Json.Has(values, code)) continue;
            batch.Add(
                "MERGE dbo.SwHwFactor AS t USING (SELECT @t AS FactorType, @c AS Code) AS s ON t.FactorType = s.FactorType AND t.Code = s.Code " +
                "WHEN MATCHED THEN UPDATE SET Factor = @f " +
                "WHEN NOT MATCHED THEN INSERT (FactorType, Code, Name, Factor) VALUES (@t, @c, @c, @f);",
                "@t", type, "@c", code, "@f", Json.Num(values, code, 1, MaxFactor));
        }
    }

    static void SaveLicences(Db.Batch batch, IDictionary<string, object> doc)
    {
        SyncCatalog(batch, "dbo.SwDbEngine", "DbId", Json.List(doc, "db"), (it, id, sort) =>
            batch.Add(
                "MERGE dbo.SwDbEngine AS t USING (SELECT @id AS DbId) AS s ON t.DbId = s.DbId " +
                "WHEN MATCHED THEN UPDATE SET DbName = @n, PriceCA = @p, PriceBenchmark = @pb, MinCores = @min, SupportPct = @sup, SortOrder = @s, IsActive = 1 " +
                "WHEN NOT MATCHED THEN INSERT (DbId, DbName, PriceCA, PriceBenchmark, MinCores, SupportPct, SortOrder) VALUES (@id, @n, @p, @pb, @min, @sup, @s);",
                "@id", id, "@n", Json.Text(it, "name", 100) ?? "Database", "@s", sort,
                "@p", Json.Num(it, "price", 0, MaxMoney), "@pb", Json.Num(it, "priceB", 0, MaxMoney),
                "@min", (int)Math.Round(Json.Num(it, "min", 0, 100000)), "@sup", Json.Num(it, "support", 0, MaxPct)));

        SyncCatalog(batch, "dbo.SwOsOption", "OsId", Json.List(doc, "os"), (it, id, sort) =>
            batch.Add(
                "MERGE dbo.SwOsOption AS t USING (SELECT @id AS OsId) AS s ON t.OsId = s.OsId " +
                "WHEN MATCHED THEN UPDATE SET OsName = @n, PriceCA = @p, PriceBenchmark = @pb, SortOrder = @s, IsActive = 1 " +
                "WHEN NOT MATCHED THEN INSERT (OsId, OsName, PriceCA, PriceBenchmark, SortOrder) VALUES (@id, @n, @p, @pb, @s);",
                "@id", id, "@n", Json.Text(it, "name", 100) ?? "Operating system", "@s", sort,
                "@p", Json.Num(it, "price", 0, MaxMoney), "@pb", Json.Num(it, "priceB", 0, MaxMoney)));

        SyncCatalog(batch, "dbo.SwCatalogItem", "ItemId", Json.List(doc, "items"), (it, id, sort) =>
        {
            string cat = Json.Text(it, "cat", 3) == "svc" ? "svc" : "lic";
            string billing = Json.Text(it, "type", 4) == "year" ? "year" : "once";
            batch.Add(
                "MERGE dbo.SwCatalogItem AS t USING (SELECT @id AS ItemId) AS s ON t.ItemId = s.ItemId " +
                "WHEN MATCHED THEN UPDATE SET ItemName = @n, Category = @c, Billing = @b, CostCA = @p, CostBenchmark = @pb, SortOrder = @s, IsActive = 1 " +
                "WHEN NOT MATCHED THEN INSERT (ItemId, ItemName, Category, Billing, CostCA, CostBenchmark, SortOrder) VALUES (@id, @n, @c, @b, @p, @pb, @s);",
                "@id", id, "@n", Json.Text(it, "name", 150) ?? "Item", "@c", cat, "@b", billing, "@s", sort,
                "@p", Json.Num(it, "cost", 0, MaxMoney), "@pb", Json.Num(it, "costB", 0, MaxMoney));
        });
    }

    static void SaveValueCategories(Db.Batch batch, IDictionary<string, object> doc)
    {
        SyncCatalog(batch, "dbo.SwValueCategory", "CategoryId", Json.List(doc, "cats"), (it, id, sort) =>
            batch.Add(
                "MERGE dbo.SwValueCategory AS t USING (SELECT @id AS CategoryId) AS s ON t.CategoryId = s.CategoryId " +
                "WHEN MATCHED THEN UPDATE SET CategoryName = @n, Unit = @u, DefaultRate = @r, SortOrder = @s, IsActive = 1 " +
                "WHEN NOT MATCHED THEN INSERT (CategoryId, CategoryName, Unit, DefaultRate, SortOrder) VALUES (@id, @n, @u, @r, @s);",
                "@id", id, "@n", Json.Text(it, "name", 100) ?? "Benefit", "@u", Json.Text(it, "unit", 30) ?? "INR", "@s", sort,
                "@r", Json.Num(it, "rate", 0, MaxMoney)));
    }

    /// <summary>
    /// Makes a catalogue table match the list: rows left out are marked inactive (kept for history),
    /// listed rows are inserted or updated in list order.
    /// </summary>
    static void SyncCatalog(Db.Batch batch, string table, string idColumn, IList list,
        Action<IDictionary<string, object>, string, int> upsert)
    {
        if (list == null) return;
        batch.Add("UPDATE " + table + " SET IsActive = 0");
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        int sort = 0;
        foreach (object o in list)
        {
            var it = o as IDictionary<string, object>;
            if (it == null) continue;
            string id = Json.Text(it, "id", 50);
            if (id == null || !IdPattern.IsMatch(id)) id = "x" + Guid.NewGuid().ToString("N").Substring(0, 12);
            if (!seen.Add(id)) continue;
            upsert(it, id, ++sort);
        }
    }

    static void SaveSettings(Db.Batch batch, string key, IDictionary<string, object> doc)
    {
        foreach (SettingMap m in Settings)
        {
            if (m.Master != key) continue;
            object ca = Json.Get(doc, m.PathCA), b = m.PathB == null ? null : Json.Get(doc, m.PathB);
            if (ca == null && b == null) continue;
            var holder = new Dictionary<string, object> { { "ca", ca }, { "b", b } };
            object valueCA = null, valueB = null, text = null;
            if (m.Kind == Kind.Text) text = Json.Text(holder, "ca", 8000) ?? "";
            else if (m.Kind == Kind.Flag) valueCA = Json.Bool(holder, "ca") ? 1m : 0m;
            else
            {
                if (ca != null) valueCA = Json.Num(holder, "ca", 0, MaxRate);
                if (b != null) valueB = Json.Num(holder, "b", 0, MaxRate);
            }
            batch.Add(
                "MERGE dbo.SwSetting AS t USING (SELECT @k AS SettingKey) AS s ON t.SettingKey = s.SettingKey " +
                "WHEN MATCHED THEN UPDATE SET ValueCA = CASE WHEN @isText = 1 THEN t.ValueCA ELSE COALESCE(@ca, t.ValueCA) END, " +
                "  ValueBenchmark = COALESCE(@b, t.ValueBenchmark), TextValue = CASE WHEN @isText = 1 THEN @txt ELSE t.TextValue END " +
                "WHEN NOT MATCHED THEN INSERT (SettingKey, ValueCA, ValueBenchmark, TextValue, Description) VALUES (@k, @ca, @b, @txt, @k);",
                "@k", m.Key, "@ca", valueCA, "@b", valueB, "@txt", text, "@isText", m.Kind == Kind.Text ? 1 : 0);
        }
    }
}
