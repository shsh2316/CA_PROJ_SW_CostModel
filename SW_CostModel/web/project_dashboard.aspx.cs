using System;
using System.Web;
using System.Web.UI;

/// <summary>
/// Code-behind for the dashboard (project_dashboard.aspx).
/// The page is drawn by assets/js/dashboard.js from api/estimator.ashx?action=projects&lite=1 (the register without
/// each saved estimate). Nothing is read from the
/// database here; the sign-in check is done by LoginModule before this page runs.
/// Only the dashboard administrator (LoginModule.IsDashboardAdmin) may open it: anyone else goes to the login page to sign in as the administrator.
/// </summary>
public partial class ProjectDashboardPage : Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        Response.Cache.SetCacheability(HttpCacheability.NoCache);
        Response.Cache.SetNoStore();
        if (!LoginModule.IsDashboardAdmin(Context))
        {
            Response.Redirect(ResolveUrl(LoginModule.LoginPath) + "?admin=1&returnUrl=" + HttpUtility.UrlEncode(Request.RawUrl), false);
            Context.ApplicationInstance.CompleteRequest();
        }
    }
}
