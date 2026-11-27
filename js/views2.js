/* ============ Explanations (admin) ============ */
const REASONS=['Low customer footfall','Stock or size not available','Section display or visual merchandising','Price, offer or discount issue','Leave, absence or day off','Training or product knowledge need','POS or system problem','Customer service or conversion','Personal reason','Other'];
function viewExplain(){
  const f=S.explFilter;let list=S.explanations.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  list=list.filter(x=>(!f.emp||x.empId===f.emp)&&(!f.status||x.status===f.status));
  const pend=S.requests.filter(r=>r.status==='open');
  return html`<div class="card"><div class="hd"><h3>Employee explanations</h3><div class="row">
   <select id="ef-emp" style="width:200px"><option value="">All employees</option>${staffList().map(s=>html`<option value="${s.id}" ${f.emp===s.id?'selected':''}>${s.name}</option>`)}</select>
   <select id="ef-st" style="width:130px"><option value="">Any status</option>${['open','reviewed','closed'].map(x=>html`<option ${f.status===x?'selected':''}>${x}</option>`)}</select>
   <button class="btn" data-act="exportExpl">Download report (Excel)</button></div></div>
   <p class="muted small" style="margin:0 0 10px">Only administrators can read or correct what employees submit. Employees cannot see each other's explanations.</p>
   ${pend.length?html`<div class="note warn" style="margin-bottom:10px"><b>${pend.length} awaiting a reply:</b> ${pend.map(r=>(S.staff[r.empId]||{}).name||r.empId).join(', ')}</div>`:''}
   ${list.length?list.map(x=>{const s=S.staff[x.empId]||{name:x.empId,id:x.empId};return html`<div style="border-top:1px solid var(--line);padding:12px 0"><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><div style="flex:1;min-width:0">${personCell(s)}</div>
    <div class="right small muted nowrap">${new Date(x.createdAt).toLocaleString('en-GB')}<br><span class="pill ${x.status==='open'?'warn':x.status==='reviewed'?'acc':'good'}">${x.status}</span></div></div>
    <div class="small muted" style="margin:6px 0">Period ${x.from?dLabel(x.from)+' – '+dLabelY(x.to):'–'} · ${(x.reasons||[]).join(', ')||'No reason selected'}${x.edited?' · edited by admin':''}</div>
    <div style="white-space:pre-wrap">${x.detail}</div>${x.plan?html`<div style="margin-top:6px"><span class="lab">Plan</span><div style="white-space:pre-wrap">${x.plan}</div></div>`:''}
    ${x.adminNote?html`<div class="note" style="margin-top:8px"><b>Admin note:</b> ${x.adminNote}</div>`:''}
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="editExpl" data-arg="${x.id}">Review / edit</button><button class="btn sm" data-act="profile" data-arg="${x.empId}">Open profile</button></div></div>`}):html`<div class="empty">No explanations yet.</div>`}</div>`;
}

