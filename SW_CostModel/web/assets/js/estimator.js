(function(){
"use strict";

/* ================= constants and defaults ================= */
var LEVELS=['Junior','Mid','Senior','Lead','Architect'];
var ENV_N={prod:1,uat:2,dr:2,full:3};
var ENV_NAME={prod:'Production only',uat:'Production + UAT',dr:'Production + DR',full:'Production + UAT + DR'};
var RAID_NAME={none:'No RAID',raid5:'RAID 5',raid10:'RAID 10'};
var ST_NAME={hdd:'HDD',ssd:'SATA / SAS SSD',nvme:'NVMe SSD'};
var TYPE_NAME={web:'Web application',desktop:'Windows desktop application',mobile:'Mobile app',interface:'Interface / integration',dash:'Dashboard / reporting',ai:'AI / vision system'};
var KIND={new:'New project',amc:'Maintenance (AMC)',enh:'Enhancement'};
var STAT={planned:'Planned',progress:'In progress',completed:'Completed'};
var WF={pending:'Awaiting verification',info:'Needs information',verified:'Verified'};

var MDEF={
  man:{rates:{Junior:3500,Mid:6000,Senior:9500,Lead:13000,Architect:18000},
    ratesB:{Junior:6000,Mid:10000,Senior:16000,Lead:22000,Architect:32000},
    roles:[{role:'Project lead',level:'Lead'},{role:'Solution architect',level:'Architect'},{role:'Full-stack developer',level:'Senior'},{role:'Full-stack developer',level:'Mid'},
      {role:'UI / UX designer',level:'Mid'},{role:'Tester / QA',level:'Junior'},{role:'Database engineer',level:'Senior'},{role:'AI / vision engineer',level:'Senior'},
      {role:'DevOps / infrastructure engineer',level:'Mid'},{role:'Security engineer',level:'Senior'}]},
  hw:{onprem:{cpu:8000,ram:1500,hdd:15000,ssd:55000,nvme:80000,opsPct:10},
    onpremB:{cpu:9600,ram:1800,hdd:18000,ssd:66000,nvme:96000,opsPct:15},
    cloud:{cpu:2500,ram:400,hdd:4000,ssd:9000,nvme:14000},
    cloudB:{cpu:3000,ram:480,hdd:4800,ssd:10800,nvme:16800},
    envF:{prod:1,uat:1.5,dr:2,full:2.5},raidF:{none:1,raid5:1.25,raid10:2},
    gpus:[{id:'t4',name:'NVIDIA T4 16 GB',price:150000,priceB:180000,monthly:30000,monthlyB:36000},
      {id:'l4',name:'NVIDIA L4 24 GB',price:300000,priceB:360000,monthly:45000,monthlyB:54000},
      {id:'a4000',name:'RTX A4000 16 GB',price:120000,priceB:144000,monthly:35000,monthlyB:42000},
      {id:'rtx4090',name:'RTX 4090 24 GB',price:220000,priceB:264000,monthly:50000,monthlyB:60000},
      {id:'a100',name:'NVIDIA A100 80 GB',price:1200000,priceB:1440000,monthly:200000,monthlyB:240000}]},
  sw:{complexity:{low:0.9,std:1,high:1.25,vhigh:1.5},benchEffort:1,
    load:{cont:10,ovh:8,markup:0,gstOn:false,gst:18},
    loadB:{cont:15,ovh:15,markup:20},
    amc:{pct:15,pctB:20,warranty:3,esc:5,years:3,crDays:10,deployDays:5},
    scopeDays:{screen:3,report:2,integ:6},
    quote:{from:'Central Automation',fromAddr:'Hazira Plant, Surat, Gujarat',valid:30,
      terms:'Prices are in Indian Rupees.\nPayment: 40% on order, 40% on UAT completion, 20% on go-live.\nWarranty covers defect fixes only. Enhancements are billed as change requests.\nHardware and licence prices hold until order confirmation.\nTimeline starts after requirement sign-off.'}},
  lic:{db:[{id:'open',name:'Open-source (PostgreSQL / MySQL)',price:0,priceB:0,min:0,support:0},{id:'express',name:'SQL Server Express (free)',price:0,priceB:0,min:0,support:0},
      {id:'sqlstd',name:'SQL Server Standard',price:82000,priceB:94300,min:4,support:25},{id:'sqlent',name:'SQL Server Enterprise',price:315000,priceB:362250,min:4,support:25},
      {id:'oracle',name:'Oracle Standard Edition 2',price:350000,priceB:402500,min:4,support:22}],
    os:[{id:'linux',name:'Linux (no licence)',price:0,priceB:0},{id:'win',name:'Windows Server',price:65000,priceB:74750}],
    calPerUser:0,calPerUserB:0,
    items:[{id:'ui',name:'Third-party UI / report components',cat:'lic',type:'once',cost:50000,costB:60000},{id:'ssl',name:'SSL certificate',cat:'lic',type:'year',cost:8000,costB:9600},
      {id:'vapt',name:'VAPT security audit',cat:'svc',type:'once',cost:150000,costB:225000},{id:'train',name:'User training',cat:'svc',type:'once',cost:50000,costB:75000}]},
  val:{cats:[{id:'manhours',name:'Man-hours saved',unit:'hours',rate:500},{id:'downtime',name:'Downtime avoided',unit:'hours',rate:50000},
    {id:'energy',name:'Energy saved',unit:'kWh',rate:8},{id:'quality',name:'Quality / yield improvement',unit:'INR',rate:1},
    {id:'material',name:'Material and consumables saved',unit:'INR',rate:1},{id:'through',name:'Productivity / throughput gain',unit:'INR',rate:1},
    {id:'safety',name:'Safety and compliance risk avoided',unit:'INR',rate:1},{id:'other',name:'Other benefit',unit:'INR',rate:1}]}
};
var MKEYS=['man','hw','sw','lic','val'];
var FREQ={year:'Per year',once:'One-time'};

var DEF0={
  name:'',type:'web',model:'yearly',days:90,users:100,complexity:1,benchEffort:1,dirty:false,
  need:{man:true,hw:true,gpu:false,lic:true,amc:true,adv:false},
  team:[
    {role:'Project lead',level:'Lead',people:1,days:'',alloc:30},
    {role:'Full-stack developer',level:'Senior',people:1,days:'',alloc:100},
    {role:'Full-stack developer',level:'Mid',people:2,days:'',alloc:100},
    {role:'UI / UX designer',level:'Mid',people:1,days:20,alloc:100},
    {role:'Tester / QA',level:'Junior',people:1,days:30,alloc:100},
    {role:'Database engineer',level:'Senior',people:1,days:8,alloc:100}
  ],
  scope:{screens:20,reports:10,integrations:3},
  infra:{env:'prod',mode:'onprem',servers:1,cpu:8,ram:32,storageTb:2,storageType:'ssd',redundancy:'raid5',
    gpuId:'t4',gpuName:'',gpuCount:1,gpuPrice:0,gpuPriceB:0,gpuMonthly:0,gpuMonthlyB:0,otherAnnual:25000},
  lic:{dbId:'sqlstd',dbName:'',dbPrice:0,dbPriceB:0,dbMin:0,dbSupport:0,dbExtra:0,osId:'win',osName:'',osPerServer:0,osPerServerB:0,calPerUser:0,calPerUserB:0},
  other:[],
  value:{items:[]},
  reg:{fy:'',kind:'new',status:'completed',charged:0,valueOverride:0,note:'',reply:''}
};

/* ================= helpers ================= */
var $=function(q,el){return (el||document).querySelector(q);};
var $$=function(q,el){return Array.prototype.slice.call((el||document).querySelectorAll(q));};
function clone(o){return JSON.parse(JSON.stringify(o));}
function merge(t,s){
  Object.keys(s).forEach(function(k){
    if(Array.isArray(s[k])){t[k]=s[k];}
    else if(s[k]&&typeof s[k]==='object'&&t[k]&&typeof t[k]==='object'&&!Array.isArray(t[k])){merge(t[k],s[k]);}
    else{t[k]=s[k];}
  });
}
/* Gives every stored value the type of its default (number, true/false, text). A saved estimate
   comes from the server or this browser, so this keeps it from carrying markup into the page. */
function numOr(v,d){var x=typeof v==='number'?v:parseFloat(v);return isFinite(x)?x:d;}
function tidy(n,d){
  Object.keys(d).forEach(function(k){
    var v=n[k],t=d[k];
    if(v===undefined||t==null||Array.isArray(t))return;
    if(typeof t==='number')n[k]=numOr(v,t);
    else if(typeof t==='boolean')n[k]=!!v;
    else if(typeof t==='string')n[k]=v==null?'':String(v);
    else if(typeof t==='object'){if(v&&typeof v==='object'&&!Array.isArray(v))tidy(v,t);else n[k]=clone(t);}
  });
}
function get(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k];},o);}
function put(o,p,v){var ks=p.split('.'),l=ks.pop();ks.reduce(function(a,k){return a[k];},o)[l]=v;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function inr(n){return '₹'+Math.round(n).toLocaleString('en-IN');}
function parts(n){var a=Math.abs(n);if(a>=1e7)return [(n/1e7).toFixed(2),'crore'];if(a>=1e5)return [(n/1e5).toFixed(2),'lakh'];return [Math.round(n).toLocaleString('en-IN'),''];}
function short(n){var p=parts(n);return '₹'+p[0]+(p[1]?(p[1]==='crore'?' Cr':' L'):'');}
function num(n,d){return Number(n).toLocaleString('en-IN',{maximumFractionDigits:d==null?1:d});}
function pad2(x){return (x<10?'0':'')+x;}
function todayStr(){var d=new Date();return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
function parseD(str){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(str||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function fmtD(d){return d?d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'';}
function fmtDT(iso){var d=new Date(iso);return isNaN(d.getTime())?'':d.toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}
function fyStart(d){d=d||new Date();return d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;}
function fyLabel(y){var t=(y+1)%100;return y+'-'+(t<10?'0':'')+t;}
var FY_OPTS=[];for(var fy=fyStart()+1;fy>=fyStart()-6;fy--)FY_OPTS.push([fyLabel(fy),'FY '+fyLabel(fy)]);
function slug(t){return String(t||'project').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'project';}
function uid(){return 'x'+Date.now().toString(36)+Math.floor(Math.random()*1000).toString(36);}
function toast(msg){var t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove('on');},2200);}
function words(n){
  n=Math.round(n);if(n<=0)return 'Zero';
  var a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  var b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function two(x){return x<20?a[x]:b[Math.floor(x/10)]+(x%10?' '+a[x%10]:'');}
  function three(x){var h=Math.floor(x/100),r=x%100;return (h?a[h]+' Hundred'+(r?' ':''):'')+(r?two(r):'');}
  var out=[],cr=Math.floor(n/1e7);n%=1e7;var lk=Math.floor(n/1e5);n%=1e5;var th=Math.floor(n/1e3);n%=1e3;
  if(cr)out.push(three(cr)+' Crore');if(lk)out.push(two(lk)+' Lakh');if(th)out.push(two(th)+' Thousand');if(n)out.push(three(n));
  return out.join(' ');
}

/* ================= master data ================= */
var M=clone(MDEF),MDIRTY={},MTAB='man',masterSig='';
var MSTORE='ca-estimator.master.v1',DSTORE='ca-estimator.draft.v2';
function fillB(){
  M.hw.gpus.forEach(function(g){if(g.priceB==null)g.priceB=Math.round((+g.price||0)*1.2);if(g.monthlyB==null)g.monthlyB=Math.round((+g.monthly||0)*1.2);});
  M.lic.db.forEach(function(d){if(d.priceB==null)d.priceB=Math.round((+d.price||0)*1.15);});
  M.lic.os.forEach(function(o){if(o.priceB==null)o.priceB=Math.round((+o.price||0)*1.15);});
  M.lic.items.forEach(function(x){if(x.costB==null)x.costB=Math.round((+x.cost||0)*1.2);});
}
function mergeM(key,doc){var b=clone(MDEF[key]);if(doc){var d=clone(doc);delete d.updated;merge(b,d);}M[key]=b;fillB();}
try{var lm=JSON.parse(localStorage.getItem(MSTORE)||'{}');MKEYS.forEach(function(k){if(lm[k])mergeM(k,lm[k]);});}catch(e){}
function dbById(id){var l=M.lic.db.concat(MDEF.lic.db).filter(function(x){return x.id===id;});return l[0];}
function osById(id){var l=M.lic.os.concat(MDEF.lic.os).filter(function(x){return x.id===id;});return l[0];}
function gpuById(id){var l=M.hw.gpus.concat(MDEF.hw.gpus).filter(function(x){return x.id===id;});return l[0];}

/* ================= new estimate ================= */
function setDb(s,d){if(!d)return;s.lic.dbId=d.id;s.lic.dbName=d.name;s.lic.dbPrice=d.price;s.lic.dbPriceB=d.priceB;s.lic.dbMin=d.min;s.lic.dbSupport=d.support;}
function setOs(s,o){if(!o)return;s.lic.osId=o.id;s.lic.osName=o.name;s.lic.osPerServer=o.price;s.lic.osPerServerB=o.priceB;}
function setGpu(s,g){if(!g)return;s.infra.gpuId=g.id;s.infra.gpuName=g.name;s.infra.gpuPrice=g.price;s.infra.gpuPriceB=g.priceB;s.infra.gpuMonthly=g.monthly;s.infra.gpuMonthlyB=g.monthlyB;}
function ensureQuote(s){
  if(!s.q.date)s.q.date=todayStr();
  if(!s.q.no)s.q.no='QTN-'+s.q.date.replace(/-/g,'')+'-01';
  if(s.q.from==='AM/NS India')s.q.from='Central Automation';
  if(!s.reg.fy)s.reg.fy=fyLabel(fyStart());
}
function isYearly(s){return s.model?s.model==='yearly':((s.need||{}).amc!==false&&(s.amc||{}).on!==false);}
function catalogItem(name){var n=String(name||'').trim().toLowerCase();return M.lic.items.filter(function(x){return String(x.name).trim().toLowerCase()===n;})[0];}
/* Copies the current master rates and prices into an estimate. Used for a new estimate, and when
   an admin costs an entry that was registered without costs (by someone who is not an admin, or
   from an Excel upload). Choices (team, sizing, products, quantities) are kept. */
function applyRates(s){
  s.rates=clone(M.man.rates);s.ratesB=clone(M.man.ratesB);
  s.hw=clone(M.hw.onprem);s.hwB=clone(M.hw.onpremB);s.cl=clone(M.hw.cloud);s.clB=clone(M.hw.cloudB);
  s.envF=clone(M.hw.envF);s.raidF=clone(M.hw.raidF);
  s.fin=clone(M.sw.load);s.finB=clone(M.sw.loadB);s.benchEffort=M.sw.benchEffort;
  s.amc.pct=M.sw.amc.pct;s.amc.pctB=M.sw.amc.pctB;s.amc.esc=M.sw.amc.esc;
  s.scope.dScreen=M.sw.scopeDays.screen;s.scope.dReport=M.sw.scopeDays.report;s.scope.dInteg=M.sw.scopeDays.integ;
  ['from','fromAddr','valid','terms'].forEach(function(k){s.q[k]=M.sw.quote[k];});
  if(s.lic.dbId!=='custom')setDb(s,dbById(s.lic.dbId)||M.lic.db[0]);
  if(s.lic.osId!=='custom')setOs(s,osById(s.lic.osId)||M.lic.os[0]);
  if(s.infra.gpuId!=='custom')setGpu(s,gpuById(s.infra.gpuId)||M.hw.gpus[0]);
  s.lic.calPerUser=M.lic.calPerUser;s.lic.calPerUserB=M.lic.calPerUserB;
  s.other.forEach(function(o){var it=catalogItem(o.name);if(it){o.cost=it.cost;o.costB=it.costB;}});
  return s;
}
function newEstimate(){
  var s=clone(DEF0);
  s.amc=Object.assign({on:true,mode:'percent',people:1,level:'Mid',daysPerMonth:6,crLevel:'Senior',deployLevel:'Mid'},clone(M.sw.amc));
  s.q=Object.assign({no:'',date:'',to:'',toAddr:'',ref:'',prepared:'',showEffort:true,showRec:true,showValue:true,basis:'both'},clone(M.sw.quote));
  s.lic.dbId='sqlstd';s.lic.osId='win';s.infra.gpuId=(M.hw.gpus[0]||{}).id||'';
  applyRates(s);
  ensureQuote(s);
  return s;
}
function hydrate(str){
  var n=newEstimate(),raw={};
  try{raw=JSON.parse(str);merge(n,raw);}catch(e){}
  if(!raw||typeof raw!=='object')raw={};
  tidy(n,newEstimate());
  var lvl=function(l,d){return LEVELS.indexOf(l)>=0?l:d;};
  n.amc.level=lvl(n.amc.level,'Mid');n.amc.crLevel=lvl(n.amc.crLevel,'Senior');n.amc.deployLevel=lvl(n.amc.deployLevel,'Mid');
  n.team=(Array.isArray(n.team)?n.team:[]).map(function(r){r=r||{};
    return {role:String(r.role==null?'':r.role),level:lvl(r.level,'Mid'),people:numOr(r.people,0),days:(r.days===''||r.days==null)?'':numOr(r.days,''),alloc:numOr(r.alloc,0)};});
  n.other=(Array.isArray(n.other)?n.other:[]).map(function(o){o=o||{};
    return {name:String(o.name==null?'':o.name),cat:o.cat==='svc'?'svc':'lic',type:o.type==='year'?'year':'once',cost:numOr(o.cost,0),costB:o.costB==null?null:numOr(o.costB,0),qty:numOr(o.qty,0)};});
  n.value={items:((n.value&&Array.isArray(n.value.items))?n.value.items:[]).map(function(v){v=v||{};
    return {cat:String(v.cat==null?'':v.cat),desc:String(v.desc==null?'':v.desc),qty:numOr(v.qty,0),unit:String(v.unit==null?'':v.unit),rate:numOr(v.rate,0),freq:v.freq==='once'?'once':'year'};})};
  if(raw.lic&&raw.lic.dbPreset&&!raw.lic.dbId)n.lic.dbId=raw.lic.dbPreset;
  if(raw.infra&&raw.infra.gpuPreset&&!raw.infra.gpuId)n.infra.gpuId=raw.infra.gpuPreset==='none'?'':raw.infra.gpuPreset;
  if(!raw.need&&(+n.infra.gpuCount)>0&&n.infra.gpuId)n.need.gpu=true;
  if(!raw.model)n.model=isYearly(Object.assign({},n,{model:''}))?'yearly':'once';
  n.need.amc=(n.model==='yearly');
  ensureQuote(n);
  return n;
}
var S=newEstimate();
try{var sv=localStorage.getItem(DSTORE);if(sv){S=hydrate(sv);S.dirty=true;}}catch(e){}
function saveDraft(){try{localStorage.setItem(DSTORE,JSON.stringify(S));}catch(e){}}

/* ================= calculation ================= */
function calc(st,basis){
  var s=st,B=basis==='bench',R={},nd=s.need||{};
  var nMan=nd.man!==false,nHw=nd.hw!==false,nLic=nd.lic!==false,nGpu=nd.gpu!==false;
  var yearly=isYearly(s),nAmc=yearly&&s.amc.on!==false;
  var rates=B?(s.ratesB||MDEF.man.ratesB):(s.rates||MDEF.man.rates);
  var cx=+s.complexity||1,eff=B?(+s.benchEffort||1):1;
  R.rows=s.team.map(function(r){
    var d=(r.days===''||r.days==null)?+s.days:+r.days;
    var pd=nMan?(+r.people||0)*d*((+r.alloc||0)/100):0;
    return {pd:pd,cost:pd*(+rates[r.level]||0)};
  });
  R.pd=R.rows.reduce(function(a,r){return a+r.pd;},0);
  R.labourBase=R.rows.reduce(function(a,r){return a+r.cost;},0);
  R.headcount=nMan?s.team.reduce(function(a,r){return a+(+r.people||0);},0):0;
  R.labour=R.labourBase*cx*eff;
  var fin=B?Object.assign({},s.fin,s.finB||MDEF.sw.loadB):s.fin;
  R.fin=fin;R.eff=eff;
  R.cont=R.labour*fin.cont/100;R.ovh=R.labour*fin.ovh/100;
  R.markup=(R.labour+R.cont+R.ovh)*fin.markup/100;
  R.dev=R.labour+R.cont+R.ovh+R.markup;
  R.nMan=nMan;R.nHw=nHw;R.nLic=nLic;R.nAmc=nAmc;R.yearly=yearly;

  var i=s.infra,envF=(s.envF||MDEF.hw.envF)[i.env]||1,envN=ENV_N[i.env]||1,raid=(s.raidF||MDEF.hw.raidF)[i.redundancy]||1;
  var hwr=B?(s.hwB||MDEF.hw.onpremB):(s.hw||MDEF.hw.onprem),clr=B?(s.clB||MDEF.hw.cloudB):(s.cl||MDEF.hw.cloud);
  var gpuP=B&&i.gpuPriceB!=null?i.gpuPriceB:i.gpuPrice,gpuM=B&&i.gpuMonthlyB!=null?i.gpuMonthlyB:i.gpuMonthly;
  R.hwr=hwr;
  R.envF=envF;R.envN=envN;R.raid=raid;R.stEff=i.storageTb*raid;
  R.gpuN=(nHw&&nGpu)?(+i.gpuCount||0):0;
  R.capex=0;R.hostAnnual=0;R.hwBase=0;R.hwMonthly=0;R.infraOther=0;
  if(nHw){
    if(i.mode==='onprem'){
      R.hwBase=i.cpu*hwr.cpu+i.ram*hwr.ram+R.stEff*hwr[i.storageType]+R.gpuN*(+gpuP||0);
      R.capex=R.hwBase*envF;R.hostAnnual=R.capex*hwr.opsPct/100;
    }else{
      R.hwMonthly=(i.cpu*clr.cpu+i.ram*clr.ram+R.stEff*clr[i.storageType]+R.gpuN*(+gpuM||0))*envF;
      R.hostAnnual=R.hwMonthly*12;
    }
    R.infraOther=+i.otherAnnual||0;
  }

  var l=s.lic;
  var dbP=B&&l.dbPriceB!=null?l.dbPriceB:l.dbPrice,osP=B&&l.osPerServerB!=null?l.osPerServerB:l.osPerServer,calP=B&&l.calPerUserB!=null?l.calPerUserB:l.calPerUser;
  R.dbCores=Math.max(+i.cpu||0,+l.dbMin||0);R.dbInst=1+(+l.dbExtra||0);
  R.dbOne=nLic?dbP*R.dbCores*R.dbInst:0;R.dbSup=R.dbOne*l.dbSupport/100;
  R.os=nLic?osP*i.servers*envN:0;
  R.cal=nLic?calP*s.users:0;
  R.licOnceOther=0;R.licYearOther=0;R.svcOnce=0;R.svcYear=0;
  if(nLic)s.other.forEach(function(o){
    var c=B&&o.costB!=null?o.costB:o.cost,v=(+c||0)*(+o.qty||0);
    if(o.cat==='lic'){if(o.type==='once')R.licOnceOther+=v;else R.licYearOther+=v;}
    else{if(o.type==='once')R.svcOnce+=v;else R.svcYear+=v;}
  });
  R.licOne=R.dbOne+R.os+R.cal+R.licOnceOther;
  R.licYear=R.dbSup+R.licYearOther;

  var a=s.amc,pct=B&&a.pctB!=null?a.pctB:a.pct;
  R.amcBase=0;R.crCost=0;R.depCost=0;R.pct=pct;
  if(nAmc){
    R.amcBase=a.mode==='percent'?R.dev*pct/100:(+a.people||0)*(+a.daysPerMonth||0)*12*(+rates[a.level]||0);
    R.crCost=(+a.crDays||0)*(+rates[a.crLevel]||0);
    R.depCost=(+a.deployDays||0)*(+rates[a.deployLevel||'Mid']||0);
  }
  R.rates=rates;
  R.warr=Math.min(12,Math.max(0,+a.warranty||0));
  R.esc=(+a.esc||0)/100;
  R.H=Math.max(1,Math.round(+a.years||1));
  R.gstRate=fin.gstOn?(+fin.gst||0)/100:0;
  R.oneSub=R.dev+R.capex+R.licOne+R.svcOnce;
  R.oneGst=R.oneSub*R.gstRate;
  R.oneTotal=R.oneSub+R.oneGst;
  function rec(y,full){
    var f=Math.pow(1+R.esc,y-1);
    var amc=R.amcBase*((y===1&&!full)?(12-R.warr)/12:1);
    var c={host:R.hostAnnual*f,oth:(R.infraOther+R.svcYear)*f,lic:R.licYear*f,amc:amc*f,dep:R.depCost*f,cr:R.crCost*f};
    c.sub=c.host+c.oth+c.lic+c.amc+c.dep+c.cr;c.gst=c.sub*R.gstRate;c.total=c.sub+c.gst;
    return c;
  }
  R.steady=rec(1,true);
  R.years=[];R.tco=R.oneTotal;R.recSum=0;
  for(var y=1;y<=R.H;y++){var c=rec(y,false);R.recSum+=c.total;R.tco+=c.total;c.cum=R.tco;R.years.push(c);}
  R.perUser=s.users>0?R.tco/s.users:0;
  R.blended=R.pd>0?R.labourBase/R.pd:0;
  var sc=s.scope;
  R.scopePd=((+sc.screens||0)*(+sc.dScreen||0)+(+sc.reports||0)*(+sc.dReport||0)+(+sc.integrations||0)*(+sc.dInteg||0))*cx;
  R.scopeRatio=(nMan&&R.scopePd>0)?R.pd/R.scopePd:null;
  /* value creation: benefits are the same on both cost bases */
  R.val={rows:[],yearly:0,once:0};
  ((s.value&&s.value.items)||[]).forEach(function(it){
    var a=(+it.qty||0)*(+it.rate||0);R.val.rows.push(a);
    if(it.freq==='once')R.val.once+=a;else R.val.yearly+=a;
  });
  R.val.total=R.val.once+R.val.yearly*R.H;
  R.val.net=R.val.total-R.tco;
  R.val.roi=R.tco>0?R.val.net/R.tco:null;
  var gain=R.val.yearly-R.steady.total;
  R.val.payback=R.oneTotal<=R.val.once?0:(gain>0?(R.oneTotal-R.val.once)/gain:null);   // years
  return R;
}
function calc2(st){var R=calc(st,'ca');R.b=calc(st,'bench');return R;}
function baseValue(kind,R){return kind==='new'?R.oneTotal:(kind==='amc'?R.steady.total:R.steady.cr*(1+R.gstRate));}
function recordValue(st,R){return (+st.reg.valueOverride>0)?+st.reg.valueOverride:baseValue(st.reg.kind,R);}
function valB(d){return d.valueB!=null?+d.valueB:(+d.value||0);}

/* ================= field engine ================= */
var FIELDS={};
function F(label,path,type,o){var f=Object.assign({label:label,path:path,type:type},o||{});FIELDS[path]=f;return f;}
function opts(f){return typeof f.options==='function'?f.options():f.options;}
function fieldHTML(f){
  var h='<label class="f'+(f.wide?' wide':'')+'" data-fp="'+f.path+'"'+(f.adm?' data-adm="1"':'')+'>';
  if(f.type==='check'){
    h+='<span class="chk"><input type="checkbox" data-path="'+f.path+'"><span>'+esc(f.label)+(f.hint?'<small>'+esc(f.hint)+'</small>':'')+'</span></span></label>';
    return h;
  }
  h+='<span class="fl">'+esc(f.label)+'</span>';
  if(f.type==='select'){
    h+='<select data-path="'+f.path+'">'+opts(f).map(function(o){return '<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>';}).join('')+'</select>';
  }else if(f.type==='text'){h+='<input type="text" data-path="'+f.path+'">';
  }else if(f.type==='date'){h+='<input type="date" data-path="'+f.path+'">';
  }else if(f.type==='area'){h+='<textarea rows="'+(f.rows||3)+'" data-path="'+f.path+'"></textarea>';
  }else{h+='<span class="inp"><input type="number" min="0" step="any" inputmode="decimal" data-path="'+f.path+'">'+(f.unit?'<i>'+esc(f.unit)+'</i>':'')+'</span>';}
  if(f.hint)h+='<small>'+esc(f.hint)+'</small>';
  return h+'</label>';
}
function fieldsHTML(list){return '<div class="fields">'+list.map(fieldHTML).join('')+'</div>';}
function ref(p){
  if(p.indexOf('m.')===0)return {o:M,p:p.slice(2),r:'m'};
  if(p.indexOf('pv.')===0)return {o:PV(),p:p.slice(3),r:'pv'};
  return {o:S,p:p,r:'s'};
}

/* --- registration field lists --- */
var lvlOpts=LEVELS.map(function(l){return [l,l];});
var P_BASICS=[
  F('Project name','name','text',{wide:true}),
  F('Delivery model','model','select',{wide:true,options:[['once','One-time setup: build, deploy and done'],['yearly','Yearly model: build and deploy, then yearly support and deployment']],
    hint:'One-time setup has no AMC or yearly deployment. The yearly model adds support, change requests and a yearly deployment.',
    after:function(s,v){s.need.amc=(v==='yearly');}}),
  F('Project type','type','select',{options:Object.keys(TYPE_NAME).map(function(k){return [k,TYPE_NAME[k]];})}),
  F('Department / client','q.to','text'),
  F('Financial year','reg.fy','select',{options:FY_OPTS,hint:'April to March'}),
  F('Record as','reg.kind','select',{options:Object.keys(KIND).map(function(k){return [k,KIND[k]];})}),
  F('Project status','reg.status','select',{options:Object.keys(STAT).map(function(k){return [k,STAT[k]];})}),
  F('Duration','days','number',{unit:'working days'}),
  F('Named users','users','number',{unit:'users'}),
  F('Complexity','complexity','select',{num:true,options:function(){var c=M.sw.complexity;return [[c.low,'Low: simple forms and reports'],[c.std,'Standard: typical plant application'],[c.high,'High: integrations, real-time data'],[c.vhigh,'Very high: AI / vision, L2 or PLC-critical']];}})
];
var P_NEEDS=[
  F('Manpower','need.man','check',{hint:'Team, levels and days'}),
  F('Servers and hosting','need.hw','check',{hint:'CPU, RAM, storage, cloud or on-premise'}),
  F('GPU / AI hardware','need.gpu','check',{hint:'Only for vision or AI workloads',show:function(s){return s.need.hw!==false;}}),
  F('Licences and other items','need.lic','check',{hint:'Database, OS, client access, tools, services'}),
  F('Change contingency, overheads, mark-up or GST','need.adv','check',{adm:true,hint:'Otherwise the master defaults are used for both cost bases'})
];
var P_HW=[
  F('Hosting model','infra.mode','select',{options:[['onprem','On-premise (buy servers)'],['cloud','Cloud / hosted (rent monthly)']]}),
  F('Environments','infra.env','select',{options:Object.keys(ENV_NAME).map(function(k){return [k,ENV_NAME[k]];})}),
  F('CPU cores (total)','infra.cpu','number',{unit:'cores'}),
  F('RAM','infra.ram','number',{unit:'GB'}),
  F('Storage required','infra.storageTb','number',{unit:'TB usable'}),
  F('Storage type','infra.storageType','select',{options:Object.keys(ST_NAME).map(function(k){return [k,ST_NAME[k]];})}),
  F('Redundancy','infra.redundancy','select',{options:Object.keys(RAID_NAME).map(function(k){return [k,RAID_NAME[k]];})}),
  F('Servers / VMs','infra.servers','number',{unit:'per environment'}),
  F('Backup, SSL, monitoring, bandwidth','infra.otherAnnual','number',{adm:true,unit:'₹ / year'})
];
var custGpu=function(s){return s.infra.gpuId==='custom';};
var P_GPU=[
  F('GPU model','infra.gpuId','select',{options:function(){return M.hw.gpus.map(function(g){return [g.id,g.name];}).concat([['custom','Custom (enter price)']]);},
    after:function(s,v){if(v!=='custom'){setGpu(s,gpuById(v));}else s.infra.gpuName='Custom GPU';if(!(+s.infra.gpuCount))s.infra.gpuCount=1;}}),
  F('GPU count','infra.gpuCount','number',{unit:'GPUs'}),
  F('Price per GPU (CA)','infra.gpuPrice','number',{adm:true,unit:'₹',show:function(s){return custGpu(s)&&s.infra.mode==='onprem';}}),
  F('Price per GPU (benchmark)','infra.gpuPriceB','number',{adm:true,unit:'₹',show:function(s){return custGpu(s)&&s.infra.mode==='onprem';}}),
  F('Rent per GPU (CA)','infra.gpuMonthly','number',{adm:true,unit:'₹ / month',show:function(s){return custGpu(s)&&s.infra.mode==='cloud';}}),
  F('Rent per GPU (benchmark)','infra.gpuMonthlyB','number',{adm:true,unit:'₹ / month',show:function(s){return custGpu(s)&&s.infra.mode==='cloud';}})
];
var custDb=function(s){return s.lic.dbId==='custom';},custOs=function(s){return s.lic.osId==='custom';};
var P_LIC=[
  F('Database engine','lic.dbId','select',{options:function(){return M.lic.db.map(function(d){return [d.id,d.name];}).concat([['custom','Custom (enter price)']]);},
    after:function(s,v){if(v==='custom'){s.lic.dbName='Custom database';}else setDb(s,dbById(v));}}),
  F('Licence per core (CA)','lic.dbPrice','number',{adm:true,unit:'₹ / core',show:custDb}),
  F('Licence per core (benchmark)','lic.dbPriceB','number',{adm:true,unit:'₹ / core',show:custDb}),
  F('Minimum cores licensed','lic.dbMin','number',{unit:'cores',show:custDb}),
  F('Support / assurance','lic.dbSupport','number',{adm:true,unit:'% / year',show:custDb}),
  F('Extra licensed instances','lic.dbExtra','number',{unit:'instances',hint:'UAT or active DR that need their own licence'}),
  F('Operating system','lic.osId','select',{options:function(){return M.lic.os.map(function(o){return [o.id,o.name];}).concat([['custom','Custom (enter price)']]);},
    after:function(s,v){if(v==='custom'){s.lic.osName='Custom OS';}else setOs(s,osById(v));}}),
  F('OS licence per server (CA)','lic.osPerServer','number',{adm:true,unit:'₹',show:custOs}),
  F('OS licence per server (benchmark)','lic.osPerServerB','number',{adm:true,unit:'₹',show:custOs}),
  F('Client access licence per user (CA)','lic.calPerUser','number',{adm:true,unit:'₹ / user'}),
  F('Client access licence per user (benchmark)','lic.calPerUserB','number',{adm:true,unit:'₹ / user'}),
  F('Servers / VMs','infra.servers','number',{unit:'per environment',show:function(s){return s.need.hw===false;}}),
  F('CPU cores (for database licence)','infra.cpu','number',{unit:'cores',show:function(s){return s.need.hw===false;}})
];
var P_AMC=[
  F('AMC basis','amc.mode','select',{options:[['percent','% of development cost'],['team','Dedicated support people']]}),
  F('AMC rate (CA)','amc.pct','number',{adm:true,unit:'% of dev cost / yr',show:function(s){return s.amc.mode==='percent';}}),
  F('AMC rate (benchmark)','amc.pctB','number',{adm:true,unit:'% of dev cost / yr',show:function(s){return s.amc.mode==='percent';}}),
  F('Support people','amc.people','number',{unit:'people',show:function(s){return s.amc.mode==='team';}}),
  F('Support level','amc.level','select',{options:lvlOpts,show:function(s){return s.amc.mode==='team';}}),
  F('Support effort','amc.daysPerMonth','number',{unit:'days / month each',show:function(s){return s.amc.mode==='team';}}),
  F('Yearly deployment effort','amc.deployDays','number',{unit:'days / year',hint:'Releases and redeployment each year'}),
  F('Deployment level','amc.deployLevel','select',{options:lvlOpts}),
  F('Change-request days','amc.crDays','number',{unit:'days / year',hint:'Enhancements beyond bug fixes'}),
  F('Change-request level','amc.crLevel','select',{options:lvlOpts}),
  F('Free warranty','amc.warranty','number',{unit:'months (0 to 12)',hint:'AMC starts after warranty'}),
  F('Yearly cost escalation','amc.esc','number',{adm:true,unit:'% / year'}),
  F('Years of ownership','amc.years','number',{unit:'years',hint:'Horizon for total cost'})
];
var P_ADV=[
  F('Contingency (CA)','fin.cont','number',{unit:'% of labour'}),
  F('Contingency (benchmark)','finB.cont','number',{unit:'% of labour'}),
  F('Overheads (CA)','fin.ovh','number',{unit:'% of labour',hint:'Workstations, tools, admin, management'}),
  F('Overheads (benchmark)','finB.ovh','number',{unit:'% of labour'}),
  F('Mark-up (CA)','fin.markup','number',{unit:'% on development',hint:'0 for an internal project'}),
  F('Mark-up (benchmark)','finB.markup','number',{unit:'% on development',hint:'The software company\'s margin'}),
  F('Benchmark effort factor','benchEffort','number',{unit:'× person-days',hint:'1 = same effort as the team entered'}),
  F('Add GST to all costs','fin.gstOn','check'),
  F('GST rate','fin.gst','number',{unit:'%',show:function(s){return s.fin.gstOn;}}),
  F('Yearly cost escalation','amc.esc','number',{unit:'% / year',show:function(s){return !isYearly(s);}}),
  F('Years of ownership','amc.years','number',{unit:'years',show:function(s){return !isYearly(s);}})
];
var P_SUBMIT=[
  F('Charged to user department','reg.charged','number',{adm:true,unit:'₹',hint:'0 when no charge is raised'}),
  F('Recorded cost to Central Automation','reg.valueOverride','number',{adm:true,unit:'₹',hint:'0 = use the calculated value for the record type. The benchmark value is always calculated.'}),
  F('Note','reg.note','text',{wide:true}),
  F('Reply to the verifier','reg.reply','area',{wide:true,rows:2,show:function(){return !!editingId&&editingWf==='info';},hint:'Explain what you changed or added'})
];
var SCOPE_FIELDS=[
  F('Screens / forms','scope.screens','number'),F('Reports / dashboards','scope.reports','number'),F('Integrations / interfaces','scope.integrations','number')
];

/* --- quotation fields (page 4, bound to the estimate being printed) --- */
var P_QUOTE=[
  F('Cost basis to show','pv.q.basis','select',{wide:true,options:[['both','Both, with the difference'],['ca','Central Automation cost only'],['bench','Benchmark (software company) cost only']]}),
  F('Your company','pv.q.from','text'),F('Quotation number','pv.q.no','text'),
  F('Your address','pv.q.fromAddr','area',{wide:true,rows:2}),
  F('Quotation date','pv.q.date','date'),F('Valid for','pv.q.valid','number',{unit:'days'}),F('Prepared by','pv.q.prepared','text'),
  F('Client name','pv.q.to','text'),
  F('Client address','pv.q.toAddr','area',{wide:true,rows:2}),
  F('Project / reference','pv.q.ref','text',{wide:true}),
  F('Show effort (person-days) on quotation','pv.q.showEffort','check',{wide:true}),
  F('Show yearly running costs on quotation','pv.q.showRec','check',{wide:true}),
  F('Show value creation on quotation','pv.q.showValue','check',{wide:true}),
  F('Terms and conditions','pv.q.terms','area',{wide:true,rows:6,hint:'One term per line'})
];

/* ================= wizard build ================= */
var STEP='basics',editingId=null,editingWf='',LAST=null;
function visibleSteps(){
  var n=S.need,a=[['basics','Basics']];
  if(n.man!==false)a.push(['team','Manpower']);
  if(n.hw!==false)a.push(['hw','Hardware']);
  if(n.lic!==false||isYearly(S))a.push(['lic','Licences and support']);
  a.push(['value','Value creation']);
  a.push(['review','Review']);
  return a;
}
function numInput(path,label,w,extra){return '<input type="number" min="0" step="any" inputmode="decimal" data-path="'+path+'" aria-label="'+esc(label)+'" style="width:'+w+'px"'+(extra||'')+'>';}
function teamHTML(){
  var adm=isAdmin();
  var rows=S.team.map(function(r,i){
    return '<tr>'+
    '<td><input type="text" list="roleList" data-path="team.'+i+'.role" aria-label="Role"></td>'+
    '<td><select data-path="team.'+i+'.level" aria-label="Level">'+lvlOpts.map(function(l){return '<option>'+l[0]+'</option>';}).join('')+'</select></td>'+
    '<td>'+numInput('team.'+i+'.people','People',70)+'</td>'+
    '<td>'+numInput('team.'+i+'.days','Days',80,' data-blank="1"')+'</td>'+
    '<td>'+numInput('team.'+i+'.alloc','Time on project percent',80,' max="100"')+'</td>'+
    '<td class="num"><output data-rowpd="'+i+'"></output></td>'+(adm?'<td class="num"><output data-rowcost="'+i+'"></output></td>':'')+
    '<td><button type="button" class="x" data-del="team:'+i+'" aria-label="Remove role">×</button></td></tr>';
  }).join('');
  return '<datalist id="roleList">'+M.man.roles.map(function(r){return '<option value="'+esc(r.role)+'">';}).join('')+'</datalist>'+
    '<div class="tw"><table><thead><tr><th>Role</th><th>Level</th><th>People</th><th>Days each</th><th>Time on project %</th><th class="num">Person-days</th>'+(adm?'<th class="num">Cost</th>':'')+'<th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<button type="button" class="btn addrow" data-add="team">Add role</button>'+
    (adm?'<p class="note" id="rateNote"></p>':'');
}
function otherHTML(){
  var adm=isAdmin();
  var rows=S.other.map(function(r,i){
    return '<tr>'+
    '<td><input type="text" data-path="other.'+i+'.name" aria-label="Item"></td>'+
    '<td><select data-path="other.'+i+'.cat" aria-label="Category"><option value="lic">Software / licence</option><option value="svc">Service / other</option></select></td>'+
    '<td><select data-path="other.'+i+'.type" aria-label="Billing"><option value="once">One-time</option><option value="year">Every year</option></select></td>'+
    (adm?'<td>'+numInput('other.'+i+'.cost','Cost, Central Automation',100)+'</td><td>'+numInput('other.'+i+'.costB','Cost, benchmark',100)+'</td>':'')+
    '<td>'+numInput('other.'+i+'.qty','Quantity',70)+'</td>'+
    '<td><button type="button" class="x" data-del="other:'+i+'" aria-label="Remove item">×</button></td></tr>';
  }).join('');
  var cat='<select id="catAdd" aria-label="Add from catalogue" style="width:auto;min-width:220px"><option value="">Add from catalogue…</option>'+M.lic.items.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>';}).join('')+'</select>';
  return '<div class="tw"><table><thead><tr><th>Item</th><th>Category</th><th>Billing</th>'+(adm?'<th>CA cost ₹</th><th>Benchmark ₹</th>':'')+'<th>Qty</th><th></th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="7" style="color:var(--muted);padding:12px">No other items yet.</td></tr>')+'</tbody></table></div>'+
    '<div class="actions">'+cat+'<button type="button" class="btn" data-add="other">Add blank item</button></div>'+
    (adm?'':'<p class="note">An admin prices these items from the licence catalogue.</p>');
}
function valueHTML(){
  var cats='<option value="">Choose…</option>'+M.val.cats.map(function(c){return '<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>';}).join('');
  var rows=S.value.items.map(function(r,i){
    var p='value.items.'+i+'.';
    return '<tr>'+
    '<td><select data-path="'+p+'cat" aria-label="Benefit">'+cats+'</select></td>'+
    '<td><input type="text" data-path="'+p+'desc" aria-label="How the value is created"></td>'+
    '<td>'+numInput(p+'qty','Quantity',90)+'</td>'+
    '<td><input type="text" data-path="'+p+'unit" aria-label="Unit" style="width:80px"></td>'+
    '<td>'+numInput(p+'rate','Value per unit, rupees',100)+'</td>'+
    '<td><select data-path="'+p+'freq" aria-label="How often">'+Object.keys(FREQ).map(function(k){return '<option value="'+k+'">'+FREQ[k]+'</option>';}).join('')+'</select></td>'+
    '<td class="num"><output data-valamt="'+i+'"></output></td>'+
    '<td><button type="button" class="x" data-del="val:'+i+'" aria-label="Remove benefit">×</button></td></tr>';
  }).join('');
  return '<div class="tw"><table><thead><tr><th>Benefit</th><th>How the value is created</th><th>Quantity</th><th>Unit</th><th>₹ per unit</th><th>How often</th><th class="num">Value ₹</th><th></th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="8" style="color:var(--muted);padding:12px">No benefits yet.</td></tr>')+'</tbody></table></div>'+
    '<button type="button" class="btn addrow" data-add="val">Add benefit</button><p class="note" id="valNote"></p>';
}
function buildWizard(){
  var adm=isAdmin(),h='';
  h+='<div class="panel" data-panel="basics"><h2>Basics</h2><p class="lead">Answer these first. The steps you tick below decide what appears next.</p>'+
    fieldsHTML(P_BASICS)+
    '<h3 class="sub">What does this project need?</h3><p class="note" style="margin:0 0 6px">Tick only what applies. Unticked steps are skipped'+(adm?' and add no cost':'')+'.</p><div class="checks">'+P_NEEDS.map(fieldHTML).join('')+'</div></div>';
  h+='<div class="panel" data-panel="team"><h2>Manpower</h2><p class="lead">Who works on it, at what level, for how many days.'+(adm?' The cost is worked out at both the Central Automation and benchmark rates from the Manpower master.':'')+'</p><div id="teamWrap">'+teamHTML()+'</div>'+
    '<h3 class="sub">Scope cross-check (optional)</h3><p class="note" style="margin:0 0 8px">Count the screens, reports and integrations. The page compares your team effort with what that scope normally takes.</p>'+fieldsHTML(SCOPE_FIELDS)+'</div>';
  h+='<div class="panel" data-panel="hw"><h2>Hardware and hosting</h2><p class="lead">Sizing for the servers.'+(adm?' Costs are worked out at both the Central Automation and benchmark unit prices from the Hardware master.':'')+'</p>'+fieldsHTML(P_HW)+
    '<div class="blk" data-need="gpu"><h3 class="sub">GPU</h3>'+fieldsHTML(P_GPU)+'</div></div>';
  h+='<div class="panel" data-panel="lic"><h2>Licences and support</h2><p class="lead">'+(adm?'Prices come from the Licence and Software masters.':'Choose the products and the support you need. An admin adds the prices.')+'</p>'+
    '<div class="blk" data-need="lic"><h3 class="sub" style="margin-top:0">Licences</h3>'+fieldsHTML(P_LIC)+'<p class="note" id="licNote"></p><h3 class="sub">Other licences and services</h3><div id="otherWrap">'+otherHTML()+'</div></div>'+
    '<div class="blk" data-need="amc"><h3 class="sub">Yearly support and deployment</h3>'+fieldsHTML(P_AMC)+'</div></div>';
  h+='<div class="panel" data-panel="value"><h2>Value creation</h2><p class="lead">What the project gives back: hours saved, downtime avoided, energy, quality and so on. Value = quantity × ₹ per unit, per year or one-time. Choosing a benefit fills in its usual unit and value per unit from the Value creation master; change them if you know better.</p><div id="valWrap">'+valueHTML()+'</div></div>';
  h+='<div class="panel" data-panel="review"><h2>Review and submit</h2><p class="lead">'+(adm?'Check the cost, then submit it for verification by another admin.':'Check the details, then submit. An admin works out the cost and verifies the entry.')+'</p>'+
    '<div id="revRes"></div>'+
    '<div class="blk" data-need="adv"><h3 class="sub">Loadings and tax</h3>'+fieldsHTML(P_ADV)+'</div>'+
    '<h3 class="sub">Submit</h3>'+fieldsHTML(P_SUBMIT)+'<div id="editBanner"></div>'+
    '<div class="actions"><button type="button" class="btn primary" id="saveReg">Submit for verification</button><button type="button" class="btn" id="copySum">Copy summary</button><button type="button" class="btn" id="resetDraft">Start a new estimate</button></div>'+
    '<p class="note">Anyone can submit. One verification by an admin (not the person who submitted) makes the entry final. Submitting again for the same project, year and record type updates your own entry until it is verified.</p></div>';
  $('#wiz').innerHTML=h;
}
function renderSteps(){
  var vs=visibleSteps();
  if(!vs.some(function(x){return x[0]===STEP;}))STEP='basics';
  $('#steps').innerHTML=vs.map(function(x,i){return '<button type="button" role="tab" data-step="'+x[0]+'" aria-selected="'+(x[0]===STEP)+'"><b>'+(i+1)+'</b>'+esc(x[1])+'</button>';}).join('');
  $$('#wiz .panel').forEach(function(p){p.classList.toggle('on',p.dataset.panel===STEP);});
  var idx=vs.map(function(x){return x[0];}).indexOf(STEP);
  var nav='';
  nav+=idx>0?'<button type="button" class="btn" id="stBack">Back</button>':'<span></span>';
  nav+=idx<vs.length-1?'<button type="button" class="btn primary" id="stNext">Next: '+esc(vs[idx+1][1])+'</button>':'<span></span>';
  $('#stepnav').innerHTML=nav;
}
function goStep(dir){
  var vs=visibleSteps().map(function(x){return x[0];}),i=vs.indexOf(STEP)+dir;
  if(dir>0&&STEP==='basics'&&!String(S.name||'').trim()){toast('Enter the project name first');return;}
  if(i>=0&&i<vs.length){STEP=vs[i];update();window.scrollTo({top:0});}
}
function paintStrip(R){
  if(!isAdmin()){
    $('#strip').innerHTML='<div><span>Person-days</span><b>'+num(R.pd,0)+'</b></div><div><span>People on team</span><b>'+num(R.headcount,0)+'</b></div><div><span>Value created per year</span><b>'+short(R.val.yearly)+'</b></div>';
    return;
  }
  var sv=R.b.tco-R.tco;
  $('#strip').innerHTML='<div><span>One-time (CA)</span><b>'+short(R.oneTotal)+'</b></div><div><span>Per year (CA)</span><b>'+short(R.steady.total)+'</b></div><div><span>Saving vs benchmark, '+R.H+' yr</span><b>'+short(sv)+'</b></div>';
}

