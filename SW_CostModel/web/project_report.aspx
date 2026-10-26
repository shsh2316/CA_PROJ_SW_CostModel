<%@ Page Language="C#" AutoEventWireup="true" CodeFile="project_report.aspx.cs" Inherits="ProjectReportPage" EnableViewState="false" EnableSessionState="false" %>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Central Automation: Project Report</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/estimator.css">
</head>
<body id="pageBody" runat="server">
<div class="wrap">
  <header class="top">
    <h1>Central Automation: project report</h1>
    <div class="seg" role="group" aria-label="Theme"><button type="button" data-theme-set="light" aria-pressed="true">White</button><button type="button" data-theme-set="dark" aria-pressed="false">Dark</button></div>
  </header>
  <nav class="pnav" aria-label="Pages">
    <a href="project_registry.aspx">Estimator</a>
    <a href="project_report.aspx" aria-current="page">Report</a>
  </nav>

  <section>
    <h2 class="pt" style="margin:0 0 4px;font-size:24px;font-weight:600"><asp:Literal ID="litTitle" runat="server" /></h2>
    <p class="lead" style="margin:0 0 14px;color:var(--muted)"><asp:Literal ID="litLead" runat="server" /></p>
    <asp:Literal ID="litMessage" runat="server" />
    <asp:Literal ID="litFilters" runat="server" />
    <asp:Literal ID="litBody" runat="server" />
  </section>
</div>

<script src="assets/js/report.js"></script>
</body>
</html>