/* ============ Reports ============ */
function reportRows(){
  const {from,to}=S.period;const R=S.rep;
  return staffList().filter(s=>(!R.section||s.section===R.section)&&(isActiveNow(s)||empMetrics(s.id,from,to).ach>0)).map(s=>({s,m:empMetrics(s.id,from,to)})).sort((a,b)=>(b.m.pct??-1)-(a.m.pct??-1));
}
function viewReports(){
  if(!hasData())return noData();
  const R=S.rep;const rows=reportRows();const secs=[...new Set(staffList().map(s=>s.section).filter(Boolean))];
  const ck=(k,l)=>html`<label class="row small"><input type="checkbox" data-rep="${k}" ${R.cols[k]?'checked':''} style="width:auto;min-height:0"> ${l}</label>`;
  const tot=rows.reduce((a,x)=>({t:a.t+x.m.target,a:a.a+x.m.ach,i:a.i+x.m.inv,b:a.b+x.m.big}),{t:0,a:0,i:0,b:0});
  return html`${periodBar()}
  <div class="card"><div class="hd"><h3>Summary report for management</h3><div class="row"><button class="btn pri" data-act="exportXlsx" ${S.busy?'disabled':''}>Download Excel</button><button class="btn pri" data-act="exportPdf" ${S.busy?'disabled':''}>Download PDF</button></div></div>
   <div class="form"><div class="f"><label for="rp-title">Report title</label><input id="rp-title" value="${R.title}"></div>
   <div class="f"><label for="rp-sec">Section</label><select id="rp-sec"><option value="">All sections</option>${secs.map(x=>html`<option ${R.section===x?'selected':''}>${x}</option>`)}</select></div>
   <div class="f full"><span class="lab">Include</span><div class="row">${ck('photo','Photo')}${ck('personal','Personal details')}${ck('target','Target and achievement')}${ck('sales','Invoices, average bill, units')}${ck('bb','Big basket and bill-size slabs')}</div></div></div>
   <p class="muted small" style="margin:10px 0 0">The report covers <b>${periodLabel()}</b>. Change the period above before downloading.</p></div>
  <div class="card"><h3>Preview</h3><div class="tw"><table><thead><tr>${R.cols.photo?html`<th>Photo</th>`:''}<th>Employee</th><th>Designation</th><th>Section</th>${R.cols.personal?html`<th>Joining</th><th>Mobile</th>`:''}${R.cols.target?html`<th class="r">Target</th><th class="r">Achieved</th><th class="r">Ach %</th>`:''}${R.cols.sales?html`<th class="r">Invoices</th><th class="r">Avg bill</th><th class="r">UPT</th>`:''}${R.cols.bb?html`<th class="r">10K+</th>`:''}</tr></thead><tbody>
   ${rows.map(({s,m})=>html`<tr>${R.cols.photo?html`<td>${avatar(s)}</td>`:''}<td><b>${s.name}</b><br><span class="muted small">${s.id}</span></td><td>${s.designation}</td><td>${s.section}</td>${R.cols.personal?html`<td class="nowrap">${s.joining?dLabelY(s.joining):''}</td><td>${s.mobile||''}</td>`:''}${R.cols.target?html`<td class="r num">${fmt(m.target)}</td><td class="r num">${fmt(m.ach)}</td><td class="r num"><b>${pct(m.pct,1)}</b></td>`:''}${R.cols.sales?html`<td class="r num">${m.inv}</td><td class="r num">${fmt(m.atv)}</td><td class="r num">${m.upt.toFixed(2)}</td>`:''}${R.cols.bb?html`<td class="r num">${m.big}</td>`:''}</tr>`)}</tbody>
   <tfoot><tr>${R.cols.photo?html`<td></td>`:''}<td>Total</td><td></td><td></td>${R.cols.personal?html`<td></td><td></td>`:''}${R.cols.target?html`<td class="r num">${fmt(tot.t)}</td><td class="r num">${fmt(tot.a)}</td><td class="r num">${tot.t?pct(tot.a/tot.t*100,1):'–'}</td>`:''}${R.cols.sales?html`<td class="r num">${tot.i}</td><td class="r num">${tot.i?fmt(tot.a/tot.i):'–'}</td><td></td>`:''}${R.cols.bb?html`<td class="r num">${tot.b}</td>`:''}</tr></tfoot></table></div></div>`;
}
async function buildXlsx(){
  await loadLib(LIB.excel);const {from,to}=S.period,R=S.rep,rows=reportRows();
  const wb=new ExcelJS.Workbook();wb.creator=cfg().outlet;
  const ws=wb.addWorksheet('Summary',{views:[{state:'frozen',ySplit:5}]});
  const cols=[];if(R.cols.photo)cols.push({h:'Photo',w:9});cols.push({h:'Sl',w:5},{h:'Employee',w:28},{h:'ID',w:10},{h:'Designation',w:13},{h:'Section',w:11});
  if(R.cols.personal)cols.push({h:'Joining',w:12},{h:'Mobile',w:14});
  if(R.cols.target)cols.push({h:'Target',w:13},{h:'Achieved',w:13},{h:'Ach %',w:9});
  if(R.cols.sales)cols.push({h:'Invoices',w:10},{h:'Avg bill',w:10},{h:'UPT',w:7});
  if(R.cols.bb){cols.push({h:'Big basket 10K+',w:12});if(R.slabs)SLABS.forEach(s=>cols.push({h:'≥ '+s/1000+'K',w:8}))}
  ws.columns=cols.map(c=>({width:c.w}));
  ws.mergeCells(1,1,1,cols.length);ws.getCell(1,1).value=`${R.title} · ${cfg().outlet}`;ws.getCell(1,1).font={bold:true,size:16,color:{argb:'FF0C3B5E'}};
  ws.mergeCells(2,1,2,cols.length);ws.getCell(2,1).value=`Period: ${periodLabel()}   |   Basis: ${cfg().basis==='ex'?'sales ex-VAT':cfg().basis==='net'?'net sales incl. VAT':'gross sales'}   |   Generated ${new Date().toLocaleString('en-GB')}`;ws.getCell(2,1).font={color:{argb:'FF5A6D82'}};
  const hr=ws.getRow(4);hr.values=cols.map(c=>c.h);hr.height=24;hr.eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0C3B5E'}};c.alignment={vertical:'middle',horizontal:'center',wrapText:true}});
  let r=5;
  for(const [i,{s,m}] of rows.entries()){
    const v=[];if(R.cols.photo)v.push('');v.push(i+1,s.name,+s.id,s.designation||'',s.section||'');
    if(R.cols.personal)v.push(s.joining||'',s.mobile||'');
    if(R.cols.target)v.push(Math.round(m.target),Math.round(m.ach),m.pct==null?null:+(m.pct/100).toFixed(4));
    if(R.cols.sales)v.push(m.inv,Math.round(m.atv),+m.upt.toFixed(2));
    if(R.cols.bb){v.push(m.sl[1]);if(R.slabs)SLABS.forEach((x,k)=>v.push(m.sl[k]))}
    const row=ws.getRow(r);row.values=v;row.height=R.cols.photo?44:20;row.alignment={vertical:'middle'};
    if(R.cols.photo&&s.photo){const id=wb.addImage({base64:s.photo,extension:'jpeg'});ws.addImage(id,{tl:{col:0.1,row:r-1+0.08},ext:{width:48,height:48}})}
    r++;
  }
  const first=5,last=r-1;const ci=n=>cols.findIndex(c=>c.h===n)+1;
  if(R.cols.target){ws.getColumn(ci('Target')).numFmt='#,##0';ws.getColumn(ci('Achieved')).numFmt='#,##0';ws.getColumn(ci('Ach %')).numFmt='0.0%'}
  if(R.cols.sales)ws.getColumn(ci('Avg bill')).numFmt='#,##0';
  const tr=ws.getRow(r);tr.getCell(R.cols.photo?3:2).value='TOTAL';
  if(R.cols.target){const c1=ci('Target'),c2=ci('Achieved'),c3=ci('Ach %');const L=n=>ws.getColumn(n).letter;
    tr.getCell(c1).value={formula:`SUM(${L(c1)}${first}:${L(c1)}${last})`};tr.getCell(c2).value={formula:`SUM(${L(c2)}${first}:${L(c2)}${last})`};tr.getCell(c3).value={formula:`IF(${L(c1)}${r}=0,0,${L(c2)}${r}/${L(c1)}${r})`};tr.getCell(c3).numFmt='0.0%';tr.getCell(c1).numFmt='#,##0';tr.getCell(c2).numFmt='#,##0'}
  if(R.cols.sales){const c=ci('Invoices'),L=ws.getColumn(c).letter;tr.getCell(c).value={formula:`SUM(${L}${first}:${L}${last})`}}
  if(R.cols.bb){const c=ci('Big basket 10K+'),L=ws.getColumn(c).letter;tr.getCell(c).value={formula:`SUM(${L}${first}:${L}${last})`}}
  tr.font={bold:true};tr.eachCell({includeEmpty:true},c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEEF2F6'}}});
  if(R.cols.target){const c=ci('Ach %');ws.addConditionalFormatting({ref:`${ws.getColumn(c).letter}${first}:${ws.getColumn(c).letter}${last}`,rules:[{type:'cellIs',operator:'greaterThanOrEqual',formulae:[1],style:{fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFE1F4E7'}}}},{type:'cellIs',operator:'lessThan',formulae:[cfg().poorBelow/100],style:{fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFFBE0E1'}}}}]})}
  return wb.xlsx.writeBuffer();
}
async function buildPdf(){
  await loadLib(LIB.pdf);await loadLib(LIB.pdft);const {jsPDF}=window.jspdf;const R=S.rep,rows=reportRows();
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(12,59,94);doc.text(`${R.title} · ${cfg().outlet}`,12,14);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(90,109,130);doc.text(`Period: ${periodLabel()}   |   Basis: ${cfg().basis==='ex'?'sales ex-VAT':cfg().basis==='net'?'net sales incl. VAT':'gross sales'}   |   Generated ${new Date().toLocaleString('en-GB')}`,12,20);
  const head=[];if(R.cols.photo)head.push('Photo');head.push('Employee','Designation','Section');if(R.cols.personal)head.push('Joining','Mobile');
  if(R.cols.target)head.push('Target','Achieved','Ach %');if(R.cols.sales)head.push('Inv','Avg bill','UPT');if(R.cols.bb)head.push('10K+');
  const num=n=>fmt(n);
  const body=rows.map(({s,m})=>{const r=[];if(R.cols.photo)r.push('');r.push(`${s.name}\n${s.id}`,s.designation||'',s.section||'');if(R.cols.personal)r.push(s.joining?dLabelY(s.joining):'',s.mobile||'');
    if(R.cols.target)r.push(num(m.target),num(m.ach),pct(m.pct,1));if(R.cols.sales)r.push(String(m.inv),num(m.atv),m.upt.toFixed(2));if(R.cols.bb)r.push(String(m.sl[1]));return r});
  const tot=rows.reduce((a,x)=>({t:a.t+x.m.target,a:a.a+x.m.ach,i:a.i+x.m.inv,b:a.b+x.m.big}),{t:0,a:0,i:0,b:0});
  const fr=[];if(R.cols.photo)fr.push('');fr.push('TOTAL','','');if(R.cols.personal)fr.push('','');if(R.cols.target)fr.push(num(tot.t),num(tot.a),tot.t?pct(tot.a/tot.t*100,1):'–');if(R.cols.sales)fr.push(String(tot.i),tot.i?num(tot.a/tot.i):'–','');if(R.cols.bb)fr.push(String(tot.b));
  const pctCol=head.indexOf('Ach %');
  doc.autoTable({head:[head],body:[...body,fr],startY:25,theme:'grid',styles:{fontSize:8,cellPadding:1.6,valign:'middle',lineColor:[217,226,236],lineWidth:.1,minCellHeight:R.cols.photo?13:7},headStyles:{fillColor:[12,59,94],textColor:255,halign:'center'},
    margin:{left:12,right:12},columnStyles:Object.fromEntries(head.map((h,i)=>[i,{halign:['Target','Achieved','Ach %','Inv','Avg bill','UPT','10K+'].includes(h)?'right':'left',cellWidth:h==='Photo'?14:'auto'}])),
    didParseCell:d=>{if(d.row.index===body.length){d.cell.styles.fontStyle='bold';d.cell.styles.fillColor=[238,242,246]}
      if(d.section==='body'&&d.column.index===pctCol&&d.row.index<body.length){const p=rows[d.row.index].m.pct;if(p!=null){d.cell.styles.textColor=p>=100?[23,128,61]:p<cfg().poorBelow?[180,35,42]:[169,106,8];d.cell.styles.fontStyle='bold'}}},
    didDrawCell:d=>{if(R.cols.photo&&d.section==='body'&&d.column.index===0&&d.row.index<body.length){const s=rows[d.row.index].s;if(s.photo){try{doc.addImage(s.photo,'JPEG',d.cell.x+1,d.cell.y+0.8,11.4,11.4)}catch(e){}}}}});
  const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(120);doc.text(`Page ${i} of ${n}`,285,205,{align:'right'})}
  return doc.output('arraybuffer');
}
async function buildExplXlsx(){
  await loadLib(LIB.excel);const wb=new ExcelJS.Workbook();const ws=wb.addWorksheet('Explanations');
  ws.columns=[{header:'Date',width:18},{header:'Employee',width:26},{header:'ID',width:10},{header:'Period',width:22},{header:'Reasons',width:34},{header:'Explanation',width:60},{header:'Plan',width:40},{header:'Status',width:10},{header:'Admin note',width:36}];
  ws.getRow(1).eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0C3B5E'}}});
  S.explanations.slice().sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||'')).forEach(x=>{const s=S.staff[x.empId]||{};ws.addRow([new Date(x.createdAt).toLocaleString('en-GB'),s.name||'',x.empId,x.from?`${x.from} to ${x.to}`:'',(x.reasons||[]).join(', '),x.detail,x.plan||'',x.status,x.adminNote||''])});
  ws.eachRow(r=>r.alignment={vertical:'top',wrapText:true});return wb.xlsx.writeBuffer();
}