/* ================= results html ================= */
function sgn(n){return n<0?'−'+inr(-n):inr(n);}
function pctSave(c,b){return b>0?Math.round((b-c)/b*100):0;}
function kpi2(cls,label,c,b){
  var p=parts(c);
  return '<div class="kpi '+cls+'"><div class="lb">'+label+' · Central Automation</div><div class="big"><span>₹'+p[0]+'</span>'+(p[1]?'<em>'+p[1]+'</em>':'')+'</div>'+
    '<div class="full">Central Automation '+inr(c)+'</div><div class="full">Benchmark '+inr(b)+' · saving '+sgn(b-c)+' ('+pctSave(c,b)+'%)</div></div>';
}
function bigKpi(cls,label,n,sub){
  var p=parts(n);
  return '<div class="kpi '+cls+'"><div class="lb">'+label+'</div><div class="big"><span>₹'+p[0]+'</span>'+(p[1]?'<em>'+p[1]+'</em>':'')+'</div><div class="full">'+sub+'</div></div>';
}
function dualTable(rows,totC,totB,totLabel,first){
  var body=rows.filter(function(x){return x[1]>0.5||x[2]>0.5;}).map(function(x){
    var d=x[2]-x[1];
    return '<tr><td>'+x[0]+'</td><td class="num">'+inr(x[2])+'</td><td class="num">'+inr(x[1])+'</td><td class="num sv'+(d<0?' neg':'')+'">'+sgn(d)+'</td></tr>';
  }).join('');
  var d=totB-totC;
  return '<div class="tw"><table class="dual"><thead><tr><th>'+(first||'Item')+'</th><th class="num">Benchmark</th><th class="num">Central Automation</th><th class="num">Saving</th></tr></thead><tbody>'+body+
    '<tr class="tot"><td>'+totLabel+'</td><td class="num">'+inr(totB)+'</td><td class="num">'+inr(totC)+'</td><td class="num sv'+(d<0?' neg':'')+'">'+sgn(d)+'</td></tr></tbody></table></div>';
}
function dbLabel(st){return st.lic.dbName||(dbById(st.lic.dbId||st.lic.dbPreset)||{}).name||'Database';}
function osLabel(st){return st.lic.osName||(osById(st.lic.osId)||{}).name||'Operating system';}
function gpuLabel(st){return st.infra.gpuName||(gpuById(st.infra.gpuId||st.infra.gpuPreset)||{}).name||'GPU';}
function resultsHTML(st,R){
  var s=st,B=R.b,h='';
  h+='<div class="hero">'+
    kpi2('build','One-time build cost',R.oneTotal,B.oneTotal)+
    kpi2('run','Yearly running cost',R.steady.total,B.steady.total)+
    kpi2('tco',R.H+'-year total cost of ownership',R.tco,B.tco)+'</div>';
  var chip=function(v,l,w){return '<div class="chip'+(w?' wide':'')+'"><b>'+v+'</b><span>'+l+'</span></div>';};
  var scope='';
  if(R.scopeRatio!=null){
    var pct=Math.round(R.scopeRatio*100),cls='ok',msg='consistent with scope';
    if(R.scopeRatio<0.8){cls='warn';msg='team effort looks low for this scope';}
    else if(R.scopeRatio>1.25){cls='warn';msg='team effort is above the scope estimate';}
    scope=chip('<span class="'+cls+'">'+pct+'%</span>','Team effort vs scope estimate of '+num(R.scopePd,0)+' person-days: '+msg,true);
  }
  h+='<div class="chips">'+
    chip(s.model==='once'?'One-time':'Yearly','Delivery model')+chip(num(R.pd,0),'Person-days')+chip(num(R.headcount,0),'People on team')+
    chip(R.pd>0?inr(R.blended)+' / '+inr(B.blended):'–','Cost per person-day, CA / benchmark')+
    chip(s.users>0?inr(R.perUser):'–','Total cost per user (CA)')+
    chip(pctSave(R.tco,B.tco)+'%','Saving vs benchmark over '+R.H+' year'+(R.H>1?'s':''))+scope+'</div>';
  var oneRows=[
    ['Labour ('+num(R.pd,0)+' person-days'+(+s.complexity!==1?' × '+s.complexity:'')+')',R.labour,B.labour],
    ['Contingency',R.cont,B.cont],['Overheads',R.ovh,B.ovh],['Mark-up',R.markup,B.markup],
    [s.infra.mode==='onprem'?'Servers and storage':'Cloud (no upfront cost)',R.capex,B.capex],
    ['Database licence',R.dbOne,B.dbOne],['OS licence',R.os,B.os],['Client access licences',R.cal,B.cal],
    ['Other licences',R.licOnceOther,B.licOnceOther],['Services and other',R.svcOnce,B.svcOnce],['GST',R.oneGst,B.oneGst]];
  h+='<h3>One-time cost</h3>'+dualTable(oneRows,R.oneTotal,B.oneTotal,'Total one-time');
  var a=R.steady,b=B.steady;
  var runRows=[
    [s.infra.mode==='onprem'?'Hardware support and running':'Cloud rent',a.host,b.host],['Backup, SSL, monitoring, other yearly',a.oth,b.oth],
    ['Licence support and renewals',a.lic,b.lic],['AMC',a.amc,b.amc],['Yearly deployment',a.dep,b.dep],['Change requests',a.cr,b.cr],['GST',a.gst,b.gst]];
  h+='<h3>Yearly running cost (full rate)</h3>'+dualTable(runRows,a.total,b.total,'Total per year');
  if(!R.yearly)h+='<p class="note">One-time setup model: no AMC, yearly deployment or change requests. Yearly cost is hosting and licence renewals only.</p>';
  h+='<h3>Year by year</h3><div class="tw"><table class="dual yr"><thead><tr><th>Year</th><th class="num">Benchmark</th><th class="num">Central Automation</th><th class="num">Saving</th><th class="num">Saving so far</th></tr></thead><tbody>'+
    '<tr><td>Build</td><td class="num">'+inr(B.oneTotal)+'</td><td class="num">'+inr(R.oneTotal)+'</td><td class="num sv">'+sgn(B.oneTotal-R.oneTotal)+'</td><td class="num sv">'+sgn(B.oneTotal-R.oneTotal)+'</td></tr>'+
    R.years.map(function(c,k){var bc=B.years[k];return '<tr><td>Year '+(k+1)+(k===0&&R.warr>0&&R.nAmc?' <small style="color:var(--muted)">('+R.warr+' mo warranty)</small>':'')+'</td><td class="num">'+inr(bc.total)+'</td><td class="num">'+inr(c.total)+'</td><td class="num sv">'+sgn(bc.total-c.total)+'</td><td class="num sv">'+sgn(bc.cum-c.cum)+'</td></tr>';}).join('')+'</tbody></table></div>';
  var m=[];
  m.push('<b>Two cost bases.</b> <b>Central Automation</b> is the cost to develop and deploy in-house (internal loaded rates, actual purchase prices). <b>Benchmark</b> is what a software development company would charge (market rates and vendor margins). Both use the same team, days and sizing you entered. Saving = benchmark − Central Automation.');
  m.push('<b>Delivery model:</b> '+(R.yearly?'yearly. Build and deploy, then yearly support, change requests and deployment.':'one-time setup. Build and deploy once, no AMC or yearly deployment.'));
  if(R.nMan)m.push('<b>Labour</b> = Σ (people × days × time on project % × cost per day for level) = '+num(R.pd,1)+' person-days. Central Automation '+inr(R.labourBase)+(+s.complexity!==1?' × complexity '+s.complexity:'')+' = '+inr(R.labour)+'. Benchmark '+inr(B.labourBase)+(+s.complexity!==1?' × complexity '+s.complexity:'')+(B.eff!==1?' × effort factor '+B.eff:'')+' = '+inr(B.labour)+'.');
  else m.push('<b>Manpower</b> is not part of this estimate.');
  m.push('<b>Development cost</b> = labour + contingency + overheads (both on labour), then + mark-up on that subtotal. Central Automation: '+R.fin.cont+'% + '+R.fin.ovh+'% + '+R.fin.markup+'% = '+inr(R.dev)+'. Benchmark: '+B.fin.cont+'% + '+B.fin.ovh+'% + '+B.fin.markup+'% = '+inr(B.dev)+'.');
  if(!R.nHw)m.push('<b>Servers and hosting</b> are not part of this estimate.');
  else if(s.infra.mode==='onprem')m.push('<b>Servers</b> = (cores × rate + RAM GB × rate + TB × RAID '+R.raid+'× × '+ST_NAME[s.infra.storageType]+' rate'+(R.gpuN?' + '+R.gpuN+' GPU × price':'')+') × environment factor '+R.envF+'. Central Automation '+inr(R.capex)+', benchmark '+inr(B.capex)+'. Yearly support and running = '+R.hwr.opsPct+'% (CA) or '+B.hwr.opsPct+'% (benchmark) of that.');
  else m.push('<b>Cloud</b> = (vCPU × rate + RAM GB × rate + TB × RAID '+R.raid+'× × '+ST_NAME[s.infra.storageType]+' rate'+(R.gpuN?' + '+R.gpuN+' GPU × rent':'')+') × environment factor '+R.envF+' per month × 12. Central Automation '+inr(R.hostAnnual)+', benchmark '+inr(B.hostAnnual)+' per year.');
  if(R.nLic){
    m.push('<b>Database licence</b> = ₹/core × max(cores '+s.infra.cpu+', minimum '+s.lic.dbMin+') × '+R.dbInst+' instance'+(R.dbInst>1?'s':'')+'. Central Automation '+inr(R.dbOne)+', benchmark '+inr(B.dbOne)+'; support '+s.lic.dbSupport+'% per year.');
    m.push('<b>OS</b> = per server × '+s.infra.servers+' server'+(s.infra.servers>1?'s':'')+' × '+R.envN+' environment'+(R.envN>1?'s':'')+': CA '+inr(R.os)+', benchmark '+inr(B.os)+'. <b>Client access</b> = '+s.users+' users × per user: CA '+inr(R.cal)+', benchmark '+inr(B.cal)+'.');
  }else m.push('<b>Licences and other items</b> are not part of this estimate.');
  if(R.nAmc)m.push('<b>AMC</b> = '+(s.amc.mode==='percent'?R.pct+'% (CA) or '+B.pct+'% (benchmark) of development cost':s.amc.people+' person × '+s.amc.daysPerMonth+' days × 12 months × '+s.amc.level+' rate')+': CA '+inr(R.amcBase)+', benchmark '+inr(B.amcBase)+' per year. Yearly deployment = '+s.amc.deployDays+' days × '+(s.amc.deployLevel||'Mid')+' rate: CA '+inr(R.depCost)+', benchmark '+inr(B.depCost)+'. Change requests = '+s.amc.crDays+' days × '+s.amc.crLevel+' rate: CA '+inr(R.crCost)+', benchmark '+inr(B.crCost)+'. Year 1 AMC is reduced by '+R.warr+' free warranty month'+(R.warr===1?'':'s')+'.');
  m.push('<b>Running cost each year</b> = hosting + yearly items + licence support + AMC + deployment + change requests, grown by '+(R.esc*100).toFixed(1)+'% per year.');
  if(R.gstRate>0)m.push('<b>GST</b> '+(R.gstRate*100)+'% is added to every one-time and yearly cost.');
  m.push('<b>Total cost of ownership</b> = one-time + running for '+R.H+' year'+(R.H>1?'s':'')+'. Central Automation '+inr(R.oneTotal)+' + '+inr(R.recSum)+' = '+inr(R.tco)+'. Benchmark '+inr(B.oneTotal)+' + '+inr(B.recSum)+' = '+inr(B.tco)+'.');
  m.push('<b>Rates used</b> are copied into this estimate when it is created, from the Manpower, Hardware, Software and Licence masters.');
  if(R.val.rows.length)m.push('<b>Value creation</b> = Σ quantity × ₹ per unit. Over '+R.H+' year'+(R.H>1?'s':'')+' = one-time + yearly × '+R.H+' = '+inr(R.val.total)+'. Return on cost = (value − Central Automation cost of ownership) ÷ that cost. Payback = (one-time cost − one-time value) ÷ (yearly value − yearly running cost).');
  h+=valueBlockHTML(s,R,true);
  h+='<details class="meth" open><summary>How this is calculated</summary><ol>'+m.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ol></details>';
  return h;
}
function catName(id){var c=M.val.cats.filter(function(x){return x.id===id;})[0];return c?c.name:'Benefit';}
function years(y){if(y==null)return 'No payback';if(y<=0)return 'at once';var m=Math.round(y*12);return m<24?m+' month'+(m===1?'':'s'):(Math.round(y*10)/10)+' years';}
/* adm: also compare the value with the Central Automation cost (ROI, payback) */
function valueBlockHTML(st,R,adm){
  var V=R.val,items=(st.value&&st.value.items)||[],h='<h3>Value creation</h3>';
  if(!items.length)return h+'<p class="note">No value creation entered.</p>';
  h+='<div class="tw"><table class="dual"><thead><tr><th>Benefit</th><th>Basis</th><th class="num">Per year</th><th class="num">One-time</th></tr></thead><tbody>'+
    items.map(function(it,i){var a=V.rows[i]||0;
      return '<tr><td>'+esc(catName(it.cat))+(it.desc?'<span class="sub2">'+esc(it.desc)+'</span>':'')+'</td><td>'+num(+it.qty||0)+' '+esc(it.unit||'')+' × '+inr(+it.rate||0)+'</td>'+
        '<td class="num">'+(it.freq==='once'?'':inr(a))+'</td><td class="num">'+(it.freq==='once'?inr(a):'')+'</td></tr>';}).join('')+
    '<tr class="tot"><td colspan="2">Total</td><td class="num">'+inr(V.yearly)+'</td><td class="num">'+inr(V.once)+'</td></tr></tbody></table></div>';
  var chip=function(v,l){return '<div class="chip"><b>'+v+'</b><span>'+l+'</span></div>';};
  h+='<div class="chips">'+chip(short(V.yearly),'Value created per year')+chip(short(V.once),'One-time value')+chip(short(V.total),'Value over '+R.H+' year'+(R.H>1?'s':''));
  if(adm)h+=chip('<span class="'+(V.net>=0?'ok':'warn')+'">'+sgn(V.net)+'</span>','Value less '+R.H+'-year cost of ownership (CA)')+
    chip(V.roi==null?'–':Math.round(V.roi*100)+'%','Return on cost over '+R.H+' year'+(R.H>1?'s':''))+chip(years(V.payback),'Payback on one-time cost');
  return h+'</div>';
}
/* Review for people who are not admins: effort and value, no costs */
function reviewHTML(st,R){
  var chip=function(v,l){return '<div class="chip"><b>'+v+'</b><span>'+l+'</span></div>';};
  return '<div class="chips">'+chip(st.model==='once'?'One-time':'Yearly','Delivery model')+chip(num(R.pd,0),'Person-days')+chip(num(R.headcount,0),'People on team')+
    chip(num(+st.days||0,0),'Working days')+chip(num(+st.users||0,0),'Named users')+'</div>'+valueBlockHTML(st,R,false)+
    '<p class="note">Costs are worked out by an admin when the entry is verified.</p>';
}
function summaryText(st,R){
  if(!isAdmin())return ['Project: '+(st.name||'Untitled')+' ('+(KIND[st.reg.kind]||'')+', FY '+st.reg.fy+')','Effort: '+num(R.pd,0)+' person-days, '+R.headcount+' people',
    'Value created: '+inr(R.val.yearly)+' per year, '+inr(R.val.once)+' one-time'].join('\n');
  var s=st,B=R.b,t=[];
  t.push('Estimate: '+(s.name||'Untitled')+' ('+(KIND[s.reg.kind]||'')+', FY '+s.reg.fy+', '+(R.yearly?'yearly model':'one-time setup')+')');
  t.push('One-time build cost: Central Automation '+inr(R.oneTotal)+', benchmark '+inr(B.oneTotal)+', saving '+sgn(B.oneTotal-R.oneTotal));
  t.push('  Development: '+inr(R.dev)+' vs '+inr(B.dev)+' ('+num(R.pd,0)+' person-days, '+R.headcount+' people)');
  if(R.capex||B.capex)t.push('  Servers and storage: '+inr(R.capex)+' vs '+inr(B.capex));
  if(R.licOne||B.licOne)t.push('  Licences: '+inr(R.licOne)+' vs '+inr(B.licOne));
  t.push('Yearly running cost (full rate): '+inr(R.steady.total)+' vs '+inr(B.steady.total));
  t.push(R.H+'-year total cost of ownership: '+inr(R.tco)+' vs '+inr(B.tco)+', saving '+sgn(B.tco-R.tco));
  return t.join('\n');
}

