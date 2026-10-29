<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="project_dashboard.aspx.cs" Inherits="ProjectDashboardPage" EnableViewState="false" EnableSessionState="false" %>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Central Automation: Dashboard</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/estimator.css">
<link rel="stylesheet" href="assets/css/dashboard-print.css">
</head>
<body data-login-url="<%: ResolveUrl("~/Default.aspx") %>" class="dash">
<div class="wrap">
  <header class="top">
    <h1>Central Automation: dashboard</h1>
    <div class="seg" role="group" aria-label="Theme"><button type="button" data-theme-set="light" aria-pressed="true">White</button><button type="button" data-theme-set="dark" aria-pressed="false">Dark</button></div>
  </header>
  <nav class="pnav" aria-label="Pages">
    <a href="project_registry.aspx">Estimator</a>
    <a href="project_upload.aspx">Excel upload</a>
    <a href="project_report.aspx">Report</a>
    <a href="project_dashboard.aspx" aria-current="page">Dashboard</a>
    <a href="<%= ResolveUrl("~/Default.aspx") %>?logout=1">Sign out</a>
  </nav>

  <p id="dMsg" class="msg" role="status" hidden></p>

  <section id="dApp" hidden>
    <%-- filters: period, review state, projects (multi-select). The choice is kept in the address (a shareable link) and in this browser. --%>
    <div class="dfilter" role="group" aria-label="Choose projects">
      <div class="dfrow">
        <label class="f"><span class="fl">From</span><input type="date" id="dFrom"></label>
        <label class="f"><span class="fl">To</span><input type="date" id="dTo"></label>
        <div class="dpresets" role="group" aria-label="Period">
          <button type="button" class="btn sm" data-preset="fy">This financial year</button>
          <button type="button" class="btn sm" data-preset="12m">Last 12 months</button>
          <button type="button" class="btn sm" data-preset="all">All dates</button>
        </div>
        <div class="dpick">
          <button type="button" class="btn" id="dPickBtn" aria-expanded="false" aria-controls="dPanel">Projects: all</button>
          <div class="dpanel" id="dPanel" hidden>
            <input type="search" id="dSearch" placeholder="Search projects, departments" aria-label="Search projects">
            <div class="dpanel-act"><button type="button" class="lnk" id="dAll">Select all shown</button><button type="button" class="lnk" id="dNone">Clear the choice</button><span id="dPickCount" class="note"></span></div>
            <div class="dlist" id="dList"></div>
          </div>
        </div>
      </div>
      <div class="dfrow">
        <label class="chk"><input type="checkbox" id="dUndated" checked> <span id="dUndatedLbl">Include projects without dates</span></label>
        <label class="chk"><input type="checkbox" id="dVer"> Verified only</label>
      </div>
      <div class="dchips" id="dChips"></div>
    </div>

    <%-- the deck: one slide at a time; arrow keys, the strip, Present (full screen) and Print (one slide per page) --%>
    <div class="dctl">
      <button type="button" class="btn sm" id="dPrev" aria-label="Previous slide">&#8249; Previous</button>
      <span id="dPos" class="dpos" aria-live="polite"></span>
      <button type="button" class="btn sm" id="dNext" aria-label="Next slide">Next &#8250;</button>
      <span class="dctl-gap"></span>
      <button type="button" class="btn sm" id="dPresent">Present</button>
      <button type="button" class="btn sm" id="dPrint">Print</button>
    </div>
    <nav class="dstrip" id="dStrip" aria-label="Slides"></nav>
    <div class="deck" id="dDeck"></div>
    <p id="pdfMsg" class="msg" role="status" hidden></p>
  </section>
</div>

<script src="assets/js/dashboard.js"></script>
<script src="assets/js/report-pdf.js"></script>
</body>
</html>
