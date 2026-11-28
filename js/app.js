/* ============ render ============ */
function render(){
  const app=$('#app');if(!app)return;const sy=window.scrollY;let out;
  if(!S.ready||(S.db&&!S.cfgLoaded))out=viewLoading();
  else if(!S.db)out=viewNoDb();
  else if(!S.cfg)out=viewSetup();
  else if(!S.role)out=viewLogin();
  else{
    if(S.role==='emp'&&(!S.staff[S.empId]||!canLogin(S.staff[S.empId])||!cfg().staffOpen)){S.role=null;S.empId=null;ssSet('sess',null);setTimeout(()=>toast('Your access has been closed. Please contact your in-charge.',true),50);return render()}
    let v;
    if(isAdmin()){v={overview:viewOverview,team:viewTeam,targets:viewTargets,data:viewData,bigbasket:viewBig,watch:viewWatch,explain:viewExplain,reports:viewReports,settings:viewSettings}[S.view]();}
    else{if(!empTabs().some(t=>t[0]===S.empTab))S.empTab='home';
    if(S.empTab==='home')v=viewEmpHome();
    else if(S.empTab==='explainme')v=viewEmpExplain();
    else if(S.empTab==='outlet')v=viewOverview({outlet:sees('outlet'),board:sees('board')});
    else if(S.empTab==='bb')v=viewBig(S.empId);
    else if(S.empTab==='coach')v=viewEmpCoach();
    else if(S.empTab==='reports')v=viewReports();
    else{const st=S.staff[S.empId];v=st?html`<div class="card"><div class="row" style="margin-bottom:12px">${avatar(st,'lg')}<div><h2>${st.name}</h2><div class="muted">${st.designation} · ${st.section}</div></div></div></div>${readOnlyDetails(st)}`:'';}}
    const warn=isAdmin()&&!(window.claude&&window.claude.shared)?html`<div class="note bad" style="border-left-color:var(--crit);background:var(--crit-soft);margin-bottom:12px"><b>This device only.</b> The shared database is not connected, so employees cannot see this data on their own phones yet. Add the Supabase keys in <code>js/config.js</code>.</div>`:'';
    out=html`${masthead()}<main>${warn}${v}</main>${viewDrawer()}${viewModal()}`;
  }
  app.innerHTML=val(out);
  if(lang()==='bn')applyLang(app);document.documentElement.lang=lang();
  if(sy)window.scrollTo(0,sy);
  /* day-by-day history opens on the latest days; a position the user scrolled to is kept until the view changes */
  $$('[data-hs]',app).forEach(el=>{const k=el.dataset.hs,v=S.hscroll[k];el.scrollLeft=v==null||v==='end'?el.scrollWidth:v});
}
document.addEventListener('scroll',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.hs){S.hscroll[t.dataset.hs]=t.scrollLeft+t.clientWidth>=t.scrollWidth-4?'end':t.scrollLeft}},true);
function openProfile(id,tab){S.hscroll={};S.drawer={emp:id,tab:tab||'perf',photo:undefined,formDraft:null};schedule()}

