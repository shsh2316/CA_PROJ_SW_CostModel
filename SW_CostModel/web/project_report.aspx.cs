using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;

/// <summary>
/// Project report: the register of estimates (dbo.SwProjectRegister) to look at, filter and download as CSV.
/// All database access goes through Db, which uses dbClassSql. The visibility rules are the same as the JSON API:
///   - not signed in: nothing
///   - admins: every entry, with the cost figures
///   - everyone else: only their own entries, without any cost figures
/// Filters travel in the query string (plain GET form), so no postback script is needed under the site's
/// Content-Security-Policy. "download=csv" sends the same rows as a CSV file; "id=..." shows one project.
/// </summary>
public partial class ProjectReportPage : Page
{
    static readonly Regex FinYear = new Regex(@"^\d{4}-\d{2}$");
    static readonly CultureInfo Inr = new CultureInfo("en-IN");

    static readonly string[][] Kinds = { new[] { "new", "New project" }, new[] { "amc", "Maintenance (AMC)" }, new[] { "enh", "Enhancement" } };
    static readonly string[][] Statuses = { new[] { "planned", "Planned" }, new[] { "progress", "In progress" }, new[] { "completed", "Completed" } };
    static readonly string[][] Reviews = { new[] { "pending", "Awaiting review" }, new[] { "info", "More information needed" }, new[] { "verified", "Verified" } };
    static readonly string[][] Models = { new[] { "once", "One-time setup" }, new[] { "yearly", "Yearly model" } };
    static readonly string[][] Types =
    {
        new[] { "web", "Web application" }, new[] { "desktop", "Windows desktop application" }, new[] { "mobile", "Mobile app" },
        new[] { "interface", "Interface / integration" }, new[] { "dash", "Dashboard / reporting" }, new[] { "ai", "AI / vision system" }
    };
    static readonly string[][] LogActions = { new[] { "submit", "Submitted" }, new[] { "reply", "Replied" }, new[] { "info", "Asked for information" }, new[] { "verify", "Verified" }, new[] { "recalc", "Recalculated" } };

    enum Fmt { Text, Lookup, Person, Money, Number, Date }

    class Col
    {
        public string Name, Header;
        public Fmt Format;
        public string[][] Map;
        public bool AdminOnly, InList;
        public Col(string name, string header, Fmt format, string[][] map, bool adminOnly, bool inList)
        {
            Name = name; Header = header; Format = format; Map = map; AdminOnly = adminOnly; InList = inList;
        }
    }

    // Order is the order of the table, the detail view and the CSV. AdminOnly columns are never selected for anyone else.
    static readonly Col[] Cols =
    {
        new Col("ProjectName", "Project", Fmt.Text, null, false, true),
        new Col("Department", "Department / client", Fmt.Text, null, false, true),
        new Col("FinYear", "Financial year", Fmt.Text, null, false, true),
        new Col("Kind", "Record as", Fmt.Lookup, Kinds, false, true),
        new Col("Status", "Project status", Fmt.Lookup, Statuses, false, true),
        new Col("DeliveryModel", "Delivery model", Fmt.Lookup, Models, false, false),
        new Col("ProjectType", "Project type", Fmt.Lookup, Types, false, false),
        new Col("Workflow", "Review state", Fmt.Lookup, Reviews, false, true),
        new Col("PersonDays", "Person-days", Fmt.Number, null, false, true),
        new Col("TeamSize", "Team size", Fmt.Number, null, false, true),
        new Col("ValueINR", "Central Automation cost (INR)", Fmt.Money, null, true, true),
        new Col("BenchmarkValueINR", "Benchmark cost (INR)", Fmt.Money, null, true, true),
        new Col("ChargedINR", "Charged (INR)", Fmt.Money, null, true, true),
        new Col("OneTimeINR", "One-time cost (INR)", Fmt.Money, null, true, true),
        new Col("YearlyRunINR", "Yearly running cost (INR)", Fmt.Money, null, true, true),
        new Col("BenchmarkOneTimeINR", "Benchmark one-time cost (INR)", Fmt.Money, null, true, false),
        new Col("BenchmarkYearlyRunINR", "Benchmark yearly running cost (INR)", Fmt.Money, null, true, false),
        new Col("ValueCreatedOneTimeINR", "Value created, one-time (INR)", Fmt.Money, null, true, false),
        new Col("ValueCreatedYearlyINR", "Value created, per year (INR)", Fmt.Money, null, true, false),
        new Col("SubmittedBy", "Submitted by", Fmt.Person, null, false, true),
        new Col("SubmittedAt", "Submitted on", Fmt.Date, null, false, false),
        new Col("VerifiedBy", "Verified by", Fmt.Person, null, false, false),
        new Col("VerifiedAt", "Verified on", Fmt.Date, null, false, false),
        new Col("CostedBy", "Costed by", Fmt.Person, null, true, false),
        new Col("Note", "Note", Fmt.Text, null, false, false)
    };

