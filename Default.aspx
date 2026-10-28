<%@ Page Language="C#" EnableViewState="false" EnableSessionState="false" %>
<%
    // The site root has no page of its own: send people to the estimator.
    Response.Redirect("~/SW_CostModel/web/project_registry.aspx", false);
    Context.ApplicationInstance.CompleteRequest();
%>