/* ============ parsing uploads ============ */
const serialToISO=v=>fmtISO(new Date(Math.round((Math.floor(v)-25569)*DAY)));
function toISO(v){
  if(v==null||v==='')return null;if(v instanceof Date)return fmtISO(new Date(Date.UTC(v.getFullYear(),v.getMonth(),v.getDate())));
  if(typeof v==='number')return serialToISO(v);
  const s=String(v).trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);if(m)return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;return null;
}
async function sheetRows(file){await loadLib(LIB.xlsx);const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];return XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null})}
async function parseSales(file){
  const rows=await sheetRows(file);const hi=rows.findIndex(r=>r&&r.some(c=>String(c||'').trim().toUpperCase()==='INVOICE_NO'));
  if(hi<0)throw new Error('This does not look like the Executive Wise Sales Data file. The header row with INVOICE_NO was not found.');
  const H=rows[hi].map(c=>String(c||'').trim().toUpperCase());const ix=n=>H.indexOf(n);
  const need=['DATE','EMPLOYEE_NAME','INVOICE_NO','TOTAL','NET AMT','VAT AMT','SALE QTY','RQTY'];const miss=need.filter(n=>ix(n)<0);
  if(miss.length)throw new Error('Missing columns: '+miss.join(', '));
  const c={d:ix('DATE'),e:ix('EMPLOYEE_NAME'),i:ix('INVOICE_NO'),t:ix('TOTAL'),n:ix('NET AMT'),v:ix('VAT AMT'),q:ix('SALE QTY'),r:ix('RQTY')};
  const map=new Map();let lines=0,skipped=0,min=null,max=null;const names={};
  for(let k=hi+1;k<rows.length;k++){const r=rows[k];if(!r||r[c.i]==null)continue;lines++;
    const m=String(r[c.e]||'').match(/^\s*(\d{5,7})\s*-\s*(.*)$/);const d=toISO(r[c.d]);if(!m||!d){skipped++;continue}
    const id=m[1];names[id]=tcase(m[2]);const key=r[c.i]+'|'+id+'|'+d;let o=map.get(key);if(!o){o={id,d,net:0,ex:0,gross:0,q:0};map.set(key,o)}
    const net=+r[c.n]||0,vat=+r[c.v]||0;o.net+=net;o.ex+=net-vat;o.gross+=+r[c.t]||0;o.q+=(+r[c.q]||0)-(+r[c.r]||0);
    if(!min||d<min)min=d;if(!max||d>max)max=d;}
  const out=[...map.values()].map(o=>[o.id,o.d,+o.net.toFixed(1),+o.ex.toFixed(1),+o.gross.toFixed(1),Math.round(o.q)]);
  if(!out.length)throw new Error('No usable invoice lines were found in this file.');
  const bi=basisIdx();return {lines,rows:out,min,max,emps:new Set(out.map(r=>r[0])).size,total:out.reduce((a,r)=>a+r[bi],0),skipped,names};
}
async function parseTarget(file){
  const rows=await sheetRows(file);const hi=rows.findIndex(r=>r&&r.some(c=>String(c||'').trim().toLowerCase()==='employee id'));
  const oi=rows.findIndex(r=>r&&String(r[0]||'').toUpperCase().startsWith('OFFICIAL PER DAY'));
  if(hi<0||oi<0)throw new Error('This does not look like the Employee Wise Sales Target file (header row or OFFICIAL PER DAY TOTAL TARGET row not found).');
  const H=rows[hi];const cols=[];H.forEach((v,i)=>{if(i>=20&&typeof v==='number'&&v>40000)cols.push([i,serialToISO(v)])});
  const days={},official=rows[oi];let total=0;
  cols.forEach(([i,d])=>{const v=+official[i];if(v>0){const m=mk(d);(days[m]||(days[m]={}))[+d.slice(8)]=v;total+=v}});
  const months=Object.keys(days).sort();const staff={},wsum={};const monthTot={};months.forEach(m=>monthTot[m]=Object.values(days[m]).reduce((a,b)=>a+b,0));
  const ci=n=>H.findIndex(h=>String(h||'').trim().toLowerCase()===n);
  const ix={id:ci('employee id'),name:ci('employee name'),des:ci('designation'),div:ci('division'),off:ci('day off'),st:ci('status'),jn:ci('joining'),rs:ci('resign')};
  for(let k=hi+1;k<rows.length;k++){const r=rows[k];const id=r&&Math.round(+r[ix.id]);if(!id||isNaN(id))continue;const sid=String(id);
    staff[sid]={id:sid,name:tcase(r[ix.name]),designation:r[ix.des]||'',section:r[ix.div]||'',dayOff:r[ix.off]||'',status:r[ix.st]||'Continue',joining:toISO(r[ix.jn])||'',resign:toISO(r[ix.rs])||''};
    const w={};cols.forEach(([i,d])=>{const m=mk(d);if(days[m]&&days[m][+d.slice(8)])w[m]=(w[m]||0)+(+r[i]||0)});wsum[sid]=w}
  const weights={};months.forEach(m=>{weights[m]={};for(const id in wsum){const p=monthTot[m]?(wsum[id][m]||0)/monthTot[m]*100:0;if(p>0)weights[m][id]=Math.round(p*100)/100}});
  return {days,months,weights,staff:Object.keys(staff).length,staffRecs:staff,total:Object.values(monthTot).reduce((a,b)=>a+b,0),daysN:Object.values(days).reduce((a,o)=>a+Object.keys(o).length,0)};
}
async function handleFile(kind,file){
  if(!file)return;S.upload={kind,busy:'Reading '+file.name+'…'};schedule();
  try{const res=kind==='sales'?await parseSales(file):await parseTarget(file);S.upload={kind,res,name:file.name}}
  catch(e){S.upload={kind,error:e.message||'Could not read this file.'}}
  if(kind==='target'&&S.view!=='targets')S.view='targets';schedule();
}
async function saveSales(){
  const u=S.upload;if(!u||!u.res)return;const r=u.res;S.busy='Saving…';
  await guard(async()=>{
    const byM={};r.rows.forEach(x=>(byM[x[1].slice(0,7)]||(byM[x[1].slice(0,7)]=[])).push([x[0],+x[1].slice(8),x[2],x[3],x[4],x[5]]));
    const meta=JSON.parse(JSON.stringify(S.meta||{months:{}}));meta.months=meta.months||{};
    for(const m of Object.keys(byM).sort()){
      u.busy=`Saving ${monthLabel(m)}…`;schedule();
      const old=Object.entries(S.parts).filter(([id,p])=>p.month===m);
      const keep=[];old.forEach(([id,p])=>(p.rows||[]).forEach(x=>{const d=m+'-'+pad(x[1]);if(d<r.min||d>r.max)keep.push(x)}));
      const all=keep.concat(byM[m]).sort((a,b)=>a[1]-b[1]);const N=2200;const n=Math.max(1,Math.ceil(all.length/N));
      for(let i=0;i<n;i++)await S.db.doc(`salesParts/${m}_p${pad(i+1)}`).set({month:m,rows:all.slice(i*N,(i+1)*N)});
      for(const [id] of old){const k=+id.split('_p')[1];if(k>n)await S.db.doc('salesParts/'+id).delete()}
      meta.months[m]={parts:n,rows:all.length};
    }
    meta.lastDate=(!meta.lastDate||r.max>meta.lastDate)?r.max:meta.lastDate;meta.firstDate=(!meta.firstDate||r.min<meta.firstDate)?r.min:meta.firstDate;
    meta.source=u.name||'upload';meta.uploadedAt=new Date().toISOString();meta.names=Object.assign({},meta.names||{});for(const id in r.names)if(!S.staff[id])meta.names[id]=r.names[id];
    await S.db.doc('salesMeta/main').set(meta);
  },'Sales saved. Every employee now sees the update.');
  S.busy=null;S.upload=null;schedule();
}
async function saveTargets(){
  const u=S.upload;if(!u||!u.res)return;const r=u.res;const useDays=$('#tu-days').checked,useW=$('#tu-w').checked,addSt=$('#tu-st').checked,from=($('#tu-from')||{}).value||'';
  S.busy='Saving…';
  await guard(async()=>{
    for(const m of r.months){const cur=S.targets[m]||{days:{},weights:{}};
      let doc=Object.assign({},cur,{days:useDays?r.days[m]:(cur.days||{})});if(useW)doc=withWeights(doc,m,r.weights[m],from);await S.db.doc('targets/'+m).set(doc)}
    if(addSt){for(const id in r.staffRecs)if(!S.staff[id]){const s=r.staffRecs[id];const code=String(Math.floor(100000+Math.random()*900000));await S.db.doc('staff/'+id).set(Object.assign({},s,{codeHash:await sha(cfg().salt+id+':'+code)}));await setCode(id,code)}}
  },'Targets saved.');
  S.busy=null;S.upload=null;schedule();
}
async function setCode(id,code){const map=Object.assign({},S.codes);map[id]=code;S.codes=map;await S.db.doc('codes/main').set({map})}

