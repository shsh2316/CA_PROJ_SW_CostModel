<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="LoginPage" ValidateRequest="false" EnableViewState="false" EnableSessionState="false" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Central Automation: Sign in</title>
    <link rel="icon" href="data:,">
    <%-- Libraries: Content, Scripts and Standards sit in the site root, copied from the other portal. Everything is served from this server. --%>
    <link href="<%= ResolveUrl("~/Content/bootstrap.min.css") %>" rel="stylesheet">
    <link href="<%= ResolveUrl("~/Content/font-awesome.min.css") %>" rel="stylesheet">
    <link href="<%= ResolveUrl("~/SW_CostModel/web/assets/css/fonts.css") %>" rel="stylesheet">
    <link href="<%= ResolveUrl("~/SW_CostModel/web/assets/css/login.css") %>" rel="stylesheet">
</head>
<body>
    <div class="stage" aria-hidden="true"><div class="tilted-div"></div></div>
    <div class="ele"><%= LogoHtml %></div>

    <main class="login-wrap">
        <form method="post" autocomplete="off" class="content" id="divContent">
            <div class="card h-100 border-0" id="Login_box">
                <div class="card-body">
                    <div class="alert text-center text-white bg-gradient bg-dark lead p-2">
                        Central Automation<br>Estimate and Quotation
                    </div>

                    <div class="text-start mb-3">
                        <label class="form-label text-secondary fw-bolder" for="txtUser"><span class="fa fa-user"></span> Username</label>
                        <input type="text" name="user" id="txtUser" class="form-control" placeholder="Your name" maxlength="100" autocomplete="username" value="<%: UserValue %>">
                    </div>

                    <div class="text-start mb-3">
                        <label class="form-label text-secondary fw-bolder" for="txtpassword"><b class="fa fa-lock"></b> Password</label>
                        <div class="position-relative">
                            <input type="password" name="password" id="txtpassword" class="form-control" placeholder="Enter your password" autocomplete="current-password" style="padding-right: 44px;">
                            <button type="button" id="btn_ShowPassword" class="btn position-absolute eye" aria-label="Show password"><span class="fa fa-eye"></span></button>
                        </div>
                    </div>

                    <div class="text-center msg" role="alert"><label class="small text-danger fw-bold font-monospace"><%= MessageHtml %></label></div>

                    <div class="text-center">
                        <button type="submit" id="cmdLogin" class="btn text-white btn-danger">Login into the portal</button>
                    </div>
                </div>
            </div>
            <div class="text-center">
                <label class="small text-black">Powered by Central Automation, AM/NS India</label>
            </div>
        </form>
    </main>
    <script src="<%= ResolveUrl("~/SW_CostModel/web/assets/js/login.js") %>"></script>
</body>
</html>