/* ================= quotation html ================= */
function quoteHTML(st,R,meta){
  var s=st,q=s.q,C=R,B=R.b,bas=q.basis||'both';
  var cols=bas==='both'?['b','c','d']:[bas==='bench'?'b':'c'];
  var colHead={b:'Benchmark',c:'Central Automation',d:'Saving'};
  if(bas!=='both')colHead[cols[0]]=bas==='bench'?'Amount (benchmark)':'Amount';
  function cells(c,b,cls){
    return cols.map(function(k){
      if(k==='c')return '<td class="num">'+inr(c)+'</td>';
      if(k==='b')return '<td class="num">'+inr(b)+'</td>';
      return '<td class="num">'+sgn(b-c)+'</td>';
    }).join('');
  }
  function heads(){return cols.map(function(k){return '<th class="num">'+colHead[k]+'</th>';}).join('');}
  var items=[];
  function add(desc,sub,f){var c=f(C),b=f(B);if(c>0.5||b>0.5)items.push({desc:desc,sub:sub,c:c,b:b});}
  add('Software development: '+(s.name||'Application'),'Analysis, design, development, testing, deployment and handover'+(q.showEffort&&C.pd>0?'. Effort: '+num(C.pd,0)+' person-days over '+s.days+' working days.':''),function(r){return r.dev;});
  if(C.capex||B.capex)add('Servers and storage',s.infra.cpu+' cores, '+s.infra.ram+' GB RAM, '+s.infra.storageTb+' TB '+ST_NAME[s.infra.storageType]+' ('+RAID_NAME[s.infra.redundancy]+')'+(C.gpuN?', '+C.gpuN+' × '+gpuLabel(s):'')+'. '+ENV_NAME[s.infra.env]+'.',function(r){return r.capex;});
  add('Database licence',dbLabel(s)+', '+C.dbCores+' cores'+(C.dbInst>1?' × '+C.dbInst+' instances':''),function(r){return r.dbOne;});
  add('Operating system licences',osLabel(s)+': '+s.infra.servers+' server'+(s.infra.servers>1?'s':'')+' × '+C.envN+' environment'+(C.envN>1?'s':''),function(r){return r.os;});
  add('Client access licences',s.users+' users',function(r){return r.cal;});
  if(C.nLic)s.other.forEach(function(o){if(o.type==='once'){
    add(o.name,(+o.qty!==1?o.qty+' units':''),function(r){var cc=(r===B&&o.costB!=null)?o.costB:o.cost;return (+cc||0)*(+o.qty||0);});}});
  var rows=items.map(function(it,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(it.desc)+(it.sub?'<small>'+esc(it.sub)+'</small>':'')+'</td>'+cells(it.c,it.b)+'</tr>';}).join('');
  var gstC=Math.round(C.gstRate*100*100)/100;
  var tot='<tr class="sum"><td></td><td class="num">Subtotal</td>'+cells(C.oneSub,B.oneSub)+'</tr>'+
    (C.gstRate>0?'<tr class="sum"><td></td><td class="num">GST @ '+gstC+'%</td>'+cells(C.oneGst,B.oneGst)+'</tr>':'')+
    '<tr class="grand"><td></td><td class="num">Total one-time price</td>'+cells(C.oneTotal,B.oneTotal)+'</tr>';
  var vf=parseD(q.date),vt=null;
  if(vf){vt=new Date(vf.getTime());vt.setDate(vt.getDate()+(+q.valid||0));}
  var a=C.steady,b=B.steady,rec='';
  if(q.showRec){
    var rr=[
      [s.infra.mode==='onprem'?'Hardware support and running cost':'Cloud hosting',a.host,b.host,''],
      ['Backup, SSL, monitoring and other yearly services',a.oth,b.oth,''],
      ['Licence support and renewals',a.lic,b.lic,''],
      ['Annual maintenance contract (AMC)',a.amc,b.amc,C.nAmc?(s.amc.mode==='percent'?C.pct+'% (CA), '+B.pct+'% (benchmark) of development cost':s.amc.people+' support person'+(s.amc.people>1?'s':'')):''],
      ['Yearly deployment',a.dep,b.dep,C.nAmc&&s.amc.deployDays?s.amc.deployDays+' days per year':''],
      ['Change requests',a.cr,b.cr,C.nAmc&&s.amc.crDays?s.amc.crDays+' days per year':'']
    ].filter(function(x){return x[1]>0.5||x[2]>0.5;});
    if(rr.length)rec='<h3>Yearly running cost</h3><table><thead><tr><th>Item</th>'+heads()+'</tr></thead><tbody>'+
      rr.map(function(x){return '<tr><td>'+esc(x[0])+(x[3]?'<small>'+esc(x[3])+'</small>':'')+'</td>'+cells(x[1],x[2])+'</tr>';}).join('')+
      (C.gstRate>0?'<tr class="sum"><td class="num">GST @ '+gstC+'%</td>'+cells(a.gst,b.gst)+'</tr>':'')+
      '<tr class="grand"><td class="num">Total per year</td>'+cells(a.total,b.total)+'</tr></tbody></table>'+
      '<p class="mut" style="margin:6px 0 0">'+(C.nAmc&&C.warr>0?'AMC starts after '+C.warr+' month'+(C.warr>1?'s':'')+' of free warranty. ':'')+
      'Yearly charges increase by '+(C.esc*100).toFixed(1).replace(/\.0$/,'')+'% each year. Indicative running cost for '+C.H+' year'+(C.H>1?'s':'')+': '+
      (bas==='both'?'benchmark '+inr(B.recSum)+', Central Automation '+inr(C.recSum):(bas==='bench'?inr(B.recSum):inr(C.recSum)))+'.</p>';
  }
  var spec=[];
  if(C.nHw){spec=[['CPU',s.infra.cpu+' cores'],['RAM',s.infra.ram+' GB'],['Storage',s.infra.storageTb+' TB '+ST_NAME[s.infra.storageType]],['Redundancy',RAID_NAME[s.infra.redundancy]],
    ['GPU',C.gpuN?C.gpuN+' × '+gpuLabel(s):'None'],['Hosting',s.infra.mode==='onprem'?'On-premise':'Cloud'],['Environments',ENV_NAME[s.infra.env]],['Named users',String(s.users)],
    ['Delivery model',C.yearly?'Yearly support and deployment':'One-time setup']];}
  else spec=[['Named users',String(s.users)],['Delivery model',C.yearly?'Yearly support and deployment':'One-time setup']];
  var val='';
  if(q.showValue!==false&&C.val.rows.length){
    var vi=(s.value.items||[]);
    val='<h3>Value creation</h3><table><thead><tr><th>Benefit</th><th class="num">Per year</th><th class="num">One-time</th></tr></thead><tbody>'+
      vi.map(function(it,i){var a=C.val.rows[i]||0;return '<tr><td>'+esc(catName(it.cat))+'<small>'+esc((it.desc?it.desc+'. ':'')+num(+it.qty||0)+' '+(it.unit||'')+' × '+inr(+it.rate||0))+'</small></td>'+
        '<td class="num">'+(it.freq==='once'?'':inr(a))+'</td><td class="num">'+(it.freq==='once'?inr(a):'')+'</td></tr>';}).join('')+
      '<tr class="grand"><td class="num">Total value created</td><td class="num">'+inr(C.val.yearly)+'</td><td class="num">'+inr(C.val.once)+'</td></tr></tbody></table>'+
      '<p class="mut" style="margin:6px 0 0">Value over '+C.H+' year'+(C.H>1?'s':'')+': '+inr(C.val.total)+'.</p>';
  }
  var terms=[];
  if(bas==='both')terms.push('Benchmark is the price a software development company would charge. Central Automation is the cost to develop and deploy in-house. Saving = benchmark less Central Automation.');
  else if(bas==='bench')terms.push('Prices are benchmark prices of a software development company.');
  else terms.push('Prices are the cost to Central Automation to develop and deploy in-house.');
  terms.push('Delivery: '+s.days+' working days from requirement sign-off.');
  terms.push(C.yearly?'Yearly model: yearly support, change requests and deployment continue after go-live.':'One-time setup: build and deploy once. No yearly support is included.');
  if(vt)terms.push('This quotation is valid until '+fmtD(vt)+'.');
  terms.push(C.gstRate>0?'GST is included as shown.':'Prices are exclusive of applicable taxes.');
  String(q.terms||'').split('\n').forEach(function(t){t=t.trim();if(t)terms.push(t);});
  var words1=bas==='both'?'<p class="q-words">Benchmark: Rupees '+words(B.oneTotal)+' only.<br>Central Automation: Rupees '+words(C.oneTotal)+' only.<br>Saving: Rupees '+words(Math.abs(B.oneTotal-C.oneTotal))+' only.</p>'
    :'<p class="q-words">Rupees '+words(bas==='bench'?B.oneTotal:C.oneTotal)+' only.</p>';
  return '<div class="q-top"><div class="q-from"><h1>'+esc(q.from||'Central Automation')+'</h1><p class="mut">'+esc(q.fromAddr||'')+'</p></div>'+
    '<div class="q-meta"><h2>QUOTATION</h2><div>No. '+esc(q.no)+'</div><div>Date: '+esc(fmtD(vf)||q.date)+'</div>'+(vt?'<div>Valid until: '+esc(fmtD(vt))+'</div>':'')+
    (meta&&meta.stamp?'<div class="q-stamp">'+esc(meta.stamp)+'</div>':'')+'</div></div>'+
    ((q.to||q.toAddr)?'<div class="q-to"><span class="mut">To</span><br><b>'+esc(q.to||'')+'</b><p>'+esc(q.toAddr||'')+'</p></div>':'')+
    '<div class="q-subj">Project: '+esc(q.ref||s.name||'Software application')+'</div>'+
    '<h3>One-time price</h3><table><thead><tr><th style="width:36px">S.No</th><th>Description</th>'+heads()+'</tr></thead><tbody>'+rows+tot+'</tbody></table>'+
    words1+rec+val+
    '<h3>Technical specification</h3><div class="q-spec">'+spec.map(function(x){return '<div><span class="mut">'+esc(x[0])+'</span><span>'+esc(x[1])+'</span></div>';}).join('')+'</div>'+
    '<h3>Terms and conditions</h3><ol class="q-terms">'+terms.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ol>'+
    '<div class="q-sign"><span class="mut">'+(q.prepared?'Prepared by: '+esc(q.prepared):'')+'</span><div>Signed by HOD<br>'+esc(q.from||'Central Automation')+'</div></div>';
}

