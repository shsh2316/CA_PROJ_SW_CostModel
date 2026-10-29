/* Dashboard visual slides (project_dashboard.aspx): five infographic slides in front of the data slides, made to be shown in a meeting
   or downloaded as a picture for a presentation: Working principle, Benefits at a glance, Money, FTE, Productivity.
   Every figure is worked out from the registered projects of the dashboard's choice: their recorded costs (in-house and benchmark),
   effort, status, dates, Business KPI (imported entries carry it in their note) and the benefits recorded with each estimate
   (man-hours saved, downtime avoided, energy, ₹ value by category). Nothing is typed in here; to change a figure for one picture,
   use "Edit" on the page (the change is not saved). Icons are drawn here as inline SVG; photos are files in assets/img. */
window.CADashVisual=(function(){
'use strict';

var HOURS_PER_FTE=2740,HOURS_PER_DAY=8;
/* the photo library (files in assets/img) and each slide's photo until someone picks another on the page (Photos) */
var LIBRARY=['plant.jpg','furnace.jpg','ladle.jpg','converter.jpg','slab.jpg','mill.jpg'];
for(var k=7;k<=42;k++)LIBRARY.push('photo-'+(k<10?'0':'')+k+'.jpg');
var PHOTO=['furnace.jpg','plant.jpg','ladle.jpg','converter.jpg','slab.jpg'];
var EYEBROW='Central Automation – Level 2';
var CAT_NAMES={manhours:'Man-hours saved',downtime:'Downtime avoided',energy:'Energy saved',quality:'Quality / yield improvement',material:'Material and consumables saved',
  through:'Productivity / throughput gain',safety:'Safety and compliance risk avoided',other:'Other benefit'};
var CAT_ICON={manhours:'people',downtime:'clock',energy:'bolt',quality:'target',material:'brick',through:'chart',safety:'helmet',other:'coins'};
var TYPE={web:'Web application',desktop:'Desktop application',mobile:'Mobile app',interface:'Interface / integration',dash:'Dashboard / reporting',ai:'AI / vision system'};
var TYPE_ICON={web:'monitor',desktop:'monitor',mobile:'monitor',interface:'code',dash:'chart',ai:'target'};

/* ---------- icons (24 x 24, drawn with the text colour) ---------- */
var IC={
  coins:'<ellipse cx="12" cy="5.5" rx="7" ry="2.8"/><path d="M5 5.5v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4M5 9.5v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4M5 13.5v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4"/>',
  people:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.9.4 5 2.8 5 5.8"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  chart:'<path d="M3 21h18"/><rect x="5" y="13" width="3" height="5"/><rect x="10.5" y="9" width="3" height="9"/><rect x="16" y="5" width="3" height="13"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  doc:'<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h8M9 9h3"/>',
  factory:'<path d="M2 21V10l6 4v-4l6 4V5h5v16z"/><path d="M6 17h2M11 17h2M16 17h1"/>',
  shield:'<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  leaf:'<path d="M5 21c0-9 5-15 15-16-1 10-7 15-15 16z"/><path d="M5 21l8-8"/>',
  helmet:'<path d="M4 17a8 8 0 0116 0M10 9V5h4v4M2 20h20M3 17h18"/>',
  trophy:'<path d="M8 3h8v6a4 4 0 01-8 0zM8 5H4v1a4 4 0 004 4M16 5h4v1a4 4 0 01-4 4M12 13v4M9 17h6v4H9z"/>',
  check:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  code:'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  gauge:'<path d="M3 17a9 9 0 0118 0"/><path d="M12 17l4.5-5.5M6 12.5l1 .8M12 8v1.3M18 12.5l-1 .8"/>',
  monitor:'<rect x="2" y="4" width="20" height="13" rx="1"/><path d="M8 21h8M12 17v4"/>',
  brick:'<path d="M3 20h18M4 20v-4h7v4M13 20v-4h7v4M7.5 16v-4h9v4"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  down:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 13l4 4 4-4"/>'
};
function ic(name,cls){return '<svg viewBox="0 0 24 24" class="vi'+(cls?' '+cls:'')+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[name]||IC.chart)+'</svg>';}

/* ---------- small pieces ---------- */
var X,D;   // X: what the dashboard passes in (esc, num, L = chosen projects, period, choiceNote, cats); D: the figures worked out from L
function e(s){return X.esc(s);}
function n0(v){return X.num(Math.round(v||0));}
function cr(n){n=+n||0;var a=Math.abs(n);return '₹'+(a>=1e7?(n/1e7).toFixed(1)+' Cr':(a>=1e5?(n/1e5).toFixed(1)+' L':X.num(Math.round(n))));}
function crN(n){return (n/1e7).toFixed(1);}
function pctLower(a,b){return b>0?Math.round((1-a/b)*100):0;}
function sum(L,f){return L.reduce(function(s,p){return s+(f(p)||0);},0);}
function plural(n,one,many){return n0(n)+' '+(Math.round(n)===1?one:(many||one+'s'));}
function fte2(h){return (h/HOURS_PER_FTE).toFixed(2);}
function cut(t,n){t=String(t||'');return t.length>n?t.slice(0,n-1)+'…':t;}
function catName(id){var c=X.cats&&X.cats[id];return (c&&c.name)||CAT_NAMES[id]||id;}
function years(y){return y<1?n0(y*12)+' months':X.num(y,1)+' years';}
/* the header photo, faded into the white of the slide; src is a library file's address or an uploaded picture (data: URL) */
function photoStyle(src){return 'background-image:linear-gradient(100deg,#fff 0%,rgba(255,255,255,.92) 14%,rgba(255,255,255,0) 46%),linear-gradient(0deg,#fff 0%,rgba(255,255,255,0) 30%),url(\''+String(src).replace(/["'<>&\\]/g,'')+'\')';}
/* ---------- headings: a few ready-made headings and subheadings per slide, or the user's own; {words} in braces fill in from the register ---------- */
var HEADS=[
  {titles:[['Working principle','of the department'],['How we work:','from plant data to decisions'],['Central Automation:','{projects} projects for {departments} departments'],['In-house digitization','that pays back']],
   subs:['From plant and Level-2 data to in-house software the departments use for decisions · {period}','{projects} projects built in-house for {inhouse}, {pct} below a software company','{live} live and {progress} in progress, for {departments} departments · {period}']},
  {titles:[['Benefits at a glance:','money, FTE, time and value'],['{avoidedLive} avoided,','{fte} FTE saved a year'],['What our projects deliver:','{value} a year'],['Benefits at a glance','']],
   subs:['{period}: **{projects} projects ({live} live and {progress} in progress)**','{projects} projects · {pct} lower cost than a software company · {period}','Figures from the project register · {period}']},
  {titles:[['Money:','{liveWord} avoided {avoidedLive} of external cost'],['Cost avoidance:','{avoided} saved by building in-house'],['In-house vs. external:','{pct} lower cost'],['Money:','{inhouse} in-house against {benchmark} outside']],
   subs:['Cost over the years of ownership: in-house against a software company, ₹ Cr','{projects} projects · {period}','Value created: {value} a year, payback {payback}']},
  {titles:[['FTE:','Working time saved'],['{mh} man-hours','saved a year'],['FTE:','{fte} FTE freed for other work'],['People:','time given back to the plant']],
   subs:["Man-hours saved a year, as recorded with each project's estimate",'{mh} hours a year = {fte} FTE at 2,740 hours per FTE','Built with {persondays} person-days of in-house work · {period}']},
  {titles:[['Productivity:','more value, more availability'],['Productivity:','{value} a year of value created'],['Availability:','{downtime} hours of downtime avoided a year'],['Payback in','{payback}']],
   subs:["Value created and downtime avoided, as recorded with each project's estimate",'{projects} projects · {period}','Simple payback of {payback} on {inhouse} of in-house cost']}
];
var TOKENS=['projects','live','progress','departments','avoided','avoidedLive','pct','inhouse','benchmark','mh','fte','downtime','energy','value','payback','persondays','period'];
function tokens(){
  return {projects:n0(D.L.length),live:n0(D.live.length),progress:n0(D.prog.length),departments:n0(D.nDepts),avoided:cr(D.B-D.A),avoidedLive:cr(D.mB-D.mA),
    liveWord:D.live.length?'Live projects':'Projects',pct:pctLower(D.A,D.B)+'%',inhouse:cr(D.A),benchmark:cr(D.B),mh:n0(D.mh),fte:fte2(D.mh),downtime:n0(D.dt),energy:n0(D.kwh),
    value:cr(D.valY),payback:D.payback==null?'–':years(D.payback),persondays:n0(D.pd),period:X.period};
}
function fill(t,T){return String(t||'').replace(/\{(\w+)\}/g,function(m,k){return T.hasOwnProperty(k)?T[k]:m;});}
/* the heading of slide i as chosen: h = {t: option or -1 for own, title, em, s: option or -1, sub} */
function chosenHead(i){
  var h=(X.heading&&X.heading(i))||{},H=HEADS[i],T=tokens();
  var ti=h.t==null?0:+h.t,si=h.s==null?0:+h.s;
  var t=ti<0?[h.title||'',h.em||'']:(H.titles[ti]||H.titles[0]),sub=si<0?(h.sub||''):(H.subs[si]||H.subs[0]);
  return {title:fill(t[0],T),em:fill(t[1],T),sub:fill(sub,T)};
}
/* subheading text: escaped, then **bold** */
function subHtml(t){return e(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');}
function headInner(i){
  var c=chosenHead(i);
  var len=(c.title+' '+c.em).length;   // a long heading gets smaller type, so it stays on one or two short lines and the slide still fits
  return '<p class="veb">'+e(EYEBROW)+'</p><h2'+(len>70?' class="hx"':(len>34?' class="hl"':''))+'>'+e(c.title)+(c.em?' <em>'+e(c.em)+'</em>':'')+'</h2>'+(c.sub?'<p class="vsub">'+subHtml(c.sub)+(i===1&&X.choiceNote?' · '+e(X.choiceNote):'')+'</p>':'');
}
function head(i){
  return '<div class="vphoto" style="'+photoStyle(X.photo?X.photo(i):'assets/img/'+PHOTO[i])+'"></div><div class="vhead">'+headInner(i)+'</div>';
}
function card(cls,n,title,sub,body,extra){
  return '<div class="vcard '+cls+(extra?' '+extra:'')+'"><div class="vch"><span class="vn">'+n+'</span><div class="vct"><b>'+e(title)+'</b>'+(sub?'<small>'+e(sub)+'</small>':'')+'</div>'+
    '</div><div class="vcb">'+body+'</div></div>';
}
function foot(text,chips,iconName){
  return '<div class="vfoot"><span class="vfi">'+ic(iconName||'trophy')+'</span><p>'+e(text)+'</p>'+
    (chips.length?'<div class="vchips">'+chips.map(function(c){return '<span>'+ic(c[0])+'<b>'+e(c[1])+'</b>'+e(c[2])+'</span>';}).join('')+'</div>':'')+'</div>';
}
var BAR=0.8;   // a full bar takes 80% of its row, leaving room for its value
/* horizontal bars in HTML: rows [{label, sub?, icon?, value, text?, share?}] */
function bars(rows,opt){
  opt=opt||{};var max=opt.max||Math.max.apply(null,[1].concat(rows.map(function(r){return +r.value||0;})));
  return '<div class="vbars'+(opt.cls?' '+opt.cls:'')+'">'+rows.map(function(r){
    var w=Math.max(1,Math.min(100,(+r.value||0)/max*100));
    return '<div class="vbr">'+(r.icon?'<span class="vbi">'+ic(r.icon)+'</span>':'')+'<span class="vbl">'+e(r.label)+(r.sub?'<small>'+e(r.sub)+'</small>':'')+'</span>'+
      '<span class="vbt"><i style="width:'+(w*BAR).toFixed(1)+'%"></i><b>'+e(r.text!=null?r.text:r.value)+'</b></span>'+(r.share!=null?'<span class="vshare">'+e(r.share)+'</span>':'')+'</div>';
  }).join('')+'</div>';
}
function none(text){return '<p class="vnone">'+ic('doc')+'<span>'+e(text)+'</span></p>';}
function topBy(L,f,n){return L.filter(function(p){return f(p)>0;}).sort(function(a,b){return f(b)-f(a);}).slice(0,n);}

/* ---------- Business KPI: imported entries carry it in the note header "[Estimated from the project list, #12 | Hazira | Productivity | ...]" ---------- */
var KPI={'quality & process excelence':'Quality','quality & process excellence':'Quality','quality':'Quality','safety and asset integrity':'HSE and safety','hse':'HSE and safety','hse and safety':'HSE and safety',
  'work force optimization':'Workforce optimisation','workforce optimisation':'Workforce optimisation','productivity':'Productivity','reliability':'Reliability','sustainability':'Sustainability','others':'Others'};
var KPI_ICON={'Productivity':'chart','Quality':'target','Reliability':'shield','Others':'gear','Sustainability':'leaf','Workforce optimisation':'people','HSE and safety':'helmet','Not given':'doc'};
function kpiOf(note){
  var m=/^\[([^\]]*)\]/.exec(note||'');if(!m)return 'Not given';
  var parts=m[1].split('|');for(var i=0;i<parts.length;i++){var k=KPI[parts[i].trim().toLowerCase()];if(k)return k;}
  return 'Not given';
}

/* ---------- the figures, all from the chosen projects ---------- */
function figures(L){
  var f={L:L,live:L.filter(function(p){return p.status==='completed';}),prog:L.filter(function(p){return p.status==='progress';}),
    plan:L.filter(function(p){return p.status!=='completed'&&p.status!=='progress';}),ver:L.filter(function(p){return p.wf==='verified';}).length};
  f.A=sum(L,function(p){return p.a;});f.B=sum(L,function(p){return p.b;});
  f.money=f.live.length?f.live:L;f.mA=sum(f.money,function(p){return p.a;});f.mB=sum(f.money,function(p){return p.b;});
  f.pd=sum(L,function(p){return p.pd;});f.effortFte=f.pd*HOURS_PER_DAY/HOURS_PER_FTE;
  var staffed=L.filter(function(p){return p.team>0;});f.team=staffed.length?sum(staffed,function(p){return p.team;})/staffed.length:0;
  f.valY=sum(L,function(p){return p.valY;});f.valO=sum(L,function(p){return p.valO;});
  f.payback=f.valY>0?Math.max(0,(f.A-f.valO)/f.valY):null;
  f.depts={};L.forEach(function(p){f.depts[p.dept]=(f.depts[p.dept]||0)+1;});f.nDepts=Object.keys(f.depts).length;
  /* benefits recorded with the estimates: per category and per project */
  f.cat={};
  L.forEach(function(p){
    p.mh=0;p.dt=0;p.kwh=0;p.mhDesc='';
    (p.benefits||[]).forEach(function(b){
      var c=f.cat[b.cat]||(f.cat[b.cat]={id:b.cat,qtyY:0,qtyO:0,amtY:0,amtO:0,n:0,projects:{}});
      var q=+b.qty||0,amt=q*(+b.rate||0);
      if(b.once){c.qtyO+=q;c.amtO+=amt;}else{c.qtyY+=q;c.amtY+=amt;}
      if(!c.projects[p.id]){c.projects[p.id]=1;c.n++;}
      if(!b.once){if(b.cat==='manhours'){p.mh+=q;if(!p.mhDesc)p.mhDesc=b.desc||'';}else if(b.cat==='downtime')p.dt+=q;else if(b.cat==='energy')p.kwh+=q;}
    });
  });
  var g=function(id,k){return f.cat[id]?f.cat[id][k]:0;};
  f.mh=g('manhours','qtyY');f.mhN=g('manhours','n');f.fteSaved=f.mh/HOURS_PER_FTE;
  f.dt=g('downtime','qtyY');f.dtN=g('downtime','n');f.kwh=g('energy','qtyY');f.kwhN=g('energy','n');
  /* delivery: completed projects with both dates */
  var done=f.live.filter(function(p){return p.start&&p.end&&p.end>=p.start;});
  f.deliveryN=done.length;f.deliveryDays=done.length?sum(done,function(p){return (Date.parse(p.end)-Date.parse(p.start))/864e5;})/done.length:0;
  return f;
}

/* ---------- illustrations ---------- */
function artScreens(){
  var screen=function(x,y,w,h,kind){
    var s='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="4" fill="#111827"/><rect x="'+(x+4)+'" y="'+(y+4)+'" width="'+(w-8)+'" height="'+(h-8)+'" rx="2" fill="#f8fafc"/>';
    if(kind==='line')s+='<polyline points="'+[0,1,2,3,4,5,6,7].map(function(i){return (x+10+i*(w-20)/7)+','+(y+h*0.55-[4,12,6,16,10,20,14,24][i]);}).join(' ')+'" fill="none" stroke="#2563eb" stroke-width="2"/>'+
      [0,1,2,3,4,5,6].map(function(i){var bh=[8,12,10,16,14,20,24][i];return '<rect x="'+(x+12+i*(w-24)/7)+'" y="'+(y+h-10-bh)+'" width="'+((w-24)/7-3)+'" height="'+bh+'" fill="#0f9488"/>';}).join('');
    else if(kind==='donut')s+='<circle cx="'+(x+w/2)+'" cy="'+(y+h/2)+'" r="'+(h/4)+'" fill="none" stroke="#0f9488" stroke-width="7"/><path d="M'+(x+w/2)+' '+(y+h/4)+'a'+(h/4)+' '+(h/4)+' 0 0 1 '+(h/4)+' '+(h/4)+'" fill="none" stroke="#f59e0b" stroke-width="7"/>';
    else s+=[0,1,2,3,4].map(function(i){return '<rect x="'+(x+10)+'" y="'+(y+12+i*((h-20)/5))+'" width="'+(w-20)+'" height="'+((h-20)/5-3)+'" fill="'+(i%2?'#e2e8f0':'#cbd5e1')+'"/>';}).join('');
    return s;
  };
  return '<svg viewBox="0 0 320 130" class="vart" aria-hidden="true">'+screen(4,26,86,78,'table')+screen(96,8,128,100,'line')+screen(230,26,86,78,'donut')+'<rect x="150" y="108" width="20" height="10" fill="#111827"/><rect x="134" y="118" width="52" height="5" rx="2" fill="#111827"/></svg>';
}
function artCoins(){
  var s='<svg viewBox="0 0 160 90" class="vmini" aria-hidden="true">';
  [3,5,7,9,11].forEach(function(n,k){var x=10+k*28;for(var i=0;i<n;i++)s+='<ellipse cx="'+(x+11)+'" cy="'+(84-i*6)+'" rx="12" ry="4" fill="'+(i===n-1?'#e5e7eb':'#9ca3af')+'" stroke="#6b7280" stroke-width=".8"/>';});
  return s+'<path d="M8 60C50 52 95 36 140 8" fill="none" stroke="#2563eb" stroke-width="4"/><path d="M128 6l14-2-6 13z" fill="#2563eb"/></svg>';
}
function artBarsUp(){
  var s='<svg viewBox="0 0 160 90" class="vmini" aria-hidden="true">';
  [14,26,38,54,70].forEach(function(h,k){s+='<rect x="'+(14+k*28)+'" y="'+(86-h)+'" width="20" height="'+h+'" rx="2" fill="#7c3aed" opacity="'+(0.55+k*0.1)+'"/>';});
  return s+'<path d="M8 66C50 58 95 40 140 8" fill="none" stroke="#6d28d9" stroke-width="4"/><path d="M128 6l14-2-6 13z" fill="#6d28d9"/></svg>';
}

/* ---------- 1. working principle: what the department builds, for whom, and what it gives ---------- */
function sPrinciple(){
  var depts=Object.keys(D.depts).map(function(k){return {k:k,n:D.depts[k]};}).sort(function(a,b){return b.n-a.n;});
  var shown=depts.slice(0,5),rest=depts.slice(5),restN=sum(rest,function(d){return d.n;});
  var types={};D.L.forEach(function(p){var t=p.type||'other';var o=types[t]||(types[t]={t:t,n:0});o.n++;});
  var T=Object.keys(types).map(function(k){return types[k];}).sort(function(a,b){return b.n-a.n;}).slice(0,4);
  var c1='<p class="vtxt">'+e(plural(D.L.length,'project')+' for '+plural(D.nDepts,'department')+', built on their plant and Level-2 data.')+'</p>'+
    bars(shown.map(function(d){return {icon:'factory',label:d.k,value:d.n,text:n0(d.n)};}).concat(rest.length?[{icon:'factory',label:plural(rest.length,'other department'),value:restN,text:n0(restN)}]:[]),{cls:'o'});
  var c2='<p class="vtxt">'+e('Built in-house: '+n0(D.pd)+' person-days ('+X.num(D.effortFte,1)+' FTE-years)'+(D.team?', '+X.num(D.team,1)+' people per project on average':'')+'.')+'</p>'+
    '<div class="vsteps">'+['Data acquisition','Data processing','Analytics & modelling','In-house development'].map(function(t,i){return (i?'<span class="varr">'+ic('arrow')+'</span>':'')+'<div class="vstep s'+i+'">'+ic(['database','gear','chart','code'][i])+'<span>'+e(t)+'</span></div>';}).join('')+'</div>'+
    artScreens()+'<div class="vgrid4">'+T.map(function(t){return '<div class="vit sm">'+ic(TYPE_ICON[t.t]||'monitor')+'<span><b>'+n0(t.n)+'</b> '+e(TYPE[t.t]||t.t)+'</span></div>';}).join('')+'</div>';
  var imp=[['coins',cr(D.mB-D.mA),'cost avoided'+(D.live.length?' by live projects':'')],['people',n0(D.mh)+' h','man-hours saved a year'],
    ['clock',n0(D.dt)+' h','downtime avoided a year'],['chart',cr(D.valY),'value created a year']];
  var c3='<p class="vtxt">'+e(plural(D.live.length,'project')+' live, '+n0(D.prog.length)+' in progress'+(D.plan.length?', '+n0(D.plan.length)+' planned':'')+': software and tools for operations, maintenance and management.')+'</p>'+
    '<div class="vstat">'+[['check',D.live.length,'Live'],['clock',D.prog.length,'In progress'],['shield',D.ver,'Verified']].map(function(s){return '<div>'+ic(s[0])+'<b>'+n0(s[1])+'</b><span>'+s[2]+'</span></div>';}).join('')+'</div>'+
    '<div class="vimpact"><h4>Key impact</h4><div>'+imp.map(function(r,i){return '<div class="vimp i'+i+'">'+ic(r[0])+'<b>'+e(r[1])+'</b><span>'+e(r[2])+'</span></div>';}).join('')+'</div></div>';
  return head(0)+
    '<div class="vbody vprin">'+card('c-or','1','Plant and Level-2 data','The departments served',c1)+'<span class="vflow">'+ic('arrow')+'</span>'+
      card('c-te','2','In-house digitization & development','Build, integrate, analyse',c2)+'<span class="vflow">'+ic('arrow')+'</span>'+card('c-nv','3','Decision-making software & tools','Business impact',c3)+'</div>'+
    '<div class="vstrip"><div class="v1"><b>'+pctLower(D.A,D.B)+'%</b><span>lower cost than a software company</span></div><div class="v2"><b>'+e(cr(D.A))+'</b><span>'+e('in-house, against '+cr(D.B)+' from a software company')+'</span></div>'+
      '<div class="v3">'+[['chart',plural(D.L.length,'project')],['people',fte2(D.mh)+' FTE saved a year'],['coins',cr(D.valY)+' a year']].map(function(c){return '<span>'+ic(c[0])+e(c[1])+'</span>';}).join('')+'</div></div>';
}

/* ---------- 2. benefits at a glance ---------- */
function sGlance(){
  var who=D.live.length?'By the '+plural(D.live.length,'live project'):'By the '+plural(D.L.length,'chosen project');
  var money='<div class="vbig or">'+e(cr(D.mB-D.mA))+'<small>avoided</small></div><p class="vtxt">'+e(who+': built in-house for '+cr(D.mA)+' against '+cr(D.mB)+' from a software company ('+pctLower(D.mA,D.mB)+'% lower), with hardware, people and licences.')+'</p>'+
    '<div class="vcall">'+artCoins()+'<div class="vbox or"><b>'+pctLower(D.mA,D.mB)+'%</b><span>lower cost vs external</span></div></div>';
  var fte='<div class="vbig te">'+e(n0(D.mh))+'<small>man-hours a year</small></div><p class="vtxt">'+e(D.mhN?'Saved, as recorded with the estimates of '+plural(D.mhN,'project')+' (1 FTE = '+n0(HOURS_PER_FTE)+' hours).':'No man-hours saved recorded yet: add them on a project\'s Value step.')+'</p>'+
    '<div class="vcall"><span class="vpeople">'+ic('people')+ic('down','vdown')+'</span><div class="vbox te"><b>'+fte2(D.mh)+'</b><span>FTE saved a year</span></div></div>';
  var time='<div class="vbig bl">'+e(n0(D.dt))+'<small>hours a year</small></div><p class="vtxt">'+e((D.dtN?'Downtime avoided, as recorded with '+plural(D.dtN,'project')+'.':'No downtime avoided recorded yet.')+
      (D.deliveryN?' Projects go live in '+n0(D.deliveryDays/30.4)+' months on average ('+plural(D.deliveryN,'completed project')+' with dates).':''))+'</p>'+
    '<div class="vcall"><span class="vwatch">'+ic('clock')+'</span><div class="vbox bl"><b>'+e(D.kwh?n0(D.kwh):X.num(D.effortFte,1))+'</b><span>'+e(D.kwh?'kWh of energy saved a year':'FTE-years of in-house effort')+'</span></div></div>';
  var val='<div class="vbig pu">'+e(cr(D.valY))+'<small>a year</small></div><p class="vtxt">'+e('Value created, as recorded with the estimates'+(D.valO?', and '+cr(D.valO)+' one-time':'')+'.'+
      (D.A>0?' That is '+n0(D.valY/D.A*100)+'% of the in-house cost each year.':''))+'</p>'+
    '<div class="vcall">'+artBarsUp()+'<div class="vbox pu"><b>'+e(D.payback==null?'–':years(D.payback))+'</b><span>simple payback</span></div></div>';
  var hc=function(cls,icon,title,s,body){return '<div class="vcard '+cls+' vg"><div class="vch"><span class="vn">'+ic(icon)+'</span><div class="vct"><b>'+e(title)+'</b><small>'+e(s)+'</small></div></div><div class="vcb">'+body+'</div></div>';};
  return head(1)+
    '<div class="vbody vglance">'+hc('c-or','coins','Money','Cost avoidance',money)+hc('c-te','people','FTE','Man-hours saved',fte)+
      hc('c-bl','clock','Time','Downtime avoided',time)+hc('c-pu','chart','Value','Value created',val)+'</div>'+
    '<div class="vport"><span class="vpi">'+ic('doc')+'</span><div><b>Project portfolio</b><span>'+e(X.period)+'</span></div>'+
      '<div><b>'+n0(D.L.length)+'</b><span>Total projects</span></div><div><b>'+n0(D.live.length)+' <i class="d g"></i></b><span>Live</span></div>'+
      '<div><b>'+n0(D.prog.length)+' <i class="d y"></i></b><span>In progress</span></div><div><b>'+n0(D.ver)+' <i class="d b"></i></b><span>Verified</span></div>'+
      '<div><b>'+n0(D.nDepts)+'</b><span>Departments</span></div></div>'+
    foot(plural(D.L.length,'project')+': '+cr(D.B-D.A)+' avoided against a software company, '+cr(D.valY)+' a year of value and '+n0(D.mh)+' man-hours a year saved.',
      [['coins',cr(D.B-D.A),'avoided'],['people',fte2(D.mh),'FTE saved'],['chart',cr(D.valY),'a year']]);
}

/* ---------- 3. money ---------- */
function sMoney(){
  var groups=[['Live',D.live],['In progress',D.prog],['All '+n0(D.L.length),D.L]].filter(function(g,i){return g[1].length&&!(i===2&&(g[1].length===D.live.length||g[1].length===D.prog.length));});
  var G=groups.map(function(g){return {label:g[0],n:g[1].length,a:sum(g[1],function(p){return p.a;}),b:sum(g[1],function(p){return p.b;})};});
  var max=Math.max.apply(null,[1].concat(G.map(function(g){return g.b;}))),step=max>5e8?2e8:(max>2e8?5e7:(max>5e7?2e7:(max>1e7?5e6:2e6)));
  var top=Math.ceil(max*1.25/step)*step,grid='';
  for(var v=0;v<=top;v+=step)grid+='<span style="bottom:'+(v/top*100)+'%"><em>'+crN(v)+'</em></span>';
  var colsH='<div class="vcols"><div class="vgridl">'+grid+'</div>'+G.map(function(g){
    return '<div class="vcg"><div class="vcall2" style="bottom:calc('+(g.b/top*100).toFixed(1)+'% + var(--u)*2)">'+e(cr(g.b-g.a))+'<small>('+pctLower(g.a,g.b)+'%) avoided</small></div>'+
      '<div class="vcb2"><i class="a" style="height:'+(g.a/top*100)+'%"><b>'+crN(g.a)+'</b></i><i class="b" style="height:'+(g.b/top*100)+'%"><b>'+crN(g.b)+'</b></i></div>'+
      '<span class="vcl">'+e(g.label)+'<small>'+(g.label.indexOf('All')===0?'projects':'('+plural(g.n,'project')+')')+'</small></span></div>';}).join('')+'</div>'+
    '<div class="vleg"><i class="a"></i>Central Automation (in-house)<i class="b"></i>Software company (benchmark)</div>'+
    '<div class="vsave">'+ic('coins')+'<b>Avoided:</b>'+G.map(function(g){return '<span>'+e(g.label)+': <b>'+e(cr(g.b-g.a))+'</b> ('+pctLower(g.a,g.b)+'%)</span>';}).join('')+'</div>';
  var byK={};D.L.forEach(function(p){var k=kpiOf(p.note);var o=byK[k]||(byK[k]={k:k,n:0,v:0});o.n++;o.v+=p.b-p.a;});
  var K=Object.keys(byK).map(function(k){return byK[k];}).filter(function(o){return o.v>0;}).sort(function(a,b){return b.v-a.v;}).slice(0,8);
  var tot=sum(K,function(o){return o.v;});
  var kpi=K.length?bars(K.map(function(o){return {icon:KPI_ICON[o.k]||'chart',label:o.k+' ('+o.n+')',value:o.v,text:crN(o.v),share:tot>0?Math.round(o.v/tot*100)+'%':''};}),{cls:'g'})+
    '<div class="vtot"><span>Total</span><b>'+e(cr(tot))+'</b><small>cost avoided ('+plural(D.L.length,'project')+')</small></div>':none('No cost avoided recorded for these projects.');
  var cats=Object.keys(D.cat).map(function(k){return D.cat[k];}).filter(function(c){return c.amtY>0;}).sort(function(a,b){return b.amtY-a.amtY;}).slice(0,6);
  var valH=cats.length?'<div class="vgains">'+cats.map(function(c){return '<div>'+ic(CAT_ICON[c.id]||'coins')+'<b>'+e(cr(c.amtY))+'</b><span>'+e(catName(c.id)+' a year, '+plural(c.n,'project'))+'</span></div>';}).join('')+'</div>'
    :none('No value recorded with these projects\' estimates yet: add benefits on a project\'s Value step.');
  return head(2)+
    '<div class="vbody vmoney">'+card('c-bl','1','Cost: in-house vs. software company','₹ Cr',colsH)+
      card('c-gr','2','Cost avoided by business KPI','₹ Cr ('+plural(D.L.length,'project')+')',kpi,'vkpi')+
      card('c-nv','3','Value created a year, by benefit','Recorded with the estimates',valH,'vwide')+'</div>'+
    foot('Built in-house for '+cr(D.A)+' against '+cr(D.B)+' from a software company: '+cr(D.B-D.A)+' avoided ('+pctLower(D.A,D.B)+'% lower), and '+cr(D.valY)+' a year of value recorded.',
      [['coins',pctLower(D.A,D.B)+'%','lower cost'],['chart',cr(D.valY),'value a year']],'coins');
}

/* ---------- 4. FTE ---------- */
function sFte(){
  var rows=topBy(D.L,function(p){return p.mh;},5);
  var table=rows.length?'<table class="vtab"><thead><tr><th>Project</th><th>Department</th><th>What is saved</th><th>Hours a year</th><th>FTE</th></tr></thead><tbody>'+rows.map(function(p){
    return '<tr><td>'+ic('doc')+e(cut(p.name,48))+'</td><td>'+e(p.dept)+'</td><td>'+e(cut(p.mhDesc||'Man-hours saved',40))+'</td><td class="g">'+n0(p.mh)+'</td><td>'+fte2(p.mh)+'</td></tr>';}).join('')+'</tbody></table>'
    :none('No man-hours saved recorded with these projects yet: add "Man-hours saved" on a project\'s Value step (hours a year).');
  var total='<div class="vtotal"><div class="vbig te">'+e(n0(D.mh))+'<small>man-hours a year</small></div><div class="vbox te">'+ic('people')+'<span>Equivalent to</span><b>'+fte2(D.mh)+' FTE</b></div></div>'+
    '<div class="vnote">'+ic('clock')+'<span>'+e('Recorded with '+plural(D.mhN,'project')+' of '+n0(D.L.length)+'. 1 FTE = '+n0(HOURS_PER_FTE)+' hours a year.')+'</span></div>';
  var byD={};D.L.forEach(function(p){if(p.mh>0)byD[p.dept]=(byD[p.dept]||0)+p.mh;});
  var Dd=Object.keys(byD).map(function(k){return {label:k,value:byD[k],text:n0(byD[k])+' h'};}).sort(function(a,b){return b.value-a.value;}).slice(0,6);
  var effort;
  if(Dd.length)effort=bars(Dd,{cls:'o'});
  else{var byT={};D.L.forEach(function(p){var t=TYPE[p.type]||p.type||'Other';byT[t]=(byT[t]||0)+p.pd;});
    effort=bars(Object.keys(byT).map(function(k){return {label:k,value:byT[k],text:n0(byT[k])+' pd'};}).sort(function(a,b){return b.value-a.value;}).slice(0,6),{cls:'o'});}
  var take='<div class="vtake">'+[['people',n0(D.mh)+' man-hours','saved a year ('+fte2(D.mh)+' FTE)'],['doc',plural(D.mhN,'project'),'with man-hours saved recorded'],
    ['gear',n0(D.pd)+' person-days','of in-house effort ('+X.num(D.effortFte,1)+' FTE-years)'],['chart',D.team?X.num(D.team,1)+' people':'–','per project team on average']].map(function(r){return '<div>'+ic(r[0])+'<span><b>'+e(r[1])+'</b>'+e(r[2])+'</span></div>';}).join('')+'</div>';
  return head(3)+
    '<div class="vbody vfte">'+card('c-bl','1','Man-hours saved, by project','Largest first',table,'vt1')+
      card('c-te','2','Total time saved with projects','',total,'vt2')+card('c-or','3',Dd.length?'Man-hours saved by department':'In-house effort by project type','',effort,'vt3')+card('c-pu','4','Key takeaways','',take,'vt4')+'</div>'+
    foot(n0(D.mh)+' man-hours a year saved ('+fte2(D.mh)+' FTE) on '+plural(D.mhN,'project')+', with '+n0(D.pd)+' person-days of in-house work.',
      [['people',fte2(D.mh),'FTE saved'],['clock',n0(D.mh),'hours a year']],'target');
}

/* ---------- 5. productivity ---------- */
function sProd(){
  var V=topBy(D.L,function(p){return p.valY;},5);
  var valB=V.length?bars(V.map(function(p){return {label:cut(p.name,44),sub:p.dept,value:p.valY,text:cr(p.valY)};}),{cls:'t'}):none('No value a year recorded with these projects yet.');
  var DT=topBy(D.L,function(p){return p.dt;},3);
  var avail='<div class="vpot"><span class="vpi2">'+ic('clock')+'</span><div class="vbig te">'+e(n0(D.dt)+' h')+'<small>'+e('downtime avoided a year'+(D.dtN?', '+plural(D.dtN,'project'):''))+'</small></div>'+
      '<div class="vbig te">'+e(n0(D.kwh))+'<small>'+e('kWh of energy saved a year'+(D.kwhN?', '+plural(D.kwhN,'project'):''))+'</small></div></div>'+
    '<div class="vpot2"><div><h4>Downtime avoided, largest (hours a year)</h4>'+(DT.length?bars(DT.map(function(p){return {label:cut(p.name,30),value:p.dt,text:n0(p.dt)};}),{cls:'t'}):none('None recorded yet.'))+'</div>'+
    '<div class="vside"><span>Projects go live in</span><b>'+e(D.deliveryN?n0(D.deliveryDays/30.4)+' months':'–')+'</b><span>'+e(D.deliveryN?'on average, '+plural(D.deliveryN,'completed project')+' with dates':'no completed project has both dates')+'</span></div></div>';
  var out='<div class="vout">'+ic('chart')+'<div><b>'+e(cr(D.valY))+'</b><span>'+e('value created a year, '+plural(D.L.filter(function(p){return p.valY>0;}).length,'project')+(D.valO?'; plus '+cr(D.valO)+' one-time':''))+'</span></div></div>';
  var take='<div class="vtake4">'+[['chart',cr(D.valY),'value a year'],['coins',D.A>0?n0(D.valY/D.A*100)+'%':'–','of the in-house cost, each year'],
    ['gauge',D.payback==null?'–':years(D.payback),'simple payback'],['clock',n0(D.dt)+' h','downtime avoided a year']].map(function(r){return '<div>'+ic(r[0])+'<b>'+e(r[1])+'</b><span>'+e(r[2])+'</span></div>';}).join('')+'</div>';
  return head(4)+
    '<div class="vbody vprod">'+card('c-bl','1','Value created a year, by project','Largest first, ₹',valB,'vp1')+
      card('c-te','2','Availability and delivery','Downtime avoided, energy saved, time to go live',avail,'vp2')+card('c-or','3','Value created','',out,'vp3')+card('c-pu','4','Key takeaways','',take,'vp4')+'</div>'+
    foot(cr(D.valY)+' a year of value and '+n0(D.dt)+' hours a year of downtime avoided, from '+plural(D.L.length,'project')+'.',
      [['chart',cr(D.valY),'a year'],['clock',n0(D.dt)+' h','downtime avoided']],'target');
}

var TITLES=['Working principle','Benefits at a glance','Money','FTE','Productivity'];
return {
  TITLES:TITLES,kpiOf:kpiOf,LIBRARY:LIBRARY,PHOTO:PHOTO,photoStyle:photoStyle,HEADS:HEADS,TOKENS:TOKENS,
  /* the heading choices of slide i with their figures filled in, for the Headings panel; and the heading block alone, to change it in place */
  options:function(i,x){X=x;D=figures(x.L);var T=tokens();return {titles:HEADS[i].titles.map(function(t){return [fill(t[0],T),fill(t[1],T)];}),subs:HEADS[i].subs.map(function(s){return fill(s,T).replace(/\*\*/g,'');})};},
  headInner:function(i,x){X=x;D=figures(x.L);return headInner(i);},
  /* i: 0..4; x: { esc, num, L (chosen projects), period, choiceNote, cats (value categories: id -> {name, unit}), photo(i) -> picture address, heading(i) -> the chosen heading } */
  make:function(i,x){X=x;D=figures(x.L);return [sPrinciple,sGlance,sMoney,sFte,sProd][i]();}
};
})();
