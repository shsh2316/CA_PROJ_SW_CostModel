/* Dashboard (project_dashboard.aspx): the register as a deck of slides for a chosen set of projects.
   Choose a period (projects active in it, by their start and end dates), the review state, and any number of projects; every slide follows the choice.
   Data: api/estimator.ashx?action=projects&lite=1 (the entries without their saved estimates). Figures are the register's recorded values,
   the same as the Approval totals and the report. Charts are drawn here as inline SVG: no library, nothing from the internet. */
(function(){
'use strict';

var API='api/estimator.ashx';
var HOURS_PER_FTE=2740,HOURS_PER_DAY=8;   // 1 FTE = 2,740 hours a year (the department's figure); a person-day = 8 hours
var STORE='ca-dashboard.filters';
var TYPE={web:'Web application',desktop:'Desktop application',mobile:'Mobile app',interface:'Interface / integration',dash:'Dashboard / reporting',ai:'AI / vision system'};
var STAT={planned:'Planned',progress:'In progress',completed:'Completed'};
var WF={pending:'Awaiting verification',info:'Needs information',verified:'Verified'};
var ALL=[],F={from:'',to:'',undated:true,ver:false,ids:[],q:''},SLIDE=0,ME={};

function $(s){return document.querySelector(s);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function num(n,d){return Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:d==null?0:d});}
function money(n){n=+n||0;var a=Math.abs(n);return (n<0?'-':'')+'₹'+(a>=1e7?(a/1e7).toFixed(2)+' Cr':(a>=1e5?(a/1e5).toFixed(1)+' L':num(a)));}
function short(n){n=+n||0;var a=Math.abs(n);return a>=1e7?(n/1e7).toFixed(1)+' Cr':(a>=1e5?(n/1e5).toFixed(1)+' L':num(n));}
function fte(pd){return pd*HOURS_PER_DAY/HOURS_PER_FTE;}
function pct(a,b){return b>0?Math.round((1-a/b)*100):0;}
function iso(d){return d.toISOString().slice(0,10);}
function fmtDate(s){if(!s)return '';var d=new Date(s+'T00:00:00Z');return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});}
function say(text){var el=$('#dMsg');el.hidden=!text;el.textContent=text||'';}

/* ---------- data ---------- */
function load(){
  return fetch(API+'?action=projects&lite=1',{credentials:'same-origin',cache:'no-store',headers:{'X-Requested-With':'XMLHttpRequest'}}).then(function(r){
    var login=document.body.dataset.loginUrl;
    if(r.status===401&&login){location.href=login+'?returnUrl='+encodeURIComponent(location.pathname+location.search);return new Promise(function(){});}
    return r.json().catch(function(){return null;}).then(function(j){
      if(!j||!r.ok||j.error)throw new Error((j&&j.error&&j.error.message)||'The register could not be read.');
      return j;
    });
  });
}
function shape(d){
  return {id:d._id,name:d.name||'',dept:d.department||'Not given',fy:d.fy||'',kind:d.kind,status:d.status,type:d.type||'',wf:d.wf||'pending',
    start:d.start||'',end:d.end||'',costed:d.costed!==false,
    a:+d.value||0,b:d.valueB!=null?+d.valueB:(+d.value||0),oneTime:+d.oneTime||0,yearly:+d.yearly||0,pd:+d.personDays||0,team:+d.team||0,
    valY:+d.valueYearly||0,valO:+d.valueOnce||0};
}

/* ---------- the choice ---------- */
function dated(p){return !!(p.start||p.end);}
/* active in the period: it started before the period ends, and it ended (or is still running) after the period starts */
function inPeriod(p){
  if(!F.from&&!F.to)return true;
  if(!dated(p))return F.undated;
  var s=p.start||p.end,e=p.end||(p.start?'9999-12-31':p.end);
  return (!F.to||s<=F.to)&&(!F.from||e>=F.from);
}
function base(){return ALL.filter(function(p){return (!F.ver||p.wf==='verified')&&inPeriod(p);});}
function chosen(){var b=base();if(!F.ids.length)return b;var set={};F.ids.forEach(function(i){set[i]=1;});return b.filter(function(p){return set[p.id];});}