/* ================= sync + update ================= */
function sync(){
  $$('[data-path]').forEach(function(el){
    if(el===document.activeElement)return;
    var r=ref(el.dataset.path),v=get(r.o,r.p);
    if(el.type==='checkbox')el.checked=!!v;
    else{
      if(el.tagName==='SELECT'&&v!=null&&v!==''){
        var has=Array.prototype.some.call(el.options,function(o){return o.value===String(v);});
        if(!has){var op=document.createElement('option');op.value=String(v);op.textContent=String(v);el.appendChild(op);}
      }
      el.value=(v==null?'':v);
    }
    if(el.dataset.blank)el.placeholder=S.days;
  });
  var adm=isAdmin();
  $$('.f[data-fp]').forEach(function(w){var f=FIELDS[w.dataset.fp];if(f)w.hidden=(f.adm&&!adm)||(f.show?!f.show(S):false);});
  $$('.blk[data-need]').forEach(function(b){var k=b.dataset.need;b.hidden=k==='adv'?!(S.need.adv&&adm):(k==='gpu'?!S.need.gpu:(k==='amc'?!isYearly(S):S.need[k]===false));});
}
function update(){
  sync();
  LAST=calc2(S);
  renderSteps();
  paintStrip(LAST);
  LAST.rows.forEach(function(r,i){
    var a=$('[data-rowpd="'+i+'"]'),b=$('[data-rowcost="'+i+'"]');
    if(a)a.textContent=num(r.pd,1);
    if(b)b.textContent=inr(r.cost*(+S.complexity||1));
  });
  LAST.val.rows.forEach(function(a,i){var o=$('[data-valamt="'+i+'"]');if(o)o.textContent=inr(a);});
  var vn=$('#valNote');if(vn)vn.textContent=S.value.items.length?'Value created: '+inr(LAST.val.yearly)+' per year and '+inr(LAST.val.once)+' one-time.':'';
  var rn=$('#rateNote');if(rn)rn.textContent='Cost per person-day, Central Automation / benchmark: '+LEVELS.map(function(l){return l+' '+inr(S.rates[l]||0)+' / '+inr((S.ratesB||{})[l]||0);}).join(', ')+'. Complexity multiplies the total.';
  var ln=$('#licNote');if(ln&&!isAdmin())ln.textContent='';else if(ln){var d=S.lic;ln.textContent=dbLabel(S)+': '+inr(d.dbPrice)+' (CA) / '+inr(d.dbPriceB)+' (benchmark) per core, minimum '+d.dbMin+' cores, support '+d.dbSupport+'% per year. '+osLabel(S)+': '+inr(d.osPerServer)+' / '+inr(d.osPerServerB)+' per server.';}
  if(STEP==='review'){var rv=$('#revRes');if(rv)rv.innerHTML='<div class="res">'+(isAdmin()?resultsHTML(S,LAST):reviewHTML(S,LAST))+'</div>';}
  updateBanner();
  saveDraft();
  if(PVID==='draft')paintPrint();
}

