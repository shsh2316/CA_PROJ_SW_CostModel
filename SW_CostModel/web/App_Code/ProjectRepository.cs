using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Text.RegularExpressions;

/// <summary>
/// The project register and its approval workflow (dbo.SwProjectRegister, dbo.SwProjectLog).
/// The rules the page shows are enforced here too:
///   - anyone signed in can submit; resubmitting updates your own entry until it is verified
///   - only admins verify or send back, and never their own entry; one verification is final
///   - only the submitter can edit or delete, and never after verification
///   - people who are not admins see only their own entries, without any cost figures;
///     what they submit is stored without costs and an admin costs it when verifying
/// </summary>
public static class ProjectRepository
{
    const decimal MaxValue = 9999999999999999m;   // fits DECIMAL(18,2)
    static readonly Regex FinYear = new Regex(@"^\d{4}-\d{2}$");
    static readonly Regex EntryKey = new Regex(@"^[a-z0-9-]{1,60}_\d{4}-\d{2}_(new|amc|enh)$");
    static readonly string[] Kinds = { "new", "amc", "enh" };
    static readonly string[] Statuses = { "planned", "progress", "completed" };
    static readonly string[] Models = { "once", "yearly" };
    static readonly string[] Types = { "web", "desktop", "mobile", "interface", "dash", "ai" };
    static readonly string[] CostFields = { "value", "valueOriginal", "valueB", "charged", "oneTime", "oneTimeB", "yearly", "yearlyB", "costedBy" };

    /* ================= list ================= */

