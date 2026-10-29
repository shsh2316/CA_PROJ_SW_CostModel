using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;

/// <summary>
/// The dashboard's highlights: the stated figures of the visual slides (TAT examples, task reductions, output gains, potential),
/// which the register does not hold as numbers. Admins edit them on the Dashboard page; they are kept as one JSON document
/// in dbo.SwDashboardContent and each save is copied to dbo.SwMasterAudit. Until the first save the page shows its built-in example.
/// </summary>
public static class DashboardRepository
{
    const string Key = "highlights";
    const int MaxJson = 65536, MaxText = 400, MaxItems = 40, MaxDepth = 6;
    static readonly string[] Sections = { "look", "principle", "glance", "money", "fte", "prod" };

    /// <summary>The saved document with who saved it and when, or null when nothing was saved yet.</summary>
    public static object Get(CurrentUser user)
    {
        user.RequireAdmin("Only admins see the dashboard.");
        DataTable dt = Db.Select("SELECT ContentJson, UpdatedBy, UpdatedAt FROM dbo.SwDashboardContent WHERE ContentKey = " + Db.Quote(Key));
        if (dt.Rows.Count == 0) return null;
        DataRow r = dt.Rows[0];
        object doc;
        try { doc = Json.Serializer().DeserializeObject(Db.Str(r, "ContentJson")); }
        catch (Exception) { doc = null; }
        return new Dictionary<string, object> { { "doc", doc }, { "by", Db.Str(r, "UpdatedBy") }, { "at", Db.Iso(r, "UpdatedAt") } };
    }

    public static void Save(CurrentUser user, IDictionary<string, object> doc)
    {
        user.RequireAdmin("Only admins can change the dashboard highlights.");
        if (doc == null) throw new ApiException(400, "bad_request", "The highlights are missing.");
        foreach (string k in doc.Keys)
            if (Array.IndexOf(Sections, k) < 0) throw new ApiException(400, "bad_request", "Unknown highlights section '" + k + "'.");
        Check(doc, 0);
        string json = Json.Serializer().Serialize(doc);
        if (json.Length > MaxJson) throw new ApiException(400, "bad_request", "The highlights are too long (" + json.Length + " characters; at most " + MaxJson + ").");
        new Db.Batch()
            .Add("MERGE dbo.SwDashboardContent AS t USING (SELECT @k AS ContentKey) AS s ON t.ContentKey = s.ContentKey " +
                 "WHEN MATCHED THEN UPDATE SET ContentJson = @json, UpdatedBy = @by, UpdatedAt = SYSUTCDATETIME() " +
                 "WHEN NOT MATCHED THEN INSERT (ContentKey, ContentJson, UpdatedBy) VALUES (@k, @json, @by);",
                 "@k", Key, "@json", json, "@by", user.Login)
            .Add("INSERT dbo.SwMasterAudit (MasterKey, SavedBy, MasterJson) VALUES ('dash', @by, @json)", "@by", user.Login, "@json", json)
            .Commit(500, "database_error", "The highlights could not be saved to the database.");
    }

    /// <summary>Only plain values: text up to 400 characters, finite numbers, true / false, short lists, shallow objects.</summary>
    static void Check(object v, int depth)
    {
        if (depth > MaxDepth) throw new ApiException(400, "bad_request", "The highlights are nested too deeply.");
        if (v == null || v is bool || v is int || v is long || v is decimal) return;
        if (v is double) { double d = (double)v; if (Double.IsNaN(d) || Double.IsInfinity(d)) throw new ApiException(400, "bad_request", "A number in the highlights is not valid."); return; }
        var s = v as string;
        if (s != null) { if (s.Length > MaxText) throw new ApiException(400, "bad_request", "A text in the highlights is longer than " + MaxText + " characters: \"" + s.Substring(0, 40) + "…\"."); return; }
        var o = v as IDictionary<string, object>;
        if (o != null) { if (o.Count > MaxItems) throw new ApiException(400, "bad_request", "Too many fields in the highlights."); foreach (var kv in o) { if (kv.Key.Length > 40) throw new ApiException(400, "bad_request", "A field name in the highlights is too long."); Check(kv.Value, depth + 1); } return; }
        var l = v as IList;
        if (l != null) { if (l.Count > MaxItems) throw new ApiException(400, "bad_request", "A list in the highlights has more than " + MaxItems + " rows."); foreach (object x in l) Check(x, depth + 1); return; }
        throw new ApiException(400, "bad_request", "The highlights hold a value that is not allowed.");
    }
}
