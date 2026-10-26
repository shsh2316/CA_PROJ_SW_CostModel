using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;

/// <summary>
/// SQL Server access. The connection string is CCCConString in web.config, the same entry dbClassSql uses.
/// </summary>
public static class Db
{
    public const string ConnectionStringName = "CCCConString";

    public static SqlConnection Open()
    {
        ConnectionStringSettings cs = ConfigurationManager.ConnectionStrings[ConnectionStringName];
        if (cs == null || String.IsNullOrWhiteSpace(cs.ConnectionString))
            throw new ApiException(500, "config", "The connection string '" + ConnectionStringName + "' is missing from web.config.");
        var conn = new SqlConnection(cs.ConnectionString);
        try
        {
            conn.Open();
        }
        catch (SqlException ex)
        {
            conn.Dispose();
            throw new ApiException(503, "database_unavailable",
                "Cannot connect to SQL Server. Check CCCConString in web.config and that the application pool account can log in to the database.", ex);
        }
        return conn;
    }

    /// <summary>Builds a command. Parameters are given as name, value pairs; null becomes DBNull.</summary>
    public static SqlCommand Command(SqlConnection conn, SqlTransaction tx, string sql, params object[] nameValuePairs)
    {
        var cmd = new SqlCommand(sql, conn, tx);
        for (int i = 0; i + 1 < nameValuePairs.Length; i += 2)
            cmd.Parameters.AddWithValue((string)nameValuePairs[i], nameValuePairs[i + 1] ?? DBNull.Value);
        return cmd;
    }

    public static int Execute(SqlConnection conn, SqlTransaction tx, string sql, params object[] nameValuePairs)
    {
        using (SqlCommand cmd = Command(conn, tx, sql, nameValuePairs))
            return cmd.ExecuteNonQuery();
    }

    public static string Str(IDataRecord r, string col)
    {
        object v = r[col];
        return v == DBNull.Value ? null : Convert.ToString(v, CultureInfo.InvariantCulture);
    }

    public static decimal? Dec(IDataRecord r, string col)
    {
        object v = r[col];
        return v == DBNull.Value ? (decimal?)null : Convert.ToDecimal(v, CultureInfo.InvariantCulture);
    }

    /// <summary>UTC time as ISO 8601, the format the page uses for dates.</summary>
    public static string Iso(IDataRecord r, string col)
    {
        object v = r[col];
        return v == DBNull.Value ? null : DateTime.SpecifyKind((DateTime)v, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture);
    }
}
