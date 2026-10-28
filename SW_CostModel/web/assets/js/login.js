/* Login page: show / hide the password (Font Awesome eye icons), and start in the right box. */
(function(){
var pw=document.getElementById('txtpassword'),eye=document.getElementById('btn_ShowPassword'),user=document.getElementById('txtUser');
if(eye&&pw)eye.addEventListener('click',function(){
  var show=pw.type==='password';
  pw.type=show?'text':'password';
  eye.innerHTML='<span class="fa '+(show?'fa-eye-slash':'fa-eye')+'"></span>';
  eye.setAttribute('aria-label',show?'Hide password':'Show password');
});
if(user&&pw)(user.value?pw:user).focus();
})();