    /// <summary>Admins get every entry; anyone else gets only their own, without cost figures.</summary>
    public static Dictionary<string, object> List(SqlConnection conn, CurrentUser user)
    {
        var projects = new List<object>();
        var byId = new Dictionary<string, Dictionary<string, object>>();
        var logins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        const string sql =
            "SELECT RegisterId, EntryKey, FinYear, Kind, DeliveryModel, Status, ProjectName, ProjectType, Department, " +
            "ValueINR, ValueOriginalINR, BenchmarkValueINR, ChargedINR, OneTimeINR, BenchmarkOneTimeINR, YearlyRunINR, BenchmarkYearlyRunINR, " +
            "PersonDays, TeamSize, ValueCreatedYearlyINR, ValueCreatedOneTimeINR, Note, Workflow, SubmittedBy, SubmittedAt, UpdatedAt, " +
            "VerifiedBy, VerifiedAt, CostedBy, EstimateJson " +
            "FROM dbo.SwProjectRegister WHERE @all = 1 OR SubmittedBy = @login; " +
            "SELECT RegisterId, Action, ActionBy, ActionAt, Comment FROM dbo.SwProjectLog ORDER BY RegisterId, LogId;";
        using (SqlCommand cmd = Db.Command(conn, null, sql, "@all", user.IsAdmin ? 1 : 0, "@login", user.Login ?? ""))
        using (SqlDataReader r = cmd.ExecuteReader())
        {
            while (r.Read())
            {
                var d = new Dictionary<string, object>();
                Put(d, "_id", Db.Str(r, "RegisterId"));
                Put(d, "key", Db.Str(r, "EntryKey"));
                Put(d, "fy", Db.Str(r, "FinYear"));
                Put(d, "kind", Db.Str(r, "Kind"));
                Put(d, "model", Db.Str(r, "DeliveryModel"));
                Put(d, "status", Db.Str(r, "Status"));
                Put(d, "name", Db.Str(r, "ProjectName"));
                Put(d, "type", Db.Str(r, "ProjectType"));
                Put(d, "department", Db.Str(r, "Department"));
                Put(d, "value", Db.Dec(r, "ValueINR"));
                Put(d, "valueOriginal", Db.Dec(r, "ValueOriginalINR"));
                Put(d, "valueB", Db.Dec(r, "BenchmarkValueINR"));
                Put(d, "charged", Db.Dec(r, "ChargedINR"));
                Put(d, "oneTime", Db.Dec(r, "OneTimeINR"));
                Put(d, "oneTimeB", Db.Dec(r, "BenchmarkOneTimeINR"));
                Put(d, "yearly", Db.Dec(r, "YearlyRunINR"));
                Put(d, "yearlyB", Db.Dec(r, "BenchmarkYearlyRunINR"));
                Put(d, "personDays", Db.Dec(r, "PersonDays"));
                Put(d, "team", r["TeamSize"] == DBNull.Value ? null : r["TeamSize"]);
                Put(d, "valueYearly", Db.Dec(r, "ValueCreatedYearlyINR"));
                Put(d, "valueOnce", Db.Dec(r, "ValueCreatedOneTimeINR"));
                Put(d, "note", Db.Str(r, "Note"));
                Put(d, "wf", Db.Str(r, "Workflow"));
                Put(d, "by", Db.Str(r, "SubmittedBy"));
                Put(d, "at", Db.Iso(r, "SubmittedAt"));
                Put(d, "updated", Db.Iso(r, "UpdatedAt"));
                Put(d, "verifiedBy", Db.Str(r, "VerifiedBy"));
                Put(d, "verifiedAt", Db.Iso(r, "VerifiedAt"));
                Put(d, "costedBy", Db.Str(r, "CostedBy"));
                d["costed"] = r["CostedBy"] != DBNull.Value;
                Put(d, "state", Db.Str(r, "EstimateJson"));
                if (!user.IsAdmin)
                {
                    foreach (string k in CostFields) d.Remove(k);
                    if ((string)d["wf"] == "verified") d.Remove("state");   // a verified estimate carries the admin's rates
                }
                d["log"] = new List<object>();
                projects.Add(d);
                byId[(string)d["_id"]] = d;
                AddLogin(logins, Db.Str(r, "SubmittedBy"));
                AddLogin(logins, Db.Str(r, "VerifiedBy"));
            }
            r.NextResult();
            while (r.Read())
            {
                Dictionary<string, object> d;
                if (!byId.TryGetValue(Db.Str(r, "RegisterId"), out d)) continue;
                var l = new Dictionary<string, object>();
                Put(l, "t", Db.Str(r, "Action"));
                Put(l, "by", Db.Str(r, "ActionBy"));
                Put(l, "at", Db.Iso(r, "ActionAt"));
                l["text"] = Db.Str(r, "Comment") ?? "";
                ((List<object>)d["log"]).Add(l);
                AddLogin(logins, Db.Str(r, "ActionBy"));
            }
        }

        // Display names for everyone mentioned. Logins not in dbo.SwAppUser (for example
        // names from an imported CSV) show as written.
        var names = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        foreach (string login in logins)
            names[login] = new Dictionary<string, object> { { "name", CurrentUser.ShortName(login) } };
        using (SqlCommand cmd = Db.Command(conn, null, "SELECT UserLogin, DisplayName FROM dbo.SwAppUser"))
        using (SqlDataReader r = cmd.ExecuteReader())
            while (r.Read())
                if (logins.Contains(r.GetString(0)))
                    names[r.GetString(0)] = new Dictionary<string, object> { { "name", r.GetString(1) } };

        return new Dictionary<string, object> { { "projects", projects }, { "names", names } };
    }

    static void Put(Dictionary<string, object> d, string key, object value)
    {
        if (value != null) d[key] = value;
    }

    static void AddLogin(HashSet<string> set, string login)
    {
        if (!String.IsNullOrEmpty(login)) set.Add(login);
    }

    /* ================= submit ================= */

