/* Minimal Excel (.xlsx) writer and reader for the estimator, with no outside library,
   so it works on a server with no internet.
   Writer: inline strings, numbers, formulas, a few cell styles, column widths, frozen
   header rows, hidden sheets and drop-down lists (data validation).
   Reader: cell values (shared and inline strings, numbers, booleans, cached formula
   results) of every sheet. Needs a browser with DecompressionStream (current Edge,
   Chrome, Firefox). */
(function(){
"use strict";

/* ---------- zip ---------- */
var CRC=(function(){var t=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CRC[(c^b[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
var enc=new TextEncoder(),dec=new TextDecoder('utf-8');

/* files: [{name, data: string}] -> Blob (stored, not compressed: Excel opens it normally) */
function zip(files){
  var parts=[],central=[],offset=0;
  files.forEach(function(f){
    var name=enc.encode(f.name),data=enc.encode(f.data),crc=crc32(data);
    var h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);
    h.setUint16(10,0,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);
    h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),name,data);
    var c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);
    c.setUint16(12,0,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);
    c.setUint16(28,name.length,true);c.setUint16(30,0,true);c.setUint16(32,0,true);c.setUint16(34,0,true);c.setUint16(36,0,true);
    c.setUint32(38,0,true);c.setUint32(42,offset,true);
    central.push(new Uint8Array(c.buffer),name);
    offset+=30+name.length+data.length;
  });
  var size=central.reduce(function(a,b){return a+b.length;},0);
  var e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);
  e.setUint32(12,size,true);e.setUint32(16,offset,true);
  return new Blob(parts.concat(central,[new Uint8Array(e.buffer)]),{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

function inflate(u8){
  if(typeof DecompressionStream==='undefined')return Promise.reject(new Error('This browser cannot read Excel files. Use a current Edge or Chrome.'));
  var s=new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(s).arrayBuffer().then(function(b){return new Uint8Array(b);});
}

/* ArrayBuffer -> Promise<{path: Uint8Array}> */
function unzip(buf){
  var u8=new Uint8Array(buf),dv=new DataView(buf),eocd=-1;
  for(var i=u8.length-22;i>=Math.max(0,u8.length-65558);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}}
  if(eocd<0)return Promise.reject(new Error('Not an Excel .xlsx file. In Excel use File > Save As > Excel Workbook (.xlsx).'));
  var n=dv.getUint16(eocd+10,true),p=dv.getUint32(eocd+16,true),jobs=[],out={};
  for(var k=0;k<n;k++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    var method=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),nlen=dv.getUint16(p+28,true),xlen=dv.getUint16(p+30,true),clen=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);
    var name=dec.decode(u8.subarray(p+46,p+46+nlen));
    var start=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),data=u8.subarray(start,start+csize);
    (function(name,method,data){
      if(method===0)out[name]=data;
      else if(method===8)jobs.push(inflate(data).then(function(d){out[name]=d;}));
    })(name,method,data);
    p+=46+nlen+xlen+clen;
  }
  return Promise.all(jobs).then(function(){return out;});
}

/* ---------- writer ---------- */
function x(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');}
function colName(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;}
/* Style numbers for cells: */
var ST={normal:0,head:1,input:2,title:3,note:4,calc:5,label:6,inputNum:7};
var STYLES='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'+
 '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
 '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>'+
 '<fonts count="4"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>'+
 '<font><b/><sz val="14"/><name val="Calibri"/><family val="2"/></font><font><i/><sz val="10"/><color rgb="FF595959"/><name val="Calibri"/><family val="2"/></font></fonts>'+
 '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'+
 '<fill><patternFill patternType="solid"><fgColor rgb="FFDDEBF0"/><bgColor indexed="64"/></patternFill></fill>'+
 '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF6D5"/><bgColor indexed="64"/></patternFill></fill></fills>'+
 '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'+
 '<border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border></borders>'+
 '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
 '<cellXfs count="8">'+
 '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
 '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'+
 '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyProtection="1"><protection locked="0"/></xf>'+
 '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'+
 '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'+
 '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>'+
 '<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>'+
 '<xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyProtection="1"><protection locked="0"/></xf>'+
 '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

/* cell: null | string | number | boolean | {v, s, f} */
function cellXml(ref,c){
  if(c==null)return '';
  if(typeof c!=='object')c={v:c};
  var s=c.s?' s="'+c.s+'"':'';
  if(c.f)return '<c r="'+ref+'"'+s+'><f>'+x(c.f)+'</f></c>';
  if(c.v==null||c.v==='')return s?'<c r="'+ref+'"'+s+'/>':'';
  if(typeof c.v==='number'&&isFinite(c.v))return '<c r="'+ref+'"'+s+'><v>'+c.v+'</v></c>';
  if(typeof c.v==='boolean')return '<c r="'+ref+'"'+s+' t="b"><v>'+(c.v?1:0)+'</v></c>';
  return '<c r="'+ref+'"'+s+' t="inlineStr"><is><t xml:space="preserve">'+x(c.v)+'</t></is></c>';
}
function sheetXml(sh){
  var h='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
  h+='<sheetViews><sheetView workbookViewId="0"'+(sh.active?' tabSelected="1"':'')+'>';
  if(sh.freeze&&sh.freezeCols)h+='<pane xSplit="'+sh.freezeCols+'" ySplit="'+sh.freeze+'" topLeftCell="'+colName(sh.freezeCols)+(sh.freeze+1)+'" activePane="bottomRight" state="frozen"/>';
  else if(sh.freeze)h+='<pane ySplit="'+sh.freeze+'" topLeftCell="A'+(sh.freeze+1)+'" activePane="bottomLeft" state="frozen"/>';
  h+='</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>';
  if(sh.cols&&sh.cols.length)h+='<cols>'+sh.cols.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';}).join('')+'</cols>';
  h+='<sheetData>'+(sh.rows||[]).map(function(row,r){
    var cells=(row||[]).map(function(c,i){return cellXml(colName(i)+(r+1),c);}).join('');
    return cells?'<row r="'+(r+1)+'">'+cells+'</row>':'';
  }).join('')+'</sheetData>';
  var dv=sh.validations||[];
  if(dv.length)h+='<dataValidations count="'+dv.length+'">'+dv.map(function(v){
    return '<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="'+(v.strict===false?0:1)+'"'+
      (v.strict===false?'':' errorTitle="Choose from the list" error="Pick a value from the drop-down list."')+' sqref="'+v.ref+'"><formula1>'+x(v.list)+'</formula1></dataValidation>';
  }).join('')+'</dataValidations>';
  return h+'<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>';
}
/* sheets: [{name, rows, cols, freeze (rows), freezeCols, validations:[{ref, list, strict}], hidden, active}] -> Blob */
function write(sheets){
  var NS='http://schemas.openxmlformats.org/';
  var files=[];
  files.push({name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="'+NS+'package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
    sheets.map(function(s,i){return '<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';}).join('')+'</Types>'});
  files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="'+NS+'package/2006/relationships"><Relationship Id="rId1" Type="'+NS+'officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'});
  var active=Math.max(0,sheets.findIndex(function(s){return s.active;}));
  files.push({name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="'+NS+'spreadsheetml/2006/main" xmlns:r="'+NS+'officeDocument/2006/relationships">'+
    '<bookViews><workbookView activeTab="'+active+'"/></bookViews><sheets>'+
    sheets.map(function(s,i){return '<sheet name="'+x(s.name)+'" sheetId="'+(i+1)+'"'+(s.hidden?' state="hidden"':'')+' r:id="rId'+(i+1)+'"/>';}).join('')+
    '</sheets><calcPr calcId="0" fullCalcOnLoad="1"/></workbook>'});
  files.push({name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="'+NS+'package/2006/relationships">'+
    sheets.map(function(s,i){return '<Relationship Id="rId'+(i+1)+'" Type="'+NS+'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>';}).join('')+
    '<Relationship Id="rId'+(sheets.length+1)+'" Type="'+NS+'officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'});
  files.push({name:'xl/styles.xml',data:STYLES});
  sheets.forEach(function(s,i){files.push({name:'xl/worksheets/sheet'+(i+1)+'.xml',data:sheetXml(s)});});
  return zip(files);
}

/* ---------- reader ---------- */
function xml(u8){
  var d=new DOMParser().parseFromString(dec.decode(u8),'application/xml');
  if(d.getElementsByTagName('parsererror').length)throw new Error('The workbook is damaged and cannot be read.');
  return d;
}
function tags(el,name){return Array.prototype.slice.call(el.getElementsByTagNameNS('*',name));}
function text(el){return tags(el,'t').filter(function(t){var p=t.parentNode;return !p||p.localName!=='rPh';}).map(function(t){return t.textContent;}).join('');}
function colIndex(ref){var m=/^([A-Z]+)/.exec(ref),n=0;for(var i=0;i<m[1].length;i++)n=n*26+m[1].charCodeAt(i)-64;return n-1;}
function resolve(base,target){
  if(target.charAt(0)==='/')return target.slice(1);
  var parts=base.split('/');parts.pop();
  target.split('/').forEach(function(p){if(p==='..')parts.pop();else if(p!=='.')parts.push(p);});
  return parts.join('/');
}
/* ArrayBuffer -> Promise<{sheets: {name: [[value]]}, names: [sheet names in order]}> */
function read(buf){
  return unzip(buf).then(function(files){
    if(!files['xl/workbook.xml'])throw new Error('Not an Excel workbook (.xlsx).');
    var wb=xml(files['xl/workbook.xml']),rels={},shared=[];
    if(files['xl/_rels/workbook.xml.rels'])tags(xml(files['xl/_rels/workbook.xml.rels']),'Relationship').forEach(function(r){rels[r.getAttribute('Id')]=resolve('xl/workbook.xml',r.getAttribute('Target'));});
    if(files['xl/sharedStrings.xml'])shared=tags(xml(files['xl/sharedStrings.xml']),'si').map(text);
    var out={sheets:{},names:[]};
    tags(wb,'sheet').forEach(function(sh){
      var rid=sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||sh.getAttribute('r:id');
      var path=rels[rid],name=sh.getAttribute('name');
      if(!path||!files[path])return;
      var rows=[];
      tags(xml(files[path]),'c').forEach(function(c){
        var ref=c.getAttribute('r');if(!ref)return;
        var r=parseInt(ref.replace(/^[A-Z]+/,''),10)-1,col=colIndex(ref),t=c.getAttribute('t'),v=tags(c,'v')[0],val=null;
        if(t==='s')val=v?shared[+v.textContent]:null;
        else if(t==='inlineStr')val=text(c);
        else if(t==='b')val=v?v.textContent==='1':null;
        else if(t==='str'||t==='e')val=v?v.textContent:null;
        else if(v){var nv=parseFloat(v.textContent);val=isFinite(nv)?nv:v.textContent;}
        (rows[r]=rows[r]||[])[col]=val;
      });
      out.sheets[name]=rows;out.names.push(name);
    });
    return out;
  });
}

window.XlsxLite={write:write,read:read,colName:colName,style:ST};
})();