function saveChoice(){
  var q=new URLSearchParams();
  if(F.from)q.set('from',F.from);if(F.to)q.set('to',F.to);if(!F.undated)q.set('undated','0');if(F.ver)q.set('ver','1');
  if(F.ids.length)q.set('p',F.ids.join(','));
  var qs=q.toString();
  try{history.replaceState(null,'',location.pathname+(qs?'?'+qs:''));}catch(e){}
  try{localStorage.setItem(STORE,JSON.stringify({from:F.from,to:F.to,undated:F.undated,ver:F.ver,ids:F.ids}));}catch(e){}
}
function readChoice(){
  var q=new URLSearchParams(location.search),o=null;
  if(['from','to','undated','ver','p'].some(function(k){return q.has(k);}))
    o={from:q.get('from')||'',to:q.get('to')||'',undated:q.get('undated')!=='0',ver:q.get('ver')==='1',ids:(q.get('p')||'').split(',').filter(Boolean)};
  else{try{o=JSON.parse(localStorage.getItem(STORE)||'null');}catch(e){o=null;}}
  if(o){
    var okDate=function(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||'')?v:'';};
    F.from=okDate(o.from);F.to=okDate(o.to);F.undated=o.undated!==false;F.ver=!!o.ver;
    var known={};ALL.forEach(function(p){known[p.id]=1;});
    F.ids=(Array.isArray(o.ids)?o.ids:[]).filter(function(i){return known[i];});
  }
}

/* ---------- filter bar ---------- */
function paintFilter(){
  $('#dFrom').value=F.from;$('#dTo').value=F.to;$('#dUndated').checked=F.undated;$('#dVer').checked=F.ver;
  var nUnd=ALL.filter(function(p){return !dated(p)&&(!F.ver||p.wf==='verified');}).length;
  $('#dUndatedLbl').textContent='Include projects without dates ('+nUnd+')';
  $('#dUndated').disabled=!F.from&&!F.to;
  var b=base(),c=chosen();
  $('#dPickBtn').textContent='Projects: '+(F.ids.length?c.length+' chosen':'all '+b.length)+' ▾';
  paintList();
  var names={};ALL.forEach(function(p){names[p.id]=p;});
  var inBase={};b.forEach(function(p){inBase[p.id]=1;});
  $('#dChips').innerHTML=F.ids.length?F.ids.map(function(id){var p=names[id];if(!p)return '';
    return '<span class="dchip'+(inBase[id]?'':' out')+'" title="'+(inBase[id]?'':'Outside the period or review state chosen')+'">'+esc(p.name)+' <small>'+esc(p.fy)+'</small><button type="button" class="x" data-unpick="'+esc(id)+'" aria-label="Remove '+esc(p.name)+'">×</button></span>';}).join('')+
    '<button type="button" class="lnk" id="dNone2">Clear the choice</button>':'';
}
function paintList(){
  var q=F.q.trim().toLowerCase(),set={};F.ids.forEach(function(i){set[i]=1;});
  var rows=base().filter(function(p){return !q||(p.name+' '+p.dept+' '+p.fy).toLowerCase().indexOf(q)>=0;})
    .sort(function(a,b){return a.name.localeCompare(b.name)||String(b.fy).localeCompare(String(a.fy));});
  $('#dList').innerHTML=rows.length?rows.map(function(p){
    return '<label class="ditem"><input type="checkbox" data-pick="'+esc(p.id)+'"'+(set[p.id]?' checked':'')+'><span>'+esc(p.name)+
      '<small>'+esc([p.dept,'FY '+p.fy,STAT[p.status]||'',p.start?fmtDate(p.start)+(p.end?' to '+fmtDate(p.end):' onwards'):'no dates'].filter(Boolean).join(' · '))+'</small></span></label>';}).join('')
    :'<p class="note" style="padding:8px">No projects match.</p>';
  $('#dPickCount').textContent=rows.length+' shown';
}