    public static string Submit(SqlConnection conn, CurrentUser user, IDictionary<string, object> body)
    {
        user.RequireSignIn();
        IDictionary<string, object> e = Json.Obj(body, "entry");
        if (e == null) throw new ApiException(400, "bad_request", "The entry is missing.");

        string name = Json.Text(e, "name", 200);
        string fy = Json.Text(e, "fy", 9), kind = Json.Text(e, "kind", 10), status = Json.Text(e, "status", 10);
        string model = Json.Text(e, "model", 10), type = Json.Text(e, "type", 20), key = Json.Text(e, "key", 100);
        string state = Json.Text(e, "state", 4000000);
        if (String.IsNullOrEmpty(name)) throw new ApiException(400, "bad_request", "Enter the project name in Basics.");
        if (fy == null || !FinYear.IsMatch(fy)) throw new ApiException(400, "bad_request", "The financial year is not valid.");
        if (Array.IndexOf(Kinds, kind) < 0) throw new ApiException(400, "bad_request", "The record type is not valid.");
        if (Array.IndexOf(Statuses, status) < 0) throw new ApiException(400, "bad_request", "The project status is not valid.");
        if (model != null && Array.IndexOf(Models, model) < 0) model = null;
        if (type != null && Array.IndexOf(Types, type) < 0) type = null;
        if (key == null || !EntryKey.IsMatch(key) || !key.EndsWith("_" + fy + "_" + kind, StringComparison.Ordinal))
            throw new ApiException(400, "bad_request", "The entry key is not valid.");
        if (state != null && !(SafeParse(state) is IDictionary<string, object>))
            throw new ApiException(400, "bad_request", "The saved estimate is not valid.");

        string reply = Json.Text(body, "reply", 2000);
        string editingId = Json.Text(body, "id", 200);
        string ownId = key + "_" + Regex.Replace(user.Login, "[^A-Za-z0-9_-]", "");
        if (ownId.Length > 200) ownId = ownId.Substring(0, 200);
        bool costed = user.IsAdmin;   // entries from others arrive without costs

        using (SqlTransaction tx = conn.BeginTransaction())
        {
            string id = ownId, wf = null, by = null;
            foreach (string candidate in String.IsNullOrEmpty(editingId) ? new[] { ownId } : new[] { editingId, ownId })
            {
                using (SqlCommand cmd = Db.Command(conn, tx, "SELECT Workflow, SubmittedBy FROM dbo.SwProjectRegister WITH (UPDLOCK, HOLDLOCK) WHERE RegisterId = @id", "@id", candidate))
                using (SqlDataReader r = cmd.ExecuteReader())
                    if (r.Read()) { wf = Db.Str(r, "Workflow"); by = Db.Str(r, "SubmittedBy"); }
                id = candidate;
                if (wf != null) break;
            }
            if (wf == "verified") throw new ApiException(409, "conflict", "That entry is already verified. Change the year or record type to add another.");
            if (wf != null && !user.Is(by)) throw new ApiException(403, "forbidden", "That entry was submitted by someone else.");

            var fields = new List<object>
            {
                "@id", id, "@key", key, "@fy", fy, "@kind", kind, "@model", model, "@status", status,
                "@name", name, "@type", type, "@dept", Json.Text(e, "department", 200),
                "@note", Json.Text(e, "note", 500), "@by", user.Login, "@state", state, "@costedBy", costed ? user.Login : null
            };
            fields.AddRange(Figures(e, costed));
            if (wf == null)
                Db.Execute(conn, tx,
                    "INSERT dbo.SwProjectRegister (RegisterId, EntryKey, FinYear, Kind, DeliveryModel, Status, ProjectName, ProjectType, Department, " +
                    "ValueINR, BenchmarkValueINR, ChargedINR, OneTimeINR, BenchmarkOneTimeINR, YearlyRunINR, BenchmarkYearlyRunINR, PersonDays, TeamSize, " +
                    "ValueCreatedYearlyINR, ValueCreatedOneTimeINR, Note, Workflow, SubmittedBy, CostedBy, EstimateJson) " +
                    "VALUES (@id, @key, @fy, @kind, @model, @status, @name, @type, @dept, " +
                    "@value, @valueB, @charged, @oneTime, @oneTimeB, @yearly, @yearlyB, @pd, @team, @valYear, @valOnce, @note, 'pending', @by, @costedBy, @state)",
                    fields.ToArray());
            else
                Db.Execute(conn, tx,
                    "UPDATE dbo.SwProjectRegister SET EntryKey = @key, FinYear = @fy, Kind = @kind, DeliveryModel = @model, Status = @status, " +
                    "ProjectName = @name, ProjectType = @type, Department = @dept, Note = @note, Workflow = 'pending', UpdatedAt = SYSUTCDATETIME(), " +
                    "VerifiedBy = NULL, VerifiedAt = NULL, CostedBy = @costedBy, EstimateJson = @state, " + FigureAssignments + " WHERE RegisterId = @id",
                    fields.ToArray());

            bool wasInfo = wf == "info";
            AddLog(conn, tx, id, wasInfo ? "reply" : "submit", user.Login, wasInfo ? reply : null);
            tx.Commit();
            return id;
        }
    }

