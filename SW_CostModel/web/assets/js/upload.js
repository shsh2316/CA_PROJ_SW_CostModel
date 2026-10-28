/* Excel upload page: download the template, upload the filled workbooks (one row = one project), check the cost of each, submit to the register.
   The template columns, the reading of a filled sheet and the cost calculation are the estimator's own (estimator.js in library mode: window.CAEstimate);
   the workbook is made and read in this browser by xlsx-lite.js, so nothing leaves the site except the submitted projects. */
(function(){
'use strict';

var E=window.CAEstimate,X=window.XlsxLite;
var MAX_BYTES=10*1024*1024;
var UPL=[],MINE={},ME={id:null},busy=false,ready=false;

function $(s){return document.querySelector(s);}
function esc(s){return E.fmt.esc(s);}

/* ---------- messages ---------- */
function say(text,isError){
  var el=$('#upMsg');if(!el)return;
  el.hidden=!text;el.textContent=text||'';
  el.classList.toggle('ok',!!text&&!isError);
}
function toast(msg){var t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove('on');},2200);}

function download(blob,name){
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);
}

/* ---------- start: masters and who is signed in ---------- */
function start(){
  if(!E||!X){say('The page scripts did not load. Reload the page; if it keeps happening, tell the administrator.',true);return;}
  E.api('init').then(function(r){
    var admin=E.session(r);
    ME=(r&&r.me)||{id:null};
    ((r&&r.register&&r.register.projects)||[]).forEach(function(d){
      if(d.key&&ME.id&&String(d.by||'').toLowerCase()===String(ME.id).toLowerCase())MINE[d.key]={wf:d.wf||'pending',name:d.name||''};
    });
    if(!admin){say('Only admins can upload projects: the costs are worked out and recorded with the entry.',true);return;}
    ready=true;
    $('#upTools').hidden=false;
    paintGuide();paintResults();
  }).catch(function(e){
    say('The register is not available: '+(((e&&e.message)||'the server did not answer').replace(/\.$/,''))+'. Reload the page to try again.',true);
  });
}

/* ---------- what goes in each column ---------- */
function paintGuide(){
  var body=$('#upGuide');if(!body)return;
  body.innerHTML=E.xl.cols().map(function(c){
    var ans='Text';
    if(c[2]==='number')ans='A number';
    else if(c[2]==='yesno')ans='Yes or No';
    else if(c[2]==='list')ans=c[3]().map(function(o){return o[1];}).join(', ');
    return '<tr><td><b>'+esc(c[0])+'</b></td><td>'+esc(ans)+'</td><td>'+esc(E.xl.hint(c)||'')+'</td></tr>';
  }).join('');
}

/* ---------- reading the workbooks ---------- */
function readFile(f){
  if(!/\.xlsx$/i.test(f.name))return Promise.resolve([{file:f.name,error:'Only Excel .xlsx files can be read. In Excel use File > Save As > Excel Workbook (.xlsx).'}]);
  if(f.size>MAX_BYTES)return Promise.resolve([{file:f.name,error:'The file is larger than 10 MB.'}]);
  return f.arrayBuffer().then(X.read).then(function(book){return E.xl.parse(book,f.name);})
    .catch(function(e){return [{file:f.name,error:(e&&e.message)||'Could not read this file.'}];});
}
function addFiles(files){
  var list=Array.prototype.slice.call(files||[]);
  if(!list.length||!ready)return;
  say('Reading '+list.length+' file'+(list.length>1?'s':'')+'…',false);
  Promise.all(list.map(readFile)).then(function(res){
    var rows=[].concat.apply([],res);
    rows.forEach(function(u){if(u.st){u.R=E.calc2(u.st);u.key=E.slug(u.st.name)+'_'+u.st.reg.fy+'_'+u.st.reg.kind;}});
    UPL=UPL.concat(rows);
    checkKeys();
    var ok=rows.filter(function(u){return u.st;}).length;
    say(ok+' project'+(ok===1?'':'s')+' read'+(rows.length>ok?', '+(rows.length-ok)+' with problems (see the list)':'')+'.',rows.length>ok&&!ok);
    paintResults();
  });
}