/* ============ Settings ============ */
function viewSettings(){
  const c=cfg();const dw=Object.entries(c.desigWeights),sf=Object.entries(c.sectionFactors);
  return html`<div class="grid g2"><div class="card"><h3>Outlet</h3><div class="form">
   <div class="f full"><label for="s-outlet">Outlet name</label><input id="s-outlet" value="${c.outlet}"></div>
   <div class="f"><label for="s-basis">Sales figure used for achievement</label><select id="s-basis">${[['ex','Net sales excluding VAT'],['net','Net sales including VAT'],['gross','Gross (before discount)']].map(([v,l])=>html`<option value="${v}" ${c.basis===v?'selected':''}>${l}</option>`)}</select></div>
   <div class="f"><label for="s-poor">Needs attention below (% of target)</label><input id="s-poor" type="number" min="1" max="100" value="${c.poorBelow}"></div>
   <div class="full"><button class="btn pri" data-act="saveCfg">Save</button></div></div>
   <p class="small muted">Your Achievement file and the sales export do not agree on one figure, so the basis is selectable. The default is net sales excluding VAT. Changing it recalculates everything.</p></div>
  <div class="card"><h3>Admin password</h3><div class="form"><div class="f"><label for="pw-new">New password</label><input id="pw-new" type="password" autocomplete="new-password"></div><div class="f"><label for="pw-old">Current password</label><input id="pw-old" type="password" autocomplete="current-password"></div>
   <div class="full"><button class="btn pri" data-act="changePw">Change password</button></div></div></div></div>
  <div class="grid g2"><div class="card"><h3>Target share by designation</h3><p class="small muted" style="margin:0 0 8px">Starting weight used by "Use suggested shares".</p><div class="form">${dw.map(([k,v])=>html`<div class="f"><label for="dw-${k}">${k}</label><input class="dwi" id="dw-${k}" data-k="${k}" type="number" step="0.5" min="0" value="${v}"></div>`)}</div>
   <div class="row" style="margin-top:10px"><input id="dw-new" placeholder="New designation" style="width:170px"><button class="btn sm" data-act="addDesig">Add</button><span class="sp"></span><button class="btn pri" data-act="saveDesig">Save</button></div></div>
  <div class="card"><h3>Section factor</h3><p class="small muted" style="margin:0 0 8px">1.0 is neutral. Use above 1 for busier sections.</p><div class="form">${sf.map(([k,v])=>html`<div class="f"><label for="sf-${k}">${k}</label><input class="sfi" id="sf-${k}" data-k="${k}" type="number" step="0.05" min="0" value="${v}"></div>`)}</div>
   <div class="row" style="margin-top:10px"><input id="sf-new" placeholder="New section" style="width:170px"><button class="btn sm" data-act="addSec">Add</button><span class="sp"></span><button class="btn pri" data-act="saveSec">Save</button></div></div></div>
  <div class="card"><div class="hd"><h3>Employee access codes</h3><div class="row"><button class="btn sm" data-act="genMissing">Create missing codes</button></div></div>
   <p class="small muted" style="margin:0 0 8px">Give each employee their ID and code. They sign in on the Employee tab. Codes can be reset at any time.</p>
   <div class="tw"><table><thead><tr><th>Employee</th><th>ID</th><th>Access code</th><th></th></tr></thead><tbody>${staffList().filter(isActiveNow).map(s=>html`<tr><td>${s.name}</td><td>${s.id}</td><td class="num"><b>${S.codes[s.id]||'—'}</b></td><td class="r"><button class="btn sm" data-act="resetCode" data-arg="${s.id}">Reset</button></td></tr>`)}</tbody></table></div></div>
  <div class="card"><h3>Starter data</h3><p class="small muted" style="margin:0 0 8px">Loads the staff, photos, targets and sales from the files you shared. Existing records with the same ID or month are overwritten.</p><button class="btn" data-act="seed" ${S.busy?'disabled':''}>${S.busy||'Load starter data'}</button></div>`;
}

