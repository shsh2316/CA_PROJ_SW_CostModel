/* Dashboard visual slides (project_dashboard.aspx): five infographic slides in front of the data slides, made to be shown in a meeting
   or downloaded as a picture for a presentation: Working principle, Benefits at a glance, Money, FTE, Productivity.
   Money and project counts come from the register (they follow the dashboard's choice of projects); the stated figures
   (TAT examples, task reductions, output, potential) are the "highlights" that admins edit on the page (api: highlights / saveHighlights).
   DEFAULTS is the example shown until the first save. Icons are drawn here as inline SVG; photos are files in assets/img. */
window.CADashVisual=(function(){
'use strict';

var HOURS_PER_FTE=2740;
var PHOTOS=['','plant.jpg','furnace.jpg','ladle.jpg','converter.jpg','slab.jpg','mill.jpg'];

/* ---------- the example highlights (shown until an admin saves their own) ---------- */
var DEFAULTS={
  look:{eyebrow:'Central Automation – Level 2',photo1:'furnace.jpg',photo2:'plant.jpg',photo3:'ladle.jpg',photo4:'converter.jpg',photo5:'slab.jpg'},
  principle:{title:'Working principle',titleEm:'of the department',
    subtitle:'From OEM Level-2 data to in-house digitization and development, enabling smarter decisions, higher productivity, lower TAT and reduced FTE',
    oemPct:30,inhousePct:70,
    c1Title:'Level 2 OEM system',c1Sub:'Data source',c1Text:'OEM systems generate raw process and heat-cycle data from Level-2 systems.',
    c1Items:['Process & heat data','Equipment status & alarms','Process parameters','Events & logs'],
    c2Title:'In-house digitization & development',c2Sub:'Build, integrate, analyse',
    c2Text:'We build in-house solutions to acquire, process, store, analyse and model the raw data to create meaningful, reliable and actionable information.',
    c2Steps:['Data acquisition','Data processing','Analytics & modelling','In-house development'],
    c2Items:['Centralized data platform','Advanced analytics','Decision support tools','Customized applications'],
    c3Title:'Decision making software & tools',c3Sub:'Business impact',
    c3Text:'In-house developed dashboards, analytics and tools provide real-time insights and actionable information for operations, maintenance and management.',
    c3Tools:['Operations dashboard','Heat tracking & analysis','Performance monitoring','Alerts & recommendations'],
    impact:[{icon:'chart',big:'Higher productivity',text:'More heats with the same resources'},{icon:'clock',big:'Improved TAT',text:'Faster decision making and response'},
      {icon:'people',big:'Reduced FTE',text:'Automation and self-service tools'},{icon:'gear',big:'25.6 h',text:'Potential furnace time freed (~15 more heats) by closing the gap to the median cycle time'}],
    strip1:'OEM Level-2 system (raw data)',strip2:'In-house digitization, development and analytics',
    chips:['Higher productivity','Lower TAT','Reduced FTE','Actionable insights']},
  glance:{title:'Benefits at a glance:',titleEm:'money, FTE, TAT and productivity',tatBig:'Minutes instead of days',tatText:'across key processes',
    footer:'In-house digitization and development is delivering tangible savings, faster processes and higher productivity across operations, maintenance and management.',
    chips:['Lower cost','Faster TAT','Optimized FTE','Higher productivity']},
  money:{subtitle:'Cost over 3 years: in-house against a software company',
    gains:[{icon:'factory',big:'₹615 / ton',text:'Lower cost of production, Hazira (C-MARVEL)'},{icon:'truck',big:'30% lower',text:'Demurrage, with real-time visibility (Stowage Plan)'}],
    footer:'In-house digitization and development is delivering significant cost avoidance, driven by higher productivity, better quality, improved reliability and optimised operations.',
    chips:['Lower cost','Better quality','Higher reliability']},
  fte:{title:'FTE:',titleEm:'Working time saved',subtitle:'Automation and in-house tools significantly reduce manual effort across key processes',
    hours:600,hoursNote:'36,000 minutes a year of shipment assessment (600 h at 2,740 h per FTE). Plus the other initiatives listed.',
    tasks:[{icon:'doc',project:'Slab Qualification',task:'Non-prime slab identification',before:'7 man-days',after:'1 man-day',pct:85.7,scale:'57 slabs a year = 1 FTE'},
      {icon:'doc',project:'Byproduct Management',task:'Report preparation',before:'4–5 hours',after:'1–2 minutes',pct:99.2,scale:'691 reports a year = 1 FTE'},
      {icon:'ship',project:'Port logistics',task:'Shipment assessment',before:'360 minutes',after:'60 minutes',pct:83.3,scale:'about 120 shipments a year'}],
    takeaways:[{icon:'gear',big:'Up to 99.2%',text:'reduction in manual effort'},{icon:'people',big:'600 man-hours',text:'a year saved (0.22 FTE)'},
      {icon:'clock',big:'Faster turnaround',text:'from days and hours to minutes'},{icon:'chart',big:'Scalable impact',text:'across multiple projects and processes'}],
    footer:'In-house digitization and development is continuously reducing manual effort, enabling faster processes and better resource utilisation across operations, maintenance and management.',
    chips:['Less manual effort','Optimized FTE','Faster TAT']},
  prod:{title:'Productivity:',titleEm:'Faster turnaround, more output',subtitle:'In-house solutions enable faster processes, higher equipment availability and increased production',
    tat:[{icon:'truck',name:'Yard management',before:'160 minutes',after:'10 seconds',pct:99.9},{icon:'doc',name:'Commitment report',before:'4 days',after:'3 minutes',pct:99.9},
      {icon:'check',name:'QRM',before:'3 days',after:'1 hour',pct:98.6},{icon:'gear',name:'CRMS',before:'5 hours',after:'1 hour',pct:80}],
    potTitle:'Furnace heat cycle: potential impact',potSub:'Project in progress (analysis of September 2026, one month)',
    potBig:'25.6 h',potBigText:'of recoverable furnace time (~15 additional heats)',
    potText:'By bringing slower heats to the 79 min median tap-to-tap time, there is a potential to recover 25.6 hours of furnace time.',
    potBarsTitle:'Above the median, slowest quarter of heats (min per heat)',potBars:[{label:'Arcing',value:10.5},{label:'Blowing',value:7}],
    potSideText:'Aligning the two converters adds about',potSideBig:'1.8 h',potSideText2:'furnace time.',
    output:[{icon:'brick',big:'+70 t/day',text:'blast-furnace production, from a raw-material optimisation model'}],
    takeaways:[{icon:'gauge',big:'Faster turnaround time',text:'from days / hours to minutes / seconds'},{icon:'chart',big:'More output',text:'+70 t/day production'},
      {icon:'clock',big:'Potential furnace availability gain',text:'25.6 h (~15 additional heats)'},{icon:'gear',big:'Improved equipment utilisation',text:'by reducing delays and process variability'}],
    footer:'In-house digitalisation and development is enabling faster processes, higher equipment availability and more output, driving significant productivity improvement across operations.',
    chips:['Faster TAT','More output','Higher availability','Improved productivity']}
};

/* ---------- the editor's description of the highlights: [field, label, type, columns] ---------- */
var ICONS_PICK=['chart','clock','people','gear','coins','doc','truck','ship','factory','check','shield','leaf','helmet','brick','gauge','target','database','code','bell','monitor'];
var SCHEMA=[
  {key:'principle',slide:0,label:'1 · Working principle',fields:[['title','Title'],['titleEm','Title, coloured part'],['subtitle','Subtitle','long'],
    ['oemPct','OEM share, %','num'],['inhousePct','In-house share, %','num'],
    ['c1Title','Column 1 title'],['c1Sub','Column 1 subtitle'],['c1Text','Column 1 text','long'],['c1Items','Column 1 items (4)','list'],
    ['c2Title','Column 2 title'],['c2Sub','Column 2 subtitle'],['c2Text','Column 2 text','long'],['c2Steps','Column 2 steps (4)','list'],['c2Items','Column 2 items (4)','list'],
    ['c3Title','Column 3 title'],['c3Sub','Column 3 subtitle'],['c3Text','Column 3 text','long'],['c3Tools','Column 3 tools (4)','list'],
    ['impact','Key impact (4)','rows',[['icon','Icon','icon'],['big','Headline'],['text','Text']]],
    ['strip1','Bottom strip, OEM part'],['strip2','Bottom strip, in-house part'],['chips','Bottom strip results','list']]},
  {key:'glance',slide:1,label:'2 · Benefits at a glance',fields:[['title','Title'],['titleEm','Title, coloured part'],['tatBig','TAT card: callout'],['tatText','TAT card: callout text'],
    ['footer','Footer banner','long'],['chips','Footer results','list']]},
  {key:'money',slide:2,label:'3 · Money (stated gains; the costs come from the register)',fields:[['subtitle','Subtitle'],
    ['gains','Stated money gains','rows',[['icon','Icon','icon'],['big','Figure'],['text','What, where']]],['footer','Footer banner','long'],['chips','Footer results','list']]},
  {key:'fte',slide:3,label:'4 · FTE',fields:[['title','Title'],['titleEm','Title, coloured part'],['subtitle','Subtitle','long'],
    ['hours','Man-hours saved a year','num'],['hoursNote','How the hours add up','long'],
    ['tasks','Task reductions','rows',[['icon','Icon','icon'],['project','Project'],['task','Task'],['before','Before'],['after','After'],['pct','Less, %','num'],['scale','Scale']]],
    ['takeaways','Key takeaways (4)','rows',[['icon','Icon','icon'],['big','Headline'],['text','Text']]],['footer','Footer banner','long'],['chips','Footer results','list']]},
  {key:'prod',slide:4,label:'5 · Productivity',fields:[['title','Title'],['titleEm','Title, coloured part'],['subtitle','Subtitle','long'],
    ['tat','Turnaround time examples','rows',[['icon','Icon','icon'],['name','Process'],['before','Before'],['after','After'],['pct','Less, %','num']]],
    ['potTitle','Potential: title'],['potSub','Potential: subtitle'],['potBig','Potential: figure'],['potBigText','Potential: figure text'],['potText','Potential: explanation','long'],
    ['potBarsTitle','Potential: bars title'],['potBars','Potential: bars','rows',[['label','Label'],['value','Value','num']]],
    ['potSideText','Side note, before'],['potSideBig','Side note, figure'],['potSideText2','Side note, after'],
    ['output','Increased output','rows',[['icon','Icon','icon'],['big','Figure'],['text','Text']]],
    ['takeaways','Key takeaways (4)','rows',[['icon','Icon','icon'],['big','Headline'],['text','Text']]],['footer','Footer banner','long'],['chips','Footer results','list']]},
  {key:'look',slide:0,label:'Look: eyebrow and photos',fields:[['eyebrow','Line above the titles'],
    ['photo1','Photo, slide 1','photo'],['photo2','Photo, slide 2','photo'],['photo3','Photo, slide 3','photo'],['photo4','Photo, slide 4','photo'],['photo5','Photo, slide 5','photo']]}
];

/* ---------- icons (24 x 24, drawn with the text colour) ---------- */
var IC={
  coins:'<ellipse cx="12" cy="5.5" rx="7" ry="2.8"/><path d="M5 5.5v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4M5 9.5v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4M5 13.5v4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-4"/>',
  people:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.9.4 5 2.8 5 5.8"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  chart:'<path d="M3 21h18"/><rect x="5" y="13" width="3" height="5"/><rect x="10.5" y="9" width="3" height="9"/><rect x="16" y="5" width="3" height="13"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  doc:'<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h8M9 9h3"/>',
  truck:'<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  ship:'<path d="M3 15l2 5h14l2-5zM6 15V9h12v6M12 3v6M9 12h6"/>',
  factory:'<path d="M2 21V10l6 4v-4l6 4V5h5v16z"/><path d="M6 17h2M11 17h2M16 17h1"/>',
  shield:'<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  leaf:'<path d="M5 21c0-9 5-15 15-16-1 10-7 15-15 16z"/><path d="M5 21l8-8"/>',
  helmet:'<path d="M4 17a8 8 0 0116 0M10 9V5h4v4M2 20h20M3 17h18"/>',
  trophy:'<path d="M8 3h8v6a4 4 0 01-8 0zM8 5H4v1a4 4 0 004 4M16 5h4v1a4 4 0 01-4 4M12 13v4M9 17h6v4H9z"/>',
  bell:'<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>',
  check:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  code:'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  gauge:'<path d="M3 17a9 9 0 0118 0"/><path d="M12 17l4.5-5.5M6 12.5l1 .8M12 8v1.3M18 12.5l-1 .8"/>',
  monitor:'<rect x="2" y="4" width="20" height="13" rx="1"/><path d="M8 21h8M12 17v4"/>',
  brick:'<path d="M3 20h18M4 20v-4h7v4M13 20v-4h7v4M7.5 16v-4h9v4"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  down:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 13l4 4 4-4"/>'
};
function ic(name,cls){return '<svg viewBox="0 0 24 24" class="vi'+(cls?' '+cls:'')+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[name]||IC.chart)+'</svg>';}
/* an icon for a result chip, from its words */
function iconFor(t){t=String(t||'').toLowerCase();
  return /cost|money|saving/.test(t)?'coins':/tat|fast|time|turnaround/.test(t)?'clock':/fte|manual|effort|people/.test(t)?'people':/output|product/.test(t)?'chart':/quality/.test(t)?'check':/reliab|availab|equip/.test(t)?'gear':/insight|decision/.test(t)?'target':'chart';}

/* ---------- small pieces ---------- */
var X;   // what the dashboard passes in: esc, num, money, list of chosen projects, period text, highlights, admin
function e(s){return X.esc(s);}
function cr(n){n=+n||0;var a=Math.abs(n);return '₹'+(a>=1e7?(n/1e7).toFixed(1)+' Cr':(a>=1e5?(n/1e5).toFixed(1)+' L':X.num(n)));}
function crN(n){return (n/1e7).toFixed(1);}
function pctLower(a,b){return b>0?Math.round((1-a/b)*100):0;}
function sum(L,f){return L.reduce(function(s,p){return s+f(p);},0);}
function arr(v){return Array.isArray(v)?v:[];}
function photo(i){var f=(X.hl.look||{})['photo'+i];return f&&/^[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/i.test(f)?f:'';}
function head(i,title,em,sub){
  var f=photo(i);
  return '<div class="vphoto'+(f?'':' none')+'"'+(f?' style="background-image:linear-gradient(100deg,#fff 0%,rgba(255,255,255,.92) 14%,rgba(255,255,255,0) 46%),linear-gradient(0deg,#fff 0%,rgba(255,255,255,0) 30%),url(assets/img/'+encodeURI(f)+')"':'')+'></div>'+
    '<div class="vhead"><p class="veb">'+e((X.hl.look||{}).eyebrow||'')+'</p><h2>'+e(title)+(em?' <em>'+e(em)+'</em>':'')+'</h2>'+(sub?'<p class="vsub">'+sub+'</p>':'')+'</div>';
}
function card(cls,n,title,sub,tag,body,extra){
  return '<div class="vcard '+cls+(extra?' '+extra:'')+'"><div class="vch"><span class="vn">'+n+'</span><div class="vct"><b>'+e(title)+'</b>'+(sub?'<small>'+e(sub)+'</small>':'')+'</div>'+
    (tag?'<span class="vtag">'+e(tag)+'</span>':'')+'</div><div class="vcb">'+body+'</div></div>';
}
function foot(text,chips,iconName){
  chips=arr(chips).filter(Boolean);
  return '<div class="vfoot"><span class="vfi">'+ic(iconName||'trophy')+'</span><p>'+e(text||'')+'</p>'+
    (chips.length?'<div class="vchips">'+chips.map(function(c){return '<span>'+ic(iconFor(c))+e(c)+'</span>';}).join('')+'</div>':'')+'</div>';
}
/* horizontal bars in HTML: rows [{label, sub?, icon?, value, text?}] */
function bars(rows,opt){
  opt=opt||{};var max=opt.max||Math.max.apply(null,[1].concat(rows.map(function(r){return +r.value||0;})));
  return '<div class="vbars'+(opt.cls?' '+opt.cls:'')+'">'+rows.map(function(r){
    var w=Math.max(1,Math.min(100,(+r.value||0)/max*100));
    return '<div class="vbr">'+(r.icon?'<span class="vbi">'+ic(r.icon)+'</span>':'')+'<span class="vbl">'+e(r.label)+(r.sub?'<small>'+e(r.sub)+'</small>':'')+'</span>'+
      '<span class="vbt"><i style="width:'+(w*BAR).toFixed(1)+'%"></i><b>'+e(r.text!=null?r.text:r.value)+'</b></span>'+(r.share!=null?'<span class="vshare">'+e(r.share)+'</span>':'')+'</div>';
  }).join('')+(opt.axis?'<div class="vbr vaxis"><span class="vbl"></span><span class="vbt">'+[0,20,40,60,80,100].map(function(v){return '<em style="left:'+(v*BAR)+'%">'+v+'%</em>';}).join('')+'</span></div>':'')+'</div>';
}
var BAR=0.8;   // a full bar takes 80% of its row, leaving room for its value
function pctTxt(v){v=+v||0;return (Math.round(v*10)/10).toString()+'%';}

/* ---------- Business KPI: imported entries carry it in the note header "[Estimated from the project list, #12 | Hazira | Productivity | ...]" ---------- */
var KPI={'quality & process excelence':'Quality','quality & process excellence':'Quality','quality':'Quality','safety and asset integrity':'HSE and safety','hse':'HSE and safety','hse and safety':'HSE and safety',
  'work force optimization':'Workforce optimisation','workforce optimisation':'Workforce optimisation','productivity':'Productivity','reliability':'Reliability','sustainability':'Sustainability','others':'Others'};
var KPI_ICON={'Productivity':'chart','Quality':'target','Reliability':'shield','Others':'gear','Sustainability':'leaf','Workforce optimisation':'people','HSE and safety':'helmet','Not given':'doc'};
function kpiOf(note){
  var m=/^\[([^\]]*)\]/.exec(note||'');if(!m)return 'Not given';
  var parts=m[1].split('|');for(var i=0;i<parts.length;i++){var k=KPI[parts[i].trim().toLowerCase()];if(k)return k;}
  return 'Not given';
}

/* ---------- illustrations ---------- */
function artPlant(){
  return '<svg viewBox="0 0 320 130" class="vart" aria-hidden="true"><defs><radialGradient id="vg1" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd166"/><stop offset=".5" stop-color="#f97316"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient></defs>'+
    '<rect x="8" y="30" width="120" height="92" rx="4" fill="#374151"/><rect x="20" y="14" width="22" height="30" fill="#4b5563"/><rect x="58" y="6" width="16" height="36" fill="#4b5563"/>'+
    '<ellipse cx="68" cy="88" rx="52" ry="30" fill="url(#vg1)"/><rect x="40" y="78" width="56" height="34" rx="3" fill="#f97316" opacity=".85"/><rect x="46" y="84" width="44" height="6" fill="#fde68a"/>'+
    '<path d="M140 76h56" stroke="#2563eb" stroke-width="3" stroke-dasharray="7 6"/><path d="M194 68l12 8-12 8" fill="#2563eb"/>'+
    '<rect x="218" y="14" width="86" height="108" rx="5" fill="#1f2937"/>'+[0,1,2,3,4].map(function(i){return '<rect x="226" y="'+(22+i*20)+'" width="70" height="14" rx="2" fill="#334155"/><circle cx="234" cy="'+(29+i*20)+'" r="2.4" fill="#60a5fa"/><circle cx="242" cy="'+(29+i*20)+'" r="2.4" fill="#22c55e"/><rect x="252" y="'+(27+i*20)+'" width="36" height="4" fill="#475569"/>';}).join('')+'</svg>';
}
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
function artThumb(k){
  var s='<svg viewBox="0 0 100 64" class="vthumb" aria-hidden="true"><rect x="1" y="1" width="98" height="62" rx="4" fill="#111827"/><rect x="4" y="4" width="92" height="50" rx="2" fill="#f8fafc"/>';
  if(k===0)s+='<polyline points="10,40 22,30 34,36 46,22 58,28 70,16 86,24" fill="none" stroke="#2563eb" stroke-width="2"/><rect x="10" y="44" width="76" height="5" fill="#cbd5e1"/>';
  else if(k===1)s+=[0,1,2,3,4,5,6].map(function(i){var h=[10,14,12,20,18,26,30][i];return '<rect x="'+(10+i*11)+'" y="'+(50-h)+'" width="8" height="'+h+'" fill="#0f9488"/>';}).join('');
  else if(k===2)s+='<circle cx="30" cy="29" r="13" fill="none" stroke="#7c3aed" stroke-width="6"/><path d="M30 16a13 13 0 0 1 13 13" fill="none" stroke="#f59e0b" stroke-width="6"/>'+[0,1,2].map(function(i){return '<rect x="52" y="'+(16+i*10)+'" width="'+(36-i*8)+'" height="6" fill="#94a3b8"/>';}).join('');
  else s+='<polyline points="10,44 24,38 38,40 52,26 66,30 86,14" fill="none" stroke="#dc2626" stroke-width="2"/><circle cx="86" cy="14" r="3" fill="#dc2626"/><rect x="10" y="10" width="30" height="6" fill="#fca5a5"/>';
  return s+'<rect x="44" y="56" width="12" height="5" fill="#374151"/></svg>';
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

/* ---------- slides ---------- */
function sPrinciple(){
  var P=X.hl.principle||{},oem=+P.oemPct||0,inh=+P.inhousePct||0;
  var items1=arr(P.c1Items),icons1=['factory','bell','gear','doc'],steps=arr(P.c2Steps),stepIc=['database','gear','chart','code'],items2=arr(P.c2Items),items2Ic=['database','chart','monitor','code'];
  var c1='<p class="vtxt">'+e(P.c1Text)+'</p>'+artPlant()+'<div class="vgrid2">'+items1.slice(0,4).map(function(t,i){return '<div class="vit">'+ic(icons1[i%4])+'<span>'+e(t)+'</span></div>';}).join('')+'</div>';
  var c2='<p class="vtxt">'+e(P.c2Text)+'</p><div class="vsteps">'+steps.slice(0,4).map(function(t,i){return (i?'<span class="varr">'+ic('arrow')+'</span>':'')+'<div class="vstep s'+i+'">'+ic(stepIc[i%4])+'<span>'+e(t)+'</span></div>';}).join('')+'</div>'+
    artScreens()+'<div class="vgrid4">'+items2.slice(0,4).map(function(t,i){return '<div class="vit sm">'+ic(items2Ic[i%4])+'<span>'+e(t)+'</span></div>';}).join('')+'</div>';
  var c3='<p class="vtxt">'+e(P.c3Text)+'</p><div class="vtools">'+arr(P.c3Tools).slice(0,4).map(function(t,i){return '<div>'+artThumb(i)+'<span>'+e(t)+'</span></div>';}).join('')+'</div>'+
    '<div class="vimpact"><h4>Key impact</h4><div>'+arr(P.impact).slice(0,4).map(function(r,i){return '<div class="vimp i'+i+'">'+ic(r.icon||'chart')+'<b>'+e(r.big)+'</b><span>'+e(r.text)+'</span></div>';}).join('')+'</div></div>';
  return head(1,P.title,P.titleEm,e(P.subtitle))+
    '<div class="vbody vprin">'+card('c-or','1',P.c1Title,P.c1Sub+(oem?' (~'+oem+'%)':''),'',c1)+'<span class="vflow">'+ic('arrow')+'</span>'+
      card('c-te','2',P.c2Title,P.c2Sub+(inh?' (~'+inh+'%)':''),'',c2)+'<span class="vflow">'+ic('arrow')+'</span>'+card('c-nv','3',P.c3Title,P.c3Sub,'',c3)+'</div>'+
    '<div class="vstrip"><div class="v1"><b>'+(oem?oem+'%':'')+'</b><span>'+e(P.strip1)+'</span></div><div class="v2"><b>'+(inh?inh+'%':'')+'</b><span>'+e(P.strip2)+'</span></div>'+
      '<div class="v3">'+arr(P.chips).slice(0,4).map(function(c){return '<span>'+ic(iconFor(c))+e(c)+'</span>';}).join('')+'</div></div>';
}

function counts(L){
  var live=L.filter(function(p){return p.status==='completed';}),prog=L.filter(function(p){return p.status==='progress';});
  return {live:live,prog:prog,all:L,ver:L.filter(function(p){return p.wf==='verified';}).length};
}
function sGlance(){
  var G=X.hl.glance||{},T=X.hl.fte||{},R=X.hl.prod||{},C=counts(X.L);
  var mL=C.live.length?C.live:X.L,A=sum(mL,function(p){return p.a;}),B=sum(mL,function(p){return p.b;});
  var who=C.live.length?'by the '+C.live.length+' live project'+(C.live.length===1?'':'s'):'by the '+X.L.length+' chosen projects';
  var hours=+T.hours||0,tat=arr(R.tat),maxTat=Math.max.apply(null,[0].concat(tat.map(function(r){return +r.pct||0;}))),out=arr(R.output)[0]||{};
  var sub=e(X.period)+': <b>'+X.L.length+' project'+(X.L.length===1?'':'s')+' ('+C.live.length+' live and '+C.prog.length+' in progress)</b>'+(X.choiceNote?' · '+e(X.choiceNote):'');
  var money='<div class="vbig or">'+e(cr(B-A))+'<small>avoided</small></div><p class="vtxt">'+e(who+': built in-house for '+cr(A)+' against '+cr(B)+' from a software company ('+pctLower(A,B)+'% lower). Inclusive of hardware, people and licensing costs.')+'</p>'+
    '<div class="vcall">'+artCoins()+'<div class="vbox or"><b>'+pctLower(A,B)+'%</b><span>lower cost vs external</span></div></div>';
  var fte='<div class="vbig te">'+e(X.num(hours))+'<small>man-hours a year</small></div><p class="vtxt">'+e(T.hoursNote)+'</p>'+
    '<div class="vcall"><span class="vpeople">'+ic('people')+ic('down','vdown')+'</span><div class="vbox te"><b>'+(hours/HOURS_PER_FTE).toFixed(2)+'</b><span>FTE saved a year</span></div></div>';
  var tatB='<div class="vbig bl"><small class="pre">up to</small> '+e(pctTxt(maxTat))+'<small>faster</small></div><ul class="vchk">'+tat.slice(0,4).map(function(r){return '<li>'+ic('check')+'<span>'+e(r.name+': '+r.before+' → '+r.after)+'</span></li>';}).join('')+'</ul>'+
    '<div class="vcall"><span class="vwatch">'+ic('clock')+'</span><div class="vbox bl"><b class="sm">'+e(G.tatBig)+'</b><span>'+e(G.tatText)+'</span></div></div>';
  var prod='<div class="vbig pu">'+e(out.big||'')+'</div><p class="vtxt">'+e((out.text||'')+(R.potBig?'. Potential, from a project in progress: '+R.potBig+' '+(R.potBigText||'')+'.':''))+'</p>'+
    '<div class="vcall">'+artBarsUp()+'<div class="vbox pu"><b>'+e(R.potBig||'')+'</b><span>'+e(R.potBigText||'')+'</span></div></div>';
  var hc=function(cls,icon,title,sub,tag,body){return '<div class="vcard '+cls+' vg"><div class="vch"><span class="vn">'+ic(icon)+'</span><div class="vct"><b>'+e(title)+'</b><small>'+e(sub)+'</small></div><span class="vtag">'+e(tag)+'</span></div><div class="vcb">'+body+'</div></div>';};
  return head(2,G.title,G.titleEm,sub)+
    '<div class="vbody vglance">'+hc('c-or','coins','Money','Cost avoidance','Derived',money)+hc('c-te','people','FTE','Man-hours saved','Stated',fte)+
      hc('c-bl','clock','TAT','Faster process response','Stated',tatB)+hc('c-pu','chart','Productivity','More output, same resources','Stated',prod)+'</div>'+
    '<div class="vport"><span class="vpi">'+ic('doc')+'</span><div><b>Project portfolio</b><span>'+e(X.period)+'</span></div>'+
      '<div><b>'+X.L.length+'</b><span>Total projects</span></div><div><b>'+C.live.length+' <i class="d g"></i></b><span>Live</span></div>'+
      '<div><b>'+C.prog.length+' <i class="d y"></i></b><span>In progress</span></div><div><b>'+C.ver+' <i class="d b"></i></b><span>Verified</span></div></div>'+
    foot(G.footer,G.chips,'trophy');
}

function sMoney(){
  var M=X.hl.money||{},C=counts(X.L);
  var groups=[['Live',C.live],['In progress',C.prog],['All '+X.L.length,C.all]].filter(function(g,i){return g[1].length&&!(i===2&&(g[1].length===C.live.length||g[1].length===C.prog.length));});
  var G=groups.map(function(g){var a=sum(g[1],function(p){return p.a;}),b=sum(g[1],function(p){return p.b;});return {label:g[0],n:g[1].length,a:a,b:b};});
  var max=Math.max.apply(null,[1].concat(G.map(function(g){return g.b;}))),step=max>5e8?2e8:(max>2e8?5e7:(max>5e7?2e7:1e7));
  var top=Math.ceil(max*1.25/step)*step;
  var grid='';for(var v=0;v<=top;v+=step)grid+='<span style="bottom:'+(v/top*100)+'%"><em>'+crN(v)+'</em></span>';
  var colsH='<div class="vcols"><div class="vgridl">'+grid+'</div>'+G.map(function(g){
    return '<div class="vcg"><div class="vcall2" style="bottom:calc('+(g.b/top*100).toFixed(1)+'% + var(--u)*2)">'+e(cr(g.b-g.a))+'<small>('+pctLower(g.a,g.b)+'%) avoided</small></div>'+
      '<div class="vcb2"><i class="a" style="height:'+(g.a/top*100)+'%"><b>'+crN(g.a)+'</b></i><i class="b" style="height:'+(g.b/top*100)+'%"><b>'+crN(g.b)+'</b></i></div>'+
      '<span class="vcl">'+e(g.label)+'<small>'+(g.label.indexOf('All')===0?'projects':'('+g.n+' projects)')+'</small></span></div>';}).join('')+'</div>'+
    '<div class="vleg"><i class="a"></i>Central Automation (in-house)<i class="b"></i>Software company (benchmark)</div>'+
    '<div class="vsave">'+ic('coins')+'<b>Avoided:</b>'+G.map(function(g){return '<span>'+e(g.label)+': <b>'+e(cr(g.b-g.a))+'</b> ('+pctLower(g.a,g.b)+'%)</span>';}).join('')+'</div>';
  var byK={};X.L.forEach(function(p){var k=kpiOf(p.note);var o=byK[k]||(byK[k]={k:k,n:0,v:0});o.n++;o.v+=p.b-p.a;});
  var K=Object.keys(byK).map(function(k){return byK[k];}).filter(function(o){return o.v>0;}).sort(function(a,b){return b.v-a.v;}).slice(0,8);
  var tot=sum(K,function(o){return o.v;});
  var kpi=K.length?bars(K.map(function(o){return {icon:KPI_ICON[o.k]||'chart',label:o.k+' ('+o.n+')',value:o.v,text:crN(o.v),share:tot>0?Math.round(o.v/tot*100)+'%':''};}),{cls:'g'})+
    '<div class="vtot"><span>Total</span><b>'+e(cr(tot))+'</b><small>cost avoided ('+X.L.length+' projects)</small></div>':'<p class="vtxt">No cost avoided recorded for these projects.</p>';
  var gains=arr(M.gains);
  var mainL=C.live.length?C.live:X.L,mA=sum(mainL,function(p){return p.a;}),mB=sum(mainL,function(p){return p.b;});
  return head(3,'Money:',(C.live.length?'Live projects avoided ':'Projects avoided ')+cr(mB-mA)+' of external cost',e(M.subtitle||'')+', ₹ Cr')+
    '<div class="vbody vmoney">'+card('c-bl','1','Cost over 3 years','In-house vs. software company, ₹ Cr','Derived',colsH)+
      card('c-gr','2','Cost avoided by business KPI','₹ Cr ('+X.L.length+' projects)','Derived',kpi,'vkpi')+
      (gains.length?card('c-nv','3','Stated money gains (examples)','','Stated','<div class="vgains">'+gains.map(function(g){return '<div>'+ic(g.icon||'coins')+'<b>'+e(g.big)+'</b><span>'+e(g.text)+'</span></div>';}).join('')+'</div>','vwide'):'')+'</div>'+
    foot(M.footer,M.chips,'coins');
}

function sFte(){
  var T=X.hl.fte||{},tasks=arr(T.tasks),hours=+T.hours||0;
  var table='<table class="vtab"><thead><tr><th>Project</th><th>Task</th><th>Before</th><th>After</th><th>Reduction</th><th>Scale</th></tr></thead><tbody>'+tasks.map(function(r){
    return '<tr><td>'+ic(r.icon||'doc')+e(r.project)+'</td><td>'+e(r.task)+'</td><td>'+e(r.before)+'</td><td>'+e(r.after)+'</td><td class="g">'+e(pctTxt(r.pct))+' less</td><td>'+e(r.scale)+'</td></tr>';}).join('')+'</tbody></table>';
  var total='<div class="vtotal"><div class="vbig te">'+e(X.num(hours))+'<small>man-hours a year</small></div><div class="vbox te">'+ic('people')+'<span>Equivalent to</span><b>'+(hours/HOURS_PER_FTE).toFixed(2)+' FTE</b></div></div>'+
    '<div class="vnote">'+ic('clock')+'<span>'+e(T.hoursNote)+'</span></div>';
  var red=bars(tasks.slice().sort(function(a,b){return (+a.pct||0)-(+b.pct||0);}).map(function(r){return {label:r.task,value:+r.pct||0,text:pctTxt(r.pct)};}),{max:100,cls:'o',axis:true});
  var take='<div class="vtake">'+arr(T.takeaways).slice(0,4).map(function(r){return '<div>'+ic(r.icon||'chart')+'<span><b>'+e(r.big)+'</b>'+e(r.text)+'</span></div>';}).join('')+'</div>';
  return head(4,T.title,T.titleEm,e(T.subtitle))+
    '<div class="vbody vfte">'+card('c-bl','1','Example task reductions','Stated reductions, each time the task runs','Stated',table,'vt1')+
      card('c-te','2','Total time saved with projects','','Stated',total,'vt2')+card('c-or','3','Reduction in effort, %','','Stated',red,'vt3')+card('c-pu','4','Key takeaways','','',take,'vt4')+'</div>'+
    foot(T.footer,T.chips,'target');
}

function sProd(){
  var R=X.hl.prod||{},tat=arr(R.tat),out=arr(R.output);
  var tatB=bars(tat.map(function(r){return {icon:r.icon||'clock',label:r.name,sub:r.before||r.after?(r.before||'')+' → '+(r.after||''):'',value:+r.pct||0,text:pctTxt(r.pct)};}),{max:100,cls:'t',axis:true});
  var pot='<div class="vpot"><span class="vpi2">'+ic('factory')+'</span><div class="vbig te">'+e(R.potBig)+'<small>'+e(R.potBigText)+'</small></div><p class="vtxt">'+e(R.potText)+'</p></div>'+
    '<div class="vpot2"><div><h4>'+e(R.potBarsTitle)+'</h4>'+bars(arr(R.potBars).map(function(b){return {label:b.label,value:+b.value||0,text:b.value};}),{cls:'t'})+'</div>'+
    (R.potSideBig?'<div class="vside"><span>'+e(R.potSideText)+'</span><b>'+e(R.potSideBig)+'</b><span>'+e(R.potSideText2)+'</span></div>':'')+'</div>';
  var o=out.map(function(r){return '<div class="vout">'+ic(r.icon||'brick')+'<div><b>'+e(r.big)+'</b><span>'+e(r.text)+'</span></div></div>';}).join('');
  var take='<div class="vtake4">'+arr(R.takeaways).slice(0,4).map(function(r){return '<div>'+ic(r.icon||'chart')+'<b>'+e(r.big)+'</b><span>'+e(r.text)+'</span></div>';}).join('')+'</div>';
  return head(5,R.title,R.titleEm,e(R.subtitle))+
    '<div class="vbody vprod">'+card('c-bl','1','Turnaround time reduction','Key process examples, reduction in %','Stated',tatB,'vp1')+
      card('c-te','2',R.potTitle,R.potSub,'Potential',pot,'vp2')+(out.length?card('c-or','3','Increased output','','Stated',o,'vp3'):'')+card('c-pu','4','Key takeaways','','',take,'vp4')+'</div>'+
    foot(R.footer,R.chips,'target');
}

var TITLES=['Working principle','Benefits at a glance','Money','FTE','Productivity'];
return {
  TITLES:TITLES,DEFAULTS:DEFAULTS,SCHEMA:SCHEMA,ICONS:ICONS_PICK,PHOTOS:PHOTOS,kpiOf:kpiOf,
  /* i: 0..4; x: { esc, num, L (chosen projects), period, choiceNote, hl } */
  make:function(i,x){X=x;return [sPrinciple,sGlance,sMoney,sFte,sProd][i]();}
};
})();