    /// <summary>Cost figures and value creation as SQL parameters. Without costs the cost figures are 0 / NULL.</summary>
    static object[] Figures(IDictionary<string, object> e, bool costed)
    {
        Func<string, object> cost = k => costed ? (object)Json.Num(e, k, 0, MaxValue) : null;
        return new object[]
        {
            "@value", costed ? Json.Num(e, "value", 0, MaxValue) : 0m, "@valueB", costed ? Json.Num(e, "valueB", 0, MaxValue) : 0m,
            "@charged", costed ? Json.Num(e, "charged", 0, MaxValue) : 0m,
            "@oneTime", cost("oneTime"), "@oneTimeB", cost("oneTimeB"), "@yearly", cost("yearly"), "@yearlyB", cost("yearlyB"),
            "@pd", Math.Round(Json.Num(e, "personDays", 0, 99999999999m), 1), "@team", (int)Math.Round(Json.Num(e, "team", 0, 1000000)),
            "@valYear", Json.Num(e, "valueYearly", 0, MaxValue), "@valOnce", Json.Num(e, "valueOnce", 0, MaxValue)
        };
    }

    const string FigureAssignments =
        "ValueINR = @value, ValueOriginalINR = NULL, BenchmarkValueINR = @valueB, ChargedINR = @charged, OneTimeINR = @oneTime, " +
        "BenchmarkOneTimeINR = @oneTimeB, YearlyRunINR = @yearly, BenchmarkYearlyRunINR = @yearlyB, PersonDays = @pd, TeamSize = @team, " +
        "ValueCreatedYearlyINR = @valYear, ValueCreatedOneTimeINR = @valOnce";

    static object SafeParse(string json)
    {
        try { return Json.Serializer().DeserializeObject(json); }
        catch (Exception) { return null; }
    }

    /* ================= review (admins) ================= */

    /// <summary>
    /// Verifies a pending entry. costing holds the figures the admin sees on the review page
    /// (worked out with the current masters for an entry that arrived without costs); it is
    /// required for such an entry and recorded together with the estimate it was costed from.
    /// </summary>
    public static void Verify(SqlConnection conn, CurrentUser user, IDictionary<string, object> body)
    {
        user.RequireAdmin("Only admins can verify entries.");
        string id = Json.Text(body, "id", 200), comment = Json.Text(body, "comment", 2000) ?? "";
        IDictionary<string, object> costing = Json.Obj(body, "costing");
        using (SqlTransaction tx = conn.BeginTransaction())
        {
            bool wasCosted;
            decimal value = LockForReview(conn, tx, user, id, Json.Text(body, "updated", 40), "Another admin needs to verify your entry.", out wasCosted);
            if (!wasCosted && costing == null) throw new ApiException(400, "bad_request", "This entry has no costs yet. Open it again to cost it before verifying.");
            if (costing != null)
            {
                string state = Json.Text(costing, "state", 4000000);
                if (state != null && !(SafeParse(state) is IDictionary<string, object>))
                    throw new ApiException(400, "bad_request", "The saved estimate is not valid.");
                var fields = new List<object> { "@id", id, "@costedBy", user.Login, "@state", state };
                fields.AddRange(Figures(costing, true));
                Db.Execute(conn, tx, "UPDATE dbo.SwProjectRegister SET CostedBy = @costedBy, EstimateJson = COALESCE(@state, EstimateJson), " +
                    FigureAssignments + " WHERE RegisterId = @id", fields.ToArray());
                value = Json.Num(costing, "value", 0, MaxValue);
            }
            decimal adj = Math.Round(Json.Num(body, "adjustedValue", 0, MaxValue)), cur = Math.Round(value);
            bool adjusted = adj > 0 && adj != cur;
            if (adjusted && comment.Length == 0) throw new ApiException(400, "bad_request", "Add a comment explaining the adjusted value.");

            // The comment is stored as written: the submitter may see it and does not see costs.
            // An adjustment is kept in ValueOriginalINR / ValueINR instead.
            Db.Execute(conn, tx,
                "UPDATE dbo.SwProjectRegister SET Workflow = 'verified', VerifiedBy = @by, VerifiedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()" +
                (adjusted ? ", ValueOriginalINR = ValueINR, ValueINR = @adj" : "") + " WHERE RegisterId = @id",
                "@id", id, "@by", user.Login, "@adj", adj);
            AddLog(conn, tx, id, "verify", user.Login, comment);
            tx.Commit();
        }
    }

