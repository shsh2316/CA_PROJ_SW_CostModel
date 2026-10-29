<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="project_upload.aspx.cs" Inherits="ProjectUploadPage" EnableViewState="false" EnableSessionState="false" %>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Central Automation: Excel Upload</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/estimator.css">
</head>
<body data-login-url="<%: ResolveUrl("~/Default.aspx") %>">
<div class="wrap">
  <header class="top">
    <h1>Central Automation: Excel upload</h1>
    <div class="seg" role="group" aria-label="Theme"><button type="button" data-theme-set="light" aria-pressed="true">White</button><button type="button" data-theme-set="dark" aria-pressed="false">Dark</button></div>
  </header>
  <nav class="pnav" aria-label="Pages">
    <a href="project_registry.aspx">Estimator</a>
    <a href="project_upload.aspx" aria-current="page">Excel upload</a>
    <a href="project_report.aspx">Report</a>
    <% if (LoginModule.IsDashboardAdmin(Context)) { %><a href="project_dashboard.aspx">Dashboard</a><% } %>
    <a href="<%= ResolveUrl("~/Default.aspx") %>?logout=1">Sign out</a>
  </nav>

  <section class="upload">
    <h2 class="pt" style="margin:0 0 4px;font-size:24px;font-weight:600">Upload projects from Excel</h2>
    <p class="lead" style="margin:0 0 14px;color:var(--muted)">Many projects at once: download the template, fill <b>one row for each project</b> (no prices), upload it here, check the cost of every project, then submit them to the register.</p>
    <p id="upMsg" class="msg" role="status" hidden></p>

    <div id="upTools" hidden>
      <ol class="ustep">
        <li>
          <h3 class="sub">1. Download the template</h3>
          <p class="note" style="margin:0 0 8px">An Excel workbook with room for 100 projects. The drop-down lists (financial year, project type, GPUs, databases, benefits and so on) come from the current masters, so download a fresh copy after the masters change.</p>
          <div class="actions" style="margin-top:0"><button type="button" class="btn" id="upTpl">Download blank template (.xlsx)</button></div>
          <details class="guide">
            <summary>What goes in each column</summary>
            <div class="tw"><table class="dual"><thead><tr><th>Column</th><th>Answer</th><th>If left empty</th></tr></thead><tbody id="upGuide"></tbody></table></div>
          </details>
        </li>
        <li>
          <h3 class="sub">2. Fill it in</h3>
          <p class="note" style="margin:0">One row for each project, starting under the grey line of hints. Only <b>Project name</b> is required; an empty cell takes the default shown in the hint. Keep the headings as they are, and save the file as <b>.xlsx</b>.</p>
        </li>
        <li>
          <h3 class="sub">3. Upload the filled file</h3>
          <div class="drop" id="upDrop">
            <p style="margin:0 0 8px">Drag the filled workbook here, or</p>
            <button type="button" class="btn primary" id="upPick">Choose files</button>
            <input type="file" id="upFile" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple hidden>
            <p class="note">One workbook can hold many projects, and you can upload several workbooks at once.</p>
          </div>
        </li>
        <li>
          <h3 class="sub">4. Check and submit</h3>
          <div id="upResults"><p class="note" style="margin:0">Nothing uploaded yet.</p></div>
        </li>
      </ol>
    </div>
  </section>
</div>
<div id="toast" role="status"></div>

<%-- The workbook is made and read in the browser with xlsx-lite.js (no outside library). estimator.js runs in library mode here:
     it provides the template columns, the reading of a filled sheet and the cost calculation, as on the estimator page. --%>
<script src="assets/js/xlsx-lite.js"></script>
<script src="assets/js/estimator.js"></script>
<script src="assets/js/upload.js"></script>
</body>
</html>
