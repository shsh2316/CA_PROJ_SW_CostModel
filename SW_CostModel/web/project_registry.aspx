<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="project_registry.aspx.cs" Inherits="ProjectRegistryPage" EnableViewState="false" EnableSessionState="false" %>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Central Automation: Estimate and Quotation</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/estimator.css">
</head>
<body data-login-url="<%: ResolveUrl("~/Default.aspx") %>" data-signed-in="<%: SignedInFlag %>" data-user="<%: UserName %>" data-admin="<%: AdminFlag %>">
<div class="wrap">
  <header class="top">
    <h1>Central Automation: estimate and quotation</h1>
    <div class="seg" role="group" aria-label="Theme"><button type="button" data-theme-set="light" aria-pressed="true">White</button><button type="button" data-theme-set="dark" aria-pressed="false">Dark</button></div>
  </header>
  <nav class="pnav" aria-label="Pages">
    <button type="button" data-page="master">Masters</button>
    <button type="button" data-page="reg">Registration</button>
    <button type="button" data-page="appr">Approval</button>
    <a href="project_upload.aspx">Excel upload</a>
    <button type="button" data-page="print">Print</button>
    <a href="project_report.aspx">Report</a>
    <a href="<%= ResolveUrl("~/Default.aspx") %>?logout=1">Sign out</a>
  </nav>

  <section class="page" id="p-master">
    <h2 class="pt">Masters</h2>
    <p class="lead">Rates and prices used by every new estimate. Each estimate keeps a copy of the rates it was made with, so changing a master does not change an estimate already registered. To apply new rates to existing entries, an admin uses <b>Recalculate with the current masters</b> on the Approval page; on Registration, <b>Use the current masters</b> does it for the estimate on screen.</p>
    <div class="mtabs" id="mtabs" role="tablist"></div>
    <div id="mbody"></div>
  </section>

  <section class="page" id="p-reg">
    <div class="steps" id="steps" role="tablist" aria-label="Registration steps"></div>
    <div class="strip" id="strip" aria-live="polite"></div>
    <div id="wiz"></div>
    <div class="stepnav" id="stepnav"></div>
  </section>

  <section class="page" id="p-appr">
    <div id="apbox" class="reg"></div>
    <div id="apdetail"></div>
  </section>

  <section class="page" id="p-print">
    <div class="noprint">
      <h2 class="pt" style="margin:0 0 4px;font-size:24px;font-weight:600">Estimate and print</h2>
      <p class="lead" style="margin:0 0 12px;color:var(--muted)">Check the estimate, fill in the quotation details, then print. A quotation from an unverified estimate is stamped as a draft.</p>
      <div class="fields"><label class="f wide"><span class="fl">Estimate</span><select id="pvSel"></select></label></div>
      <div id="pvRes" style="margin-top:14px"></div>
      <h3 class="sub">Quotation details</h3>
      <div id="pvForm"></div>
      <div class="actions"><button type="button" class="btn primary" id="printBtn">Print / Save as PDF</button></div>
      <p class="note">In the print dialog, choose Save as PDF as the destination.</p>
      <h3 class="sub">Quotation preview</h3>
    </div>
    <div id="quote" class="paper"></div>
  </section>
</div>
<div id="toast" role="status"></div>

<script src="assets/js/estimator.js"></script>
</body>
</html>
