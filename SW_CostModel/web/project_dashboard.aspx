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
<link rel="stylesheet" href="assets/css/dashboard-visual.css">
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

    <%-- the deck: five visual slides, then five data slides, all worked out from the chosen projects; one slide at a time; arrow keys, the strip,
         Edit (change words and numbers on the slides for a picture, not saved), Present (full screen), Print (one slide per page),
         Download PNG (the slide as a 1920 x 1080 picture for a presentation) --%>
    <div class="dctl">
      <button type="button" class="btn sm" id="dPrev" aria-label="Previous slide">&#8249; Previous</button>
      <span id="dPos" class="dpos" aria-live="polite"></span>
      <button type="button" class="btn sm" id="dNext" aria-label="Next slide">Next &#8250;</button>
      <span class="dpager" id="dPager" hidden><button type="button" class="btn sm" id="dPgPrev" aria-label="Previous page of the project list">&#8249; Page</button><button type="button" class="btn sm" id="dPgNext" aria-label="Next page of the project list">Page &#8250;</button></span>
      <span class="dctl-gap"></span>
      <button type="button" class="btn sm" id="dEdit" aria-pressed="false" title="Change the words and numbers on the slides before downloading a picture">Edit</button>
      <button type="button" class="btn sm" id="dReset" hidden title="Draw the slides again from the register">Reset to the register</button>
      <button type="button" class="btn sm" id="dHeads" aria-expanded="false" aria-controls="hdPanel" title="Choose or write the heading and subheading of the visual slides">Headings</button>
      <button type="button" class="btn sm" id="dPhotos" aria-expanded="false" aria-controls="phPanel" title="Choose, shuffle or upload the photos of the visual slides">Photos</button>
      <button type="button" class="btn sm" id="dPng">Download PNG</button>
      <button type="button" class="btn sm" id="dPngAll" title="Every slide, and every page of the project list">All slides as PNG</button>
      <button type="button" class="btn sm" id="dPresent">Present</button>
      <button type="button" class="btn sm" id="dPrint">Print</button>
    </div>
    <p class="msg dedit" id="dEditNote" hidden>Editing: click any word or number on a slide and type. The changes are only for the picture or print: they are not saved,
      and the slides are drawn again from the register when you change the choice of projects or press <b>Reset to the register</b>.</p>
    <%-- Headings: ready-made headings and subheadings for the visual slide on screen, or your own; {words} fill in from the register; kept in this browser --%>
    <div class="phpanel hdpanel" id="hdPanel" hidden>
      <div class="phhead">
        <b id="hdFor"></b>
        <button type="button" class="btn sm" id="hdDefault">Default for this slide</button>
        <button type="button" class="btn sm" id="hdAllDefault">Default for all slides</button>
        <button type="button" class="btn sm" id="hdClose" aria-label="Close">×</button>
      </div>
      <div class="hdcols">
        <fieldset><legend>Heading</legend><div id="hdTitles"></div></fieldset>
        <fieldset><legend>Subheading</legend><div id="hdSubs"></div></fieldset>
      </div>
      <p class="note" id="hdTokens"></p>
    </div>
    <%-- Photos: the header picture of the slide on screen, from the library (assets/img) or uploaded; kept in this browser only --%>
    <div class="phpanel" id="phPanel" hidden>
      <div class="phhead">
        <b id="phFor"></b>
        <button type="button" class="btn sm" id="phShuffle" title="A different photo on each visual slide">Shuffle</button>
        <button type="button" class="btn sm" id="phDefault">Default photos</button>
        <button type="button" class="btn sm" id="phUpload">Upload photos…</button>
        <input type="file" id="phFile" accept="image/jpeg,image/png,image/webp" multiple hidden>
        <button type="button" class="btn sm" id="phClose" aria-label="Close">×</button>
      </div>
      <p class="note" id="phMsg" role="status"></p>
      <h3 class="phh">Uploaded in this browser</h3>
      <div class="phgrid" id="phUp"></div>
      <h3 class="phh">Library</h3>
      <div class="phgrid" id="phLib"></div>
    </div>
    <nav class="dstrip" id="dStrip" aria-label="Slides"></nav>
    <div class="deck" id="dDeck"></div>
    <p id="pdfMsg" class="msg" role="status" hidden></p>
  </section>
</div>

<script src="assets/js/dashboard-visual.js"></script>
<script src="assets/js/dashboard.js"></script>
<script src="assets/js/report-pdf.js"></script>
</body>
</html>