/* ================= events: registration + generic fields ================= */
function onChange(e){
  var el=e.target,p=el.dataset&&el.dataset.path;
  if(!p)return;
  var f=FIELDS[p],rf=ref(p),v;
  if(el.type==='checkbox')v=el.checked;
  else if(el.tagName==='SELECT'){v=(f&&f.num)?parseFloat(el.value):el.value;}
  else if(el.type==='number'){
    if(el.value==='')v=el.dataset.blank?'':0;
    else{v=parseFloat(el.value);if(isNaN(v)||v<0)v=0;}
  }else v=el.value;
  put(rf.o,rf.p,v);
  if(f&&f.after&&f.type==='select')f.after(rf.o,v);
  if(/^team\.\d+\.role$/.test(p)){
    var rn=String(v).trim().toLowerCase(),mr=M.man.roles.filter(function(x){return x.role.toLowerCase()===rn;})[0];
    if(mr){S.team[+p.split('.')[1]].level=mr.level;}
  }
  if(/^value\.items\.\d+\.cat$/.test(p)){
    var vc=M.val.cats.filter(function(x){return x.id===v;})[0],vi=S.value.items[+p.split('.')[2]];
    if(vc){vi.unit=vc.unit;vi.rate=+vc.rate||0;}
  }
  if(rf.r==='s'){S.dirty=true;update();}
  else if(rf.r==='m'){var key=rf.p.split('.')[0];MDIRTY[key]=true;paintMasterSave();}
  else if(rf.r==='pv'){if(PVID==='draft')saveDraft();paintPrint(true);}
}
document.addEventListener('input',onChange);
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='catAdd'){
    var it=M.lic.items.filter(function(x){return x.id===t.value;})[0];
    if(it){S.other.push({name:it.name,cat:it.cat,type:it.type,cost:+it.cost||0,costB:+it.costB||0,qty:1});S.dirty=true;$('#otherWrap').innerHTML=otherHTML();update();}
    t.value='';return;
  }
  if(t.id==='regFY'){regFY=t.value;renderAppr();return;}
  if(t.id==='regView'){regView=t.value;renderAppr();return;}
  if(t.id==='pvSel'){selectPV(t.value);return;}
  if(t.id==='xlFile'){xlUpload(t.files);t.value='';return;}
  if(t.dataset&&t.dataset.path&&t.tagName==='SELECT')onChange(e);
});