/* ---------- charts (inline SVG) ---------- */
/* rows: [{label, values:[a, b?]}]; horizontal bars, one or two series */
function hbars(rows,opt){
  opt=opt||{};var two=rows.some(function(r){return r.values.length>1;});
  var W=opt.W||600,lab=opt.labelW||190,bh=two?11:16,gap=two?16:10,rowH=(two?2*bh+2:bh)+gap,H=Math.max(rowH*rows.length+6,30);
  var max=Math.max.apply(null,[1].concat(rows.map(function(r){return Math.max.apply(null,r.values);})));
  var span=W-lab-70,y=4,h='<svg viewBox="0 0 '+W+' '+H+'" class="dchart hb" role="img" aria-label="'+esc(opt.title||'chart')+'">';
  rows.forEach(function(r){
    h+='<text x="'+(lab-8)+'" y="'+(y+(two?bh+4:bh-3))+'" text-anchor="end" class="cl">'+esc(r.label.length>30?r.label.slice(0,29)+'…':r.label)+'</text>';
    r.values.forEach(function(v,k){
      var w=Math.max(1,v/max*span),yy=y+k*(bh+2);
      h+='<rect x="'+lab+'" y="'+yy+'" width="'+w+'" height="'+bh+'" class="'+(k?'cb':'ca')+(opt.cls?' '+opt.cls:'')+'"/>';
      h+='<text x="'+(lab+w+5)+'" y="'+(yy+bh-2)+'" class="cv">'+esc((opt.fmt||short)(v))+'</text>';
    });
    y+=rowH;
  });
  return h+'</svg>';
}
/* columns by group (financial years): two series side by side */
function cols(rows,opt){
  opt=opt||{};var W=600,H=230,base=190,top=22,n=rows.length||1,gw=W/n,bw=Math.min(46,gw/2.6);
  var max=Math.max.apply(null,[1].concat(rows.map(function(r){return Math.max.apply(null,r.values);})));
  var h='<svg viewBox="0 0 '+W+' '+H+'" class="dchart" role="img" aria-label="'+esc(opt.title||'chart')+'">';
  rows.forEach(function(r,i){
    var cx=gw*i+gw/2;
    r.values.forEach(function(v,k){
      var hh=v/max*(base-top),x=cx+(k?3:-bw-3);
      h+='<rect x="'+x+'" y="'+(base-hh)+'" width="'+bw+'" height="'+Math.max(1,hh)+'" class="'+(k?'cb':'ca')+'"/>';
      h+='<text x="'+(x+bw/2)+'" y="'+(base-hh-5)+'" text-anchor="middle" class="cv">'+esc(short(v))+'</text>';
    });
    h+='<text x="'+cx+'" y="'+(base+20)+'" text-anchor="middle" class="cl">'+esc(r.label)+'</text>';
  });
  return h+'<line x1="0" y1="'+base+'" x2="'+W+'" y2="'+base+'" class="cax"/></svg>';
}
function legend(){return '<div class="dlegend"><i class="ca"></i>In-house (Central Automation) <i class="cb"></i>Software company (benchmark)</div>';}
function group(list,key,fields){
  var m={};list.forEach(function(p){var k=key(p)||'Not given';var g=m[k]||(m[k]={label:k,n:0});g.n++;fields.forEach(function(f){g[f]=(g[f]||0)+p[f];});});
  return Object.keys(m).map(function(k){return m[k];});
}
function top(list,f,n){return list.slice().sort(function(a,b){return f(b)-f(a);}).filter(function(p){return f(p)>0;}).slice(0,n);}

