<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="LoginPage" ValidateRequest="false" EnableViewState="false" EnableSessionState="false" %>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Central Automation: Sign in</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/login.css">
</head>
<body>
    <div class="tilted-div"></div>
    <div class="ele"><%= LogoHtml %></div>

    <form method="post" autocomplete="off">
        <div class="content">
            <div class="card">
                <div class="banner">Central Automation<br>Estimate and Quotation</div>

                <div class="text-start">
                    <label class="form-label" for="txtUser"><span class="ico">&#9786;</span> Username</label>
                    <input type="text" id="txtUser" name="user" class="form-control" placeholder="Your name" maxlength="100" autocomplete="username" value="<%: UserValue %>">
                </div>

                <div class="text-start">
                    <label class="form-label" for="txtpassword"><span class="ico">&#9919;</span> Password</label>
                    <div class="pw">
                        <input type="password" id="txtpassword" name="password" class="form-control" placeholder="Enter your password" autocomplete="current-password">
                        <button type="button" id="btn_ShowPassword" class="eye" aria-label="Show password">Show</button>
                    </div>
                </div>

                <div class="msg" role="alert"><%= MessageHtml %></div>

                <div class="text-center">
                    <button type="submit" id="cmdLogin" class="btn-login">Login into the portal</button>
                </div>
            </div>
            <div class="text-center small">Powered by Central Automation, AM/NS India</div>
        </div>
    </form>
    <script src="assets/js/login.js"></script>
</body>
</html>
