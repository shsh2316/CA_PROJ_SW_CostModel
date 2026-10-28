using System;
using System.IO;
using System.Web;
using System.Web.UI;

/// <summary>
/// The login page (Default.aspx). Any user name, one shared password (see LoginModule). Errors are shown on the page,
/// not in an alert box. ?logout=1 signs out. After signing in the person goes back to the page they asked for.
/// The page has no server controls, so it needs no designer file.
/// </summary>
public partial class LoginPage : Page
{
    const string AppStart = "~/SW_CostModel/web/project_registry.aspx";

    // Written where Default.aspx has <%= ... %> / <%: ... %>. MessageHtml and LogoHtml are finished HTML.
    protected string MessageHtml = "", LogoHtml = "", UserValue = "";

    protected void Page_Load(object sender, EventArgs e)
    {
        Response.Cache.SetCacheability(HttpCacheability.NoCache);
        Response.Cache.SetNoStore();

        string logo = Server.MapPath("~/Assets/images/AMNS_Logo_Small.png");
        if (File.Exists(logo))
            LogoHtml = "<img class=\"logo\" src=\"" + HttpUtility.HtmlAttributeEncode(ResolveUrl("~/Assets/images/AMNS_Logo_Small.png")) + "\" alt=\"AM/NS India\">";

        if (Request.QueryString["logout"] == "1")
        {
            LoginModule.SignOut(Context);
            MessageHtml = "<span class=\"text-success\">You have been signed out.</span>";
            return;
        }

        if (Request.HttpMethod == "POST")
        {
            string address = Request.UserHostAddress;
            int wait = LoginModule.MinutesLockedOut(address);
            if (wait > 0)
            {
                MessageHtml = "Too many wrong passwords. Try again in " + wait + (wait == 1 ? " minute." : " minutes.");
                return;
            }
            string user = Request.Form["user"] ?? "";
            if (LoginModule.CheckPassword(Request.Form["password"]))
            {
                LoginModule.RegisterSuccess(address);
                LoginModule.SignIn(Context, user);
                Response.Redirect(ReturnTarget(), false);
                Context.ApplicationInstance.CompleteRequest();
                return;
            }
            LoginModule.RegisterFailure(address);
            UserValue = user.Length > 100 ? user.Substring(0, 100) : user;
            MessageHtml = "Incorrect password.";
            return;
        }

        // Already signed in: go straight on.
        if (Context.User != null && Context.User.Identity.IsAuthenticated)
        {
            Response.Redirect(ReturnTarget(), false);
            Context.ApplicationInstance.CompleteRequest();
        }
    }

    /// <summary>The page the person asked for before being sent here, if it is a path on this site; otherwise the estimator.</summary>
    string ReturnTarget()
    {
        string back = Request.QueryString["returnUrl"];
        return IsLocalPath(back) ? back : ResolveUrl(AppStart);
    }

    /// <summary>
    /// True only for a plain path on this site such as /SW_CostModel/web/project_report.aspx?fy=2025-26.
    /// Not allowed: another site (//host, /\host), anything with a control character (a tab or line break is dropped by
    /// browsers, so /&lt;tab&gt;/host would become //host), a backslash, or a path that is not rooted.
    /// </summary>
    public static bool IsLocalPath(string url)
    {
        if (String.IsNullOrEmpty(url) || url.Length > 2000 || url[0] != '/') return false;
        if (url.Length > 1 && (url[1] == '/' || url[1] == '\\')) return false;
        foreach (char c in url)
            if (c < 0x20 || c == 0x7f || c == '\\') return false;
        return true;
    }
}