    public static void SendBack(SqlConnection conn, CurrentUser user, IDictionary<string, object> body)
    {
        user.RequireAdmin("Only admins can send entries back.");
        string id = Json.Text(body, "id", 200), comment = Json.Text(body, "comment", 2000) ?? "";
        if (comment.Length == 0) throw new ApiException(400, "bad_request", "Say what information is needed.");
        using (SqlTransaction tx = conn.BeginTransaction())
        {
            bool wasCosted;
            LockForReview(conn, tx, user, id, Json.Text(body, "updated", 40), "Another admin needs to review your entry.", out wasCosted);
            Db.Execute(conn, tx, "UPDATE dbo.SwProjectRegister SET Workflow = 'info', UpdatedAt = SYSUTCDATETIME() WHERE RegisterId = @id", "@id", id);
            AddLog(conn, tx, id, "info", user.Login, comment);
            tx.Commit();
        }
    }

    /// <summary>Locks a pending entry for review and returns its value. expectedUpdated, when given,
    /// must match, so a reviewer never approves a version they have not seen.</summary>
    static decimal LockForReview(SqlConnection conn, SqlTransaction tx, CurrentUser user, string id, string expectedUpdated, string ownEntryMessage, out bool costed)
    {
        using (SqlCommand cmd = Db.Command(conn, tx,
            "SELECT Workflow, SubmittedBy, ValueINR, UpdatedAt, CostedBy FROM dbo.SwProjectRegister WITH (UPDLOCK, HOLDLOCK) WHERE RegisterId = @id", "@id", id ?? ""))
        using (SqlDataReader r = cmd.ExecuteReader())
        {
            if (!r.Read()) throw new ApiException(404, "not_found", "This entry no longer exists.");
            if (Db.Str(r, "Workflow") != "pending" || (!String.IsNullOrEmpty(expectedUpdated) && expectedUpdated != Db.Iso(r, "UpdatedAt")))
                throw new ApiException(409, "conflict", "This entry changed. Review it again.");
            if (user.Is(Db.Str(r, "SubmittedBy"))) throw new ApiException(403, "forbidden", ownEntryMessage);
            costed = Db.Str(r, "CostedBy") != null;
            return Db.Dec(r, "ValueINR") ?? 0;
        }
    }

    /* ================= delete ================= */

    public static void Delete(SqlConnection conn, CurrentUser user, IDictionary<string, object> body)
    {
        user.RequireSignIn();
        string id = Json.Text(body, "id", 200);
        using (SqlTransaction tx = conn.BeginTransaction())
        {
            using (SqlCommand cmd = Db.Command(conn, tx, "SELECT Workflow, SubmittedBy FROM dbo.SwProjectRegister WITH (UPDLOCK, HOLDLOCK) WHERE RegisterId = @id", "@id", id ?? ""))
            using (SqlDataReader r = cmd.ExecuteReader())
            {
                if (!r.Read()) throw new ApiException(404, "not_found", "This entry no longer exists.");
                if (Db.Str(r, "Workflow") == "verified") throw new ApiException(409, "conflict", "Verified entries cannot be deleted.");
                if (!user.Is(Db.Str(r, "SubmittedBy"))) throw new ApiException(403, "forbidden", "Only the submitter can delete an entry.");
            }
            Db.Execute(conn, tx, "DELETE dbo.SwProjectRegister WHERE RegisterId = @id", "@id", id);
            tx.Commit();
        }
    }

    /* ================= helpers ================= */

    static void AddLog(SqlConnection conn, SqlTransaction tx, string id, string action, string by, string comment)
    {
        Db.Execute(conn, tx, "INSERT dbo.SwProjectLog (RegisterId, Action, ActionBy, Comment) VALUES (@id, @a, @by, @c)",
            "@id", id, "@a", action, "@by", by, "@c", String.IsNullOrEmpty(comment) ? null : comment);
    }
}
