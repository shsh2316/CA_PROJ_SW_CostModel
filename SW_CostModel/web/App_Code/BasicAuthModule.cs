using System;
using System.Configuration;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Web;

/// <summary>
/// One shared login for the whole site (HTTP Basic), checked on every request: the pages, the API and the files.
/// The user name and the SHA-256 of the password come from appSettings in Web.config
/// (BasicAuthUser, BasicAuthPasswordSha256), so the password itself is not stored anywhere.
/// A person who signs in is the one account, and that account is an admin (see CurrentUser).
/// Basic sends the password with every request in a form that is easy to read: use it over HTTPS.
/// </summary>
public sealed class BasicAuthModule : IHttpModule
{
    public const string AuthType = "CA-Basic";
    const string Realm = "Central Automation Estimator";

    public void Init(HttpApplication app)
    {
        app.AuthenticateRequest += OnAuthenticateRequest;
    }

    public void Dispose() { }

    /// <summary>appSettings AllowSelfVerification = true lets the one shared account verify entries it submitted itself.</summary>
    public static bool AllowSelfVerification
    {
        get { return String.Equals(Setting("AllowSelfVerification"), "true", StringComparison.OrdinalIgnoreCase); }
    }

    static string Setting(string key)
    {
        return (ConfigurationManager.AppSettings[key] ?? "").Trim();
    }

    static void OnAuthenticateRequest(object sender, EventArgs e)
    {
        HttpContext ctx = ((HttpApplication)sender).Context;
        string user, password;
        bool sent = TryReadCredentials(ctx.Request, out user, out password);
        if (sent && Matches(user, password))
        {
            ctx.User = new GenericPrincipal(new GenericIdentity(user, AuthType), new string[0]);
            return;
        }
        if (sent) Thread.Sleep(750);   // slows down guessing
        Challenge(ctx);
    }

    static bool TryReadCredentials(HttpRequest request, out string user, out string password)
    {
        user = password = null;
        string header = request.Headers["Authorization"];
        if (String.IsNullOrEmpty(header) || !header.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase)) return false;
        try
        {
            string decoded = Encoding.UTF8.GetString(Convert.FromBase64String(header.Substring(6).Trim()));
            int colon = decoded.IndexOf(':');
            if (colon < 0) return false;
            user = decoded.Substring(0, colon);
            password = decoded.Substring(colon + 1);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    static bool Matches(string user, string password)
    {
        string expectedUser = Setting("BasicAuthUser"), expectedHash = Setting("BasicAuthPasswordSha256").ToLowerInvariant();
        if (expectedUser.Length == 0 || expectedHash.Length == 0) return false;   // not configured: nobody gets in

        string hash;
        using (SHA256 sha = SHA256.Create())
            hash = BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(password))).Replace("-", "").ToLowerInvariant();

        bool userOk = FixedTimeEquals(Encoding.UTF8.GetBytes(user), Encoding.UTF8.GetBytes(expectedUser));
        bool passOk = FixedTimeEquals(Encoding.ASCII.GetBytes(hash), Encoding.ASCII.GetBytes(expectedHash));
        return userOk & passOk;
    }

    static bool FixedTimeEquals(byte[] a, byte[] b)
    {
        int diff = a.Length ^ b.Length;
        for (int i = 0; i < Math.Max(a.Length, b.Length); i++)
            diff |= (i < a.Length ? a[i] : 0) ^ (i < b.Length ? b[i] : 0);
        return diff == 0;
    }

    static void Challenge(HttpContext ctx)
    {
        HttpResponse res = ctx.Response;
        res.Clear();
        res.StatusCode = 401;
        res.StatusDescription = "Unauthorized";
        res.AddHeader("WWW-Authenticate", "Basic realm=\"" + Realm + "\", charset=\"UTF-8\"");
        res.ContentType = "text/plain";
        res.Write("Sign in to continue.");
        res.TrySkipIisCustomErrors = true;
        res.SuppressFormsAuthenticationRedirect = true;
        ctx.ApplicationInstance.CompleteRequest();
    }
}
