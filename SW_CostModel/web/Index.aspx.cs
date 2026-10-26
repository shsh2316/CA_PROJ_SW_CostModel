using System;
using System.Data;
using System.Security.Principal;
using System.Web;
using System.Web.UI;
using Ports;

/// <summary>
/// Code-behind for the estimator page (Index.aspx, formerly index.html).
/// The page itself is drawn by assets/js/estimator.js, which talks to api/estimator.ashx.
/// This class only looks up who is signed in (Windows authentication) through dbClassSql, registers
/// them in dbo.SwAppUser on first visit, and puts the result on the body tag as data-* attributes.
/// The page is always sent, even when the database cannot be reached: the script then reports the problem.
/// </summary>
public partial class IndexPage : Page
{
    // dbClassSql keeps one shared connection, which cannot run two commands at once.
    static readonly object DbLock = new object();

    protected void Page_Load(object sender, EventArgs e)
    {
        Response.Cache.SetCacheability(HttpCacheability.NoCache);
        Response.Cache.SetNoStore();

        string name;
        bool isAdmin;
        bool signedIn = LoadUser(out name, out isAdmin);

        pageBody.Attributes["data-signed-in"] = signedIn ? "1" : "0";
        pageBody.Attributes["data-user"] = name ?? "";
        pageBody.Attributes["data-admin"] = isAdmin ? "1" : "0";
    }

    /// <summary>Same rules as CurrentUser.Load: add the person on first use, then read their name and admin flag.</summary>
    static bool LoadUser(out string displayName, out bool isAdmin)
    {
        displayName = null;
        isAdmin = false;

        IPrincipal p = HttpContext.Current.User;
        if (p == null || p.Identity == null || !p.Identity.IsAuthenticated || String.IsNullOrEmpty(p.Identity.Name))
            return false;

        string login = p.Identity.Name;
        if (login.Length > 200) login = login.Substring(0, 200);
        displayName = CurrentUser.ShortName(login);

        // dbClassSql takes finished SQL text, so quote the values here.
        string sqlLogin = "N'" + login.Replace("'", "''") + "'";
        string sqlName = "N'" + displayName.Replace("'", "''") + "'";
        string sql =
            "MERGE dbo.SwAppUser WITH (HOLDLOCK) AS t " +
            "USING (SELECT " + sqlLogin + " AS UserLogin) AS s ON t.UserLogin = s.UserLogin " +
            "WHEN MATCHED AND t.LastSeenAt < DATEADD(HOUR, -1, SYSUTCDATETIME()) THEN UPDATE SET LastSeenAt = SYSUTCDATETIME() " +
            "WHEN NOT MATCHED THEN INSERT (UserLogin, DisplayName) VALUES (" + sqlLogin + ", " + sqlName + "); " +
            "SELECT DisplayName, IsAdmin FROM dbo.SwAppUser WHERE UserLogin = " + sqlLogin + ";";

        try
        {
            DataTable dt;
            lock (DbLock)
                dt = dbClassSql.getdbClassInstance.SelectDT(sql);

            // dbClassSql reports a failure as a table with ErrorNo and Error columns.
            if (dt == null || dt.Columns.Contains("Error") || dt.Rows.Count == 0)
                return true;

            DataRow row = dt.Rows[0];
            if (!(row["DisplayName"] is DBNull)) displayName = Convert.ToString(row["DisplayName"]);
            isAdmin = !(row["IsAdmin"] is DBNull) && Convert.ToBoolean(row["IsAdmin"]);
        }
        catch (Exception)
        {
            // Includes a missing CCCConString entry (the static constructor of dbClassSql throws). Keep the page up.
        }
        return true;
    }
}
