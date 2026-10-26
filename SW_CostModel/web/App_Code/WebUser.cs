using System;
using System.Data;
using System.Security.Principal;
using System.Web;
using Ports;

/// <summary>
/// The signed-in Windows user for the .aspx pages, read through dbClassSql.
/// Same rules as CurrentUser, which the JSON API uses: a person is added to dbo.SwAppUser on first visit,
/// and only IsAdmin = 1 people see costs. If the database cannot be read the person counts as a non-admin.
/// </summary>
public sealed class WebUser
{
    public string Login { get; private set; }          // DOMAIN\username, null when anonymous
    public string DisplayName { get; private set; }
    public bool IsAdmin { get; private set; }
    public bool DbError { get; private set; }

    public bool IsSignedIn { get { return !String.IsNullOrEmpty(Login); } }

    public static WebUser Load(HttpContext ctx)
    {
        var u = new WebUser();
        IPrincipal p = ctx.User;
        if (p == null || p.Identity == null || !p.Identity.IsAuthenticated || String.IsNullOrEmpty(p.Identity.Name))
            return u;

        string login = p.Identity.Name;
        u.Login = login.Length > 200 ? login.Substring(0, 200) : login;
        u.DisplayName = CurrentUser.ShortName(u.Login);

        string who = Quote(u.Login);
        string sql =
            "MERGE dbo.SwAppUser WITH (HOLDLOCK) AS t " +
            "USING (SELECT " + who + " AS UserLogin) AS s ON t.UserLogin = s.UserLogin " +
            "WHEN MATCHED AND t.LastSeenAt < DATEADD(HOUR, -1, SYSUTCDATETIME()) THEN UPDATE SET LastSeenAt = SYSUTCDATETIME() " +
            "WHEN NOT MATCHED THEN INSERT (UserLogin, DisplayName) VALUES (" + who + ", " + Quote(u.DisplayName) + "); " +
            "SELECT DisplayName, IsAdmin FROM dbo.SwAppUser WHERE UserLogin = " + who + ";";
        try
        {
            DataTable dt;
            // dbClassSql keeps one shared connection that cannot run two commands at once, so every page locks on its instance.
            lock (dbClassSql.getdbClassInstance)
                dt = dbClassSql.getdbClassInstance.SelectDT(sql);
            // dbClassSql reports a failure as a table with ErrorNo and Error columns.
            if (dt == null || dt.Columns.Contains("Error")) { u.DbError = true; return u; }
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                if (!(row["DisplayName"] is DBNull)) u.DisplayName = Convert.ToString(row["DisplayName"]);
                u.IsAdmin = !(row["IsAdmin"] is DBNull) && Convert.ToBoolean(row["IsAdmin"]);
            }
        }
        catch (Exception)
        {
            // Includes a missing CCCConString entry (the static constructor of dbClassSql throws).
            u.DbError = true;
        }
        return u;
    }

    /// <summary>dbClassSql takes finished SQL text with no parameters, so values are quoted here: N'it''s'.</summary>
    public static string Quote(string s)
    {
        return "N'" + (s ?? "").Replace("'", "''") + "'";
    }
}
