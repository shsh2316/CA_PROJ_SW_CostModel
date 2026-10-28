using System;
using System.Data;
using System.Security.Principal;
using System.Web;

/// <summary>
/// The person calling the API: the shared login checked by LoginModule (or, if the site is changed to use
/// Windows authentication, the Windows user).
/// Each person is added to dbo.SwAppUser on first use; set IsAdmin = 1 there to let
/// them see costs, change masters, upload Excel workbooks and verify entries.
/// </summary>
public sealed class CurrentUser
{
    public string Login { get; private set; }          // DOMAIN\username, null when anonymous
    public string DisplayName { get; private set; }
    public bool IsAdmin { get; private set; }
    public bool CanSelfVerify { get; private set; }    // may verify an entry they submitted themselves (shared login)

    public bool IsSignedIn { get { return !String.IsNullOrEmpty(Login); } }

    /// <summary>Anonymous callers need no database. Throws ApiException when the database cannot be read.</summary>
    public static CurrentUser Load(HttpContext ctx)
    {
        var u = new CurrentUser();
        IPrincipal p = ctx.User;
        if (p == null || p.Identity == null || !p.Identity.IsAuthenticated || String.IsNullOrEmpty(p.Identity.Name))
            return u;

        string login = p.Identity.Name;
        u.Login = login.Length > 200 ? login.Substring(0, 200) : login;
        u.DisplayName = ShortName(u.Login);

        string who = Db.Quote(u.Login);
        string sql =
            "MERGE dbo.SwAppUser WITH (HOLDLOCK) AS t " +
            "USING (SELECT " + who + " AS UserLogin) AS s ON t.UserLogin = s.UserLogin " +
            "WHEN MATCHED AND t.LastSeenAt < DATEADD(HOUR, -1, SYSUTCDATETIME()) THEN UPDATE SET LastSeenAt = SYSUTCDATETIME() " +
            "WHEN NOT MATCHED THEN INSERT (UserLogin, DisplayName) VALUES (" + who + ", " + Db.Quote(u.DisplayName) + "); " +
            "SELECT DisplayName, IsAdmin FROM dbo.SwAppUser WHERE UserLogin = " + who + ";";
        DataTable dt = Db.Select(sql);
        if (dt.Rows.Count > 0)
        {
            DataRow r = dt.Rows[0];
            u.DisplayName = Db.Str(r, "DisplayName") ?? u.DisplayName;
            u.IsAdmin = r["IsAdmin"] != DBNull.Value && Convert.ToBoolean(r["IsAdmin"]);
        }
        if (p.Identity.AuthenticationType == LoginModule.AuthType)
        {
            // The one shared login is the admin: there are no other people or roles.
            u.IsAdmin = true;
            u.CanSelfVerify = LoginModule.AllowSelfVerification;
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
            throw new ApiException(401, "unauthenticated", "Sign in to do this.");
    }

    public void RequireAdmin(string message)
    {
        RequireSignIn();
        if (!IsAdmin) throw new ApiException(403, "forbidden", message);
    }
}