    // The page writes these where the .aspx has <%= ... %>. They hold finished HTML (everything in them is encoded here).
    protected string TitleHtml = "", LeadHtml = "", MessageHtml = "", BodyHtml = "";

    CurrentUser user;
    string fy, kind, status, review, q;

    protected void Page_Load(object sender, EventArgs e)
    {
        Response.Cache.SetCacheability(HttpCacheability.NoCache);
        Response.Cache.SetNoStore();

        TitleHtml = "Project estimates";
        LeadHtml = "";

        try
        {
            user = CurrentUser.Load(Context);
            if (!user.IsSignedIn)
            {
                Say("Sign in to see estimates.");
                return;
            }
        }
        catch (ApiException ex)
        {
            Say(ex.Message);
            return;
        }

        LeadHtml = user.IsAdmin
            ? "Every estimate in the register, with its costs. Filter the list, open a project for its details, or download the rows as a CSV file for Excel."
            : "Your own estimates. Costs are added by an administrator when the estimate is verified, so they are not shown here.";

        fy = Pick("fy");
        if (fy != null && !FinYear.IsMatch(fy)) fy = null;
        kind = Allowed("kind", Kinds);
        status = Allowed("status", Statuses);
        review = Allowed("review", Reviews);
        q = Pick("q");
        if (q != null && q.Length > 100) q = q.Substring(0, 100);

        try
        {
            string id = Pick("id");
            if (!String.IsNullOrEmpty(id)) ShowOne(id);
            else ShowList();
        }
        catch (ApiException ex)
        {
            Say(ex.Message);
        }
    }

    /* ================= list ================= */

    void ShowList()
    {
        DataTable rows = Query(null);
        if (Pick("download") == "csv")
        {
            SendCsv(rows, "project-estimates" + (fy != null ? "-" + fy : ""));
            return;
        }

        var sb = new StringBuilder();
        sb.Append(FilterForm());

        string qs = QueryString();
        sb.Append("<div class=\"rbar\"><a class=\"btn primary\" href=\"project_report.aspx?" + qs + (qs.Length > 0 ? "&amp;" : "") + "download=csv\">Download CSV</a>");
        sb.Append("<span class=\"rcount\">" + rows.Rows.Count + (rows.Rows.Count == 1 ? " project" : " projects") + "</span></div>");

        if (rows.Rows.Count == 0)
        {
            sb.Append("<p class=\"note\">No projects match.</p>");
            BodyHtml = sb.ToString();
            return;
        }

        List<Col> cols = Visible(true);
        sb.Append("<div class=\"tw\"><table><thead><tr>");
        foreach (Col c in cols)
            sb.Append("<th" + NumClass(c) + ">" + H(c.Header) + "</th>");
        sb.Append("<th>Estimate</th></tr></thead><tbody>");
        foreach (DataRow r in rows.Rows)
        {
            sb.Append("<tr>");
            foreach (Col c in cols)
            {
                string text = H(Display(c, r[c.Name]));
                if (c.Name == "ProjectName")
                    text = "<a href=\"project_report.aspx?id=" + HttpUtility.UrlEncode(Convert.ToString(r["RegisterId"])) + "\">" + text + "</a>";
                else if (c.Name == "Workflow")
                    text = "<span class=\"tag " + ReviewTag(Convert.ToString(r[c.Name])) + "\">" + text + "</span>";
                sb.Append("<td" + NumClass(c) + ">" + text + "</td>");
            }
            // The estimate itself (the quotation) as a PDF: made in the browser by report-pdf.js from the saved estimate of this entry
            sb.Append("<td><button type=\"button\" class=\"btn sm\" data-pdf=\"" + H(Convert.ToString(r["RegisterId"])) + "\">PDF</button></td></tr>");
        }
        if (user.IsAdmin)
        {
            sb.Append("<tr class=\"total\">");
            foreach (Col c in cols)
            {
                string cell = "";
                if (c.Name == "ProjectName") cell = "Total";
                else if (c.Format == Fmt.Money && rows.Columns.Contains(c.Name)) cell = Sum(rows, c.Name);
                sb.Append("<td" + NumClass(c) + ">" + H(cell) + "</td>");
            }
            sb.Append("<td></td></tr>");
        }
        sb.Append("</tbody></table></div>");
        if (user.IsAdmin)
            sb.Append("<p class=\"note\">Totals add up the rows shown. A project can have more than one row (one per financial year and record type).</p>");
        BodyHtml = sb.ToString();
    }