/* ---------- slides ---------- */
var TITLES=['Summary','Money','Effort and FTE','Value','Projects'];
function periodText(){
  if(!F.from&&!F.to)return 'All dates';
  return (F.from?fmtDate(F.from):'the start')+' to '+(F.to?fmtDate(F.to):'today')+(F.undated?', with projects that have no dates':'');
}
function head(i,list){
  return '<div class="shead"><span class="snum">'+(i+1)+' / '+TITLES.length+'</span><h2>'+esc(TITLES[i])+'</h2>'+
    '<span class="ssel">'+esc(list.length+' project'+(list.length===1?'':'s')+(F.ids.length?' chosen':'')+' · '+periodText()+(F.ver?' · verified only':''))+'</span></div>';
}
function tile(label,big,sub,cls){return '<div class="tile'+(cls?' '+cls:'')+'"><span class="tl">'+esc(label)+'</span><b>'+esc(big)+'</b>'+(sub?'<span class="ts">'+esc(sub)+'</span>':'')+'</div>';}
function sum(list,f){return list.reduce(function(a,p){return a+(typeof f==='function'?f(p):p[f]);},0);}
function topList(rows,val,title){
  return '<div class="spanel"><h3>'+esc(title)+'</h3><ol class="dtop">'+(rows.length?rows.map(function(p){return '<li><span>'+esc(p.name)+'<small>'+esc(p.dept+' · FY '+p.fy)+'</small></span><b>'+esc(val(p))+'</b></li>';}).join(''):'<li class="note">None</li>')+'</ol></div>';
}