/* ============ seed ============ */
async function runSeed(){
  S.busy='Loading starter data…';schedule();
  const ok=await guard(async()=>{
    const r=await fetch('data/seed.json');if(!r.ok)throw new Error('The starter data file could not be loaded.');const seed=await r.json();
    const ids=Object.keys(seed.staff);let i=0;const codes=Object.assign({},S.codes);
    for(const id of ids){S.busy=`Staff ${++i}/${ids.length}…`;schedule();const code=codes[id]||String(Math.floor(100000+Math.random()*900000));codes[id]=code;
      await S.db.doc('staff/'+id).set(Object.assign({},seed.staff[id],{codeHash:await sha(cfg().salt+id+':'+code)}))}
    S.codes=codes;await S.db.doc('codes/main').set({map:codes});
    for(const m of Object.keys(seed.targets)){S.busy='Targets '+m+'…';schedule();await S.db.doc('targets/'+m).set(seed.targets[m])}
    const pids=Object.keys(seed.salesParts);i=0;for(const id of pids){S.busy=`Sales ${++i}/${pids.length}…`;schedule();await S.db.doc('salesParts/'+id).set(seed.salesParts[id])}
    await S.db.doc('salesMeta/main').set(Object.assign({},seed.salesMeta,{uploadedAt:new Date().toISOString()}));
    return true;
  },'Starter data loaded.');
  S.busy=null;schedule();return ok;
}