/* ============ Profile drawer ============ */
function periodRows(emp){
  const A=S.asOf;const defs=[['Today',A,A],['This week',weekStart(A),A],['This month',mk(A)+'-01',A],['This quarter',qStart(A),A],[fyLabel(A),fyStart(A),A]];
  return defs.map(([l,a,b])=>({l,a,b,m:empMetrics(emp,a,b)}));
}
function perfBlock(emp){
  const st=S.staff[emp];const P=periodRows(emp);const need=remainingNeed(emp);const mo=P[2].m;
  const days=rangeDays(addDays(S.asOf,-13),S.asOf);
  return html`<div class="card"><div class="row" style="flex-wrap:nowrap;gap:16px"><div class="ring" style="--p:${Math.min(100,mo.pct||0)};--c:var(--${band(mo.pct).k==='na'?'accent':band(mo.pct).k})"><b>${mo.pct==null?'–':Math.round(mo.pct)+'%'}</b></div>
   <div style="min-width:0"><div class="lab">This month · ${monthLabel(mk(S.asOf))}</div><div class="num" style="font:700 22px var(--f-disp)">${taka(mo.ach)} <span class="muted" style="font-size:14px;font-weight:500">of ${taka(need?need.full:mo.target)}</span></div>
   <div class="small muted">${need?(need.done?'Month target already reached.':`Needs ${taka(need.perDay)} per working day for the remaining ${need.days} days.`):'No target set for this month.'}</div></div></div></div>
  <div class="card"><h3>Evaluation by period</h3><div class="tw"><table><thead><tr><th>Period</th><th class="r">Target</th><th class="r">Achieved</th><th class="r">Ach %</th><th>Grade</th><th class="r">Invoices</th><th class="r">Avg bill</th><th class="r">10K+</th></tr></thead><tbody>
   ${P.map(p=>html`<tr><td><b>${p.l}</b></td><td class="r num">${short(p.m.target)}</td><td class="r num">${short(p.m.ach)}</td><td class="r num"><b>${pct(p.m.pct)}</b></td><td>${pillB(p.m.pct)}</td><td class="r num">${p.m.inv}</td><td class="r num">${p.m.inv?fmt(p.m.atv):'–'}</td><td class="r num">${p.m.big}</td></tr>`)}</tbody></table></div></div>
  <div class="card"><h3>Last 14 days</h3><div class="tw"><table class="matrix"><thead><tr><th>Day</th>${days.map(d=>html`<th>${+d.slice(8)}<br><span style="font-weight:400">${WD[dowOf(d)].slice(0,2)}</span></th>`)}</tr></thead><tbody>
   <tr><td>Target</td>${days.map(d=>{const v=((dayTargets(mk(d))[emp]||[])[+d.slice(8)])||0;return html`<td class="${v?'':'off'}">${v?(v/1000).toFixed(1)+'k':'off'}</td>`})}</tr>
   <tr><td>Sales</td>${days.map(d=>{const v=(S.rows[emp]||[]).filter(r=>r.d===d).reduce((a,r)=>a+r.amt,0);const t=((dayTargets(mk(d))[emp]||[])[+d.slice(8)])||0;return html`<td style="color:${t&&v>=t?'var(--good)':'var(--ink)'};font-weight:${t&&v>=t?700:400}">${v?(v/1000).toFixed(1)+'k':'–'}</td>`})}</tr></tbody></table></div></div>`;
}
function detailsForm(st,isNew){
  const f=(id,l,v,t='text',full)=>html`<div class="f ${full?'full':''}"><label for="sd-${id}">${l}</label><input id="sd-${id}" type="${t}" value="${v??''}"></div>`;
  const D=S.drawer;
  const sel=(id,l,opts,v)=>html`<div class="f"><label for="sd-${id}">${l}</label><select id="sd-${id}">${opts.map(o=>html`<option ${o===v?'selected':''}>${o}</option>`)}</select></div>`;
  const photo=(D&&D.photo!==undefined?D.photo:st.photo)||'';
  const desig=[...new Set([...Object.keys(cfg().desigWeights),st.designation].filter(Boolean))],secs=[...new Set([...Object.keys(cfg().sectionFactors),st.section].filter(Boolean))];
  return html`<div class="card"><div class="row" style="margin-bottom:12px"><span class="av lg">${photo?html`<img src="${photo}" alt="">`:initials(st.name)}</span>
   <div><button class="btn sm" data-act="pickPhoto">Upload photo</button> ${photo?html`<button class="btn sm danger" data-act="clearPhoto">Remove</button>`:''}<div class="small muted" style="margin-top:4px">Square photos work best. It is resized automatically.</div></div><input type="file" id="sd-photo" accept="image/*" hidden></div>
   <h3 style="margin-bottom:8px">Professional</h3><div class="form">${f('name','Full name',st.name)}${f('id','Employee ID',st.id,'text')}${sel('designation','Designation',desig,st.designation)}${sel('section','Section',secs,st.section)}
   ${f('joining','Joining date',st.joining,'date')}${sel('status','Status',['Continue','Resigned'],st.status||'Continue')}${f('resign','Resign date',st.resign,'date')}${sel('dayOff','Weekly day off',['',...WD],st.dayOff||'')}${f('emptype','Employment type',st.emptype)}${f('prevexp','Previous experience',st.prevexp)}</div>
   <h3 style="margin:16px 0 8px">Personal</h3><div class="form">${f('mobile','Mobile',st.mobile)}${f('email','Email',st.email,'email')}${f('dob','Date of birth',st.dob,'date')}${f('blood','Blood group',st.blood)}${f('emergency','Emergency contact',st.emergency)}${f('education','Education',st.education)}${f('address','Address',st.address,'text',1)}
   <div class="f full"><label for="sd-notes">Notes (admin only)</label><textarea id="sd-notes">${st.notes||''}</textarea></div></div>
   <div class="row" style="margin-top:14px"><button class="btn pri" data-act="saveStaff" data-arg="${isNew?'new':st.id}">Save profile</button>${isNew?'':html`<button class="btn" data-act="resetCode" data-arg="${st.id}">New access code</button>`}</div></div>`;
}
function followBlock(emp){
  const list=S.followups.filter(x=>x.empId===emp).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return html`<div class="card"><h3>Log a conversation</h3><div class="form">
   <div class="f"><label for="fu-date">Date</label><input id="fu-date" type="date" value="${todayISO()}"></div><div class="f"><label for="fu-next">Next follow-up</label><input id="fu-next" type="date"></div>
   <div class="f full"><label for="fu-topic">Discussed</label><textarea id="fu-topic" placeholder="Target achievement, reasons, support needed…"></textarea></div>
   <div class="f full"><label for="fu-commit">Employee's commitment</label><input id="fu-commit" placeholder="e.g. 25K per day this week"></div>
   <div class="full row"><button class="btn pri" data-act="saveFollow" data-arg="${emp}">Save note</button><button class="btn" data-act="askExpl" data-arg="${emp}">Ask for written explanation</button></div></div></div>
  <div class="card"><h3>History</h3>${list.length?list.map(x=>html`<div style="border-top:1px solid var(--line);padding:10px 0"><div class="small muted">${dLabelY(x.date)}${x.next?' · next follow-up '+dLabelY(x.next):''}${x.at?` · at ${E(x.atPct)}% of target`:''}</div><div style="white-space:pre-wrap">${x.topic}</div>${x.commit?html`<div class="small"><b>Commitment:</b> ${x.commit}</div>`:''}</div>`):html`<div class="empty">No conversations logged yet.</div>`}</div>`;
}
function viewDrawer(){
  const D=S.drawer;if(!D)return '';const base=D.emp==='new'?(D.draft||{}):S.staff[D.emp];if(!base)return '';const st=Object.assign({},base,D.formDraft||{});
  const isNew=D.emp==='new';const tab=isNew?'details':D.tab;
  const ex=S.explanations.filter(x=>x.empId===D.emp);
  const tabs=isAdmin()?[['perf','Performance'],['follow','Follow-up'],['expl','Explanations ('+ex.length+')'],['details','Details']]:[['perf','Performance'],['details','Details']];
  return html`<div class="ov" data-act="closeDrawer"><div class="drawer" role="dialog" aria-label="Staff profile" id="drawer">
   <div class="row" style="flex-wrap:nowrap"><div class="row" style="flex:1;min-width:0;flex-wrap:nowrap">${avatar(st,'lg')}<div style="min-width:0"><h2>${st.name||'New staff'}</h2><div class="muted">${st.designation||''}${st.section?' · '+st.section:''}</div><div class="small muted">ID ${st.id||'–'}${st.joining?' · joined '+dLabelY(st.joining):''}${st.mobile?' · '+st.mobile:''}</div></div></div><button class="btn" data-act="closeDrawer">Close</button></div>
   ${isNew?'':html`<div class="sub">${tabs.map(([k,l])=>html`<button class="${tab===k?'on':''}" data-act="dtab" data-arg="${k}">${l}</button>`)}</div>`}
   ${tab==='perf'?perfBlock(D.emp):tab==='follow'?followBlock(D.emp):tab==='expl'?html`<div class="card">${ex.length?ex.map(x=>html`<div style="border-top:1px solid var(--line);padding:10px 0"><div class="small muted">${new Date(x.createdAt).toLocaleString('en-GB')} · ${x.status} · ${(x.reasons||[]).join(', ')}</div><div style="white-space:pre-wrap">${x.detail}</div><button class="btn sm" data-act="editExpl" data-arg="${x.id}" style="margin-top:6px">Review / edit</button></div>`):html`<div class="empty">No explanations from this employee.</div>`}</div>`:isAdmin()?detailsForm(st,isNew):readOnlyDetails(st)}
  </div></div>`;
}
function readOnlyDetails(st){const kv=[['Employee ID',st.id],['Designation',st.designation],['Section',st.section],['Joining date',st.joining?dLabelY(st.joining):''],['Day off',st.dayOff],['Mobile',st.mobile],['Email',st.email]];return html`<div class="card"><dl class="kv">${kv.map(([k,v])=>html`<dt>${k}</dt><dd>${v||'–'}</dd>`)}</dl></div>`}

