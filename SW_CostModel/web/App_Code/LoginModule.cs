using System;
using System.Configuration;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Web;
using System.Web.Security;

/// <summary>
/// The site's one shared login, checked on every request.
/// Default.aspx is the login page: any user name, one password (appSettings LoginPasswordSha256 holds its SHA-256,
/// so the password itself is not stored). A correct password sets a signed and encrypted cookie (machine key);
/// this module reads the cookie on each request. Without it, pages redirect to the login page and the API answers
/// 401 with JSON. Whoever signs in is an admin (see CurrentUser): there are no other roles.
/// The cookie holds only the typed name and an expiry time. Use HTTPS so the password and cookie are not readable on the network.
/// </summary>
public sealed class LoginModule : IHttpModule
{
    public const string AuthType = "CA-Login";
    const string CookieName = "CA_LOGIN";
    const string Purpose = "CA_LOGIN v1";
    public const string LoginPath = "~/Default.aspx";

    public void Init(HttpApplication app)
    {
        app.AuthenticateRequest += OnAuthenticateRequest;
    }

    public void Dispose() { }

    /// <summary>appSettings AllowSelfVerification = true lets a signed-in person verify entries they submitted themselves.</summary>
    public static bool AllowSelfVerification
    {
        get { return String.Equals(Setting("AllowSelfVerification"), "true", StringComparison.OrdinalIgnoreCase); }
    }

    static string Setting(string key)
    {
        return (ConfigurationManager.AppSettings[key] ?? "").Trim();
    }

    static double SessionHours
    {
        get
        {
            double h;
            return Double.TryParse(Setting("LoginHours"), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out h) && h > 0 ? h : 8;
        }
    }

    static void OnAuthenticateRequest(object sender, EventArgs e)
    {
        HttpContext ctx = ((HttpApplication)sender).Context;
        string user = ReadCookie(ctx.Request);
        if (user != null)
        {
            ctx.User = new GenericPrincipal(new GenericIdentity(user, AuthType), new string[0]);
            return;
        }
        string path = ctx.Request.AppRelativeCurrentExecutionFilePath ?? "~/";
        if (IsPublic(path)) return;
        Deny(ctx, path);
    }

    /// <summary>What can be opened without signing in: the login page and the files it needs.</summary>
    static bool IsPublic(string path)
    {
        return path == "~/"
            || path.Equals(LoginPath, StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("~/assets/", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("~/Assets/", StringComparison.OrdinalIgnoreCase)
            || path.Equals("~/favicon.ico", StringComparison.OrdinalIgnoreCase);
    }

    static void Deny(HttpContext ctx, string path)
    {
        HttpResponse res = ctx.Response;
        if (path.EndsWith(".ashx", StringComparison.OrdinalIgnoreCase))
        {
            res.Clear();
            res.StatusCode = 401;
            res.ContentType = "application/json";
            res.Write("{\"error\":{\"code\":\"unauthenticated\",\"message\":\"Sign in to continue.\"}}");
            res.TrySkipIisCustomErrors = true;
        }
        else
        {
            res.Redirect(VirtualPathUtility.ToAbsolute(LoginPath) + "?returnUrl=" + HttpUtility.UrlEncode(ctx.Request.RawUrl), false);
        }
        ctx.ApplicationInstance.CompleteRequest();
    }

    /* ---------- password ---------- */

    /// <summary>True when the password matches appSettings LoginPasswordSha256. Not configured: nobody gets in.</summary>
    public static bool CheckPassword(string password)
    {
        string expected = Setting("LoginPasswordSha256").ToLowerInvariant();
        if (expected.Length == 0 || password == null) return false;
        string hash;
        using (SHA256 sha = SHA256.Create())
            hash = BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(password))).Replace("-", "").ToLowerInvariant();
        return FixedTimeEquals(Encoding.ASCII.GetBytes(hash), Encoding.ASCII.GetBytes(expected));
    }

    static bool FixedTimeEquals(byte[] a, byte[] b)
    {
        int diff = a.Length ^ b.Length;
        for (int i = 0; i < Math.Max(a.Length, b.Length); i++)
            diff |= (i < a.Length ? a[i] : 0) ^ (i < b.Length ? b[i] : 0);
        return diff == 0;
    }

    /* ---------- cookie ---------- */

    /// <summary>Signs the person in: any name is accepted, it is only recorded as who submitted and approved entries.</summary>
    public static void SignIn(HttpContext ctx, string name)
    {
        name = CleanName(name);
        string ticket = "v1|" + DateTime.UtcNow.AddHours(SessionHours).Ticks + "|" + name;
        byte[] protectedBytes = MachineKey.Protect(Encoding.UTF8.GetBytes(ticket), Purpose);
        var cookie = new HttpCookie(CookieName, HttpServerUtility.UrlTokenEncode(protectedBytes))
        {
            HttpOnly = true,
            Secure = ctx.Request.IsSecureConnection,
            Path = ctx.Request.ApplicationPath
        };
        ctx.Response.Cookies.Add(cookie);
    }

    public static void SignOut(HttpContext ctx)
    {
        var cookie = new HttpCookie(CookieName, "") { HttpOnly = true, Expires = DateTime.UtcNow.AddDays(-1), Path = ctx.Request.ApplicationPath };
        ctx.Response.Cookies.Add(cookie);
    }

    /// <summary>The signed-in name from the cookie, or null when there is no valid, unexpired cookie.</summary>
    static string ReadCookie(HttpRequest request)
    {
        HttpCookie cookie = request.Cookies[CookieName];
        if (cookie == null || String.IsNullOrEmpty(cookie.Value)) return null;
        try
        {
            byte[] bytes = MachineKey.Unprotect(HttpServerUtility.UrlTokenDecode(cookie.Value), Purpose);
            if (bytes == null) return null;
            string[] parts = Encoding.UTF8.GetString(bytes).Split(new[] { '|' }, 3);
            long expires;
            if (parts.Length != 3 || parts[0] != "v1" || !Int64.TryParse(parts[1], out expires)) return null;
            if (expires < DateTime.UtcNow.Ticks) return null;
            return CleanName(parts[2]);
        }
        catch (Exception)
        {
            return null;   // not ours, tampered with, or from before the machine key changed
        }
    }

    /// <summary>Trimmed, no control characters, at most 100 characters; empty becomes "User".</summary>
    public static string CleanName(string name)
    {
        var sb = new StringBuilder();
        foreach (char c in name ?? "")
            if (!Char.IsControl(c) && c != '|') sb.Append(c);
        string s = sb.ToString().Trim();
        if (s.Length > 100) s = s.Substring(0, 100).Trim();
        return s.Length == 0 ? "User" : s;
    }
}