function slideSummary(L){
  var A=sum(L,'a'),B=sum(L,'b'),pd=sum(L,'pd'),vy=sum(L,'valY'),vo=sum(L,'valO');
  var live=L.filter(function(p){return p.status==='completed';}).length,prog=L.filter(function(p){return p.status==='progress';}).length,plan=L.length-live-prog;
  var notCosted=L.filter(function(p){return !p.costed;}).length;
  var bar=L.length?['completed','progress','planned'].map(function(s){var n=L.filter(function(p){return p.status===s;}).length;return n?'<span class="sb s-'+s+'" style="flex:'+n+'">'+esc(STAT[s]+' '+n)+'</span>':'';}).join(''):'';
  return head(0,L)+'<div class="tiles">'+
    tile('Projects',num(L.length),live+' completed · '+prog+' in progress'+(plan?' · '+plan+' planned':''))+
    tile('In-house cost',money(A),'Central Automation, as recorded'+(notCosted?' ('+notCosted+' not costed yet)':''))+
    tile('Software company price',money(B),'benchmark for the same work')+
    tile('Cost avoided',money(B-A),pct(A,B)+'% below the benchmark','good')+
    tile('Effort',num(pd)+' person-days','= '+num(fte(pd),1)+' FTE-years (1 FTE = '+num(HOURS_PER_FTE)+' h)')+
    tile('Value created',money(vy)+' a year',vo?'and '+money(vo)+' one-time':'as recorded with the estimates','good')+
    '</div><div class="sbar">'+bar+'</div>';
}
function slideMoney(L){
  var byFy=group(L,function(p){return p.fy;},['a','b']).sort(function(x,y){return x.label.localeCompare(y.label);});
  var byType=group(L,function(p){return TYPE[p.type]||p.type;},['a','b']).sort(function(x,y){return y.a-x.a;});
  var byDept=group(L,function(p){return p.dept;},['a','b']).sort(function(x,y){return y.a-x.a;}).slice(0,6);
  return head(1,L)+'<div class="sgrid">'+
    '<div class="spanel"><h3>By financial year, ₹</h3>'+cols(byFy.map(function(g){return {label:'FY '+g.label,values:[g.a,g.b]};}),{title:'Cost by financial year'})+legend()+'</div>'+
    '<div class="spanel"><h3>By project type, ₹</h3>'+hbars(byType.map(function(g){return {label:g.label+' ('+g.n+')',values:[g.a,g.b]};}),{title:'Cost by type'})+'</div>'+
    '<div class="spanel"><h3>By department (largest 6), ₹</h3>'+hbars(byDept.map(function(g){return {label:g.label+' ('+g.n+')',values:[g.a,g.b]};}),{title:'Cost by department'})+'</div>'+
    topList(top(L,function(p){return p.b-p.a;},5),function(p){return money(p.b-p.a);},'Largest cost avoided')+
    '</div>';
}
function slideEffort(L){
  var pd=sum(L,'pd'),staffed=L.filter(function(p){return p.team>0;});
  var byType=group(L,function(p){return TYPE[p.type]||p.type;},['pd']).sort(function(x,y){return y.pd-x.pd;});
  var byDept=group(L,function(p){return p.dept;},['pd']).sort(function(x,y){return y.pd-x.pd;}).slice(0,6);
  var f1=function(v){return num(v)+' pd';};
  return head(2,L)+'<div class="tiles t3">'+
    tile('Person-days',num(pd),'in-house effort of the chosen projects')+
    tile('FTE-years',num(fte(pd),1),num(HOURS_PER_FTE)+' hours per FTE, 8 hours a day')+
    tile('Average team',staffed.length?(function(a){return num(a,1)+(Math.round(a*10)===10?' person':' people');})(sum(staffed,'team')/staffed.length):'-','per project with a team')+
    '</div><div class="sgrid g3">'+
    '<div class="spanel"><h3>Person-days by project type</h3>'+hbars(byType.map(function(g){return {label:g.label+' ('+g.n+')',values:[g.pd]};}),{fmt:f1,cls:'ce',title:'Effort by type',W:420,labelW:170})+'</div>'+
    '<div class="spanel"><h3>Person-days by department (largest 6)</h3>'+hbars(byDept.map(function(g){return {label:g.label+' ('+g.n+')',values:[g.pd]};}),{fmt:f1,cls:'ce',title:'Effort by department',W:420,labelW:170})+'</div>'+
    topList(top(L,function(p){return p.pd;},5),function(p){return num(p.pd)+' pd = '+num(fte(p.pd),2)+' FTE-yr';},'Largest efforts')+
    '</div>';
}
function slideValue(L){
  var A=sum(L,'a'),vy=sum(L,'valY'),vo=sum(L,'valO');
  var byType=group(L,function(p){return TYPE[p.type]||p.type;},['valY']).filter(function(g){return g.valY>0;}).sort(function(x,y){return y.valY-x.valY;});
  var payback=vy>0?Math.max(0,(A-vo)/vy):null;
  return head(3,L)+'<div class="tiles t4">'+
    tile('Value a year',money(vy),'recorded benefits of the chosen projects','good')+
    tile('One-time value',money(vo),'')+
    tile('Value a year ÷ in-house cost',A>0?num(vy/A*100)+'%':'-','')+
    tile('Simple payback',payback==null?'no yearly value':(payback<1?num(payback*12)+' months':num(payback,1)+' years'),'in-house cost less one-time value, over value a year')+
    '</div><div class="sgrid">'+
    '<div class="spanel"><h3>Value a year by project type, ₹</h3>'+(byType.length?hbars(byType.map(function(g){return {label:g.label+' ('+g.n+')',values:[g.valY]};}),{cls:'cg',title:'Value by type'}):'<p class="note">No value recorded for these projects.</p>')+'</div>'+
    topList(top(L,function(p){return p.valY;},5),function(p){return money(p.valY)+' a year';},'Largest value a year')+
    '</div><p class="note">'+esc(L.filter(function(p){return !p.valY&&!p.valO;}).length+' of '+L.length+' chosen projects have no value recorded with their estimate.')+'</p>';
}
function slideList(L){
  var rows=L.slice().sort(function(a,b){return String(b.fy).localeCompare(String(a.fy))||a.name.localeCompare(b.name);});
  return head(4,L)+'<div class="slist"><table class="rep"><thead><tr><th>Project</th><th>Department</th><th>Dates</th><th>Status</th><th>Review</th><th class="num">In-house</th><th class="num">Benchmark</th><th class="num">Value a year</th><th>Estimate</th></tr></thead><tbody>'+
    rows.map(function(p){
      return '<tr><td class="c-title" data-label="Project">'+esc(p.name)+'<small class="sub2">FY '+esc(p.fy)+'</small></td><td data-label="Department">'+esc(p.dept)+'</td>'+
        '<td data-label="Dates">'+esc(p.start?fmtDate(p.start)+' to '+(p.end?fmtDate(p.end):'running'):(p.end?'to '+fmtDate(p.end):'not given'))+'</td>'+
        '<td data-label="Status">'+esc(STAT[p.status]||'')+'</td><td data-label="Review"><span class="tag'+(p.wf==='verified'?' ok':(p.wf==='info'?' warn':' wait'))+'">'+esc(WF[p.wf]||p.wf)+'</span></td>'+
        '<td class="num" data-label="In-house">'+esc(money(p.a))+'</td><td class="num" data-label="Benchmark">'+esc(money(p.b))+'</td><td class="num" data-label="Value a year">'+esc(money(p.valY))+'</td>'+
        '<td class="c-act" data-label="Estimate"><button type="button" class="btn sm" data-pdf="'+esc(p.id)+'">PDF</button></td></tr>';
    }).join('')+'</tbody></table></div>';
}