/* ============ photo ============ */
function resizePhoto(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const M=260,k=Math.min(1,M/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',0.82))};im.onerror=()=>rej(new Error('That image could not be read.'));im.src=fr.result};fr.onerror=()=>rej(new Error('That image could not be read.'));fr.readAsDataURL(file)})}
const val$=id=>{const e=document.getElementById(id);return e?e.value.trim():''};
function readStaffForm(){const g=val$;return {name:tcase(g('sd-name')),id:g('sd-id'),designation:g('sd-designation'),section:g('sd-section'),joining:g('sd-joining'),status:g('sd-status')||'Continue',resign:g('sd-resign'),dayOff:g('sd-dayOff'),emptype:g('sd-emptype'),prevexp:g('sd-prevexp'),mobile:g('sd-mobile'),email:g('sd-email'),dob:g('sd-dob'),blood:g('sd-blood'),access:g('sd-access')||'Allowed',emergency:g('sd-emergency'),education:g('sd-education'),address:g('sd-address'),notes:g('sd-notes')}}

/* ============ downloads ============ */
async function saveFile(name,data){
  if(!S.dl){toast('Downloads are not available.',true);return}
  try{await S.dl.save({filename:name,data});toast('Saved '+name)}catch(e){if(e&&e.code==='declined')return;toast((e&&e.message)||'Download failed.',true)}
}
const stamp=()=>`${S.period.from}_to_${clipTo(S.period.to)}`;

/* ============ actions ============ */
const A={
  async syncNow(){const ch=await syncSales(true);toast(S.syncErr?S.syncErr:ch?'New sales loaded.':'Already up to date.',!!S.syncErr)},
  nav(a){S.view=a;S.drawer=null;S.hscroll={};if(a==='targets'){S.draftW=null}schedule()},
  empnav(a,el){S.empTab=a;S.justSent=null;S.hscroll={};if(el.dataset.req)S.reqPick=el.dataset.req;schedule()},
  period(a){setPeriod(a)},
  tgtLeft(){S.tgtShowLeft=!S.tgtShowLeft;schedule()},
  unToggle(){S.unOpen=!S.unOpen;schedule()},
  async delExpl(a){const x=S.explanations.find(e=>e.id===a);if(!x)return;
    if(!confirm(lang()==='bn'?'এই জবাবদিহিতা স্থায়ীভাবে মুছে ফেলবেন? এটি আর ফেরত আনা যাবে না।':'Delete this explanation permanently? This cannot be undone.'))return;
    const items=S.explanations.filter(e=>e._uid===x._uid&&e.id!==a).map(e=>{const c=Object.assign({},e);delete c._uid;return c});
    const ref=S.db.doc('explanations/'+x._uid);await guard(()=>items.length?ref.set({items}):ref.delete(),'Explanation deleted.');S.modal=null;schedule()},
  applyCustom(){const f=val$('pf'),t=val$('pt');if(!f||!t||f>t){toast('Choose a valid date range.',true);return}S.period={key:'custom',from:f,to:t};schedule()},
  loginTab(a){S.loginTab=a;schedule()},
  async loginEmp(){const id=val$('l-id'),code=val$('l-code');const st=S.staff[id];
    if(!cfg().staffOpen){toast('Employee access is paused by management.',true);return}
    if(st&&!canLogin(st)){toast('Your access has been closed. Please contact your in-charge.',true);return}
    if(!st||!st.codeHash||(await sha(cfg().salt+id+':'+code))!==st.codeHash){toast('ID or access code is not correct.',true);return}
    S.role='emp';S.empId=id;S.empTab='home';S.hscroll={};ssSet('sess',JSON.stringify({role:'emp',empId:id}));setPeriod('month',true);schedule()},
  async loginAdmin(){const pw=val$('l-pw');if((await sha(cfg().salt+'admin:'+pw))!==cfg().adminHash){toast('Password is not correct.',true);return}
    S.role='admin';S.view='overview';ssSet('sess',JSON.stringify({role:'admin'}));schedule()},
  async ownerSetPw(){const n=val$('l-new');if(n.length<6){toast('Use at least 6 characters.',true);return}if(!S.isOwner)return;await guard(async()=>S.db.doc('config/main').set(Object.assign({},S.cfg,{adminHash:await sha(cfg().salt+'admin:'+n)})),'Password reset.');S.role='admin';S.view='overview';ssSet('sess',JSON.stringify({role:'admin'}));schedule()},
  logout(){S.role=null;S.empId=null;S.drawer=null;S.modal=null;ssSet('sess',null);schedule()},
  async doSetup(){const o=val$('su-outlet'),p=val$('su-pw'),p2=val$('su-pw2'),seed=$('#su-seed').checked;
    if(p.length<6){toast('Use at least 6 characters for the password.',true);return}if(p!==p2){toast('The two passwords are different.',true);return}
    const salt=uid()+uid();S.busy='Creating…';schedule();
    const ok=await guard(async()=>{const c=Object.assign({},DEFAULT_CFG,{outlet:o||'My Outlet',salt,adminHash:await sha(salt+'admin:'+p),createdAt:new Date().toISOString()});await S.db.doc('config/main').set(c);S.cfg=c;S.cfgLoaded=true;return true});
    S.busy=null;if(!ok){schedule();return}
    if(seed)await runSeed();S.role='admin';S.view=seed?'overview':'team';ssSet('sess',JSON.stringify({role:'admin'}));schedule()},
  sort(a){S.sort=S.sort.k===a?{k:a,dir:-S.sort.dir}:{k:a,dir:1};schedule()},
  profile(a,el){openProfile(a,el.dataset.tab||'perf')},
  closeDrawer(){S.drawer=null;schedule()},
  dtab(a){S.drawer.tab=a;schedule()},
  addStaff(a){S.drawer={emp:'new',tab:'details',draft:{id:a&&a!=='undefined'?a:'',name:a&&S.meta&&S.meta.names?S.meta.names[a]||'':'',status:'Continue',joining:S.asOf}};schedule()},
  pickPhoto(){$('#sd-photo').click()},
  clearPhoto(){S.drawer.formDraft=readStaffForm();S.drawer.photo='';schedule()},
  async saveStaff(a){const f=readStaffForm();if(!f.name||!/^\d{3,8}$/.test(f.id)){toast('Enter a name and a numeric employee ID.',true);return}
    if(a==='new'&&S.staff[f.id]){toast('An employee with this ID already exists.',true);return}
    const cur=a==='new'?{}:S.staff[a];const photo=S.drawer.photo!==undefined?S.drawer.photo:cur.photo||'';
    const rec=Object.assign({},cur,f,{photo});if(!photo)delete rec.photo;
    await guard(async()=>{
      if(a==='new'){const code=String(Math.floor(100000+Math.random()*900000));rec.codeHash=await sha(cfg().salt+f.id+':'+code);await S.db.doc('staff/'+f.id).set(rec);await setCode(f.id,code)}
      else await S.db.doc('staff/'+a).set(rec)},'Profile saved.');
    S.drawer=a==='new'?{emp:f.id,tab:'perf'}:Object.assign(S.drawer,{photo:undefined});schedule()},
  tgtMonth(a){S.tgtMonth=a;S.draftW=null;schedule()},
  async saveDays(){const days={};$$('.di').forEach(i=>{const v=+i.value;if(v>0)days[i.dataset.day]=v});const m=S.tgtMonth;const cur=S.targets[m]||{};
    await guard(()=>S.db.doc('targets/'+m).set(Object.assign({},cur,{days})),'Daily targets saved.')},
  applySuggest(){const m=S.tgtMonth;const w={};suggestWeights(m).forEach(r=>w[r.id]=r.pct);S.draftW={m,w};schedule()},
  copyPrev(a){const p=S.targets[a];if(!p||!Object.keys(latestW(p)).length){toast('That month has no shares to copy.',true);return}S.draftW={m:S.tgtMonth,w:Object.assign({},latestW(p))};schedule()},
  normW(){const w=currentW();const t=Object.values(w).reduce((a,b)=>a+(+b||0),0)||1;const o={};for(const k in w)o[k]=Math.round(w[k]/t*1000)/10;S.draftW={m:S.tgtMonth,w:o};schedule()},
  async saveW(){const w={};const cw=currentW();for(const k in cw)if(+cw[k]>0)w[k]=+cw[k];const m=S.tgtMonth;const cur=S.targets[m]||{};
    const from=val$('w-from');await guard(()=>S.db.doc('targets/'+m).set(withWeights(cur,m,w,from)),from&&from>m+'-01'?'Shares saved from '+dLabelY(from)+'. Earlier days keep their old shares.':'Shares saved. Daily targets updated for everyone.');S.draftW=null;schedule()},
  async rmWv(a){const m=S.tgtMonth;const cur=S.targets[m]||{};await guard(()=>S.db.doc('targets/'+m).set(Object.assign({},cur,{wv:(cur.wv||[]).filter(x=>x.from!==a)})),'Share change removed.')},
  openUpload(a){S.upload=null;pickFile(a)},
  pick(a){pickFile(a)},
  saveSales,saveTargets,
  cancelUpload(){S.upload=null;schedule()},
  bbmode(a){S.bb.mode=a;schedule()},
  wlToggle(a){S.wlOpen[a]=!S.wlOpen[a];schedule()},
  askExpl(a){S.modal={kind:'ask',emp:a};schedule()},
  closeModal(){S.modal=null;schedule()},
  async sendAsk(a){const msg=val$('rq-msg'),due=val$('rq-due');if(!msg){toast('Write the question first.',true);return}
    await guard(()=>S.db.doc('requests/'+uid()).set({empId:a,message:msg,due,createdAt:new Date().toISOString()}),'Request sent. The employee will see it when they sign in.');S.modal=null;schedule()},
  editExpl(a){S.modal={kind:'expl',id:a};schedule()},
  async saveExpl(a){const x=S.explanations.find(e=>e.id===a);const doc=S.explanations.filter(e=>e._uid===x._uid);
    const items=doc.map(e=>{const c=Object.assign({},e);delete c._uid;if(e.id===a){c.detail=val$('ex-detail');c.plan=val$('ex-plan');c.adminNote=val$('ex-note');c.status=val$('ex-status');c.edited=true}return c});
    await guard(()=>S.db.doc('explanations/'+x._uid).set({items}),'Saved.');S.modal=null;schedule()},
  async exportExpl(){await guard(async()=>{const b=await buildExplXlsx();await saveFile(`Explanations_${todayISO()}.xlsx`,b)})},
  async exportXlsx(){S.busy='x';schedule();await guard(async()=>{const b=await buildXlsx();await saveFile(`${S.rep.title.replace(/\W+/g,'_')}_${stamp()}.xlsx`,b)});S.busy=null;schedule()},
  async exportPdf(){S.busy='x';schedule();await guard(async()=>{const b=await buildPdf();await saveFile(`${S.rep.title.replace(/\W+/g,'_')}_${stamp()}.pdf`,b)});S.busy=null;schedule()},
  async saveCfg(){const c=Object.assign({},S.cfg,{outlet:val$('s-outlet')||cfg().outlet,basis:val$('s-basis'),poorBelow:+val$('s-poor')||80});await guard(()=>S.db.doc('config/main').set(c),'Settings saved.')},
  async saveVis(){const sees={};['rank','eval','days','big','bill','outlet','board','bbtab','guide','reports'].forEach(k=>sees[k]=$('#vis-'+k).checked);const c=Object.assign({},S.cfg,{staffSees:sees,staffOpen:$('#vis-open').checked});await guard(()=>S.db.doc('config/main').set(c),'Employee view saved.')},
  async setLang(a){setLang(a)},
  async saveLang(){const c=Object.assign({},S.cfg,{lang:val$('s-lang')||'en'});try{localStorage.setItem('ph.lang',c.lang)}catch(e){}await guard(()=>S.db.doc('config/main').set(c),'Default language saved.')},
  async changePw(){const o=val$('pw-old'),n=val$('pw-new');if(n.length<6){toast('Use at least 6 characters.',true);return}
    if((await sha(cfg().salt+'admin:'+o))!==cfg().adminHash){toast('The current password is not correct.',true);return}
    await guard(async()=>S.db.doc('config/main').set(Object.assign({},S.cfg,{adminHash:await sha(cfg().salt+'admin:'+n)})),'Password changed.')},
  addDesig(){const v=val$('dw-new');if(!v)return;const c=cfg();S.cfg=Object.assign({},S.cfg,{desigWeights:Object.assign({},c.desigWeights,{[v.toUpperCase()]:3})});schedule()},
  async saveDesig(){const w={};$$('.dwi').forEach(i=>w[i.dataset.k]=+i.value||0);await guard(()=>S.db.doc('config/main').set(Object.assign({},S.cfg,{desigWeights:w})),'Saved.')},
  addSec(){const v=val$('sf-new');if(!v)return;const c=cfg();S.cfg=Object.assign({},S.cfg,{sectionFactors:Object.assign({},c.sectionFactors,{[v.toUpperCase()]:1})});schedule()},
  async saveSec(){const w={};$$('.sfi').forEach(i=>w[i.dataset.k]=+i.value||0);await guard(()=>S.db.doc('config/main').set(Object.assign({},S.cfg,{sectionFactors:w})),'Saved.')},
  async genMissing(){await guard(async()=>{for(const s of staffList().filter(isActiveNow))if(!S.codes[s.id]){const c=String(Math.floor(100000+Math.random()*900000));await S.db.doc('staff/'+s.id).set(Object.assign({},s,{codeHash:await sha(cfg().salt+s.id+':'+c)}));await setCode(s.id,c)}},'Codes created.');schedule()},
  async resetCode(a){await guard(async()=>{const s=S.staff[a];const c=String(Math.floor(100000+Math.random()*900000));await S.db.doc('staff/'+a).set(Object.assign({},s,{codeHash:await sha(cfg().salt+a+':'+c)}));await setCode(a,c);toast('New code for '+s.name+': '+c)});schedule()},
  seed(){runSeed()},
  async saveFollow(a){const topic=val$('fu-topic');if(!topic){toast('Write what was discussed.',true);return}const m=empMetrics(a,mk(S.asOf)+'-01',S.asOf);
    await guard(()=>S.db.doc('followups/'+uid()).set({empId:a,date:val$('fu-date')||todayISO(),next:val$('fu-next'),topic,commit:val$('fu-commit'),at:true,atPct:m.pct==null?'–':Math.round(m.pct),createdAt:new Date().toISOString()}),'Note saved.')},
  async submitExpl(a,el){const detail=val$('xp-detail');if(detail.length<10){toast('Please explain in a little more detail.',true);return}
    const item={id:uid(),empId:S.empId,from:val$('xp-from'),to:val$('xp-to'),reasons:$$('.xr:checked').map(i=>i.value),detail,plan:val$('xp-plan'),reqId:el.dataset.req||'',status:'open',createdAt:new Date().toISOString()};
    await guard(async()=>{const me=S.empId;const ref=S.db.doc('explanations/'+me);const cur=await ref.get();const items=cur.exists?(cur.data().items||[]):[];items.push(item);await ref.set({items})});
    if(!S.busy){S.justSent=item.id.slice(-6).toUpperCase()}schedule()}
};
function currentW(){const m=S.tgtMonth;const base=S.draftW&&S.draftW.m===m?S.draftW.w:Object.assign({},latestW(S.targets[m]||{}));return Object.assign({},base)}
function pickFile(kind){const inp=document.createElement('input');inp.type='file';inp.accept='.xlsx,.xls,.csv';inp.onchange=()=>handleFile(kind,inp.files[0]);inp.click()}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;const act=el.dataset.act;
  if((act==='closeDrawer'||act==='closeModal')&&el.classList.contains('ov')&&e.target!==el)return;
  if(act==='pick'&&el.id==='dz-sales'){}
  const fn=A[act];if(fn){e.stopPropagation();fn(el.dataset.arg,el)}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('tr[data-act]'))e.target.click();if(e.key==='Escape'){if(S.modal){S.modal=null;schedule()}else if(S.drawer){S.drawer=null;schedule()}}
  if(e.key==='Enter'&&e.target.id==='l-code')A.loginEmp();if(e.key==='Enter'&&e.target.id==='l-pw')A.loginAdmin()});
