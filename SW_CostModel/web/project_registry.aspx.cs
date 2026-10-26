using System;
using System.Web;
using System.Web.UI;

/// <summary>
/// Code-behind for the estimator page (project_registry.aspx, formerly index.html).
/// The page itself is drawn by assets/js/estimator.js, which talks to api/estimator.ashx.
/// This class only looks up who is signed in (Windows authentication), through CurrentUser and dbClassSql,
/// and puts the result on the body tag as data-* attributes.
/// The page is always sent, even when the database cannot be reached: the script then reports the problem.
/// </summary>
public partial class ProjectRegistryPage : Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        Response.Cache.SetCacheability(HttpCacheability.NoCache);
        Response.Cache.SetNoStore();

        CurrentUser user = null;
        try { user = CurrentUser.Load(Context); }
        catch (ApiException) { }   // database unreachable: the page still opens and the script reports it

        pageBody.Attributes["data-signed-in"] = user != null && user.IsSignedIn ? "1" : "0";
        pageBody.Attributes["data-user"] = user != null ? user.DisplayName ?? "" : "";
        pageBody.Attributes["data-admin"] = user != null && user.IsAdmin ? "1" : "0";
    }
}
