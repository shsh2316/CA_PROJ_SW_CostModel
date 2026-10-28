using System;
using System.Web;
using System.Web.UI;

/// <summary>
/// Code-behind for the Excel upload page (project_upload.aspx).
/// The page is drawn by assets/js/upload.js, which makes the template, reads the filled workbooks and submits
/// the projects through api/estimator.ashx (the same calls the estimator makes). Nothing is read from the
/// database here; the sign-in check is done by LoginModule before this page runs.
/// </summary>
public partial class ProjectUploadPage : Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        Response.Cache.SetCacheability(HttpCacheability.NoCache);
        Response.Cache.SetNoStore();
    }
}
