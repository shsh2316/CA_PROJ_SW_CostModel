using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Ports;

/// <summary>
/// All SQL Server access goes through dbClassSql (connection string CCCConString in Web.config).
/// dbClassSql keeps one shared connection that can run only one command at a time, so every call
/// locks on its instance. dbClassSql has no parameters on reads, so values in a SELECT go through Quote.
/// Writes go through Batch: one or more statements with parameters, run as one transaction.
/// </summary>
public static class Db
{
    public const string ConnectionStringName = "CCCConString";
    const int MaxParameters = 2000;   // SQL Server allows 2100 per command

    static dbClassSql Instance()
    {
        try
        {
            return dbClassSql.getdbClassInstance;
        }
        catch (TypeInitializationException ex)
        {
            // dbClassSql reads its connection string in a static constructor.
            throw new ApiException(500, "config", "The connection string '" + ConnectionStringName + "' is missing or not valid in Web.config.", ex);
        }
    }

    /// <summary>Runs a SELECT. dbClassSql hands a failure back as an ErrorNo / Error table; that becomes an ApiException here.</summary>
    public static DataTable Select(string sql)
    {
        dbClassSql db = Instance();
        DataTable dt;
        lock (db)
            dt = db.SelectDT(sql);
        if (dt == null)
            throw new ApiException(503, "database_unavailable", "The database returned nothing.");
        if (dt.Columns.Count == 2 && dt.Columns.Contains("ErrorNo") && dt.Columns.Contains("Error"))
            throw new ApiException(503, "database_unavailable",
                "Cannot read from SQL Server. Check CCCConString in Web.config and that the application pool account can log in to the database.",
                new InvalidOperationException(dt.Rows.Count > 0 ? Convert.ToString(dt.Rows[0]["Error"]) : "Database error."));
        return dt;
    }

    /// <summary>A quoted Unicode text literal for a SELECT: N'it''s'.</summary>
    public static string Quote(string s)
    {
        return "N'" + (s ?? "").Replace("'", "''") + "'";
    }

    /// <summary>
    /// Statements run together as one transaction through dbClassSql.ExecuteNonQueryWithCommit.
    /// Each statement brings its own parameters as name, value pairs (null becomes DBNull); names only need to be
    /// unique within the statement. An optional Guard condition must be true for any statement to run, which is how
    /// a check made before the write is held to at the moment of the write. Commit throws when nothing was written:
    /// dbClassSql reports a SQL error and a failed guard the same way, as false.
    /// </summary>
    public sealed class Batch
    {
        static readonly Regex ParamName = new Regex("@[A-Za-z_][A-Za-z0-9_]*");
        readonly StringBuilder body = new StringBuilder();
        readonly List<SqlParameter> parameters = new List<SqlParameter>();
        string guard;
        int count;

        public Batch Guard(string condition, params object[] nameValuePairs)
        {
            guard = Rename(condition, nameValuePairs, "g");
            return this;
        }

        public Batch Add(string statement, params object[] nameValuePairs)
        {
            count++;
            body.Append(Rename(statement, nameValuePairs, count.ToString(CultureInfo.InvariantCulture))).Append(";\n");
            return this;
        }

        string Rename(string text, object[] nameValuePairs, string tag)
        {
            var values = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i + 1 < nameValuePairs.Length; i += 2)
                values[(string)nameValuePairs[i]] = nameValuePairs[i + 1] ?? DBNull.Value;
            return ParamName.Replace(text, m =>
            {
                object v;
                if (!values.TryGetValue(m.Value, out v)) return m.Value;
                string unique = m.Value + "_" + tag;
                bool known = false;
                foreach (SqlParameter p in parameters) if (p.ParameterName == unique) { known = true; break; }
                if (!known) parameters.Add(new SqlParameter(unique, v));
                return unique;
            });
        }

        public void Commit(int status, string code, string message)
        {
            if (count == 0) return;
            if (parameters.Count > MaxParameters)
                throw new ApiException(400, "bad_request", "There are too many rows to save in one go.");
            string sql = "SET XACT_ABORT ON;\n" + (guard == null ? body.ToString() : "IF (" + guard + ")\nBEGIN\n" + body + "END");
            dbClassSql db = Instance();
            bool ok;
            lock (db)
                ok = db.ExecuteNonQueryWithCommit(sql, parameters.ToArray());
            if (!ok) throw new ApiException(status, code, message);
        }
    }

    public static string Str(DataRow r, string col)
    {
        object v = r[col];
        return v == DBNull.Value ? null : Convert.ToString(v, CultureInfo.InvariantCulture);
    }

    public static decimal? Dec(DataRow r, string col)
    {
        object v = r[col];
        return v == DBNull.Value ? (decimal?)null : Convert.ToDecimal(v, CultureInfo.InvariantCulture);
    }

    /// <summary>UTC time as ISO 8601, the format the page uses for dates.</summary>
    public static string Iso(DataRow r, string col)
    {
        object v = r[col];
        return v == DBNull.Value ? null : DateTime.SpecifyKind((DateTime)v, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture);
    }
}