/* A project is stored under the key project-year-record type, one per person. Flag what the register would refuse, before anything is sent. */
function checkKeys(){
  var seen={};
  UPL.forEach(function(u){
    u.flag='';u.note='';
    if(!u.st)return;
    var at=seen[u.key];
    if(at!=null){
      if(!u.submitted){u.flag='dup';u.note='Same project, year and record type as '+at+'. Only one of them can be registered: change the year or the record type, or remove one.';}
      return;
    }
    seen[u.key]=u.file;
    if(u.submitted)return;
    var m=MINE[u.key];
    if(!m)return;
    if(m.wf==='verified'){u.flag='verified';u.note='Already in the register and verified. To add another, change the year or the record type.';}
    else if(String(m.name).trim().toLowerCase()!==String(u.st.name).trim().toLowerCase()){u.flag='clash';u.note='You already have a different project, "'+m.name+'", under the same year and record type. Give this one a clearly different name.';}
    else u.note='Replaces your entry of the same name that is still awaiting verification.';
  });
}

/* ---------- the list ---------- */
function rowHTML(u,i){
  if(!u.st)return '<tr><td>'+esc(u.file)+'</td><td colspan="8"><span class="tag warn">Not read</span> '+esc(u.error)+'</td><td>'+btn('remove',i,'Remove','del')+'</td></tr>';
  var s=u.st,R=u.R,B=R.b,F=E.fmt;
  var sub=[s.q.to,s.q.prepared?'by '+s.q.prepared:'','FY '+s.reg.fy,F.KIND[s.reg.kind],R.headcount?R.headcount+' people':''].filter(Boolean).join(' · ');
  var warn=u.warn.length?'<span class="sub2" style="color:var(--warn)">'+u.warn.slice(0,4).map(esc).join('<br>')+(u.warn.length>4?'<br>and '+(u.warn.length-4)+' more':'')+'</span>'
    :'<span class="sub2" style="color:var(--ok)">All answers read</span>';
  var flag=u.flag?'<span class="sub2" style="color:var(--warn)">'+esc(u.note)+'</span>':(u.note?'<span class="sub2">'+esc(u.note)+'</span>':'');
  var state;
  if(u.submitted)state='<span class="tag ok">Submitted</span>';
  else if(u.failed)state='<span class="tag warn">Not submitted</span><span class="sub2" style="color:var(--warn)">'+esc(u.failed)+'</span>';
  else if(u.flag)state='<span class="tag warn">Cannot submit</span>';
  else state='<span class="tag wait">Ready</span>';
  var acts=(u.submitted||u.flag?'':btn('submit',i,'Submit','ok'))+btn('open',i,'Open in estimator')+btn('remove',i,'Remove','del');
  return '<tr><td>'+esc(u.file)+'</td><td>'+esc(s.name)+'<span class="sub2">'+esc(sub)+'</span>'+warn+flag+'</td>'+
    '<td class="num">'+F.inr(R.oneTotal)+'</td><td class="num">'+F.inr(R.steady.total)+'</td><td class="num">'+F.inr(R.tco)+'</td><td class="num">'+F.inr(B.tco)+'</td>'+
    '<td class="num">'+F.inr(R.val.yearly)+'</td><td class="num">'+F.years(R.val.payback)+'</td><td>'+state+'</td><td class="acts">'+acts+'</td></tr>';
}
function btn(act,i,label,cls){return '<button type="button" class="lnk'+(cls?' '+cls:'')+'" data-act="'+act+'" data-i="'+i+'">'+label+'</button>';}