    string FilterForm()
    {
        var sb = new StringBuilder();
        sb.Append("<form method=\"get\" action=\"project_report.aspx\" class=\"filters\"><div class=\"fields\">");

        sb.Append("<label class=\"f\"><span class=\"fl\">Financial year</span><select name=\"fy\"><option value=\"\">All years</option>");
        DataTable years = Db.Select("SELECT DISTINCT FinYear FROM dbo.SwProjectRegister" + ScopeWhere(null) + " ORDER BY FinYear DESC");
        foreach (DataRow r in years.Rows)
        {
            string y = Convert.ToString(r["FinYear"]);
            sb.Append(Option(y, y, y == fy));
        }
        sb.Append("</select></label>");

        sb.Append(Select("kind", "Record as", "All", Kinds, kind));
        sb.Append(Select("status", "Project status", "All", Statuses, status));
        sb.Append(Select("review", "Review state", "All", Reviews, review));
        sb.Append("<label class=\"f\"><span class=\"fl\">Search</span><input type=\"text\" name=\"q\" maxlength=\"100\" placeholder=\"Project, department or person\" value=\"" + H(q ?? "") + "\"></label>");
        sb.Append("</div><div class=\"rbar\"><button type=\"submit\" class=\"btn primary\">Show</button><a class=\"btn\" href=\"project_report.aspx\">Clear</a></div></form>");
        return sb.ToString();
    }

    /* ================= one project ================= */

    void ShowOne(string id)
    {
        DataTable rows = Query(id);
        if (rows.Rows.Count == 0)
        {
            Say("That project was not found, or it is not one of yours.");
            BodyHtml = "<div class=\"rbar\"><a class=\"btn\" href=\"project_report.aspx\">Back to the list</a></div>";
            return;
        }
        DataRow r = rows.Rows[0];
        if (Pick("download") == "csv")
        {
            SendCsv(rows, "project-estimate-" + Slug(Convert.ToString(r["ProjectName"])));
            return;
        }

        TitleHtml = H(Convert.ToString(r["ProjectName"]));
        var sb = new StringBuilder();
        sb.Append("<div class=\"rbar\"><a class=\"btn\" href=\"project_report.aspx\">Back to the list</a>");
        sb.Append("<a class=\"btn primary\" href=\"project_report.aspx?id=" + HttpUtility.UrlEncode(id) + "&amp;download=csv\">Download CSV</a>");
        sb.Append("<button type=\"button\" class=\"btn primary\" data-pdf=\"" + H(id) + "\">Download PDF</button></div>");

        sb.Append("<div class=\"tw\"><table class=\"kv\"><tbody>");
        foreach (Col c in Visible(false))
        {
            string text = Display(c, r[c.Name]);
            if (text.Length == 0) continue;
            sb.Append("<tr><th scope=\"row\">" + H(c.Header) + "</th><td" + NumClass(c) + ">" + H(text) + "</td></tr>");
        }
        sb.Append("</tbody></table></div>");

        DataTable log = Db.Select("SELECT Action, ActionBy, ActionAt, Comment FROM dbo.SwProjectLog WHERE RegisterId = " + Db.Quote(id) + " ORDER BY LogId");
        if (log.Rows.Count > 0)
        {
            sb.Append("<h3 class=\"sub\">History</h3><div class=\"tw\"><table><thead><tr><th>When</th><th>Action</th><th>By</th><th>Comment</th></tr></thead><tbody>");
            foreach (DataRow l in log.Rows)
            {
                sb.Append("<tr><td>" + H(FormatDate(l["ActionAt"])) + "</td><td>" + H(Lookup(LogActions, Convert.ToString(l["Action"]))) + "</td><td>" +
                    H(Person(l["ActionBy"])) + "</td><td>" + H(l["Comment"] is DBNull ? "" : Convert.ToString(l["Comment"])) + "</td></tr>");
            }
            sb.Append("</tbody></table></div>");
        }
        BodyHtml = sb.ToString();
    }