function paintDeck(){
  var L=chosen(),makers=[slideSummary,slideMoney,slideEffort,slideValue,slideList];
  $('#dDeck').innerHTML=makers.map(function(m,i){return '<section class="slide'+(i===SLIDE?' on':'')+'" aria-label="Slide '+(i+1)+': '+esc(TITLES[i])+'">'+
    (L.length||i===0?m(L):head(i,L)+'<p class="empty">No projects in this choice.</p>')+'</section>';}).join('');
  if(!L.length)$('#dDeck .slide').insertAdjacentHTML('beforeend','<p class="empty">No projects match: widen the period, include projects without dates, or clear the project choice.</p>');
  paintPos();
}
function paintPos(){
  $$('.slide').forEach(function(s,i){s.classList.toggle('on',i===SLIDE);});
  $('#dPos').textContent=(SLIDE+1)+' / '+TITLES.length+' · '+TITLES[SLIDE];
  $('#dStrip').innerHTML=TITLES.map(function(t,i){return '<button type="button" data-slide="'+i+'"'+(i===SLIDE?' aria-current="true"':'')+'><span>'+(i+1)+'</span>'+esc(t)+'</button>';}).join('');
  $('#dPrev').disabled=SLIDE===0;$('#dNext').disabled=SLIDE===TITLES.length-1;
}
function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s));}
function go(i){SLIDE=Math.max(0,Math.min(TITLES.length-1,i));paintPos();}
function changed(){saveChoice();paintFilter();paintDeck();}