function paintResults(){
  var box=$('#upResults');if(!box)return;
  if(!UPL.length){box.innerHTML='<p class="note" style="margin:0">Nothing uploaded yet.</p>';return;}
  var read=UPL.filter(function(u){return u.st;}),bad=UPL.length-read.length;
  var todo=read.filter(function(u){return !u.submitted&&!u.flag;}).length,done=read.filter(function(u){return u.submitted;}).length,blocked=read.filter(function(u){return u.flag&&!u.submitted;}).length;
  var line=[read.length+' project'+(read.length===1?'':'s')+' read',bad?bad+' not read':'',blocked?blocked+' cannot be submitted':'',done?done+' submitted':''].filter(Boolean).join(' · ');
  box.innerHTML='<p class="usum">'+esc(line)+'</p>'+
    '<div class="tw"><table class="dual"><thead><tr><th>File and line</th><th>Project and checks</th><th class="num">One-time</th><th class="num">Per year</th><th class="num">Total cost</th><th class="num">Total benchmark</th><th class="num">Value / year</th><th class="num">Payback</th><th>Status</th><th></th></tr></thead><tbody>'+
    UPL.map(rowHTML).join('')+'</tbody></table></div>'+
    '<p class="note">Costs are Central Automation\'s, over each project\'s years of ownership, worked out with the current masters. Submitted projects wait on the estimator\'s Approval page for an admin to verify. "Open in estimator" lets you refine a project (for example split the team into roles) before submitting it there.</p>'+
    '<div class="actions"><button type="button" class="btn primary" data-act="submitAll"'+(todo&&!busy?'':' disabled')+'>Submit all ready projects'+(todo?' ('+todo+')':'')+'</button>'+
    '<button type="button" class="btn" data-act="summary"'+(read.length?'':' disabled')+'>Download cost summary (Excel)</button>'+
    '<button type="button" class="btn" data-act="clear">Clear the list</button></div>';
}

/* ---------- cost summary (Excel) ---------- */
function summary(){
  var st=X.style,F=E.fmt;
  var head=['File and line','Project','Department / client','Prepared by','Financial year','Record as','Delivery model','Person-days','People','One-time CA ₹','One-time benchmark ₹','Yearly CA ₹','Yearly benchmark ₹','Years','Total cost CA ₹','Total benchmark ₹','Saving vs benchmark ₹','Value created per year ₹','One-time value ₹','Value over the years ₹','Return on cost %','Payback (years)','Checks'];
  var rows=[head.map(function(h){return {v:h,s:st.head};})];
  UPL.forEach(function(u){
    if(!u.st)return;
    var s=u.st,R=u.R,B=R.b,r=Math.round;
    rows.push([u.file,s.name,s.q.to,s.q.prepared,s.reg.fy,F.KIND[s.reg.kind],s.model==='once'?'One-time setup':'Yearly model',r(R.pd),R.headcount,r(R.oneTotal),r(B.oneTotal),r(R.steady.total),r(B.steady.total),R.H,
      r(R.tco),r(B.tco),r(B.tco-R.tco),r(R.val.yearly),r(R.val.once),r(R.val.total),R.val.roi==null?'':r(R.val.roi*100),R.val.payback==null?'':Math.round(R.val.payback*10)/10,u.warn.concat(u.flag?[u.note]:[]).join(' ')]
      .map(function(v,i){return {v:v,s:typeof v==='number'&&i>=9&&i!==13?st.calc:0};}));
  });
  download(X.write([{name:'Cost summary',rows:rows,freeze:1,cols:[28,30,22,18,10,16,16,11,8,15,15,15,15,7,15,15,15,15,15,15,10,10,60]}]),'cost-summary.xlsx');
}