document.addEventListener('change',async e=>{
  const t=e.target,id=t.id;
  if(id==='tq'){S.filter.q=t.value;schedule()}else if(id==='tsec'){S.filter.section=t.value;schedule()}else if(id==='tst'){S.filter.status=t.value;schedule()}
  else if(id==='tmsel'){S.tgtMonth=t.value;S.draftW=null;schedule()}
  else if(t.classList.contains('wi')){const w=currentW();w[t.dataset.emp]=+t.value||0;S.draftW={m:S.tgtMonth,w};schedule()}
  else if(id==='ef-emp'){S.explFilter.emp=t.value;schedule()}else if(id==='ef-st'){S.explFilter.status=t.value;schedule()}
  else if(id==='rp-title'){S.rep.title=t.value}else if(id==='rp-sec'){S.rep.section=t.value;schedule()}
  else if(t.dataset.rep){S.rep.cols[t.dataset.rep]=t.checked;schedule()}
  else if(t.dataset.repg){S.rep.groups=Object.assign({},S.rep.groups,{[t.dataset.repg]:t.checked});schedule()}
  else if(id==='sd-photo'&&t.files[0]){try{const d=await resizePhoto(t.files[0]);S.drawer.formDraft=readStaffForm();S.drawer.photo=d;schedule()}catch(err){toast(err.message,true)}}
});
['dragover','dragleave','drop'].forEach(ev=>document.addEventListener(ev,e=>{const dz=e.target.closest&&e.target.closest('#dz-sales');if(!dz)return;e.preventDefault();dz.classList.toggle('over',ev==='dragover');if(ev==='drop'){dz.classList.remove('over');handleFile('sales',e.dataTransfer.files[0])}}));

