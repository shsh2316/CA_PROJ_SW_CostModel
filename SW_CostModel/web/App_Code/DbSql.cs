using System;
using System.Data;
using Ports;

/// <summary>
/// Runs SQL text through dbClassSql. dbClassSql has no parameters, so values must go through Lit or LikeLit.
/// It also keeps one shared connection that cannot run two commands at once, hence the lock.
/// </summary>
public static class DbSql
{
    static readonly object Gate = new object();

    /// <summary>Runs a SELECT. dbClassSql hands a failure back as an ErrorNo / Error table; that is turned into an exception here.</summary>
    public static DataTable Query(string sql)
    {
        DataTable dt;
        lock (Gate)
            dt = dbClassSql.getdbClassInstance.SelectDT(sql);
        if (dt == null)
            throw new InvalidOperationException("The database returned nothing.");
        if (dt.Columns.Count == 2 && dt.Columns.Contains("ErrorNo") && dt.Columns.Contains("Error"))
            throw new InvalidOperationException(dt.Rows.Count > 0 ? Convert.ToString(dt.Rows[0]["Error"]) : "Database error.");
        return dt;
    }

    /// <summary>A quoted Unicode text literal: N'it''s'.</summary>
    public static string Lit(string s)
    {
        return "N'" + (s ?? "").Replace("'", "''") + "'";
    }

    /// <summary>A quoted LIKE pattern that matches the text anywhere, with % _ [ taken literally.</summary>
    public static string LikeLit(string s)
    {
        string t = (s ?? "").Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]");
        return Lit("%" + t + "%");
    }
}
