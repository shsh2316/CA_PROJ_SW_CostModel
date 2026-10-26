using System;
using System.Data.SqlClient;
using System.Security.Principal;
using System.Web;

/// <summary>
/// The person calling the API, from Windows authentication in IIS.
/// Each person is added to dbo.SwAppUser on first use; set IsAdmin = 1 there to let
/// them see costs, change masters, upload Excel workbooks and verify entries.
/// </summary>
public sealed class CurrentUser
{
    public string Login { get; private set; }          // DOMAIN\username, null when anonymous
    public string DisplayName { get; private set; }
    public bool IsAdmin { get; private set; }

    public bool IsSignedIn { get { return !String.IsNullOrEmpty(Login); } }

    public static CurrentUser Load(HttpContext ctx, SqlConnection conn)
    {
        var u = new CurrentUser();
        IPrincipal p = ctx.User;
        if (p == null || p.Identity == null || !p.Identity.IsAuthenticated || String.IsNullOrEmpty(p.Identity.Name))
            return u;

        string login = p.Identity.Name;
        u.Login = login.Length > 200 ? login.Substring(0, 200) : login;
        u.DisplayName = ShortName(u.Login);

        const string sql =
            "MERGE dbo.SwAppUser WITH (HOLDLOCK) AS t " +
            "USING (SELECT @login AS UserLogin) AS s ON t.UserLogin = s.UserLogin " +
            "WHEN MATCHED AND t.LastSeenAt < DATEADD(HOUR, -1, SYSUTCDATETIME()) THEN UPDATE SET LastSeenAt = SYSUTCDATETIME() " +
            "WHEN NOT MATCHED THEN INSERT (UserLogin, DisplayName) VALUES (@login, @name); " +
            "SELECT DisplayName, IsAdmin FROM dbo.SwAppUser WHERE UserLogin = @login;";
        using (SqlCommand cmd = Db.Command(conn, null, sql, "@login", u.Login, "@name", u.DisplayName))
        using (SqlDataReader r = cmd.ExecuteReader())
        {
            if (r.Read())
            {
                u.DisplayName = Db.Str(r, "DisplayName") ?? u.DisplayName;
                u.IsAdmin = (bool)r["IsAdmin"];
            }
        }
        return u;
    }

    /// <summary>DOMAIN\jdoe -> jdoe</summary>
    public static string ShortName(string login)
    {
        if (String.IsNullOrEmpty(login)) return login;
        int i = login.LastIndexOf('\\');
        return i >= 0 ? login.Substring(i + 1) : login;
    }

    public bool Is(string login)
    {
        return IsSignedIn && String.Equals(Login, login, StringComparison.OrdinalIgnoreCase);
    }

    public void RequireSignIn()
    {
        if (!IsSignedIn)
            throw new ApiException(401, "unauthenticated", "Sign in with your Windows account to do this. Ask the administrator to turn on Windows Authentication for this site.");
    }

    public void RequireAdmin(string message)
    {
        RequireSignIn();
        if (!IsAdmin) throw new ApiException(403, "forbidden", message);
    }
}
