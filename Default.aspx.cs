using System;
using System.IO;
using System.Threading;
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
            LogoHtml = "<img src=\"" + HttpUtility.HtmlAttributeEncode(ResolveUrl("~/Assets/images/AMNS_Logo_Small.png")) + "\" alt=\"AM/NS India\">";

        if (Request.QueryString["logout"] == "1")
        {
            LoginModule.SignOut(Context);
            MessageHtml = "<span class=\"ok\">You have been signed out.</span>";
            return;
        }

        if (Request.HttpMethod == "POST")
        {
            string user = Request.Form["user"] ?? "";
            if (LoginModule.CheckPassword(Request.Form["password"]))
            {
                LoginModule.SignIn(Context, user);
                Response.Redirect(ReturnTarget(), false);
                Context.ApplicationInstance.CompleteRequest();
                return;
            }
            Thread.Sleep(750);   // slows down guessing
            UserValue = user;
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

    /// <summary>The page the person asked for before being sent here, if it is on this site; otherwise the estimator.</summary>
    string ReturnTarget()
    {
        string back = Request.QueryString["returnUrl"];
        if (!String.IsNullOrEmpty(back) && back.StartsWith("/") && !back.StartsWith("//") && !back.StartsWith("/\\"))
            return back;
        return ResolveUrl(AppStart);
    }
}