/* ================= pages ================= */
var PAGE='reg',ADMIN_PAGES=['master','print','xl'];
/* Shows the pages this person may use. Admins see everything; others see Registration and their own entries. */
function paintNav(){
  var adm=isAdmin();
  $$('.pnav button').forEach(function(b){b.hidden=ADMIN_PAGES.indexOf(b.dataset.page)>=0&&!adm;});
  var ap=$('.pnav button[data-page="appr"]');if(ap)ap.textContent=adm?'Approval':'My entries';
}
/* Called when we learn whether the person is an admin: rebuilds everything that shows or hides costs */
function roleChanged(){
  paintNav();buildWizard();
  if(ADMIN_PAGES.indexOf(PAGE)>=0&&!isAdmin())gotoPage('reg');else update();
  renderAppr();
}
function gotoPage(id){
  if(ADMIN_PAGES.indexOf(id)>=0&&!isAdmin())id='reg';
  PAGE=id;
  $$('.page').forEach(function(p){p.classList.toggle('on',p.id==='p-'+id);});
  $$('.pnav button').forEach(function(b){if(b.dataset.page===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(id==='master')renderMaster();
  else if(id==='reg')update();
  else if(id==='appr')renderAppr();
  else if(id==='print')paintPrint();
  else if(id==='xl')renderXl();
  window.scrollTo({top:0});
}

/* ================= masters page ================= */
function mf(label,path,type,o){return fieldHTML(F(label,'m.'+path,type,o));}
function mf2(label,pC,pB,unit,hint){
  function one(cap,path){var f=F(label+' ('+cap+')','m.'+path,'number',{unit:unit});
    return '<label class="pi"><small>'+cap+'</small><span class="inp"><input type="number" min="0" step="any" inputmode="decimal" data-path="'+f.path+'" aria-label="'+esc(label+', '+cap)+'">'+(unit?'<i>'+esc(unit)+'</i>':'')+'</span></label>';}
  return '<div class="f dual"><span class="fl">'+esc(label)+'</span><div class="pair">'+one('Central Automation',pC)+one('Benchmark',pB)+'</div>'+(hint?'<small>'+esc(hint)+'</small>':'')+'</div>';
}
function mlist(path,cols,addLabel){
  var items=get(M,path);
  var rows=items.map(function(it,i){
    return '<tr>'+cols.map(function(c){
      var p='m.'+path+'.'+i+'.'+c.k;
      if(c.type==='select')return '<td><select data-path="'+p+'" aria-label="'+esc(c.label)+'">'+c.opts.map(function(o){return '<option value="'+o[0]+'">'+esc(o[1])+'</option>';}).join('')+'</select></td>';
      if(c.type==='number')return '<td><input type="number" min="0" step="any" inputmode="decimal" data-path="'+p+'" aria-label="'+esc(c.label)+'" style="width:'+(c.w||110)+'px"></td>';
      return '<td><input type="text" data-path="'+p+'" aria-label="'+esc(c.label)+'"'+(c.w?' style="width:'+c.w+'px"':'')+'></td>';
    }).join('')+'<td><button type="button" class="x" data-mdel="'+path+':'+i+'" aria-label="Remove">×</button></td></tr>';
  }).join('');
  return '<div class="tw"><table><thead><tr>'+cols.map(function(c){return '<th>'+esc(c.label)+'</th>';}).join('')+'<th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<button type="button" class="btn addrow" data-madd="'+path+'">'+esc(addLabel)+'</button>';
}
var MTABS=[['man','Manpower'],['hw','Hardware'],['sw','Software'],['lic','Licences'],['val','Value creation']];
function masterBody(k){
  var h='<p class="note" style="margin:0 0 10px">Every price has two entries: the <b>Central Automation</b> cost to develop and deploy in-house, and the <b>Benchmark</b> cost a software development company would charge. Values shown are assumed defaults until you save your own.</p>';
  if(k==='man'){
    h+='<h3 class="sub" style="margin-top:0">Cost per person-day by level</h3><div class="fields">'+LEVELS.map(function(l){return mf2(l,'man.rates.'+l,'man.ratesB.'+l,'₹ / day');}).join('')+'</div>'+
       '<h3 class="sub">Role catalogue</h3><p class="note" style="margin:0 0 8px">Roles suggested in the registration team table. Choosing one sets the level.</p>'+
       mlist('man.roles',[{k:'role',label:'Role',type:'text'},{k:'level',label:'Default level',type:'select',opts:lvlOpts}],'Add role');
  }else if(k==='hw'){
    h+='<h3 class="sub" style="margin-top:0">On-premise unit prices</h3><div class="fields">'+
      mf2('CPU per core','hw.onprem.cpu','hw.onpremB.cpu','₹')+mf2('RAM per GB','hw.onprem.ram','hw.onpremB.ram','₹')+mf2('HDD per TB','hw.onprem.hdd','hw.onpremB.hdd','₹')+
      mf2('SSD per TB','hw.onprem.ssd','hw.onpremB.ssd','₹')+mf2('NVMe per TB','hw.onprem.nvme','hw.onpremB.nvme','₹')+
      mf2('Yearly support and running cost','hw.onprem.opsPct','hw.onpremB.opsPct','% of hardware','Power, cooling, warranty extension, admin')+'</div>'+
      '<h3 class="sub">Cloud unit rates (per month)</h3><div class="fields">'+
      mf2('vCPU','hw.cloud.cpu','hw.cloudB.cpu','₹')+mf2('RAM per GB','hw.cloud.ram','hw.cloudB.ram','₹')+mf2('HDD per TB','hw.cloud.hdd','hw.cloudB.hdd','₹')+
      mf2('SSD per TB','hw.cloud.ssd','hw.cloudB.ssd','₹')+mf2('NVMe per TB','hw.cloud.nvme','hw.cloudB.nvme','₹')+'</div>'+
      '<h3 class="sub">Environment sizing factors (same for both)</h3><div class="fields">'+Object.keys(ENV_NAME).map(function(e){return mf(ENV_NAME[e],'hw.envF.'+e,'number',{unit:'×'});}).join('')+'</div>'+
      '<h3 class="sub">Redundancy factors (same for both)</h3><div class="fields">'+Object.keys(RAID_NAME).map(function(e){return mf(RAID_NAME[e],'hw.raidF.'+e,'number',{unit:'×'});}).join('')+'</div>'+
      '<h3 class="sub">GPU catalogue</h3>'+mlist('hw.gpus',[{k:'name',label:'GPU',type:'text'},{k:'price',label:'CA price ₹',type:'number'},{k:'priceB',label:'Benchmark price ₹',type:'number'},{k:'monthly',label:'CA rent ₹ / month',type:'number'},{k:'monthlyB',label:'Benchmark rent ₹ / month',type:'number'}],'Add GPU');
  }else if(k==='sw'){
    h+='<h3 class="sub" style="margin-top:0">Complexity multipliers (same for both)</h3><div class="fields">'+
      mf('Low','sw.complexity.low','number',{unit:'×'})+mf('Standard','sw.complexity.std','number',{unit:'×'})+mf('High','sw.complexity.high','number',{unit:'×'})+mf('Very high','sw.complexity.vhigh','number',{unit:'×'})+
      mf('Benchmark effort factor','sw.benchEffort','number',{unit:'× person-days',hint:'1 = a software company needs the same effort as the team entered'})+'</div>'+
      '<h3 class="sub">Default loadings</h3><div class="fields">'+
      mf2('Contingency','sw.load.cont','sw.loadB.cont','% of labour')+mf2('Overheads','sw.load.ovh','sw.loadB.ovh','% of labour')+mf2('Mark-up','sw.load.markup','sw.loadB.markup','% on development','The software company\'s margin sits in the benchmark')+
      mf('GST rate (same for both)','sw.load.gst','number',{unit:'%'})+mf('Add GST by default','sw.load.gstOn','check')+'</div>'+
      '<h3 class="sub">Default yearly support</h3><div class="fields">'+
      mf2('AMC rate','sw.amc.pct','sw.amc.pctB','% of dev cost / yr')+mf('Free warranty','sw.amc.warranty','number',{unit:'months'})+mf('Yearly escalation','sw.amc.esc','number',{unit:'% / year'})+
      mf('Years of ownership','sw.amc.years','number',{unit:'years'})+mf('Change-request days','sw.amc.crDays','number',{unit:'days / year'})+mf('Yearly deployment effort','sw.amc.deployDays','number',{unit:'days / year'})+'</div>'+
      '<h3 class="sub">Effort per scope item (cross-check)</h3><div class="fields">'+
      mf('Per screen / form','sw.scopeDays.screen','number',{unit:'days'})+mf('Per report / dashboard','sw.scopeDays.report','number',{unit:'days'})+mf('Per integration','sw.scopeDays.integ','number',{unit:'days'})+'</div>'+
      '<h3 class="sub">Quotation defaults</h3><div class="fields">'+
      mf('Company name','sw.quote.from','text')+mf('Valid for','sw.quote.valid','number',{unit:'days'})+mf('Address','sw.quote.fromAddr','area',{wide:true,rows:2})+
      mf('Terms and conditions','sw.quote.terms','area',{wide:true,rows:6,hint:'One term per line'})+'</div>';
  }else if(k==='val'){
    h='<p class="note" style="margin:0 0 10px">Benefits a project can create. Choosing one on the Value creation step fills in its unit and value per unit. These values are seen by everyone who registers projects.</p>'+
      '<h3 class="sub" style="margin-top:0">Value creation categories</h3>'+
      mlist('val.cats',[{k:'name',label:'Benefit',type:'text'},{k:'unit',label:'Unit',type:'text',w:90},{k:'rate',label:'₹ per unit',type:'number'}],'Add benefit');
  }else{
    h+='<h3 class="sub" style="margin-top:0">Database engines</h3>'+
      mlist('lic.db',[{k:'name',label:'Engine',type:'text'},{k:'price',label:'CA licence per core ₹',type:'number'},{k:'priceB',label:'Benchmark per core ₹',type:'number'},{k:'min',label:'Minimum cores',type:'number',w:90},{k:'support',label:'Support % / year',type:'number',w:90}],'Add database engine')+
      '<h3 class="sub">Operating systems</h3>'+mlist('lic.os',[{k:'name',label:'Operating system',type:'text'},{k:'price',label:'CA per server ₹',type:'number'},{k:'priceB',label:'Benchmark per server ₹',type:'number'}],'Add operating system')+
      '<h3 class="sub">Client access</h3><div class="fields">'+mf2('Client access licence per user','lic.calPerUser','lic.calPerUserB','₹ / user')+'</div>'+
      '<h3 class="sub">Catalogue of other licences and services</h3>'+
      mlist('lic.items',[{k:'name',label:'Item',type:'text'},{k:'cat',label:'Category',type:'select',opts:[['lic','Software / licence'],['svc','Service / other']]},{k:'type',label:'Billing',type:'select',opts:[['once','One-time'],['year','Every year']]},{k:'cost',label:'CA cost ₹',type:'number'},{k:'costB',label:'Benchmark cost ₹',type:'number'}],'Add item');
  }
  return h;
}
function renderMaster(){
  if(!isAdmin())return;
  $('#mtabs').innerHTML=MTABS.map(function(t){return '<button type="button" role="tab" data-mtab="'+t[0]+'" aria-selected="'+(t[0]===MTAB)+'">'+t[1]+'</button>';}).join('');
  $('#mbody').innerHTML=masterBody(MTAB)+
    '<div class="msave"><button type="button" class="btn primary" id="mSave">Save this master</button><span class="note" id="mStat" style="margin:0"></span></div>';
  sync();
  paintMasterSave();
}
function paintMasterSave(){
  var b=$('#mSave'),s=$('#mStat');if(!b)return;
  b.disabled=!MDIRTY[MTAB];
  if(s)s.textContent=MDIRTY[MTAB]?'You have unsaved changes.':(DBSTATE==='ready'?'Saved for everyone. New estimates use these values.':'Saved on this device only.');
}
async function saveMaster(key){
  var doc=clone(M[key]);
  if(DBSTATE==='ready'){
    try{await api('saveMaster',{key:key,doc:doc});MDIRTY[key]=false;paintMasterSave();toast('Master saved');onMasterChange(true);}
    catch(e){toast(e.message||'Could not save');}
  }else{
    doc.updated=new Date().toISOString();
    try{var all=JSON.parse(localStorage.getItem(MSTORE)||'{}');all[key]=doc;localStorage.setItem(MSTORE,JSON.stringify(all));}catch(e){}
    MDIRTY[key]=false;paintMasterSave();toast('Master saved on this device');onMasterChange(true);
  }
}
function onMasterChange(force){
  var sig=JSON.stringify(M);
  if(!force&&sig===masterSig)return;
  masterSig=sig;
  if(!S.dirty&&!editingId){S=newEstimate();}
  buildWizard();
  if(PAGE==='master'&&!MDIRTY[MTAB])renderMaster();
  update();
}

/* ================= server API, users, register ================= */
/* api/estimator.ashx keeps the masters and the register in SQL Server and knows who is
   signed in (the shared login). Only admins receive prices and costs. Without
   the server (page opened as a file, server or database down) the page works as a calculator
   for whoever opens it: masters and the current estimate stay in this browser. */
var API='api/estimator.ashx';
var ME={id:null,name:''},ISADMIN=false,DBSTATE='wait',DBERR='',regDocs=[],NAMES={},regSig='',lastSync=0;
var regFY='all',regView='all',APSEL=null,apSig='',apAdj='',apNote='',apCharged='';
function api(action,body){
  var o={method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{'X-Requested-With':'XMLHttpRequest'}};
  if(body){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body);}
  return fetch(API+'?action='+encodeURIComponent(action),o).then(function(r){
    var login=document.body.dataset.loginUrl;
    if(r.status===401&&login){location.href=login+'?returnUrl='+encodeURIComponent(location.pathname+location.search);return new Promise(function(){});}
    return r.json().catch(function(){return {};}).then(function(j){
      if(!r.ok||j.error){var e=new Error((j.error&&j.error.message)||('The server answered '+r.status+'.'));e.code=(j.error&&j.error.code)||('http_'+r.status);throw e;}
      return j;
    });
  });
}
/* Admins see costs. While the page is still connecting nobody counts as admin, so costs never flash up. */
function isAdmin(){return DBSTATE==='off'||(DBSTATE==='ready'&&ISADMIN);}
function isMe(id){return !!ME.id&&!!id&&String(id).toLowerCase()===String(ME.id).toLowerCase();}
function wfOf(d){return d.wf||'pending';}
function findReg(id){return regDocs.filter(function(x){return x._id===id;})[0];}
function nameOf(id){if(!id)return 'Someone';if(isMe(id))return 'you';var p=NAMES[id];return (p&&p.name)||id;}
function realName(id){if(!id)return '';var p=NAMES[id];return (p&&p.name)||id;}
function applyMe(me){me=me||{};ME={id:me.id||null,name:me.name||'',selfVerify:!!me.selfVerify};var was=ISADMIN;ISADMIN=!!me.isAdmin;return was!==ISADMIN;}
function applyMasters(doc){
  if(!doc)return;
  MKEYS.forEach(function(k){if(doc[k]&&!MDIRTY[k])mergeM(k,doc[k]);});
  onMasterChange();
}
function applyRegister(reg){
  reg=reg||{};
  var sig=JSON.stringify(reg);
  if(sig===regSig)return;
  regSig=sig;regDocs=reg.projects||[];NAMES=reg.names||{};
  renderAppr();fillPvSel();updateBanner();
  if(PAGE==='print')paintPrint();
}
function loadRegister(){
  if(DBSTATE!=='ready')return;
  api('projects').then(applyRegister,function(e){toast(e.message||'Could not refresh the register');});
}
function refreshAll(){
  if(DBSTATE!=='ready'||Date.now()-lastSync<15000)return;
  lastSync=Date.now();
  api('init').then(function(r){
    var changed=applyMe(r.me);applyMasters(r.masters);applyRegister(r.register);
    if(changed)roleChanged();else if(PAGE==='master'&&!MDIRTY[MTAB])renderMaster();
  },function(){});
}
function initDb(){
  if(location.protocol==='file:'){DBSTATE='off';DBERR='the page was opened as a file, not from the web server.';onMasterChange(true);roleChanged();return;}
  api('init').then(function(r){
    DBSTATE='ready';lastSync=Date.now();
    applyMe(r.me);applyMasters(r.masters);applyRegister(r.register);
    roleChanged();
    setInterval(function(){if(!document.hidden)loadRegister();},60000);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshAll();});
  }).catch(function(e){
    DBSTATE='off';DBERR=(e&&e.message)||'the page cannot reach the server.';
    onMasterChange(true);roleChanged();
  });
}
function updateBanner(){
  var el=$('#editBanner');if(!el)return;
  if(!editingId){el.innerHTML='';return;}
  var d=findReg(editingId)||{};
  var last=(d.log||[]).filter(function(l){return l.t==='info';}).pop();
  el.innerHTML='<div class="editbar"><b>Editing: '+esc(d.name||'entry')+'</b> ('+esc(WF[editingWf]||'')+')'+
    (last?'<br>Verifier note from '+esc(nameOf(last.by))+': '+esc(last.text):'')+
    '<br><button type="button" class="lnk" id="cancelEdit">Stop editing this entry</button></div>';
}
/* The estimate behind a register entry. An entry registered without costs is costed with the current masters. */
function stateOf(d){var st=hydrate(d.state||'{}');if(d.costed===false&&isAdmin())applyRates(st);return st;}
function savedState(st){var c=clone(st);c.reg.reply='';c.dirty=false;return JSON.stringify(c);}
/* Cost figures recorded in the register (admins only) and value creation (everyone) */
function figuresOf(st,R){
  var f={personDays:Math.round(R.pd*10)/10,team:R.headcount,valueYearly:Math.round(R.val.yearly),valueOnce:Math.round(R.val.once)};
  if(isAdmin())Object.assign(f,{value:Math.round(recordValue(st,R)),valueB:Math.round(baseValue(st.reg.kind,R.b)),charged:Math.round(+st.reg.charged||0),
    oneTime:Math.round(R.oneTotal),oneTimeB:Math.round(R.b.oneTotal),yearly:Math.round(R.steady.total),yearlyB:Math.round(R.b.steady.total)});
  return f;
}
function submitEntry(st,R,editId,reply){
  var r=st.reg;
  var entry=Object.assign({key:slug(st.name)+'_'+r.fy+'_'+r.kind,name:st.name||'',type:st.type,model:st.model,fy:r.fy,kind:r.kind,status:r.status,
    department:st.q.to||'',note:r.note||'',state:savedState(st)},figuresOf(st,R));
  return api('submitProject',{id:editId||'',entry:entry,reply:String(reply||'')});
}
async function saveReg(){
  if(DBSTATE!=='ready'){toast('The register is not available: '+DBERR);return;}
  if(!ME.id){toast('Sign in to submit entries');return;}
  if(!String(S.name||'').trim()){toast('Enter the project name in Basics');STEP='basics';update();return;}
  try{
    await submitEntry(S,LAST,editingId,S.reg.reply);
    editingId=null;editingWf='';S.reg.reply='';
    update();toast('Submitted for verification');loadRegister();
  }catch(e){toast(e.message||'Could not submit');}
}
async function verifyReg(id){
  var d=findReg(id);
  if(DBSTATE!=='ready'||!d)return;
  if(!isAdmin()){toast('Only admins can verify entries');return;}
  if(isMe(d.by)&&!ME.selfVerify){toast('Another admin needs to verify your entry');return;}
  var st=stateOf(d);
  if(apCharged!=='')st.reg.charged=Math.max(0,+apCharged||0);
  var R=calc2(st),costing=Object.assign(figuresOf(st,R),{state:savedState(st)});
  var adj=Math.round(+apAdj||0),note=apNote.trim();
  if(adj>0&&adj!==costing.value&&!note){toast('Add a comment explaining the adjusted value');return;}
  try{
    await api('verifyProject',{id:id,updated:d.updated||'',costing:costing,adjustedValue:adj,comment:note});
    apAdj='';apNote='';apCharged='';toast('Verified. Entry is final.');
  }catch(e){toast(e.message||'Could not verify');}
  loadRegister();
}
async function sendBack(id){
  var d=findReg(id),text=apNote.trim();
  if(DBSTATE!=='ready'||!d)return;
  if(!text){toast('Say what information is needed');return;}
  if(isMe(d.by)&&!ME.selfVerify){toast('Another admin needs to review your entry');return;}
  try{
    await api('sendBack',{id:id,updated:d.updated||'',comment:text});
    apAdj='';apNote='';apCharged='';toast('Sent back to the submitter');
  }catch(e){toast(e.message||'Could not send back');}
  loadRegister();
}
function editEntry(id){
  var d=findReg(id);
  if(!d||!d.state){toast('No saved estimate in this entry');return;}
  if(!isMe(d.by)||wfOf(d)==='verified'){toast('Only the submitter can edit an unverified entry');return;}
  S=hydrate(d.state);S.dirty=true;S.reg.reply='';
  editingId=id;editingWf=wfOf(d);
  buildWizard();STEP='basics';gotoPage('reg');
  toast('Edit and submit again');
}
function copyEntry(id){
  var d=findReg(id);
  if(!d||!d.state){toast('No saved estimate in this entry');return;}
  S=stateOf(d);S.dirty=true;S.reg.reply='';S.q.no='';S.q.date='';ensureQuote(S);
  editingId=null;editingWf='';
  buildWizard();STEP='basics';gotoPage('reg');
  toast('Loaded as a copy. Change the year or record type, then submit.');
}
function csvCell(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}
function download(blob,name){
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);
}
function exportReg(){
  var rows=regDocs.filter(function(d){return wfOf(d)==='verified';}).sort(function(a,b){return String(b.fy).localeCompare(String(a.fy))||String(a.name).localeCompare(String(b.name));});
  var head=['RegisterId','FinYear','Kind','DeliveryModel','Status','ProjectName','ProjectType','Department','ValueINR','BenchmarkValueINR','ChargedINR','OneTimeINR','BenchmarkOneTimeINR','YearlyRunINR','BenchmarkYearlyRunINR','PersonDays','TeamSize','ValueCreatedYearlyINR','ValueCreatedOneTimeINR','Note','SubmittedBy','VerifiedBy','VerifiedAt'];
  var lines=[head.join(',')].concat(rows.map(function(d){
    return [d._id,d.fy,d.kind,d.model||'',d.status,d.name,d.type,d.department,d.value,valB(d),d.charged,d.oneTime,d.oneTimeB!=null?d.oneTimeB:d.oneTime,d.yearly,d.yearlyB!=null?d.yearlyB:d.yearly,d.personDays,d.team,d.valueYearly,d.valueOnce,d.note,realName(d.by),realName(d.verifiedBy),d.verifiedAt].map(csvCell).join(',');
  }));
  download(new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),'project-register.csv');
  toast('CSV ready');
}
function actBtn(act,id,label,cls){return '<button type="button" class="lnk'+(cls?' '+cls:'')+'" data-act="'+act+'" data-id="'+esc(id)+'">'+label+'</button>';}
function wfLine(d){
  var w=wfOf(d),infos=(d.log||[]).filter(function(l){return l.t==='info';}),lastLog=(d.log||[])[(d.log||[]).length-1],line='';
  if(w==='verified')line='Verified by '+nameOf(d.verifiedBy)+(d.verifiedAt?', '+fmtDT(d.verifiedAt):'');
  else if(w==='info'){var li=infos[infos.length-1];line='Sent back by '+nameOf(li&&li.by)+': “'+(li?li.text:'')+'”';}
  else{line='Submitted by '+nameOf(d.by)+(d.at?', '+fmtDT(d.at):'');if(lastLog&&lastLog.t==='reply'&&lastLog.text)line+='. Reply: “'+lastLog.text+'”';}
  return line;
}
function wfTag(d){var w=wfOf(d);return '<span class="tag '+(w==='verified'?'ok':(w==='info'?'warn':'wait'))+'">'+esc(WF[w])+'</span>';}
function entryRow(d){
  var w=wfOf(d),mine=isMe(d.by),canReview=!!ME.id&&(!mine||ME.selfVerify)&&isAdmin();
  var dup=w!=='verified'&&regDocs.filter(function(x){return x.key&&x.key===d.key&&wfOf(x)!=='verified';}).length>1;
  var acts=actBtn('open',d._id,(w==='pending'&&canReview)?'Review':'Open',(w==='pending'&&canReview)?'ok':'');
  if(mine&&w!=='verified')acts+=actBtn('edit',d._id,'Edit')+actBtn('del',d._id,'Delete','del');
  var costs=d.costed===false?'Not costed yet: costed when an admin reviews it':'One-time '+short(+d.oneTime||0)+', yearly '+short(+d.yearly||0);
  return '<tr><td>'+esc(d.name||'')+(d.department?' <small style="color:var(--muted)">'+esc(d.department)+'</small>':'')+
    '<span class="sub2">'+esc(wfLine(d))+'</span>'+
    '<span class="sub2">'+(d.model==='once'?'One-time setup':'Yearly model')+'. '+costs+', '+num(+d.personDays||0,0)+' person-days, '+(+d.team||0)+' people, value created '+short(+d.valueYearly||0)+' / yr</span>'+
    (dup?'<span class="sub2" style="color:var(--warn)">Another open entry exists for this project, year and record type.</span>':'')+'</td>'+
    '<td>'+esc(d.fy||'')+'</td><td><span class="tag">'+esc(KIND[d.kind]||d.kind||'')+'</span></td><td>'+wfTag(d)+'</td>'+
    '<td class="num">'+(d.costed===false?'–':inr(+d.value||0))+'</td><td class="num">'+(d.costed===false?'–':inr(valB(d)))+'</td><td class="num">'+inr(+d.charged||0)+'</td><td style="white-space:nowrap">'+acts+'</td></tr>';
}
/* People who are not admins: their own entries, no costs */
function myRow(d){
  var w=wfOf(d),acts=actBtn('open',d._id,'Open');
  if(w!=='verified')acts+=actBtn('edit',d._id,'Edit')+actBtn('del',d._id,'Delete','del');
  return '<tr><td>'+esc(d.name||'')+(d.department?' <small style="color:var(--muted)">'+esc(d.department)+'</small>':'')+'<span class="sub2">'+esc(wfLine(d))+'</span></td>'+
    '<td>'+esc(d.fy||'')+'</td><td><span class="tag">'+esc(KIND[d.kind]||d.kind||'')+'</span></td><td>'+wfTag(d)+'</td>'+
    '<td class="num">'+num(+d.personDays||0,0)+'</td><td class="num">'+inr(+d.valueYearly||0)+'</td><td style="white-space:nowrap">'+acts+'</td></tr>';
}
function renderMine(){
  var h='<div class="reg-head"><h2 style="margin:0;font-size:24px;font-weight:600">My entries</h2></div>';
  if(!ME.id)return h+'<p class="empty">Sign in to see your entries.</p>';
  h+='<p class="note" style="margin:0 0 6px">Entries you have submitted. An admin works out the cost and verifies each one.</p>';
  var back=regDocs.filter(function(d){return wfOf(d)==='info';}).length;
  if(back)h+='<p class="alert warn"><b>'+back+' of your entr'+(back===1?'y needs':'ies need')+' more information.</b> Open the entry and tap Edit, fix it, then submit again.</p>';
  if(!regDocs.length)return h+'<p class="empty">Nothing submitted yet. Register a project on the Registration page.</p>';
  var vy=0,vo=0;regDocs.forEach(function(d){vy+=(+d.valueYearly||0);vo+=(+d.valueOnce||0);});
  h+='<div class="chips"><div class="chip"><b>'+regDocs.length+'</b><span>Entries</span></div><div class="chip"><b>'+short(vy)+'</b><span>Value created per year</span></div><div class="chip"><b>'+short(vo)+'</b><span>One-time value</span></div></div>';
  var rank={info:0,pending:1,verified:2};
  var rows=regDocs.slice().sort(function(a,b){return rank[wfOf(a)]-rank[wfOf(b)]||String(b.fy).localeCompare(String(a.fy));});
  return h+'<h3>Entries</h3><div class="tw"><table><thead><tr><th>Project</th><th>Year</th><th>Record</th><th>Verification</th><th class="num">Person-days</th><th class="num">Value / year</th><th></th></tr></thead><tbody>'+rows.map(myRow).join('')+'</tbody></table></div>';
}
function renderAppr(){
  var box=$('#apbox');if(!box)return;
  var h='';
  if(DBSTATE==='ready'&&!isAdmin()){box.innerHTML=renderMine();renderDetail();return;}
  h='<div class="reg-head"><h2 style="margin:0;font-size:24px;font-weight:600">Approval</h2>';
  if(DBSTATE==='ready'){
    var fys=[];regDocs.forEach(function(d){if(d.fy&&fys.indexOf(d.fy)<0)fys.push(d.fy);});
    fys.sort().reverse();
    if(regFY!=='all'&&fys.indexOf(regFY)<0)regFY='all';
    var views=[['all','All entries'],['pending','Awaiting verification'],['info','Needs information'],['verified','Verified'],['mine','My entries']];
    var ver=regDocs.filter(function(d){return wfOf(d)==='verified';});
    h+='<div class="ctl"><select id="regFY" aria-label="Financial year"><option value="all">All years</option>'+fys.map(function(f){return '<option value="'+esc(f)+'"'+(f===regFY?' selected':'')+'>FY '+esc(f)+'</option>';}).join('')+'</select>'+
       '<select id="regView" aria-label="Show entries">'+views.map(function(v){return '<option value="'+v[0]+'"'+(v[0]===regView?' selected':'')+'>'+v[1]+'</option>';}).join('')+'</select>'+
       '<button type="button" class="btn" id="regCsv"'+(ver.length?'':' disabled')+'>Export verified (CSV)</button></div></div>';
    h+='<p class="note" style="margin:0 0 6px">Totals count verified entries only. Anyone can submit; one verification by an admin who did not submit it makes an entry final.</p>';
    var back=ME.id?regDocs.filter(function(d){return wfOf(d)==='info'&&isMe(d.by);}).length:0;
    var wait=ME.id?regDocs.filter(function(d){return wfOf(d)==='pending'&&!isMe(d.by);}).length:0;
    if(back)h+='<p class="alert warn"><b>'+back+' of your entr'+(back===1?'y needs':'ies need')+' more information.</b> Open the entry and tap Edit, fix it, then submit again.</p>';
    if(wait)h+='<p class="alert"><b>'+wait+' entr'+(wait===1?'y is':'ies are')+' waiting for verification.</b></p>';
    var inFY=function(d){return regFY==='all'||d.fy===regFY;};
    var vrows=ver.filter(inFY),open=regDocs.filter(function(d){return inFY(d)&&wfOf(d)!=='verified';});
    if(!vrows.length){
      h+='<p class="empty">No verified projects'+(regFY==='all'?'':' for FY '+esc(regFY))+' yet.'+(regDocs.length?'':' Submit one from the Registration page.')+'</p>';
    }else{
      var tot=0,totB=0,ch=0,nv=0,mv=0,nn=0,pd=0,vy=0,vo=0;
      vrows.forEach(function(d){var v=+d.value||0;tot+=v;totB+=valB(d);ch+=(+d.charged||0);pd+=(+d.personDays||0);vy+=(+d.valueYearly||0);vo+=(+d.valueOnce||0);if(d.kind==='new'){nv+=v;nn++;}else mv+=v;});
      h+='<div class="hero row rk">'+
        bigKpi('build','Benchmark value of work delivered',totB,inr(totB)+' across '+vrows.length+' verified entr'+(vrows.length===1?'y':'ies')+', what a software company would charge')+
        bigKpi('run','Actual cost to Central Automation',tot,inr(tot)+' to develop and deploy in-house')+
        bigKpi('tco','Saved against benchmark',totB-tot,inr(totB-tot)+' ('+pctSave(tot,totB)+'%). Charged to departments: '+inr(ch))+'</div>';
      var openN=open.filter(function(d){return d.costed!==false;}),openV=0;openN.forEach(function(d){openV+=(+d.value||0);});
      h+='<div class="chips"><div class="chip"><b>'+nn+'</b><span>Verified new projects</span></div><div class="chip"><b>'+short(nv)+'</b><span>New project value</span></div>'+
         '<div class="chip"><b>'+short(mv)+'</b><span>Maintenance and enhancements (CA cost)</span></div><div class="chip"><b>'+num(pd,0)+'</b><span>Person-days recorded</span></div>'+
         '<div class="chip"><b>'+short(vy)+'</b><span>Value created per year</span></div><div class="chip"><b>'+short(vo)+'</b><span>One-time value created</span></div>'+
         '<div class="chip wide"><b>'+open.length+' entr'+(open.length===1?'y':'ies')+' · '+short(openV)+'</b><span>Not yet counted: awaiting verification or sent back'+(open.length>openN.length?' ('+(open.length-openN.length)+' not costed yet)':'')+'</span></div></div>';
      var by={};ver.forEach(function(d){var k=d.fy||'-';(by[k]=by[k]||{n:0,c:0,b:0,ch:0,v:0});var o=by[k];o.c+=(+d.value||0);o.b+=valB(d);o.ch+=(+d.charged||0);o.v+=(+d.valueYearly||0);if(d.kind==='new')o.n++;});
      h+='<h3>Year by year (verified)</h3><div class="tw"><table class="dual"><thead><tr><th>Financial year</th><th class="num">New projects</th><th class="num">Benchmark value</th><th class="num">CA cost</th><th class="num">Saving</th><th class="num">Charged</th><th class="num">Value created / yr</th></tr></thead><tbody>'+
        Object.keys(by).sort().reverse().map(function(k){var o=by[k];return '<tr><td>FY '+esc(k)+'</td><td class="num">'+o.n+'</td><td class="num">'+inr(o.b)+'</td><td class="num"><b>'+inr(o.c)+'</b></td><td class="num sv">'+sgn(o.b-o.c)+'</td><td class="num">'+inr(o.ch)+'</td><td class="num">'+inr(o.v)+'</td></tr>';}).join('')+'</tbody></table></div>';
    }
    var rows=regDocs.filter(function(d){
      if(!inFY(d))return false;
      if(regView==='all')return true;
      if(regView==='mine')return isMe(d.by);
      return wfOf(d)===regView;
    });
    var rank={info:0,pending:1,verified:2};
    rows.sort(function(a,b){return rank[wfOf(a)]-rank[wfOf(b)]||String(b.fy).localeCompare(String(a.fy))||(+b.value||0)-(+a.value||0);});
    if(rows.length)h+='<h3>Entries</h3><div class="tw"><table><thead><tr><th>Project</th><th>Year</th><th>Record</th><th>Verification</th><th class="num">CA cost</th><th class="num">Benchmark</th><th class="num">Charged</th><th></th></tr></thead><tbody>'+rows.map(entryRow).join('')+'</tbody></table></div>';
    else if(regDocs.length)h+='<p class="empty">No entries match this filter.</p>';
  }else if(DBSTATE==='wait'){
    h+='</div><p class="empty">Connecting to the register…</p>';
  }else{
    h+='</div><p class="empty">The register is not available: '+esc(DBERR||'the page cannot reach the server.')+' Masters and the current estimate are kept in this browser only.</p>';
  }
  box.innerHTML=h;
  renderDetail();
}
function renderDetail(){
  var el=$('#apdetail');if(!el)return;
  var d=APSEL?findReg(APSEL):null;
  if(!d){el.innerHTML='';apSig='';return;}
  var adm=isAdmin();
  var sig=[APSEL,d.updated,wfOf(d),(d.log||[]).length,ME.id,d.value,adm,JSON.stringify(NAMES).length,JSON.stringify(M).length].join('|');
  if(sig===apSig)return;
  apSig=sig;
  var w=wfOf(d),mine=isMe(d.by),canReview=adm&&!!ME.id&&(!mine||ME.selfVerify)&&w==='pending';
  var logTxt={submit:'Submitted',reply:'Replied',info:'Sent back',verify:'Verified'};
  var h='<div class="res detail"><div class="dh"><h2>'+esc(d.name||'')+'</h2><span><span class="tag">'+esc(KIND[d.kind]||'')+'</span> <span class="tag">FY '+esc(d.fy||'')+'</span> '+wfTag(d)+'</span></div>';
  if(adm)h+=d.costed===false?'<p class="alert">Submitted without costs. The figures below use the current masters and are recorded when you verify.</p>':
    '<p class="note" style="margin:0 0 6px">Recorded: Central Automation '+inr(+d.value||0)+(d.valueOriginal?' (adjusted from '+inr(d.valueOriginal)+')':'')+', benchmark '+inr(valB(d))+'. Charged '+inr(+d.charged||0)+(d.note?'. Note: '+esc(d.note):'')+'</p>';
  else if(d.note)h+='<p class="note" style="margin:0 0 6px">Note: '+esc(d.note)+'</p>';
  h+='<ol class="log">'+(d.log||[]).map(function(l){return '<li><b>'+esc(nameOf(l.by))+'</b> '+esc((logTxt[l.t]||l.t).toLowerCase())+(l.text?': '+esc(l.text):'')+' <span style="color:var(--muted)">'+esc(fmtDT(l.at))+'</span></li>';}).join('')+'</ol>';
  var st=null;
  if(d.state){st=stateOf(d);var R=calc2(st);h+=adm?resultsHTML(st,R):reviewHTML(st,R);}
  else if(!adm)h+='<div class="chips"><div class="chip"><b>'+num(+d.personDays||0,0)+'</b><span>Person-days</span></div><div class="chip"><b>'+short(+d.valueYearly||0)+'</b><span>Value created per year</span></div><div class="chip"><b>'+short(+d.valueOnce||0)+'</b><span>One-time value</span></div></div>';
  if(canReview){
    var chg=apCharged!==''?apCharged:String(st?(+st.reg.charged||0):(+d.charged||0));
    h+='<h3>Your decision</h3><div class="fields">'+
      '<label class="f"><span class="fl">Charged to user department</span><span class="inp"><input type="number" min="0" step="any" id="apCharged" inputmode="decimal" value="'+esc(chg)+'"><i>₹</i></span><small>0 when no charge is raised.</small></label>'+
      '<label class="f"><span class="fl">Adjust the recorded Central Automation cost (optional)</span><span class="inp"><input type="number" min="0" step="any" id="adjVal" inputmode="decimal" value="'+esc(apAdj)+'"><i>₹</i></span><small>Leave empty to accept the calculated value.</small></label>'+
      '<label class="f wide"><span class="fl">Comment</span><textarea id="apNote" rows="2">'+esc(apNote)+'</textarea><small>Required when you send back or adjust the value. The submitter can read it.</small></label></div>'+
      '<div class="actions"><button type="button" class="btn primary" data-act="verify" data-id="'+esc(d._id)+'">Verify: entry is final</button><button type="button" class="btn" data-act="sendback" data-id="'+esc(d._id)+'">Need more information</button></div>';
  }else{
    h+='<div class="actions">';
    if(mine&&w!=='verified')h+='<button type="button" class="btn primary" data-act="edit" data-id="'+esc(d._id)+'">Edit this entry</button>';
    if(adm&&d.state&&w==='verified')h+='<button type="button" class="btn primary" data-act="printit" data-id="'+esc(d._id)+'">Open for print</button>';
    if(d.state)h+='<button type="button" class="btn" data-act="copy" data-id="'+esc(d._id)+'">Use as a copy</button>';
    h+='</div>';
    if(!ME.id)h+='<p class="note">Sign in to verify or edit entries.</p>';
    else if(w==='pending'&&mine&&!ME.selfVerify)h+='<p class="note">'+(adm?'Another admin':'An admin')+' needs to verify your entry.</p>';
  }
  h+='<div class="actions"><button type="button" class="lnk" data-act="close" data-id="">Close</button></div></div>';
  el.innerHTML=h;
}