/* ============ modals ============ */
function viewModal(){
  const M=S.modal;if(!M)return '';
  if(M.kind==='ask'){const s=S.staff[M.emp];return html`<div class="ov ovc" data-act="closeModal"><div class="modal" id="modal"><h3>Ask ${s.name} for an explanation</h3>
   <div class="f"><label for="rq-msg">Question</label><textarea id="rq-msg">Your sales target is not being met. Please explain what is stopping you and what you will do about it.</textarea></div>
   <div class="f"><label for="rq-due">Reply by</label><input id="rq-due" type="date" value="${addDays(todayISO(),2)}"></div>
   <div class="row"><button class="btn pri" data-act="sendAsk" data-arg="${M.emp}">Send request</button><button class="btn" data-act="closeModal">Cancel</button></div></div></div>`}
  if(M.kind==='expl'){const x=S.explanations.find(e=>e.id===M.id);if(!x)return '';const s=S.staff[x.empId]||{name:x.empId};return html`<div class="ov ovc" data-act="closeModal"><div class="modal" id="modal"><h3>${s.name}</h3>
   <div class="f"><label for="ex-detail">Explanation (admin may correct)</label><textarea id="ex-detail" style="min-height:120px">${x.detail}</textarea></div>
   <div class="f"><label for="ex-plan">Plan</label><textarea id="ex-plan">${x.plan||''}</textarea></div>
   <div class="f"><label for="ex-note">Admin note</label><textarea id="ex-note">${x.adminNote||''}</textarea></div>
   <div class="f"><label for="ex-status">Status</label><select id="ex-status">${['open','reviewed','closed'].map(v=>html`<option ${x.status===v?'selected':''}>${v}</option>`)}</select></div>
   <div class="row"><button class="btn pri" data-act="saveExpl" data-arg="${x.id}">Save</button><button class="btn" data-act="closeModal">Cancel</button></div></div></div>`}
  return '';
}

