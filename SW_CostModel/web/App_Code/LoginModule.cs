using System;
using System.Collections.Generic;
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
    const string Purpose = "CA_LOGIN v2";
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

    /// <summary>How long a sign-in lasts: appSettings LoginHours, 1 to 720 (8 when missing or not a number).</summary>
    static double SessionHours
    {
        get
        {
            double h;
            if (!Double.TryParse(Setting("LoginHours"), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out h) || Double.IsNaN(h)) return 8;
            return Math.Min(720, Math.Max(1, h));
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
        if (path == "~/" || path.Equals(LoginPath, StringComparison.OrdinalIgnoreCase) || path.Equals("~/favicon.ico", StringComparison.OrdinalIgnoreCase))
            return true;
        foreach (string folder in PublicFolders)
            if (path.StartsWith(folder, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    // Files the login page needs: the site's own styles, scripts and fonts, and the libraries the login page uses
    // (Bootstrap and Font Awesome in Content, Scripts, Standards, fonts), all served from this site.
    static readonly string[] PublicFolders =
    {
        "~/SW_CostModel/web/assets/", "~/assets/", "~/Assets/", "~/Content/", "~/Scripts/", "~/Standards/", "~/fonts/"
    };

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

    /* ---------- failed sign-ins: lock an address out for a while ---------- */

    const int MaxFailures = 5;
    static readonly TimeSpan FailureWindow = TimeSpan.FromMinutes(10), LockTime = TimeSpan.FromMinutes(5);
    static readonly Dictionary<string, Attempts> Failures = new Dictionary<string, Attempts>();

    sealed class Attempts
    {
        public int Count;
        public DateTime First, LockedUntil;
    }

    /// <summary>Whole minutes (at least 1) the address must wait, or 0 when it may try.</summary>
    public static int MinutesLockedOut(string address)
    {
        lock (Failures)
        {
            Attempts a;
            if (!Failures.TryGetValue(address ?? "", out a) || a.LockedUntil <= DateTime.UtcNow) return 0;
            return (int)Math.Max(1, Math.Ceiling((a.LockedUntil - DateTime.UtcNow).TotalMinutes));
        }
    }

    /// <summary>Counts a wrong password; after MaxFailures within ten minutes the address is locked out for five.</summary>
    public static void RegisterFailure(string address)
    {
        lock (Failures)
        {
            DateTime now = DateTime.UtcNow;
            if (Failures.Count > 5000)
            {
                var old = new List<string>();
                foreach (KeyValuePair<string, Attempts> kv in Failures)
                    if (kv.Value.LockedUntil < now && now - kv.Value.First > FailureWindow) old.Add(kv.Key);
                foreach (string k in old) Failures.Remove(k);
            }
            Attempts a;
            if (!Failures.TryGetValue(address ?? "", out a)) Failures[address ?? ""] = a = new Attempts { First = now };
            if (now - a.First > FailureWindow) { a.Count = 0; a.First = now; }
            if (++a.Count >= MaxFailures) { a.LockedUntil = now + LockTime; a.Count = 0; a.First = now; }
        }
    }

    public static void RegisterSuccess(string address)
    {
        lock (Failures) Failures.Remove(address ?? "");
    }

    /* ---------- cookie ---------- */

    /// <summary>The first characters of the configured password hash: a sign-in made with an older password stops working when the password changes.</summary>
    static string PasswordTag()
    {
        string h = Setting("LoginPasswordSha256").ToLowerInvariant();
        return h.Length > 12 ? h.Substring(0, 12) : h;
    }

    /// <summary>Signs the person in: any name is accepted, it is only recorded as who submitted and approved entries.</summary>
    public static void SignIn(HttpContext ctx, string name)
    {
        name = CleanName(name);
        string ticket = "v2|" + DateTime.UtcNow.AddHours(SessionHours).Ticks + "|" + PasswordTag() + "|" + name;
        byte[] protectedBytes = MachineKey.Protect(Encoding.UTF8.GetBytes(ticket), Purpose);
        var cookie = new HttpCookie(CookieName, HttpServerUtility.UrlTokenEncode(protectedBytes))
        {
            HttpOnly = true,
            Secure = ctx.Request.IsSecureConnection,
            Path = ctx.Request.ApplicationPath
        };
#if !__MonoCS__
        cookie.SameSite = SameSiteMode.Lax;   // .NET Framework 4.7.2 and later (Mono, used only for testing off Windows, has no SameSite)
#endif
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
            string[] parts = Encoding.UTF8.GetString(bytes).Split(new[] { '|' }, 4);
            long expires;
            if (parts.Length != 4 || parts[0] != "v2" || !Int64.TryParse(parts[1], out expires)) return null;
            if (expires < DateTime.UtcNow.Ticks) return null;
            if (!String.Equals(parts[2], PasswordTag(), StringComparison.Ordinal)) return null;   // the password was changed since
            return CleanName(parts[3]);
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