/* ============ boot ============ */
function derive(){S.requests.forEach(r=>r.status=S.explanations.some(x=>x.reqId===r.id)?'answered':'open')}
async function boot(){
  render();
  const use=window.claude&&window.claude.use?window.claude.use.bind(window.claude):async()=>null;
  S.db=await use('db');S.user=await use('user');S.dl=await use('downloads');S.ready=true;startSalesSync();
  if(!S.db){render();return}
  try{S.canEdit=(await S.user?.canEdit())??false;S.isOwner=(await S.user?.isOwner())??false}catch(e){}
  const slow=setTimeout(()=>{if(!S.cfgLoaded){S.loadErr='The data store is slow to answer. Still trying…';render()}},10000);
  const err=e=>{console.error(e);S.loadErr=dbErr(e);schedule()};
  S.db.doc('config/main').onSnapshot(s=>{clearTimeout(slow);S.cfg=s.exists?s.data():null;S.cfgLoaded=true;if(S.cfg)restore();rebuild();schedule()},err);
  S.db.collection('staff').onSnapshot(q=>{S.staff={};q.docs.forEach(d=>S.staff[d.id]=d.data());S.ver++;rebuild();schedule()},err);
  S.db.collection('targets').onSnapshot(q=>{S.targets={};q.docs.forEach(d=>S.targets[d.id]=d.data());rebuild();schedule()},err);
  S.db.collection('salesParts').onSnapshot(q=>{if(S.remote)return;S.parts={};q.docs.forEach(d=>S.parts[d.id]=d.data());rebuild();schedule()},err);
  S.db.doc('salesMeta/main').onSnapshot(s=>{if(S.remote)return;S.meta=s.exists?s.data():null;rebuild();schedule()},err);
  S.db.doc('codes/main').onSnapshot(s=>{S.codes=s.exists?(s.data().map||{}):{};schedule()},()=>{});
  S.db.collection('followups').onSnapshot(q=>{S.followups=q.docs.map(d=>Object.assign({id:d.id},d.data()));schedule()},()=>{});
  S.db.collection('requests').onSnapshot(q=>{S.requests=q.docs.map(d=>Object.assign({id:d.id},d.data()));derive();schedule()},()=>{});
  S.db.collection('explanations').onSnapshot(q=>{S.explanations=[];q.docs.forEach(d=>(d.data().items||[]).forEach(it=>S.explanations.push(Object.assign({_uid:d.id},it))));derive();schedule()},()=>{});
}
let restored=false;
function restore(){if(restored)return;restored=true;try{const s=JSON.parse(ssGet('sess')||'null');if(s&&s.role==='admin'){S.role='admin'}else if(s&&s.role==='emp'){S.role='emp';S.empId=s.empId}}catch(e){}}