/* ================= estimate and print page (admins) ================= */
var PVID='draft',PVSTATE=null;
function PV(){return (PVID==='draft'||!PVSTATE)?S:PVSTATE;}
function pvStamp(){
  if(PVID==='draft')return 'DRAFT: not submitted';
  if(PVID.indexOf('up:')===0)return 'DRAFT: from Excel, not submitted';
  var d=findReg(PVID);
  if(!d)return '';
  return wfOf(d)==='verified'?'VERIFIED':'DRAFT: awaiting verification';
}
function fillPvSel(){
  var sel=$('#pvSel');if(!sel)return;
  var list=regDocs.filter(function(d){return d.state;}).sort(function(a,b){var ra=wfOf(a)==='verified'?0:1,rb=wfOf(b)==='verified'?0:1;return ra-rb||String(b.fy).localeCompare(String(a.fy))||String(a.name).localeCompare(String(b.name));});
  sel.innerHTML='<option value="draft">Current registration (unsaved draft)</option>'+
    UPL.map(function(u,i){return u.st?'<option value="up:'+i+'">'+esc('Excel: '+(u.st.name||u.file)+' ('+u.file+')')+'</option>':'';}).join('')+
    list.map(function(d){return '<option value="'+esc(d._id)+'">'+esc((d.name||'')+', FY '+d.fy+', '+(KIND[d.kind]||d.kind)+' ('+WF[wfOf(d)]+')')+'</option>';}).join('');
  if(PVID.indexOf('up:')===0?!UPL[+PVID.slice(3)]:(PVID!=='draft'&&!findReg(PVID))){PVID='draft';PVSTATE=null;}
  sel.value=PVID;
}
function selectPV(id){
  PVID=id;PVSTATE=null;
  if(id.indexOf('up:')===0){var u=UPL[+id.slice(3)];if(u&&u.st)PVSTATE=u.st;else PVID='draft';}
  else if(id!=='draft'){var d=findReg(id);if(d&&d.state){PVSTATE=stateOf(d);}else{PVID='draft';}}
  paintPrint();
}
function paintPrint(fromField){
  if(PAGE!=='print')return;
  var st=PV(),R=calc2(st);
  if(!fromField){
    fillPvSel();
    var box=$('#pvRes');if(box)box.innerHTML='<details class="meth" open style="border-top:0;margin-top:0"><summary>Check the estimate</summary><div class="res" style="margin-top:10px">'+resultsHTML(st,R)+'</div></details>';
  }
  $('#quote').innerHTML=quoteHTML(st,R,{stamp:pvStamp()});
  sync();
}
function doPrint(){
  if(PAGE!=='print'){gotoPage('print');}
  var old=document.title,st=PV();
  document.title='Quotation '+(st.q.no||'')+' '+(st.name||'');
  window.addEventListener('afterprint',function once(){document.title=old;window.removeEventListener('afterprint',once);});
  try{window.print();}catch(err){document.title=old;toast('Use your browser menu: Print, then Save as PDF');}
}

/* ================= Excel template and upload (admins) =================
   The team fills ONE sheet, one row per project, with no prices: the team is a head-count,
   value creation is up to three benefits with a quantity per year. An admin uploads the
   filled workbook and gets the costs at once, worked out with the current masters.
   The same sheet saved as CSV loads straight into SQL Server with
   database\05_import_projects_csv.sql, so keep the two column lists in step. */
var UPL=[];
var XL_YESNO=[['yes','Yes'],['no','No']];
var XL_CX=[['low','Low'],['std','Standard'],['high','High'],['vhigh','Very high']];
var XL_HINT='Required';   // the hint under "Project name"; that row is not a project
var XL_ROWS=100;          // empty rows prepared in the template
function pairs(o){return Object.keys(o).map(function(k){return [k,o[k]];});}
function norm(v){return String(v==null?'':v).trim().toLowerCase().replace(/\s+/g,' ');}
function unitLabel(u){return u==='INR'?'₹':u;}
function benefitOpts(){return M.val.cats.map(function(c){return [c.id,c.name+' ('+unitLabel(c.unit)+')'];});}
/* The columns: [heading, key, kind, choices]. Hints under the headings show what an empty cell means. */
function xlCols(){
  var L=function(a){return function(){return a;};};
  var cols=[
    ['Project name','name','text'],
    ['Department / client','q.to','text'],
    ['Prepared by','q.prepared','text'],
    ['Financial year','reg.fy','list',function(){return FY_OPTS.map(function(o){return [o[0],o[0]];});}],
    ['Record as','reg.kind','list',L(pairs(KIND))],
    ['Project status','reg.status','list',L(pairs(STAT))],
    ['Delivery model','model','list',L([['once','One-time setup'],['yearly','Yearly model (with support)']])],
    ['Project type','type','list',L(pairs(TYPE_NAME))],
    ['Duration (working days)','days','number'],
    ['Named users','users','number'],
    ['Complexity','complexity','list',L(XL_CX)],
    ['Team size (people)','team.people','number'],
    ['Team level','team.level','list',L(lvlOpts)],
    ['Needs servers','need.hw','yesno'],
    ['Hosting model','infra.mode','list',L([['onprem','On-premise'],['cloud','Cloud']])],
    ['Environments','infra.env','list',L(pairs(ENV_NAME))],
    ['CPU cores','infra.cpu','number'],
    ['RAM (GB)','infra.ram','number'],
    ['Storage (TB)','infra.storageTb','number'],
    ['GPU model','infra.gpuId','list',function(){return M.hw.gpus.map(function(g){return [g.id,g.name];});}],
    ['GPU count','infra.gpuCount','number'],
    ['Database engine','lic.dbId','list',function(){return M.lic.db.map(function(d){return [d.id,d.name];});}],
    ['Operating system','lic.osId','list',function(){return M.lic.os.map(function(o){return [o.id,o.name];});}],
    ['Years of ownership','amc.years','number']
  ];
  [1,2,3].forEach(function(n){cols.push(['Benefit '+n,'val.'+n+'.cat','list',benefitOpts],['Benefit '+n+' per year','val.'+n+'.qty','number']);});
  cols.push(['One-time value (₹)','val.once','number'],['Note','reg.note','text']);
  return cols;
}
function xlHint(c,d0){
  var k=c[1],o=c[3]?c[3]():null,lab=function(code){var h=(o||[]).filter(function(x){return x[0]===code;})[0];return h?h[1]:'';};
  var hints={name:XL_HINT,'q.prepared':'Your name','reg.fy':'Empty = this year','team.people':'Empty = no manpower','team.level':'Empty = Mid',
    'need.hw':'Empty = Yes','infra.gpuId':'Only for AI / vision','infra.gpuCount':'Empty = 1 if a GPU model is chosen','val.once':'₹, if any','reg.note':''};
  if(k in hints)return hints[k];
  if(/^val\.\d\.cat$/.test(k))return 'Choose a benefit';
  if(/^val\.\d\.qty$/.test(k))return 'Quantity per year, in the unit shown';
  if(k==='complexity')return 'Empty = Standard';
  if(c[2]==='list')return 'Empty = '+lab(get(d0,k));
  if(c[2]==='number')return 'Empty = '+num(+get(d0,k)||0);
  return '';
}
function xlTemplate(){
  var X=window.XlsxLite,st=X.style,cols=xlCols(),d0=newEstimate(),lists=[],n=XL_ROWS+2;
  var head=cols.map(function(c){return {v:c[0],s:st.head};});
  var hint=cols.map(function(c){return {v:xlHint(c,d0),s:st.note};});
  var rows=[head,hint];
  for(var r=3;r<=n;r++)rows.push(cols.map(function(c){return {v:'',s:c[2]==='number'?st.inputNum:st.input};}));
  var dv=[];
  cols.forEach(function(c,i){
    if(c[2]!=='list'&&c[2]!=='yesno')return;
    var vals=c[2]==='yesno'?['Yes','No']:c[3]().map(function(x){return x[1];}),key=c[2]==='yesno'?'yesno':c[1].replace(/^val\.\d/,'val');
    var l=lists.filter(function(x){return x.key===key;})[0];
    if(!l){l={key:key,vals:vals,col:X.colName(lists.length)};lists.push(l);}
    var col=X.colName(i);
    dv.push({ref:col+'3:'+col+n,list:'Lists!$'+l.col+'$2:$'+l.col+'$'+Math.max(2,vals.length+1)});
  });
  var lrows=[lists.map(function(l){return l.key;})];
  lists.forEach(function(l,c){l.vals.forEach(function(v,i){(lrows[i+1]=lrows[i+1]||[])[c]=v;});});
  var widths=cols.map(function(c){return c[1]==='name'?32:(c[2]==='list'?24:(c[2]==='number'?14:22));});
  return X.write([
    {name:'Projects',rows:rows,cols:widths,freeze:2,freezeCols:1,validations:dv,active:true},
    {name:'Lists',hidden:true,rows:lrows}
  ]);
}