/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('button,input');if(!t)return;
  if(t.dataset.slide!=null){go(+t.dataset.slide);return;}
  if(t.id==='dPrev'){go(SLIDE-1);return;}
  if(t.id==='dNext'){go(SLIDE+1);return;}
  if(t.id==='dPresent'){var d=$('#dDeck');if(document.fullscreenElement)document.exitFullscreen();else if(d.requestFullscreen)d.requestFullscreen().catch(function(){});return;}
  if(t.id==='dPrint'){window.print();return;}
  if(t.id==='dPickBtn'){var p=$('#dPanel'),open=p.hidden;p.hidden=!open;t.setAttribute('aria-expanded',String(open));if(open)$('#dSearch').focus();return;}
  if(t.id==='dAll'){var have={};F.ids.forEach(function(i){have[i]=1;});$$('#dList [data-pick]').forEach(function(c){if(!have[c.dataset.pick]){F.ids.push(c.dataset.pick);have[c.dataset.pick]=1;}});changed();return;}
  if(t.id==='dNone'||t.id==='dNone2'){F.ids=[];changed();return;}
  if(t.dataset.unpick){F.ids=F.ids.filter(function(i){return i!==t.dataset.unpick;});changed();return;}
  if(t.dataset.preset){
    var now=new Date(),y=now.getUTCMonth()>=3?now.getUTCFullYear():now.getUTCFullYear()-1;
    if(t.dataset.preset==='fy'){F.from=y+'-04-01';F.to=(y+1)+'-03-31';}
    else if(t.dataset.preset==='12m'){var a=new Date(now);a.setUTCFullYear(a.getUTCFullYear()-1);F.from=iso(a);F.to=iso(now);}
    else{F.from='';F.to='';}
    changed();return;
  }
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.dataset&&t.dataset.pick){
    if(t.checked){if(F.ids.indexOf(t.dataset.pick)<0)F.ids.push(t.dataset.pick);}else F.ids=F.ids.filter(function(i){return i!==t.dataset.pick;});
    saveChoice();var keep=$('#dList').scrollTop;paintFilter();$('#dList').scrollTop=keep;paintDeck();return;
  }
  if(t.id==='dFrom'||t.id==='dTo'){
    F[t.id==='dFrom'?'from':'to']=t.value||'';
    if(F.from&&F.to&&F.to<F.from){var x=F.from;F.from=F.to;F.to=x;}
    changed();return;
  }
  if(t.id==='dUndated'){F.undated=t.checked;changed();return;}
  if(t.id==='dVer'){F.ver=t.checked;changed();return;}
});
document.addEventListener('input',function(e){if(e.target.id==='dSearch'){F.q=e.target.value;paintList();}});
document.addEventListener('keydown',function(e){
  var tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='select'||tag==='textarea')return;
  if(e.key==='ArrowRight'||e.key==='PageDown'){go(SLIDE+1);e.preventDefault();}
  else if(e.key==='ArrowLeft'||e.key==='PageUp'){go(SLIDE-1);e.preventDefault();}
  else if(e.key==='Home'){go(0);}else if(e.key==='End'){go(TITLES.length-1);}
  else if(e.key==='Escape'){var p=$('#dPanel');if(p&&!p.hidden){p.hidden=true;$('#dPickBtn').setAttribute('aria-expanded','false');}}
});
/* a click outside the project list closes it */
document.addEventListener('mousedown',function(e){var pk=$('.dpick'),p=$('#dPanel');if(p&&!p.hidden&&pk&&!pk.contains(e.target)){p.hidden=true;$('#dPickBtn').setAttribute('aria-expanded','false');}});

/* ---------- theme (same stored choice as the other pages) ---------- */
(function(){
  var KEY='ca-estimator.theme';
  function setTheme(t){
    document.documentElement.setAttribute('data-theme',t);
    $$('[data-theme-set]').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-theme-set')===t));});
    try{localStorage.setItem(KEY,t);}catch(e){}
  }
  var seg=document.querySelector('.seg');
  if(seg)seg.addEventListener('click',function(e){var b=e.target.closest('[data-theme-set]');if(b)setTheme(b.getAttribute('data-theme-set'));});
  var t0='light';try{t0=localStorage.getItem(KEY)||'light';}catch(e){}
  setTheme(t0);
})();

/* ---------- start ---------- */
say('Loading the register…');
load().then(function(j){
  ME=j.me||{};
  if(ME.isAdmin===false){say('Only admins see the dashboard: it shows the costs of every project.');return;}
  ALL=((j.projects)||[]).map(shape);
  readChoice();
  say('');$('#dApp').hidden=false;
  paintFilter();paintDeck();
}).catch(function(e){say((e&&e.message)||'The register could not be read.');});
})();