    /* ================= data ================= */

    /// <summary>A quoted LIKE pattern that matches the text anywhere, with % _ [ taken literally.</summary>
    static string LikeQuote(string s)
    {
        return Db.Quote("%" + (s ?? "").Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]") + "%");
    }

    /// <summary>The rows the person may see, narrowed by the filters (list) or to one entry (detail).</summary>
    DataTable Query(string id)
    {
        var names = new List<string> { "RegisterId" };
        foreach (Col c in Visible(false)) names.Add(c.Name);

        var where = new List<string>();
        if (id != null) where.Add("RegisterId = " + Db.Quote(id));
        else
        {
            if (fy != null) where.Add("FinYear = " + Db.Quote(fy));
            if (kind != null) where.Add("Kind = " + Db.Quote(kind));
            if (status != null) where.Add("Status = " + Db.Quote(status));
            if (review != null) where.Add("Workflow = " + Db.Quote(review));
            if (!String.IsNullOrEmpty(q))
            {
                string like = LikeQuote(q);
                where.Add("(ProjectName LIKE " + like + " OR Department LIKE " + like + " OR SubmittedBy LIKE " + like + ")");
            }
        }
        return Db.Select("SELECT " + String.Join(", ", names.ToArray()) + " FROM dbo.SwProjectRegister" + ScopeWhere(where) + " ORDER BY FinYear DESC, ProjectName, Kind");
    }

    /// <summary>WHERE clause: the person's visibility rule plus any extra conditions.</summary>
    string ScopeWhere(List<string> extra)
    {
        var parts = new List<string>();
        if (!user.IsAdmin) parts.Add("SubmittedBy = " + Db.Quote(user.Login));
        if (extra != null) parts.AddRange(extra);
        return parts.Count == 0 ? "" : " WHERE " + String.Join(" AND ", parts.ToArray());
    }

    /// <summary>Columns this person may see. Cost columns are left out for non-admins, so they are never even read.</summary>
    List<Col> Visible(bool listOnly)
    {
        var list = new List<Col>();
        foreach (Col c in Cols)
        {
            if (c.AdminOnly && !user.IsAdmin) continue;
            if (listOnly && !c.InList) continue;
            list.Add(c);
        }
        return list;
    }

    /* ================= csv ================= */

    void SendCsv(DataTable rows, string baseName)
    {
        var sb = new StringBuilder();
        List<Col> cols = Visible(false);
        var head = new List<string>();
        foreach (Col c in cols) head.Add(CsvCell(c.Header));
        sb.Append(String.Join(",", head.ToArray())).Append("\r\n");
        foreach (DataRow r in rows.Rows)
        {
            var line = new List<string>();
            foreach (Col c in cols) line.Add(CsvCell(Raw(c, r[c.Name])));
            sb.Append(String.Join(",", line.ToArray())).Append("\r\n");
        }

        Response.Clear();
        Response.ContentType = "text/csv";
        Response.Charset = "utf-8";
        Response.ContentEncoding = new UTF8Encoding(false);
        Response.BinaryWrite(Encoding.UTF8.GetPreamble());   // the BOM, written explicitly (Response.Write does not add one), so Excel reads the file as UTF-8
        Response.AddHeader("Content-Disposition", "attachment; filename=\"" + baseName + "-" + DateTime.UtcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + ".csv\"");
        Response.Write(sb.ToString());
        Response.Flush();
        Response.End();
    }

    /// <summary>Quotes a CSV cell. A text starting with = + - @ is prefixed with ' so Excel does not run it as a formula.</summary>
    static string CsvCell(string v)
    {
        if (v == null) v = "";
        if (v.Length > 0 && "=+-@\t\r".IndexOf(v[0]) >= 0 && !IsNumber(v)) v = "'" + v;
        if (v.IndexOfAny(new[] { ',', '"', '\r', '\n' }) >= 0) v = "\"" + v.Replace("\"", "\"\"") + "\"";
        return v;
    }

    static bool IsNumber(string v)
    {
        decimal d;
        return Decimal.TryParse(v, NumberStyles.Number, CultureInfo.InvariantCulture, out d);
    }

    /* ================= formatting ================= */