/* ---------- reading a filled sheet ---------- */
function xlPick(o,v){
  var n=norm(v).replace(/^fy /,'');
  var h=o.filter(function(x){var l=norm(x[1]);return l===n||norm(x[0])===n||l.replace(/^fy /,'')===n||l.replace(/\s*\(.*\)$/,'')===n;})[0];
  return h?h[0]:null;
}
function xlNum(v){if(v==null||String(v).trim()==='')return null;var n=typeof v==='number'?v:parseFloat(String(v).replace(/[,₹\s]/g,''));return isFinite(n)&&n>=0?n:NaN;}
/* book (from XlsxLite.read) -> [{file, line, st, warn} or {file, line, error}], one per project row */
function xlParse(book,file){
  var cols=xlCols(),rows=null;
  book.names.some(function(nm){var r=book.sheets[nm]||[];if(r[0]&&norm(r[0][0])==='project name'){rows=r;return true;}return false;});
  if(!rows)throw new Error('Not the estimate template: no sheet starts with a "Project name" column.');
  var at={};rows[0].forEach(function(h,i){if(h!=null)at[norm(h)]=i;});
  var missing=cols.filter(function(c){return !(norm(c[0]) in at);}).map(function(c){return c[0];});
  if(missing.indexOf('Project name')>=0)throw new Error('The "Project name" column is missing.');
  var out=[];
  for(var r=1;r<rows.length;r++){
    var row=rows[r]||[],cell=function(c){var i=at[norm(c[0])];return i==null?null:row[i];};
    var filled=cols.some(function(c){var v=cell(c);return v!=null&&String(v).trim()!=='';});
    if(!filled||norm(cell(cols[0]))===norm(XL_HINT))continue;
    var label=file+', line '+(r+1);
    if(cell(cols[0])==null||String(cell(cols[0])).trim()===''){out.push({file:label,error:'Project name is empty.'});continue;}
    out.push(xlProject(cols,cell,label,missing));
  }
  if(!out.length)throw new Error('No projects found: fill one row per project under the headings.');
  return out;
}
function xlProject(cols,cell,label,missing){
  var s=newEstimate(),warn=[],x={};
  if(missing.length)warn.push('Columns not found, defaults used: '+missing.join(', ')+'.');
  cols.forEach(function(c){
    var v=cell(c),key=c[1];
    if(v==null||String(v).trim()==='')return;
    if(c[2]==='text'){put(s,key,String(v).trim());return;}
    if(c[2]==='number'){
      var n=xlNum(v);
      if(isNaN(n)){warn.push(c[0]+': "'+v+'" is not a number.');x[key+'.bad']=true;return;}
      if(key==='team.people'||key.indexOf('val.')===0||key==='infra.gpuCount')x[key]=n;
      if(key.indexOf('team.')!==0&&key.indexOf('val.')!==0)put(s,key,n);
      return;
    }
    var code=xlPick(c[2]==='yesno'?XL_YESNO:c[3](),v);
    if(code==null){warn.push(c[0]+': "'+v+'" is not one of the choices.');return;}
    if(c[2]==='yesno')put(s,key,code==='yes');
    else if(key==='complexity')s.complexity=+M.sw.complexity[code]||1;
    else if(key==='infra.gpuId'){setGpu(s,gpuById(code));x.gpu=true;}
    else if(key==='lic.dbId')setDb(s,dbById(code));
    else if(key==='lic.osId')setOs(s,osById(code));
    else if(key==='team.level'||key.indexOf('val.')===0)x[key]=code;
    else put(s,key,code);
  });
  s.need.amc=s.model==='yearly';
  s.need.gpu=x['infra.gpuCount']>0||(!!x.gpu&&x['infra.gpuCount']==null);
  var people=x['team.people'];
  s.team=people>0?[{role:'Team',level:x['team.level']||'Mid',people:people,days:'',alloc:100}]:[];
  s.need.man=people>0;
  if(people==null&&!x['team.people.bad'])warn.push('Team size is empty, so there is no manpower cost.');
  s.other=[];
  s.value.items=[];
  [1,2,3].forEach(function(k){
    var cid=x['val.'+k+'.cat'],qty=x['val.'+k+'.qty'],cat=M.val.cats.filter(function(c){return c.id===cid;})[0];
    if(cat&&qty>0)s.value.items.push({cat:cat.id,desc:'',qty:qty,unit:cat.unit,rate:+cat.rate||0,freq:'year'});
    else if(cat&&qty==null)warn.push('Benefit '+k+': quantity per year is empty.');
    else if(!cat&&qty>0)warn.push('Benefit '+k+' per year is filled but no benefit is chosen.');
  });
  if(x['val.once']>0){var oth=M.val.cats.filter(function(c){return c.id==='other';})[0];
    s.value.items.push({cat:oth?oth.id:'',desc:'One-time value',qty:1,unit:'INR',rate:x['val.once'],freq:'once'});}
  if(!s.reg.note)s.reg.note='From Excel'+(s.q.prepared?', prepared by '+s.q.prepared:'');
  return {file:label,st:s,warn:warn};
}

/* ---------- the Excel page ---------- */
function xlUpload(files){
  var list=Array.prototype.slice.call(files||[]);if(!list.length)return;
  toast('Reading '+list.length+' workbook'+(list.length>1?'s':'')+'…');
  Promise.all(list.map(function(f){
    return f.arrayBuffer().then(window.XlsxLite.read).then(function(book){return xlParse(book,f.name);})
      .catch(function(e){return [{file:f.name,error:(e&&e.message)||'Could not read this file.'}];});
  })).then(function(res){
    var rows=[].concat.apply([],res);
    UPL=UPL.concat(rows);renderXl();fillPvSel();
    var ok=rows.filter(function(u){return u.st;}).length;
    toast(ok+' project'+(ok===1?'':'s')+' read'+(rows.length>ok?', '+(rows.length-ok)+' with problems':''));
  });
}
function xlRow(u,i){
  if(!u.st)return '<tr><td>'+esc(u.file)+'</td><td colspan="7"><span class="tag warn">Not read</span> '+esc(u.error)+'</td><td>'+actBtn('xl-remove',String(i),'Remove','del')+'</td></tr>';
  var s=u.st,R=calc2(s),B=R.b;
  var warn=u.warn.length?'<span class="sub2" style="color:var(--warn)">'+u.warn.slice(0,4).map(esc).join('<br>')+(u.warn.length>4?'<br>and '+(u.warn.length-4)+' more':'')+'</span>':'<span class="sub2" style="color:var(--ok)">All answers read</span>';
  var acts=actBtn('xl-open',String(i),'Open')+actBtn('xl-print',String(i),'Print')+(u.submitted?'<span class="tag ok">Submitted</span>':actBtn('xl-submit',String(i),'Submit','ok'))+actBtn('xl-remove',String(i),'Remove','del');
  return '<tr><td>'+esc(u.file)+'</td><td>'+esc(s.name)+'<span class="sub2">'+esc([s.q.to,s.q.prepared?'by '+s.q.prepared:'','FY '+s.reg.fy,KIND[s.reg.kind],R.headcount?R.headcount+' people':''].filter(Boolean).join(' · '))+'</span>'+warn+'</td>'+
    '<td class="num">'+inr(R.oneTotal)+'</td><td class="num">'+inr(R.steady.total)+'</td><td class="num">'+inr(R.tco)+'</td><td class="num">'+inr(B.tco)+'</td>'+
    '<td class="num">'+inr(R.val.yearly)+'</td><td class="num">'+years(R.val.payback)+'</td><td style="white-space:nowrap">'+acts+'</td></tr>';
}
function renderXl(){
  var box=$('#xlbox');if(!box||!isAdmin())return;
  var h='<h2 class="pt">Excel upload</h2><p class="lead">Give your team the template: one sheet, one row per project, no prices. They fill the project, a team head-count, the server size and up to three benefits. Upload the filled workbook here: the cost of every project is worked out at once with the current masters.</p>'+
    '<div class="actions"><button type="button" class="btn" id="xlTpl">Download blank template</button>'+
    '<label class="btn primary" for="xlFile" style="display:inline-flex;align-items:center">Upload filled workbooks</label>'+
    '<input type="file" id="xlFile" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple hidden></div>'+
    '<p class="note">One workbook can hold many projects, and you can upload several workbooks at once. The drop-down lists come from the masters, so download a fresh template after changing them. The same sheet saved as CSV can also be loaded straight into SQL Server (database\\05_import_projects_csv.sql).</p>';
  if(UPL.length){
    h+='<h3 class="sub">Uploaded projects</h3><div class="tw"><table class="dual"><thead><tr><th>File and line</th><th>Project and checks</th><th class="num">One-time (CA)</th><th class="num">Per year (CA)</th><th class="num">Total cost (CA)</th><th class="num">Total benchmark</th><th class="num">Value / year</th><th class="num">Payback</th><th></th></tr></thead><tbody>'+
      UPL.map(xlRow).join('')+'</tbody></table></div>'+
      '<p class="note">Totals are over each project\'s years of ownership. Open a project to see the full breakdown, change anything (for example split the team into roles), or submit it from Registration.</p>'+
      '<div class="actions"><button type="button" class="btn primary" id="xlSummary">Download cost summary (Excel)</button><button type="button" class="btn" id="xlSubmitAll">Submit all to the register</button><button type="button" class="btn" id="xlClear">Clear the list</button></div>';
  }
  box.innerHTML=h;
}
function xlSummary(){
  var X=window.XlsxLite,st=X.style;
  var head=['File and line','Project','Department / client','Prepared by','Financial year','Record as','Delivery model','Person-days','People','One-time CA ₹','One-time benchmark ₹','Yearly CA ₹','Yearly benchmark ₹','Years','Total cost CA ₹','Total benchmark ₹','Saving vs benchmark ₹','Value created per year ₹','One-time value ₹','Value over the years ₹','Return on cost %','Payback (years)','Checks'];
  var rows=[head.map(function(h){return {v:h,s:st.head};})];
  UPL.forEach(function(u){
    if(!u.st)return;
    var s=u.st,R=calc2(s),B=R.b,r=Math.round;
    rows.push([u.file,s.name,s.q.to,s.q.prepared,s.reg.fy,KIND[s.reg.kind],s.model==='once'?'One-time setup':'Yearly model',r(R.pd),R.headcount,r(R.oneTotal),r(B.oneTotal),r(R.steady.total),r(B.steady.total),R.H,
      r(R.tco),r(B.tco),r(B.tco-R.tco),r(R.val.yearly),r(R.val.once),r(R.val.total),R.val.roi==null?'':r(R.val.roi*100),R.val.payback==null?'':Math.round(R.val.payback*10)/10,u.warn.join(' ')]
      .map(function(v,i){return {v:v,s:typeof v==='number'&&i>=9&&i!==13?st.calc:0};}));
  });
  download(X.write([{name:'Cost summary',rows:rows,freeze:1,cols:[28,30,22,18,10,16,16,11,8,15,15,15,15,7,15,15,15,15,15,15,10,10,60]}]),'cost-summary.xlsx');
}
async function xlSubmit(list){
  if(DBSTATE!=='ready'){toast('The register is not available: '+DBERR);return;}
  if(!ME.id){toast('Sign in to submit entries');return;}
  var done=0,fail='';
  for(var k=0;k<list.length;k++){
    var u=UPL[list[k]];if(!u||!u.st||u.submitted)continue;
    try{await submitEntry(u.st,calc2(u.st),'','');u.submitted=true;done++;}catch(e){fail=u.file+': '+(e.message||'could not submit');}
  }
  renderXl();loadRegister();
  toast(fail||('Submitted '+done+' entr'+(done===1?'y':'ies')+' for verification'));
}

/* ================= click handling ================= */
document.addEventListener('click',function(e){
  var t=e.target;if(!t||!t.dataset)return;
  var id=t.id;
  if(t.dataset.page){gotoPage(t.dataset.page);return;}
  if(t.dataset.step){
    if(t.dataset.step!=='basics'&&!String(S.name||'').trim()){toast('Enter the project name first');return;}
    STEP=t.dataset.step;update();return;
  }
  if(t.dataset.mtab){MTAB=t.dataset.mtab;renderMaster();return;}
  if(id==='stNext'){goStep(1);return;}
  if(id==='stBack'){goStep(-1);return;}
  if(id==='saveReg'){saveReg();return;}
  if(id==='copySum'){
    var txt=summaryText(S,LAST);
    function fb(){var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Summary copied');}catch(x){toast('Copy not available');}document.body.removeChild(ta);}
    try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){toast('Summary copied');},fb);else fb();}catch(x){fb();}
    return;
  }
  if(id==='resetDraft'){
    if(t.dataset.armed){S=newEstimate();editingId=null;editingWf='';STEP='basics';buildWizard();update();toast('Started a new estimate');}
    else{t.dataset.armed='1';t.textContent='Tap again to start over';setTimeout(function(){if(t.isConnected){delete t.dataset.armed;t.textContent='Start a new estimate';}},2500);}
    return;
  }
  if(id==='cancelEdit'){editingId=null;editingWf='';S.reg.reply='';update();return;}
  if(id==='mSave'){saveMaster(MTAB);return;}
  if(id==='regCsv'){exportReg();return;}
  if(id==='xlTpl'){try{download(xlTemplate(),'estimate-template.xlsx');toast('Template ready');}catch(x){toast('Could not make the template');}return;}
  if(id==='xlSummary'){xlSummary();toast('Cost summary ready');return;}
  if(id==='xlSubmitAll'){xlSubmit(UPL.map(function(u,i){return i;}));return;}
  if(id==='xlClear'){UPL=[];if(PVID.indexOf('up:')===0){PVID='draft';PVSTATE=null;}renderXl();fillPvSel();return;}
  if(id==='printBtn'){doPrint();return;}
  if(t.dataset.add==='team'){S.team.push({role:'',level:'Mid',people:1,days:'',alloc:100});S.dirty=true;$('#teamWrap').innerHTML=teamHTML();update();return;}
  if(t.dataset.add==='other'){S.other.push({name:'New item',cat:'lic',type:'once',cost:0,costB:0,qty:1});S.dirty=true;$('#otherWrap').innerHTML=otherHTML();update();return;}
  if(t.dataset.add==='val'){S.value.items.push({cat:'',desc:'',qty:0,unit:'',rate:0,freq:'year'});S.dirty=true;$('#valWrap').innerHTML=valueHTML();update();return;}
  if(t.dataset.del){
    var a=t.dataset.del.split(':'),i=+a[1];
    (a[0]==='val'?S.value.items:S[a[0]]).splice(i,1);S.dirty=true;
    if(a[0]==='team')$('#teamWrap').innerHTML=teamHTML();else if(a[0]==='val')$('#valWrap').innerHTML=valueHTML();else $('#otherWrap').innerHTML=otherHTML();
    update();return;
  }
  if(t.dataset.madd){
    var path=t.dataset.madd,lst=get(M,path),key=path.split('.')[0],nu;
    if(path==='man.roles')nu={role:'New role',level:'Mid'};
    else if(path==='hw.gpus')nu={id:uid(),name:'New GPU',price:0,priceB:0,monthly:0,monthlyB:0};
    else if(path==='lic.db')nu={id:uid(),name:'New database',price:0,priceB:0,min:0,support:0};
    else if(path==='lic.os')nu={id:uid(),name:'New operating system',price:0,priceB:0};
    else if(path==='val.cats')nu={id:uid(),name:'New benefit',unit:'INR',rate:1};
    else nu={id:uid(),name:'New item',cat:'lic',type:'once',cost:0,costB:0};
    lst.push(nu);MDIRTY[key]=true;renderMaster();return;
  }
  if(t.dataset.mdel){
    var b=t.dataset.mdel.split(':'),lp=b[0],ix=+b[1];
    get(M,lp).splice(ix,1);MDIRTY[lp.split('.')[0]]=true;renderMaster();return;
  }
  var act=t.dataset.act,rid=t.dataset.id;
  if(!act)return;
  if(act==='open'){APSEL=rid;apSig='';apAdj='';apNote='';apCharged='';renderDetail();var dt=$('#apdetail');if(dt)dt.scrollIntoView({block:'start'});}
  else if(act==='close'){APSEL=null;apSig='';renderDetail();}
  else if(act==='verify')verifyReg(rid);
  else if(act==='sendback')sendBack(rid);
  else if(act==='edit')editEntry(rid);
  else if(act==='copy')copyEntry(rid);
  else if(act==='printit'){PVID=rid;var dd=findReg(rid);PVSTATE=dd&&dd.state?stateOf(dd):null;if(!PVSTATE)PVID='draft';gotoPage('print');}
  else if(act==='xl-open'){var u=UPL[+rid];if(u&&u.st){S=clone(u.st);S.dirty=true;editingId=null;editingWf='';buildWizard();STEP='review';gotoPage('reg');toast('Loaded from Excel. Change anything, then submit.');}}
  else if(act==='xl-print'){PVID='up:'+rid;PVSTATE=(UPL[+rid]||{}).st||null;if(!PVSTATE)PVID='draft';gotoPage('print');}
  else if(act==='xl-submit')xlSubmit([+rid]);
  else if(act==='xl-remove'){UPL.splice(+rid,1);if(PVID.indexOf('up:')===0){PVID='draft';PVSTATE=null;}renderXl();fillPvSel();}
  else if(act==='del'){
    if(t.dataset.armed){
      var d=findReg(rid);
      if(d&&wfOf(d)==='verified'){toast('Verified entries cannot be deleted');return;}
      if(APSEL===rid){APSEL=null;apSig='';}
      api('deleteProject',{id:rid}).then(function(){toast('Deleted');loadRegister();},function(e){toast(e.message||'Could not delete');});
    }else{t.dataset.armed='1';t.textContent='Tap again';setTimeout(function(){if(t.isConnected){delete t.dataset.armed;t.textContent='Delete';}},2500);}
  }
});
document.addEventListener('input',function(e){
  if(e.target.id==='adjVal')apAdj=e.target.value;
  else if(e.target.id==='apCharged')apCharged=e.target.value;
  else if(e.target.id==='apNote')apNote=e.target.value;
});

/* ================= theme + start ================= */
var THEME_KEY='ca-estimator.theme';
function setTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  $$('[data-theme-set]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.themeSet===t));});
  try{localStorage.setItem(THEME_KEY,t);}catch(e){}
}
$('.seg').addEventListener('click',function(e){var b=e.target.closest('[data-theme-set]');if(b)setTheme(b.dataset.themeSet);});
var t0='light';try{t0=localStorage.getItem(THEME_KEY)||'light';}catch(e){}
setTheme(t0);

masterSig=JSON.stringify(M);
$('#pvForm').innerHTML=fieldsHTML(P_QUOTE);
paintNav();
buildWizard();
gotoPage('reg');
fillPvSel();
initDb();
})();