/* ---------- submit ---------- */
/* The same entry the estimator's Registration page sends (see submitEntry in estimator.js). */
function entryOf(st,R){
  var r=st.reg;
  return Object.assign({key:E.slug(st.name)+'_'+r.fy+'_'+r.kind,name:st.name||'',type:st.type,model:st.model,fy:r.fy,kind:r.kind,status:r.status,
    department:st.q.to||'',note:r.note||'',state:E.savedState(st)},E.figuresOf(st,R));
}
async function submit(idx){
  if(busy)return;
  var list=idx.map(function(i){return UPL[i];}).filter(function(u){return u&&u.st&&!u.submitted&&!u.flag;});
  if(!list.length)return;
  busy=true;paintResults();
  var done=0,failed=0;
  for(var k=0;k<list.length;k++){
    var u=list[k];
    say('Submitting '+(k+1)+' of '+list.length+'…',false);
    try{
      await E.api('submitProject',{id:'',entry:entryOf(u.st,u.R),reply:''});
      u.submitted=true;u.failed='';done++;
      MINE[u.key]={wf:'pending',name:u.st.name};
    }catch(e){u.failed=(e&&e.message)||'The server did not accept it.';failed++;}
  }
  busy=false;checkKeys();paintResults();
  say(done+' project'+(done===1?'':'s')+' submitted for verification'+(failed?', '+failed+' not submitted (see the list)':'')+'.',failed>0&&!done);
}

/* ---------- open a project in the estimator ---------- */
function openIn(u){
  var c=JSON.parse(JSON.stringify(u.st));
  c.dirty=true;c.reg.reply='';
  try{localStorage.setItem(E.draftKey,JSON.stringify(c));}catch(e){say('This browser does not allow saving the project to open it in the estimator.',true);return;}
  location.href='project_registry.aspx';
}

/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('button');if(!t)return;
  if(t.id==='upTpl'){try{download(E.xl.template(),'estimate-template.xlsx');toast('Template ready');}catch(x){say('The template could not be made.',true);}return;}
  if(t.id==='upPick'){$('#upFile').click();return;}
  var act=t.dataset.act,i=+t.dataset.i;
  if(!act)return;
  if(act==='submitAll')submit(UPL.map(function(u,n){return n;}));
  else if(act==='submit')submit([i]);
  else if(act==='summary'){summary();toast('Cost summary ready');}
  else if(act==='clear'){if(!busy){UPL=[];say('',false);paintResults();}}
  else if(act==='remove'){if(!busy){UPL.splice(i,1);checkKeys();paintResults();}}
  else if(act==='open'&&UPL[i]&&UPL[i].st)openIn(UPL[i]);
});
document.addEventListener('change',function(e){
  if(e.target.id==='upFile'){addFiles(e.target.files);e.target.value='';}
});
(function(){
  var drop=$('#upDrop');if(!drop)return;
  ['dragenter','dragover'].forEach(function(n){drop.addEventListener(n,function(e){e.preventDefault();drop.classList.add('over');});});
  ['dragleave','dragend'].forEach(function(n){drop.addEventListener(n,function(){drop.classList.remove('over');});});
  drop.addEventListener('drop',function(e){e.preventDefault();drop.classList.remove('over');addFiles(e.dataTransfer&&e.dataTransfer.files);});
  /* a file dropped beside the drop zone must not make the browser open it */
  ['dragover','drop'].forEach(function(n){window.addEventListener(n,function(e){if(!drop.contains(e.target))e.preventDefault();});});
})();

/* ---------- theme (same stored choice as the other pages) ---------- */
(function(){
  var KEY='ca-estimator.theme';
  function setTheme(t){
    document.documentElement.setAttribute('data-theme',t);
    var bs=document.querySelectorAll('[data-theme-set]');
    for(var i=0;i<bs.length;i++)bs[i].setAttribute('aria-pressed',String(bs[i].getAttribute('data-theme-set')===t));
    try{localStorage.setItem(KEY,t);}catch(e){}
  }
  var seg=document.querySelector('.seg');
  if(seg)seg.addEventListener('click',function(e){var b=e.target.closest('[data-theme-set]');if(b)setTheme(b.getAttribute('data-theme-set'));});
  var t0='light';try{t0=localStorage.getItem(KEY)||'light';}catch(e){}
  setTheme(t0);
})();

start();
})();
