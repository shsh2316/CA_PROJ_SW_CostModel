<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="project_report.aspx.cs" Inherits="ProjectReportPage" EnableViewState="false" EnableSessionState="false" %>
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
<body data-login-url="<%: ResolveUrl("~/Default.aspx") %>">
<div class="wrap">
  <header class="top">
    <h1>Central Automation: project report</h1>
    <div class="seg" role="group" aria-label="Theme"><button type="button" data-theme-set="light" aria-pressed="true">White</button><button type="button" data-theme-set="dark" aria-pressed="false">Dark</button></div>
  </header>
  <nav class="pnav" aria-label="Pages">
    <a href="project_registry.aspx">Estimator</a>
    <a href="project_upload.aspx">Excel upload</a>
    <a href="project_report.aspx" aria-current="page">Report</a>
    <a href="<%= ResolveUrl("~/Default.aspx") %>?logout=1">Sign out</a>
  </nav>

  <section>
    <h2 class="pt" style="margin:0 0 4px;font-size:24px;font-weight:600"><%= TitleHtml %></h2>
    <p class="lead" style="margin:0 0 14px;color:var(--muted)"><%= LeadHtml %></p>
    <%= MessageHtml %>
    <p id="pdfMsg" class="msg" role="status" hidden></p>
    <%= BodyHtml %>
  </section>
</div>

<%-- PDF: the estimate document is built in the browser. report-pdf.js loads jsPDF and html2canvas (bundled in assets/js/vendor, no internet needed)
     and estimator.js (library mode: the calculation and the quotation layout) on the first PDF click, so the list opens without 700 KB of scripts. --%>
<script src="assets/js/report-pdf.js"></script>
<script src="assets/js/report.js"></script>
</body>
</html>