    /// <summary>The value as shown on screen.</summary>
    static string Display(Col c, object v)
    {
        if (v == null || v is DBNull) return "";
        switch (c.Format)
        {
            case Fmt.Money: return Convert.ToDecimal(v, CultureInfo.InvariantCulture).ToString("N0", Inr);
            case Fmt.Number: return Convert.ToDecimal(v, CultureInfo.InvariantCulture).ToString("0.#", CultureInfo.InvariantCulture);
            case Fmt.Date: return FormatDate(v);
            case Fmt.Person: return Person(v);
            case Fmt.Lookup: return Lookup(c.Map, Convert.ToString(v));
            default: return Convert.ToString(v);
        }
    }

    /// <summary>The value as written to the CSV: plain numbers, ISO dates, readable names.</summary>
    static string Raw(Col c, object v)
    {
        if (v == null || v is DBNull) return "";
        switch (c.Format)
        {
            case Fmt.Money:
            case Fmt.Number: return Convert.ToDecimal(v, CultureInfo.InvariantCulture).ToString(CultureInfo.InvariantCulture);
            case Fmt.Date: return ((DateTime)v).ToString("yyyy-MM-dd HH:mm 'UTC'", CultureInfo.InvariantCulture);
            case Fmt.Person: return Person(v);
            case Fmt.Lookup: return Lookup(c.Map, Convert.ToString(v));
            default: return Convert.ToString(v);
        }
    }

    static string FormatDate(object v)
    {
        if (v == null || v is DBNull) return "";
        return ((DateTime)v).ToString("dd MMM yyyy HH:mm", CultureInfo.InvariantCulture) + " UTC";
    }

    static string Person(object v)
    {
        return v == null || v is DBNull ? "" : CurrentUser.ShortName(Convert.ToString(v));
    }

    static string Lookup(string[][] map, string code)
    {
        foreach (string[] m in map) if (m[0] == code) return m[1];
        return code;
    }

    static string ReviewTag(string code)
    {
        return code == "verified" ? "ok" : code == "info" ? "warn" : "wait";
    }

    static string Sum(DataTable rows, string column)
    {
        decimal total = 0;
        foreach (DataRow r in rows.Rows)
            if (!(r[column] is DBNull)) total += Convert.ToDecimal(r[column], CultureInfo.InvariantCulture);
        return total.ToString("N0", Inr);
    }

    static string NumClass(Col c)
    {
        return c.Format == Fmt.Money || c.Format == Fmt.Number ? " class=\"num\"" : "";
    }

    static string Slug(string s)
    {
        string t = Regex.Replace((s ?? "").ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        return t.Length == 0 ? "project" : (t.Length > 40 ? t.Substring(0, 40).Trim('-') : t);
    }

    /* ================= small helpers ================= */

    string Pick(string key)
    {
        string v = (Request.QueryString[key] ?? "").Trim();
        return v.Length == 0 ? null : v;
    }

    string Allowed(string key, string[][] map)
    {
        string v = Pick(key);
        if (v == null) return null;
        foreach (string[] m in map) if (m[0] == v) return v;
        return null;
    }

    /// <summary>The current filters as a query string (already HTML-safe), for the download link.</summary>
    string QueryString()
    {
        var parts = new List<string>();
        if (fy != null) parts.Add("fy=" + HttpUtility.UrlEncode(fy));
        if (kind != null) parts.Add("kind=" + HttpUtility.UrlEncode(kind));
        if (status != null) parts.Add("status=" + HttpUtility.UrlEncode(status));
        if (review != null) parts.Add("review=" + HttpUtility.UrlEncode(review));
        if (!String.IsNullOrEmpty(q)) parts.Add("q=" + HttpUtility.UrlEncode(q));
        return String.Join("&amp;", parts.ToArray());
    }

    static string Select(string name, string label, string allLabel, string[][] map, string current)
    {
        var sb = new StringBuilder();
        sb.Append("<label class=\"f\"><span class=\"fl\">" + H(label) + "</span><select name=\"" + name + "\"><option value=\"\">" + H(allLabel) + "</option>");
        foreach (string[] m in map) sb.Append(Option(m[0], m[1], m[0] == current));
        sb.Append("</select></label>");
        return sb.ToString();
    }

    static string Option(string value, string text, bool selected)
    {
        return "<option value=\"" + H(value) + "\"" + (selected ? " selected" : "") + ">" + H(text) + "</option>";
    }

    void Say(string text)
    {
        MessageHtml = "<p class=\"msg\" role=\"alert\">" + H(text) + "</p>";
    }

    static string H(string s)
    {
        return HttpUtility.HtmlEncode(s ?? "");
    }
}
