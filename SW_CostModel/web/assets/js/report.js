/* Theme switch for the report page; same stored choice as the estimator page. */
(function(){
var THEME_KEY='ca-estimator.theme';
function setTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  var bs=document.querySelectorAll('[data-theme-set]');
  for(var i=0;i<bs.length;i++)bs[i].setAttribute('aria-pressed',String(bs[i].getAttribute('data-theme-set')===t));
  try{localStorage.setItem(THEME_KEY,t);}catch(e){}
}
var seg=document.querySelector('.seg');
if(seg)seg.addEventListener('click',function(e){var b=e.target.closest('[data-theme-set]');if(b)setTheme(b.getAttribute('data-theme-set'));});
var t0='light';try{t0=localStorage.getItem(THEME_KEY)||'light';}catch(e){}
setTheme(t0);
})();
