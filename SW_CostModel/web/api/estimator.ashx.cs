using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Management;

/// <summary>
/// JSON API for the estimator page. One URL, the action is a query parameter:
///   GET  api/estimator.ashx?action=init           signed-in user, masters and register
///   GET  api/estimator.ashx?action=projects       register only (refresh)
///   POST api/estimator.ashx?action=saveMaster     { key, doc }                                   admins only
///   POST api/estimator.ashx?action=submitProject  { id?, entry, reply? }
///   POST api/estimator.ashx?action=verifyProject  { id, updated, costing, adjustedValue?, comment? } admins only
///   POST api/estimator.ashx?action=sendBack       { id, updated, comment }                       admins only
/// People who are not admins never receive prices, rates or cost figures.
///   POST api/estimator.ashx?action=deleteProject  { id }
/// Errors come back as { error: { code, message } } with an HTTP error status.
/// The code is compiled by IIS on first use (App_Code); nothing to build or install.
/// </summary>
public class EstimatorApi : IHttpHandler
{
    public bool IsReusable { get { return true; } }

    public void ProcessRequest(HttpContext ctx)
    {
        HttpResponse res = ctx.Response;
        res.ContentType = "application/json";
        res.ContentEncoding = Encoding.UTF8;
        res.Cache.SetCacheability(HttpCacheability.NoCache);
        res.Cache.SetNoStore();
        res.TrySkipIisCustomErrors = true;

        object result;
        try
        {
            result = Handle(ctx);
        }
        catch (ApiException ex)
        {
            res.StatusCode = ex.Status;
            if (ex.Status >= 500) Log(ex);
            result = Error(ex.Code, ex.Message);
        }
        catch (Exception ex)
        {
            res.StatusCode = 500;
            Log(ex);
            result = Error("server_error", ctx.Request.IsLocal ? ex.ToString()
                : "Server error. The details are in the Windows Application event log on the web server.");
        }
        res.Write(Json.Serializer().Serialize(result));
    }

    static object Handle(HttpContext ctx)
    {
        HttpRequest req = ctx.Request;
        string action = (req.QueryString["action"] ?? "").Trim();
        bool post = req.HttpMethod == "POST";
        if (!post && req.HttpMethod != "GET") throw new ApiException(405, "method_not_allowed", "Use GET or POST.");

        IDictionary<string, object> body = null;
        if (post)
        {
            // A custom header cannot be sent cross-site without CORS, which this API does not allow,
            // so another site cannot make a signed-in user's browser post here.
            if (req.Headers["X-Requested-With"] != "XMLHttpRequest")
                throw new ApiException(403, "forbidden", "Missing X-Requested-With header.");
            body = ReadBody(req);
        }

        CurrentUser user = CurrentUser.Load(ctx);
        switch (action + (post ? ":POST" : ":GET"))
        {
            case "init:GET":
                return new Dictionary<string, object>
                {
                    { "me", Me(user) },
                    { "masters", MasterRepository.Load(user.IsAdmin) },
                    { "register", ProjectRepository.List(user) }
                };
            case "projects:GET":
                return ProjectRepository.List(user);
            case "saveMaster:POST":
                user.RequireAdmin("Only admins can change masters.");
                MasterRepository.Save(user, Json.Text(body, "key", 10), Json.Obj(body, "doc"));
                return Ok(null);
            case "submitProject:POST":
                return Ok(ProjectRepository.Submit(user, body));
            case "verifyProject:POST":
                ProjectRepository.Verify(user, body);
                return Ok(null);
            case "sendBack:POST":
                ProjectRepository.SendBack(user, body);
                return Ok(null);
            case "deleteProject:POST":
                ProjectRepository.Delete(user, body);
                return Ok(null);
            default:
                throw new ApiException(404, "not_found", "Unknown action '" + action + "'.");
        }
    }

    static IDictionary<string, object> ReadBody(HttpRequest req)
    {
        string text;
        using (var reader = new StreamReader(req.InputStream, Encoding.UTF8))
            text = reader.ReadToEnd();
        object parsed;
        try { parsed = Json.Serializer().DeserializeObject(text); }
        catch (Exception) { throw new ApiException(400, "bad_request", "The request body is not valid JSON."); }
        var body = parsed as IDictionary<string, object>;
        if (body == null) throw new ApiException(400, "bad_request", "The request body must be a JSON object.");
        return body;
    }

    static object Me(CurrentUser user)
    {
        return new Dictionary<string, object>
        {
            { "id", user.Login },
            { "name", user.DisplayName },
            { "isAdmin", user.IsAdmin }
        };
    }

    static object Ok(string id)
    {
        var r = new Dictionary<string, object> { { "ok", true } };
        if (id != null) r["id"] = id;
        return r;
    }

    static object Error(string code, string message)
    {
        return new Dictionary<string, object> { { "error", new Dictionary<string, object> { { "code", code }, { "message", message } } } };
    }

    /// <summary>Writes the error to the Windows Application event log through ASP.NET health monitoring.</summary>
    static void Log(Exception ex)
    {
#if !__MonoCS__
        try { new ApiErrorEvent(ex).Raise(); }
        catch (Exception) { }
#endif
    }

#if !__MonoCS__
    // Not in Mono, which is only used for testing off Windows.
    class ApiErrorEvent : WebErrorEvent
    {
        public ApiErrorEvent(Exception ex)
            : base("Central Automation estimator API error: " + ex.Message, "EstimatorApi", WebEventCodes.WebExtendedBase + 1, ex) { }
    }
#endif
}
