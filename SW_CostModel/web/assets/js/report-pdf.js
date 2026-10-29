/* Report page: "PDF" and "Download PDF" buttons.
   Builds the estimate of a project exactly as the estimator's Print page shows it (the quotation: one-time price, yearly running cost,
   value creation, technical specification, terms, signature, with the Benchmark, Central Automation and Saving columns) and saves it as an A4 PDF.
   Everything is done in this browser with libraries served from this site (vendor/jspdf.umd.min.js, vendor/html2canvas.min.js).
   The estimate comes from the saved estimate of the register entry, worked out by the same code the estimator uses (CAEstimate, from estimator.js). */
(function(){
'use strict';

var API='api/estimator.ashx';
var PAGE_W_MM=210,PAGE_H_MM=297,MARGIN_MM=12;
var CONTENT_W_MM=PAGE_W_MM-2*MARGIN_MM;         // 186
var CONTENT_H_MM=PAGE_H_MM-2*MARGIN_MM-6;       // 267: a little room is kept for the page footer
var WIDTHS=[703,740,780];                       // the document is laid out this many CSS px wide: 703 is 186 mm (96 dpi), text the size it is on screen; a wider layout shrinks it a little, only to save a page
var SCALE=2;                                    // canvas pixels per CSS pixel: sharp text at A4
var busy=false,dataPromise=null,libsPromise=null;
var LIBS=['assets/js/vendor/html2canvas.min.js','assets/js/vendor/jspdf.umd.min.js','assets/js/estimator.js'];

/* ---------- the PDF libraries and the estimator, loaded on the first PDF click (not with the page) ---------- */
function loadScript(src){
  return new Promise(function(ok,fail){
    var s=document.createElement('script');s.src=src;
    s.onload=ok;s.onerror=function(){s.remove();fail(new Error(src));};
    document.head.appendChild(s);
  });
}
function libs(){
  if(window.CAEstimate&&window.jspdf&&window.html2canvas)return Promise.resolve();
  if(!libsPromise){
    libsPromise=Promise.all(LIBS.map(loadScript)).then(function(){
      if(!window.CAEstimate||!window.jspdf||!window.html2canvas)throw new Error('incomplete');
    });
    libsPromise.catch(function(){libsPromise=null;});   // try again on the next click
  }
  return libsPromise.catch(function(){throw new Error('The PDF libraries did not load. Reload the page; if it keeps happening, tell the administrator.');});
}

/* ---------- the register (with each entry's saved estimate) and the masters, fetched once ---------- */
function loginUrl(){return document.body.dataset.loginUrl;}
function load(){
  if(dataPromise)return dataPromise;
  dataPromise=fetch(API+'?action=init',{credentials:'same-origin',cache:'no-store',headers:{'X-Requested-With':'XMLHttpRequest'}}).then(function(r){
    if(r.status===401&&loginUrl()){location.href=loginUrl()+'?returnUrl='+encodeURIComponent(location.pathname+location.search);return new Promise(function(){});}
    return r.json().catch(function(){return null;}).then(function(j){
      if(!j||!r.ok||j.error)throw new Error((j&&j.error&&j.error.message)||'The register could not be read.');
      window.CAEstimate.loadMasters(j.masters);
      var byId={};((j.register&&j.register.projects)||[]).forEach(function(d){byId[d._id]=d;});
      return byId;
    });
  });
  dataPromise.catch(function(){dataPromise=null;});   // try again on the next click
  return dataPromise;
}

/* ---------- messages (no pop-up boxes) ---------- */
function say(text,isError){
  var el=document.getElementById('pdfMsg');
  if(!el)return;
  el.hidden=!text;
  el.textContent=text||'';
  el.classList.toggle('ok',!!text&&!isError);
}

/* ---------- the document ---------- */
function tag(text){var h=5381;for(var i=0;i<text.length;i++)h=((h*33)^text.charCodeAt(i))>>>0;return h.toString(36).toUpperCase().slice(-4);}
function slug(t){return String(t||'estimate').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'estimate';}

function documentFor(d){
  var E=window.CAEstimate,st=E.stateOf(d);
  if(!st)return null;
  st.q.basis='both';                        // Benchmark, Central Automation and Saving side by side
  st.q.ref='';                              // and that line is the project title (not a free-text reference)
  E.ensureQuote(st);
  st.q.no='QTN-'+String(st.q.date||'').replace(/-/g,'')+'-'+tag(d._id);   // its own number, not the same "-01" for every project
  var R=E.calc2(st);
  return {st:st,R:R,html:E.quoteHTML(st,R,{})};
}

/* An off-screen box the width of the printable area, styled by the same .paper / .q-* rules as the estimator's Print page. */
function stage(html,width){
  var wrap=document.createElement('div');
  wrap.className='pdf-stage';wrap.setAttribute('aria-hidden','true');wrap.style.width=width+'px';
  var paper=document.createElement('div');
  paper.className='paper pdf-paper';
  paper.style.width=width+'px';
  paper.innerHTML=html;
  wrap.appendChild(paper);
  document.body.appendChild(wrap);
  return {wrap:wrap,paper:paper};
}

/* Where a page may end: after a table row, a list item, a paragraph, a spec line or a block; or just before a heading.
   (Never after a heading, never between a table's header and its first row.) Heights in CSS px from the top of the document. */
function breakPoints(paper){
  var top=paper.getBoundingClientRect().top,pts=[];
  var last=paper.querySelector('.q-terms li:last-child');   // the signature stays with the last term: never a page of its own
  Array.prototype.forEach.call(paper.querySelectorAll('tbody tr,li,p,.q-spec>div,.q-top,.q-subj,.q-sign,.q-to'),function(e){if(e!==last)pts.push(e.getBoundingClientRect().bottom-top);});
  Array.prototype.forEach.call(paper.querySelectorAll('h3'),function(e){pts.push(e.getBoundingClientRect().top-top);});
  return pts.sort(function(a,b){return a-b;});
}

/* The tables, with the place of their header row, so a table that runs over to the next page starts that page with its header again. */
function tableBoxes(paper){
  var top=paper.getBoundingClientRect().top;
  return Array.prototype.map.call(paper.querySelectorAll('table'),function(t){
    var r=t.getBoundingClientRect(),h=t.querySelector('thead tr'),hr=h&&h.getBoundingClientRect();
    return {top:r.top-top,bottom:r.bottom-top,head:hr?{top:hr.top-top,bottom:hr.bottom-top}:null};
  });
}

/* The pages: from and to (CSS px), and the header row to repeat at the top when the page continues a table. */
function pagesFor(total,pts,tables,width){
  var pageH=width*CONTENT_H_MM/CONTENT_W_MM,pages=[],y=0,carry=null;
  while(true){
    var room=pageH-(carry?carry.bottom-carry.top:0);
    if(total-y<=room+0.5){pages.push({from:y,to:total,head:carry});break;}
    var limit=y+room,best=null;
    for(var i=0;i<pts.length;i++)if(pts[i]>y+room*0.3&&pts[i]<=limit)best=pts[i];   // the lowest place that still fits
    if(best==null)best=limit;                                                          // one block taller than a page: cut it
    var inside=null;
    for(var k=0;k<tables.length;k++)if(tables[k].head&&best>tables[k].head.bottom+1&&best<tables[k].bottom-1&&best>tables[k].top)inside=tables[k].head;
    pages.push({from:y,to:best,head:carry});
    carry=inside;y=best;
  }
  return pages;
}

/* Lays the document out at the narrowest width first (text as on screen); if a wider layout needs fewer pages, that one is used instead:
   a few lines over a page boundary should not cost a whole extra page. */
function layout(html){
  var best=null;
  WIDTHS.forEach(function(w){
    var s=stage(html,w),total=s.paper.offsetHeight,pages=pagesFor(total,breakPoints(s.paper),tableBoxes(s.paper),w);
    document.body.removeChild(s.wrap);
    if(!best||pages.length<best.pages.length)best={width:w,pages:pages};
  });
  return best;
}

function build(d){
  var doc=documentFor(d);
  if(!doc)return Promise.reject(new Error('This entry has no saved estimate, so no PDF can be made.'));
  var fontsReady=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();
  return fontsReady.then(function(){
    var plan=layout(doc.html),pages=plan.pages,width=plan.width,s=stage(doc.html,width);
    return window.html2canvas(s.paper,{scale:SCALE,backgroundColor:'#ffffff',logging:false,width:width,windowWidth:width+40}).then(function(canvas){
      var pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
      var count=pages.length,mmPerPx=CONTENT_W_MM/width;
      pages.forEach(function(pg,i){
        var sy=Math.round(pg.from*SCALE),sh=Math.max(1,Math.round((pg.to-pg.from)*SCALE));
        var hh=pg.head?Math.round((pg.head.bottom-pg.head.top)*SCALE):0;   // the table header repeated on a continuation page
        var part=document.createElement('canvas');
        part.width=canvas.width;part.height=hh+sh;
        var ctx=part.getContext('2d');
        ctx.fillStyle='#ffffff';ctx.fillRect(0,0,part.width,part.height);
        if(hh)ctx.drawImage(canvas,0,Math.round(pg.head.top*SCALE),canvas.width,hh,0,0,canvas.width,hh);
        ctx.drawImage(canvas,0,sy,canvas.width,sh,0,hh,canvas.width,sh);
        if(i>0)pdf.addPage('a4','portrait');
        pdf.addImage(part.toDataURL('image/jpeg',0.92),'JPEG',MARGIN_MM,MARGIN_MM,CONTENT_W_MM,((hh+sh)/SCALE)*mmPerPx);
        pdf.setFontSize(8);pdf.setTextColor(110);
        pdf.text(String(doc.st.name||'').slice(0,70),MARGIN_MM,PAGE_H_MM-7);
        pdf.text('Page '+(i+1)+' of '+count,PAGE_W_MM-MARGIN_MM,PAGE_H_MM-7,{align:'right'});
      });
      pdf.setProperties({title:'Estimate: '+(doc.st.name||''),subject:'Quotation '+doc.st.q.no,author:doc.st.q.from||'Central Automation'});
      pdf.save(slug(doc.st.name)+'-estimate-'+(doc.st.reg.fy||'')+'.pdf');
      return count;
    }).then(function(n){document.body.removeChild(s.wrap);return n;},
            function(e){if(s.wrap.parentNode)document.body.removeChild(s.wrap);throw e;});
  });
}

/* ---------- buttons ---------- */
document.addEventListener('click',function(e){
  var btn=e.target.closest&&e.target.closest('[data-pdf]');
  if(!btn)return;
  e.preventDefault();
  if(busy)return;
  busy=true;
  var label=btn.textContent,id=btn.getAttribute('data-pdf');
  btn.disabled=true;btn.textContent='Preparing PDF…';say('Preparing the PDF…',false);
  libs().then(load).then(function(byId){
    var d=byId[id];
    if(!d)throw new Error('That entry was not found in the register.');
    return build(d);
  }).then(function(pages){
    say('PDF downloaded ('+pages+' page'+(pages===1?'':'s')+').',false);
  }).catch(function(err){
    say((err&&err.message)||'The PDF could not be made.',true);
  }).then(function(){
    busy=false;btn.disabled=false;btn.textContent=label;
  });
});
})();