/* ============ employee ============ */
function viewEmpHome(){
  const st=S.staff[S.empId];if(!st)return '';const {from,to}=S.period;
  const m=empMetrics(st.id,from,to);const td=empMetrics(st.id,S.asOf,S.asOf);
  const peers=staffList().filter(isActiveNow).map(s=>({id:s.id,p:empMetrics(s.id,from,to).pct})).filter(x=>x.p!=null).sort((a,b)=>b.p-a.p);const rank=peers.findIndex(x=>x.id===st.id)+1;
  const req=S.requests.filter(r=>r.empId===st.id&&r.status==='open');
  const first=st.name.split(' ')[0];
  return html`${req.map(r=>html`<div class="note warn"><b>Management has asked for your explanation.</b> ${r.message}${r.due?html` <span class="muted">Reply by ${dLabelY(r.due)}.</span>`:''} <button class="btn sm pri" data-act="empnav" data-arg="explainme" data-req="${r.id}">Respond now</button></div>`)}
  <div class="card"><div class="row" style="flex-wrap:nowrap;gap:14px">${avatar(st,'lg')}<div style="min-width:0"><h2>Hello, ${first}</h2><div class="muted">${st.designation} · ${st.section}</div><div class="small muted">Sales data up to ${dLabelY(S.asOf)}</div></div></div></div>
  ${periodBar()}
  <div class="kpis"><div class="kpi"><div class="l">My target</div><div class="v">${taka(m.target)}</div></div><div class="kpi"><div class="l">My sales</div><div class="v">${taka(m.ach)}</div><div class="s">${pct(m.pct,1)} achieved</div></div>
   <div class="kpi"><div class="l">Status</div><div class="v" style="font-size:19px">${pillB(m.pct)}</div><div class="s">${rank?`Rank ${rank} of ${peers.length}`:''}</div></div>
   <div class="kpi"><div class="l">Today</div><div class="v">${taka(td.ach)}</div><div class="s">target ${taka(td.target)}</div></div>
   <div class="kpi"><div class="l">Invoices</div><div class="v">${m.inv}</div><div class="s">avg bill ${taka(m.atv)}</div></div><div class="kpi"><div class="l">Big baskets (10K+)</div><div class="v">${m.big}</div></div></div>
  ${perfBlock(st.id)}`;
}
function viewEmpExplain(){
  const st=S.staff[S.empId];const req=S.requests.filter(r=>r.empId===st.id&&r.status==='open');const rid=S.reqPick||(req[0]&&req[0].id)||'';const pick=req.find(r=>r.id===rid);
  const A=S.asOf;
  return html`${S.justSent?html`<div class="note"><b>Submitted.</b> Your explanation reached management (reference ${S.justSent}). It cannot be changed by you or seen by other employees.</div>`:''}
  <div class="card"><h3>Explain your target performance</h3>
  ${pick?html`<div class="note warn" style="margin-bottom:10px"><b>Management asked:</b> ${pick.message}</div>`:''}
  <div class="form"><div class="f"><label for="xp-from">From</label><input id="xp-from" type="date" value="${mk(A)}-01"></div><div class="f"><label for="xp-to">To</label><input id="xp-to" type="date" value="${A}"></div>
   <div class="f full"><span class="lab">What is affecting your sales? (select all that apply)</span><div class="row">${REASONS.map((r,i)=>html`<label class="row small" style="width:min(100%,300px)"><input type="checkbox" class="xr" value="${r}" style="width:auto;min-height:0"> ${r}</label>`)}</div></div>
   <div class="f full"><label for="xp-detail">Explain in detail</label><textarea id="xp-detail" style="min-height:120px" placeholder="What happened, how often, and what support you need"></textarea></div>
   <div class="f full"><label for="xp-plan">What will you do to improve?</label><textarea id="xp-plan"></textarea></div>
   <div class="full"><button class="btn pri" data-act="submitExpl" data-req="${pick?pick.id:''}">Submit to management</button> <span class="small muted">Once submitted, only an administrator can edit it.</span></div></div></div>`;
}
